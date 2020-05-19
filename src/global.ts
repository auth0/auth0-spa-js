/**
 * @ignore
 */
export interface BaseLoginOptions {
  /**
   * - `'page'`: displays the UI with a full page view
   * - `'popup'`: displays the UI with a popup window
   * - `'touch'`: displays the UI in a way that leverages a touch interface
   * - `'wap'`: displays the UI with a "feature phone" type interface
   */
  display?: 'page' | 'popup' | 'touch' | 'wap';
  /**
   * - `'none'`: do not prompt user for login or consent on reauthentication
   * - `'login'`: prompt user for reauthentication
   * - `'consent'`: prompt user for consent before processing request
   * - `'select_account'`: prompt user to select an account
   */
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  /**
   * Maximum allowable elasped time (in seconds) since authentication.
   * If the last time the user authenticated is greater than this value,
   * the user must be reauthenticated.
   */
  max_age?: string | number;
  /**
   * The space-separated list of language tags, ordered by preference.
   * For example: `'fr-CA fr en'`.
   */
  ui_locales?: string;
  /**
   * Previously issued ID Token.
   */
  id_token_hint?: string;
  /**
   * The user's email address or other identifier. When your app knows
   * which user is trying to authenticate, you can provide this parameter
   * to pre-fill the email box or select the right session for sign-in.
   *
   * This currently only affects the classic Lock experience.
   */
  login_hint?: string;
  acr_values?: string;
  /**
   * The default scope to be used on authentication requests.
   * The defaultScope defined in the Auth0Client is included
   * along with this scope
   */
  scope?: string;
  /**
   * The default audience to be used for requesting API access.
   */
  audience?: string;
  /**
   * The name of the connection configured for your application.
   * If null, it will redirect to the Auth0 Login Page and show
   * the Login Widget.
   */
  connection?: string;

  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  [key: string]: any;
}

interface AdvancedOptions {
  /**
   * The default scope to be included with all requests.
   * If not provided, 'openid profile email' is used. This can be set to `null` in order to effectively remove the default scopes.
   *
   * Note: The `openid` scope is **always applied** regardless of this setting.
   */
  defaultScope?: string;
}

export interface Auth0ClientOptions extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain: string;
  /**
   * The issuer to be used for validation of JWTs, optionally defaults to the domain above
   */
  issuer?: string;
  /**
   * The Client ID found on your Application settings page
   */
  client_id: string;
  /**
   * The default URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" field in your Auth0 Application's
   * settings. If not provided here, it should be provided in the other
   * methods that provide authentication.
   */
  redirect_uri?: string;
  /**
   * The value in seconds used to account for clock skew in JWT expirations.
   * Typically, this value is no more than a minute or two at maximum.
   * Defaults to 60s.
   */
  leeway?: number;

  /**
   * The location to use when storing cache data. Valid values are `memory` or `localstorage`.
   * The default setting is `memory`.
   */
  cacheLocation?: CacheLocation;

  /**
   * If true, refresh tokens are used to fetch new access tokens from the Auth0 server. If false, the legacy technique of using a hidden iframe and the `authorization_code` grant with `prompt=none` is used.
   * The default setting is `false`.
   *
   * **Note**: Use of refresh tokens must be enabled by an administrator on your Auth0 client application.
   */
  useRefreshTokens?: boolean;

  /**
   * A maximum number of seconds to wait before declaring background calls to /authorize as failed for timeout
   * Defaults to 60s.
   */
  authorizeTimeoutInSeconds?: number;

  /**
   * Changes to recommended defaults, like defaultScope
   */
  advancedOptions?: AdvancedOptions;
}

/**
 * The possible locations where tokens can be stored
 */
export type CacheLocation = 'memory' | 'localstorage';

/**
 * @ignore
 */
export interface AuthorizeOptions extends BaseLoginOptions {
  response_type: string;
  response_mode: string;
  redirect_uri: string;
  nonce: string;
  state: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
}

export interface RedirectLoginOptions extends BaseLoginOptions {
  /**
   * The URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" field in your Auth0 Application's
   * settings.
   */
  redirect_uri?: string;
  /**
   * Used to store state before doing the redirect
   */
  appState?: any;
  /**
   * Used to add to the URL fragment before redirecting
   */
  fragment?: string;
}

