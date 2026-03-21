import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as workerUtils from '../../src/worker/worker.utils';
import { expect } from '@jest/globals';

import { loginWithRedirectFn, setupFn } from './helpers';
import {
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
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

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

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

  describe('revokeRefreshToken()', () => {
    // Use localstorage to avoid the worker path so the refresh token
    // is stored in the main-thread cache.
    const defaultConfig = {
      useRefreshTokens: true,
      cacheLocation: 'localstorage' as const
    };

    it('does nothing when useRefreshTokens is not enabled', async () => {
      const auth0 = setup({ useRefreshTokens: false, cacheLocation: 'localstorage' });

      await auth0.revokeRefreshToken();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does nothing when no refresh token is in the cache', async () => {
      const auth0 = setup(defaultConfig);

      await auth0.revokeRefreshToken();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls /oauth/revoke with the stored refresh token', async () => {
      const auth0 = setup(defaultConfig);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      await auth0.revokeRefreshToken();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`https://${TEST_DOMAIN}/oauth/revoke`);
      const body = Object.fromEntries(new URLSearchParams(options.body));
      expect(body).toMatchObject({
        client_id: TEST_CLIENT_ID,
        token: TEST_REFRESH_TOKEN
      });
    });

    it('removes the refresh token from the cache after successful revocation', async () => {
      const auth0 = setup(defaultConfig);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      const stripRefreshTokenSpy = jest.spyOn(
        (auth0 as any).cacheManager,
        'stripRefreshToken'
      );

      await auth0.revokeRefreshToken();

      expect(stripRefreshTokenSpy).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
    });

    it('keeps the access token in the cache after revoking the refresh token', async () => {
      const auth0 = setup(defaultConfig);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      await auth0.revokeRefreshToken();

      // id token claims are served from cache — still available after revocation
      const claims = await auth0.getIdTokenClaims();
      expect(claims).toBeDefined();

      // Access token served from cache — no additional fetch calls made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws when the revoke endpoint returns an error', async () => {
      const auth0 = setup(defaultConfig);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: 'invalid_token',
              error_description: 'The token has been revoked'
            })
          )
      });

      await expect(auth0.revokeRefreshToken()).rejects.toThrow('The token has been revoked');
    });

    it('uses the provided audience when revoking', async () => {
      const auth0 = setup({
        ...defaultConfig,
        authorizationParams: { audience: 'https://api.example.com' }
      });
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      await auth0.revokeRefreshToken({ audience: 'https://api.example.com' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe(`https://${TEST_DOMAIN}/oauth/revoke`);
    });

    it('revokes all distinct refresh tokens when multiple scope entries exist for the same audience', async () => {
      const auth0 = setup(defaultConfig);

      jest
        .spyOn((auth0 as any).cacheManager, 'getRefreshTokensByAudience')
        .mockResolvedValue(['rt_one', 'rt_two']);

      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

      await auth0.revokeRefreshToken();

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const body1 = Object.fromEntries(
        new URLSearchParams(mockFetch.mock.calls[0][1].body)
      );
      const body2 = Object.fromEntries(
        new URLSearchParams(mockFetch.mock.calls[1][1].body)
      );

      expect(body1).toMatchObject({ token: 'rt_one' });
      expect(body2).toMatchObject({ token: 'rt_two' });
    });

    it('stops and throws if a revoke call fails when multiple RTs exist', async () => {
      const auth0 = setup(defaultConfig);

      jest
        .spyOn((auth0 as any).cacheManager, 'getRefreshTokensByAudience')
        .mockResolvedValue(['rt_one', 'rt_two']);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({ error_description: 'The token has been revoked' })
          )
      });

      await expect(auth0.revokeRefreshToken()).rejects.toThrow('The token has been revoked');
      // Second token should not have been attempted
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('sends message to worker when worker is available', async () => {
      // Use default (memory) cache so the worker path is taken
      const sendMessageSpy = jest
        .spyOn(workerUtils, 'sendMessage')
        .mockResolvedValue(undefined);

      const auth0 = setup({ useRefreshTokens: true });

      await auth0.revokeRefreshToken();

      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'revoke',
          fetchUrl: `https://${TEST_DOMAIN}/oauth/revoke`,
          fetchOptions: expect.objectContaining({
            method: 'POST'
          }),
          auth: expect.objectContaining({
            audience: expect.any(String)
          })
        }),
        expect.anything()
      );
    });
  });
});
