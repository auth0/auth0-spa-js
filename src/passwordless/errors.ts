export interface PasswordlessErrorResponse {
  error: string;
  error_description: string;
  message?: string;
}

/**
 * Error thrown by passwordless OTP operations.
 *
 * `code` carries the OAuth/endpoint error code (e.g. `invalid_request`,
 * `invalid_connection`, `too_many_requests`, `invalid_grant`).
 */
export class PasswordlessError extends Error {
  public readonly code: string;
  public readonly cause?: PasswordlessErrorResponse;

  constructor(code: string, message: string, cause?: PasswordlessErrorResponse) {
    super(message);
    this.name = 'PasswordlessError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, PasswordlessError.prototype);
  }
}

/**
 * Error thrown when an OTP challenge request fails
 * (`challengeWithEmail` / `challengeWithPhone`).
 */
export class PasswordlessChallengeError extends PasswordlessError {
  constructor(code: string, message: string, cause?: PasswordlessErrorResponse) {
    super(code, message, cause);
    this.name = 'PasswordlessChallengeError';
    Object.setPrototypeOf(this, PasswordlessChallengeError.prototype);
  }
}
