export {
  PasskeyRegisterError,
  PasskeyChallengeError,
  PasskeyGetTokenError
} from '@auth0/auth0-auth-js';

export interface PasskeyErrorResponse {
  type?: string;
  status?: number;
  title?: string;
  detail?: string;
  error?: string;
  error_description?: string;
}

export class PasskeyError extends Error {
  public readonly code: string;
  public readonly cause?: PasskeyErrorResponse;

  constructor(code: string, message: string, cause?: PasskeyErrorResponse) {
    super(message);
    this.name = 'PasskeyError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, PasskeyError.prototype);
  }
}

export class PasskeyEnrollmentError extends PasskeyError {
  constructor(message: string, cause?: PasskeyErrorResponse) {
    super('passkey_enrollment_error', message, cause);
    this.name = 'PasskeyEnrollmentError';
    Object.setPrototypeOf(this, PasskeyEnrollmentError.prototype);
  }
}

export class PasskeyEnrollmentVerifyError extends PasskeyError {
  constructor(message: string, cause?: PasskeyErrorResponse) {
    super('passkey_enrollment_verify_error', message, cause);
    this.name = 'PasskeyEnrollmentVerifyError';
    Object.setPrototypeOf(this, PasskeyEnrollmentVerifyError.prototype);
  }
}
