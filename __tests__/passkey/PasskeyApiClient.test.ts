jest.mock('@auth0/auth0-auth-js', () => ({
  PasskeyClient: jest.fn()
}));

import { PasskeyApiClient } from '../../src/passkey/PasskeyApiClient';
import type { PasskeyCredentialResponse } from '../../src/passkey/types';
import {
  PasskeyEnrollmentError,
  PasskeyEnrollmentVerifyError
} from '../../src/passkey/errors';

const TEST_API_BASE = 'https://auth0_domain/api/';
const TEST_AUTH_SESSION = 'auth-session-abc123';

function createMockCredential(
  overrides?: Partial<PasskeyCredentialResponse>
): PasskeyCredentialResponse {
  return {
    id: 'credential-id-123',
    rawId: 'cmF3SWQtYmFzZTY0dXJs',
    type: 'public-key',
    authenticatorAttachment: 'platform',
    response: {
      clientDataJSON: 'Y2xpZW50RGF0YUpTT04',
      attestationObject: 'YXR0ZXN0YXRpb25PYmplY3Q',
      authenticatorData: 'YXV0aGVudGljYXRvckRhdGE',
      signature: 'c2lnbmF0dXJl',
      userHandle: 'dXNlckhhbmRsZQ'
    },
    clientExtensionResults: {},
    ...overrides
  };
}

function createMockFetcher() {
  return {
    fetchWithAuth: jest.fn()
  };
}

function createMockResponse(
  ok: boolean,
  body: any,
  headers?: Record<string, string>
): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(headers)
  } as unknown as Response;
}

