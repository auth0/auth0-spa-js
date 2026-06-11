jest.mock('@auth0/auth0-auth-js', () => ({
  PasskeyClient: jest.fn()
}));

import { PasskeyApiClient } from '../../src/passkey/PasskeyApiClient';
import { MfaRequiredError } from '../../src/errors';

const TEST_AUTH_SESSION = 'auth-session-abc123';

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

  const originalCredentials = Object.getOwnPropertyDescriptor(
    global.navigator,
    'credentials'
  );

  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(window, 'PublicKeyCredential', {
      value: jest.fn(),
      writable: true,
      configurable: true
    });

    mockPasskeyClient = {
      register: jest.fn(),
      challenge: jest.fn(),
      getTokenByPasskey: jest.fn()
    };

    mockAuth0Client = {
      _requestTokenForPasskey: jest.fn()
    };

    passkeyClient = new PasskeyApiClient(
      mockPasskeyClient,
      mockAuth0Client
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

    it('should pass all supported properties to challenge and token exchange', async () => {
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
        phoneNumber: '+1234567890',
        username: 'janedoe',
        name: 'Jane Doe',
        givenName: 'Jane',
        familyName: 'Doe',
        nickname: 'janie',
        picture: 'https://example.com/avatar.png',
        userMetadata: { plan: 'pro' },
        realm: 'Username-Password-Authentication',
        organization: 'org_abc123',
        scope: 'openid profile email',
        audience: 'https://api.example.com'
      });

      expect(mockPasskeyClient.register).toHaveBeenCalledWith({
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        username: 'janedoe',
        name: 'Jane Doe',
        givenName: 'Jane',
        familyName: 'Doe',
        nickname: 'janie',
        picture: 'https://example.com/avatar.png',
        userMetadata: { plan: 'pro' },
        realm: 'Username-Password-Authentication',
        organization: 'org_abc123'
      });
      expect(mockAuth0Client._requestTokenForPasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          authSession: TEST_AUTH_SESSION,
          realm: 'Username-Password-Authentication',
          organization: 'org_abc123',
          scope: 'openid profile email',
          audience: 'https://api.example.com'
        })
      );
    });

    it('should throw if WebAuthn is not supported', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(
        passkeyClient.signup({ email: 'user@example.com' })
      ).rejects.toThrow('WebAuthn is not supported in this browser.');
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

    it('should re-throw MfaRequiredError', async () => {
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

      const mfaError = new MfaRequiredError(
        'mfa_required',
        'Multifactor authentication required',
        'mfa-token-123',
        { challenge: [{ type: 'otp' }] }
      );
      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(mfaError);

      await expect(
        passkeyClient.signup({
          email: 'user@example.com',
          scope: 'openid profile',
          audience: 'https://api.example.com'
        })
      ).rejects.toThrow(mfaError);
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

    it('should throw if WebAuthn is not supported', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(passkeyClient.login()).rejects.toThrow(
        'WebAuthn is not supported in this browser.'
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

    it('should re-throw MfaRequiredError', async () => {
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

      const mfaError = new MfaRequiredError(
        'mfa_required',
        'Multifactor authentication required',
        'mfa-token-456',
        { enroll: [{ type: 'otp' }] }
      );
      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(mfaError);

      await expect(
        passkeyClient.login({
          scope: 'openid profile',
          audience: 'https://api.example.com'
        })
      ).rejects.toThrow(mfaError);
    });
  });

});
