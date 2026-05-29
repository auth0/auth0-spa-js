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
