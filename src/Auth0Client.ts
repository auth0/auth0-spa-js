import Lock from 'browser-tabs-lock';

import {
  createQueryParams,
  runPopup,
  parseAuthenticationResult,
  encode,
  createRandomString,
  runIframe,
  sha256,
  bufferToBase64UrlEncoded,
  validateCrypto,
  openPopup,
  getDomain,
  getTokenIssuer,
  parseNumber
} from './utils';

import { oauthToken } from './api';

import { getUniqueScopes } from './scope';

import {
  InMemoryCache,
  ICache,
  CacheKey,
  CacheManager,
  CacheEntry,
  IdTokenEntry,
  CACHE_KEY_ID_TOKEN_SUFFIX,
  DecodedToken
} from './cache';

import { TransactionManager } from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import {
  AuthenticationError,
  GenericError,
  MissingRefreshTokenError,
  TimeoutError
} from './errors';

import {
  ClientStorage,
  CookieStorage,
  CookieStorageWithLegacySameSite,
  SessionStorage
} from './storage';

import {
  CACHE_LOCATION_MEMORY,
  DEFAULT_POPUP_CONFIG_OPTIONS,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
  MISSING_REFRESH_TOKEN_ERROR_MESSAGE,
  DEFAULT_SCOPE,
  DEFAULT_SESSION_CHECK_EXPIRY_DAYS,
  DEFAULT_AUTH0_CLIENT,
  INVALID_REFRESH_TOKEN_ERROR_MESSAGE,
  DEFAULT_NOW_PROVIDER,
  DEFAULT_FETCH_TIMEOUT_MS
} from './constants';

import {
  Auth0ClientOptions,
  AuthorizationParams,
  AuthorizeOptions,
  RedirectLoginOptions,
  PopupLoginOptions,
  PopupConfigOptions,
  RedirectLoginResult,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
  LogoutOptions,
  CacheLocation,
  LogoutUrlOptions,
  User,
  IdToken,
  GetTokenSilentlyVerboseResponse,
  TokenEndpointResponse
} from './global';

// @ts-ignore
import TokenWorker from './worker/token.worker.ts';
import { singlePromise, retryPromise } from './promise-utils';
import { CacheKeyManifest } from './cache/key-manifest';
import {
  buildIsAuthenticatedCookieName,
  buildOrganizationHintCookieName,
  cacheFactory,
  getAuthorizeParams,
  GET_TOKEN_SILENTLY_LOCK_KEY,
  OLD_IS_AUTHENTICATED_COOKIE_NAME,
  patchOpenUrlWithOnRedirect
} from './Auth0Client.utils';

/**
 * @ignore
 */
type GetTokenSilentlyResult = TokenEndpointResponse & {
  decodedToken: ReturnType<typeof verifyIdToken>;
  scope: string;
  oauthTokenScope?: string;
  audience: string;
};

/**
 * @ignore
 */
const lock = new Lock();

