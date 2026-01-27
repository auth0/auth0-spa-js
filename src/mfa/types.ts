import { MfaGrantTypes } from './constants';

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
 * Supported authenticator types.
 * Note: Email authenticators use 'oob' type with oobChannel: 'email'
 */
export type AuthenticatorType = 'otp' | 'oob' | 'recovery-code';

/**
 * Types of MFA challenges
 */
export type ChallengeType = 'otp' | 'phone' | 'recovery-code' | 'email' | 'push-notification' | 'totp';

/**
 * Out-of-band delivery channels.
 * Includes 'email' which is also delivered out-of-band.
 */
export type OobChannel = 'sms' | 'voice' | 'auth0' | 'email';

/**
 * Supported MFA factors for enrollment
 */
export type MfaFactorType = 'otp' | 'sms' | 'email' | 'push' | 'voice';

/**
 * Base parameters for all enrollment types
 */
export interface EnrollBaseParams {
  /** MFA token from mfa_required error */
  mfaToken: string;
}

/**
 * OTP (Time-based One-Time Password) enrollment parameters
 */
export interface EnrollOtpParams extends EnrollBaseParams {
  /** The factor type for enrollment */
  factorType: 'otp';
}

/**
 * SMS enrollment parameters
 */
export interface EnrollSmsParams extends EnrollBaseParams {
  /** The factor type for enrollment */
  factorType: 'sms';
  /** Phone number in E.164 format (required for SMS) */
  phoneNumber: string;
}

/**
 * Voice enrollment parameters
 */
export interface EnrollVoiceParams extends EnrollBaseParams {
  /** The factor type for enrollment */
  factorType: 'voice';
  /** Phone number in E.164 format (required for voice) */
  phoneNumber: string;
}

/**
 * Email enrollment parameters
 */
export interface EnrollEmailParams extends EnrollBaseParams {
  /** The factor type for enrollment */
  factorType: 'email';
  /** Email address (optional, uses user's email if not provided) */
  email?: string;
}

/**
 * Push notification enrollment parameters
 */
export interface EnrollPushParams extends EnrollBaseParams {
  /** The factor type for enrollment */
  factorType: 'push';
}

/**
 * Union type for all enrollment parameter types
 */
export type EnrollParams =
  | EnrollOtpParams
  | EnrollSmsParams
  | EnrollVoiceParams
  | EnrollEmailParams
  | EnrollPushParams;

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
 * Union type for all enrollment response types
 */
export type EnrollmentResponse =
  | OtpEnrollmentResponse
  | OobEnrollmentResponse

/**
 * Parameters for initiating an MFA challenge
 */
export interface ChallengeAuthenticatorParams {
  /** MFA token from mfa_required error or MFA-scoped access token */
  mfaToken: string;
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
 * Grant types for MFA verification (derived from MfaGrantTypes constants)
 */
export type MfaGrantType = (typeof MfaGrantTypes)[keyof typeof MfaGrantTypes];

/**
 * Parameters for verifying an MFA challenge.
 *
 * The grant_type is automatically inferred from which verification field is provided:
 * - `otp` field → MFA-OTP grant type
 * - `oobCode` field → MFA-OOB grant type
 * - `recoveryCode` field → MFA-RECOVERY-CODE grant type
 */
export interface VerifyParams {
  /** MFA token from challenge flow */
  mfaToken: string;
  /** One-time password (for OTP challenges) */
  otp?: string;
  /** Out-of-band code (for OOB challenges) */
  oobCode?: string;
  /** Binding code (for OOB challenges with binding) */
  bindingCode?: string;
  /** Recovery code (for recovery code verification) */
  recoveryCode?: string;
}

/**
 * Enrollment factor returned by getEnrollmentFactors
 */
export interface EnrollmentFactor {
  /** Type of enrollment factor available */
  type: string;
}
