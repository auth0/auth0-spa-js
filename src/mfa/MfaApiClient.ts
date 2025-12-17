import { Auth0Client } from '../Auth0Client';
import type { TokenEndpointResponse } from '../global';
import type {
  Authenticator,
  EnrollAuthenticatorParams,
  EnrollmentResponse,
  ChallengeParams,
  ChallengeResponse,
  VerifyChallengeParams,
  OobChannel
} from './types';
import {
  MfaClient as Auth0AuthJsMfaClient,
  MfaListAuthenticatorsError as Auth0JsMfaListAuthenticatorsError,
  MfaEnrollmentError as Auth0JsMfaEnrollmentError,
  MfaChallengeError as Auth0JsMfaChallengeError
} from '@auth0/auth0-auth-js';
import {
  MfaListAuthenticatorsError,
  MfaEnrollmentError,
  MfaChallengeError
} from './errors';

/**
 * Client for Auth0 MFA API operations
 *
 * Manages multi-factor authentication including:
 * - Listing enrolled authenticators
 * - Enrolling new authenticators (OTP, SMS, Voice, Push, Email)
 * - Initiating MFA challenges
 * - Verifying MFA challenges
 *
 * This is a wrapper around auth0-auth-js MfaClient that maintains
 * backward compatibility with the existing spa-js API.
 *
 * @example
 * ```typescript
 * const mfaClient = await auth0.createMfaClient(mfaToken);
 * const authenticators = await mfaClient.listAuthenticators();
 * ```
 */
export class MfaApiClient {
  private authJsMfaClient: Auth0AuthJsMfaClient;
  private auth0Client: Auth0Client;
  private scope?: string;
  private audience?: string;
  private mfaToken: string = '';

  /**
   * @internal
   * Do not instantiate directly. Use Auth0Client.createMfaClient() instead.
   */
  constructor(authJsMfaClient: Auth0AuthJsMfaClient, auth0Client: Auth0Client) {
    this.authJsMfaClient = authJsMfaClient;
    this.auth0Client = auth0Client;
  }

  /**
   * @internal
   * Sets the MFA token for subsequent MFA operations.
   * This is automatically called by Auth0Client when an mfa_required error occurs.
   *
   * @param token - The MFA token from the mfa_required error response
   */
  public setMfaToken(token: string) {
    this.mfaToken = token;
  }

  /**
   * @internal
   * Stores authentication details (scope and audience) for MFA token verification.
   * This is automatically called by Auth0Client when an mfa_required error occurs.
   *
   * @param scope - The OAuth scope to use for token verification
   * @param audience - The API audience to use for token verification (optional)
   */
  public setMFAAuthDetails(scope: string, audience?: string) {
    this.scope = scope;
    this.audience = audience;
  }

