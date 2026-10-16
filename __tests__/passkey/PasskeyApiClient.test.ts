jest.mock('@auth0/auth0-auth-js', () => ({
  ...jest.requireActual('@auth0/auth0-auth-js'),
  PasskeyClient: jest.fn()
}));

import { PasskeyApiClient } from '../../src/passkey/PasskeyApiClient';
import {
  GenericError,
  MfaRequiredError,
  PasskeyVerificationRequiredError
} from '../../src/errors';
import { PasskeyError, PasskeyGetTokenError } from '../../src/passkey/errors';

const TEST_AUTH_SESSION = 'auth-session-abc123';

// jsdom does not implement the WebAuthn response classes, but
// `getTokenWithPasskey` branches on `instanceof AuthenticatorAttestationResponse`
// / `AuthenticatorAssertionResponse`. 
class MockAuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer;
  attestationObject: ArrayBuffer;
  constructor(clientDataJSON: ArrayBuffer, attestationObject: ArrayBuffer) {
    this.clientDataJSON = clientDataJSON;
    this.attestationObject = attestationObject;
  }
}

class MockAuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer;
  authenticatorData: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle: ArrayBuffer | null;
  constructor(
    clientDataJSON: ArrayBuffer,
    authenticatorData: ArrayBuffer,
    signature: ArrayBuffer,
    userHandle: ArrayBuffer | null
  ) {
    this.clientDataJSON = clientDataJSON;
    this.authenticatorData = authenticatorData;
    this.signature = signature;
    this.userHandle = userHandle;
  }
}

(global as any).AuthenticatorAttestationResponse = MockAuthenticatorAttestationResponse;
(global as any).AuthenticatorAssertionResponse = MockAuthenticatorAssertionResponse;

