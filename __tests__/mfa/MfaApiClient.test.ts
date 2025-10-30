import { MfaApiClient } from '../../src/mfa/MfaApiClient';
import type { Authenticator } from '../../src/mfa/types';

global.fetch = jest.fn();

describe('MfaApiClient', () => {
  let mfaClient: MfaApiClient;
  const baseUrl = 'https://test.auth0.com';
  const mfaToken = 'test-mfa-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mfaClient = new MfaApiClient(baseUrl, mfaToken);
  });

  describe('listAuthenticators', () => {
    it('should list authenticators with Bearer token', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticator_type: 'otp', active: true }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });

      const result = await mfaClient.listAuthenticators();

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/authenticators`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mfaToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toEqual(mockData);
    });

    it('should filter inactive authenticators', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticator_type: 'otp', active: true },
        { id: 'otp|dev_456', authenticator_type: 'otp', active: false }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });

      const result = await mfaClient.listAuthenticators();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('otp|dev_123');
    });

    it('should handle empty list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([])
      });

      const result = await mfaClient.listAuthenticators();

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error_description: 'Unauthorized'
        })
      });

      await expect(mfaClient.listAuthenticators()).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should throw generic error when no error_description', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({})
      });

      await expect(mfaClient.listAuthenticators()).rejects.toThrow(
        'Failed to list authenticators'
      );
    });
  });

  describe('enrollAuthenticator', () => {
    it('should enroll OTP authenticator', async () => {
      const mockResponse = {
        authenticator_type: 'otp',
        secret: 'SECRET123',
        barcode_uri: 'otpauth://totp/test'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await mfaClient.enrollAuthenticator({
        authenticator_types: ['otp']
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/associate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mfaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ authenticator_types: ['otp'] })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should enroll SMS authenticator with phone number', async () => {
      const mockResponse = {
        authenticator_type: 'oob',
        oob_channel: 'sms'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await mfaClient.enrollAuthenticator({
        authenticator_types: ['oob'],
        oob_channels: ['sms'],
        phone_number: '+12025551234'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/associate`,
        expect.objectContaining({
          body: JSON.stringify({
            authenticator_types: ['oob'],
            oob_channels: ['sms'],
            phone_number: '+12025551234'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should enroll push authenticator', async () => {
      const mockResponse = {
        authenticator_type: 'oob',
        oob_channel: 'auth0'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await mfaClient.enrollAuthenticator({
        authenticator_types: ['oob'],
        oob_channels: ['auth0']
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/associate`,
        expect.objectContaining({
          body: JSON.stringify({
            authenticator_types: ['oob'],
            oob_channels: ['auth0']
          })
        })
      );
    });

    it('should enroll email authenticator', async () => {
      const mockResponse = {
        authenticator_type: 'email',
        email: 'user@example.com'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await mfaClient.enrollAuthenticator({
        authenticator_types: ['email'],
        email: 'user@example.com'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/associate`,
        expect.objectContaining({
          body: JSON.stringify({
            authenticator_types: ['email'],
            email: 'user@example.com'
          })
        })
      );
    });

    it('should throw error on enrollment failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error_description: 'Invalid parameters'
        })
      });

      await expect(
        mfaClient.enrollAuthenticator({
          authenticator_types: ['otp']
        })
      ).rejects.toThrow('Invalid parameters');
    });
  });

  describe('deleteAuthenticator', () => {
    it('should delete authenticator with URL encoding', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await mfaClient.deleteAuthenticator('otp|dev_123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/authenticators/otp%7Cdev_123`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mfaToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should encode special characters in authenticator ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });

      await mfaClient.deleteAuthenticator('otp|dev_123/test');

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/authenticators/otp%7Cdev_123%2Ftest`,
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should throw error on deletion failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error_description: 'Authenticator not found'
        })
      });

      await expect(
        mfaClient.deleteAuthenticator('invalid|id')
      ).rejects.toThrow('Authenticator not found');
    });
  });

  describe('challengeAuthenticator', () => {
    it('should initiate OTP challenge', async () => {
      const mockResponse = {
        challenge_type: 'otp'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await mfaClient.challengeAuthenticator({
        mfa_token: 'challenge-mfa-token',
        client_id: 'client123',
        challenge_type: 'otp',
        authenticator_id: 'otp|dev_123'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/mfa/challenge`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mfaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mfa_token: 'challenge-mfa-token',
            client_id: 'client123',
            challenge_type: 'otp',
            authenticator_id: 'otp|dev_123'
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should initiate OOB challenge with SMS', async () => {
      const mockResponse = {
        challenge_type: 'oob',
        oob_code: 'sms-oob-code',
        binding_method: 'prompt'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await mfaClient.challengeAuthenticator({
        mfa_token: 'challenge-token',
        client_id: 'client123',
        challenge_type: 'oob',
        oob_channel: 'sms',
        authenticator_id: 'sms|dev_456'
      });

      expect(result).toEqual(mockResponse);
      expect(result.oob_code).toBe('sms-oob-code');
      expect(result.binding_method).toBe('prompt');
    });

    it('should omit optional params if not provided', async () => {
      const mockResponse = {
        challenge_type: 'otp'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await mfaClient.challengeAuthenticator({
        mfa_token: 'token',
        client_id: 'client',
        challenge_type: 'otp'
      });

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );

      expect(callBody.authenticator_id).toBeUndefined();
      expect(callBody.oob_channel).toBeUndefined();
    });

    it('should throw error on challenge failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error_description: 'Challenge failed'
        })
      });

      await expect(
        mfaClient.challengeAuthenticator({
          mfa_token: 'token',
          client_id: 'client',
          challenge_type: 'otp'
        })
      ).rejects.toThrow('Challenge failed');
    });
  });

  describe('verifyChallenge', () => {
    it('should verify OTP challenge successfully', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        id_token: 'new-id-token',
        token_type: 'Bearer',
        expires_in: 86400
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens)
      });

      const result = await mfaClient.verifyChallenge({
        mfa_token: 'verify-token',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/oauth/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mfa_token: 'verify-token',
            client_id: 'client123',
            grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
            otp: '123456'
          })
        }
      );

      expect(result).toEqual(mockTokens);
    });

    it('should verify OOB challenge with binding code', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        id_token: 'new-id-token',
        token_type: 'Bearer',
        expires_in: 86400
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens)
      });

      const result = await mfaClient.verifyChallenge({
        mfa_token: 'verify-token',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
        oob_code: 'oob-code-123',
        binding_code: '654321'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/oauth/token`,
        expect.objectContaining({
          body: expect.stringContaining('binding_code')
        })
      );

      expect(result).toEqual(mockTokens);
    });

    it('should not include Authorization header', async () => {
      const mockTokens = {
        access_token: 'token',
        id_token: 'id'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens)
      });

      await mfaClient.verifyChallenge({
        mfa_token: 'verify-token',
        client_id: 'client',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      });

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it('should throw error on invalid OTP', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Invalid or expired OTP'
        })
      });

      await expect(
        mfaClient.verifyChallenge({
          mfa_token: 'verify-token',
          client_id: 'client',
          grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
          otp: 'wrong'
        })
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('should handle rate limiting error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'too_many_attempts',
          error_description: 'Too many failed attempts'
        })
      });

      await expect(
        mfaClient.verifyChallenge({
          mfa_token: 'verify-token',
          client_id: 'client',
          grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
          otp: '123456'
        })
      ).rejects.toThrow('Too many failed attempts');
    });

    it('should handle generic error without description', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'server_error'
        })
      });

      await expect(
        mfaClient.verifyChallenge({
          mfa_token: 'verify-token',
          client_id: 'client',
          grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
          otp: '123456'
        })
      ).rejects.toThrow('MFA verification failed: server_error');
    });

    it('should omit optional parameters if not provided', async () => {
      const mockTokens = {
        access_token: 'token',
        id_token: 'id'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokens)
      });

      await mfaClient.verifyChallenge({
        mfa_token: 'verify-token',
        client_id: 'client',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      });

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );

      expect(callBody.oob_code).toBeUndefined();
      expect(callBody.binding_code).toBeUndefined();
    });
  });
});
