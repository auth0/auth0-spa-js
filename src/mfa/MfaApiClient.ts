import { Auth0Client } from '../Auth0Client';
import type { TokenEndpointResponse } from '../global';
import type {
  Authenticator,
  GetAuthenticatorsParams,
  EnrollParams,
  EnrollmentResponse,
  ChallengeAuthenticatorParams,
  ChallengeResponse,
  VerifyParams,
  OobChannel,
  ChallengeType
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
import { MfaContextManager } from './MfaContextManager';

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
 * MFA context (scope, audience) is stored internally keyed by mfaToken,
 * enabling concurrent MFA flows without state conflicts.
 *
 * @example
 * ```typescript
 * try {
 *   await auth0.getTokenSilently({ authorizationParams: { audience: 'https://api.example.com' } });
 * } catch (e) {
 *   if (e instanceof MfaRequiredError) {
 *     // SDK automatically stores context for this mfaToken
 *     const authenticators = await auth0.mfa.getAuthenticators({ mfaToken: e.mfa_token });
 *     // ... complete MFA flow
 *   }
 * }
 * ```
 */
export class MfaApiClient {
  private authJsMfaClient: Auth0AuthJsMfaClient;
  private auth0Client: Auth0Client;
  private contextManager: MfaContextManager;

  /**
   * @internal
   * Do not instantiate directly. Use Auth0Client.mfa instead.
   */
  constructor(authJsMfaClient: Auth0AuthJsMfaClient, auth0Client: Auth0Client) {
    this.authJsMfaClient = authJsMfaClient;
    this.auth0Client = auth0Client;
    this.contextManager = new MfaContextManager();
  }

  /**
   * @internal
   * Stores authentication details (scope and audience) for MFA token verification.
   * This is automatically called by Auth0Client when an mfa_required error occurs.
   *
   * The context is stored keyed by the MFA token, enabling concurrent MFA flows.
   *
   * @param mfaToken - The MFA token from the mfa_required error response
   * @param scope - The OAuth scope from the original request (optional)
   * @param audience - The API audience from the original request (optional)
   */
  public setMFAAuthDetails(mfaToken: string, scope?: string, audience?: string) {
    this.contextManager.set(mfaToken, { scope, audience });
  }

  /**
   * Gets enrolled MFA authenticators filtered by challenge type
   *
   * Requires MFA access token with 'read:authenticators' scope
   *
   * @param params - Parameters containing the MFA token and challenge types
   * @param params.mfaToken - The MFA token from mfa_required error
   * @param params.challengeType - Array of challenge types from mfa_required error's mfa_requirements.challenge[].type
   * @returns Array of enrolled authenticators matching the specified challenge types
   * @throws {MfaListAuthenticatorsError} If the request fails
   * @throws {Error} If challengeType array is empty
   *
   * @example Filter by challenge types from mfa_required error
   * ```typescript
   * try {
   *   await auth0.getTokenSilently();
   * } catch (e) {
   *   if (e instanceof MfaRequiredError) {
   *     // Extract challenge types from error
   *     const challengeTypes = e.mfa_requirements.challenge.map(c => c.type);
   *     
   *     // Get authenticators matching those challenge types
   *     const authenticators = await auth0.mfa.getAuthenticators({
   *       mfaToken: e.mfa_token,
   *       challengeType: challengeTypes
   *     });
   *   }
   * }
   * ```
   */
  public async getAuthenticators(params: GetAuthenticatorsParams): Promise<Authenticator[]> {
    if (!params.challengeType || params.challengeType.length === 0) {
      throw new MfaListAuthenticatorsError(
        'invalid_request',
        'challengeType is required and must contain at least one challenge type. '
      );
    }

    try {
      const allAuthenticators = await this.authJsMfaClient.listAuthenticators({ mfaToken: params.mfaToken });

      // Filter authenticators by challenge type
      return allAuthenticators.filter(auth => {
        if (!auth.type) {
          return false;
        }
        return params.challengeType.includes(auth.type as ChallengeType);
      });
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaListAuthenticatorsError) {
        throw new MfaListAuthenticatorsError(
          error.cause?.error || 'mfa_list_authenticators_error',
          error.message
        );
      }
      throw error;
    }
  }

  /**
   * Enrolls a new MFA authenticator
   *
   * Requires MFA access token with 'enroll' scope
   *
   * @param params - Enrollment parameters including mfaToken (type-specific)
   * @returns Enrollment response with authenticator details
   * @throws {MfaEnrollmentError} If enrollment fails
   *
   * @example OTP enrollment
   * ```typescript
   * const enrollment = await mfa.enroll({
   *   mfaToken: mfaToken,
   *   authenticatorTypes: ['otp']
   * });
   * console.log(enrollment.secret); // Base32 secret
   * console.log(enrollment.barcodeUri); // QR code URI
   * ```
   *
   * @example SMS enrollment
   * ```typescript
   * const enrollment = await mfa.enroll({
   *   mfaToken: mfaToken,
   *   authenticatorTypes: ['oob'],
   *   oobChannels: ['sms'],
   *   phoneNumber: '+12025551234'
   * });
   * ```
   */
  public async enroll(
    params: EnrollParams
  ): Promise<EnrollmentResponse> {
    try {
      const { mfaToken, ...enrollParams } = params;
      return await this.authJsMfaClient.enrollAuthenticator({ ...enrollParams, mfaToken });
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
   * @param params - Challenge parameters including mfaToken
   * @returns Challenge response with oobCode if applicable
   * @throws {MfaChallengeError} If challenge initiation fails
   *
   * @example OTP challenge
   * ```typescript
   * const challenge = await mfa.challenge({
   *   mfaToken: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   challengeType: 'otp',
   *   authenticatorId: 'otp|dev_xxx'
   * });
   * // User enters OTP from their authenticator app
   * ```
   *
   * @example SMS challenge
   * ```typescript
   * const challenge = await mfa.challenge({
   *   mfaToken: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   challengeType: 'oob',
   *   oobChannel: 'sms',
   *   authenticatorId: 'sms|dev_xxx'
   * });
   * console.log(challenge.oobCode); // Use for verification
   * ```
   */
  public async challenge(
    params: ChallengeAuthenticatorParams
  ): Promise<ChallengeResponse> {
    try {
      const authJsParams: {
        challengeType: 'otp' | 'oob';
        authenticatorId?: string;
        oobChannel?: OobChannel;
        mfaToken: string;
      } = {
        challengeType: params.challengeType,
        mfaToken: params.mfaToken
      };

      if (params.authenticatorId) {
        authJsParams.authenticatorId = params.authenticatorId;
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
   * The scope and audience are retrieved from the stored context (set when the
   * mfa_required error occurred).
   *
   * @param params - Verification parameters with OTP, OOB code, or recovery code
   * @returns Token response with access_token, id_token, refresh_token
   * @throws {Error} If verification fails (invalid code, expired, rate limited)
   * @throws {Error} If MFA context not found
   *
   * Rate limits:
   * - 10 verification attempts allowed
   * - Refreshes at 1 attempt per 6 minutes
   *
   * @example OTP verification
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
   *   otp: '123456'
   * });
   * console.log(tokens.access_token);
   * ```
   *
   * @example OOB verification (SMS)
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
   *   oobCode: challenge.oobCode,
   *   bindingCode: '123456' // Code user received via SMS
   * });
   * ```
   *
   * @example Recovery code verification (no challenge needed)
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
   *   client_id: 'YOUR_CLIENT_ID',
   *   grant_type: 'http://auth0.com/oauth/grant-type/mfa-recovery-code',
   *   recoveryCode: 'XXXX-XXXX-XXXX'
   * });
   * ```
   */
  public async verify(
    params: VerifyParams
  ): Promise<TokenEndpointResponse> {
    // Look up stored context for this MFA token
    const context = this.contextManager.get(params.mfaToken);

    // Use context values only (set when mfa_required error occurred)
    if (!context) {
      throw new Error(
        'MFA context not found for this MFA token. ' +
        'Please retry the original request to get a new MFA token. ' +
        'See documentation: https://github.com/auth0/auth0-spa-js/blob/main/EXAMPLES.md#multi-factor-authentication-mfa'
      );
    }

    const scope = context.scope;
    const audience = context.audience;

    const result = await this.auth0Client._requestTokenForMfa({
      grant_type: params.grant_type,
      mfaToken: params.mfaToken,
      scope,
      audience,
      otp: params.otp,
      oob_code: params.oobCode,
      binding_code: params.bindingCode,
      recovery_code: params.recoveryCode
    });

    // Clean up context after successful verification
    this.contextManager.remove(params.mfaToken);

    return result;
  }
}
