/**
 * Represents an MFA authenticator enrolled by a user
 */
export interface Authenticator {
  /** Unique identifier for the authenticator */
  id: string;
  /** Type of authenticator */
  authenticatorType: AuthenticatorType;
  /** Whether the authenticator is active */
  active: boolean;
  /** Optional friendly name */
  name?: string;
  /** ISO 8601 timestamp when created */
  createdAt?: string;
  /** ISO 8601 timestamp of last authentication */
  lastAuth?: string;
  /** Types of MFA challenges*/
  type?: string;
}

/**
 * Supported authenticator types
 */
export type AuthenticatorType = 'otp' | 'oob' | 'recovery-code' | 'email';

/**
 * Types of MFA challenges
 */
export type ChallengeType = 'otp' | 'phone' | 'recovery-code' | 'email' | 'push-notification' | 'totp';

/**
 * Out-of-band delivery channels
 */
export type OobChannel = 'sms' | 'voice' | 'auth0';

/**
 * Parameters for getting authenticators
 */
export interface GetAuthenticatorsParams {
  /** MFA token from mfa_required error */
  mfaToken: string;

  /**
   * Array of challenge types to filter authenticators.
   * Use values from mfa_required error's mfa_requirements.challenge[].type
   * 
   * @example
   * ```typescript
   * const challengeTypes = error.mfa_requirements.challenge.map(c => c.type);
   * const authenticators = await mfa.getAuthenticators({
   *   mfaToken: error.mfa_token,
   *   challengeType: challengeTypes
   * });
   * ```
   */
  challengeType: ChallengeType[];
}

/**
 * Base parameters for all enrollment types
 */
export interface EnrollBaseParams {
  /** MFA token from mfa_required error */
  mfaToken: string;
}

/**
 * Parameters for enrolling an OTP authenticator (TOTP apps like Google Authenticator)
 */
export interface EnrollOtpParams extends EnrollBaseParams {
  /** Must be ['otp'] for OTP enrollment */
  authenticatorTypes: ['otp'];
}

/**
 * Parameters for enrolling an out-of-band authenticator (SMS, Voice, Push)
 */
export interface EnrollOobParams extends EnrollBaseParams {
  /** Must be ['oob'] for OOB enrollment */
  authenticatorTypes: ['oob'];
  /** Delivery channels to enable */
  oobChannels: OobChannel[];
  /** Phone number for SMS/Voice (E.164 format: +1234567890) */
  phoneNumber?: string;
}

/**
 * Parameters for enrolling an email authenticator
 */
export interface EnrollEmailParams extends EnrollBaseParams {
  /** Must be ['oob'] for email enrollment */
  authenticatorTypes: ['oob'],
  /** Must be ['email'] for email delivery */
  oobChannels: ['email'],
  /** Email address (optional, uses user's email if not provided) */
  email?: string;
}

/**
 * Union type for all enrollment parameter types
 */
export type EnrollParams =
  | EnrollOtpParams
  | EnrollOobParams
  | EnrollEmailParams;

/**
 * Response when enrolling an OTP authenticator
 */
export interface OtpEnrollmentResponse {
  /** Authenticator type */
  authenticatorType: 'otp';
  /** Base32-encoded secret for TOTP generation */
  secret: string;
  /** URI for generating QR code (otpauth://...) */
  barcodeUri: string;
  /** Recovery codes for account recovery */
  recoveryCodes?: string[];
  /** Authenticator ID */
  id?: string;
}

/**
 * Response when enrolling an OOB authenticator
 */
export interface OobEnrollmentResponse {
  /** Authenticator type */
  authenticatorType: 'oob';
  /** Delivery channel used */
  oobChannel: OobChannel;
  /** Out-of-band code for verification */
  oobCode?: string;
  /** Binding method (e.g., 'prompt' for user code entry) */
  bindingMethod?: string;
  /** Recovery codes (generated when enrolling first MFA factor) */
  recoveryCodes?: string[];
  /** Authenticator ID */
  id?: string;
  /** URI for QR code (for Push/Guardian enrollment) */
  barcodeUri?: string;
}

/**
 * Response when enrolling an email authenticator
 */
export interface EmailEnrollmentResponse {
  /** Authenticator type */
  authenticatorType: 'email';
  /** Email address enrolled */
  email: string;
  /** Recovery codes (generated when enrolling first MFA factor) */
  recoveryCodes?: string[];
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
export interface ChallengeAuthenticatorParams {
  /** MFA token from mfa_required error or MFA-scoped access token */
  mfaToken: string;
  /** Auth0 application client ID */
  client_id: string;
  /** Type of challenge to initiate */
  challengeType: 'otp' | 'oob';
  /** Specific authenticator to challenge (optional) */
  authenticatorId?: string;
}

/**
 * Response from initiating an MFA challenge
 */
export interface ChallengeResponse {
  /** Type of challenge created */
  challengeType: 'otp' | 'oob';
  /** Out-of-band code (for OOB challenges) */
  oobCode?: string;
  /** Binding method for OOB (e.g., 'prompt') */
  bindingMethod?: string;
}

/**
 * Grant types for MFA verification
 */
export type MfaGrantType =
  | 'http://auth0.com/oauth/grant-type/mfa-otp'
  | 'http://auth0.com/oauth/grant-type/mfa-oob'
  | 'http://auth0.com/oauth/grant-type/mfa-recovery-code';

/**
 * Parameters for verifying an MFA challenge
 */
export interface VerifyParams {
  /** MFA token from challenge flow */
  mfaToken: string;
  /** Auth0 application client ID */
  client_id: string;
  /** Grant type based on challenge type */
  grant_type: MfaGrantType;
  /** One-time password (for OTP challenges) */
  otp?: string;
  /** Out-of-band code (for OOB challenges) */
  oobCode?: string;
  /** Binding code (for OOB challenges with binding) */
  bindingCode?: string;
  /** Recovery code (for recovery code verification) */
  recoveryCode?: string;
}