/**
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
export class Auth0Client {
  private readonly transactionManager: TransactionManager;
  private readonly cacheManager: CacheManager;
  private readonly domainUrl: string;
  private readonly tokenIssuer: string;
  private readonly scope: string;
  private readonly cookieStorage: ClientStorage;
  private readonly sessionCheckExpiryDays: number;
  private readonly orgHintCookieName: string;
  private readonly isAuthenticatedCookieName: string;
  private readonly nowProvider: () => number | Promise<number>;
  private readonly httpTimeoutMs: number;
  private readonly options: Auth0ClientOptions & {
    authorizationParams: AuthorizationParams;
  };
  private readonly userCache: ICache = new InMemoryCache().enclosedCache;

  private worker?: Worker;

  private readonly defaultOptions: Partial<Auth0ClientOptions> = {
    authorizationParams: {
      scope: DEFAULT_SCOPE
    },
    useRefreshTokensFallback: false,
    useFormData: true
  };

  constructor(options: Auth0ClientOptions) {
    this.options = {
      ...this.defaultOptions,
      ...options,
      authorizationParams: {
        ...this.defaultOptions.authorizationParams,
        ...options.authorizationParams
      }
    };

    typeof window !== 'undefined' && validateCrypto();

    if (options.cache && options.cacheLocation) {
      console.warn(
        'Both `cache` and `cacheLocation` options have been specified in the Auth0Client configuration; ignoring `cacheLocation` and using `cache`.'
      );
    }

    let cacheLocation: CacheLocation | undefined;
    let cache: ICache;

    if (options.cache) {
      cache = options.cache;
    } else {
      cacheLocation = options.cacheLocation || CACHE_LOCATION_MEMORY;

      if (!cacheFactory(cacheLocation)) {
        throw new Error(`Invalid cache location "${cacheLocation}"`);
      }

      cache = cacheFactory(cacheLocation)();
    }

    this.httpTimeoutMs = options.httpTimeoutInSeconds
      ? options.httpTimeoutInSeconds * 1000
      : DEFAULT_FETCH_TIMEOUT_MS;

    this.cookieStorage =
      options.legacySameSiteCookie === false
        ? CookieStorage
        : CookieStorageWithLegacySameSite;

    this.orgHintCookieName = buildOrganizationHintCookieName(
      this.options.clientId
    );

    this.isAuthenticatedCookieName = buildIsAuthenticatedCookieName(
      this.options.clientId
    );

    this.sessionCheckExpiryDays =
      options.sessionCheckExpiryDays || DEFAULT_SESSION_CHECK_EXPIRY_DAYS;

    const transactionStorage = options.useCookiesForTransactions
      ? this.cookieStorage
      : SessionStorage;

    // Construct the scopes based on the following:
    // 1. Always include `openid`
    // 2. Include the scopes provided in `authorizationParams. This defaults to `profile email`
    // 3. Add `offline_access` if `useRefreshTokens` is enabled
    this.scope = getUniqueScopes(
      'openid',
      this.options.authorizationParams.scope,
      this.options.useRefreshTokens ? 'offline_access' : ''
    );

    this.transactionManager = new TransactionManager(
      transactionStorage,
      this.options.clientId,
      this.options.cookieDomain,
    );

    this.nowProvider = this.options.nowProvider || DEFAULT_NOW_PROVIDER;

    this.cacheManager = new CacheManager(
      cache,
      !cache.allKeys
        ? new CacheKeyManifest(cache, this.options.clientId)
        : undefined,
      this.nowProvider
    );

    this.domainUrl = getDomain(this.options.domain);
    this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);

    // Don't use web workers unless using refresh tokens in memory
    if (
      typeof window !== 'undefined' &&
      window.Worker &&
      this.options.useRefreshTokens &&
      cacheLocation === CACHE_LOCATION_MEMORY
    ) {
      this.worker = new TokenWorker();
    }
  }

  private _url(path: string) {
    const auth0Client = encodeURIComponent(
      btoa(JSON.stringify(this.options.auth0Client || DEFAULT_AUTH0_CLIENT))
    );
    return `${this.domainUrl}${path}&auth0Client=${auth0Client}`;
  }

  private _authorizeUrl(authorizeOptions: AuthorizeOptions) {
    return this._url(`/authorize?${createQueryParams(authorizeOptions)}`);
  }

  private async _verifyIdToken(
    id_token: string,
    nonce?: string,
    organizationId?: string
  ) {
    const now = await this.nowProvider();

    return verifyIdToken({
      iss: this.tokenIssuer,
      aud: this.options.clientId,
      id_token,
      nonce,
      organizationId,
      leeway: this.options.leeway,
      max_age: parseNumber(this.options.authorizationParams.max_age),
      now
    });
  }

  private _processOrgIdHint(organizationId?: string) {
    if (organizationId) {
      this.cookieStorage.save(this.orgHintCookieName, organizationId, {
        daysUntilExpire: this.sessionCheckExpiryDays,
        cookieDomain: this.options.cookieDomain
      });
    } else {
      this.cookieStorage.remove(this.orgHintCookieName, {
        cookieDomain: this.options.cookieDomain
      });
    }
  }

  private async _prepareAuthorizeUrl(
    authorizationParams: AuthorizationParams,
    authorizeOptions?: Partial<AuthorizeOptions>,
    fallbackRedirectUri?: string
  ): Promise<{
    scope: string;
    audience: string;
    redirect_uri?: string;
    nonce: string;
    code_verifier: string;
    state: string;
    url: string;
  }> {
    const state = encode(createRandomString());
    const nonce = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

    const params = getAuthorizeParams(
      this.options,
      this.scope,
      authorizationParams,
      state,
      nonce,
      code_challenge,
      authorizationParams.redirect_uri ||
        this.options.authorizationParams.redirect_uri ||
        fallbackRedirectUri,
      authorizeOptions?.response_mode
    );

    const url = this._authorizeUrl(params);

    return {
      nonce,
      code_verifier,
      scope: params.scope,
      audience: params.audience || 'default',
      redirect_uri: params.redirect_uri,
      state,
      url
    };
  }

  /**
   * ```js
   * try {
   *  await auth0.loginWithPopup(options);
   * } catch(e) {
   *  if (e instanceof PopupCancelledError) {
   *    // Popup was closed before login completed
   *  }
   * }
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   *
   * @param options
   * @param config
   */
  public async loginWithPopup(
    options?: PopupLoginOptions,
    config?: PopupConfigOptions
  ) {
    options = options || {};
    config = config || {};

    if (!config.popup) {
      config.popup = openPopup('');

      if (!config.popup) {
        throw new Error(
          'Unable to open a popup for loginWithPopup - window.open returned `null`'
        );
      }
    }

    const params = await this._prepareAuthorizeUrl(
      options.authorizationParams || {},
      { response_mode: 'web_message' },
      window.location.origin
    );

    config.popup.location.href = params.url;

    const codeResult = await runPopup({
      ...config,
      timeoutInSeconds:
        config.timeoutInSeconds ||
        this.options.authorizeTimeoutInSeconds ||
        DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
    });

    if (params.state !== codeResult.state) {
      throw new GenericError('state_mismatch', 'Invalid state');
    }

    const organizationId =
      options.authorizationParams?.organization ||
      this.options.authorizationParams.organization;

    await this._requestToken(
      {
        audience: params.audience,
        scope: params.scope,
        code_verifier: params.code_verifier,
        grant_type: 'authorization_code',
        code: codeResult.code as string,
        redirect_uri: params.redirect_uri
      },
      {
        nonceIn: params.nonce,
        organizationId
      }
    );
  }

  /**
   * ```js
   * const user = await auth0.getUser();
   * ```
   *
   * Returns the user information if available (decoded
   * from the `id_token`).
   *
   * @typeparam TUser The type to return, has to extend {@link User}.
   */
  public async getUser<TUser extends User>(): Promise<TUser | undefined> {
    const cache = await this._getIdTokenFromCache();

    return cache?.decodedToken?.user as TUser;
  }

  /**
   * ```js
   * const claims = await auth0.getIdTokenClaims();
   * ```
   *
   * Returns all claims from the id_token if available.
   */
  public async getIdTokenClaims(): Promise<IdToken | undefined> {
    const cache = await this._getIdTokenFromCache();

    return cache?.decodedToken?.claims;
  }

  /**
   * ```js
   * await auth0.loginWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options
   */
  public async loginWithRedirect<TAppState = any>(
    options: RedirectLoginOptions<TAppState> = {}
  ) {
    const { openUrl, fragment, appState, ...urlOptions } =
      patchOpenUrlWithOnRedirect(options);

    const organizationId =
      urlOptions.authorizationParams?.organization ||
      this.options.authorizationParams.organization;

    const { url, ...transaction } = await this._prepareAuthorizeUrl(
      urlOptions.authorizationParams || {}
    );

    this.transactionManager.create({
      ...transaction,
      appState,
      ...(organizationId && { organizationId })
    });

    const urlWithFragment = fragment ? `${url}#${fragment}` : url;

    if (openUrl) {
      await openUrl(urlWithFragment);
    } else {
      window.location.assign(urlWithFragment);
    }
  }

  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Auth0. If the response is successful, results
   * will be valid according to their expiration times.
   */
  public async handleRedirectCallback<TAppState = any>(
    url: string = window.location.href
  ): Promise<RedirectLoginResult<TAppState>> {
    const queryStringFragments = url.split('?').slice(1);

    if (queryStringFragments.length === 0) {
      throw new Error('There are no query params available for parsing.');
    }

    const { state, code, error, error_description } = parseAuthenticationResult(
      queryStringFragments.join('')
    );

    const transaction = this.transactionManager.get();

    if (!transaction) {
      throw new GenericError('missing_transaction', 'Invalid state');
    }

    this.transactionManager.remove();

    if (error) {
      throw new AuthenticationError(
        error,
        error_description || error,
        state,
        transaction.appState
      );
    }

    // Transaction should have a `code_verifier` to do PKCE for CSRF protection
    if (
      !transaction.code_verifier ||
      (transaction.state && transaction.state !== state)
    ) {
      throw new GenericError('state_mismatch', 'Invalid state');
    }

    const organizationId = transaction.organizationId;
    const nonceIn = transaction.nonce;
    const redirect_uri = transaction.redirect_uri;

    await this._requestToken(
      {
        audience: transaction.audience,
        scope: transaction.scope,
        code_verifier: transaction.code_verifier,
        grant_type: 'authorization_code',
        code: code as string,
        ...(redirect_uri ? { redirect_uri } : {})
      },
      { nonceIn, organizationId }
    );

    return {
      appState: transaction.appState
    };
  }

  /**
   * ```js
   * await auth0.checkSession();
   * ```
   *
   * Check if the user is logged in using `getTokenSilently`. The difference
   * with `getTokenSilently` is that this doesn't return a token, but it will
   * pre-fill the token cache.
   *
   * This method also heeds the `auth0.{clientId}.is.authenticated` cookie, as an optimization
   *  to prevent calling Auth0 unnecessarily. If the cookie is not present because
   * there was no previous login (or it has expired) then tokens will not be refreshed.
   *
   * It should be used for silently logging in the user when you instantiate the
   * `Auth0Client` constructor. You should not need this if you are using the
   * `createAuth0Client` factory.
   *
   * **Note:** the cookie **may not** be present if running an app using a private tab, as some
   * browsers clear JS cookie data and local storage when the tab or page is closed, or on page reload. This effectively
   * means that `checkSession` could silently return without authenticating the user on page refresh when
   * using a private tab, despite having previously logged in. As a workaround, use `getTokenSilently` instead
   * and handle the possible `login_required` error [as shown in the readme](https://github.com/auth0/auth0-spa-js#creating-the-client).
   *
   * @param options
   */
  public async checkSession(options?: GetTokenSilentlyOptions) {
    if (!this.cookieStorage.get(this.isAuthenticatedCookieName)) {
      if (!this.cookieStorage.get(OLD_IS_AUTHENTICATED_COOKIE_NAME)) {
        return;
      } else {
        // Migrate the existing cookie to the new name scoped by client ID
        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
          daysUntilExpire: this.sessionCheckExpiryDays,
          cookieDomain: this.options.cookieDomain
        });

        this.cookieStorage.remove(OLD_IS_AUTHENTICATED_COOKIE_NAME);
      }
    }

    try {
      await this.getTokenSilently(options);
    } catch (_) {}
  }

  /**
   * Fetches a new access token and returns the response from the /oauth/token endpoint, omitting the refresh token.
   *
   * @param options
   */
  public async getTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Promise<GetTokenSilentlyVerboseResponse>;

  /**
   * Fetches a new access token and returns it.
   *
   * @param options
   */
  public async getTokenSilently(
    options?: GetTokenSilentlyOptions
  ): Promise<string>;

  /**
   * Fetches a new access token, and either returns just the access token (the default) or the response from the /oauth/token endpoint, depending on the `detailedResponse` option.
   *
   * ```js
   * const token = await auth0.getTokenSilently(options);
   * ```
   *
   * If there's a valid token stored and it has more than 60 seconds
   * remaining before expiration, return the token. Otherwise, attempt
   * to obtain a new token.
   *
   * A new token will be obtained either by opening an iframe or a
   * refresh token (if `useRefreshTokens` is `true`).

   * If iframes are used, opens an iframe with the `/authorize` URL
   * using the parameters provided as arguments. Random and secure `state`
   * and `nonce` parameters will be auto-generated. If the response is successful,
   * results will be validated according to their expiration times.
   *
   * If refresh tokens are used, the token endpoint is called directly with the
   * 'refresh_token' grant. If no refresh token is available to make this call,
   * the SDK will only fall back to using an iframe to the '/authorize' URL if 
   * the `useRefreshTokensFallback` setting has been set to `true`. By default this
   * setting is `false`.
   *
   * This method may use a web worker to perform the token call if the in-memory
   * cache is used.
   *
   * If an `audience` value is given to this function, the SDK always falls
   * back to using an iframe to make the token exchange.
   *
   * Note that in all cases, falling back to an iframe requires access to
   * the `auth0` cookie.
   *
   * @param options
   */
  public async getTokenSilently(
    options: GetTokenSilentlyOptions = {}
  ): Promise<undefined | string | GetTokenSilentlyVerboseResponse> {
    const localOptions: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    } = {
      cacheMode: 'on',
      ...options,
      authorizationParams: {
        ...this.options.authorizationParams,
        ...options.authorizationParams,
        scope: getUniqueScopes(this.scope, options.authorizationParams?.scope)
      }
    };

    const result = await singlePromise(
      () => this._getTokenSilently(localOptions),
      `${this.options.clientId}::${localOptions.authorizationParams.audience}::${localOptions.authorizationParams.scope}`
    );

    return options.detailedResponse ? result : result?.access_token;
  }

  private async _getTokenSilently(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    }
  ): Promise<undefined | GetTokenSilentlyVerboseResponse> {
    const { cacheMode, ...getTokenOptions } = options;

    // Check the cache before acquiring the lock to avoid the latency of
    // `lock.acquireLock` when the cache is populated.
    if (cacheMode !== 'off') {
      const entry = await this._getEntryFromCache({
        scope: getTokenOptions.authorizationParams.scope,
        audience: getTokenOptions.authorizationParams.audience || 'default',
        clientId: this.options.clientId
      });

      if (entry) {
        return entry;
      }
    }

    if (cacheMode === 'cache-only') {
      return;
    }

    if (
      await retryPromise(
        () => lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000),
        10
      )
    ) {
      try {
        window.addEventListener('pagehide', this._releaseLockOnPageHide);

        // Check the cache a second time, because it may have been populated
        // by a previous call while this call was waiting to acquire the lock.
        if (cacheMode !== 'off') {
          const entry = await this._getEntryFromCache({
            scope: getTokenOptions.authorizationParams.scope,
            audience: getTokenOptions.authorizationParams.audience || 'default',
            clientId: this.options.clientId
          });

          if (entry) {
            return entry;
          }
        }

        const authResult = this.options.useRefreshTokens
          ? await this._getTokenUsingRefreshToken(getTokenOptions)
          : await this._getTokenFromIFrame(getTokenOptions);

        const { id_token, access_token, oauthTokenScope, expires_in } =
          authResult;

        return {
          id_token,
          access_token,
          ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
          expires_in
        };
      } finally {
        await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
        window.removeEventListener('pagehide', this._releaseLockOnPageHide);
      }
    } else {
      throw new TimeoutError();
    }
  }

  /**
   * ```js
   * const token = await auth0.getTokenWithPopup(options);
   * ```
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * @param options
   * @param config
   */
  public async getTokenWithPopup(
    options: GetTokenWithPopupOptions = {},
    config: PopupConfigOptions = {}
  ) {
    const localOptions = {
      ...options,
      authorizationParams: {
        ...this.options.authorizationParams,
        ...options.authorizationParams,
        scope: getUniqueScopes(this.scope, options.authorizationParams?.scope)
      }
    };

    config = {
      ...DEFAULT_POPUP_CONFIG_OPTIONS,
      ...config
    };

    await this.loginWithPopup(localOptions, config);

    const cache = await this.cacheManager.get(
      new CacheKey({
        scope: localOptions.authorizationParams.scope,
        audience: localOptions.authorizationParams.audience || 'default',
        clientId: this.options.clientId
      })
    );

    return cache!.access_token;
  }

  /**
   * ```js
   * const isAuthenticated = await auth0.isAuthenticated();
   * ```
   *
   * Returns `true` if there's valid information stored,
   * otherwise returns `false`.
   *
   */
  public async isAuthenticated() {
    const user = await this.getUser();
    return !!user;
  }

  /**
   * ```js
   * await auth0.buildLogoutUrl(options);
   * ```
   *
   * Builds a URL to the logout endpoint using the parameters provided as arguments.
   * @param options
   */
  private _buildLogoutUrl(options: LogoutUrlOptions): string {
    if (options.clientId !== null) {
      options.clientId = options.clientId || this.options.clientId;
    } else {
      delete options.clientId;
    }

    const { federated, ...logoutOptions } = options.logoutParams || {};
    const federatedQuery = federated ? `&federated` : '';
    const url = this._url(
      `/v2/logout?${createQueryParams({
        clientId: options.clientId,
        ...logoutOptions
      })}`
    );

    return url + federatedQuery;
  }

  /**
   * ```js
   * await auth0.logout(options);
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the Auth0 session.
   *
   * If the `federated` option is specified it also clears the Identity Provider session.
   * [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
   *
   * @param options
   */
  public async logout(options: LogoutOptions = {}): Promise<void> {
    const { openUrl, ...logoutOptions } = patchOpenUrlWithOnRedirect(options);

    if (options.clientId === null) {
      await this.cacheManager.clear();
    } else {
      await this.cacheManager.clear(options.clientId || this.options.clientId);
    }

    this.cookieStorage.remove(this.orgHintCookieName, {
      cookieDomain: this.options.cookieDomain
    });
    this.cookieStorage.remove(this.isAuthenticatedCookieName, {
      cookieDomain: this.options.cookieDomain
    });
    this.userCache.remove(CACHE_KEY_ID_TOKEN_SUFFIX);

    const url = this._buildLogoutUrl(logoutOptions);

    if (openUrl) {
      await openUrl(url);
    } else if (openUrl !== false) {
      window.location.assign(url);
    }
  }

  private async _getTokenFromIFrame(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    }
  ): Promise<GetTokenSilentlyResult> {
    const params: AuthorizationParams & { scope: string } = {
      ...options.authorizationParams,
      prompt: 'none'
    };

    const orgIdHint = this.cookieStorage.get<string>(this.orgHintCookieName);

    if (orgIdHint && !params.organization) {
      params.organization = orgIdHint;
    }

    const {
      url,
      state: stateIn,
      nonce: nonceIn,
      code_verifier,
      redirect_uri,
      scope,
      audience
    } = await this._prepareAuthorizeUrl(
      params,
      { response_mode: 'web_message' },
      window.location.origin
    );

    try {
      // When a browser is running in a Cross-Origin Isolated context, using iframes is not possible.
      // It doesn't throw an error but times out instead, so we should exit early and inform the user about the reason.
      // https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
      if ((window as any).crossOriginIsolated) {
        throw new GenericError(
          'login_required',
          'The application is running in a Cross-Origin Isolated context, silently retrieving a token without refresh token is not possible.'
        );
      }

      const authorizeTimeout =
        options.timeoutInSeconds || this.options.authorizeTimeoutInSeconds;

      const codeResult = await runIframe(url, this.domainUrl, authorizeTimeout);

      if (stateIn !== codeResult.state) {
        throw new GenericError('state_mismatch', 'Invalid state');
      }

      const tokenResult = await this._requestToken(
        {
          ...options.authorizationParams,
          code_verifier,
          code: codeResult.code as string,
          grant_type: 'authorization_code',
          redirect_uri,
          timeout: options.authorizationParams.timeout || this.httpTimeoutMs
        },
        {
          nonceIn
        }
      );

      return {
        ...tokenResult,
        scope: scope,
        oauthTokenScope: tokenResult.scope,
        audience: audience
      };
    } catch (e) {
      if (e.error === 'login_required') {
        this.logout({
          openUrl: false
        });
      }
      throw e;
    }
  }

  private async _getTokenUsingRefreshToken(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    }
  ): Promise<GetTokenSilentlyResult> {
    const cache = await this.cacheManager.get(
      new CacheKey({
        scope: options.authorizationParams.scope,
        audience: options.authorizationParams.audience || 'default',
        clientId: this.options.clientId
      })
    );

    // If you don't have a refresh token in memory
    // and you don't have a refresh token in web worker memory
    // and useRefreshTokensFallback was explicitly enabled
    // fallback to an iframe
    if ((!cache || !cache.refresh_token) && !this.worker) {
      if (this.options.useRefreshTokensFallback) {
        return await this._getTokenFromIFrame(options);
      }

      throw new MissingRefreshTokenError(
        options.authorizationParams.audience || 'default',
        options.authorizationParams.scope
      );
    }

    const redirect_uri =
      options.authorizationParams.redirect_uri ||
      this.options.authorizationParams.redirect_uri ||
      window.location.origin;

    const timeout =
      typeof options.timeoutInSeconds === 'number'
        ? options.timeoutInSeconds * 1000
        : null;

    try {
      const tokenResult = await this._requestToken({
        ...options.authorizationParams,
        grant_type: 'refresh_token',
        refresh_token: cache && cache.refresh_token,
        redirect_uri,
        ...(timeout && { timeout })
      });

      return {
        ...tokenResult,
        scope: options.authorizationParams.scope,
        oauthTokenScope: tokenResult.scope,
        audience: options.authorizationParams.audience || 'default'
      };
    } catch (e) {
      if (
        // The web worker didn't have a refresh token in memory so
        // fallback to an iframe.
        (e.message.indexOf(MISSING_REFRESH_TOKEN_ERROR_MESSAGE) > -1 ||
          // A refresh token was found, but is it no longer valid
          // and useRefreshTokensFallback is explicitly enabled. Fallback to an iframe.
          (e.message &&
            e.message.indexOf(INVALID_REFRESH_TOKEN_ERROR_MESSAGE) > -1)) &&
        this.options.useRefreshTokensFallback
      ) {
        return await this._getTokenFromIFrame(options);
      }

      throw e;
    }
  }

  private async _saveEntryInCache(
    entry: CacheEntry & { id_token: string; decodedToken: DecodedToken }
  ) {
    const { id_token, decodedToken, ...entryWithoutIdToken } = entry;

    this.userCache.set(CACHE_KEY_ID_TOKEN_SUFFIX, {
      id_token,
      decodedToken
    });

    await this.cacheManager.setIdToken(
      this.options.clientId,
      entry.id_token,
      entry.decodedToken
    );

    await this.cacheManager.set(entryWithoutIdToken);
  }

  private async _getIdTokenFromCache() {
    const audience = this.options.authorizationParams.audience || 'default';

    const cache = await this.cacheManager.getIdToken(
      new CacheKey({
        clientId: this.options.clientId,
        audience,
        scope: this.scope
      })
    );

    const currentCache = this.userCache.get<IdTokenEntry>(
      CACHE_KEY_ID_TOKEN_SUFFIX
    ) as IdTokenEntry;

    // If the id_token in the cache matches the value we previously cached in memory return the in-memory
    // value so that object comparison will work
    if (cache && cache.id_token === currentCache?.id_token) {
      return currentCache;
    }

    this.userCache.set(CACHE_KEY_ID_TOKEN_SUFFIX, cache);
    return cache;
  }

  private async _getEntryFromCache({
    scope,
    audience,
    clientId
  }: {
    scope: string;
    audience: string;
    clientId: string;
  }): Promise<undefined | GetTokenSilentlyVerboseResponse> {
    const entry = await this.cacheManager.get(
      new CacheKey({
        scope,
        audience,
        clientId
      }),
      60 // get a new token if within 60 seconds of expiring
    );

    if (entry && entry.access_token) {
      const { access_token, oauthTokenScope, expires_in } = entry as CacheEntry;
      const cache = await this._getIdTokenFromCache();
      return (
        cache && {
          id_token: cache.id_token,
          access_token,
          ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
          expires_in
        }
      );
    }
  }

  /**
   * Releases any lock acquired by the current page that's not released yet
   *
   * Get's called on the `pagehide` event.
   * https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event
   */
  private _releaseLockOnPageHide = async () => {
    await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);

    window.removeEventListener('pagehide', this._releaseLockOnPageHide);
  };

  private async _requestToken(
    options: PKCERequestTokenOptions | RefreshTokenRequestTokenOptions,
    additionalParameters?: RequestTokenAdditionalParameters
  ) {
    const { nonceIn, organizationId } = additionalParameters || {};
    const authResult = await oauthToken(
      {
        baseUrl: this.domainUrl,
        client_id: this.options.clientId,
        auth0Client: this.options.auth0Client,
        useFormData: this.options.useFormData,
        timeout: this.httpTimeoutMs,
        ...options
      },
      this.worker
    );

    const decodedToken = await this._verifyIdToken(
      authResult.id_token,
      nonceIn,
      organizationId
    );

    await this._saveEntryInCache({
      ...authResult,
      decodedToken,
      scope: options.scope,
      audience: options.audience || 'default',
      ...(authResult.scope ? { oauthTokenScope: authResult.scope } : null),
      client_id: this.options.clientId
    });

    this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
      daysUntilExpire: this.sessionCheckExpiryDays,
      cookieDomain: this.options.cookieDomain
    });

    this._processOrgIdHint(decodedToken.claims.org_id);

    return { ...authResult, decodedToken };
  }
}

interface BaseRequestTokenOptions {
  audience?: string;
  scope: string;
  timeout?: number;
  redirect_uri?: string;
}

interface PKCERequestTokenOptions extends BaseRequestTokenOptions {
  code: string;
  grant_type: 'authorization_code';
  code_verifier: string;
}

interface RefreshTokenRequestTokenOptions extends BaseRequestTokenOptions {
  grant_type: 'refresh_token';
  refresh_token?: string;
}

interface RequestTokenAdditionalParameters {
  nonceIn?: string;
  organizationId?: string;
}
