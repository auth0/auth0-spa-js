import type { AuthorizationParams } from '../global';
import type {
  PasskeyCreationOptions,
  PasskeyCredentialResponse
} from '@auth0/auth0-auth-js';

// ─── Connected Accounts ──────────────────────────────────────────────────────

export interface ConnectRequest {
  connection: string;
  scopes?: string[];
  redirect_uri: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
  authorization_params?: AuthorizationParams;
}

export interface ConnectResponse {
  connect_uri: string;
  auth_session: string;
  connect_params: {
    ticket: string;
  };
  expires_in: number;
}

export interface CompleteRequest {
  auth_session: string;
  connect_code: string;
  redirect_uri: string;
  code_verifier?: string;
}

export interface CompleteResponse {
  id: string;
  connection: string;
  access_type: 'offline';
  scopes?: string[];
  created_at: string;
  expires_at?: string;
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ErrorResponse {
  type: string;
  status: number;
  title: string;
  detail: string;
  validation_errors?: {
    detail: string;
    field?: string;
    pointer?: string;
    source?: string;
  }[];
}

// ─── Factors ─────────────────────────────────────────────────────────────────

export type AuthenticationMethodType =
  | 'passkey'
  | 'password'
  | 'phone'
  | 'totp'
  | 'email'
  | 'push-notification'
  | 'recovery-code'
  | 'webauthn-platform'
  | 'webauthn-roaming';

export interface Factor {
  type: AuthenticationMethodType;
  usage?: ('primary' | 'secondary')[];
}

// ─── Authentication Methods ───────────────────────────────────────────────────

interface AuthenticationMethodBase {
  id: string;
  created_at: string;
  usage: ('primary' | 'secondary')[];
}

interface AuthenticationMethodWithMetadata extends AuthenticationMethodBase {
  confirmed: boolean;
  name?: string;
  last_auth_at?: string;
}

interface WebAuthnAuthenticationMethodBase
  extends AuthenticationMethodWithMetadata {
  key_id?: string;
  public_key?: string;
}

export interface PasskeyAuthenticationMethod extends AuthenticationMethodBase {
  type: 'passkey';
  key_id: string;
  public_key: string;
  credential_device_type: 'single_device' | 'multi_device';
  credential_backed_up: boolean;
  identity_user_id: string;
  user_handle: string;
  transports?: string[];
  user_agent?: string;
  aaguid?: string;
  relying_party_id?: string;
  last_auth_at?: string;
}

export interface WebAuthnPlatformAuthenticationMethod
  extends WebAuthnAuthenticationMethodBase {
  type: 'webauthn-platform';
}

export interface WebAuthnRoamingAuthenticationMethod
  extends WebAuthnAuthenticationMethodBase {
  type: 'webauthn-roaming';
}

export interface PhoneAuthenticationMethod
  extends AuthenticationMethodWithMetadata {
  type: 'phone';
  phone_number: string;
  preferred_authentication_method: 'sms' | 'voice';
}

export interface EmailAuthenticationMethod
  extends AuthenticationMethodWithMetadata {
  type: 'email';
  email: string;
}

export interface PasswordAuthenticationMethod extends AuthenticationMethodBase {
  type: 'password';
  identity_user_id: string;
  last_password_reset?: string;
}

export interface TotpAuthenticationMethod
  extends AuthenticationMethodWithMetadata {
  type: 'totp';
}

export interface PushNotificationAuthenticationMethod
  extends AuthenticationMethodWithMetadata {
  type: 'push-notification';
}

export interface RecoveryCodeAuthenticationMethod
  extends Omit<AuthenticationMethodWithMetadata, 'name'> {
  type: 'recovery-code';
}

export type AuthenticationMethod =
  | PasskeyAuthenticationMethod
  | WebAuthnPlatformAuthenticationMethod
  | WebAuthnRoamingAuthenticationMethod
  | PhoneAuthenticationMethod
  | EmailAuthenticationMethod
  | PasswordAuthenticationMethod
  | TotpAuthenticationMethod
  | PushNotificationAuthenticationMethod
  | RecoveryCodeAuthenticationMethod;

export interface UpdateAuthenticationMethodRequest {
  name?: string;
  /** Only valid when updating a phone authentication method. */
  preferred_authentication_method?: 'sms' | 'voice';
}

// ─── Enrollment Challenge Options ────────────────────────────────────────────

export interface PasskeyEnrollmentChallengeOptions {
  type: 'passkey';
  connection?: string;
  identity_user_id?: string;
}

export interface PhoneEnrollmentChallengeOptions {
  type: 'phone';
  phone_number: string;
  preferred_authentication_method?: 'sms' | 'voice';
}

export interface EmailEnrollmentChallengeOptions {
  type: 'email';
  email: string;
}

export interface TotpEnrollmentChallengeOptions {
  type: 'totp';
}

export interface PushNotificationEnrollmentChallengeOptions {
  type: 'push-notification';
}

export interface RecoveryCodeEnrollmentChallengeOptions {
  type: 'recovery-code';
}

export interface PasswordEnrollmentChallengeOptions {
  type: 'password';
  connection?: string;
  identity_user_id?: string;
}

export type EnrollmentChallengeOptions =
  | PasskeyEnrollmentChallengeOptions
  | PhoneEnrollmentChallengeOptions
  | EmailEnrollmentChallengeOptions
  | TotpEnrollmentChallengeOptions
  | PushNotificationEnrollmentChallengeOptions
  | RecoveryCodeEnrollmentChallengeOptions
  | PasswordEnrollmentChallengeOptions;

// ─── Enrollment Challenge Response ───────────────────────────────────────────

interface EnrollmentChallengeBaseResponse {
  id: string;
  location: string;
  auth_session: string;
}

export interface PasskeyEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'passkey';
  authn_params_public_key: PasskeyCreationOptions;
}

