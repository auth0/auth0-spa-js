import type {
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  PasskeyCreationOptions,
  PasskeyRequestOptions
} from '@auth0/auth0-auth-js';

export type {
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  PasskeyCreationOptions,
  PasskeyRequestOptions
};

/**
 * Options for passkey signup (registering a new user with a passkey).
 */
export type PasskeySignupOptions = PasskeySignupChallengeOptions & {
  scope?: string;
  audience?: string;
};

/**
 * Options for passkey login (authenticating with an existing passkey).
 */
export type PasskeyLoginOptions = PasskeyLoginChallengeOptions & {
  scope?: string;
  audience?: string;
};

/**
 * A passkey signup challenge ready for the WebAuthn ceremony.
 *
 * `publicKey` is decoded (base64url → ArrayBuffer) and can be fed directly into
 * a WebAuthn credential creation ceremony. `authSession` must be retained and passed to `getTokenWithPasskey()`.
 */
export type PasskeySignupChallenge = {
  authSession: string;
  publicKey: PublicKeyCredentialCreationOptions;
};

/**
 * A passkey login challenge ready for the WebAuthn ceremony.
 *
 * `publicKey` is decoded (base64url → ArrayBuffer) and can be fed directly into
 * a WebAuthn assertion ceremony . `authSession` must be retained and passed to `getTokenWithPasskey()`.
 */
export type PasskeyLoginChallenge = {
  authSession: string;
  publicKey: PublicKeyCredentialRequestOptions;
};

/**
 * Options for exchanging a signed passkey credential for tokens.
 *
 * `credential` is the raw `PublicKeyCredential` produced by the WebAuthn
 * ceremony — a creation credential (signup) or an assertion credential
 * (login). The credential type (attestation vs assertion) is detected
 * automatically during serialization.
 */
export type PasskeyGetTokenOptions = {
  authSession: string;
  credential: PublicKeyCredential;
  realm?: string;
  organization?: string;
  scope?: string;
  audience?: string;
};
