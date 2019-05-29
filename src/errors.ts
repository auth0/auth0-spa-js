export class AuthenticationError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}
