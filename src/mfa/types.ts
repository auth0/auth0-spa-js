/**
 * Represents an MFA authenticator enrolled by a user
 */
export interface Authenticator {
  /** Unique identifier for the authenticator */
  id: string;
  /** Type of authenticator */
  authenticator_type: AuthenticatorType;
  /** Whether the authenticator is active */
  active: boolean;
  /** Optional friendly name */
  name?: string;
  /** ISO 8601 timestamp when created */
  created_at?: string;
  /** ISO 8601 timestamp of last authentication */
  last_auth?: string;
}

/**
 * Supported authenticator types
 */
export type AuthenticatorType = 'otp' | 'oob' | 'recovery-code' | 'email';

/**
 * Out-of-band delivery channels
 */
export type OobChannel = 'sms' | 'voice' | 'auth0';

/**
 * Parameters for enrolling an OTP authenticator (TOTP apps like Google Authenticator)
 */
export interface EnrollOtpParams {
  /** Must be ['otp'] for OTP enrollment */
  authenticator_types: ['otp'];
}

/**
 * Parameters for enrolling an out-of-band authenticator (SMS, Voice, Push)
 */
export interface EnrollOobParams {
  /** Must be ['oob'] for OOB enrollment */
  authenticator_types: ['oob'];
  /** Delivery channels to enable */
  oob_channels: OobChannel[];
  /** Phone number for SMS/Voice (E.164 format: +1234567890) */
  phone_number?: string;
}

/**
 * Parameters for enrolling an email authenticator
 */
export interface EnrollEmailParams {
  /** Must be ['oob'] for email enrollment */
  authenticator_types: ['oob'],
  /** Must be ['email'] for email delivery */
  oob_channels: ['email'],
  /** Email address (optional, uses user's email if not provided) */
  email?: string;
}

/**
 * Union type for all enrollment parameter types
 */
export type EnrollAuthenticatorParams =
  | EnrollOtpParams
  | EnrollOobParams
  | EnrollEmailParams;

/**
 * Response when enrolling an OTP authenticator
 */
export interface OtpEnrollmentResponse {
  /** Authenticator type */
  authenticator_type: 'otp';
  /** Base32-encoded secret for TOTP generation */
  secret: string;
  /** URI for generating QR code (otpauth://...) */
  barcode_uri: string;
  /** Recovery codes for account recovery */
  recovery_codes?: string[];
  /** Authenticator ID */
  id?: string;
}

/**
 * Response when enrolling an OOB authenticator
 */
export interface OobEnrollmentResponse {
  /** Authenticator type */
  authenticator_type: 'oob';
  /** Delivery channel used */
  oob_channel: OobChannel;
  /** Out-of-band code for verification */
  oob_code?: string;
  /** Binding method (e.g., 'prompt' for user code entry) */
  binding_method?: string;
  /** Authenticator ID */
  id?: string;
}

/**
 * Response when enrolling an email authenticator
 */
export interface EmailEnrollmentResponse {
  /** Authenticator type */
  authenticator_type: 'email';
  /** Email address enrolled */
  email: string;
  /** Authenticator ID */
  id?: string;
}

/**
 * Union type for all enrollment response types
 */
export type EnrollmentResponse =
  | OtpEnrollmentResponse
  | OobEnrollmentResponse
  | EmailEnrollmentResponse;

/**
 * Parameters for initiating an MFA challenge
 */
export interface ChallengeParams {
  /** MFA token from mfa_required error or MFA-scoped access token */
  mfa_token: string;
  /** Auth0 application client ID */
  client_id: string;
  /** Type of challenge to initiate */
  challenge_type: 'otp' | 'oob';
  /** Specific authenticator to challenge (optional) */
  authenticator_id?: string;
}

/**
 * Response from initiating an MFA challenge
 */
export interface ChallengeResponse {
  /** Type of challenge created */
  challenge_type: 'otp' | 'oob';
  /** Out-of-band code (for OOB challenges) */
  oob_code?: string;
  /** Binding method for OOB (e.g., 'prompt') */
  binding_method?: string;
}

/**
 * Grant types for MFA verification
 */
export type MfaGrantType =
  | 'http://auth0.com/oauth/grant-type/mfa-otp'
  | 'http://auth0.com/oauth/grant-type/mfa-oob';

/**
 * Parameters for verifying an MFA challenge
 */
export interface VerifyChallengeParams {
  /** MFA token from challenge flow */
  mfa_token: string;
  /** Auth0 application client ID */
  client_id: string;
  /** Grant type based on challenge type */
  grant_type: MfaGrantType;
  /** One-time password (for OTP challenges) */
  otp?: string;
  /** Out-of-band code (for OOB challenges) */
  oob_code?: string;
  /** Binding code (for OOB challenges with binding) */
  binding_code?: string;
}
