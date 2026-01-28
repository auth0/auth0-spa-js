import { Auth0Client } from '../Auth0Client';
import type { TokenEndpointResponse } from '../global';
import type {
  Authenticator,
  EnrollParams,
  EnrollmentResponse,
  ChallengeAuthenticatorParams,
  ChallengeResponse,
  VerifyParams,
  OobChannel,
  ChallengeType,
  EnrollmentFactor
} from './types';
import { getAuthJsEnrollParams, getGrantType } from './utils';
import {
  MfaClient as Auth0AuthJsMfaClient,
  MfaListAuthenticatorsError as Auth0JsMfaListAuthenticatorsError,
  MfaEnrollmentError as Auth0JsMfaEnrollmentError,
  MfaChallengeError as Auth0JsMfaChallengeError
} from '@auth0/auth0-auth-js';
import {
  MfaListAuthenticatorsError,
  MfaEnrollmentError,
  MfaChallengeError,
  MfaVerifyError,
  MfaEnrollmentFactorsError
} from './errors';
import { MfaRequirements, MfaRequiredError } from '../errors';
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
   * Stores authentication details (scope, audience, and MFA requirements) for MFA token verification.
   * This is automatically called by Auth0Client when an mfa_required error occurs.
   *
   * The context is stored keyed by the MFA token, enabling concurrent MFA flows.
   *
   * @param mfaToken - The MFA token from the mfa_required error response
   * @param scope - The OAuth scope from the original request (optional)
   * @param audience - The API audience from the original request (optional)
   * @param mfaRequirements - The MFA requirements from the mfa_required error (optional)
   */
  public setMFAAuthDetails(
    mfaToken: string,
    scope?: string,
    audience?: string,
    mfaRequirements?: MfaRequirements
  ) {
    this.contextManager.set(mfaToken, { scope, audience, mfaRequirements });
  }

  /**
   * Gets enrolled MFA authenticators filtered by challenge types from context.
   *
   * Challenge types are automatically resolved from the stored MFA context
   * (set when mfa_required error occurred).
   *
   * @param mfaToken - MFA token from mfa_required error
   * @returns Array of enrolled authenticators matching the challenge types
   * @throws {MfaListAuthenticatorsError} If the request fails or context not found
   *
   * @example Basic usage
   * ```typescript
   * try {
   *   await auth0.getTokenSilently();
   * } catch (e) {
   *   if (e instanceof MfaRequiredError) {
   *     // SDK automatically uses challenge types from error context
   *     const authenticators = await auth0.mfa.getAuthenticators(e.mfa_token);
   *   }
   * }
   * ```
   */
  public async getAuthenticators(mfaToken: string): Promise<Authenticator[]> {
    // Auto-resolve challenge types from stored context
    const context = this.contextManager.get(mfaToken);

    // Single validation check for context and challenge types
    if (!context?.mfaRequirements?.challenge || context.mfaRequirements.challenge.length === 0) {
      throw new MfaListAuthenticatorsError(
        'invalid_request',
        'challengeType is required and must contain at least one challenge type, please check mfa_required error payload'
      );
    }

    const challengeTypes = context.mfaRequirements.challenge.map(
      c => c.type
    ) as ChallengeType[];

    try {
      const allAuthenticators = await this.authJsMfaClient.listAuthenticators({
        mfaToken
      });

      // Filter authenticators by challenge types from context
      return allAuthenticators.filter(auth => {
        if (!auth.type) return false;
        return challengeTypes.includes(auth.type as ChallengeType);
      });
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaListAuthenticatorsError) {
        throw new MfaListAuthenticatorsError(
          error.cause?.error!,
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
   * @param params - Enrollment parameters including mfaToken and factorType
   * @returns Enrollment response with authenticator details
   * @throws {MfaEnrollmentError} If enrollment fails
   *
   * @example OTP enrollment
   * ```typescript
   * const enrollment = await mfa.enroll({
   *   mfaToken: mfaToken,
   *   factorType: 'otp'
   * });
   * console.log(enrollment.secret); // Base32 secret
   * console.log(enrollment.barcodeUri); // QR code URI
   * ```
   *
   * @example SMS enrollment
   * ```typescript
   * const enrollment = await mfa.enroll({
   *   mfaToken: mfaToken,
   *   factorType: 'sms',
   *   phoneNumber: '+12025551234'
   * });
   * ```
   */
  public async enroll(
    params: EnrollParams
  ): Promise<EnrollmentResponse> {
    const authJsParams = getAuthJsEnrollParams(params);

    try {
      // Type assertion is safe here because getAuthJsEnrollParams ensures correct mapping
      return await this.authJsMfaClient.enrollAuthenticator(authJsParams as any);
    } catch (error: unknown) {
      if (error instanceof Auth0JsMfaEnrollmentError) {
        throw new MfaEnrollmentError(
          error.cause?.error!,
          error.message
        );
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
   *   challengeType: 'oob',
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
        throw new MfaChallengeError(
          error.cause?.error!,
          error.message
        );
      }
      throw error;
    }
  }

  /**
   * Gets available MFA enrollment factors from the stored context.
   *
   * This method exposes the enrollment options from the mfa_required error's
   * mfaRequirements.enroll array, eliminating the need for manual parsing.
   *
   * @param mfaToken - MFA token from mfa_required error
   * @returns Array of enrollment factors available for the user (empty array if no enrollment required)
   * @throws {MfaEnrollmentFactorsError} If MFA context not found
   *
   * @example Basic usage
   * ```typescript
   * try {
   *   await auth0.getTokenSilently();
   * } catch (error) {
   *   if (error.error === 'mfa_required') {
   *     // Get enrollment options from SDK
   *     const enrollOptions = await auth0.mfa.getEnrollmentFactors(error.mfa_token);
   *     // [{ type: 'otp' }, { type: 'phone' }, { type: 'push-notification' }]
   *
   *     showEnrollmentOptions(enrollOptions);
   *   }
   * }
   * ```
   *
   * @example Check if enrollment is required
   * ```typescript
   * try {
   *   const factors = await auth0.mfa.getEnrollmentFactors(mfaToken);
   *   if (factors.length > 0) {
   *     // User needs to enroll in MFA
   *     renderEnrollmentUI(factors);
   *   } else {
   *     // No enrollment required, proceed with challenge
   *   }
   * } catch (error) {
   *   if (error instanceof MfaEnrollmentFactorsError) {
   *     console.error('Context not found:', error.error_description);
   *   }
   * }
   * ```
   */
  public async getEnrollmentFactors(
    mfaToken: string
  ): Promise<EnrollmentFactor[]> {
    const context = this.contextManager.get(mfaToken);

    if (!context || !context.mfaRequirements) {
      throw new MfaEnrollmentFactorsError(
        'mfa_context_not_found',
        'MFA context not found for this MFA token. Please retry the original request to get a new MFA token.'
      );
    }

    // Return empty array if no enrollment required (not an error case)
    if (!context.mfaRequirements.enroll || context.mfaRequirements.enroll.length === 0) {
      return [];
    }

    return context.mfaRequirements.enroll;
  }

  /**
   * Verifies an MFA challenge and completes authentication
   *
   * The scope and audience are retrieved from the stored context (set when the
   * mfa_required error occurred). The grant_type is automatically inferred from
   * which verification field is provided (otp, oobCode, or recoveryCode).
   *
   * @param params - Verification parameters with OTP, OOB code, or recovery code
   * @returns Token response with access_token, id_token, refresh_token
   * @throws {MfaVerifyError} If verification fails (invalid code, expired, rate limited)
   * @throws {MfaVerifyError} If MFA context not found
   * @throws {MfaVerifyError} If grant_type cannot be inferred
   *
   * Rate limits:
   * - 10 verification attempts allowed
   * - Refreshes at 1 attempt per 6 minutes
   *
   * @example OTP verification (grant_type inferred from otp field)
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
   *   otp: '123456'
   * });
   * console.log(tokens.access_token);
   * ```
   *
   * @example OOB verification (grant_type inferred from oobCode field)
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
   *   oobCode: challenge.oobCode,
   *   bindingCode: '123456' // Code user received via SMS
   * });
   * ```
   *
   * @example Recovery code verification (grant_type inferred from recoveryCode field)
   * ```typescript
   * const tokens = await mfa.verify({
   *   mfaToken: mfaTokenFromLogin,
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
      throw new MfaVerifyError(
        'mfa_context_not_found',
        'MFA context not found for this MFA token. Please retry the original request to get a new MFA token.'
      );
    }

    // Get grant type from verification fields
    const grantType = getGrantType(params);

    if (!grantType) {
      throw new MfaVerifyError(
        'invalid_request',
        'Unable to determine grant type. Provide one of: otp, oobCode, or recoveryCode.'
      );
    }

    const scope = context.scope;
    const audience = context.audience;

    try {
      const result = await this.auth0Client._requestTokenForMfa({
        grant_type: grantType,
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
    } catch (error: unknown) {
      if (error instanceof MfaRequiredError) {
        this.setMFAAuthDetails(
          error.mfa_token,
          scope,
          audience,
          error.mfa_requirements
        );
      } else if (error instanceof MfaVerifyError) {
        throw new MfaVerifyError(
          error.error,
          error.error_description
        );
      }
      throw error;
    }
  }
}
