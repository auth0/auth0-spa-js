import Lock from 'browser-tabs-lock';

import {
  createQueryParams,
  runPopup,
  parseQueryResult,
  encode,
  createRandomString,
  runIframe,
  sha256,
  bufferToBase64UrlEncoded,
  oauthToken,
  validateCrypto
} from './utils';

import { getUniqueScopes } from './scope';
import { InMemoryCache, ICache, LocalStorageCache } from './cache';
import TransactionManager from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import { AuthenticationError } from './errors';
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
  RECOVERABLE_ERRORS,
  DEFAULT_SESSION_CHECK_EXPIRY_DAYS
} from './constants';

import version from './version';

import {
  Auth0ClientOptions,
  BaseLoginOptions,
  AuthorizeOptions,
  RedirectLoginOptions,
  PopupLoginOptions,
  PopupConfigOptions,
  GetUserOptions,
  GetIdTokenClaimsOptions,
  RedirectLoginResult,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
  LogoutOptions,
  RefreshTokenOptions,
  OAuthTokenOptions,
  CacheLocation,
  LogoutUrlOptions
} from './global';

// @ts-ignore
import TokenWorker from './token.worker.ts';
import { isIE11, isSafari10, isSafari11, isSafari12_0 } from './user-agent';

/**
 * @ignore
 */
const lock = new Lock();

/**
 * @ignore
 */
const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

/**
 * @ignore
 */
const cacheLocationBuilders = {
  memory: () => new InMemoryCache().enclosedCache,
  localstorage: () => new LocalStorageCache()
};

/**
 * @ignore
 */
const cacheFactory = (location: string) => {
  return cacheLocationBuilders[location];
};

/**
 * @ignore
 */
const supportWebWorker = () =>
  !isIE11() && !isSafari10() && !isSafari11() && !isSafari12_0();

/**
 * @ignore
 */
const getTokenIssuer = (issuer, domainUrl) => {
  if (issuer) {
    return issuer.startsWith('https://') ? issuer : `https://${issuer}/`;
  }
  return `${domainUrl}/`;
};

/**
 * @ignore
 */
const getCustomInitialOptions = (
  options: Auth0ClientOptions
): BaseLoginOptions => {
  const {
    advancedOptions,
    audience,
    auth0Client,
    authorizeTimeoutInSeconds,
    cacheLocation,
    client_id,
    domain,
    issuer,
    leeway,
    max_age,
    redirect_uri,
    scope,
    useRefreshTokens,
    ...customParams
  } = options;
  return customParams;
};