export interface PhoneEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'phone';
}

export interface EmailEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'email';
}

export interface TotpEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'totp';
  barcode_uri: string;
  manual_input_code?: string;
}

export interface PushNotificationEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'push-notification';
  barcode_uri: string;
  manual_input_code?: string;
}

export interface RecoveryCodeEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'recovery-code';
  recovery_code: string;
}

export interface PasswordPolicy {
  complexity: {
    min_length: number;
    character_types: ('uppercase' | 'lowercase' | 'number' | 'special')[];
    character_type_rule: 'all' | 'three_of_four';
    identical_characters: 'allow' | 'block';
    sequential_characters: 'allow' | 'block';
    max_length_exceeded: 'truncate' | 'error';
  };
  profile_data: {
    active: boolean;
    blocked_fields: string[];
  };
  history: {
    active: boolean;
    size: number;
  };
  dictionary: {
    active: boolean;
    default: 'en_10k' | 'en_100k';
  };
}

export interface PasswordEnrollmentChallengeResponse
  extends EnrollmentChallengeBaseResponse {
  type: 'password';
  policy: PasswordPolicy;
}

export type EnrollmentChallengeResponse =
  | PasskeyEnrollmentChallengeResponse
  | PhoneEnrollmentChallengeResponse
  | EmailEnrollmentChallengeResponse
  | TotpEnrollmentChallengeResponse
  | PushNotificationEnrollmentChallengeResponse
  | RecoveryCodeEnrollmentChallengeResponse
  | PasswordEnrollmentChallengeResponse;

// ─── Enrollment Verify ────────────────────────────────────────────────────────

interface EnrollmentVerifyBaseOptions {
  location: string;
  auth_session: string;
}

export interface PasskeyEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'passkey';
  authn_response: PasskeyCredentialResponse;
}

export interface PhoneEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'phone';
  otp_code: string;
}

export interface EmailEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'email';
  otp_code: string;
}

export interface TotpEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'totp';
  otp_code: string;
}

export interface PushNotificationEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'push-notification';
}

export interface RecoveryCodeEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'recovery-code';
}

export interface PasswordEnrollmentVerifyOptions
  extends EnrollmentVerifyBaseOptions {
  type: 'password';
  new_password: string;
}

export type EnrollmentVerifyOptions =
  | PasskeyEnrollmentVerifyOptions
  | PhoneEnrollmentVerifyOptions
  | EmailEnrollmentVerifyOptions
  | TotpEnrollmentVerifyOptions
  | PushNotificationEnrollmentVerifyOptions
  | RecoveryCodeEnrollmentVerifyOptions
  | PasswordEnrollmentVerifyOptions;
