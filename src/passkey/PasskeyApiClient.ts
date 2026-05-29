import type { Auth0Client } from '../Auth0Client';
import type { TokenEndpointResponse } from '../global';
import type {
  PasskeySignupOptions,
  PasskeyLoginOptions,
  PasskeyCredentialResponse,
  PasskeyCreationOptions,
  PasskeyRequestOptions
} from './types';
import type { PasskeyClient } from '@auth0/auth0-auth-js';
import { PasskeyError } from './errors';

/**
 * Client for Auth0 Passkey operations.
 *
 * Provides 2 public methods:
 * - `signup` — Register a new user with a passkey (full flow: challenge → WebAuthn → token exchange)
 * - `login` — Sign in with a passkey (full flow: challenge → WebAuthn → token exchange)
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

  /**
   * @internal
   * Do not instantiate directly. Use Auth0Client.passkey instead.
   */
  constructor(passkeyClient: PasskeyClient, auth0Client: Auth0Client) {
    this.#passkeyClient = passkeyClient;
    this.#auth0Client = auth0Client;
  }

  /**
   * Register a new user with a passkey.
   *
   * Handles the full flow: requests a signup challenge, triggers the browser
   * WebAuthn credential creation ceremony, serializes the result, and exchanges
   * it for tokens.
   *
   * @param options - Passkey signup options (user identifier, optional scope/audience)
   * @returns A promise that resolves to the token endpoint response containing access/ID tokens
   * @throws {PasskeyError} If WebAuthn is not supported in the browser
   * @throws {PasskeyRegisterError} If the challenge request fails
   * @throws {GenericError} If the token exchange fails
   * @throws {PasskeyError} If the user cancels the WebAuthn prompt
   */
  async signup(options: PasskeySignupOptions): Promise<TokenEndpointResponse> {
    if (!window.PublicKeyCredential) {
      throw new PasskeyError('passkey_not_supported', 'WebAuthn is not supported in this browser.');
    }

    const { scope, audience, ...challengeOptions } = options;

    const challenge = await this.#passkeyClient.register(challengeOptions);

    const publicKeyOptions = prepareCreationOptions(
      challenge.authnParamsPublicKey
    );
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });

    if (!credential) {
      throw new PasskeyError(
        'passkey_cancelled',
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
   * @param options - Optional passkey login options (optional scope/audience/realm/organization)
   * @returns A promise that resolves to the token endpoint response containing access/ID tokens
   * @throws {PasskeyError} If WebAuthn is not supported in the browser
   * @throws {PasskeyChallengeError} If the challenge request fails
   * @throws {GenericError} If the token exchange fails
   * @throws {PasskeyError} If the user cancels the WebAuthn prompt
   */
  async login(options?: PasskeyLoginOptions): Promise<TokenEndpointResponse> {
    if (!window.PublicKeyCredential) {
      throw new PasskeyError('passkey_not_supported', 'WebAuthn is not supported in this browser.');
    }

    const { scope, audience, ...challengeOptions } = options || {};

    const challenge = await this.#passkeyClient.challenge(
      Object.keys(challengeOptions).length > 0 ? challengeOptions : undefined
    );

    const publicKeyOptions = prepareRequestOptions(
      challenge.authnParamsPublicKey
    );
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });

    if (!credential) {
      throw new PasskeyError(
        'passkey_cancelled',
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

}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, b => String.fromCharCode(b)).join('');
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
  } as PublicKeyCredentialRequestOptions;
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
