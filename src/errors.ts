export class AuthenticationError extends Error {
  constructor(
    public error: string,
    public error_description: string,
    public state: string
  ) {
    super(error_description);
  }
}
