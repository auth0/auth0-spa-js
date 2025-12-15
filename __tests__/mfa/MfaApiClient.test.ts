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

  class MfaDeleteAuthenticatorError extends Error {
    constructor(
      message: string,
      public cause?: { error: string; error_description: string }
    ) {
      super(message);
      Object.setPrototypeOf(this, MfaDeleteAuthenticatorError.prototype);
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
    MfaDeleteAuthenticatorError,
    MfaChallengeError
  };
});

import { MfaApiClient } from '../../src/mfa/MfaApiClient';
import {
  MfaListAuthenticatorsError as Auth0JsMfaListAuthenticatorsError,
  MfaEnrollmentError as Auth0JsMfaEnrollmentError,
  MfaDeleteAuthenticatorError as Auth0JsMfaDeleteAuthenticatorError,
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
      deleteAuthenticator: jest.fn(),
      challengeAuthenticator: jest.fn(),
      verifyChallenge: jest.fn(),
      setMfaToken: jest.fn()
    } as any;

    // Create mock Auth0Client
    mockAuth0Client = {
      requestTokenForMfa: jest.fn()
    } as any;

    mfaClient = new MfaApiClient(mockAuthJsMfaClient, mockAuth0Client);
  });

  describe('listAuthenticators', () => {
    it('should return authenticators from auth-js', async () => {
      const mockData: Authenticator[] = [
        { id: 'otp|dev_123', authenticator_type: 'otp', active: true }
      ];
      const mfaToken = 'test-mfa-token';

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.listAuthenticators.mockResolvedValue(mockData);

      const result = await mfaClient.listAuthenticators();

      expect(mockAuthJsMfaClient.listAuthenticators).toHaveBeenCalledWith({
        mfaToken
      });
      expect(result).toEqual(mockData);
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

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(authJsError);

      await expect(mfaClient.listAuthenticators()).rejects.toMatchObject({
        error: 'access_denied',
        error_description: 'Unauthorized',
        message: 'Unauthorized'
      });
    });

    it('should rethrow non-MFA errors', async () => {
      const mfaToken = 'test-mfa-token';
      const networkError = new Error('Network error');

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.listAuthenticators.mockRejectedValue(networkError);

      await expect(mfaClient.listAuthenticators()).rejects.toBe(networkError);
    });
  });

  describe('enrollAuthenticator', () => {
    it('should return enrollment response from auth-js', async () => {
      const mfaToken = 'test-mfa-token';
      const params = { authenticator_types: ['otp'] };
      const mockResponse = {
        authenticator_type: 'otp',
        secret: 'SECRET123',
        barcode_uri: 'otpauth://...'
      };

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.enrollAuthenticator.mockResolvedValue(mockResponse);

      const result = await mfaClient.enrollAuthenticator(params as any);

      expect(mockAuthJsMfaClient.enrollAuthenticator).toHaveBeenCalledWith({
        ...params,
        mfaToken
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const params = { authenticator_types: ['otp'] };
      const authJsError = new Auth0JsMfaEnrollmentError('Invalid phone number', {
        error: 'invalid_phone_number',
        error_description: 'Invalid phone number'
      });

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.enrollAuthenticator.mockRejectedValue(authJsError);

      await expect(mfaClient.enrollAuthenticator(params as any)).rejects.toMatchObject({
        error: 'invalid_phone_number',
        error_description: 'Invalid phone number',
        message: 'Invalid phone number'
      });
    });
  });

  describe('deleteAuthenticator', () => {
    it('should delete authenticator via auth-js', async () => {
      const mfaToken = 'test-mfa-token';
      const authenticatorId = 'otp|dev_123';

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.deleteAuthenticator.mockResolvedValue(undefined);

      await mfaClient.deleteAuthenticator(authenticatorId);

      expect(mockAuthJsMfaClient.deleteAuthenticator).toHaveBeenCalledWith({
        authenticatorId,
        mfaToken
      });
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const authJsError = new Auth0JsMfaDeleteAuthenticatorError(
        'Authenticator not found',
        {
          error: 'authenticator_not_found',
          error_description: 'Authenticator not found'
        }
      );

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.deleteAuthenticator.mockRejectedValue(authJsError);

      await expect(
        mfaClient.deleteAuthenticator('otp|dev_123')
      ).rejects.toMatchObject({
        error: 'authenticator_not_found',
        error_description: 'Authenticator not found',
        message: 'Authenticator not found'
      });
    });
  });

  describe('challengeAuthenticator', () => {
    it('should strip mfa_token and client_id from params and include stored mfaToken', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        challenge_type: 'otp',
        authenticator_id: 'otp|dev_123'
      };
      const mockResponse = {
        challenge_type: 'otp'
      };

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.challengeAuthenticator.mockResolvedValue(
        mockResponse
      );

      const result = await mfaClient.challengeAuthenticator(params as any);

      expect(mockAuthJsMfaClient.challengeAuthenticator).toHaveBeenCalledWith({
        challenge_type: 'otp',
        authenticator_id: 'otp|dev_123',
        mfaToken
      });
      expect(result).toEqual(mockResponse);
    });

    it('should wrap auth-js errors with error details', async () => {
      const mfaToken = 'test-mfa-token';
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        challenge_type: 'otp'
      };
      const authJsError = new Auth0JsMfaChallengeError('Rate limit exceeded', {
        error: 'too_many_attempts',
        error_description: 'Rate limit exceeded'
      });

      mfaClient.setMfaToken(mfaToken);
      mockAuthJsMfaClient.challengeAuthenticator.mockRejectedValue(authJsError);

      await expect(
        mfaClient.challengeAuthenticator(params as any)
      ).rejects.toMatchObject({
        error: 'too_many_attempts',
        error_description: 'Rate limit exceeded',
        message: 'Rate limit exceeded'
      });
    });
  });

  describe('verifyChallenge', () => {
    it('should call auth0Client.requestTokenForMfa with correct params', async () => {
      const mfaToken = 'token123';
      const params = {
        mfa_token: mfaToken,
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      };
      const mockTokenResponse = {
        access_token: 'access123',
        id_token: 'id123'
      };

      mfaClient.setMfaToken(mfaToken);
      mfaClient.setMFAAuthDetails('openid profile', 'https://api.example.com');
      mockAuth0Client.requestTokenForMfa.mockResolvedValue(mockTokenResponse);

      const result = await mfaClient.verifyChallenge(params as any);

      expect(mockAuth0Client.requestTokenForMfa).toHaveBeenCalledWith({
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        mfa_token: mfaToken,
        scope: 'openid profile',
        audience: 'https://api.example.com',
        otp: '123456',
        oob_code: undefined,
        binding_code: undefined
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw error if scope is not set', async () => {
      const mfaToken = 'token123';
      const params = {
        mfa_token: mfaToken,
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      };

      mfaClient.setMfaToken(mfaToken);
      // Not calling setMFAAuthDetails

      await expect(mfaClient.verifyChallenge(params as any)).rejects.toThrow(
        'MFA scope is not set'
      );
    });

    it('should throw error if mfaToken is not set', async () => {
      const params = {
        mfa_token: 'token123',
        client_id: 'client123',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        otp: '123456'
      };

      mfaClient.setMFAAuthDetails('openid profile', 'https://api.example.com');
      // Not calling setMfaToken

      await expect(mfaClient.verifyChallenge(params as any)).rejects.toThrow(
        'MFA token is not set'
      );
    });
  });
});
