import { Auth0Client } from './Auth0Client';
import { Auth0ClientOptions } from './global';

import './global';

export * from './global';

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