describe('PasskeyApiClient', () => {
  let passkeyClient: PasskeyApiClient;
  let mockPasskeyClient: any;
  let mockAuth0Client: any;
  let mockFetcher: ReturnType<typeof createMockFetcher>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPasskeyClient = {
      signupChallenge: jest.fn(),
      loginChallenge: jest.fn(),
      signinWithPasskey: jest.fn()
    };

    mockAuth0Client = {
      _requestTokenForPasskey: jest.fn()
    };

    mockFetcher = createMockFetcher();

    passkeyClient = new PasskeyApiClient(
      mockPasskeyClient,
      mockAuth0Client,
      mockFetcher as any,
      TEST_API_BASE
    );
  });

  describe('signupChallenge', () => {
    it('should delegate to PasskeyClient with email', async () => {
      const mockResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example App' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
          timeout: 60000
        }
      };
      mockPasskeyClient.signupChallenge.mockResolvedValue(mockResponse);

      const result = await passkeyClient.signupChallenge({ email: 'user@example.com' });

      expect(mockPasskeyClient.signupChallenge).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(result).toEqual(mockResponse);
      expect(result.authSession).toBe(TEST_AUTH_SESSION);
      expect(result.authnParamsPublicKey.rp.id).toBe('example.auth0.com');
    });

    it('should delegate to PasskeyClient with all options', async () => {
      const options = {
        email: 'user@example.com',
        username: 'testuser',
        name: 'Test User',
        realm: 'Username-Password-Authentication'
      };
      const mockResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example App' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'Test User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.signupChallenge.mockResolvedValue(mockResponse);

      const result = await passkeyClient.signupChallenge(options);

      expect(mockPasskeyClient.signupChallenge).toHaveBeenCalledWith(options);
      expect(result.authnParamsPublicKey.user.displayName).toBe('Test User');
    });

    it('should propagate errors from PasskeyClient', async () => {
      const error = new Error('Network error');
      mockPasskeyClient.signupChallenge.mockRejectedValue(error);

      await expect(
        passkeyClient.signupChallenge({ email: 'user@example.com' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('loginChallenge', () => {
    it('should delegate to PasskeyClient without options', async () => {
      const mockResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com',
          timeout: 60000,
          userVerification: 'preferred'
        }
      };
      mockPasskeyClient.loginChallenge.mockResolvedValue(mockResponse);

      const result = await passkeyClient.loginChallenge();

      expect(mockPasskeyClient.loginChallenge).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockResponse);
      expect(result.authnParamsPublicKey.rpId).toBe('example.auth0.com');
    });

    it('should delegate to PasskeyClient with realm option', async () => {
      const options = { realm: 'Username-Password-Authentication' };
      const mockResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.loginChallenge.mockResolvedValue(mockResponse);

      const result = await passkeyClient.loginChallenge(options);

      expect(mockPasskeyClient.loginChallenge).toHaveBeenCalledWith(options);
      expect(result.authSession).toBe(TEST_AUTH_SESSION);
    });

    it('should propagate errors from PasskeyClient', async () => {
      const error = new Error('Service unavailable');
      mockPasskeyClient.loginChallenge.mockRejectedValue(error);

      await expect(passkeyClient.loginChallenge()).rejects.toThrow('Service unavailable');
    });
  });

  describe('signinWithPasskey', () => {
    it('should route through Auth0Client._requestTokenForPasskey', async () => {
      const credential = createMockCredential();
      const mockTokenResponse = {
        id_token: 'eyJ...',
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.signinWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith({
        authSession: TEST_AUTH_SESSION,
        credential,
        realm: undefined,
        scope: undefined,
        audience: undefined
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should pass optional realm, scope, and audience', async () => {
      const credential = createMockCredential();
      const mockTokenResponse = {
        id_token: 'eyJ...',
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400,
        scope: 'openid profile email'
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.signinWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential,
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
        audience: 'https://api.example.com'
      });

      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith({
        authSession: TEST_AUTH_SESSION,
        credential,
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
        audience: 'https://api.example.com'
      });
      expect(result.scope).toBe('openid profile email');
    });

    it('should not call PasskeyClient.signinWithPasskey directly', async () => {
      const credential = createMockCredential();
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        id_token: 'eyJ...',
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.signinWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      expect(mockPasskeyClient.signinWithPasskey).not.toHaveBeenCalled();
    });

    it('should propagate errors from Auth0Client._requestTokenForPasskey', async () => {
      const credential = createMockCredential();
      const error = new Error('Token exchange failed');
      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(error);

      await expect(
        passkeyClient.signinWithPasskey({
          authSession: TEST_AUTH_SESSION,
          credential
        })
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('enrollmentChallenge', () => {
    it('should POST to authentication-methods endpoint', async () => {
      const mockResponseBody = {
        auth_session: TEST_AUTH_SESSION,
        authn_params_public_key: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example App' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, mockResponseBody)
      );

      const result = await passkeyClient.enrollmentChallenge();

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${TEST_API_BASE}v1/authentication-methods`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'passkey' })
        }
      );
      expect(result.authSession).toBe(TEST_AUTH_SESSION);
      expect(result.authnParamsPublicKey.challenge).toBe('Y2hhbGxlbmdl');
      expect(result.authnParamsPublicKey.rp.id).toBe('example.auth0.com');
    });

    it('should include connection when provided', async () => {
      const mockResponseBody = {
        auth_session: TEST_AUTH_SESSION,
        authn_params_public_key: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example App' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, mockResponseBody)
      );

      await passkeyClient.enrollmentChallenge({ connection: 'Username-Password-Authentication' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${TEST_API_BASE}v1/authentication-methods`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'passkey', connection: 'Username-Password-Authentication' })
        }
      );
    });

    it('should include identity when provided', async () => {
      const mockResponseBody = {
        auth_session: TEST_AUTH_SESSION,
        authn_params_public_key: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example App' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, mockResponseBody)
      );

      await passkeyClient.enrollmentChallenge({
        connection: 'Username-Password-Authentication',
        identity: 'auth0|user123'
      });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${TEST_API_BASE}v1/authentication-methods`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'passkey',
            connection: 'Username-Password-Authentication',
            identity: 'auth0|user123'
          })
        }
      );
    });

    it('should throw PasskeyEnrollmentError on non-ok response', async () => {
      const errorBody = {
        error: 'invalid_request',
        error_description: 'Connection does not support passkeys'
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(false, errorBody)
      );

      await expect(passkeyClient.enrollmentChallenge()).rejects.toThrow(PasskeyEnrollmentError);
      await expect(passkeyClient.enrollmentChallenge()).rejects.toMatchObject({
        message: 'Connection does not support passkeys',
        code: 'passkey_enrollment_error'
      });
    });

    it('should throw PasskeyEnrollmentError with detail field', async () => {
      const errorBody = {
        detail: 'User not found'
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(false, errorBody)
      );

      await expect(passkeyClient.enrollmentChallenge()).rejects.toMatchObject({
        message: 'User not found'
      });
    });

    it('should throw PasskeyEnrollmentError with default message on parse failure', async () => {
      mockFetcher.fetchWithAuth.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        headers: new Headers()
      } as unknown as Response);

      await expect(passkeyClient.enrollmentChallenge()).rejects.toThrow(PasskeyEnrollmentError);
      await expect(passkeyClient.enrollmentChallenge()).rejects.toMatchObject({
        message: 'Failed to create passkey enrollment challenge'
      });
    });

    it('should transform snake_case API response to camelCase', async () => {
      const mockResponseBody = {
        auth_session: 'session-xyz',
        authn_params_public_key: {
          challenge: 'abc123',
          rp: { id: 'rp.example.com', name: 'RP' },
          user: { id: 'uid', name: 'u@e.com', displayName: 'U' },
          pubKeyCredParams: [{ type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'required'
          },
          timeout: 120000
        }
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, mockResponseBody)
      );

      const result = await passkeyClient.enrollmentChallenge();

      expect(result).toEqual({
        authSession: 'session-xyz',
        authnParamsPublicKey: mockResponseBody.authn_params_public_key
      });
    });
  });

  describe('enrollmentVerify', () => {
    it('should POST to verify endpoint with serialized credential', async () => {
      const credential = createMockCredential();
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, {})
      );

      await passkeyClient.enrollmentVerify({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${TEST_API_BASE}v1/authentication-methods/passkey%7Cnew/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_session: TEST_AUTH_SESSION,
            authn_response: credential
          })
        }
      );
    });

    it('should resolve without returning a value on success', async () => {
      const credential = createMockCredential();
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, {})
      );

      const result = await passkeyClient.enrollmentVerify({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      expect(result).toBeUndefined();
    });

    it('should throw PasskeyEnrollmentVerifyError on non-ok response with error_description', async () => {
      const credential = createMockCredential();
      const errorBody = {
        error: 'invalid_credential',
        error_description: 'The credential response is invalid'
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(false, errorBody)
      );

      await expect(
        passkeyClient.enrollmentVerify({ authSession: TEST_AUTH_SESSION, credential })
      ).rejects.toThrow(PasskeyEnrollmentVerifyError);
      await expect(
        passkeyClient.enrollmentVerify({ authSession: TEST_AUTH_SESSION, credential })
      ).rejects.toMatchObject({
        message: 'The credential response is invalid',
        code: 'passkey_enrollment_verify_error'
      });
    });

    it('should throw PasskeyEnrollmentVerifyError with detail field', async () => {
      const credential = createMockCredential();
      const errorBody = {
        detail: 'Auth session expired'
      };
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(false, errorBody)
      );

      await expect(
        passkeyClient.enrollmentVerify({ authSession: TEST_AUTH_SESSION, credential })
      ).rejects.toMatchObject({
        message: 'Auth session expired'
      });
    });

    it('should throw PasskeyEnrollmentVerifyError with default message when json parsing fails', async () => {
      const credential = createMockCredential();
      mockFetcher.fetchWithAuth.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        headers: new Headers()
      } as unknown as Response);

      await expect(
        passkeyClient.enrollmentVerify({ authSession: TEST_AUTH_SESSION, credential })
      ).rejects.toMatchObject({
        message: 'Failed to verify passkey enrollment'
      });
    });

    it('should send the full credential object in authn_response', async () => {
      const credential = createMockCredential({
        authenticatorAttachment: 'cross-platform',
        clientExtensionResults: { credProps: { rk: true } }
      });
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, {})
      );

      await passkeyClient.enrollmentVerify({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      const callBody = JSON.parse(
        (mockFetcher.fetchWithAuth.mock.calls[0][1] as any).body
      );
      expect(callBody.authn_response).toEqual(credential);
      expect(callBody.authn_response.authenticatorAttachment).toBe('cross-platform');
      expect(callBody.authn_response.clientExtensionResults).toEqual({ credProps: { rk: true } });
    });
  });

  describe('error classes', () => {
    it('PasskeyEnrollmentError should have correct properties', () => {
      const cause = { error: 'invalid_request', error_description: 'Bad request' };
      const error = new PasskeyEnrollmentError('Something went wrong', cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PasskeyEnrollmentError);
      expect(error.name).toBe('PasskeyEnrollmentError');
      expect(error.code).toBe('passkey_enrollment_error');
      expect(error.message).toBe('Something went wrong');
      expect(error.cause).toEqual(cause);
    });

    it('PasskeyEnrollmentVerifyError should have correct properties', () => {
      const cause = { error: 'invalid_credential', error_description: 'Invalid' };
      const error = new PasskeyEnrollmentVerifyError('Verify failed', cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PasskeyEnrollmentVerifyError);
      expect(error.name).toBe('PasskeyEnrollmentVerifyError');
      expect(error.code).toBe('passkey_enrollment_verify_error');
      expect(error.message).toBe('Verify failed');
      expect(error.cause).toEqual(cause);
    });

    it('PasskeyEnrollmentError should work without cause', () => {
      const error = new PasskeyEnrollmentError('No cause');

      expect(error.cause).toBeUndefined();
      expect(error.message).toBe('No cause');
    });
  });
});
