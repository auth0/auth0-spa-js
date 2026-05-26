jest.mock('@auth0/auth0-auth-js', () => ({
  PasskeyClient: jest.fn()
}));

import { PasskeyApiClient } from '../../src/passkey/PasskeyApiClient';
import {
  PasskeyEnrollmentError,
  PasskeyEnrollmentVerifyError
} from '../../src/passkey/errors';

const TEST_API_BASE = 'https://auth0_domain/api/';
const TEST_AUTH_SESSION = 'auth-session-abc123';

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

function createMockPublicKeyCredential(type: 'create' | 'get') {
  const clientDataJSON = new Uint8Array([1, 2, 3]).buffer;

  if (type === 'create') {
    return {
      id: 'credential-id-123',
      rawId: new Uint8Array([10, 20, 30]).buffer,
      type: 'public-key',
      authenticatorAttachment: 'platform',
      response: {
        clientDataJSON,
        attestationObject: new Uint8Array([40, 50, 60]).buffer
      },
      getClientExtensionResults: () => ({})
    };
  }

  return {
    id: 'credential-id-456',
    rawId: new Uint8Array([10, 20, 30]).buffer,
    type: 'public-key',
    authenticatorAttachment: 'platform',
    response: {
      clientDataJSON,
      authenticatorData: new Uint8Array([70, 80, 90]).buffer,
      signature: new Uint8Array([100, 110, 120]).buffer,
      userHandle: new Uint8Array([130, 140, 150]).buffer
    },
    getClientExtensionResults: () => ({})
  };
}

