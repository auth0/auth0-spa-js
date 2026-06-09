import { Auth0Client } from './Auth0Client';
import { Auth0ClientOptions } from './global';

import './global';

export * from './global';

/**
 * Online access requires DPoP and is incompatible with `useRefreshTokens` (which
 * requests `offline_access`). When `onlineAccess` is the literal `true`, the compiler
 * requires `useDpop: true` and forbids `useRefreshTokens`. This only narrows on a literal
 * `true`; dynamic values, casts, and plain JS are covered by the runtime check in the
 * `Auth0Client` constructor.
 */
export async function createAuth0Client(
  options: Auth0ClientOptions & {
    onlineAccess: true;
    useDpop: true;
    useRefreshTokens?: never;
  }
): Promise<Auth0Client>;
export async function createAuth0Client(
  options: Auth0ClientOptions & { onlineAccess?: false }
): Promise<Auth0Client>;
/**
 * Asynchronously creates the Auth0Client instance and calls `checkSession`.
 *
 * **Note:** There are caveats to using this in a private browser tab, which may not silently authenticate
 * a user on page refresh. Please see [the checkSession docs](https://auth0.github.io/auth0-spa-js/classes/Auth0Client.html#checksession) for more info.
 *
 * @param options The client options
 * @returns An instance of Auth0Client
 */
export async function createAuth0Client(options: Auth0ClientOptions) {
  const auth0 = new Auth0Client(options);
  await auth0.checkSession();
  return auth0;
}

export { Auth0Client };

export {
  ConnectError,
  GenericError,
  InvalidConfigurationError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError,
  PopupOpenError,
  MfaRequiredError,
  MissingRefreshTokenError,
  UseDpopNonceError
} from './errors';

export {
  MfaError,
  MfaListAuthenticatorsError,
  MfaEnrollmentError,
  MfaChallengeError,
  MfaVerifyError,
  MfaEnrollmentFactorsError
} from './mfa/errors';

export { MfaApiClient } from './mfa';

export type {
  MfaFactorType,
  EnrollParams,
  EnrollOtpParams,
  EnrollSmsParams,
  EnrollVoiceParams,
  EnrollEmailParams,
  EnrollPushParams,
  VerifyParams
} from './mfa';

export {
  LocalStorageCache,
  InMemoryCache,
  CacheKey
} from './cache';

export type {
  ICache,
  Cacheable,
  DecodedToken,
  CacheEntry,
  WrappedCacheEntry,
  KeyManifestEntry,
  MaybePromise,
  CacheKeyData
} from './cache';

export type {
  FetcherConfig,
  Fetcher,
  CustomFetchMinimalOutput
} from './fetcher';

export { MyAccountApiClient, MyAccountApiError } from './myaccount';
export type {
  ConnectRequest,
  ConnectResponse,
  CompleteRequest,
  CompleteResponse,
  ErrorResponse,
  Factor,
  AuthenticationMethodType,
  AuthenticationMethod,
  PasskeyAuthenticationMethod,
  WebAuthnPlatformAuthenticationMethod,
  WebAuthnRoamingAuthenticationMethod,
  PhoneAuthenticationMethod,
  EmailAuthenticationMethod,
  PasswordAuthenticationMethod,
  TotpAuthenticationMethod,
  PushNotificationAuthenticationMethod,
  RecoveryCodeAuthenticationMethod,
  UpdateAuthenticationMethodRequest,
  EnrollmentChallengeOptions,
  PasskeyEnrollmentChallengeOptions,
  PhoneEnrollmentChallengeOptions,
  EmailEnrollmentChallengeOptions,
  TotpEnrollmentChallengeOptions,
  PushNotificationEnrollmentChallengeOptions,
  RecoveryCodeEnrollmentChallengeOptions,
  PasswordEnrollmentChallengeOptions,
  EnrollmentChallengeResponse,
  PasskeyEnrollmentChallengeResponse,
  PhoneEnrollmentChallengeResponse,
  EmailEnrollmentChallengeResponse,
  TotpEnrollmentChallengeResponse,
  PushNotificationEnrollmentChallengeResponse,
  RecoveryCodeEnrollmentChallengeResponse,
  PasswordEnrollmentChallengeResponse,
  PasswordPolicy,
  EnrollmentVerifyOptions,
  PasskeyEnrollmentVerifyOptions,
  PhoneEnrollmentVerifyOptions,
  EmailEnrollmentVerifyOptions,
  TotpEnrollmentVerifyOptions,
  PushNotificationEnrollmentVerifyOptions,
  RecoveryCodeEnrollmentVerifyOptions,
  PasswordEnrollmentVerifyOptions
} from './myaccount';

export {
  PasskeyApiClient,
  PasskeyError,
  PasskeyRegisterError,
  PasskeyChallengeError,
  PasskeyGetTokenError
} from './passkey';
export type {
  PasskeyErrorResponse,
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  PasskeyCreationOptions,
  PasskeyRequestOptions,
  PasskeySignupOptions,
  PasskeyLoginOptions
} from './passkey';

export type { CustomTokenExchangeOptions } from './TokenExchange';
