import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { GenericError, MfaRequiredError } from '../../src/errors';
import { PasskeyGetTokenError } from '../../src/passkey';

import { fetchResponse, setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_DPOP_NONCE,
  TEST_DPOP_PROOF,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN
} from '../constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

const TEST_CREDENTIAL = {
  id: 'credential-id-123',
  rawId: 'cmF3SWQtYmFzZTY0dXJs',
  type: 'public-key',
  authenticatorAttachment: 'platform',
  response: {
    clientDataJSON: 'Y2xpZW50RGF0YUpTT04',
    authenticatorData: 'YXV0aGVudGljYXRvckRhdGE',
    signature: 'c2lnbmF0dXJl',
    userHandle: 'dXNlckhhbmRsZQ'
  },
  clientExtensionResults: {}
};

const TEST_AUTH_SESSION = 'auth-session-abc123';

describe('Auth0Client', () => {
  beforeEach(() => {
    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    jest.spyOn(scope, 'getUniqueScopes');
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  describe('_requestTokenForPasskey', () => {
    it('passes correct parameters to _requestToken', async () => {
      const auth0 = setup({
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any,
        scope: 'openid profile email',
        audience: 'https://api.example.com'
      });

      expect(capturedOptions.grant_type).toBe(
        'urn:okta:params:oauth:grant-type:webauthn'
      );
      expect(capturedOptions.auth_session).toBe(TEST_AUTH_SESSION);
      expect(capturedOptions.authn_response).toEqual(TEST_CREDENTIAL);
      expect(capturedOptions.audience).toBe('https://api.example.com');
      expect(capturedOptions.scope).toContain('openid');
      expect(capturedOptions.scope).toContain('profile');
      expect(capturedOptions.scope).toContain('email');
    });

    it('uses default audience when none provided', async () => {
      const auth0 = setup({
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any
      });

      expect(capturedOptions.audience).toBe('https://default-api.com');
    });

    it('includes realm when provided', async () => {
      const auth0 = setup();

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any,
        realm: 'Username-Password-Authentication'
      });

      expect(capturedOptions.realm).toBe('Username-Password-Authentication');
    });

    it('includes organization and verification when provided', async () => {
      const auth0 = setup();

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any,
        organization: 'org_abc123',
        verification: { email: '123456' }
      });

      expect(capturedOptions.organization).toBe('org_abc123');
      expect(capturedOptions.verification).toEqual({ email: '123456' });
    });

    it('does not include realm when not provided', async () => {
      const auth0 = setup();

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any
      });

      expect(capturedOptions.realm).toBeUndefined();
    });

    it('does not include verification when it is empty', async () => {
      const auth0 = setup();

      let capturedOptions: any;
      auth0['_requestToken'] = async function (options: any) {
        capturedOptions = options;
        return {
          decodedToken: {
            encoded: { header: 'h', payload: 'p', signature: 's' },
            header: {},
            claims: { sub: 'me', __raw: 'raw' },
            user: { sub: 'me' }
          },
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: options.scope
        };
      };

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any,
        verification: {}
      });

      expect(capturedOptions).not.toHaveProperty('verification');
    });

    it('caches tokens and establishes session via _requestToken', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400
        })
      );

      const result = await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any
      });

      expect(result.access_token).toBe(TEST_ACCESS_TOKEN);
      expect(result.id_token).toBe(TEST_ID_TOKEN);

      // Verify user is now authenticated (session established)
      const isAuthenticated = await auth0.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Verify user claims are accessible
      const user = await auth0.getUser();
      expect(user.sub).toBe('me');
    });

    it('verifies the ID token', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400
        })
      );

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any
      });

      expect(mockVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          id_token: TEST_ID_TOKEN
        })
      );
    });

    it('propagates terminal token endpoint errors as GenericError', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_grant',
          error_description: 'Auth session has expired'
        })
      );

      const err = await auth0
        ._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any
        })
        .catch(e => e);

      expect(err).toBeInstanceOf(GenericError);
      expect(err).not.toBeInstanceOf(PasskeyGetTokenError);
      expect(err).toMatchObject({
        error: 'invalid_grant',
        error_description: 'Auth session has expired'
      });
    });

    it('throws a retryable PasskeyGetTokenError on a wrong OTP code', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_grant',
          error_description: 'Invalid or expired session',
          auth_session: 'auth-session-retry',
          verification_required: ['email']
        })
      );

      const err = await auth0
        ._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any,
          verification: { email: '000000' }
        })
        .catch(e => e);

      expect(err).toBeInstanceOf(PasskeyGetTokenError);
      expect(err.isRetryable).toBe(true);
      expect(err.authSession).toBe('auth-session-retry');
      expect(err.verificationRequired).toEqual(['email']);
    });

    it('lists every identifier when several OTP codes are wrong', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_grant',
          error_description: 'Invalid or expired session',
          auth_session: 'auth-session-retry',
          verification_required: ['email', 'phone']
        })
      );

      const err = await auth0
        ._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any,
          verification: { email: '000000', phone: '000000' }
        })
        .catch(e => e);

      expect(err).toBeInstanceOf(PasskeyGetTokenError);
      expect(err.isRetryable).toBe(true);
      expect(err.authSession).toBe('auth-session-retry');
      expect(err.verificationRequired).toEqual(['email', 'phone']);
    });

    it('propagates a missing code error as GenericError', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_request',
          error_description: 'Missing required parameter: verification.email'
        })
      );

      const err = await auth0
        ._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any
        })
        .catch(e => e);

      expect(err).toBeInstanceOf(GenericError);
      expect(err).not.toBeInstanceOf(PasskeyGetTokenError);
      expect(err.error).toBe('invalid_request');
    });

    it('propagates an error with only auth_session as GenericError', async () => {
      const auth0 = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_grant',
          error_description: 'Invalid or expired session',
          auth_session: 'auth-session-retry'
        })
      );

      const err = await auth0
        ._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any
        })
        .catch(e => e);

      expect(err).toBeInstanceOf(GenericError);
      expect(err).not.toBeInstanceOf(PasskeyGetTokenError);
      expect(err.data).toEqual({ auth_session: 'auth-session-retry' });
    });

    it('stores MFA context and re-throws MfaRequiredError', async () => {
      const auth0 = setup();
      const setMFAAuthDetailsSpy = jest.spyOn(auth0.mfa, 'setMFAAuthDetails');

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'mfa_required',
          error_description: 'Multifactor authentication required',
          mfa_token: 'mfa-token-123',
          mfa_requirements: { challenge: [{ type: 'otp' }] }
        })
      );

      await expect(
        auth0._requestTokenForPasskey({
          authSession: TEST_AUTH_SESSION,
          credential: TEST_CREDENTIAL as any,
          scope: 'openid profile',
          audience: 'https://api.example.com'
        })
      ).rejects.toThrow(MfaRequiredError);

      expect(setMFAAuthDetailsSpy).toHaveBeenCalledWith(
        'mfa-token-123',
        'openid profile email',
        'https://api.example.com',
        { challenge: [{ type: 'otp' }] }
      );
    });

    it('sends JSON body to /oauth/token endpoint (not form-encoded)', async () => {
      const auth0 = setup({ useFormData: true });

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400
        })
      );

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any,
        realm: 'my-connection'
      });

      const [url, fetchOptions] = mockFetch.mock.calls[0];
      expect(url).toContain('/oauth/token');
      expect(fetchOptions.method).toBe('POST');
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(fetchOptions.body);
      expect(body.grant_type).toBe(
        'urn:okta:params:oauth:grant-type:webauthn'
      );
      expect(body.auth_session).toBe(TEST_AUTH_SESSION);
      expect(body.authn_response).toEqual(TEST_CREDENTIAL);
      expect(body.realm).toBe('my-connection');
    });

    it('sends DPoP-Proof header when DPoP is enabled', async () => {
      const auth0 = setup({ useDpop: true });
      const dpop = auth0['dpop']!;

      jest.spyOn(dpop, 'getNonce').mockResolvedValue(TEST_DPOP_NONCE);
      jest.spyOn(dpop, 'generateProof').mockResolvedValue(TEST_DPOP_PROOF);
      jest.spyOn(dpop, 'setNonce').mockResolvedValue();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400
        })
      );

      await auth0._requestTokenForPasskey({
        authSession: TEST_AUTH_SESSION,
        credential: TEST_CREDENTIAL as any
      });

      const [, fetchOptions] = mockFetch.mock.calls[0];
      expect(fetchOptions.headers['dpop']).toBe(TEST_DPOP_PROOF);
    });
  });
});
