/**
 * @ignore
 */
interface BaseLoginOptions {
  display?: 'page' | 'popup' | 'touch' | 'wap';
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  max_age?: string;
  ui_locales?: string;
  id_token_hint?: string;
  login_hint?: string;
  acr_values?: string;
  /**
   * The default scope to be used on authentication requests.
   */
  scope?: string;
  /**
   * The default audience to be used for requesting API access.
   */
  audience?: string;
}

interface Auth0ClientOptions extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain: string;
  /**
   * The Client ID found on your Application settings page
   */
  client_id: string;
  /**
   * The default URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" in your Auth0 Application's
   * settings. If not provided here, should be provided in the other
   * methods that provide authentication.
   */
  redirect_uri?: string;
  leeway?: number;
}

/**
 * @ignore
 */
interface AuthorizeOptions extends BaseLoginOptions {
  response_type: string;
  response_mode: string;
  redirect_uri: string;
  nonce: string;
  state: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
}

interface RedirectLoginOptions extends BaseLoginOptions {
  /**
   * The URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" in your Auth0 Application's
   * settings.
   */
  redirect_uri: string;
  /**
   * Used to store state before doing the redirect
   */
  appState?: any;
}

interface RedirectLoginResult {
  /**
   * State stored when the redirect request was made
   */
  appState?: any;
}

interface PopupLoginOptions extends BaseLoginOptions {}

interface GetUserOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope: string;
  /**
   * The audience that was used in the authentication request
   */
  audience: string;
}

interface getIdTokenClaimsOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope: string;
  /**
   * The audience that was used in the authentication request
   */
  audience: string;
}

interface GetTokenSilentlyOptions extends GetUserOptions {
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
}
interface GetTokenWithPopupOptions extends PopupLoginOptions {}

interface LogoutOptions {
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
}

/**
 * @ignore
 */
interface AuthenticationResult {
  state: string;
  code: string;
}

/**
 * @ignore
 */
interface OAuthTokenOptions {
  baseUrl: string;
  client_id: string;
  audience?: string;
  code_verifier: string;
  code: string;
}

/**
 * @ignore
 */
interface JWTVerifyOptions {
  iss: string;
  aud: string;
  id_token: string;
  nonce?: string;
  leeway?: number;
}

/**
 * @ignore
 */
interface IdToken {
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
}
