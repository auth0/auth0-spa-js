import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

import * as esCookie from 'es-cookie';
// @ts-ignore — resolved to the test mock via jest.mock() below
import TokenWorker from '../../src/worker/token.worker';

import { GenericError } from '../../src/errors';
import {
  fetchResponse,
  loginWithPopupFn,
  loginWithRedirectFn,
  setupFn
} from './helpers';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_TOKEN_TYPE,
  nowSeconds
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

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
const loginWithPopup = loginWithPopupFn(mockWindow, mockFetch);

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        }
      }
    ) as Location;

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.removeEventListener = jest.fn();

    mockWindow.crypto = {
      subtle: { digest: () => 'foo' },
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
    window.location = oldWindowLocation;
  });

  describe('session_expiry', () => {
    describe('login-time validation', () => {
      it('throws if session_expiry equals iat', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: iat });

        const error = await loginWithRedirect(auth0).catch(e => e);
        expect(error).toBeInstanceOf(GenericError);
        expect(error.error).toBe('invalid_token');
        expect(error.message).toBe(
          'Invalid session_expiry: session ceiling is before or at the token issue time.'
        );
      });

      it('throws if session_expiry is before iat', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: iat - 1 });

        const error = await loginWithRedirect(auth0).catch(e => e);
        expect(error).toBeInstanceOf(GenericError);
        expect(error.error).toBe('invalid_token');
        expect(error.message).toBe(
          'Invalid session_expiry: session ceiling is before or at the token issue time.'
        );
      });

      it('succeeds if session_expiry is after iat', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: iat + 3600 });

        await expect(loginWithRedirect(auth0)).resolves.not.toThrow();
      });

      it('succeeds when session_expiry is absent', async () => {
        const auth0 = setup();

        await expect(loginWithRedirect(auth0)).resolves.not.toThrow();
      });

      it('throws if session_expiry is a millisecond-magnitude value', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: iat * 1000 });

        const error = await loginWithRedirect(auth0).catch(e => e);
        expect(error).toBeInstanceOf(GenericError);
        expect(error.error).toBe('invalid_token');
        expect(error.message).toBe(
          'Invalid session_expiry: value appears to be in milliseconds; expected a Unix timestamp in seconds.'
        );
      });

      it('throws if session_expiry is a non-numeric string', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: 'not-a-number' as any });

        const error = await loginWithRedirect(auth0).catch(e => e);
        expect(error).toBeInstanceOf(GenericError);
        expect(error.error).toBe('invalid_token');
        expect(error.message).toBe(
          'Invalid session_expiry: value must be a number.'
        );
      });
    });

    describe('getTokenSilently ceiling enforcement', () => {
      it('returns a token when no session_expiry claim is present', async () => {
        const auth0 = setup();
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();

        expect(token).toBeTruthy();
      });

      it('returns a token when the ceiling has not been reached', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry - 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();

        expect(token).toBeTruthy();
      });

      it('returns undefined when the ceiling has been breached', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();

        expect(token).toBeUndefined();
      });

      it('returns undefined when within the 30s leeway window', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        // nowSeconds = sessionExpiry - 15, which is >= sessionExpiry - 30
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry - 15) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();

        expect(token).toBeUndefined();
      });

      it('returns a token when just outside the 30s leeway window', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        // nowSeconds = sessionExpiry - 31, which is < sessionExpiry - 30
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry - 31) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();

        expect(token).toBeTruthy();
      });

      it('does not reach the network on breach', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        await auth0.getTokenSilently();

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('getUser returns undefined after breach', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        await auth0.getTokenSilently();
        const user = await auth0.getUser();

        expect(user).toBeUndefined();
      });

      it('ceiling is enforced after a silent refresh that omits the claim', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        let currentTime = (iat + 100) * 1000;

        const auth0 = setup(
          { useRefreshTokens: true, nowProvider: () => currentTime },
          { iat, session_expiry: sessionExpiry }
        );

        // Initial login — ID token carries session_expiry
        await loginWithRedirect(auth0);

        // Silent refresh via /oauth/token — response ID token omits session_expiry
        mockVerify.mockReturnValueOnce({
          claims: { sub: 'me', exp: Date.now() / 1000 + 86400, iat },
          user: { sub: 'me' }
        });
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );
        await auth0.getTokenSilently({ cacheMode: 'off' });

        // Advance clock past the original ceiling
        currentTime = (sessionExpiry + 100) * 1000;
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();
        expect(token).toBeUndefined();
      });

      it('original ceiling wins when a silent refresh re-emits a later session_expiry', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        let currentTime = (iat + 100) * 1000;

        const auth0 = setup(
          { useRefreshTokens: true, nowProvider: () => currentTime },
          { iat, session_expiry: sessionExpiry }
        );

        // Initial login — ceiling at iat + 3600
        await loginWithRedirect(auth0);

        // Silent refresh re-emits a later session_expiry (iat + 7200) — must be ignored
        mockVerify.mockReturnValueOnce({
          claims: {
            sub: 'me',
            exp: Date.now() / 1000 + 86400,
            iat,
            session_expiry: iat + 7200
          },
          user: { sub: 'me' }
        });
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );
        await auth0.getTokenSilently({ cacheMode: 'off' });

        // Advance clock past the original ceiling but before the extended one
        currentTime = (sessionExpiry + 100) * 1000;
        mockFetch.mockReset();

        // Original ceiling must still be enforced
        const token = await auth0.getTokenSilently();
        expect(token).toBeUndefined();
      });

      it('does not invent a ceiling when session_expiry was never present', async () => {
        // Two logins, neither carries session_expiry
        const auth0 = setup();
        await loginWithRedirect(auth0);
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();
        expect(token).toBeTruthy();
      });

      it('fresh re-login via loginWithRedirect does not inherit the old ceiling', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        let currentTime = (iat + 100) * 1000;

        const auth0 = setup(
          { nowProvider: () => currentTime },
          { iat, session_expiry: sessionExpiry }
        );

        // First login — token carries session_expiry ceiling
        await loginWithRedirect(auth0);

        // Re-login without logout — new token has no session_expiry
        mockVerify.mockReturnValueOnce({
          claims: { sub: 'me', exp: Date.now() / 1000 + 86400, iat },
          user: { sub: 'me' }
        });
        await loginWithRedirect(auth0);

        // Advance clock past the original ceiling
        currentTime = (sessionExpiry + 100) * 1000;
        mockFetch.mockReset();

        // Old ceiling must not have been inherited — token should still be served
        const token = await auth0.getTokenSilently();
        expect(token).toBeTruthy();
      });

      it('getUser returns undefined on breach without a prior getTokenSilently call', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        // call getUser directly — no getTokenSilently first
        const user = await auth0.getUser();
        expect(user).toBeUndefined();
      });

      it('isAuthenticated returns false on breach without a prior getTokenSilently call', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        // call isAuthenticated directly — no getTokenSilently first
        const authenticated = await auth0.isAuthenticated();
        expect(authenticated).toBe(false);
      });

      it('getIdTokenClaims returns undefined on breach without a prior getTokenSilently call', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        // call getIdTokenClaims directly — no getTokenSilently first
        const claims = await auth0.getIdTokenClaims();
        expect(claims).toBeUndefined();
      });

      it('isAuthenticated returns false after breach', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        mockFetch.mockReset();

        await auth0.getTokenSilently();
        const authenticated = await auth0.isAuthenticated();

        expect(authenticated).toBe(false);
      });
    });

    describe('_clearLocalSession on breach', () => {
      it('removes the isAuthenticated cookie on breach', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);

        await auth0.getUser();

        expect(esCookie.remove).toHaveBeenCalledWith(
          `auth0.${TEST_CLIENT_ID}.is.authenticated`,
          {}
        );
      });

      it('clears DPoP keys on breach', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        // Login without DPoP to avoid IndexedDB in JSDOM, then inject a mock
        // DPoP handler so we can assert it gets cleared on breach.
        const auth0 = setup(
          { nowProvider: () => (sessionExpiry + 100) * 1000 },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);

        const mockDpop = { clear: jest.fn().mockResolvedValue(undefined) };
        Object.defineProperty(auth0, 'dpop', { value: mockDpop, writable: true });

        await auth0.getUser();

        expect(mockDpop.clear).toHaveBeenCalled();
      });

      it("sends a 'clear' message to the worker on breach", async () => {
        const postMessageSpy = jest.spyOn(
          TokenWorker.prototype as any,
          'postMessage'
        );

        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        const auth0 = setup(
          {
            nowProvider: () => (sessionExpiry + 100) * 1000,
            useRefreshTokens: true,
            cacheLocation: 'memory'
          },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithRedirect(auth0);
        postMessageSpy.mockClear();

        await auth0.getUser();

        const clearCalls = postMessageSpy.mock.calls.filter(
          ([msg]) => msg && (msg as any).type === 'clear'
        );
        expect(clearCalls.length).toBe(1);
      });
    });

    describe('loginWithPopup', () => {
      it('throws if session_expiry equals iat via popup', async () => {
        const iat = nowSeconds();
        const auth0 = setup({}, { iat, session_expiry: iat });

        const error = await loginWithPopup(auth0).catch(e => e);
        expect(error).toBeInstanceOf(GenericError);
        expect(error.error).toBe('invalid_token');
        expect(error.message).toBe(
          'Invalid session_expiry: session ceiling is before or at the token issue time.'
        );
      });

      it('enforces the ceiling set via loginWithPopup', async () => {
        const iat = nowSeconds();
        const sessionExpiry = iat + 3600;
        let currentTime = (iat + 100) * 1000;

        const auth0 = setup(
          { nowProvider: () => currentTime },
          { iat, session_expiry: sessionExpiry }
        );
        await loginWithPopup(auth0);

        currentTime = (sessionExpiry + 100) * 1000;
        mockFetch.mockReset();

        const token = await auth0.getTokenSilently();
        expect(token).toBeUndefined();
      });
    });
  });
});