describe('PasskeyApiClient', () => {
  let passkeyClient: PasskeyApiClient;
  let mockPasskeyClient: any;
  let mockAuth0Client: any;
  let mockFetcher: ReturnType<typeof createMockFetcher>;

  const originalCredentials = Object.getOwnPropertyDescriptor(
    global.navigator,
    'credentials'
  );

  beforeEach(() => {
    jest.clearAllMocks();

    mockPasskeyClient = {
      register: jest.fn(),
      challenge: jest.fn(),
      getTokenByPasskey: jest.fn()
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

  afterEach(() => {
    if (originalCredentials) {
      Object.defineProperty(global.navigator, 'credentials', originalCredentials);
    }
  });

  describe('signup', () => {
    it('should handle full flow: challenge → WebAuthn → serialize → token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      const mockCredential = createMockPublicKeyCredential('create');
      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(mockCredential) },
        configurable: true
      });

      const mockTokenResponse = {
        id_token: 'eyJ...',
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.signup({ email: 'user@example.com' });

      expect(mockPasskeyClient.register).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(navigator.credentials.create).toHaveBeenCalledWith({
        publicKey: expect.objectContaining({
          challenge: expect.any(ArrayBuffer),
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: expect.objectContaining({
            id: expect.any(ArrayBuffer)
          })
        })
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith({
        authSession: TEST_AUTH_SESSION,
        credential: expect.objectContaining({
          id: 'credential-id-123',
          rawId: expect.any(String),
          type: 'public-key',
          response: expect.objectContaining({
            clientDataJSON: expect.any(String),
            attestationObject: expect.any(String)
          })
        }),
        realm: undefined,
        organization: undefined,
        scope: undefined,
        audience: undefined
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should pass organization to both challenge and token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(createMockPublicKeyCredential('create')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.signup({
        email: 'user@example.com',
        organization: 'org_abc123'
      });

      expect(mockPasskeyClient.register).toHaveBeenCalledWith({
        email: 'user@example.com',
        organization: 'org_abc123'
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'org_abc123'
        })
      );
    });

    it('should pass scope and audience to token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(createMockPublicKeyCredential('create')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.signup({
        email: 'user@example.com',
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
        audience: 'https://api.example.com'
      });

      expect(mockPasskeyClient.register).toHaveBeenCalledWith({
        email: 'user@example.com',
        realm: 'Username-Password-Authentication'
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          realm: 'Username-Password-Authentication',
          scope: 'openid profile email',
          audience: 'https://api.example.com'
        })
      );
    });

    it('should throw if user cancels WebAuthn prompt', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(null) },
        configurable: true
      });

      await expect(
        passkeyClient.signup({ email: 'user@example.com' })
      ).rejects.toThrow('Passkey creation was cancelled or no credential was returned.');
    });

    it('should propagate errors from PasskeyClient.register', async () => {
      mockPasskeyClient.register.mockRejectedValue(new Error('Network error'));

      await expect(
        passkeyClient.signup({ email: 'user@example.com' })
      ).rejects.toThrow('Network error');
    });

    it('should propagate errors from token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(createMockPublicKeyCredential('create')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(
        new Error('Token exchange failed')
      );

      await expect(
        passkeyClient.signup({ email: 'user@example.com' })
      ).rejects.toThrow('Token exchange failed');
    });

    it('should not call PasskeyClient.getTokenByPasskey directly', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(createMockPublicKeyCredential('create')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.signup({ email: 'user@example.com' });

      expect(mockPasskeyClient.getTokenByPasskey).not.toHaveBeenCalled();
    });

    it('should serialize credential with base64url encoding', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      };
      mockPasskeyClient.register.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: jest.fn().mockResolvedValue(createMockPublicKeyCredential('create')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.signup({ email: 'user@example.com' });

      const credential = mockAuth0Client._requestTokenForPasskey.mock.calls[0][0].credential;
      expect(credential.rawId).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.clientDataJSON).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.attestationObject).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('login', () => {
    it('should handle full flow: challenge → WebAuthn → serialize → token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com',
          timeout: 60000,
          userVerification: 'preferred'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      const mockCredential = createMockPublicKeyCredential('get');
      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(mockCredential) },
        configurable: true
      });

      const mockTokenResponse = {
        id_token: 'eyJ...',
        access_token: 'at_456',
        token_type: 'Bearer',
        expires_in: 86400
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.login();

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith(undefined);
      expect(navigator.credentials.get).toHaveBeenCalledWith({
        publicKey: expect.objectContaining({
          challenge: expect.any(ArrayBuffer),
          rpId: 'example.auth0.com'
        })
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith({
        authSession: TEST_AUTH_SESSION,
        credential: expect.objectContaining({
          id: 'credential-id-456',
          rawId: expect.any(String),
          type: 'public-key',
          response: expect.objectContaining({
            clientDataJSON: expect.any(String),
            authenticatorData: expect.any(String),
            signature: expect.any(String),
            userHandle: expect.any(String)
          })
        }),
        realm: undefined,
        organization: undefined,
        scope: undefined,
        audience: undefined
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should pass organization to both challenge and token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(createMockPublicKeyCredential('get')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.login({ organization: 'org_abc123' });

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith({
        organization: 'org_abc123'
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'org_abc123'
        })
      );
    });

    it('should pass realm option to challenge and token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(createMockPublicKeyCredential('get')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.login({
        realm: 'Username-Password-Authentication',
        scope: 'openid profile',
        audience: 'https://api.example.com'
      });

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith({
        realm: 'Username-Password-Authentication'
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          realm: 'Username-Password-Authentication',
          scope: 'openid profile',
          audience: 'https://api.example.com'
        })
      );
    });

    it('should throw if user cancels WebAuthn prompt', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(null) },
        configurable: true
      });

      await expect(passkeyClient.login()).rejects.toThrow(
        'Passkey authentication was cancelled or no credential was returned.'
      );
    });

    it('should propagate errors from PasskeyClient.challenge', async () => {
      mockPasskeyClient.challenge.mockRejectedValue(new Error('Service unavailable'));

      await expect(passkeyClient.login()).rejects.toThrow('Service unavailable');
    });

    it('should propagate errors from token exchange', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(createMockPublicKeyCredential('get')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(
        new Error('Token exchange failed')
      );

      await expect(passkeyClient.login()).rejects.toThrow('Token exchange failed');
    });

    it('should convert allowCredentials IDs from base64url to ArrayBuffer', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com',
          allowCredentials: [
            { id: 'Y3JlZC0x', type: 'public-key', transports: ['internal'] },
            { id: 'Y3JlZC0y', type: 'public-key', transports: ['usb'] }
          ]
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      const mockCredential = createMockPublicKeyCredential('get');
      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(mockCredential) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.login();

      const getCall = (navigator.credentials.get as jest.Mock).mock.calls[0][0];
      expect(getCall.publicKey.allowCredentials).toHaveLength(2);
      expect(getCall.publicKey.allowCredentials[0].id).toBeInstanceOf(ArrayBuffer);
      expect(getCall.publicKey.allowCredentials[0].type).toBe('public-key');
      expect(getCall.publicKey.allowCredentials[0].transports).toEqual(['internal']);
      expect(getCall.publicKey.allowCredentials[1].id).toBeInstanceOf(ArrayBuffer);
    });

    it('should serialize assertion credential with base64url encoding', async () => {
      const challengeResponse = {
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      };
      mockPasskeyClient.challenge.mockResolvedValue(challengeResponse);

      Object.defineProperty(global.navigator, 'credentials', {
        value: { get: jest.fn().mockResolvedValue(createMockPublicKeyCredential('get')) },
        configurable: true
      });

      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.login();

      const credential = mockAuth0Client._requestTokenForPasskey.mock.calls[0][0].credential;
      expect(credential.rawId).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.clientDataJSON).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.authenticatorData).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.signature).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.userHandle).toMatch(/^[A-Za-z0-9_-]+$/);
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
      const credential = {
        id: 'cred-id',
        rawId: 'cmF3SWQ',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2xpZW50',
          attestationObject: 'YXR0ZXN0'
        }
      } as any;
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
      const credential = { id: 'c', rawId: 'r', type: 'public-key', response: { clientDataJSON: 'c' } } as any;
      mockFetcher.fetchWithAuth.mockResolvedValue(
        createMockResponse(true, {})
      );

      const result = await passkeyClient.enrollmentVerify({
        authSession: TEST_AUTH_SESSION,
        credential
      });

      expect(result).toBeUndefined();
    });

    it('should throw PasskeyEnrollmentVerifyError on non-ok response', async () => {
      const credential = { id: 'c', rawId: 'r', type: 'public-key', response: { clientDataJSON: 'c' } } as any;
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

    it('should throw PasskeyEnrollmentVerifyError with default message when json parsing fails', async () => {
      const credential = { id: 'c', rawId: 'r', type: 'public-key', response: { clientDataJSON: 'c' } } as any;
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
  });
});
