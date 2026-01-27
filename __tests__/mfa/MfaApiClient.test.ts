// Mock @auth0/auth0-auth-js before importing MfaApiClient
jest.mock('@auth0/auth0-auth-js', () => {
  class MfaListAuthenticatorsError extends Error {
    constructor(
      message: string,
      public cause?: { error: string; error_description: string }
    ) {
      super(message);
      Object.setPrototypeOf(this, MfaListAuthenticatorsError.prototype);
    }
  }

  class MfaEnrollmentError extends Error {
    constructor(
      message: string,
      public cause?: { error: string; error_description: string }
    ) {
      super(message);
      Object.setPrototypeOf(this, MfaEnrollmentError.prototype);
    }
  }

  class MfaChallengeError extends Error {
    constructor(
      message: string,
      public cause?: { error: string; error_description: string }
    ) {
      super(message);
      Object.setPrototypeOf(this, MfaChallengeError.prototype);
    }
  }

  return {
    MfaClient: jest.fn(),
    MfaListAuthenticatorsError,
    MfaEnrollmentError,
    MfaChallengeError
  };
});

import { MfaApiClient } from '../../src/mfa/MfaApiClient';
import {
  MfaListAuthenticatorsError as Auth0JsMfaListAuthenticatorsError,
  MfaEnrollmentError as Auth0JsMfaEnrollmentError,
  MfaChallengeError as Auth0JsMfaChallengeError
} from '@auth0/auth0-auth-js';
import type { Authenticator } from '../../src/mfa/types';

