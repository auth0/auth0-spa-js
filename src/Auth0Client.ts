import Lock from 'browser-tabs-lock';

import {
  getUniqueScopes,
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

import { InMemoryCache, ICache, LocalStorageCache } from './cache';
import TransactionManager from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import { AuthenticationError, GenericError } from './errors';
import * as ClientStorage from './storage';
import {
  DEFAULT_POPUP_CONFIG_OPTIONS,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
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
  CacheLocation
} from './global';

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
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
export default class Auth0Client {
  private cache: ICache;
  private transactionManager: TransactionManager;
  private domainUrl: string;
  private tokenIssuer: string;
  private readonly DEFAULT_SCOPE = 'openid profile email';

  cacheLocation: CacheLocation;

  constructor(private options: Auth0ClientOptions) {
    validateCrypto();
    this.cacheLocation = options.cacheLocation || 'memory';

    if (!cacheFactory(this.cacheLocation)) {
      throw new Error(`Invalid cache location "${this.cacheLocation}"`);
    }

    this.cache = cacheFactory(this.cacheLocation)();

    this.transactionManager = new TransactionManager();
    this.domainUrl = `https://${this.options.domain}`;

    this.tokenIssuer = this.options.issuer
      ? `https://${this.options.issuer}/`
      : `${this.domainUrl}/`;
  }

  private _url(path) {
    const telemetry = encodeURIComponent(
      btoa(
        JSON.stringify({
          name: 'auth0-spa-js',
          version: version
        })
      )
    );
    return `${this.domainUrl}${path}&auth0Client=${telemetry}`;
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
      cacheLocation,
      ...withoutDomain
    } = this.options;

    return {
      ...withoutDomain,
      ...authorizeOptions,
      scope: getUniqueScopes(
        this.DEFAULT_SCOPE,
        this.options.scope,
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
  private _verifyIdToken(id_token: string, nonce?: string) {
    return verifyIdToken({
      iss: this.tokenIssuer,
      aud: this.options.client_id,
      id_token,
      nonce,
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

    this.transactionManager.create(stateIn, {
      nonce: nonceIn,
      code_verifier,
      appState,
      scope: params.scope,
      audience: params.audience || 'default',
      redirect_uri: params.redirect_uri
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

    const authResult = await oauthToken({
      baseUrl: this.domainUrl,
      client_id: this.options.client_id,
      code_verifier,
      code: codeResult.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirect_uri
    } as OAuthTokenOptions);

    const decodedToken = this._verifyIdToken(authResult.id_token, nonceIn);

    const cacheEntry = {
      ...authResult,
      decodedToken,
      scope: params.scope,
      audience: params.audience || 'default',
      client_id: this.options.client_id
    };

    this.cache.save(cacheEntry);

    ClientStorage.save('auth0.is.authenticated', true, { daysUntilExpire: 1 });
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
  public async getUser(
    options: GetUserOptions = {
      audience: this.options.audience || 'default',
      scope: this.options.scope || this.DEFAULT_SCOPE
    }
  ) {
    options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);

    const cache = this.cache.get({
      client_id: this.options.client_id,
      ...options
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
  public async getIdTokenClaims(
    options: GetIdTokenClaimsOptions = {
      audience: this.options.audience || 'default',
      scope: this.options.scope || this.DEFAULT_SCOPE
    }
  ) {
    options.scope = getUniqueScopes(
      this.DEFAULT_SCOPE,
      this.options.scope,
      options.scope
    );

    const cache = this.cache.get({
      client_id: this.options.client_id,
      ...options
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

    const transaction = this.transactionManager.get(state);

    if (!transaction) {
      throw new Error('Invalid state');
    }

    if (error) {
      this.transactionManager.remove(state);

      throw new AuthenticationError(
        error,
        error_description,
        state,
        transaction.appState
      );
    }

    this.transactionManager.remove(state);

    const tokenOptions = {
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

    const authResult = await oauthToken(tokenOptions);

    const decodedToken = this._verifyIdToken(
      authResult.id_token,
      transaction.nonce
    );

    const cacheEntry = {
      ...authResult,
      decodedToken,
      audience: transaction.audience,
      scope: transaction.scope,
      client_id: this.options.client_id
    };

    this.cache.save(cacheEntry);

    ClientStorage.save('auth0.is.authenticated', true, { daysUntilExpire: 1 });

    return {
      appState: transaction.appState
    };
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
   * @param options
   */
  public async getTokenSilently(options: GetTokenSilentlyOptions = {}) {
    const { ignoreCache, ...getTokenOptions } = {
      audience: this.options.audience,
      scope: getUniqueScopes(
        this.DEFAULT_SCOPE,
        this.options.scope,
        options.scope
      ),
      ignoreCache: false,
      ...options
    };

    try {
      if (!ignoreCache) {
        const cache = this.cache.get({
          scope: getTokenOptions.scope,
          audience: getTokenOptions.audience || 'default',
          client_id: this.options.client_id
        });

        if (cache && cache.access_token) {
          return cache.access_token;
        }
      }

      await lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000);

      const authResult = this.options.useRefreshTokens
        ? await this._getTokenUsingRefreshToken(getTokenOptions)
        : await this._getTokenFromIFrame(getTokenOptions);

      this.cache.save({ client_id: this.options.client_id, ...authResult });

      ClientStorage.save('auth0.is.authenticated', true, {
        daysUntilExpire: 1
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
   */
  public async getTokenWithPopup(
    options: GetTokenWithPopupOptions = {
      audience: this.options.audience,
      scope: this.options.scope || this.DEFAULT_SCOPE
    },
    config: PopupConfigOptions = DEFAULT_POPUP_CONFIG_OPTIONS
  ) {
    options.scope = getUniqueScopes(
      this.DEFAULT_SCOPE,
      this.options.scope,
      options.scope
    );

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
    if (options.client_id !== null) {
      options.client_id = options.client_id || this.options.client_id;
    } else {
      delete options.client_id;
    }

    const { federated, localOnly, ...logoutOptions } = options;

    if (localOnly && federated) {
      throw new Error(
        'It is invalid to set both the `federated` and `localOnly` options to `true`'
      );
    }

    this.cache.clear();
    ClientStorage.remove('auth0.is.authenticated');

    if (localOnly) {
      return;
    }

    const federatedQuery = federated ? `&federated` : '';
    const url = this._url(`/v2/logout?${createQueryParams(logoutOptions)}`);

    window.location.assign(`${url}${federatedQuery}`);
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

    const tokenResult = await oauthToken({
      baseUrl: this.domainUrl,
      client_id: this.options.client_id,
      code_verifier,
      code: codeResult.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirect_uri
    } as OAuthTokenOptions);

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
      this.DEFAULT_SCOPE,
      this.options.scope,
      options.scope
    );

    const cache = this.cache.get({
      scope: options.scope,
      audience: options.audience || 'default',
      client_id: this.options.client_id
    });

    if (!cache || !cache.refresh_token) {
      return await this._getTokenFromIFrame(options);
    }

    const redirect_uri =
      options.redirect_uri ||
      this.options.redirect_uri ||
      window.location.origin;

    const tokenResult = await oauthToken({
      baseUrl: this.domainUrl,
      client_id: this.options.client_id,
      grant_type: 'refresh_token',
      refresh_token: cache.refresh_token,
      redirect_uri
    } as RefreshTokenOptions);

    const decodedToken = this._verifyIdToken(tokenResult.id_token);

    return {
      ...tokenResult,
      decodedToken,
      scope: options.scope,
      audience: options.audience || 'default'
    };
  }
}
