/**
 * For context on the istanbul ignore statements below, see:
 * https://github.com/gotwarlost/istanbul/issues/690
 */

import { valueOrEmptyString } from './utils';

/**
 * Thrown when network requests to the Auth server fail.
 */
export class GenericError extends Error {
  /* istanbul ignore next */
  constructor(public error: string, public error_description: string) {
    super(error_description);
    Object.setPrototypeOf(this, GenericError.prototype);
  }

  static fromPayload({
    error,
    error_description
  }: {
    error: string;
    error_description: string;
  }) {
    return new GenericError(error, error_description);
  }
}

/**
 * Thrown when handling the redirect callback fails, will be one of Auth0's
 * Authentication API's Standard Error Responses: https://auth0.com/docs/api/authentication?javascript#standard-error-responses
 */
export class AuthenticationError extends GenericError {
  /* istanbul ignore next */
  constructor(
    error: string,
    error_description: string,
    public state: string,
    public appState: any = null
  ) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Thrown when silent auth times out (usually due to a configuration issue) or
 * when network requests to the Auth server timeout.
 */
export class TimeoutError extends GenericError {
  /* istanbul ignore next */
  constructor() {
    super('timeout', 'Timeout');
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when the login popup times out (if the user does not complete auth)
 */
export class PopupTimeoutError extends TimeoutError {
  /* istanbul ignore next */
  constructor(public popup: Window) {
    super();
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PopupTimeoutError.prototype);
  }
}

export class PopupCancelledError extends GenericError {
  /* istanbul ignore next */
  constructor(public popup: Window) {
    super('cancelled', 'Popup closed');
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PopupCancelledError.prototype);
  }
}

/**
 * Error thrown when the token exchange results in a `mfa_required` error
 */
export class MfaRequiredError extends GenericError {
  /* istanbul ignore next */
  constructor(
    error: string,
    error_description: string,
    public mfa_token: string
  ) {
    super(error, error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, MfaRequiredError.prototype);
  }
}

export class MissingRefreshTokenError extends GenericError {
  /* istanbul ignore next */
  constructor(public audience: string, public scope: string) {
    super(
      'missing_refresh_token',
      `Missing Refresh Token (audience: '${valueOrEmptyString(audience, [
        'default'
      ])}', scope: '${valueOrEmptyString(scope)}')`
    );
    Object.setPrototypeOf(this, MissingRefreshTokenError.prototype);
  }
}
