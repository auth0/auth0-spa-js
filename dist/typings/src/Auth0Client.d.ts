/**
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
export default class Auth0Client {
  private options;
  private cache;
  private transactionManager;
  private domainUrl;
  private tokenIssuer;
  private readonly DEFAULT_SCOPE;
  constructor(options: Auth0ClientOptions);
  private _url;
  private _getParams;
  private _authorizeUrl;
  private _verifyIdToken;
  private _parseNumber;
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
  buildAuthorizeUrl(options?: RedirectLoginOptions): Promise<string>;
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
  loginWithPopup(
    options?: PopupLoginOptions,
    config?: PopupConfigOptions
  ): Promise<void>;
  /**
   * ```js
   * const user = await auth0.getIdToken();
   * ```
   *
   * Returns the id_token if available.
   *
   * @param options
   */
  getIdToken(options?: GetUserOptions): Promise<string>;
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
  getUser(options?: GetUserOptions): Promise<any>;
  /**
   * ```js
   * const claims = await auth0.getIdTokenClaims();
   * ```
   *
   * Returns all claims from the id_token if available.
   *
   * @param options
   */
  getIdTokenClaims(options?: getIdTokenClaimsOptions): Promise<IdToken>;
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
  loginWithRedirect(options?: RedirectLoginOptions): Promise<void>;
  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Auth0. If the response is successful, results
   * will be valid according to their expiration times.
   */
  handleRedirectCallback(url?: string): Promise<RedirectLoginResult>;
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
  getTokenSilently(options?: GetTokenSilentlyOptions): Promise<any>;
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
  getTokenWithPopup(
    options?: GetTokenWithPopupOptions,
    config?: PopupConfigOptions
  ): Promise<string>;
  /**
   * ```js
   * const isAuthenticated = await auth0.isAuthenticated();
   * ```
   *
   * Returns `true` if there's valid information stored,
   * otherwise returns `false`.
   *
   */
  isAuthenticated(): Promise<boolean>;
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
  logout(options?: LogoutOptions): void;
}
