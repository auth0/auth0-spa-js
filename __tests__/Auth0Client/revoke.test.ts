import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as workerUtils from '../../src/worker/worker.utils';
import { expect } from '@jest/globals';

import { fetchResponse, loginWithRedirectFn, setupFn } from './helpers';
import {
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
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

    it('strips already revoked tokens from cache when a later revoke call fails', async () => {
      const auth0 = setup(defaultConfig);

      jest
        .spyOn((auth0 as any).cacheManager, 'getRefreshTokensByAudience')
        .mockResolvedValue(['rt_one', 'rt_two']);

      const stripRefreshTokenSpy = jest.spyOn(
        (auth0 as any).cacheManager,
        'stripRefreshToken'
      );

      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () =>
            Promise.resolve(
              JSON.stringify({ error_description: 'The token has been revoked' })
            )
        });

      await expect(auth0.revokeRefreshToken()).rejects.toThrow('The token has been revoked');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(stripRefreshTokenSpy).toHaveBeenCalledTimes(1);
      expect(stripRefreshTokenSpy).toHaveBeenCalledWith('rt_one');
    });

    describe('across multiple audiences', () => {
      const seed = (auth0, audience: string, refresh_token: string) =>
        (auth0 as any).cacheManager.set({
          client_id: TEST_CLIENT_ID,
          audience,
          scope: 'openid offline_access',
          access_token: 'at',
          id_token: 'id',
          expires_in: 86400,
          refresh_token,
          decodedToken: { claims: { __raw: 'id' }, user: {} }
        });

      const revokedTokens = () =>
        mockFetch.mock.calls
          .filter(([url]) => url.endsWith('/oauth/revoke'))
          .map(([, opts]) => new URLSearchParams(opts.body).get('token'));

      const revokeOk = { ok: true, text: () => Promise.resolve('') };

      // Earlier tests leave entries in localStorage; start each test from an empty cache.
      beforeEach(() => localStorage.clear());

      it('without useMrrt, only revokes the requested audience', async () => {
        const auth0 = setup(defaultConfig);
        await seed(auth0, 'https://api-a.example.com', 'rt_a');
        await seed(auth0, 'https://api-b.example.com', 'rt_b');
        mockFetch.mockResolvedValueOnce(revokeOk);

        await auth0.revokeRefreshToken({ audience: 'https://api-a.example.com' });

        expect(revokedTokens()).toEqual(['rt_a']);
        expect(
          await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
        ).toEqual(['rt_b']);
      });

      it.each([
        ['one of the cached audiences', 'https://api-a.example.com'],
        ['an audience with no cached token', 'https://no-such-api.example.com']
      ])('with useMrrt, revokes every refresh token in the cache when revoking %s', async (_, audience) => {
        const auth0 = setup({ ...defaultConfig, useMrrt: true });
        await seed(auth0, 'https://api-a.example.com', 'rt_a');
        await seed(auth0, 'https://api-b.example.com', 'rt_b');
        mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);

        await auth0.revokeRefreshToken({ audience });

        expect(revokedTokens().sort()).toEqual(['rt_a', 'rt_b']);
        expect(
          await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
        ).toEqual([]);
      });

      it('with useMrrt, resolves without calling /oauth/revoke when no refresh token is cached', async () => {
        const auth0 = setup({ ...defaultConfig, useMrrt: true });

        await auth0.revokeRefreshToken({ audience: 'https://api-a.example.com' });

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('with useMrrt, getTokenSilently cannot fall back to another audience\'s refresh token after revocation', async () => {
        const auth0 = setup({ ...defaultConfig, useMrrt: true });
        await seed(auth0, 'https://api-a.example.com', 'rt_a');
        await seed(auth0, 'https://api-b.example.com', 'rt_b');
        mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);

        await auth0.revokeRefreshToken({ audience: 'https://api-a.example.com' });
        mockFetch.mockReset();

        await expect(
          auth0.getTokenSilently({
            cacheMode: 'off',
            authorizationParams: { audience: 'https://api-c.example.com' }
          })
        ).rejects.toMatchObject({ error: 'missing_refresh_token' });

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('passes useMrrt to the worker so it revokes its whole store', async () => {
        const sendMessageSpy = jest
          .spyOn(workerUtils, 'sendMessage')
          .mockResolvedValue(undefined);

        const auth0 = setup({ useRefreshTokens: true, useMrrt: true });

        await auth0.revokeRefreshToken({ audience: 'https://api-a.example.com' });

        expect(sendMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'revoke', useMrrt: true }),
          expect.anything()
        );
      });

      // Helpers for the end-to-end tests below: real logins and refreshes, with
      // only the network mocked.
      const AUDIENCE_A = 'https://api-a.example.com';
      const AUDIENCE_B = 'https://api-b.example.com';

      const formParam = (opts, name: string) =>
        new URLSearchParams(opts.body).get(name);

      const refreshTokensSent = () =>
        mockFetch.mock.calls
          .filter(
            ([url, opts]) =>
              url.endsWith('/oauth/token') &&
              formParam(opts, 'grant_type') === 'refresh_token'
          )
          .map(([, opts]) => formParam(opts, 'refresh_token'));

      const refreshResponse = (access_token: string) =>
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token,
          refresh_token: `${access_token}_rt`,
          expires_in: 86400
        });

      // A fetch response the test releases by hand.
      const heldResponse = () => {
        let release!: (response: unknown) => void;
        const promise = new Promise(resolve => (release = resolve));
        return { promise, release };
      };

      const sleep = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

      // Polls in real time: getTokenSilently first takes a browser-tabs-lock,
      // which waits on timers.
      const waitFor = async (condition: () => boolean) => {
        for (let i = 0; i < 200 && !condition(); i++) {
          await sleep(10);
        }
        expect(condition()).toBe(true);
      };

      const waitForFetchCalls = async (count: number) => {
        await waitFor(() => mockFetch.mock.calls.length >= count);
        expect(mockFetch).toHaveBeenCalledTimes(count);
      };

      const getTokenFor = (auth0, audience: string) =>
        auth0.getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience }
        });

      // Two interactive logins: the SDK holds rtA for A and rtB for B (plus, in
      // the worker with useMrrt, latest_refresh_token = rtB). Values are unique
      // per test because the worker module, including its record of revoked
      // tokens, is shared by every test in this file.
      let logins = 0;
      const loginToTwoAudiences = async (
        config: { useMrrt?: boolean; cacheLocation?: 'localstorage' } = {}
      ) => {
        const auth0 = setup({ useRefreshTokens: true, ...config });
        // The worker's token store is module-level; start every test empty.
        (auth0 as any).worker?.postMessage({ type: 'clear' });

        const rtA = `rt_a_${++logins}`;
        const rtB = `rt_b_${logins}`;

        await loginWithRedirect(
          auth0,
          { authorizationParams: { audience: AUDIENCE_A } },
          { token: { response: { refresh_token: rtA } } }
        );
        await loginWithRedirect(
          auth0,
          { authorizationParams: { audience: AUDIENCE_B } },
          { token: { response: { refresh_token: rtB } } }
        );

        mockFetch.mockClear();
        return { auth0, rtA, rtB };
      };

      // End to end through the real worker (the jest mock routes postMessage
      // into token.worker's messageRouter).
      describe('with the token worker', () => {
        beforeEach(() => {
          // Earlier tests stub sendMessage without restoring it.
          (workerUtils.sendMessage as jest.Mock).mockRestore?.();
        });

        it('with useMrrt, revoking one audience revokes every RT so the MRRT fallback cannot refresh it', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences({ useMrrt: true });
          mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);

          await auth0.revokeRefreshToken({ audience: AUDIENCE_A });

          expect(revokedTokens().sort()).toEqual([rtA, rtB].sort());

          // The server would accept rt_b for audience A, so answer a refresh if one is sent.
          mockFetch.mockResolvedValueOnce(refreshResponse('at_minted'));

          await expect(getTokenFor(auth0, AUDIENCE_A)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          await expect(getTokenFor(auth0, AUDIENCE_B)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          expect(refreshTokensSent()).toEqual([]);
        });

        it('with useMrrt, revoking an audience with no stored token still revokes every RT', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences({ useMrrt: true });
          mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);

          await auth0.revokeRefreshToken({ audience: 'https://no-such-api.example.com' });

          expect(revokedTokens().sort()).toEqual([rtA, rtB].sort());

          // Nothing is left, so a repeat call resolves without contacting /oauth/revoke.
          await auth0.revokeRefreshToken({ audience: AUDIENCE_A });

          expect(revokedTokens()).toHaveLength(2);
        });

        it('without useMrrt, only the requested audience loses its RT', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences();

          // No RT for this audience: resolves without contacting /oauth/revoke.
          await auth0.revokeRefreshToken({ audience: 'https://no-such-api.example.com' });
          expect(revokedTokens()).toEqual([]);

          mockFetch.mockResolvedValueOnce(revokeOk);
          await auth0.revokeRefreshToken({ audience: AUDIENCE_A });
          expect(revokedTokens()).toEqual([rtA]);

          await expect(getTokenFor(auth0, AUDIENCE_A)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });

          mockFetch.mockResolvedValueOnce(refreshResponse('at_b2'));
          await expect(getTokenFor(auth0, AUDIENCE_B)).resolves.toBe('at_b2');
          expect(refreshTokensSent()).toEqual([rtB]);
        });

        it('with useMrrt, a refresh in flight when revocation starts leaves no token in the worker', async () => {
          const { auth0, rtA } = await loginToTwoAudiences({ useMrrt: true });

          const refresh = heldResponse();
          mockFetch.mockReturnValueOnce(refresh.promise);
          const refreshing = getTokenFor(auth0, AUDIENCE_A);
          await waitForFetchCalls(1);

          mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);
          await auth0.revokeRefreshToken();

          // Auth0 answered the refresh before it processed the revocation.
          refresh.release(await refreshResponse('at_raced'));
          await expect(refreshing).resolves.toBe('at_raced');

          await expect(getTokenFor(auth0, AUDIENCE_A)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          await expect(getTokenFor(auth0, AUDIENCE_B)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          expect(refreshTokensSent()).toEqual([rtA]);
        });
      });

      describe('on the main thread (localStorage)', () => {
        it('with useMrrt, a refresh in flight when revocation starts cannot store its rotated token', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences({
            ...defaultConfig,
            useMrrt: true
          });

          const refresh = heldResponse();
          mockFetch.mockReturnValueOnce(refresh.promise);
          const refreshing = getTokenFor(auth0, AUDIENCE_A);
          await waitForFetchCalls(1);

          mockFetch.mockResolvedValueOnce(revokeOk).mockResolvedValueOnce(revokeOk);
          await auth0.revokeRefreshToken();
          expect(revokedTokens().sort()).toEqual([rtA, rtB].sort());

          // Auth0 answered the refresh before it processed the revocation.
          refresh.release(await refreshResponse('at_raced'));
          await expect(refreshing).resolves.toBe('at_raced');

          expect(
            await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
          ).toEqual([]);
          await expect(getTokenFor(auth0, AUDIENCE_A)).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          expect(refreshTokensSent()).toEqual([rtA]);
        });

        it('with useMrrt, a refresh response that arrives during a revocation is stored after it, without the rotated token', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences({
            ...defaultConfig,
            useMrrt: true
          });

          const refresh = heldResponse();
          mockFetch.mockReturnValueOnce(refresh.promise);
          const refreshing = getTokenFor(auth0, AUDIENCE_A);
          await waitForFetchCalls(1);

          const firstRevoke = heldResponse();
          mockFetch.mockReturnValueOnce(firstRevoke.promise).mockResolvedValueOnce(revokeOk);
          const revoking = auth0.revokeRefreshToken();
          await waitForFetchCalls(2);

          // The refresh response arrives while the first revoke request is pending.
          refresh.release(await refreshResponse('at_raced'));
          await sleep(20);
          firstRevoke.release(revokeOk);
          await revoking;

          await expect(refreshing).resolves.toBe('at_raced');
          expect(revokedTokens().sort()).toEqual([rtA, rtB].sort());
          expect(
            await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
          ).toEqual([]);
        });

        it('with useMrrt, a refresh started during a revocation waits for it and sends no revoked token', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences({
            ...defaultConfig,
            useMrrt: true
          });

          const firstRevoke = heldResponse();
          mockFetch.mockReturnValueOnce(firstRevoke.promise).mockResolvedValueOnce(revokeOk);
          const revoking = auth0.revokeRefreshToken();
          await waitForFetchCalls(1);

          const refreshStarted = jest.spyOn(auth0 as any, '_getTokenUsingRefreshToken');
          const refreshing = getTokenFor(auth0, AUDIENCE_A);
          await waitFor(() => refreshStarted.mock.calls.length === 1);
          await sleep(20);

          // The refresh is past the lock but waiting for the revocation.
          expect(refreshTokensSent()).toEqual([]);

          firstRevoke.release(revokeOk);
          await revoking;

          await expect(refreshing).rejects.toMatchObject({
            error: 'missing_refresh_token'
          });
          expect(revokedTokens().sort()).toEqual([rtA, rtB].sort());
          expect(refreshTokensSent()).toEqual([]);
        });

        it('without useMrrt, keeps the rotation of a refresh in flight for another audience', async () => {
          const { auth0, rtA } = await loginToTwoAudiences(defaultConfig);

          const refreshB = heldResponse();
          mockFetch.mockReturnValueOnce(refreshB.promise);
          const refreshingB = getTokenFor(auth0, AUDIENCE_B);
          await waitForFetchCalls(1);

          mockFetch.mockResolvedValueOnce(revokeOk);
          await auth0.revokeRefreshToken({ audience: AUDIENCE_A });
          expect(revokedTokens()).toEqual([rtA]);

          refreshB.release(await refreshResponse('at_b2'));
          await expect(refreshingB).resolves.toBe('at_b2');

          expect(
            await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
          ).toEqual(['at_b2_rt']);
        });

        it('runs revocations one at a time', async () => {
          const { auth0, rtA, rtB } = await loginToTwoAudiences(defaultConfig);

          const firstRevoke = heldResponse();
          mockFetch.mockReturnValueOnce(firstRevoke.promise).mockResolvedValueOnce(revokeOk);

          const revokingA = auth0.revokeRefreshToken({ audience: AUDIENCE_A });
          const revokingB = auth0.revokeRefreshToken({ audience: AUDIENCE_B });
          await waitForFetchCalls(1);
          await sleep(20);

          // B's revocation waits for A's to finish.
          expect(revokedTokens()).toEqual([rtA]);

          firstRevoke.release(revokeOk);
          await revokingA;
          await revokingB;

          expect(revokedTokens()).toEqual([rtA, rtB]);
        });

        it('does not copy a rotated token into other entries once either token was revoked', async () => {
          // Stands for a revocation that ran between a refresh saving its entry
          // and copying the rotated token into the other MRRT entries.
          const auth0 = setup({ ...defaultConfig, useMrrt: true });
          await seed(auth0, AUDIENCE_B, 'rt_old');
          (auth0 as any).revokedRefreshTokens.add('rt_old');

          await (auth0 as any)._propagateRotatedRefreshToken('rt_old', 'rt_new');

          expect(
            await (auth0 as any).cacheManager.getAllRefreshTokens(TEST_CLIENT_ID)
          ).toEqual(['rt_old']);
        });
      });
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
