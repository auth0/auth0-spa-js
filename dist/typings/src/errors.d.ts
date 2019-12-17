export declare class AuthenticationError extends Error {
  error: string;
  error_description: string;
  state: string;
  constructor(error: string, error_description: string, state: string);
}