  /**
   * Lists all enrolled MFA authenticators for the user
   *
   * Requires MFA access token with 'read:authenticators' scope
   *
   * @returns Array of enrolled authenticators (filters out inactive ones)
   * @throws {MfaListAuthenticatorsError} If the request fails
   *
   * @example
   * ```typescript
   * const authenticators = await mfaClient.listAuthenticators();
   * console.log(authenticators);
   * // [{ id: 'otp|dev_xxx', authenticator_type: 'otp', active: true }]
   * ```
   */
  public async listAuthenticators(): Promise<Authenticator[]> {
    try {
      return await this.authJsMfaClient.listAuthenticators({ mfaToken: this.mfaToken });
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaListAuthenticatorsError) {
        throw new MfaListAuthenticatorsError(error);
      }
      throw error;
    }
  }

  /**
   * Enrolls a new MFA authenticator
   *
   * Requires MFA access token with 'enroll' scope
   *
   * @param params - Enrollment parameters (type-specific)
   * @returns Enrollment response with authenticator details
   * @throws {MfaEnrollmentError} If enrollment fails
   *
   * @example OTP enrollment
   * ```typescript
   * const enrollment = await mfaClient.enrollAuthenticator({
   *   authenticator_types: ['otp']
   * });
   * console.log(enrollment.secret); // Base32 secret
   * console.log(enrollment.barcode_uri); // QR code URI
   * ```
   *
   * @example SMS enrollment
   * ```typescript
   * const enrollment = await mfaClient.enrollAuthenticator({
   *   authenticator_types: ['oob'],
   *   oob_channels: ['sms'],
   *   phone_number: '+12025551234'
   * });
   * ```
   */
  public async enrollAuthenticator(
    params: EnrollAuthenticatorParams
  ): Promise<EnrollmentResponse> {
    try {
      return await this.authJsMfaClient.enrollAuthenticator({ ...params, mfaToken: this.mfaToken });
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaEnrollmentError) {
        throw new MfaEnrollmentError(error);
      }
      throw error;
    }
  }

  /**
   * Initiates an MFA challenge
   *
   * Sends OTP via SMS, initiates push notification, or prepares for OTP entry
   *
   * @param params - Challenge parameters
   * @returns Challenge response with oob_code if applicable
   * @throws {MfaChallengeError} If challenge initiation fails
   *
   * @example OTP challenge
   * ```typescript
   * const challenge = await mfaClient.challengeAuthenticator({
   *   mfa_token: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   challenge_type: 'otp',
   *   authenticator_id: 'otp|dev_xxx'
   * });
   * // User enters OTP from their authenticator app
   * ```
   *
   * @example SMS challenge
   * ```typescript
   * const challenge = await mfaClient.challengeAuthenticator({
   *   mfa_token: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   challenge_type: 'oob',
   *   oob_channel: 'sms',
   *   authenticator_id: 'sms|dev_xxx'
   * });
   * console.log(challenge.oob_code); // Use for verification
   * ```
   */
  public async challengeAuthenticator(
    params: ChallengeParams
  ): Promise<ChallengeResponse> {
    try {
      // Strip mfa_token and client_id - auth-js requires mfaToken as parameter
      const authJsParams: {
        challenge_type: 'otp' | 'oob';
        authenticator_id?: string;
        oob_channel?: OobChannel;
        mfaToken: string;
      } = {
        challenge_type: params.challenge_type,
        mfaToken: this.mfaToken
      };

      if (params.authenticator_id) {
        authJsParams.authenticator_id = params.authenticator_id;
      }

      return await this.authJsMfaClient.challengeAuthenticator(authJsParams);
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaChallengeError) {
        throw new MfaChallengeError(error);
      }
      throw error;
    }
  }

  /**
   * Verifies an MFA challenge and completes authentication
   *
   * @param params - Verification parameters with OTP or OOB code
   * @returns Token response with access_token, id_token, refresh_token
   * @throws {Error} If verification fails (invalid code, expired, rate limited)
   *
   * Rate limits:
   * - 10 verification attempts allowed
   * - Refreshes at 1 attempt per 6 minutes
   *
   * @example OTP verification
   * ```typescript
   * const tokens = await mfaClient.verifyChallenge({
   *   mfa_token: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
   *   otp: '123456'
   * });
   * console.log(tokens.access_token);
   * ```
   *
   * @example OOB verification (SMS)
   * ```typescript
   * const tokens = await mfaClient.verifyChallenge({
   *   mfa_token: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
   *   oob_code: challenge.oob_code,
   *   binding_code: '123456' // Code user received via SMS
   * });
   * ```
   */
  public async verifyChallenge(
    params: VerifyChallengeParams
  ): Promise<TokenEndpointResponse> {
    if (!this.scope || !this.audience || !this.mfaToken) {
      const missing = [];
      if (!this.scope) missing.push('scope');
      if (!this.audience) missing.push('audience');
      if (!this.mfaToken) missing.push('MFA token');

      throw new Error(
        `MFA client is not properly configured. Missing: ${missing.join(', ')}. ` +
        'See documentation: https://github.com/auth0/auth0-spa-js/blob/main/EXAMPLES.md#multi-factor-authentication-mfa'
      );
    }

    return this.auth0Client._requestTokenForMfa({
      grant_type: params.grant_type,
      mfa_token: this.mfaToken,
      scope: this.scope,
      audience: this.audience,
      otp: params.otp,
      oob_code: params.oob_code,
      binding_code: params.binding_code
    });
  }
}
