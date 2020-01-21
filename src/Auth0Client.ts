import Lock from 'browser-tabs-lock';

import {
  getUniqueScopes,
  createQueryParams,
  runPopup,
  parseQueryResult,
  encodeState,
  createRandomString,
  runIframe,
  sha256,
  bufferToBase64UrlEncoded,
  oauthToken,
  openPopup
} from './utils';

import Cache from './cache';
import TransactionManager from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import { AuthenticationError } from './errors';
import * as ClientStorage from './storage';
import { DEFAULT_POPUP_CONFIG_OPTIONS } from './constants';
import version from './version';

const lock = new Lock();
const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

/**
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
export default class Auth0Client {
  private cache: Cache;
  private transactionManager: TransactionManager;
  private domainUrl: string;
  private tokenIssuer: string;
  private readonly DEFAULT_SCOPE = 'openid profile email';

  constructor(private options: Auth0ClientOptions) {
    this.cache = new Cache();
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
    const { domain, leeway, ...withoutDomain } = this.options;
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
    const stateIn = encodeState(createRandomString());
    const nonceIn = createRandomString();
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
    config: PopupConfigOptions = DEFAULT_POPUP_CONFIG_OPTIONS
  ) {
    const popup = await openPopup();
    const { ...authorizeOptions } = options;
    const stateIn = encodeState(createRandomString());
    const nonceIn = createRandomString();
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
    const codeResult = await runPopup(popup, url, config);
    if (stateIn !== codeResult.state) {
      throw new Error('Invalid state');
    }
    const authResult = await oauthToken({
      baseUrl: this.domainUrl,
      audience: options.audience || this.options.audience,
      client_id: this.options.client_id,
      code_verifier,
      code: codeResult.code,
      redirect_uri: params.redirect_uri
    });
    const decodedToken = this._verifyIdToken(authResult.id_token, nonceIn);
    const cacheEntry = {
      ...authResult,
      decodedToken,
      scope: params.scope,
      audience: params.audience || 'default'
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
    const cache = this.cache.get(options);
    return cache && cache.decodedToken.user;
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
    options: getIdTokenClaimsOptions = {
      audience: this.options.audience || 'default',
      scope: this.options.scope || this.DEFAULT_SCOPE
    }
  ) {
    options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);
    const cache = this.cache.get(options);
    return cache && cache.decodedToken.claims;
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

    if (error) {
      this.transactionManager.remove(state);
      throw new AuthenticationError(error, error_description, state);
    }

    const transaction = this.transactionManager.get(state);
    if (!transaction) {
      throw new Error('Invalid state');
    }
    this.transactionManager.remove(state);

    const authResult = await oauthToken({
      baseUrl: this.domainUrl,
      audience: this.options.audience,
      client_id: this.options.client_id,
      code_verifier: transaction.code_verifier,
      code,
      redirect_uri: transaction.redirect_uri
    });

    const decodedToken = this._verifyIdToken(
      authResult.id_token,
      transaction.nonce
    );
    const cacheEntry = {
      ...authResult,
      decodedToken,
      audience: transaction.audience,
      scope: transaction.scope
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
  public async getTokenSilently(
    options: GetTokenSilentlyOptions = {
      audience: this.options.audience,
      scope: this.options.scope || this.DEFAULT_SCOPE,
      ignoreCache: false
    }
  ) {
    options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);

    try {
      const {
        audience,
        scope,
        ignoreCache,
        ...additionalQueryParams
      } = options;

      if (!ignoreCache) {
        const cache = this.cache.get({
          scope,
          audience: audience || 'default'
        });

        if (cache) {
          return cache.access_token;
        }
      }

      await lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000);

      const stateIn = encodeState(createRandomString());
      const nonceIn = createRandomString();
      const code_verifier = createRandomString();
      const code_challengeBuffer = await sha256(code_verifier);
      const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

      const authorizeOptions = {
        audience,
        scope,
        ...additionalQueryParams
      };

      const params = this._getParams(
        authorizeOptions,
        stateIn,
        nonceIn,
        code_challenge,
        this.options.redirect_uri || window.location.origin
      );

      const url = this._authorizeUrl({
        ...params,
        prompt: 'none',
        response_mode: 'web_message'
      });

      const codeResult = await runIframe(url, this.domainUrl);

      if (stateIn !== codeResult.state) {
        throw new Error('Invalid state');
      }

      const authResult = await oauthToken({
        baseUrl: this.domainUrl,
        audience: options.audience || this.options.audience,
        client_id: this.options.client_id,
        code_verifier,
        code: codeResult.code,
        redirect_uri: params.redirect_uri
      });

      const decodedToken = this._verifyIdToken(authResult.id_token, nonceIn);

      const cacheEntry = {
        ...authResult,
        decodedToken,
        scope: params.scope,
        audience: params.audience || 'default'
      };

      this.cache.save(cacheEntry);

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
      audience: options.audience || 'default'
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
   * Performs a redirect to `/v2/logout` using the parameters provided
   * as arguments. [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
   *
   * @param options
   */
  public logout(options: LogoutOptions = {}) {
    if (options.client_id !== null) {
      options.client_id = options.client_id || this.options.client_id;
    } else {
      delete options.client_id;
    }
    ClientStorage.remove('auth0.is.authenticated');
    const { federated, ...logoutOptions } = options;
    const federatedQuery = federated ? `&federated` : '';
    const url = this._url(`/v2/logout?${createQueryParams(logoutOptions)}`);
    window.location.assign(`${url}${federatedQuery}`);
  }
}
