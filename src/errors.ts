export class AuthenticationError extends Error {
  constructor(
    public error: string,
    public error_description: string,
    public state: string
  ) {
    super(error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class InternalError extends Error {
  public error = 'internal_error';
  constructor(public error_description: string = 'Internal Error') {
    super(error_description);
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}
