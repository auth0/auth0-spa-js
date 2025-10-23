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

import { injectDefaultScopes, scopesToRequest } from './scope';

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

import { ConnectAccountTransaction, LoginTransaction, TransactionManager } from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import {
  AuthenticationError,
  ConnectError,
  GenericError,
  MissingRefreshTokenError,
  MissingScopesError,
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
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_AUDIENCE
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
  TokenEndpointResponse,
  AuthenticationResult,
  ConnectAccountRedirectResult,
  RedirectConnectAccountOptions,
  ResponseType,
  ClientAuthorizationParams,
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
  buildGetTokenSilentlyLockKey,
  OLD_IS_AUTHENTICATED_COOKIE_NAME,
  patchOpenUrlWithOnRedirect,
  getScopeToRequest,
  allScopesAreIncluded,
  isRefreshWithMrrt,
  getMissingScopes
} from './Auth0Client.utils';
import { CustomTokenExchangeOptions } from './TokenExchange';
import { Dpop } from './dpop/dpop';
import {
  Fetcher,
  type FetcherConfig,
  type CustomFetchMinimalOutput
} from './fetcher';
import { MyAccountApiClient } from './MyAccountApiClient';

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
  private readonly scope: Record<string, string>;
  private readonly cookieStorage: ClientStorage;
  private readonly dpop: Dpop | undefined;
  private readonly sessionCheckExpiryDays: number;
  private readonly orgHintCookieName: string;
  private readonly isAuthenticatedCookieName: string;
  private readonly nowProvider: () => number | Promise<number>;
  private readonly httpTimeoutMs: number;
  private readonly options: Auth0ClientOptions & {
    authorizationParams: ClientAuthorizationParams,
  };
  private readonly userCache: ICache = new InMemoryCache().enclosedCache;
  private readonly myAccountApi: MyAccountApiClient;

  private worker?: Worker;
  private readonly activeLockKeys: Set<string> = new Set();

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
    this.scope = injectDefaultScopes(
      this.options.authorizationParams.scope,
      'openid',
      this.options.useRefreshTokens ? 'offline_access' : ''
    );

    this.transactionManager = new TransactionManager(
      transactionStorage,
      this.options.clientId,
      this.options.cookieDomain
    );

    this.nowProvider = this.options.nowProvider || DEFAULT_NOW_PROVIDER;

    this.cacheManager = new CacheManager(
      cache,
      !cache.allKeys
        ? new CacheKeyManifest(cache, this.options.clientId)
        : undefined,
      this.nowProvider
    );

    this.dpop = this.options.useDpop
      ? new Dpop(this.options.clientId)
      : undefined;

    this.domainUrl = getDomain(this.options.domain);
    this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);

    const myAccountApiIdentifier = `${this.domainUrl}/me/`;
    const myAccountFetcher = this.createFetcher({
      ...(this.options.useDpop && { dpopNonceId: '__auth0_my_account_api__' }),
      getAccessToken: () =>
        this.getTokenSilently({
          authorizationParams: {
            scope: 'create:me:connected_accounts',
            audience: myAccountApiIdentifier
          },
          detailedResponse: true
        })
    });
    this.myAccountApi = new MyAccountApiClient(
      myAccountFetcher,
      myAccountApiIdentifier
    );

    // Don't use web workers unless using refresh tokens in memory
    if (
      typeof window !== 'undefined' &&
      window.Worker &&
      this.options.useRefreshTokens &&
      cacheLocation === CACHE_LOCATION_MEMORY
    ) {
      if (this.options.workerUrl) {
        this.worker = new Worker(this.options.workerUrl);
      } else {
        this.worker = new TokenWorker();
      }
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
    organization?: string
  ) {
    const now = await this.nowProvider();

    return verifyIdToken({
      iss: this.tokenIssuer,
      aud: this.options.clientId,
      id_token,
      nonce,
      organization,
      leeway: this.options.leeway,
      max_age: parseNumber(this.options.authorizationParams.max_age),
      now
    });
  }

  private _processOrgHint(organization?: string) {
    if (organization) {
      this.cookieStorage.save(this.orgHintCookieName, organization, {
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
    const thumbprint = await this.dpop?.calculateThumbprint();

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
      authorizeOptions?.response_mode,
      thumbprint
    );

    const url = this._authorizeUrl(params);

    return {
      nonce,
      code_verifier,
      scope: params.scope,
      audience: params.audience || DEFAULT_AUDIENCE,
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

    const organization =
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
        organization
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

    const organization =
      urlOptions.authorizationParams?.organization ||
      this.options.authorizationParams.organization;

    const { url, ...transaction } = await this._prepareAuthorizeUrl(
      urlOptions.authorizationParams || {}
    );

    this.transactionManager.create<LoginTransaction>({
      ...transaction,
      appState,
      response_type: ResponseType.Code,
      ...(organization && { organization })
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
  ): Promise<
    RedirectLoginResult<TAppState> | ConnectAccountRedirectResult<TAppState>
  > {
    const queryStringFragments = url.split('?').slice(1);

    if (queryStringFragments.length === 0) {
      throw new Error('There are no query params available for parsing.');
    }

    const transaction = this.transactionManager.get<
      LoginTransaction | ConnectAccountTransaction
    >();

    if (!transaction) {
      throw new GenericError('missing_transaction', 'Invalid state');
    }

    this.transactionManager.remove();

    const authenticationResult = parseAuthenticationResult(
      queryStringFragments.join('')
    );

    if (transaction.response_type === ResponseType.ConnectCode) {
      return this._handleConnectAccountRedirectCallback<TAppState>(
        authenticationResult,
        transaction
      );
    }
    return this._handleLoginRedirectCallback<TAppState>(
      authenticationResult,
      transaction
    );
  }

  /**
   * Handles the redirect callback from the login flow.
   *
   * @template AppState - The application state persisted from the /authorize redirect.
   * @param {string} authenticationResult - The parsed authentication result from the URL.
   * @param {string} transaction - The login transaction.
   *
   * @returns {RedirectLoginResult} Resolves with the persisted app state.
   * @throws {GenericError | Error} If the transaction is missing, invalid, or the code exchange fails.
   */
  private async _handleLoginRedirectCallback<TAppState>(
    authenticationResult: AuthenticationResult,
    transaction: LoginTransaction
  ): Promise<RedirectLoginResult<TAppState>> {
    const { code, state, error, error_description } = authenticationResult;

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

    const organization = transaction.organization;
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
      { nonceIn, organization }
    );

    return {
      appState: transaction.appState,
      response_type: ResponseType.Code
    };
  }

  /**
   * Handles the redirect callback from the connect account flow.
   * This works the same as the redirect from the login flow expect it verifies the `connect_code`
   * with the My Account API rather than the `code` with the Authorization Server.
   *
   * @template AppState - The application state persisted from the connect redirect.
   * @param {string} connectResult - The parsed connect accounts result from the URL.
   * @param {string} transaction - The login transaction.
   * @returns {Promise<ConnectAccountRedirectResult>} The result of the My Account API, including any persisted app state.
   * @throws {GenericError | MyAccountApiError} If the transaction is missing, invalid, or an error is returned from the My Account API.
   */
  private async _handleConnectAccountRedirectCallback<TAppState>(
    connectResult: AuthenticationResult,
    transaction: ConnectAccountTransaction
  ): Promise<ConnectAccountRedirectResult<TAppState>> {
    const { connect_code, state, error, error_description } = connectResult;

    if (error) {
      throw new ConnectError(
        error,
        error_description || error,
        transaction.connection,
        state,
        transaction.appState
      );
    }

    if (!connect_code) {
      throw new GenericError('missing_connect_code', 'Missing connect code');
    }

    if (
      !transaction.code_verifier ||
      !transaction.state ||
      !transaction.auth_session ||
      !transaction.redirect_uri ||
      transaction.state !== state
    ) {
      throw new GenericError('state_mismatch', 'Invalid state');
    }

    const data = await this.myAccountApi.completeAccount({
      auth_session: transaction.auth_session,
      connect_code,
      redirect_uri: transaction.redirect_uri,
      code_verifier: transaction.code_verifier
    });

    return {
      ...data,
      appState: transaction.appState,
      response_type: ResponseType.ConnectCode,
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
    } catch (_) { }
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
        scope: scopesToRequest(
          this.scope,
          options.authorizationParams?.scope,
          options.authorizationParams?.audience || this.options.authorizationParams.audience,
        )
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
        audience: getTokenOptions.authorizationParams.audience || DEFAULT_AUDIENCE,
        clientId: this.options.clientId,
        cacheMode,
      });

      if (entry) {
        return entry;
      }
    }

    if (cacheMode === 'cache-only') {
      return;
    }

    // Generate lock key based on client ID and audience for better isolation
    const lockKey = buildGetTokenSilentlyLockKey(
      this.options.clientId,
      getTokenOptions.authorizationParams.audience || 'default'
    );

    if (await retryPromise(() => lock.acquireLock(lockKey, 5000), 10)) {
      this.activeLockKeys.add(lockKey);

      // Add event listener only if this is the first active lock
      if (this.activeLockKeys.size === 1) {
        window.addEventListener('pagehide', this._releaseLockOnPageHide);
      }
      try {
        // Check the cache a second time, because it may have been populated
        // by a previous call while this call was waiting to acquire the lock.
        if (cacheMode !== 'off') {
          const entry = await this._getEntryFromCache({
            scope: getTokenOptions.authorizationParams.scope,
            audience: getTokenOptions.authorizationParams.audience || DEFAULT_AUDIENCE,
            clientId: this.options.clientId
          });

          if (entry) {
            return entry;
          }
        }

        const authResult = this.options.useRefreshTokens
          ? await this._getTokenUsingRefreshToken(getTokenOptions)
          : await this._getTokenFromIFrame(getTokenOptions);

        const {
          id_token,
          token_type,
          access_token,
          oauthTokenScope,
          expires_in
        } = authResult;

        return {
          id_token,
          token_type,
          access_token,
          ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
          expires_in
        };
      } finally {
        await lock.releaseLock(lockKey);
        this.activeLockKeys.delete(lockKey);
        // If we have no more locks, we can remove the event listener to clean up
        if (this.activeLockKeys.size === 0) {
          window.removeEventListener('pagehide', this._releaseLockOnPageHide);
        }
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
        scope: scopesToRequest(
          this.scope,
          options.authorizationParams?.scope,
          options.authorizationParams?.audience || this.options.authorizationParams.audience
        )
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
        audience: localOptions.authorizationParams.audience || DEFAULT_AUDIENCE,
        clientId: this.options.clientId
      }),
      undefined,
      this.options.useMrrt
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

    await this.dpop?.clear();

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

    const orgHint = this.cookieStorage.get<string>(this.orgHintCookieName);

    if (orgHint && !params.organization) {
      params.organization = orgHint;
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

      // Extract origin from domainUrl, fallback to domainUrl if URL parsing fails
      let eventOrigin: string;
      try {
        eventOrigin = new URL(this.domainUrl).origin;
      } catch {
        eventOrigin = this.domainUrl;
      }

      const codeResult = await runIframe(url, eventOrigin, authorizeTimeout);

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
          nonceIn,
          organization: params.organization
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
        audience: options.authorizationParams.audience || DEFAULT_AUDIENCE,
        clientId: this.options.clientId
      }),
      undefined,
      this.options.useMrrt
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
        options.authorizationParams.audience || DEFAULT_AUDIENCE,
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

    const scopesToRequest = getScopeToRequest(
      this.options.useMrrt,
      options.authorizationParams,
      cache?.audience,
      cache?.scope,
    );

    try {
      const tokenResult = await this._requestToken({
        ...options.authorizationParams,
        grant_type: 'refresh_token',
        refresh_token: cache && cache.refresh_token,
        redirect_uri,
        ...(timeout && { timeout })
      },
        {
          scopesToRequest,
        }
      );

      // If is refreshed with MRRT, we update all entries that have the old
      // refresh_token with the new one if the server responded with one
      if (tokenResult.refresh_token && this.options.useMrrt && cache?.refresh_token) {
        await this.cacheManager.updateEntry(
          cache.refresh_token,
          tokenResult.refresh_token
        );
      }

      // Some scopes requested to the server might not be inside the refresh policies
      // In order to return a token with all requested scopes when using MRRT we should
      // check if all scopes are returned. If not, we will try to use an iframe to request
      // a token.
      if (this.options.useMrrt) {
        const isRefreshMrrt = isRefreshWithMrrt(
          cache?.audience,
          cache?.scope,
          options.authorizationParams.audience,
          options.authorizationParams.scope,
        );

        if (isRefreshMrrt) {
          const tokenHasAllScopes = allScopesAreIncluded(
            scopesToRequest,
            tokenResult.scope,
          );

          if (!tokenHasAllScopes) {
            if (this.options.useRefreshTokensFallback) {
              return await this._getTokenFromIFrame(options);
            }

            // Before throwing MissingScopesError, we have to remove the previously created entry
            // to avoid storing wrong data
            await this.cacheManager.remove(
              this.options.clientId,
              options.authorizationParams.audience,
              options.authorizationParams.scope,
            );

            const missingScopes = getMissingScopes(
              scopesToRequest,
              tokenResult.scope,
            );

            throw new MissingScopesError(
              options.authorizationParams.audience || 'default',
              missingScopes,
            );
          }
        }
      }

      return {
        ...tokenResult,
        scope: options.authorizationParams.scope,
        oauthTokenScope: tokenResult.scope,
        audience: options.authorizationParams.audience || DEFAULT_AUDIENCE
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
    const audience = this.options.authorizationParams.audience || DEFAULT_AUDIENCE;
    const scope = this.scope[audience];

    const cache = await this.cacheManager.getIdToken(
      new CacheKey({
        clientId: this.options.clientId,
        audience,
        scope,
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
    clientId,
    cacheMode,
  }: {
    scope: string;
    audience: string;
    clientId: string;
    cacheMode?: string;
  }): Promise<undefined | GetTokenSilentlyVerboseResponse> {
    const entry = await this.cacheManager.get(
      new CacheKey({
        scope,
        audience,
        clientId
      }),
      60, // get a new token if within 60 seconds of expiring
      this.options.useMrrt,
      cacheMode,
    );

    if (entry && entry.access_token) {
      const { token_type, access_token, oauthTokenScope, expires_in } =
        entry as CacheEntry;
      const cache = await this._getIdTokenFromCache();
      return (
        cache && {
          id_token: cache.id_token,
          token_type: token_type ? token_type : 'Bearer',
          access_token,
          ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
          expires_in
        }
      );
    }
  }

  /**
   * Releases any locks acquired by the current page that are not released yet
   *
   * Get's called on the `pagehide` event.
   * https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event
   */
  private _releaseLockOnPageHide = async () => {
    // Release all active locks
    const lockKeysToRelease = Array.from(this.activeLockKeys);
    for (const lockKey of lockKeysToRelease) {
      await lock.releaseLock(lockKey);
    }
    this.activeLockKeys.clear();

    window.removeEventListener('pagehide', this._releaseLockOnPageHide);
  };

  private async _requestToken(
    options:
      | PKCERequestTokenOptions
      | RefreshTokenRequestTokenOptions
      | TokenExchangeRequestOptions,
    additionalParameters?: RequestTokenAdditionalParameters
  ) {
    const { nonceIn, organization, scopesToRequest } = additionalParameters || {};
    const authResult = await oauthToken(
      {
        baseUrl: this.domainUrl,
        client_id: this.options.clientId,
        auth0Client: this.options.auth0Client,
        useFormData: this.options.useFormData,
        timeout: this.httpTimeoutMs,
        useMrrt: this.options.useMrrt,
        dpop: this.dpop,
        ...options,
        scope: scopesToRequest || options.scope,
      },
      this.worker
    );

    const decodedToken = await this._verifyIdToken(
      authResult.id_token,
      nonceIn,
      organization
    );

    await this._saveEntryInCache({
      ...authResult,
      decodedToken,
      scope: options.scope,
      audience: options.audience || DEFAULT_AUDIENCE,
      ...(authResult.scope ? { oauthTokenScope: authResult.scope } : null),
      client_id: this.options.clientId
    });

    this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
      daysUntilExpire: this.sessionCheckExpiryDays,
      cookieDomain: this.options.cookieDomain
    });

    this._processOrgHint(organization || decodedToken.claims.org_id);

    return { ...authResult, decodedToken };
  }

  /*
  Custom Token Exchange
  * **Implementation Notes:**
  * - Ensure that the `subject_token` provided has been securely obtained and is valid according
  *   to your external identity provider's policies before invoking this function.
  * - The function leverages internal helper methods:
  *   - `validateTokenType` confirms that the `subject_token_type` is supported.
  *   - `getUniqueScopes` merges and de-duplicates scopes between the provided options and
  *     the instance's default scopes.
  *   - `_requestToken` performs the actual HTTP request to the token endpoint.
  */

  /**
   * Exchanges an external subject token for an Auth0 token via a token exchange request.
   *
   * @param {CustomTokenExchangeOptions} options - The options required to perform the token exchange.
   *
   * @returns {Promise<TokenEndpointResponse>} A promise that resolves to the token endpoint response,
   * which contains the issued Auth0 tokens.
   *
   * This method implements the token exchange grant as specified in RFC 8693 by first validating
   * the provided subject token type and then constructing a token request to the /oauth/token endpoint.
   * The request includes the following parameters:
   *
   * - `grant_type`: Hard-coded to "urn:ietf:params:oauth:grant-type:token-exchange".
   * - `subject_token`: The external token provided via the options.
   * - `subject_token_type`: The type of the external token (validated by this function).
   * - `scope`: A unique set of scopes, generated by merging the scopes supplied in the options
   *            with the SDK’s default scopes.
   * - `audience`: The target audience from the options, with fallback to the SDK's authorization configuration.
   *
   * **Example Usage:**
   *
   * ```
   * // Define the token exchange options
   * const options: CustomTokenExchangeOptions = {
   *   subject_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...',
   *   subject_token_type: 'urn:acme:legacy-system-token',
   *   scope: "openid profile"
   * };
   *
   * // Exchange the external token for Auth0 tokens
   * try {
   *   const tokenResponse = await instance.exchangeToken(options);
   *   // Use tokenResponse.access_token, tokenResponse.id_token, etc.
   * } catch (error) {
   *   // Handle token exchange error
   * }
   * ```
   */
  async exchangeToken(
    options: CustomTokenExchangeOptions
  ): Promise<TokenEndpointResponse> {
    return this._requestToken({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: options.subject_token,
      subject_token_type: options.subject_token_type,
      scope: scopesToRequest(
        this.scope,
        options.scope,
        options.audience || this.options.authorizationParams.audience
      ),
      audience: options.audience || this.options.authorizationParams.audience
    });
  }

  protected _assertDpop(dpop: Dpop | undefined): asserts dpop is Dpop {
    if (!dpop) {
      throw new Error('`useDpop` option must be enabled before using DPoP.');
    }
  }

  /**
   * Returns the current DPoP nonce used for making requests to Auth0.
   *
   * It can return `undefined` because when starting fresh it will not
   * be populated until after the first response from the server.
   *
   * It requires enabling the {@link Auth0ClientOptions.useDpop} option.
   *
   * @param nonce The nonce value.
   * @param id    The identifier of a nonce: if absent, it will get the nonce
   *              used for requests to Auth0. Otherwise, it will be used to
   *              select a specific non-Auth0 nonce.
   */
  public getDpopNonce(id?: string): Promise<string | undefined> {
    this._assertDpop(this.dpop);

    return this.dpop.getNonce(id);
  }

  /**
   * Sets the current DPoP nonce used for making requests to Auth0.
   *
   * It requires enabling the {@link Auth0ClientOptions.useDpop} option.
   *
   * @param nonce The nonce value.
   * @param id    The identifier of a nonce: if absent, it will set the nonce
   *              used for requests to Auth0. Otherwise, it will be used to
   *              select a specific non-Auth0 nonce.
   */
  public setDpopNonce(nonce: string, id?: string): Promise<void> {
    this._assertDpop(this.dpop);

    return this.dpop.setNonce(nonce, id);
  }

  /**
   * Returns a string to be used to demonstrate possession of the private
   * key used to cryptographically bind access tokens with DPoP.
   *
   * It requires enabling the {@link Auth0ClientOptions.useDpop} option.
   */
  public generateDpopProof(params: {
    url: string;
    method: string;
    nonce?: string;
    accessToken: string;
  }): Promise<string> {
    this._assertDpop(this.dpop);

    return this.dpop.generateProof(params);
  }

  /**
   * Returns a new `Fetcher` class that will contain a `fetchWithAuth()` method.
   * This is a drop-in replacement for the Fetch API's `fetch()` method, but will
   * handle certain authentication logic for you, like building the proper auth
   * headers or managing DPoP nonces and retries automatically.
   *
   * Check the `EXAMPLES.md` file for a deeper look into this method.
   */
  public createFetcher<TOutput extends CustomFetchMinimalOutput = Response>(
    config: FetcherConfig<TOutput> = {}
  ): Fetcher<TOutput> {
    return new Fetcher(config, {
      isDpopEnabled: () => !!this.options.useDpop,
      getAccessToken: authParams =>
        this.getTokenSilently({
          authorizationParams: {
            scope: authParams?.scope?.join(' '),
            audience: authParams?.audience
          },
          detailedResponse: true
        }),
      getDpopNonce: () => this.getDpopNonce(config.dpopNonceId),
      setDpopNonce: nonce => this.setDpopNonce(nonce, config.dpopNonceId),
      generateDpopProof: params => this.generateDpopProof(params)
    });
  }

  /**
   * Initiates a redirect to connect the user's account with a specified connection.
   * This method generates PKCE parameters, creates a transaction, and redirects to the /connect endpoint.
   *
   * @template TAppState - The application state to persist through the transaction.
   * @param {RedirectConnectAccountOptions<TAppState>} options - Options for the connect account redirect flow.
   * @param   {string} options.connection - The name of the connection to link (e.g. 'google-oauth2').
   * @param   {AuthorizationParams} [options.authorization_params] - Additional authorization parameters for the request to the upstream IdP.
   * @param   {string} [options.redirectUri] - The URI to redirect back to after connecting the account.
   * @param   {TAppState} [options.appState] - Application state to persist through the transaction.
   * @param   {(url: string) => Promise<void>} [options.openUrl] - Custom function to open the URL.
   *
   * @returns {Promise<void>} Resolves when the redirect is initiated.
   * @throws {MyAccountApiError} If the connect request to the My Account API fails.
   */
  public async connectAccountWithRedirect<TAppState = any>(
    options: RedirectConnectAccountOptions<TAppState>
  ) {
    const {
      openUrl,
      appState,
      connection,
      authorization_params,
      redirectUri = this.options.authorizationParams.redirect_uri ||
      window.location.origin
    } = options;

    if (!connection) {
      throw new Error('connection is required');
    }

    const state = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

    const { connect_uri, connect_params, auth_session } =
      await this.myAccountApi.connectAccount({
        connection,
        redirect_uri: redirectUri,
        state,
        code_challenge,
        code_challenge_method: 'S256',
        authorization_params
      });

    this.transactionManager.create<ConnectAccountTransaction>({
      state,
      code_verifier,
      auth_session,
      redirect_uri: redirectUri,
      appState,
      connection,
      response_type: ResponseType.ConnectCode
    });

    const url = new URL(connect_uri);
    url.searchParams.set('ticket', connect_params.ticket);
    if (openUrl) {
      await openUrl(url.toString());
    } else {
      window.location.assign(url);
    }
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

interface TokenExchangeRequestOptions extends BaseRequestTokenOptions {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange';
  subject_token: string;
  subject_token_type: string;
  actor_token?: string;
  actor_token_type?: string;
}

interface RequestTokenAdditionalParameters {
  nonceIn?: string;
  organization?: string;
  scopesToRequest?: string;
}
