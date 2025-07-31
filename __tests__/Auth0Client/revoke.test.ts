import * as api from '../../src/api';
import { MessageChannel } from 'worker_threads';
import { expect } from '@jest/globals';
import { verify } from '../../src/jwt';

import { setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_FETCH_TIMEOUT_MS
} from '../constants';

import { DEFAULT_AUTH0_CLIENT } from '../../src/constants';
import { CacheEntry, CacheKey } from '../../src/cache';

// Mock api.ts
jest.mock('../../src/api');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockVerify = <jest.Mock>verify;
const mockApi = api as jest.Mocked<typeof api>;
const mockRevokeToken = mockApi.revokeToken;

describe('Auth0Client.revoke', () => {
  const localSetup = setupFn(mockVerify);

  beforeAll(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockRevokeToken.mockResolvedValue();
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
  });

  afterEach(() => {});

  describe('with useRefreshTokens: true', () => {
    const cacheEntry: CacheEntry = {
      access_token: TEST_ACCESS_TOKEN,
      refresh_token: TEST_REFRESH_TOKEN,
      expires_in: 3600,
      audience: 'default',
      scope: `${TEST_SCOPES} offline_access`,
      client_id: TEST_CLIENT_ID,
      id_token: TEST_ID_TOKEN
    };

    it('should call revoke API and update cache when a refresh token is available', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      // Set cache entry
      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      // 1. Check if revokeToken was called with correct arguments
      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
      expect(mockRevokeToken).toHaveBeenCalledTimes(1);

      // 2. Check if cache was updated and refresh_token was removed
      const cacheKey = new CacheKey({
        scope: `${TEST_SCOPES} offline_access`,
        audience: 'default',
        clientId: TEST_CLIENT_ID
      });
      const updatedCache = await (auth0 as any).cacheManager.get(cacheKey);

      expect(updatedCache).toEqual({
        ...cacheEntry,
        refresh_token: undefined
      });
    });

    it('should use custom authorization params to find the cache key', async () => {
      const customAudience = 'custom_audience';
      const customScope = 'custom_scope';
      const combinedScope = `openid profile email offline_access ${customScope}`;

      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const customCacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: customAudience,
        scope: combinedScope,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      // Set custom cache entry
      await (auth0 as any).cacheManager.set(customCacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: customAudience,
          scope: customScope
        }
      });

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    it('should handle options with useFormData', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true,
        useFormData: true
      });

      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    it('should handle custom timeout', async () => {
      const customTimeout = 30;
      const auth0 = localSetup({
        useRefreshTokens: true,
        httpTimeoutInSeconds: customTimeout
      });

      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: customTimeout * 1000,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    // --- Tests for early return due to preconditions ---
    it('should do nothing if no refresh token is found in cache', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const cacheWithoutRefreshToken: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: undefined,
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(cacheWithoutRefreshToken);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).not.toHaveBeenCalled();
    });

    it('should do nothing if cache is empty', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      // Cache remains empty

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).not.toHaveBeenCalled();
    });

    // --- Error case tests ---
    it('should re-throw API errors and not update the cache', async () => {
      const apiError = new Error('API revocation failed');
      mockRevokeToken.mockRejectedValue(apiError);

      const auth0 = localSetup({
        useRefreshTokens: true
      });

      await (auth0 as any).cacheManager.set(cacheEntry);

      await expect(
        auth0.revoke({
          authorizationParams: {
            audience: 'default',
            scope: TEST_SCOPES
          }
        })
      ).rejects.toThrow(apiError);

      expect(mockRevokeToken).toHaveBeenCalledTimes(1);

      // Cache should not be updated since API failed
      const cacheKey = new CacheKey({
        scope: `${TEST_SCOPES} offline_access`,
        audience: 'default',
        clientId: TEST_CLIENT_ID
      });
      const cachedData = await (auth0 as any).cacheManager.get(cacheKey);

      // refresh_token should still exist
      expect(cachedData?.refresh_token).toBe(TEST_REFRESH_TOKEN);
    });

    it('should not update cache if cache entry is incomplete', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      // Incomplete cache entry (missing required fields)
      const incompleteCacheEntry = {
        refresh_token: TEST_REFRESH_TOKEN,
        // access_token is missing
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID
      };

      await (auth0 as any).cacheManager.set(incompleteCacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });

      // For incomplete entries, cache should not be updated
      const cacheKey = new CacheKey({
        scope: `${TEST_SCOPES} offline_access`,
        audience: 'default',
        clientId: TEST_CLIENT_ID
      });
      const cachedData = await (auth0 as any).cacheManager.get(cacheKey);

      expect(cachedData).toEqual(incompleteCacheEntry);
    });
  });

  describe('with useRefreshTokens: false', () => {
    it('should do nothing if useRefreshTokens is false', async () => {
      const auth0 = localSetup({
        useRefreshTokens: false
      });

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(mockRevokeToken).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined authorizationParams', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const cacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke(undefined);

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    it('should handle empty options object', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const cacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke({});

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    it('should merge authorization params correctly', async () => {
      const defaultAudience = 'default_audience';
      const defaultScope = 'read:profile';

      const auth0 = localSetup({
        useRefreshTokens: true,
        authorizationParams: {
          audience: defaultAudience,
          scope: defaultScope
        }
      });

      const overrideScope = 'write:data';
      const finalScope = `openid ${defaultScope} offline_access ${overrideScope}`;

      const cacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: defaultAudience,
        scope: finalScope,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(cacheEntry);

      await auth0.revoke({
        authorizationParams: {
          scope: overrideScope
        }
      });

      expect(mockRevokeToken).toHaveBeenCalledWith({
        baseUrl: `https://${TEST_DOMAIN}`,
        timeout: TEST_FETCH_TIMEOUT_MS,
        useFormData: true,
        clientId: TEST_CLIENT_ID,
        refreshToken: TEST_REFRESH_TOKEN
      });
    });

    it('should verify cache manager get is called with correct cache key for custom params', async () => {
      const customAudience = 'api.example.com';
      const customScope = 'read:users write:users';
      const expectedScope = `openid profile email offline_access ${customScope}`;

      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const spy = jest.spyOn((auth0 as any).cacheManager, 'get');

      const customCacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: customAudience,
        scope: expectedScope,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(customCacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: customAudience,
          scope: customScope
        }
      });

      // Verify cacheManager.get was called with the correct CacheKey
      expect(spy).toHaveBeenCalledWith(
        new CacheKey({
          scope: expectedScope,
          audience: customAudience,
          clientId: TEST_CLIENT_ID
        })
      );

      spy.mockRestore();
    });

    it('should verify cache manager set is not called when cacheManager.get returns undefined', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const getSpy = jest
        .spyOn((auth0 as any).cacheManager, 'get')
        .mockResolvedValue(undefined);
      const setSpy = jest.spyOn((auth0 as any).cacheManager, 'set');

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(getSpy).toHaveBeenCalled();
      expect(mockRevokeToken).not.toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();

      getSpy.mockRestore();
      setSpy.mockRestore();
    });

    it('should verify cache manager set is not called when cacheManager.get returns cache without refresh_token', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const cacheWithoutRefreshToken = {
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
        // refresh_token does not exist
      };

      const getSpy = jest
        .spyOn((auth0 as any).cacheManager, 'get')
        .mockResolvedValue(cacheWithoutRefreshToken);
      const setSpy = jest.spyOn((auth0 as any).cacheManager, 'set');

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      expect(getSpy).toHaveBeenCalled();
      expect(mockRevokeToken).not.toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();

      getSpy.mockRestore();
      setSpy.mockRestore();
    });

    it('should verify no cache access occurs when useRefreshTokens is false', async () => {
      const auth0 = localSetup({
        useRefreshTokens: false
      });

      const getSpy = jest.spyOn((auth0 as any).cacheManager, 'get');
      const setSpy = jest.spyOn((auth0 as any).cacheManager, 'set');

      await auth0.revoke();

      // Verify neither cache get nor set are called
      expect(getSpy).not.toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
      expect(mockRevokeToken).not.toHaveBeenCalled();

      getSpy.mockRestore();
      setSpy.mockRestore();
    });

    it('should preserve all cache properties except refresh_token after successful revocation', async () => {
      const auth0 = localSetup({
        useRefreshTokens: true
      });

      const originalCacheEntry: CacheEntry = {
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      };

      await (auth0 as any).cacheManager.set(originalCacheEntry);

      await auth0.revoke({
        authorizationParams: {
          audience: 'default',
          scope: TEST_SCOPES
        }
      });

      const cacheKey = new CacheKey({
        scope: `${TEST_SCOPES} offline_access`,
        audience: 'default',
        clientId: TEST_CLIENT_ID
      });
      const updatedCache = await (auth0 as any).cacheManager.get(cacheKey);

      // Verify all properties are preserved except refresh_token is set to undefined
      expect(updatedCache).toEqual({
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: undefined, // This should be undefined
        expires_in: 3600,
        audience: 'default',
        scope: `${TEST_SCOPES} offline_access`,
        client_id: TEST_CLIENT_ID,
        id_token: TEST_ID_TOKEN
      });

      // Explicitly verify that other properties are unchanged
      expect(updatedCache?.access_token).toBe(originalCacheEntry.access_token);
      expect(updatedCache?.expires_in).toBe(originalCacheEntry.expires_in);
      expect(updatedCache?.audience).toBe(originalCacheEntry.audience);
      expect(updatedCache?.scope).toBe(originalCacheEntry.scope);
      expect(updatedCache?.client_id).toBe(originalCacheEntry.client_id);
      expect(updatedCache?.id_token).toBe(originalCacheEntry.id_token);
    });
  });
});
