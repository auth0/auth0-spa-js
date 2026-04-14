import * as esCookie from 'es-cookie';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expectToHaveBeenCalledWithAuth0ClientParam } from '../helpers';
import { TEST_AUTH0_CLIENT_QUERY_STRING } from '../constants';
import { expect } from '@jest/globals';

// @ts-ignore
import { fetchResponse, loginWithRedirectFn, setupFn } from './helpers';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_STATE,
  TEST_TOKEN_TYPE
} from '../constants';
import { InMemoryAsyncCacheNoKeys } from '../cache/shared';
import { MissingRefreshTokenError } from '../../src/errors';
// @ts-ignore — resolved to the test mock via jest.mock() below, which provides a default class export
import TokenWorker from '../../src/worker/token.worker';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
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
    // --

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
    window.location = oldWindowLocation;
  });

  describe('logout()', () => {
    it('removes authenticated cookie from storage', async () => {
      const auth0 = setup();
      await auth0.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes authenticated cookie from storage when cookieDomain is set', async () => {
      const auth0 = setup({ cookieDomain: TEST_DOMAIN });
      await auth0.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        { domain: TEST_DOMAIN }
      );
    });

    it('removes the organization hint cookie from storage', async () => {
      const auth0 = setup();
      await auth0.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('calls `window.location.assign` with the correct url', async () => {
      const auth0 = setup();

      await auth0.logout();

      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN}/v2/logout?client_id=${TEST_CLIENT_ID}${TEST_AUTH0_CLIENT_QUERY_STRING}`
      );
    });

    it('calls `window.location.assign` with the correct url when `options.federated` is true', async () => {
      const auth0 = setup();

      await auth0.logout({ logoutParams: { federated: true } });

      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN}/v2/logout?client_id=${TEST_CLIENT_ID}${TEST_AUTH0_CLIENT_QUERY_STRING}&federated`
      );
    });

    it('calls `window.location.assign` with the correct url with custom `options.auth0Client`', async () => {
      const auth0Client = { name: '__test_client_name__', version: '9.9.9' };
      const auth0 = setup({ auth0Client });

      await auth0.logout();

      expectToHaveBeenCalledWithAuth0ClientParam(
        window.location.assign,
        auth0Client
      );
    });

    it('clears the cache for the global clientId', async () => {
      const auth0 = setup();

      jest
        .spyOn(auth0['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await auth0.logout();

      expect(auth0['cacheManager']['clear']).toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('clears the cache for the provided clientId', async () => {
      const auth0 = setup();

      jest
        .spyOn(auth0['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await auth0.logout({ clientId: 'client_123' });

      expect(auth0['cacheManager']['clear']).toHaveBeenCalledWith('client_123');
      expect(auth0['cacheManager']['clear']).not.toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('clears the cache for all client ids', async () => {
      const auth0 = setup();

      jest
        .spyOn(auth0['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await auth0.logout({ clientId: null });

      expect(auth0['cacheManager']['clear']).toHaveBeenCalled();
      expect(auth0['cacheManager']['clear']).not.toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('removes authenticated cookie from storage when `options.onRedirect` is set', async () => {
      const auth0 = setup();

      await auth0.logout({ onRedirect: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes authenticated cookie from storage when `options.openUrl` is set', async () => {
      const auth0 = setup();

      await auth0.logout({ openUrl: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes the organization hint cookie from storage when `options.openUrl` is set', async () => {
      const auth0 = setup();

      await auth0.logout({ openUrl: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('clears DPoP handler when present', async () => {
      const auth0 = setup({ useDpop: true });
      const dpop = auth0['dpop']!;

      jest
        .spyOn(dpop, 'clear')
        .mockResolvedValue();

      await auth0.logout();

      expect(dpop.clear).toHaveBeenCalled();
    });

    it('skips `window.location.assign` when `options.onRedirect` is provided', async () => {
      const auth0 = setup();
      const onRedirect = jest.fn();
      await auth0.logout({ onRedirect });

      expect(window.location.assign).not.toHaveBeenCalled();
      expect(onRedirect).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://auth0_domain/v2/logout?client_id=auth0_client_id'
        )
      );
    });

    it('skips `window.location.assign` when `options.openUrl` is provided', async () => {
      const auth0 = setup();
      const openUrl = jest.fn();
      await auth0.logout({ openUrl });

      expect(window.location.assign).not.toHaveBeenCalled();
      expect(openUrl).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://auth0_domain/v2/logout?client_id=auth0_client_id'
        )
      );
    });

    it('calls `window.location.assign` when `options.onRedirect` is not provided', async () => {
      const auth0 = setup();

      await auth0.logout();
      expect(window.location.assign).toHaveBeenCalled();
    });

    it('calls `window.location.assign` when `options.openUrl` is not provided', async () => {
      const auth0 = setup();

      await auth0.logout();
      expect(window.location.assign).toHaveBeenCalled();
    });

    it('can access isAuthenticated immediately after local logout', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ onRedirect: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ openUrl: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout when using a custom async cache', async () => {
      const auth0 = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ onRedirect: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout when using a custom async cache - using openUrl', async () => {
      const auth0 = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ openUrl: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout when using a custom async cache', async () => {
      const auth0 = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ onRedirect: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout when using a custom async cache - using openUrl', async () => {
      const auth0 = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await loginWithRedirect(auth0);
      expect(await auth0.isAuthenticated()).toBe(true);
      await auth0.logout({ openUrl: async () => {} });

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('correctly handles a null clientId value', async () => {
      const auth0 = setup();
      await auth0.logout({ clientId: null });

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('https://auth0_domain/v2/logout')
      );

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.not.stringContaining('client_id')
      );
    });

    it('correctly handles a different clientId value', async () => {
      const auth0 = setup();
      await auth0.logout({ clientId: 'my-client-id' });

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://auth0_domain/v2/logout?client_id=my-client-id'
        )
      );
    });

    describe('worker token clearing (issue #1596)', () => {
      // The worker is only spawned when useRefreshTokens + cacheLocation: 'memory'
      // are both set AND window.Worker is truthy. The mock at
      // src/worker/__mocks__/token.worker.ts makes that the in-process
      // messageRouter, so we can spy on TokenWorker.prototype.postMessage.

      it("Test D — logout sends a 'clear' message to the worker", async () => {
        const postMessageSpy = jest.spyOn(
          TokenWorker.prototype as any,
          'postMessage'
        );

        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        postMessageSpy.mockClear();

        await auth0.logout({ openUrl: false });

        const clearCalls = postMessageSpy.mock.calls.filter(
          ([msg]) => msg && (msg as any).type === 'clear'
        );
        expect(clearCalls.length).toBeGreaterThanOrEqual(1);
      });

      it('Test E — getTokenSilently after logout throws MissingRefreshTokenError', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);

        // Sanity: pre-logout, getTokenSilently works
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );
        const preToken = await auth0.getTokenSilently({ cacheMode: 'off' });
        expect(preToken).toBe(TEST_ACCESS_TOKEN);

        await auth0.logout({ openUrl: false });

        // Reset fetch so any accidental network call would be obvious
        mockFetch.mockReset();

        await expect(auth0.getTokenSilently()).rejects.toThrow(
          MissingRefreshTokenError
        );

        // The worker must NOT be round-tripped to mint a fresh token —
        // no /oauth/token request should be issued.
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('Test E (cacheMode=off) — explicit refresh after logout also throws', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        await auth0.logout({ openUrl: false });

        mockFetch.mockReset();

        await expect(
          auth0.getTokenSilently({ cacheMode: 'off' })
        ).rejects.toThrow(MissingRefreshTokenError);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('Test F — falls back to iframe after logout when useRefreshTokensFallback is true', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          useRefreshTokensFallback: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        await auth0.logout({ openUrl: false });

        // After logout the worker is empty and the in-memory cache is wiped.
        // With the fallback enabled, _getTokenUsingRefreshToken should hand
        // off to the iframe path instead of throwing MissingRefreshTokenError.
        const runIframeSpy = jest
          .spyOn(<any>utils, 'runIframe')
          .mockResolvedValue({
            access_token: TEST_ACCESS_TOKEN,
            state: TEST_STATE
          });

        // Provide a token-endpoint response for the iframe code exchange.
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        // We don't assert the token value (the iframe path has many moving
        // parts) — only that the iframe was invoked rather than the worker
        // silently re-minting an access token.
        try {
          await auth0.getTokenSilently();
        } catch {
          // The iframe path may still error on PKCE/state mismatch in this
          // mocked harness; the assertion below is what matters.
        }

        expect(runIframeSpy).toHaveBeenCalled();

        runIframeSpy.mockRestore();
      });

      it('Test G — logout without a worker (localstorage) does not post any message', async () => {
        const postMessageSpy = jest.spyOn(
          TokenWorker.prototype as any,
          'postMessage'
        );

        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'localstorage'
        });

        // Worker should not be created in localstorage mode
        expect((<any>auth0).worker).toBeUndefined();

        await loginWithRedirect(auth0);
        postMessageSpy.mockClear();

        await expect(auth0.logout({ openUrl: false })).resolves.not.toThrow();

        // No postMessage on the (non-existent) worker
        expect(postMessageSpy).not.toHaveBeenCalled();
      });

      it('Test G2 — logout without useRefreshTokens does not post any message', async () => {
        const postMessageSpy = jest.spyOn(
          TokenWorker.prototype as any,
          'postMessage'
        );

        const auth0 = setup({
          useRefreshTokens: false,
          cacheLocation: 'memory'
        });

        expect((<any>auth0).worker).toBeUndefined();

        await loginWithRedirect(auth0);
        postMessageSpy.mockClear();

        await auth0.logout({ openUrl: false });

        expect(postMessageSpy).not.toHaveBeenCalled();
      });

      it('logout still completes when the worker clear ACK fails', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);

        // Make the worker postMessage throw on the next call (the clear)
        const postMessageSpy = jest
          .spyOn(TokenWorker.prototype as any, 'postMessage')
          .mockImplementationOnce(() => {
            throw new Error('worker channel broken');
          });

        // Logout must not propagate the worker failure
        await expect(auth0.logout({ openUrl: false })).resolves.not.toThrow();

        postMessageSpy.mockRestore();
      });

      it('worker clear is sent before window.location.assign', async () => {
        const order: string[] = [];

        const postMessageSpy = jest
          .spyOn(TokenWorker.prototype as any, 'postMessage')
          .mockImplementation(function (this: any, msg: any, ports?: any[]) {
            if (msg && msg.type === 'clear') {
              order.push('clear');
            }
            // Delegate to the real mock so the ACK still happens
            const { messageRouter } = jest.requireActual(
              '../../src/worker/token.worker'
            );
            messageRouter({ data: msg, ports: ports || [] });
          });

        (window.location.assign as jest.Mock).mockImplementation(() => {
          order.push('assign');
        });

        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        order.length = 0;

        await auth0.logout();

        expect(order).toContain('clear');
        expect(order).toContain('assign');
        expect(order.indexOf('clear')).toBeLessThan(order.indexOf('assign'));

        postMessageSpy.mockRestore();
      });

      it('logout clears the worker even when openUrl is a no-op (issue reproducer)', async () => {
        // This is the exact scenario from issue #1596:
        // logout({ openUrl: false }) must leave the worker unable to mint tokens.
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);

        // loginWithRedirect calls window.location.assign for the authorize URL.
        // Reset so we can assert logout does NOT call it when openUrl: false.
        (window.location.assign as jest.Mock).mockClear();

        await auth0.logout({ openUrl: false });

        // The /v2/logout redirect was skipped via openUrl: false
        expect(window.location.assign).not.toHaveBeenCalled();

        mockFetch.mockReset();

        await expect(auth0.getTokenSilently()).rejects.toThrow(
          MissingRefreshTokenError
        );
      });

      it('logout clears the worker when openUrl is provided as an async no-op fn', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        await auth0.logout({ openUrl: async () => {} });

        mockFetch.mockReset();

        await expect(auth0.getTokenSilently()).rejects.toThrow(
          MissingRefreshTokenError
        );
      });

      it('logout clears the worker when onRedirect is provided as a no-op', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        await auth0.logout({ onRedirect: async () => {} });

        mockFetch.mockReset();

        await expect(auth0.getTokenSilently()).rejects.toThrow(
          MissingRefreshTokenError
        );
      });

      it('logout({ clientId }) with a different clientId still clears the worker', async () => {
        // The worker is scoped to this Auth0Client instance, so the worker-clear
        // runs even when the caller passes a custom clientId (existing
        // cache-clear behavior for custom clientId is preserved).
        const postMessageSpy = jest.spyOn(
          TokenWorker.prototype as any,
          'postMessage'
        );

        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        postMessageSpy.mockClear();

        await auth0.logout({ clientId: 'some-other-client', openUrl: false });

        // Worker was cleared
        const clearCalls = postMessageSpy.mock.calls.filter(
          ([msg]) => msg && (msg as any).type === 'clear'
        );
        expect(clearCalls.length).toBeGreaterThanOrEqual(1);

        postMessageSpy.mockRestore();
      });

      it('a fresh login after logout re-arms the worker (no client re-instantiation)', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          cacheLocation: 'memory'
        });

        await loginWithRedirect(auth0);
        await auth0.logout({ openUrl: false });

        // Re-login on the same Auth0Client instance — the worker should still
        // be alive (not terminated) and re-seed the RT.
        await loginWithRedirect(auth0);

        // And token refresh should succeed
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );
        const token = await auth0.getTokenSilently({ cacheMode: 'off' });
        expect(token).toBe(TEST_ACCESS_TOKEN);
      });
    });
  });
});
