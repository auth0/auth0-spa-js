import type { Auth0Client } from '../Auth0Client';
import type { TokenEndpointResponse } from '../global';
import type {
  PasswordlessEmailChallengeOptions,
  PasswordlessPhoneChallengeOptions,
  PasswordlessChallengeResponse,
  PasswordlessLoginOptions
} from './types';
import { PasswordlessChallengeError, PasswordlessError, PasswordlessErrorResponse } from './errors';
import { GenericError } from '../errors';

/**
 * Client for Auth0 database-connection OTP (passwordless) authentication.
 *
 * Drives a two-step flow against a database connection that has `email_otp` or
 * `phone_otp` enabled:
 *
 * 1. Issue a one-time code with `challengeWithEmail` or `challengeWithPhone`.
 *    Both return an opaque `auth_session` token.
 * 2. Exchange that session and the received code for tokens with `loginWithOTP`.
 *
 * @example
 * ```typescript
 * // Step 1 — issue the challenge
 * const { auth_session } = await auth0.passwordless.challengeWithEmail({
 *   email: 'user@example.com',
 *   connection: 'Username-Password-Authentication'
 * });
 *
 * // Step 2 — exchange the code for tokens (establishes a session)
 * const tokens = await auth0.passwordless.loginWithOTP({
 *   authSession: auth_session,
 *   otp: '123456'
 * });
 * ```
 */
export class PasswordlessApiClient {
  #auth0Client: Auth0Client;

  /**
   * @internal
   * Do not instantiate directly. Use Auth0Client.passwordless instead.
   */
  constructor(auth0Client: Auth0Client) {
    this.#auth0Client = auth0Client;
  }

  /**
   * Issues an OTP challenge to an email address for a database connection.
   *
   * Sends a one-time code to the given email for a connection that has `email_otp`
   * enabled. For privacy, the server always responds successfully regardless of
   * whether the user exists, so a successful response does not confirm an account
   * exists.
   *
   * @param options - Email, connection, and optional `allowSignup`.
   * @returns The challenge response containing the opaque `auth_session`.
   * @throws {PasswordlessChallengeError} If the challenge request fails.
   */
  async challengeWithEmail(
    options: PasswordlessEmailChallengeOptions
  ): Promise<PasswordlessChallengeResponse> {
    return this.#challenge({
      connection: options.connection,
      email: options.email,
      allow_signup: String(options.allowSignup ?? false)
    });
  }

  /**
   * Issues an OTP challenge to a phone number for a database connection.
   *
   * Sends a one-time code to the given phone number for a connection that has
   * `phone_otp` enabled, delivered by SMS or voice call per `deliveryMethod`. For
   * privacy, the server always responds successfully regardless of whether the
   * user exists, so a successful response does not confirm an account exists.
   *
   * @param options - Phone number, connection, optional `deliveryMethod` and `allowSignup`.
   * @returns The challenge response containing the opaque `auth_session`.
   * @throws {PasswordlessChallengeError} If the challenge request fails.
   */
  async challengeWithPhone(
    options: PasswordlessPhoneChallengeOptions
  ): Promise<PasswordlessChallengeResponse> {
    return this.#challenge({
      connection: options.connection,
      phone_number: options.phoneNumber,
      delivery_method: options.deliveryMethod ?? 'text',
      allow_signup: String(options.allowSignup ?? false)
    });
  }

  /**
   * Completes the OTP flow by verifying the one-time code and obtaining tokens.
   *
   * Exchanges the opaque `auth_session` from a prior challenge, together with the
   * code the user received, for tokens. The tokens are cached and an authenticated
   * session is established, so `getUser()` / `getTokenSilently()` work afterwards.
   *
   * @param options - `authSession`, `otp`, and optional `scope` / `audience`.
   * @returns The token endpoint response containing access/ID tokens.
   * @throws {PasswordlessError} If verification fails (e.g. invalid or expired code).
   */
  async loginWithOTP(
    options: PasswordlessLoginOptions
  ): Promise<TokenEndpointResponse> {
    try {
      return await this.#auth0Client._requestTokenForPasswordless({
        authSession: options.authSession,
        otp: options.otp,
        scope: options.scope,
        audience: options.audience
      });
    } catch (error: unknown) {
      throw toPasswordlessError(error);
    }
  }

  async #challenge(
    params: Record<string, string>
  ): Promise<PasswordlessChallengeResponse> {
    try {
      return await this.#auth0Client._passwordlessChallenge(params);
    } catch (error: unknown) {
      const mapped = toPasswordlessError(error);
      throw new PasswordlessChallengeError(mapped.code, mapped.message, mapped.cause);
    }
  }
}

function toPasswordlessError(error: unknown): PasswordlessError {
  if (error instanceof PasswordlessError) {
    return error;
  }

  if (error instanceof GenericError) {
    const cause: PasswordlessErrorResponse = {
      error: error.error,
      error_description: error.error_description
    };
    return new PasswordlessError(error.error, error.error_description, cause);
  }

  const message = error instanceof Error ? error.message : 'Passwordless request failed.';
  return new PasswordlessError('request_error', message);
}
