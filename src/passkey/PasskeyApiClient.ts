import type { Auth0Client } from '../Auth0Client';
import type { Fetcher } from '../fetcher';
import type { TokenEndpointResponse } from '../global';
import type {
  PasskeySignupOptions,
  PasskeyLoginOptions,
  PasskeyCredentialResponse,
  PasskeyCreationOptions,
  PasskeyRequestOptions,
  PasskeyEnrollmentOptions,
  PasskeyEnrollmentResponse,
  PasskeyEnrollmentVerifyOptions
} from './types';
import { PasskeyEnrollmentError, PasskeyEnrollmentVerifyError } from './errors';
import { PasskeyClient } from '@auth0/auth0-auth-js';

/**
 * Client for Auth0 Passkey operations.
 *
 * Provides 4 public methods:
 * - `signup` — Register a new user with a passkey (full flow: challenge → WebAuthn → token exchange)
 * - `login` — Sign in with a passkey (full flow: challenge → WebAuthn → token exchange)
 * - `enrollmentChallenge` — Start passkey enrollment for an authenticated user
 * - `enrollmentVerify` — Complete passkey enrollment
 *
 * @example
 * ```typescript
 * // Signup — single call handles everything
 * const tokens = await auth0.passkey.signup({ email: 'user@example.com' });
 *
 * // Login — single call handles everything
 * const tokens = await auth0.passkey.login();
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
   * Register a new user with a passkey.
   *
   * Handles the full flow: requests a signup challenge, triggers the browser
   * WebAuthn credential creation ceremony, serializes the result, and exchanges
   * it for tokens.
   *
   * @throws {PasskeyRegisterError} If the challenge request fails
   * @throws {GenericError} If the token exchange fails
   * @throws {Error} If the user cancels the WebAuthn prompt
   */
  async signup(options: PasskeySignupOptions): Promise<TokenEndpointResponse> {
    const { scope, audience, ...challengeOptions } = options;

    const challenge = await this.#passkeyClient.register(challengeOptions);

    const publicKeyOptions = prepareCreationOptions(
      challenge.authnParamsPublicKey
    );
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });

    if (!credential) {
      throw new Error(
        'Passkey creation was cancelled or no credential was returned.'
      );
    }

    const serialized = serializeCreationCredential(
      credential as PublicKeyCredential
    );

    return this.#auth0Client._requestTokenForPasskey({
      authSession: challenge.authSession,
      credential: serialized,
      realm: challengeOptions.realm,
      organization: challengeOptions.organization,
      scope,
      audience
    });
  }

  /**
   * Sign in with an existing passkey.
   *
   * Handles the full flow: requests a login challenge, triggers the browser
   * WebAuthn assertion ceremony, serializes the result, and exchanges it
   * for tokens.
   *
   * @throws {PasskeyChallengeError} If the challenge request fails
   * @throws {GenericError} If the token exchange fails
   * @throws {Error} If the user cancels the WebAuthn prompt
   */
  async login(options?: PasskeyLoginOptions): Promise<TokenEndpointResponse> {
    const { scope, audience, ...challengeOptions } = options || {};

    const challenge = await this.#passkeyClient.challenge(
      Object.keys(challengeOptions).length ? challengeOptions : undefined
    );

    const publicKeyOptions = prepareRequestOptions(
      challenge.authnParamsPublicKey
    );
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });

    if (!credential) {
      throw new Error(
        'Passkey authentication was cancelled or no credential was returned.'
      );
    }

    const serialized = serializeAssertionCredential(
      credential as PublicKeyCredential
    );

    return this.#auth0Client._requestTokenForPasskey({
      authSession: challenge.authSession,
      credential: serialized,
      realm: challengeOptions.realm,
      organization: challengeOptions.organization,
      scope,
      audience
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

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function prepareCreationOptions(
  publicKey: PasskeyCreationOptions
): PublicKeyCredentialCreationOptions {
  return {
    ...publicKey,
    challenge: base64urlToBuffer(publicKey.challenge),
    user: {
      ...publicKey.user,
      id: base64urlToBuffer(publicKey.user.id)
    },
    pubKeyCredParams: publicKey.pubKeyCredParams as PublicKeyCredentialParameters[],
    authenticatorSelection: publicKey.authenticatorSelection as AuthenticatorSelectionCriteria | undefined
  };
}

function prepareRequestOptions(
  publicKey: PasskeyRequestOptions
): PublicKeyCredentialRequestOptions {
  return {
    ...publicKey,
    challenge: base64urlToBuffer(publicKey.challenge)
  } as unknown as PublicKeyCredentialRequestOptions;
}

function serializeCreationCredential(
  credential: PublicKeyCredential
): PasskeyCredentialResponse {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject)
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>
  };
}

function serializeAssertionCredential(
  credential: PublicKeyCredential
): PasskeyCredentialResponse {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : undefined
    },
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>
  };
}
