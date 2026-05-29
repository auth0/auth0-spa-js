export {
  PasskeyRegisterError,
  PasskeyChallengeError,
  PasskeyGetTokenError
} from '@auth0/auth0-auth-js';

export interface PasskeyErrorResponse {
  error: string;
  error_description: string;
  message?: string;
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

