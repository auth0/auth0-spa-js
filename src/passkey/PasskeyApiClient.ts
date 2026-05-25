import type { Auth0Client } from '../Auth0Client';
import type { Fetcher } from '../fetcher';
import type { TokenEndpointResponse } from '../global';
import type {
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  SigninWithPasskeyOptions,
  PasskeyEnrollmentOptions,
  PasskeyEnrollmentResponse,
  PasskeyEnrollmentVerifyOptions
} from './types';
import { PasskeyEnrollmentError, PasskeyEnrollmentVerifyError } from './errors';
import { PasskeyClient } from '@auth0/auth0-auth-js';

/**
 * Client for Auth0 Passkey operations.
 *
 * Provides methods for:
 * - Passkey signup (challenge + token exchange)
 * - Passkey login (challenge + token exchange)
 * - Passkey enrollment (for authenticated users adding a passkey)
 *
 * Authentication operations (signup, login, signin) delegate to auth0-auth-js PasskeyClient.
 * Enrollment operations use the My Account API via the SDK's authenticated fetcher.
 *
 * @example
 * ```typescript
 * // Signup with passkey
 * const challenge = await auth0.passkey.signupChallenge({ email: 'user@example.com' });
 * const credential = await navigator.credentials.create({ publicKey: challenge.authnParamsPublicKey });
 * const tokens = await auth0.passkey.signinWithPasskey({
 *   authSession: challenge.authSession,
 *   credential: serializeCredential(credential),
 * });
 *
 * // Login with passkey
 * const loginChallenge = await auth0.passkey.loginChallenge();
 * const assertion = await navigator.credentials.get({ publicKey: loginChallenge.authnParamsPublicKey });
 * const tokens = await auth0.passkey.signinWithPasskey({
 *   authSession: loginChallenge.authSession,
 *   credential: serializeCredential(assertion),
 * });
 * ```
 */
export class PasskeyApiClient {
  #passkeyClient: PasskeyClient;
  #auth0Client: Auth0Client;
  #myAccountFetcher: Fetcher<Response>;
  #apiBase: string;

  /**
   * @internal
   * Do not instantiate directly. Use Auth0Client.passkey instead.
   */
  constructor(
    passkeyClient: PasskeyClient,
    auth0Client: Auth0Client,
    myAccountFetcher: Fetcher<Response>,
    apiBase: string
  ) {
    this.#passkeyClient = passkeyClient;
    this.#auth0Client = auth0Client;
    this.#myAccountFetcher = myAccountFetcher;
    this.#apiBase = apiBase;
  }

  /**
   * Requests a passkey signup challenge for a new user.
   *
   * Returns WebAuthn public key creation options to pass to
   * `navigator.credentials.create()`.
   *
   * @throws {PasskeySignupChallengeError} If the request fails (invalid email, misconfigured connection, etc.)
   */
  async signupChallenge(
    options: PasskeySignupChallengeOptions
  ): Promise<PasskeySignupChallengeResponse> {
    return this.#passkeyClient.signupChallenge(options);
  }

  /**
   * Requests a passkey login challenge for an existing user.
   *
   * Returns WebAuthn public key request options to pass to
   * `navigator.credentials.get()`.
   *
   * @throws {PasskeyLoginChallengeError} If the request fails (invalid realm, network error, etc.)
   */
  async loginChallenge(
    options?: PasskeyLoginChallengeOptions
  ): Promise<PasskeyLoginChallengeResponse> {
    return this.#passkeyClient.loginChallenge(options);
  }

  /**
   * Exchanges a passkey credential for tokens.
   *
   * Call this after the user completes the WebAuthn ceremony (signup or login)
   * with the serialized credential response. Tokens are cached and the session
   * is established (same as standard login).
   *
   * @throws {GenericError} If the token exchange fails (expired authSession, invalid credential, etc.)
   */
  async signinWithPasskey(
    options: SigninWithPasskeyOptions
  ): Promise<TokenEndpointResponse> {
    return this.#auth0Client._requestTokenForPasskey({
      authSession: options.authSession,
      credential: options.credential,
      realm: options.realm,
      scope: options.scope,
      audience: options.audience
    });
  }

  /**
   * Creates a passkey enrollment challenge for an authenticated user.
   *
   * Allows an existing user to add a passkey to their account.
   * Returns WebAuthn public key creation options to pass to
   * `navigator.credentials.create()`.
   */
  async enrollmentChallenge(
    options?: PasskeyEnrollmentOptions
  ): Promise<PasskeyEnrollmentResponse> {
    const body: Record<string, unknown> = { type: 'passkey' };

    if (options?.connection) body.connection = options.connection;
    if (options?.identity) body.identity = options.identity;

    const res = await this.#myAccountFetcher.fetchWithAuth(
      `${this.#apiBase}v1/authentication-methods`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const responseBody = await this.#handleResponse<{
      auth_session: string;
      authn_params_public_key: PasskeyEnrollmentResponse['authnParamsPublicKey'];
    }>(
      res,
      'Failed to create passkey enrollment challenge',
      PasskeyEnrollmentError
    );

    return {
      authSession: responseBody.auth_session,
      authnParamsPublicKey: responseBody.authn_params_public_key
    };
  }

  /**
   * Verifies a passkey enrollment to complete registration.
   *
   * Call this after the user creates a credential using the enrollment challenge.
   */
  async enrollmentVerify(
    options: PasskeyEnrollmentVerifyOptions
  ): Promise<void> {
    const body = {
      auth_session: options.authSession,
      authn_response: options.credential
    };

    const res = await this.#myAccountFetcher.fetchWithAuth(
      // %7C is the URL-encoded pipe character in "passkey|new"
      `${this.#apiBase}v1/authentication-methods/passkey%7Cnew/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    await this.#handleResponse<void>(
      res,
      'Failed to verify passkey enrollment',
      PasskeyEnrollmentVerifyError
    );
  }

  async #handleResponse<T>(
    res: Response,
    defaultMessage: string,
    ErrorClass:
      | typeof PasskeyEnrollmentError
      | typeof PasskeyEnrollmentVerifyError
  ): Promise<T> {
    let rawText: string | undefined;
    let body: any;

    try {
      rawText = await res.text();
      body = rawText ? JSON.parse(rawText) : undefined;
    } catch {
      if (!res.ok) {
        throw new ErrorClass(defaultMessage, {
          status: res.status,
          detail: rawText
        });
      }
      return undefined as T;
    }

    if (!res.ok) {
      throw new ErrorClass(
        body?.error_description || body?.detail || defaultMessage,
        body
      );
    }

    return body as T;
  }
}
