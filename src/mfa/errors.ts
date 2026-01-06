import {
  MfaListAuthenticatorsError as Auth0JsMfaListAuthenticatorsError,
  MfaEnrollmentError as Auth0JsMfaEnrollmentError,
  MfaChallengeError as Auth0JsMfaChallengeError,
  MfaApiErrorResponse
} from '@auth0/auth0-auth-js';

/**
 * Base class for MFA-related errors in auth0-spa-js.
 * Wraps errors from auth0-auth-js and preserves error details.
 */
export class MfaError extends Error {
  constructor(public error: string, public error_description: string) {
    super(error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaError.prototype);
  }
}

/**
 * Error thrown when listing MFA authenticators fails.
 *
 * @example
 * ```typescript
 * try {
 *   const authenticators = await mfa.getAuthenticators();
 * } catch (error) {
 *   if (error instanceof MfaListAuthenticatorsError) {
 *     console.log(error.error); // 'access_denied'
 *     console.log(error.error_description); // 'Unauthorized'
 *   }
 * }
 * ```
 */
export class MfaListAuthenticatorsError extends MfaError {
  constructor(error: string, error_description: string) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaListAuthenticatorsError.prototype);
  }
}

/**
 * Error thrown when enrolling an MFA authenticator fails.
 *
 * @example
 * ```typescript
 * try {
 *   const enrollment = await mfa.enroll({
 *     authenticator_types: ['otp']
 *   });
 * } catch (error) {
 *   if (error instanceof MfaEnrollmentError) {
 *     console.log(error.error); // 'invalid_phone_number'
 *     console.log(error.error_description); // 'Invalid phone number format'
 *   }
 * }
 * ```
 */
export class MfaEnrollmentError extends MfaError {
  constructor(originalError: Auth0JsMfaEnrollmentError) {
    super(
      originalError.cause?.error || 'mfa_enrollment_error',
      originalError.message
    );
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaEnrollmentError.prototype);
  }
}

/**
 * Error thrown when initiating an MFA challenge fails.
 *
 * @example
 * ```typescript
 * try {
 *   const challenge = await mfa.challenge({
 *     mfaToken: mfaToken,
 *     client_id: 'YOUR_CLIENT_ID',
 *     challengeType: 'otp',
 *     authenticatorId: 'otp|dev_123'
 *   });
 * } catch (error) {
 *   if (error instanceof MfaChallengeError) {
 *     console.log(error.error); // 'too_many_attempts'
 *     console.log(error.error_description); // 'Rate limit exceeded'
 *   }
 * }
 * ```
 */
export class MfaChallengeError extends MfaError {
  constructor(originalError: Auth0JsMfaChallengeError) {
    super(
      originalError.cause?.error || 'mfa_challenge_error',
      originalError.message
    );
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaChallengeError.prototype);
  }
}

/**
 * Re-export MfaApiErrorResponse type for convenience
 */
export type { MfaApiErrorResponse };
