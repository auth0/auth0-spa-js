import { MfaApiErrorResponse } from '@auth0/auth0-auth-js';
import { GenericError } from '../errors';

/**
 * Base class for MFA-related errors in auth0-spa-js.
 * Extends GenericError for unified error hierarchy across the SDK.
 */
export class MfaError extends GenericError {
  constructor(error: string, error_description: string) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaError.prototype);
  }

  static fromPayload({
    error,
    error_description
  }: {
    error: string;
    error_description: string;
  }) {
    return new MfaError(error, error_description);
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
  constructor(error: string, error_description: string) {
    super(error, error_description);
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
  constructor(error: string, error_description: string) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaChallengeError.prototype);
  }
}

/**
 * Error thrown when verifying an MFA challenge fails.
 *
 * @example
 * ```typescript
 * try {
 *   const tokens = await mfa.verify({
 *     mfaToken: mfaToken,
 *     grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
 *     otp: '123456'
 *   });
 * } catch (error) {
 *   if (error instanceof MfaVerifyError) {
 *     console.log(error.error); // 'invalid_otp' or 'context_not_found'
 *     console.log(error.error_description); // Error details
 *   }
 * }
 * ```
 */
export class MfaVerifyError extends MfaError {
  constructor(error: string, error_description: string) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaVerifyError.prototype);
  }
}

/**
 * Error thrown when getting enrollment factors fails.
 *
 * @example
 * ```typescript
 * try {
 *   const factors = await mfa.getEnrollmentFactors(mfaToken);
 * } catch (error) {
 *   if (error instanceof MfaEnrollmentFactorsError) {
 *     console.log(error.error); // 'mfa_context_not_found'
 *     console.log(error.error_description); // 'MFA context not found...'
 *   }
 * }
 * ```
 */
export class MfaEnrollmentFactorsError extends MfaError {
  constructor(error: string, error_description: string) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaEnrollmentFactorsError.prototype);
  }
}

/**
 * Re-export MfaApiErrorResponse type for convenience
 */
export type { MfaApiErrorResponse };