describe('MfaApiClient', () => {
  let mfaClient: MfaApiClient;
  let mockAuthJsMfaClient: any;
  let mockAuth0Client: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock auth-js MfaClient
    mockAuthJsMfaClient = {
      listAuthenticators: jest.fn(),
      enrollAuthenticator: jest.fn(),
      challengeAuthenticator: jest.fn(),
      verifyChallenge: jest.fn()
    } as any;

    // Create mock Auth0Client
    mockAuth0Client = {
      _requestTokenForMfa: jest.fn()
    } as any;

    mfaClient = new MfaApiClient(mockAuthJsMfaClient, mockAuth0Client);
  });

  describe('getAuthenticators', () => {
    it('should return authenticators from auth-js', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with challenge types
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'otp' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(mockAuthJsMfaClient.listAuthenticators).toHaveBeenCalledWith({
        mfaToken
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error when context is not found', async () => {
      const mfaToken = 'test-mfa-token';

      await expect(
        mfaClient.getAuthenticators(mfaToken)
      ).rejects.toThrow('challengeType is required');
    });

    it('should throw error when context has no mfaRequirements', async () => {
      const mfaToken = 'test-mfa-token';

      // Set up context without mfaRequirements
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');

      await expect(
        mfaClient.getAuthenticators(mfaToken)
      ).rejects.toThrow('challengeType is required');
    });

    it('should throw error when context has empty challenge array', async () => {
      const mfaToken = 'test-mfa-token';

      // Set up context with empty challenge array
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: []
      });

      await expect(
        mfaClient.getAuthenticators(mfaToken)
      ).rejects.toThrow('challengeType is required');
    });

    it('should filter authenticators by single challenge type', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' },
        { id: 'sms|dev_456', authenticatorType: 'oob', active: true, type: 'phone' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with single challenge type
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'otp' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([mockData[0]]);
      expect(result).toHaveLength(1);
    });

    it('should filter authenticators by multiple challenge types', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' },
        { id: 'sms|dev_456', authenticatorType: 'oob', active: true, type: 'phone' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' },
        { id: 'recovery|dev_999', authenticatorType: 'recovery-code', active: true, type: 'recovery-code' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with multiple challenge types
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'phone' }, { type: 'email' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([mockData[1], mockData[2]]);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('phone');
      expect(result[1].type).toBe('email');
    });

    it('should return empty array when no authenticators match challenge types', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with challenge type that doesn't match any authenticators
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'recovery-code' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter by phone challenge type', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' },
        { id: 'sms|dev_456', authenticatorType: 'oob', active: true, type: 'phone' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with phone challenge type
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'phone' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([mockData[1]]);
      expect(result[0].type).toBe('phone');
    });

    it('should filter by totp challenge type', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'totp' },
        { id: 'sms|dev_456', authenticatorType: 'oob', active: true, type: 'phone' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with totp challenge type
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'totp' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([mockData[0]]);
      expect(result[0].type).toBe('totp');
    });

    it('should filter by push-notification challenge type', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticatorType: 'otp', active: true, type: 'otp' },
        { id: 'push|dev_456', authenticatorType: 'oob', active: true, type: 'push-notification' },
        { id: 'email|dev_789', authenticatorType: 'oob', active: true, type: 'email' }
      ];
      const mfaToken = 'test-mfa-token';

      // Set up MFA context with push-notification challenge type
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'push-notification' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.getAuthenticators(mfaToken);

      expect(result).toEqual([mockData[1]]);
      expect(result[0].type).toBe('push-notification');
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const authJsError = new Auth0JsMfaListAuthenticatorsError(
        'Unauthorized',
        {
          error: 'access_denied',
          error_description: 'Unauthorized'
        }
      );

      // Set up MFA context
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'otp' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(authJsError);

      await expect(mfaClient.getAuthenticators(mfaToken)).rejects.toMatchObject({
        error: 'access_denied',
        error_description: 'Unauthorized',
        message: 'Unauthorized'
      });
    });

    it('should rethrow non-MFA errors', async () => {
      const mfaToken = 'test-mfa-token';
      const networkError = new Error('Network error');

      // Set up MFA context
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com', {
        challenge: [{ type: 'otp' }]
      });

      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(networkError);

      await expect(mfaClient.getAuthenticators(mfaToken)).rejects.toBe(networkError);
    });
  });

  describe('enroll', () => {
    it('should convert OTP factorType and call auth-js', async () => {
      const mfaToken = 'test-mfa-token';
      const params = { mfaToken: mfaToken, factorType: 'otp' as const };
      const mockResponse = {
        authenticatorType: 'otp',
        secret: 'SECRET123',
        barcodeUri: 'otpauth://...'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enroll(params);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        mfaToken,
        authenticatorTypes: ['otp']
      });
      expect(result).toEqual(mockResponse);
    });

    it('should convert SMS factorType with phoneNumber', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfaToken: mfaToken,
        factorType: 'sms' as const,
        phoneNumber: '+12025551234'
      };
      const mockResponse = {
        authenticatorType: 'oob',
        oobChannel: 'sms',
        oobCode: 'oob123'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enroll(params);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        mfaToken,
        authenticatorTypes: ['oob'],
        oobChannels: ['sms'],
        phoneNumber: '+12025551234'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should convert email factorType with optional email', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfaToken: mfaToken,
        factorType: 'email' as const,
        email: 'user@example.com'
      };
      const mockResponse = {
        authenticatorType: 'oob',
        oobChannel: 'email',
        oobCode: 'oob123'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enroll(params);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        mfaToken,
        authenticatorTypes: ['oob'],
        oobChannels: ['email'],
        email: 'user@example.com'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should convert push factorType', async () => {
      const mfaToken = 'test-mfa-token';
      const params = { mfaToken: mfaToken, factorType: 'push' as const };
      const mockResponse = {
        authenticatorType: 'oob',
        oobChannel: 'auth0',
        barcodeUri: 'guardian://...'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enroll(params);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        mfaToken,
        authenticatorTypes: ['oob'],
        oobChannels: ['auth0']
      });
      expect(result).toEqual(mockResponse);
    });

    it('should convert voice factorType with phoneNumber', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfaToken: mfaToken,
        factorType: 'voice' as const,
        phoneNumber: '+12025551234'
      };
      const mockResponse = {
        authenticatorType: 'oob',
        oobChannel: 'voice',
        oobCode: 'oob123'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enroll(params);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        mfaToken,
        authenticatorTypes: ['oob'],
        oobChannels: ['voice'],
        phoneNumber: '+12025551234'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const params = { mfaToken: mfaToken, factorType: 'otp' as const };
      const authJsError = new Auth0JsMfaEnrollmentError('Invalid phone number', {
        error: 'invalid_phone_number',
        error_description: 'Invalid phone number'
      });

      mockAuthJsMfaClient.enrollAuthenticator.mockRejectedValue(authJsError);

      await expect(mfaClient.enroll(params)).rejects.toMatchObject({
        error: 'invalid_phone_number',
        error_description: 'Invalid phone number',
        message: 'Invalid phone number'
      });
    });
  });

  describe('challenge', () => {
    it('should use mfaToken from params', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfaToken: mfaToken,
        challengeType: 'otp' as const,
        authenticatorId: 'otp|dev_123'
      };
      const mockResponse = {
        challengeType: 'otp'
      };

      mockAuthJsMfaClient.challengeAuthenticator.mockResolvedValue(
        mockResponse
      );

      const result = await mfaClient.challenge(params);

      expect(mockAuthJsMfaClient.challengeAuthenticator).toHaveBeenCalledWith({
        challengeType: 'otp',
        authenticatorId: 'otp|dev_123',
        mfaToken
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfaToken: mfaToken,
        challengeType: 'otp' as const
      };
      const authJsError = new Auth0JsMfaChallengeError('Rate limit exceeded', {
        error: 'too_many_attempts',
        error_description: 'Too many attempts'
      });

      mockAuthJsMfaClient.challengeAuthenticator.mockRejectedValue(authJsError);

      await expect(
        mfaClient.challenge(params)
      ).rejects.toMatchObject({
        error: 'too_many_attempts',
        error_description: 'Rate limit exceeded'
      });
    });
  });

  describe('verify', () => {
    describe('grant_type inference', () => {
      it('should infer OTP grant type from otp field', async () => {
        const mfaToken = 'token123';
        const mockTokenResponse = { access_token: 'access123', id_token: 'id123' };

        mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');
        mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

        await mfaClient.verify({
          mfaToken: mfaToken,
          otp: '123456'
        });

        expect(mockAuth0Client._requestTokenForMfa).toHaveBeenCalledWith(
          expect.objectContaining({
            grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
            otp: '123456'
          })
        );
      });

      it('should infer OOB grant type from oobCode field', async () => {
        const mfaToken = 'token123';
        const mockTokenResponse = { access_token: 'access123', id_token: 'id123' };

        mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');
        mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

        await mfaClient.verify({
          mfaToken: mfaToken,
          oobCode: 'oob-code-123',
          bindingCode: '123456'
        });

        expect(mockAuth0Client._requestTokenForMfa).toHaveBeenCalledWith(
          expect.objectContaining({
            grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
            oob_code: 'oob-code-123',
            binding_code: '123456'
          })
        );
      });

      it('should infer recovery code grant type from recoveryCode field', async () => {
        const mfaToken = 'token123';
        const mockTokenResponse = { access_token: 'access123', id_token: 'id123' };

        mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');
        mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

        await mfaClient.verify({
          mfaToken: mfaToken,
          recoveryCode: 'XXXX-XXXX-XXXX'
        });

        expect(mockAuth0Client._requestTokenForMfa).toHaveBeenCalledWith(
          expect.objectContaining({
            grant_type: 'http://auth0.com/oauth/grant-type/mfa-recovery-code',
            recovery_code: 'XXXX-XXXX-XXXX'
          })
        );
      });

      it('should throw error when no verification field provided', async () => {
        const mfaToken = 'token123';

        mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');

        await expect(
          mfaClient.verify({ mfaToken: mfaToken })
        ).rejects.toThrow('Unable to determine grant type');
      });
    });

    it('should call auth0Client.requestTokenForMfa with context from setMFAAuthDetails', async () => {
      const mfaToken = 'token123';
      const params = {
        mfaToken: mfaToken,
        otp: '123456'
      };
      const mockTokenResponse = {
        access_token: 'access123',
        id_token: 'id123'
      };

      // Store context keyed by mfaToken
      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');
      mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

      const result = await mfaClient.verify(params);

      expect(mockAuth0Client._requestTokenForMfa).toHaveBeenCalledWith({
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        mfaToken: mfaToken,
        scope: 'openid profile',
        audience: 'https://api.example.com',
        otp: '123456',
        oob_code: undefined,
        binding_code: undefined,
        recovery_code: undefined
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error if context is not found for mfaToken', async () => {
      const mfaToken = 'token123';
      const params = {
        mfaToken: mfaToken,
        otp: '123456'
      };

      // Not calling setMFAAuthDetails for this token

      await expect(mfaClient.verify(params)).rejects.toThrow(
        'MFA context not found for this MFA token'
      );
    });

    it('should remove context after successful verification', async () => {
      const mfaToken = 'token123';
      const params = {
        mfaToken: mfaToken,
        otp: '123456'
      };
      const mockTokenResponse = {
        access_token: 'access123',
        id_token: 'id123'
      };

      mfaClient.setMFAAuthDetails(mfaToken, 'openid profile', 'https://api.example.com');
      mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

      await mfaClient.verify(params);

      // Second call should fail because context was removed
      await expect(mfaClient.verify(params)).rejects.toThrow(
        'MFA context not found for this MFA token'
      );
    });
  });

  describe('concurrent MFA flows', () => {
    it('should maintain separate contexts for different MFA tokens', async () => {
      const mfaToken1 = 'token-flow-1';
      const mfaToken2 = 'token-flow-2';

      // Store different contexts for different tokens
      mfaClient.setMFAAuthDetails(mfaToken1, 'openid profile', 'https://api1.example.com');
      mfaClient.setMFAAuthDetails(mfaToken2, 'openid email', 'https://api2.example.com');

      const mockTokenResponse = { access_token: 'access123', id_token: 'id123' };
      mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

      // Verify flow 1
      await mfaClient.verify({
        mfaToken: mfaToken1,
        otp: '111111'
      });

      expect(mockAuth0Client._requestTokenForMfa).toHaveBeenLastCalledWith(
        expect.objectContaining({
          mfaToken: mfaToken1,
          scope: 'openid profile',
          audience: 'https://api1.example.com'
        })
      );

      // Verify flow 2 - should still have its context
      await mfaClient.verify({
        mfaToken: mfaToken2,
        otp: '222222'
      });

      expect(mockAuth0Client._requestTokenForMfa).toHaveBeenLastCalledWith(
        expect.objectContaining({
          mfaToken: mfaToken2,
          scope: 'openid email',
          audience: 'https://api2.example.com'
        })
      );
    });

    it('should not interfere when one flow overwrites another token context', async () => {
      const mfaToken1 = 'token-flow-1';
      const mfaToken2 = 'token-flow-2';

      // Store context for token1
      mfaClient.setMFAAuthDetails(mfaToken1, 'openid profile', 'https://api1.example.com');

      // Store context for token2 (should NOT overwrite token1's context)
      mfaClient.setMFAAuthDetails(mfaToken2, 'openid email', 'https://api2.example.com');

      const mockTokenResponse = { access_token: 'access123', id_token: 'id123' };
      mockAuth0Client._requestTokenForMfa.mockResolvedValue(mockTokenResponse);

      // Token1 should still work with its original context
      await mfaClient.verify({
        mfaToken: mfaToken1,
        otp: '111111'
      });

      expect(mockAuth0Client._requestTokenForMfa).toHaveBeenCalledWith(
        expect.objectContaining({
          mfaToken: mfaToken1,
          scope: 'openid profile',
          audience: 'https://api1.example.com'
        })
      );
    });
  });
});
