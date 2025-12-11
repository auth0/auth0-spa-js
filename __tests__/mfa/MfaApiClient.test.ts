import { MfaApiClient } from '../../src/mfa/MfaApiClient';
import type { Authenticator } from '../../src/mfa/types';

describe('MfaApiClient', () => {
  let mfaClient: MfaApiClient;
  let mockAuthJsMfaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock auth-js MfaClient
    mockAuthJsMfaClient = {
      listAuthenticators: jest.fn(),
      enrollAuthenticator: jest.fn(),
      deleteAuthenticator: jest.fn(),
      challengeAuthenticator: jest.fn(),
      verifyChallenge: jest.fn()
    } as any;

    mfaClient = new MfaApiClient(mockAuthJsMfaClient);
  });

  describe('listAuthenticators', () => {
    it('should delegate to auth-js MfaClient and return authenticators', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticator_type: 'otp', active: true }
      ];

      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.listAuthenticators();

      expect(mockAuthJsMfaClient.listAuthenticators).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('should handle empty list', async () => {
      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue([]);

      const result = await mfaClient.listAuthenticators();

      expect(result).toEqual([]);
    });

    it('should wrap auth-js errors as generic Error', async () => {
      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(mfaClient.listAuthenticators()).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should provide fallback error message', async () => {
      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(new Error());

      await expect(mfaClient.listAuthenticators()).rejects.toThrow(
        'Failed to list authenticators'
      );
    });
  });

  describe('enrollAuthenticator', () => {
    it('should delegate OTP enrollment to auth-js', async () => {
      const params = { authenticator_types: ['otp'] };
      const mockResponse = {
        authenticator_type: 'otp',
        secret: 'SECRET123',
        barcode_uri: 'otpauth://...'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enrollAuthenticator(params as any);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith(
        params
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delegate SMS enrollment to auth-js', async () => {
      const params = {
        authenticator_types: ['oob'],
        oob_channels: ['sms'],
        phone_number: '+12025551234'
      };
      const mockResponse = {
        authenticator_type: 'oob',
        oob_channel: 'sms',
        oob_code: 'OOB123'
      };

      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enrollAuthenticator(params as any);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith(
        params
      );
      expect(result).toEqual(mockResponse);
    });

    it('should wrap enrollment errors', async () => {
      const params = { authenticator_types: ['otp'] };
      mockAuthJsMfaClient.enrollAuthenticator.mockRejectedValue(
        new Error('Enrollment failed')
      );

      await expect(mfaClient.enrollAuthenticator(params as any)).rejects.toThrow(
        'Enrollment failed'
      );
    });
  });

  describe('deleteAuthenticator', () => {
    it('should delegate deletion to auth-js', async () => {
      const authenticatorId = 'otp|dev_123';
      mockAuthJsMfaClient.deleteAuthenticator.mockResolvedValue(undefined);

      await mfaClient.deleteAuthenticator(authenticatorId);

      expect(mockAuthJsMfaClient.deleteAuthenticator).toHaveBeenCalledWith(
        authenticatorId
      );
    });

    it('should handle special characters in ID', async () => {
      const authenticatorId = 'otp|dev_!@#$%';
      mockAuthJsMfaClient.deleteAuthenticator.mockResolvedValue(undefined);

      await mfaClient.deleteAuthenticator(authenticatorId);

      expect(mockAuthJsMfaClient.deleteAuthenticator).toHaveBeenCalledWith(
        authenticatorId
      );
    });

    it('should wrap deletion errors', async () => {
      mockAuthJsMfaClient.deleteAuthenticator.mockRejectedValue(
        new Error('Not found')
      );

      await expect(
        mfaClient.deleteAuthenticator('otp|dev_123')
      ).rejects.toThrow('Not found');
    });
  });

  describe('challengeAuthenticator', () => {
    it('should strip mfa_token and client_id from params', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        challenge_type: 'otp',
        authenticator_id: 'otp|dev_123'
      };
      const mockResponse = {
        challenge_type: 'otp'
      };

      mockAuthJsMfaClient.challengeAuthenticator.mockResolvedValue(
        mockResponse
      );

      const result = await mfaClient.challengeAuthenticator(params as any);

      // Should NOT include mfa_token or client_id
      expect(mockAuthJsMfaClient.challengeAuthenticator).toHaveBeenCalledWith({
        challenge_type: 'otp',
        authenticator_id: 'otp|dev_123'
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle OOB challenge with channel', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        challenge_type: 'oob',
        oob_channel: 'sms',
        authenticator_id: 'sms|dev_123'
      };
      const mockResponse = {
        challenge_type: 'oob',
        oob_code: 'OOB123'
      };

      mockAuthJsMfaClient.challengeAuthenticator.mockResolvedValue(
        mockResponse
      );

      await mfaClient.challengeAuthenticator(params as any);

      expect(mockAuthJsMfaClient.challengeAuthenticator).toHaveBeenCalledWith({
        challenge_type: 'oob',
        oob_channel: 'sms',
        authenticator_id: 'sms|dev_123'
      });
    });

    it('should wrap challenge errors', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        challenge_type: 'otp'
      };

      mockAuthJsMfaClient.challengeAuthenticator.mockRejectedValue(
        new Error('Challenge failed')
      );

      await expect(
        mfaClient.challengeAuthenticator(params as any)
      ).rejects.toThrow('Challenge failed');
    });
  });

  describe('verifyChallenge', () => {
    it('should strip mfa_token and client_id from OTP verification', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      };
      // auth-js uses camelCase
      const mockTokenResponse = {
        accessToken: 'access123',
        idToken: 'id123',
        tokenType: 'Bearer',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        scope: 'openid'
      };

      mockAuthJsMfaClient.verifyChallenge.mockResolvedValue(
        mockTokenResponse as any
      );

      const result = await mfaClient.verifyChallenge(params as any);

      // Should NOT include mfa_token or client_id
      expect(mockAuthJsMfaClient.verifyChallenge).toHaveBeenCalledWith({
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      });
      expect(result.access_token).toBe('access123');
    });

    it('should strip mfa_token and client_id from OOB verification', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
        oob_code: 'OOB123',
        binding_code: '654321'
      };
      // auth-js uses camelCase
      const mockTokenResponse = {
        accessToken: 'access123',
        idToken: 'id123',
        tokenType: 'Bearer',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        scope: 'openid'
      };

      mockAuthJsMfaClient.verifyChallenge.mockResolvedValue(
        mockTokenResponse as any
      );

      await mfaClient.verifyChallenge(params as any);

      // Should NOT include mfa_token or client_id
      expect(mockAuthJsMfaClient.verifyChallenge).toHaveBeenCalledWith({
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
        oob_code: 'OOB123',
        binding_code: '654321'
      });
    });

    it('should convert auth-js TokenResponse to spa-js format', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      };
      // auth-js uses camelCase and expiresAt (Unix timestamp)
      const now = Math.floor(Date.now() / 1000);
      const mockTokenResponse = {
        accessToken: 'access123',
        idToken: 'id123',
        refreshToken: 'refresh123',
        tokenType: 'Bearer',
        expiresAt: now + 3600,
        scope: 'openid profile'
      };

      mockAuthJsMfaClient.verifyChallenge.mockResolvedValue(
        mockTokenResponse as any
      );

      const result = await mfaClient.verifyChallenge(params as any);

      // Wrapper converts to snake_case and calculates expires_in
      expect(result).toEqual({
        access_token: 'access123',
        id_token: 'id123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: expect.any(Number), // Dynamic calculation
        scope: 'openid profile'
      });
      expect(result.expires_in).toBeGreaterThanOrEqual(3599); // Allow for 1s variance
      expect(result.expires_in).toBeLessThanOrEqual(3600);
    });

    it('should wrap verification errors', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: 'wrong'
      };

      mockAuthJsMfaClient.verifyChallenge.mockRejectedValue(
        new Error('Invalid OTP')
      );

      await expect(mfaClient.verifyChallenge(params as any)).rejects.toThrow(
        'Invalid OTP'
      );
    });
  });
});