export interface RedirectLoginResult {
  /**
   * State stored when the redirect request was made
   */
  appState?: any;
}

export interface PopupLoginOptions extends BaseLoginOptions {}

export interface PopupConfigOptions {
  /**
   * The number of seconds to wait for a popup response before
   * throwing a timeout error. Defaults to 60s
   */
  timeoutInSeconds?: number;

  /**
   * Accepts an already-created popup window to use. If not specified, the SDK
   * will create its own. This may be useful for platforms like iOS that have
   * security restrictions around when popups can be invoked (e.g. from a user click event)
   */
  popup?: any;
}

export interface GetUserOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope: string;
  /**
   * The audience that was used in the authentication request
   */
  audience: string;
}

export interface GetIdTokenClaimsOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope: string;
  /**
   * The audience that was used in the authentication request
   */
  audience: string;
}

/*
 * TODO: Remove this on the next major
 */
export type getIdTokenClaimsOptions = GetIdTokenClaimsOptions;

export interface GetTokenSilentlyOptions {
  /**
   * When `true`, ignores the cache and always sends a
   * request to Auth0.
   */
  ignoreCache?: boolean;

  /**
   * There's no actual redirect when getting a token silently,
   * but, according to the spec, a `redirect_uri` param is required.
   * Auth0 uses this parameter to validate that the current `origin`
   * matches the `redirect_uri` `origin` when sending the response.
   * It must be whitelisted in the "Allowed Web Origins" in your
   * Auth0 Application's settings.
   */
  redirect_uri?: string;

  /**
   * The scope that was used in the authentication request
   */
  scope?: string;

  /**
   * The audience that was used in the authentication request
   */
  audience?: string;

  /** A maximum number of seconds to wait before declaring the background /authorize call as failed for timeout
   * Defaults to 60s.
   */
  timeoutInSeconds?: number;

  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  [key: string]: any;
}

export interface GetTokenWithPopupOptions extends PopupLoginOptions {}

export interface LogoutOptions {
  /**
   * The URL where Auth0 will redirect your browser to after the logout.
   *
   * > Note that if the `client_id` parameter is included, the
   * `returnTo` URL that is provided must be listed in the
   * Application's "Allowed Logout URLs" in the Auth0 dashboard.
   * However, if the `client_id` parameter is not included, the
   * `returnTo` URL must be listed in the "Allowed Logout URLs" at
   * the account level in the Auth0 dashboard.
   */
  returnTo?: string;

  /**
   * The `client_id` of your application.
   */
  client_id?: string;

  /**
   * When supported by the upstream identity provider,
   * forces the user to logout of their identity provider
   * and from Auth0.
   * This option cannot be specified along with the `localOnly` option.
   * [Read more about how federated logout works at Auth0](https://auth0.com/docs/logout/guides/logout-idps)
   */
  federated?: boolean;

  /**
   * When `true`, this skips the request to the logout endpoint on the authorization server,
   * effectively performing a "local" logout of the application. No redirect should take place,
   * you should update local logged in state.
   * This option cannot be specified along with the `federated` option.
   */
  localOnly?: boolean;
}

/**
 * @ignore
 */
export interface AuthenticationResult {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
}

/**
 * @ignore
 */
export interface TokenEndpointOptions {
  baseUrl: string;
  client_id: string;
  grant_type: string;
  timeout?: number;
  [key: string]: any;
}

/**
 * @ignore
 */
export interface OAuthTokenOptions extends TokenEndpointOptions {
  code_verifier: string;
  code: string;
  redirect_uri: string;
}

/**
 * @ignore
 */
export interface RefreshTokenOptions extends TokenEndpointOptions {
  refresh_token: string;
}

/**
 * @ignore
 */
export interface JWTVerifyOptions {
  iss: string;
  aud: string;
  id_token: string;
  nonce?: string;
  leeway?: number;
  max_age?: number;
}

/**
 * @ignore
 */
export interface IdToken {
  __raw: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: string;
  updated_at?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  azp?: string;
  nonce?: string;
  auth_time?: string;
  at_hash?: string;
  c_hash?: string;
  acr?: string;
  amr?: string;
  sub_jwk?: string;
  cnf?: string;
  sid?: string;
  [key: string]: any;
}
