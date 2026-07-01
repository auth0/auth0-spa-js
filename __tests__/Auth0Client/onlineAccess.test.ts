import { expect } from '@jest/globals';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as DpopModule from '../../src/dpop/dpop';
import { verify } from '../../src/jwt';

import {
  getTokenSilentlyFn,
  loginWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_CODE_CHALLENGE,
  TEST_REFRESH_TOKEN,
  TEST_ACCESS_TOKEN,
  TEST_ID_TOKEN
} from '../constants';
import { DEFAULT_AUDIENCE } from '../../src/constants';
import { InvalidConfigurationError, MfaRequiredError } from '../../src/errors';
import { fetchResponse } from './helpers';

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
const getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);

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
    jest.spyOn(DpopModule, 'Dpop').mockImplementation(
      () =>
        ({
          calculateThumbprint: jest.fn().mockResolvedValue('test-thumbprint'),
          generateProof: jest.fn().mockResolvedValue('test-dpop-proof'),
          getNonce: jest.fn().mockResolvedValue(undefined),
          setNonce: jest.fn().mockResolvedValue(undefined),
          clear: jest.fn().mockResolvedValue(undefined)
        } as any)
    );
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('online access — configuration validation', () => {
    it('throws InvalidConfigurationError when online but useRefreshTokens is unset', () => {
      expect(() =>
        setup({ refreshTokenMode: 'online', useDpop: true } as any)
      ).toThrow(InvalidConfigurationError);
    });

    it('error message tells the customer to pass useRefreshTokens: true', () => {
      expect(() =>
        setup({ refreshTokenMode: 'online', useDpop: true } as any)
      ).toThrow(/useRefreshTokens: true/);
    });

    it('throws InvalidConfigurationError when online but useDpop is unset', () => {
      expect(() =>
        setup({ refreshTokenMode: 'online', useRefreshTokens: true } as any)
      ).toThrow(InvalidConfigurationError);
    });

    it('throws InvalidConfigurationError when online but useDpop is false', () => {
      expect(() =>
        setup({
          refreshTokenMode: 'online',
          useRefreshTokens: true,
          useDpop: false
        } as any)
      ).toThrow(InvalidConfigurationError);
    });

    it('error message tells the customer to pass useDpop: true', () => {
      expect(() =>
        setup({ refreshTokenMode: 'online', useRefreshTokens: true } as any)
      ).toThrow(/useDpop: true/);
    });

    it('does not throw when online with useRefreshTokens: true and useDpop: true', () => {
      expect(() =>
        setup({
          refreshTokenMode: 'online',
          useRefreshTokens: true,
          useDpop: true
        } as any)
      ).not.toThrow();
    });

    it('leaves behavior unchanged when refreshTokenMode is unset (no DPoP required)', () => {
      expect(() => setup()).not.toThrow();
    });

    it('leaves behavior unchanged when refreshTokenMode is offline (no DPoP required)', () => {
      expect(() => setup({ refreshTokenMode: 'offline' } as any)).not.toThrow();
    });
  });

  describe('online access — scope injection', () => {
    it('injects online_access (and not offline_access) when online', () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        authorizationParams: {
          scope: 'profile email test-scope'
        }
      } as any);

      expect((<any>auth0).scope).toMatchObject({
        [DEFAULT_AUDIENCE]: 'openid profile email test-scope online_access'
      });
      expect((<any>auth0).scope[DEFAULT_AUDIENCE]).not.toContain(
        'offline_access'
      );
    });

    it('injects offline_access (and not online_access) when using refresh tokens', () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'profile email test-scope'
        }
      });

      expect((<any>auth0).scope).toMatchObject({
        [DEFAULT_AUDIENCE]: 'openid profile email test-scope offline_access'
      });
      expect((<any>auth0).scope[DEFAULT_AUDIENCE]).not.toContain(
        'online_access'
      );
    });
  });

  describe('online access — refresh-token routing', () => {
    it('routes silent renewal through the refresh_token grant when online', async () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        cacheLocation: 'localstorage'
      } as any);

      const refreshSpy = jest.spyOn(
        auth0 as any,
        '_getTokenUsingRefreshToken'
      );
      const iframeSpy = jest.spyOn(auth0 as any, '_getTokenFromIFrame');

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      await getTokenSilently(auth0, { cacheMode: 'off' });

      expect(refreshSpy).toHaveBeenCalled();
      expect(iframeSpy).not.toHaveBeenCalled();
    });
  });

  describe('online access — non-rotation', () => {
    it('does NOT rotate the stored refresh token when online', async () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        cacheLocation: 'localstorage'
      } as any);

      const updateEntrySpy = jest.spyOn(
        auth0['cacheManager'],
        'updateEntry'
      );

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      await getTokenSilently(
        auth0,
        { cacheMode: 'off' },
        {
          token: {
            response: { refresh_token: 'new_refresh_token' }
          }
        }
      );

      expect(updateEntrySpy).not.toHaveBeenCalled();
    });

    it('preserves the cached ORT across force-refreshes when the response carries no refresh_token', async () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        cacheLocation: 'localstorage'
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Online refresh tokens are non-rotating: the server exchanges the ORT but
      // returns no refresh_token. The cached ORT must survive so the next
      // force-refresh does not fail with MissingRefreshTokenError.
      await getTokenSilently(
        auth0,
        { cacheMode: 'off' },
        { token: { response: { refresh_token: undefined } } }
      );

      await expect(
        getTokenSilently(
          auth0,
          { cacheMode: 'off' },
          { token: { response: { refresh_token: undefined } } }
        )
      ).resolves.toBeTruthy();
    });

    it('preserves the cached ORT across force-refreshes in the worker (memory) path', async () => {
      // Online mode + the default memory cache routes refreshes through the web
      // worker, which holds its own RT store. The worker must not evict the
      // non-rotating ORT when the response carries no refresh_token, otherwise the
      // next force-refresh fails with MissingRefreshTokenError.
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true
        // no cacheLocation → memory → web worker
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      await getTokenSilently(
        auth0,
        { cacheMode: 'off' },
        { token: { response: { refresh_token: undefined } } }
      );

      await expect(
        getTokenSilently(
          auth0,
          { cacheMode: 'off' },
          { token: { response: { refresh_token: undefined } } }
        )
      ).resolves.toBeTruthy();
    });

    it('rotates the stored refresh token when using rotating (offline) refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      const updateEntrySpy = jest.spyOn(
        auth0['cacheManager'],
        'updateEntry'
      );

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      await getTokenSilently(
        auth0,
        { cacheMode: 'off' },
        {
          token: {
            response: { refresh_token: 'new_refresh_token' }
          }
        }
      );

      expect(updateEntrySpy).toHaveBeenCalledWith(
        TEST_REFRESH_TOKEN,
        'new_refresh_token'
      );
    });
  });

  describe('online access — MRRT cross-audience scope check', () => {
    // A cross-audience MRRT refresh injects online_access into the request, but the server
    // strips it during the exchange and never echoes it back. The missing-scope guard must
    // ignore it, otherwise a successful refresh throws a spurious MissingScopesError.
    it('does not flag injected online_access as missing after an MRRT refresh', async () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        useMrrt: true,
        cacheLocation: 'localstorage'
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      const result = await getTokenSilently(
        auth0,
        {
          authorizationParams: {
            audience: 'https://resource-server/',
            scope: 'read:foo'
          },
          cacheMode: 'off',
          detailedResponse: true
        },
        {
          // Server echoes resource scopes but never online_access.
          token: { response: { scope: 'openid profile email read:foo' } }
        }
      );

      expect((result as any).access_token).toBeTruthy();
    });

    // The guard must still fire for genuinely missing resource scopes.
    it('still throws MissingScopesError when a real resource scope is not returned', async () => {
      const auth0 = setup({
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true,
        useMrrt: true,
        cacheLocation: 'localstorage'
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      await expect(
        getTokenSilently(
          auth0,
          {
            authorizationParams: {
              audience: 'https://resource-server/',
              scope: 'read:foo write:foo'
            },
            cacheMode: 'off',
            detailedResponse: true
          },
          {
            token: { response: { scope: 'openid profile email read:foo' } }
          }
        )
      ).rejects.toThrow(/write:foo/);
    });
  });

  describe('online access — revokeRefreshToken clears local session', () => {
    const onlineConfig = {
      refreshTokenMode: 'online' as const,
      useRefreshTokens: true,
      useDpop: true,
      cacheLocation: 'localstorage' as const
    };

    const mockSuccessfulRevoke = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      });
    };

    it('clears the entire local cache after successful revocation', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockSuccessfulRevoke();

      const clearSpy = jest.spyOn((auth0 as any).cacheManager, 'clear');

      await auth0.revokeRefreshToken();

      expect(clearSpy).toHaveBeenCalled();
    });

    it('isAuthenticated() returns false immediately after revokeRefreshToken', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockSuccessfulRevoke();

      expect(await auth0.isAuthenticated()).toBe(true);

      await auth0.revokeRefreshToken();

      expect(await auth0.isAuthenticated()).toBe(false);
    });

    it('getUser() returns undefined immediately after revokeRefreshToken', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockSuccessfulRevoke();

      expect(await auth0.getUser()).toBeDefined();

      await auth0.revokeRefreshToken();

      expect(await auth0.getUser()).toBeUndefined();
    });

    it('does NOT clear the local cache if the revoke request fails', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({ error_description: 'The token has been revoked' })
          )
      });

      const clearSpy = jest.spyOn((auth0 as any).cacheManager, 'clear');

      await expect(auth0.revokeRefreshToken()).rejects.toThrow();

      expect(clearSpy).not.toHaveBeenCalled();
      // User should still appear authenticated since server revoke failed
      expect(await auth0.isAuthenticated()).toBe(true);
    });

    it('does NOT clear the local cache after revokeRefreshToken in offline mode', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage' as const
      });
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockSuccessfulRevoke();

      const clearSpy = jest.spyOn((auth0 as any).cacheManager, 'clear');

      await auth0.revokeRefreshToken();

      expect(clearSpy).not.toHaveBeenCalled();
      // Access token and user profile remain after offline revocation
      expect(await auth0.isAuthenticated()).toBe(true);
      expect(await auth0.getUser()).toBeDefined();
    });
  });

  describe('online access — MFA grant carries ORT forward when server returns none', () => {
    // Parity with refresh_token grant: the server does not echo the ORT back in the MFA
    // verify response. The SDK must read the ORT from the cache and re-save it so subsequent
    // getTokenSilently calls can still use it.

    const onlineConfig = {
      refreshTokenMode: 'online' as const,
      useRefreshTokens: true,
      useDpop: true,
      cacheLocation: 'localstorage' as const
    };

    const getCacheEntries = () =>
      Object.keys(localStorage)
        .filter(k => k.startsWith('@@auth0spajs@@'))
        .map(k => JSON.parse(localStorage.getItem(k)));

    const mockMfaRequired = () => {
      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'mfa_required',
          error_description: 'MFA required',
          mfa_token: 'test-mfa-token'
        })
      );
    };

    const mockMfaVerifyResponse = (overrides: Record<string, unknown> = {}) => {
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: 'openid profile email online_access',
          // no refresh_token by default — non-rotating ORT behaviour
          ...overrides
        })
      );
    };

    it('carries the cached ORT forward when server returns no refresh_token on mfa-otp grant', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockMfaRequired();
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      mockMfaVerifyResponse(); // no refresh_token in response

      await auth0.mfa.verify({ mfaToken: 'test-mfa-token', otp: '123456' });

      const rt = getCacheEntries().map(e => e?.body?.refresh_token).find(Boolean);
      expect(rt).toBe(TEST_REFRESH_TOKEN);
    });

    it('carries the cached ORT forward on mfa-oob grant', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockMfaRequired();
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      mockMfaVerifyResponse();

      await auth0.mfa.verify({ mfaToken: 'test-mfa-token', oobCode: 'oob-code', bindingCode: '123456' });

      const rt = getCacheEntries().map(e => e?.body?.refresh_token).find(Boolean);
      expect(rt).toBe(TEST_REFRESH_TOKEN);
    });

    it('carries the cached ORT forward on mfa-recovery-code grant', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockMfaRequired();
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      mockMfaVerifyResponse();

      await auth0.mfa.verify({ mfaToken: 'test-mfa-token', recoveryCode: 'XXXX-XXXX' });

      const rt = getCacheEntries().map(e => e?.body?.refresh_token).find(Boolean);
      expect(rt).toBe(TEST_REFRESH_TOKEN);
    });

    it('uses the server-returned ORT when the server does issue one on the MFA grant', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockMfaRequired();
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      const NEW_ORT = 'fresh-ort-from-mfa-verify';
      mockMfaVerifyResponse({ refresh_token: NEW_ORT });

      await auth0.mfa.verify({ mfaToken: 'test-mfa-token', otp: '123456' });

      const rt = getCacheEntries().map(e => e?.body?.refresh_token).find(Boolean);
      expect(rt).toBe(NEW_ORT);
    });

    it('does NOT carry the ORT forward on MFA grants in offline mode', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage' as const
      });
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // In offline mode getTokenSilently uses the refresh_token grant, which also throws
      // mfa_required. Simulate that to populate the MFA context.
      mockMfaRequired();
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      // Offline MFA verify: server returns no refresh_token
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: 'openid profile email offline_access'
          // no refresh_token
        })
      );

      await auth0.mfa.verify({ mfaToken: 'test-mfa-token', otp: '123456' });

      // The original rotating RT must NOT be carried forward — it's single-use
      const mfaEntry = getCacheEntries()
        .find(e => e?.body?.access_token === TEST_ACCESS_TOKEN);
      expect(mfaEntry?.body?.refresh_token).toBeUndefined();
    });
  });

  describe('online access — MFA grant scope carries online_access (ORT vs offline RT)', () => {
    // When mfa.verify() is called after a getTokenSilently mfa_required, the scope stored in
    // MFA context came from the failing refresh request — which includes online_access.
    // The MFA grant must therefore request online_access, and the result is keyed under it.

    const onlineConfig = {
      refreshTokenMode: 'online' as const,
      useRefreshTokens: true,
      useDpop: true,
      cacheLocation: 'localstorage' as const
    };

    it('passes online_access scope to the MFA grant (scope captured from failing refresh)', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'mfa_required',
          error_description: 'MFA required',
          mfa_token: 'test-mfa-scope-check'
        })
      );
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      const requestMfaSpy = jest.spyOn(auth0 as any, '_requestTokenForMfa');

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: 'openid profile email online_access',
          refresh_token: 'ort-after-mfa'
        })
      );

      await auth0.mfa.verify({ mfaToken: 'test-mfa-scope-check', otp: '123456' });

      const calledScope: string = (requestMfaSpy.mock.calls[0][0] as any).scope;
      expect(calledScope).toContain('online_access');
      expect(calledScope).not.toContain('offline_access');
    });

    it('result cache entry is keyed under online_access (not offline_access)', async () => {
      const auth0 = setup(onlineConfig as any);
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'mfa_required',
          error_description: 'MFA required',
          mfa_token: 'test-mfa-cache-key'
        })
      );
      try { await auth0.getTokenSilently({ cacheMode: 'off' }); } catch (_) {}

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: 'Bearer',
          expires_in: 86400,
          scope: 'openid profile email online_access',
          refresh_token: 'ort-after-mfa'
        })
      );

      await auth0.mfa.verify({ mfaToken: 'test-mfa-cache-key', otp: '123456' });

      const keys = Object.keys(localStorage).filter(k => k.startsWith('@@auth0spajs@@'));
      expect(keys.find(k => k.includes('online_access'))).toBeDefined();
      expect(keys.find(k => k.includes('offline_access'))).toBeUndefined();
    });
  });
});