// Builds a credential whose `response` is a real instance of one of the mock
// WebAuthn response classes above, so `getTokenWithPasskey`'s `instanceof`
// detection resolves correctly under jsdom.
function createTypedPublicKeyCredential(type: 'create' | 'get') {
  const clientDataJSON = new Uint8Array([1, 2, 3]).buffer;

  if (type === 'create') {
    return {
      id: 'credential-id-123',
      rawId: new Uint8Array([10, 20, 30]).buffer,
      type: 'public-key',
      authenticatorAttachment: 'platform',
      response: new MockAuthenticatorAttestationResponse(
        clientDataJSON,
        new Uint8Array([40, 50, 60]).buffer
      ),
      getClientExtensionResults: () => ({})
    } as unknown as PublicKeyCredential;
  }

  return {
    id: 'credential-id-456',
    rawId: new Uint8Array([10, 20, 30]).buffer,
    type: 'public-key',
    authenticatorAttachment: 'platform',
    response: new MockAuthenticatorAssertionResponse(
      clientDataJSON,
      new Uint8Array([70, 80, 90]).buffer,
      new Uint8Array([100, 110, 120]).buffer,
      new Uint8Array([130, 140, 150]).buffer
    ),
    getClientExtensionResults: () => ({})
  } as unknown as PublicKeyCredential;
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

    it('should throw PasskeyVerificationRequiredError when verification is required', async () => {
      mockPasskeyClient.register.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        },
        verificationRequired: ['email']
      });
      const createMock = jest.fn();
      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: createMock },
        configurable: true
      });

      const err = await passkeyClient
        .signup({ email: 'user@example.com' })
        .catch(e => e);

      expect(err).toBeInstanceOf(PasskeyVerificationRequiredError);
      expect(err).toBeInstanceOf(GenericError);
      expect(err.error).toBe('verification_required');
      expect(err.verificationRequired).toEqual(['email']);
      expect(createMock).not.toHaveBeenCalled();
      expect(mockAuth0Client._requestTokenForPasskey).not.toHaveBeenCalled();
    });
  });

  describe('continueSignup', () => {
    const verificationChallenge = {
      authSession: TEST_AUTH_SESSION,
      authnParamsPublicKey: {
        challenge: 'Y2hhbGxlbmdl',
        rp: { id: 'example.auth0.com', name: 'Example' },
        user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
      },
      verificationRequired: ['email']
    };

    let createMock: jest.Mock;

    beforeEach(async () => {
      mockPasskeyClient.register.mockResolvedValue(verificationChallenge);
      createMock = jest.fn().mockResolvedValue(createMockPublicKeyCredential('create'));
      Object.defineProperty(global.navigator, 'credentials', {
        value: { create: createMock },
        configurable: true
      });

      await passkeyClient.signup({ email: 'user@example.com' }).catch(() => {});
    });

    it('should reuse the session and passkey after a retryable error', async () => {
      mockAuth0Client._requestTokenForPasskey
        .mockRejectedValueOnce(
          new PasskeyGetTokenError('Invalid or expired session', {
            error: 'invalid_grant',
            error_description: 'Invalid or expired session',
            auth_session: 'auth-session-retry',
            verification_required: ['email']
          })
        )
        .mockResolvedValueOnce({ access_token: 'at_123' });

      const err = await passkeyClient.continueSignup({ email: '000000' }).catch(e => e);
      expect(err).toBeInstanceOf(PasskeyGetTokenError);
      expect(err.isRetryable).toBe(true);

      await expect(passkeyClient.continueSignup({ email: '123456' })).resolves.toEqual({
        access_token: 'at_123'
      });

      expect(createMock).toHaveBeenCalledTimes(1);
      const [first, second] = mockAuth0Client._requestTokenForPasskey.mock.calls;
      expect(first[0].authSession).toBe(TEST_AUTH_SESSION);
      expect(second[0].authSession).toBe('auth-session-retry');
      expect(second[0].credential).toEqual(first[0].credential);
      expect(second[0].verification).toEqual({ email: '123456' });
    });

    it('should clear the pending signup after a non-retryable error', async () => {
      mockAuth0Client._requestTokenForPasskey.mockRejectedValueOnce(
        new GenericError('invalid_grant', 'Invalid or expired session')
      );

      await expect(passkeyClient.continueSignup({ email: '000000' })).rejects.toBeInstanceOf(
        GenericError
      );

      await expect(passkeyClient.continueSignup({ email: '123456' })).rejects.toMatchObject({
        code: 'no_pending_signup'
      });
    });

    it('should keep the pending signup when the passkey prompt is cancelled', async () => {
      createMock.mockResolvedValueOnce(null);
      mockAuth0Client._requestTokenForPasskey.mockResolvedValueOnce({ access_token: 'at_123' });

      await expect(passkeyClient.continueSignup({ email: '123456' })).rejects.toMatchObject({
        code: 'passkey_cancelled'
      });

      await expect(passkeyClient.continueSignup({ email: '123456' })).resolves.toEqual({
        access_token: 'at_123'
      });
      expect(mockAuth0Client._requestTokenForPasskey.mock.calls[0][0].authSession).toBe(
        TEST_AUTH_SESSION
      );
    });

    it('should clear the pending signup when a new signup does not need verification', async () => {
      mockPasskeyClient.register.mockResolvedValueOnce({
        ...verificationChallenge,
        verificationRequired: undefined
      });
      mockAuth0Client._requestTokenForPasskey.mockResolvedValueOnce({ access_token: 'at_123' });

      await passkeyClient.signup({ email: 'other@example.com' });

      await expect(passkeyClient.continueSignup({ email: '123456' })).rejects.toMatchObject({
        code: 'no_pending_signup'
      });
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

  describe('getSignupChallenge', () => {
    it('should return authSession and a decoded creation publicKey', async () => {
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

      const result = await passkeyClient.getSignupChallenge({
        email: 'user@example.com'
      });

      expect(mockPasskeyClient.register).toHaveBeenCalledWith({
        email: 'user@example.com'
      });
      expect(result.authSession).toBe(TEST_AUTH_SESSION);
      expect(result.publicKey.challenge).toBeInstanceOf(ArrayBuffer);
      expect(result.publicKey.user.id).toBeInstanceOf(ArrayBuffer);
      expect(result.publicKey.rp).toEqual({
        id: 'example.auth0.com',
        name: 'Example'
      });
      expect(result.verificationRequired).toBeUndefined();
    });

    it('should return verificationRequired when the server requires it', async () => {
      mockPasskeyClient.register.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        },
        verificationRequired: ['email']
      });

      const result = await passkeyClient.getSignupChallenge({
        email: 'user@example.com'
      });

      expect(result.verificationRequired).toEqual(['email']);
    });

    it('should forward all supported signup properties to register', async () => {
      mockPasskeyClient.register.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      });

      await passkeyClient.getSignupChallenge({
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

      // Every supported property is passed straight through to the challenge
      // request. Unlike signup(), there is no scope/audience here — those apply
      // only at the getTokenWithPasskey() step.
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
    });

    it('should not trigger the WebAuthn ceremony or token exchange', async () => {
      mockPasskeyClient.register.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rp: { id: 'example.auth0.com', name: 'Example' },
          user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      });
      const create = jest.fn();
      Object.defineProperty(global.navigator, 'credentials', {
        value: { create },
        configurable: true
      });

      await passkeyClient.getSignupChallenge({ email: 'user@example.com' });

      expect(create).not.toHaveBeenCalled();
      expect(mockAuth0Client._requestTokenForPasskey).not.toHaveBeenCalled();
    });

    it('should throw if WebAuthn is not supported', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(
        passkeyClient.getSignupChallenge({ email: 'user@example.com' })
      ).rejects.toThrow('WebAuthn is not supported in this browser.');
    });

    it('should propagate errors from PasskeyClient.register', async () => {
      mockPasskeyClient.register.mockRejectedValue(new Error('Network error'));

      await expect(
        passkeyClient.getSignupChallenge({ email: 'user@example.com' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getLoginChallenge', () => {
    it('should return authSession and a decoded request publicKey', async () => {
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

      const result = await passkeyClient.getLoginChallenge();

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith(undefined);
      expect(result.authSession).toBe(TEST_AUTH_SESSION);
      expect(result.publicKey.challenge).toBeInstanceOf(ArrayBuffer);
      expect(result.publicKey.rpId).toBe('example.auth0.com');
    });

    it('should call challenge with provided options', async () => {
      mockPasskeyClient.challenge.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      });

      await passkeyClient.getLoginChallenge({});

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith({});
    });

    it('should forward challenge options when provided', async () => {
      mockPasskeyClient.challenge.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      });

      await passkeyClient.getLoginChallenge({
        realm: 'Username-Password-Authentication',
        organization: 'org_abc123'
      });

      expect(mockPasskeyClient.challenge).toHaveBeenCalledWith({
        realm: 'Username-Password-Authentication',
        organization: 'org_abc123'
      });
    });

    it('should not trigger the WebAuthn ceremony or token exchange', async () => {
      mockPasskeyClient.challenge.mockResolvedValue({
        authSession: TEST_AUTH_SESSION,
        authnParamsPublicKey: {
          challenge: 'Y2hhbGxlbmdl',
          rpId: 'example.auth0.com'
        }
      });
      const get = jest.fn();
      Object.defineProperty(global.navigator, 'credentials', {
        value: { get },
        configurable: true
      });

      await passkeyClient.getLoginChallenge();

      expect(get).not.toHaveBeenCalled();
      expect(mockAuth0Client._requestTokenForPasskey).not.toHaveBeenCalled();
    });

    it('should throw if WebAuthn is not supported', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(passkeyClient.getLoginChallenge()).rejects.toThrow(
        'WebAuthn is not supported in this browser.'
      );
    });

    it('should propagate errors from PasskeyClient.challenge', async () => {
      mockPasskeyClient.challenge.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(passkeyClient.getLoginChallenge()).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('getTokenWithPasskey', () => {
    it('should throw if WebAuthn is not supported', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(
        passkeyClient.getTokenWithPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: createTypedPublicKeyCredential('create')
        })
      ).rejects.toThrow(
        'WebAuthn is not supported in this browser.'
      );
    });

    it('should serialize an attestation credential and exchange it for tokens', async () => {
      const mockTokenResponse = {
        id_token: 'eyJ...',
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.getTokenWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: createTypedPublicKeyCredential('create')
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

    it('should serialize an assertion credential and exchange it for tokens', async () => {
      const mockTokenResponse = {
        access_token: 'at_456',
        token_type: 'Bearer',
        expires_in: 86400
      };
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue(mockTokenResponse);

      const result = await passkeyClient.getTokenWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: createTypedPublicKeyCredential('get')
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

    it('should forward realm, organization, scope, and audience', async () => {
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.getTokenWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: createTypedPublicKeyCredential('create'),
        realm: 'Username-Password-Authentication',
        organization: 'org_abc123',
        scope: 'openid profile email',
        audience: 'https://api.example.com'
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

    it('should throw a PasskeyError if the credential is neither attestation nor assertion', async () => {
      const invalidCredential = {
        id: 'credential-id-789',
        rawId: new Uint8Array([1, 2, 3]).buffer,
        type: 'public-key',
        response: { somethingElse: true },
        getClientExtensionResults: () => ({})
      } as unknown as PublicKeyCredential;

      await expect(
        passkeyClient.getTokenWithPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: invalidCredential
        })
      ).rejects.toThrow(
        new PasskeyError(
          'passkey_invalid_credential',
          'The provided credential is not a valid attestation or assertion response.'
        )
      );

      expect(mockAuth0Client._requestTokenForPasskey).not.toHaveBeenCalled();
    });

    it('should serialize credential fields with base64url encoding', async () => {
      mockAuth0Client._requestTokenForPasskey.mockResolvedValue({
        access_token: 'at_123',
        token_type: 'Bearer',
        expires_in: 86400
      });

      await passkeyClient.getTokenWithPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: createTypedPublicKeyCredential('get')
      });

      const credential =
        mockAuth0Client._requestTokenForPasskey.mock.calls[0][0].credential;
      expect(credential.rawId).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.clientDataJSON).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.authenticatorData).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(credential.response.signature).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should propagate errors from the token exchange', async () => {
      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(
        new Error('Token exchange failed')
      );

      await expect(
        passkeyClient.getTokenWithPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: createTypedPublicKeyCredential('create')
        })
      ).rejects.toThrow('Token exchange failed');
    });

    it('should re-throw MfaRequiredError', async () => {
      const mfaError = new MfaRequiredError(
        'mfa_required',
        'Multifactor authentication required',
        'mfa-token-789',
        { challenge: [{ type: 'otp' }] }
      );
      mockAuth0Client._requestTokenForPasskey.mockRejectedValue(mfaError);

      await expect(
        passkeyClient.getTokenWithPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: createTypedPublicKeyCredential('get')
        })
      ).rejects.toThrow(mfaError);
    });
  });

});
