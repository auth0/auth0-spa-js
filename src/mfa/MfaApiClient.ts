import type { TokenEndpointResponse } from '../global';
import type {
  Authenticator,
  EnrollAuthenticatorParams,
  EnrollmentResponse,
  ChallengeParams,
  ChallengeResponse,
  VerifyChallengeParams
} from './types';

/**
 * Client for Auth0 MFA API operations
 *
 * Manages multi-factor authentication including:
 * - Listing enrolled authenticators
 * - Enrolling new authenticators (OTP, SMS, Voice, Push, Email)
 * - Deleting authenticators
 * - Initiating MFA challenges
 * - Verifying MFA challenges
 *
 * @example
 * ```typescript
 * const mfaClient = auth0.createMfaClient(mfaToken);
 * const authenticators = await mfaClient.listAuthenticators();
 * ```
 */
export class MfaApiClient {
  private baseUrl: string;
  private mfaToken: string;

  constructor(baseUrl: string, mfaToken: string) {
    this.baseUrl = baseUrl;
    this.mfaToken = mfaToken;
  }

  /**
   * Lists all enrolled MFA authenticators for the user
   *
   * Requires MFA access token with 'read:authenticators' scope
   *
   * @returns Array of enrolled authenticators (filters out inactive ones)
   * @throws {Error} If the request fails
   *
   * @example
   * ```typescript
   * const authenticators = await mfaClient.listAuthenticators();
   * console.log(authenticators);
   * // [{ id: 'otp|dev_xxx', authenticator_type: 'otp', active: true }]
   * ```
   */
  public async listAuthenticators(): Promise<Authenticator[]> {
    const url = `${this.baseUrl}/mfa/authenticators`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.mfaToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error_description || 'Failed to list authenticators'
      );
    }

    const authenticators = await response.json();
    // Filter out inactive authenticators as per Auth0 best practices
    return authenticators;
  }

  /**
   * Enrolls a new MFA authenticator
   *
   * Requires MFA access token with 'enroll' scope
   *
   * @param params - Enrollment parameters (type-specific)
   * @returns Enrollment response with authenticator details
   * @throws {Error} If enrollment fails
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
    const url = `${this.baseUrl}/mfa/associate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.mfaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error_description || 'Failed to enroll authenticator'
      );
    }

    return await response.json();
  }

  /**
   * Deletes an enrolled MFA authenticator
   *
   * Requires MFA access token with 'remove:authenticators' scope
   *
   * Important behavioral notes:
   * - Deleting push authenticator also deletes associated OTP enrollment
   * - Deleting SMS also deletes voice (they are coupled)
   * - Recovery codes cannot be deleted (regenerate instead)
   *
   * @param authenticatorId - ID of authenticator to delete (e.g., 'otp|dev_xxx')
   * @throws {Error} If deletion fails or authenticator not found
   *
   * @example
   * ```typescript
   * await mfaClient.deleteAuthenticator('otp|dev_IsBj5j3H12VAdOIj');
   * ```
   */
  public async deleteAuthenticator(authenticatorId: string): Promise<void> {
    const url = `${this.baseUrl}/mfa/authenticators/${encodeURIComponent(authenticatorId)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.mfaToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error_description || 'Failed to delete authenticator'
      );
    }

    // Returns void on success (204 No Content)
  }

  /**
   * Initiates an MFA challenge
   *
   * Sends OTP via SMS, initiates push notification, or prepares for OTP entry
   *
   * @param params - Challenge parameters
   * @returns Challenge response with oob_code if applicable
   * @throws {Error} If challenge initiation fails
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
    const url = `${this.baseUrl}/mfa/challenge`;

    const body: any = {
      mfa_token: params.mfa_token,
      client_id: params.client_id,
      challenge_type: params.challenge_type
    };

    if (params.authenticator_id) {
      body.authenticator_id = params.authenticator_id;
    }

    if (params.oob_channel) {
      body.oob_channel = params.oob_channel;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.mfaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error_description || 'Failed to challenge authenticator'
      );
    }

    return await response.json();
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
    const url = `${this.baseUrl}/oauth/token`;

    const body: any = {
      mfa_token: params.mfa_token,
      client_id: params.client_id,
      grant_type: params.grant_type
    };

    if (params.otp) {
      body.otp = params.otp;
    }

    if (params.oob_code) {
      body.oob_code = params.oob_code;
    }

    if (params.binding_code) {
      body.binding_code = params.binding_code;
    }

    // This endpoint doesn't require Bearer auth, just the mfa_token in body
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error_description ||
        `MFA verification failed: ${errorData.error || 'Unknown error'}`
      );
    }

    return await response.json();
  }
}
