import type {
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  SigninWithPasskeyOptions,
  PasskeyCreationOptions,
  PasskeyRequestOptions
} from '@auth0/auth0-auth-js';

export type {
  PasskeySignupChallengeOptions,
  PasskeySignupChallengeResponse,
  PasskeyLoginChallengeOptions,
  PasskeyLoginChallengeResponse,
  PasskeyCredentialResponse,
  SigninWithPasskeyOptions,
  PasskeyCreationOptions,
  PasskeyRequestOptions
};

/**
 * Options for creating a passkey enrollment challenge.
 */
export interface PasskeyEnrollmentOptions {
  connection?: string;
  identity?: string;
}

/**
 * Response from a passkey enrollment challenge.
 */
export interface PasskeyEnrollmentResponse {
  authSession: string;
  authnParamsPublicKey: PasskeyCreationOptions;
}

/**
 * Options for verifying a passkey enrollment.
 */
export interface PasskeyEnrollmentVerifyOptions {
  authSession: string;
  credential: PasskeyCredentialResponse;
}