/**
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
export default class Auth0Client {
  private cache: ICache;
  private transactionManager: TransactionManager;
  private customOptions: BaseLoginOptions;
  private domainUrl: string;
  private tokenIssuer: string;
  private defaultScope: string;
  private scope: string;
  private cookieStorage: ClientStorage;
  private sessionCheckExpiryDays: number;

  cacheLocation: CacheLocation;
  private worker: Worker;

  constructor(private options: Auth0ClientOptions) {
    typeof window !== 'undefined' && validateCrypto();
    this.cacheLocation = options.cacheLocation || CACHE_LOCATION_MEMORY;

    this.cookieStorage =
      options.legacySameSiteCookie === false
        ? CookieStorage
        : CookieStorageWithLegacySameSite;

    this.sessionCheckExpiryDays =
      options.sessionCheckExpiryDays || DEFAULT_SESSION_CHECK_EXPIRY_DAYS;

    if (!cacheFactory(this.cacheLocation)) {
      throw new Error(`Invalid cache location "${this.cacheLocation}"`);
    }

    const transactionStorage = options.useCookiesForTransactions
      ? this.cookieStorage
      : SessionStorage;

    this.cache = cacheFactory(this.cacheLocation)();
    this.scope = this.options.scope;
    this.transactionManager = new TransactionManager(transactionStorage);
    this.domainUrl = `https://${this.options.domain}`;
    this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);

    this.defaultScope = getUniqueScopes(
      'openid',
      this.options?.advancedOptions?.defaultScope !== undefined
        ? this.options.advancedOptions.defaultScope
        : DEFAULT_SCOPE
    );

    // If using refresh tokens, automatically specify the `offline_access` scope.
    // Note we cannot add this to 'defaultScope' above as the scopes are used in the
    // cache keys - changing the order could invalidate the keys
    if (this.options.useRefreshTokens) {
      this.scope = getUniqueScopes(this.scope, 'offline_access');
    }

    // Don't use web workers unless using refresh tokens in memory and not IE11
    if (
      typeof window !== 'undefined' &&
      window.Worker &&
      this.options.useRefreshTokens &&
      this.cacheLocation === CACHE_LOCATION_MEMORY &&
      supportWebWorker()
    ) {
      this.worker = new TokenWorker();
    }

    this.customOptions = getCustomInitialOptions(options);
  }

  private _url(path) {
    const auth0Client = encodeURIComponent(
      btoa(
        JSON.stringify(
          this.options.auth0Client || {
            name: 'auth0-spa-js',
            version: version
          }
        )
      )
    );
    return `${this.domainUrl}${path}&auth0Client=${auth0Client}`;
  }

  private _getParams(
    authorizeOptions: BaseLoginOptions,
    state: string,
    nonce: string,
    code_challenge: string,
    redirect_uri: string
  ): AuthorizeOptions {
    const {
      domain,
      leeway,
      useRefreshTokens,
      auth0Client,
      cacheLocation,
      advancedOptions,
      ...withoutDomain
    } = this.options;

    return {
      ...withoutDomain,
      ...authorizeOptions,
      scope: getUniqueScopes(
        this.defaultScope,
        this.scope,
        authorizeOptions.scope
      ),
      response_type: 'code',
      response_mode: 'query',
      state,
      nonce,
      redirect_uri: redirect_uri || this.options.redirect_uri,
      code_challenge,
      code_challenge_method: 'S256'
    };
  }
  private _authorizeUrl(authorizeOptions: AuthorizeOptions) {
    return this._url(`/authorize?${createQueryParams(authorizeOptions)}`);
  }
  private _verifyIdToken(
    id_token: string,
    nonce?: string,
    organizationId?: string
  ) {
    return verifyIdToken({
      iss: this.tokenIssuer,
      aud: this.options.client_id,
      id_token,
      nonce,
      organizationId,
      leeway: this.options.leeway,
      max_age: this._parseNumber(this.options.max_age)
    });
  }
  private _parseNumber(value: any): number {
    if (typeof value !== 'string') {
      return value;
    }
    return parseInt(value, 10) || undefined;
  }

  /**
   * ```js
   * await auth0.buildAuthorizeUrl(options);
   * ```
   *
   * Builds an `/authorize` URL for loginWithRedirect using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options
   */

  public async buildAuthorizeUrl(
    options: RedirectLoginOptions = {}
  ): Promise<string> {
    const { redirect_uri, appState, ...authorizeOptions } = options;

    const stateIn = encode(createRandomString());
    const nonceIn = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    const fragment = options.fragment ? `#${options.fragment}` : '';

    const params = this._getParams(
      authorizeOptions,
      stateIn,
      nonceIn,
      code_challenge,
      redirect_uri
    );

    const url = this._authorizeUrl(params);
    const organizationId = options.organization || this.options.organization;

    this.transactionManager.create({
      nonce: nonceIn,
      code_verifier,
      appState,
      scope: params.scope,
      audience: params.audience || 'default',
      redirect_uri: params.redirect_uri,
      ...(organizationId && { organizationId })
    });

    return url + fragment;
  }

  /**
   * ```js
   * await auth0.loginWithPopup(options);
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
    options: PopupLoginOptions = {},
    config: PopupConfigOptions = {}
  ) {
    const { ...authorizeOptions } = options;
    const stateIn = encode(createRandomString());
    const nonceIn = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

    const params = this._getParams(
      authorizeOptions,
      stateIn,
      nonceIn,
      code_challenge,
      this.options.redirect_uri || window.location.origin
    );

    const url = this._authorizeUrl({
      ...params,
      response_mode: 'web_message'
    });

    const codeResult = await runPopup(url, {
      ...config,
      timeoutInSeconds:
        config.timeoutInSeconds ||
        this.options.authorizeTimeoutInSeconds ||
        DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
    });

    if (stateIn !== codeResult.state) {
      throw new Error('Invalid state');
    }

    const authResult = await oauthToken(
      {
        audience: params.audience,
        scope: params.scope,
        baseUrl: this.domainUrl,
        client_id: this.options.client_id,
        code_verifier,
        code: codeResult.code,
        grant_type: 'authorization_code',
        redirect_uri: params.redirect_uri
      } as OAuthTokenOptions,
      this.worker
    );

    const organizationId = options.organization || this.options.organization;

    const decodedToken = this._verifyIdToken(
      authResult.id_token,
      nonceIn,
      organizationId
    );

    const cacheEntry = {
      ...authResult,
      decodedToken,
      scope: params.scope,
      audience: params.audience || 'default',
      client_id: this.options.client_id
    };

    this.cache.save(cacheEntry);

    this.cookieStorage.save('auth0.is.authenticated', true, {
      daysUntilExpire: this.sessionCheckExpiryDays
    });
  }

  /**
   * ```js
   * const user = await auth0.getUser();
   * ```
   *
   * Returns the user information if available (decoded
   * from the `id_token`).
   *
   * @param options
   */
  public async getUser(options: GetUserOptions = {}) {
    const audience = options.audience || this.options.audience || 'default';
    const scope = getUniqueScopes(this.defaultScope, this.scope, options.scope);

    const cache = this.cache.get({
      client_id: this.options.client_id,
      audience,
      scope
    });

    return cache && cache.decodedToken && cache.decodedToken.user;
  }

  /**
   * ```js
   * const claims = await auth0.getIdTokenClaims();
   * ```
   *
   * Returns all claims from the id_token if available.
   *
   * @param options
   */
  public async getIdTokenClaims(options: GetIdTokenClaimsOptions = {}) {
    const audience = options.audience || this.options.audience || 'default';
    const scope = getUniqueScopes(this.defaultScope, this.scope, options.scope);

    const cache = this.cache.get({
      client_id: this.options.client_id,
      audience,
      scope
    });

    return cache && cache.decodedToken && cache.decodedToken.claims;
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
  public async loginWithRedirect(options: RedirectLoginOptions = {}) {
    const url = await this.buildAuthorizeUrl(options);
    window.location.assign(url);
  }

  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Auth0. If the response is successful, results
   * will be valid according to their expiration times.
   */
  public async handleRedirectCallback(
    url: string = window.location.href
  ): Promise<RedirectLoginResult> {
    const queryStringFragments = url.split('?').slice(1);

    if (queryStringFragments.length === 0) {
      throw new Error('There are no query params available for parsing.');
    }

    const { state, code, error, error_description } = parseQueryResult(
      queryStringFragments.join('')
    );

    const transaction = this.transactionManager.get();

    // Transaction should have a `code_verifier` to do PKCE and a `nonce` for CSRF protection
    if (!transaction || !transaction.code_verifier || !transaction.nonce) {
      throw new Error('Invalid state');
    }

    this.transactionManager.remove();

    if (error) {
      throw new AuthenticationError(
        error,
        error_description,
        state,
        transaction.appState
      );
    }

    const tokenOptions = {
      audience: transaction.audience,
      scope: transaction.scope,
      baseUrl: this.domainUrl,
      client_id: this.options.client_id,
      code_verifier: transaction.code_verifier,
      grant_type: 'authorization_code',
      code
    } as OAuthTokenOptions;

    // some old versions of the SDK might not have added redirect_uri to the
    // transaction, we dont want the key to be set to undefined.
    if (undefined !== transaction.redirect_uri) {
      tokenOptions.redirect_uri = transaction.redirect_uri;
    }

    const authResult = await oauthToken(tokenOptions, this.worker);

    const decodedToken = this._verifyIdToken(
      authResult.id_token,
      transaction.nonce,
      transaction.organizationId
    );

    const cacheEntry = {
      ...authResult,
      decodedToken,
      audience: transaction.audience,
      scope: transaction.scope,
      client_id: this.options.client_id
    };

    this.cache.save(cacheEntry);

    this.cookieStorage.save('auth0.is.authenticated', true, {
      daysUntilExpire: this.sessionCheckExpiryDays
    });

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
   * It should be used for silently logging in the user when you instantiate the
   * `Auth0Client` constructor. You should not need this if you are using the
   * `createAuth0Client` factory.
   *
   * @param options
   */
  public async checkSession(options?: GetTokenSilentlyOptions) {
    if (!this.cookieStorage.get('auth0.is.authenticated')) {
      return;
    }

    try {
      await this.getTokenSilently(options);
    } catch (error) {
      if (!RECOVERABLE_ERRORS.includes(error.error)) {
        throw error;
      }
    }
  }

  /**
   * ```js
   * const token = await auth0.getTokenSilently(options);
   * ```
   *
   * If there's a valid token stored, return it. Otherwise, opens an
   * iframe with the `/authorize` URL using the parameters provided
   * as arguments. Random and secure `state` and `nonce` parameters
   * will be auto-generated. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * If refresh tokens are used, the token endpoint is called directly with the
   * 'refresh_token' grant. If no refresh token is available to make this call,
   * the SDK falls back to using an iframe to the '/authorize' URL.
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
  public async getTokenSilently(options: GetTokenSilentlyOptions = {}) {
    const { ignoreCache, ...getTokenOptions } = {
      audience: this.options.audience,
      ignoreCache: false,
      ...options,
      scope: getUniqueScopes(this.defaultScope, this.scope, options.scope)
    };

    const getAccessTokenFromCache = () => {
      const cache = this.cache.get(
        {
          scope: getTokenOptions.scope,
          audience: getTokenOptions.audience || 'default',
          client_id: this.options.client_id
        },
        60 // get a new token if within 60 seconds of expiring
      );

      return cache && cache.access_token;
    };

    // Check the cache before acquiring the lock to avoid the latency of
    // `lock.acquireLock` when the cache is populated.
    if (!ignoreCache) {
      let accessToken = getAccessTokenFromCache();
      if (accessToken) {
        return accessToken;
      }
    }

    try {
      await lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000);
      // Check the cache a second time, because it may have been populated
      // by a previous call while this call was waiting to acquire the lock.
      if (!ignoreCache) {
        let accessToken = getAccessTokenFromCache();
        if (accessToken) {
          return accessToken;
        }
      }

      const authResult = this.options.useRefreshTokens
        ? await this._getTokenUsingRefreshToken(getTokenOptions)
        : await this._getTokenFromIFrame(getTokenOptions);

      this.cache.save({ client_id: this.options.client_id, ...authResult });

      this.cookieStorage.save('auth0.is.authenticated', true, {
        daysUntilExpire: this.sessionCheckExpiryDays
      });

      return authResult.access_token;
    } catch (e) {
      throw e;
    } finally {
      await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
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
    options.audience = options.audience || this.options.audience;
    options.scope = getUniqueScopes(
      this.defaultScope,
      this.scope,
      options.scope
    );
    config = {
      ...DEFAULT_POPUP_CONFIG_OPTIONS,
      ...config
    };

    await this.loginWithPopup(options, config);

    const cache = this.cache.get({
      scope: options.scope,
      audience: options.audience || 'default',
      client_id: this.options.client_id
    });

    return cache.access_token;
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
  public buildLogoutUrl(options: LogoutUrlOptions = {}): string {
    if (options.client_id !== null) {
      options.client_id = options.client_id || this.options.client_id;
    } else {
      delete options.client_id;
    }

    const { federated, ...logoutOptions } = options;
    const federatedQuery = federated ? `&federated` : '';
    const url = this._url(`/v2/logout?${createQueryParams(logoutOptions)}`);

    return url + federatedQuery;
  }

  /**
   * ```js
   * auth0.logout();
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the Auth0 session.
   * If the `federated` option is specified it also clears the Identity Provider session.
   * If the `localOnly` option is specified, it only clears the application session.
   * It is invalid to set both the `federated` and `localOnly` options to `true`,
   * and an error will be thrown if you do.
   * [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
   *
   * @param options
   */
  public logout(options: LogoutOptions = {}) {
    const { localOnly, ...logoutOptions } = options;

    if (localOnly && logoutOptions.federated) {
      throw new Error(
        'It is invalid to set both the `federated` and `localOnly` options to `true`'
      );
    }

    this.cache.clear();
    this.cookieStorage.remove('auth0.is.authenticated');

    if (localOnly) {
      return;
    }
    const url = this.buildLogoutUrl(logoutOptions);
    window.location.assign(url);
  }

  private async _getTokenFromIFrame(
    options: GetTokenSilentlyOptions
  ): Promise<any> {
    const stateIn = encode(createRandomString());
    const nonceIn = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

    const params = this._getParams(
      options,
      stateIn,
      nonceIn,
      code_challenge,
      options.redirect_uri ||
        this.options.redirect_uri ||
        window.location.origin
    );

    const url = this._authorizeUrl({
      ...params,
      prompt: 'none',
      response_mode: 'web_message'
    });

    const timeout =
      options.timeoutInSeconds || this.options.authorizeTimeoutInSeconds;
    const codeResult = await runIframe(url, this.domainUrl, timeout);

    if (stateIn !== codeResult.state) {
      throw new Error('Invalid state');
    }

    const {
      scope,
      audience,
      redirect_uri,
      ignoreCache,
      timeoutInSeconds,
      ...customOptions
    } = options;

    const tokenResult = await oauthToken(
      {
        ...this.customOptions,
        ...customOptions,
        scope,
        audience,
        baseUrl: this.domainUrl,
        client_id: this.options.client_id,
        code_verifier,
        code: codeResult.code,
        grant_type: 'authorization_code',
        redirect_uri: params.redirect_uri
      } as OAuthTokenOptions,
      this.worker
    );

    const decodedToken = this._verifyIdToken(tokenResult.id_token, nonceIn);

    return {
      ...tokenResult,
      decodedToken,
      scope: params.scope,
      audience: params.audience || 'default'
    };
  }

  private async _getTokenUsingRefreshToken(
    options: GetTokenSilentlyOptions
  ): Promise<any> {
    options.scope = getUniqueScopes(
      this.defaultScope,
      this.options.scope,
      options.scope
    );

    const cache = this.cache.get({
      scope: options.scope,
      audience: options.audience || 'default',
      client_id: this.options.client_id
    });

    // If you don't have a refresh token in memory
    // and you don't have a refresh token in web worker memory
    // fallback to an iframe.
    if ((!cache || !cache.refresh_token) && !this.worker) {
      return await this._getTokenFromIFrame(options);
    }

    const redirect_uri =
      options.redirect_uri ||
      this.options.redirect_uri ||
      window.location.origin;

    let tokenResult;

    const {
      scope,
      audience,
      ignoreCache,
      timeoutInSeconds,
      ...customOptions
    } = options;

    const timeout =
      typeof options.timeoutInSeconds === 'number'
        ? options.timeoutInSeconds * 1000
        : null;

    try {
      tokenResult = await oauthToken(
        {
          ...this.customOptions,
          ...customOptions,
          audience,
          scope,
          baseUrl: this.domainUrl,
          client_id: this.options.client_id,
          grant_type: 'refresh_token',
          refresh_token: cache && cache.refresh_token,
          redirect_uri,
          ...(timeout && { timeout })
        } as RefreshTokenOptions,
        this.worker
      );
    } catch (e) {
      // The web worker didn't have a refresh token in memory so
      // fallback to an iframe.
      if (e.message === MISSING_REFRESH_TOKEN_ERROR_MESSAGE) {
        return await this._getTokenFromIFrame(options);
      }
      throw e;
    }

    const decodedToken = this._verifyIdToken(tokenResult.id_token);

    return {
      ...tokenResult,
      decodedToken,
      scope: options.scope,
      audience: options.audience || 'default'
    };
  }
}
