/**
 * Delivery method for a phone-number OTP challenge.
 *
 * Maps to the `delivery_method` parameter of `POST /otp/challenge`.
 * - `text` sends the one-time code via SMS (the server default).
 * - `voice` delivers it through a voice call.
 */
export type DeliveryMethod = 'text' | 'voice';

/**
 * Options for issuing an OTP challenge to an email address.
 */
export interface PasswordlessEmailChallengeOptions {
  /** The email address to send the one-time code to. */
  email: string;
  /** The name of the database connection; it must have `email_otp` enabled. */
  connection: string;
  /** Whether to allow sign-up if the user does not yet exist. Defaults to `false`. */
  allowSignup?: boolean;
}

/**
 * Options for issuing an OTP challenge to a phone number.
 */
export interface PasswordlessPhoneChallengeOptions {
  /** The E.164 phone number to send the one-time code to (e.g. `'+15555550123'`). */
  phoneNumber: string;
  /** The name of the database connection; it must have `phone_otp` enabled. */
  connection: string;
  /** How to deliver the code. Defaults to `'text'` (SMS). */
  deliveryMethod?: DeliveryMethod;
  /** Whether to allow sign-up if the user does not yet exist. Defaults to `false`. */
  allowSignup?: boolean;
}

/**
 * Opaque challenge returned by a successful OTP challenge request.
 *
 * For privacy, the server always responds successfully regardless of whether the
 * user exists, so a successful response does not confirm an account exists.
 */
export interface PasswordlessChallengeResponse {
  /** Opaque session token to pass to `loginWithOTP` along with the received code. */
  auth_session: string;
}

/**
 * Options for completing the OTP flow and obtaining tokens.
 */
export interface PasswordlessLoginOptions {
  /** The opaque session token returned by a prior challenge. */
  authSession: string;
  /** The one-time code the user received via email, SMS, or voice call. */
  otp: string;
  /** Optional scope to request for this login. */
  scope?: string;
  /** Optional audience to request for this login. */
  audience?: string;
}
