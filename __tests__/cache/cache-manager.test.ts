import {
  CacheManager,
  InMemoryCache,
  LocalStorageCache
} from '../../src/cache';
import { CacheManagerUtils } from '../../src/cache/cache-manager-utils';
import { CacheKeyManifest } from '../../src/cache/key-manifest';

import {
  CacheEntry,
  CacheKey,
  CACHE_KEY_PREFIX,
  DecodedToken,
  ICache
} from '../../src/cache/shared';

import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_SCOPES,
  dayInSeconds,
  nowSeconds,
  TEST_REFRESH_TOKEN
} from '../constants';
import { InMemoryAsyncCacheNoKeys } from './shared';

import { expect } from '@jest/globals';

const defaultKey = new CacheKey({
  clientId: TEST_CLIENT_ID,
  audience: TEST_AUDIENCE,
  scope: TEST_SCOPES
});

const defaultData: CacheEntry = {
  client_id: TEST_CLIENT_ID,
  audience: TEST_AUDIENCE,
  scope: TEST_SCOPES,
  id_token: TEST_ID_TOKEN,
  access_token: TEST_ACCESS_TOKEN,
  expires_in: dayInSeconds,
  decodedToken: {
    claims: {
      __raw: TEST_ID_TOKEN,
      exp: nowSeconds() + dayInSeconds,
      name: 'Test'
    },
    user: { name: 'Test' }
  }
};

const cacheFactories = [
  {
    new: () => {
      // Make sure that cache is actually empty between tests
      window.localStorage.clear();
      return new LocalStorageCache()
    }, name: 'LocalStorageCache'
  },
  {
    new: () => new InMemoryCache().enclosedCache,
    name: 'Cache with allKeys'
  },
  {
    new: () => new InMemoryAsyncCacheNoKeys(),
    name: 'Async cache using key manifest'
  }
];

cacheFactories.forEach(cacheFactory => {
  describe(`CacheManager using ${cacheFactory.name}`, () => {
    let manager: CacheManager;
    let cache: ICache;
    let keyManifest: CacheKeyManifest;

    beforeEach(() => {
      cache = cacheFactory.new();

      keyManifest = !!!cache.allKeys
        ? new CacheKeyManifest(cache, TEST_CLIENT_ID)
        : undefined;

      manager = new CacheManager(cache, keyManifest);

      if (keyManifest) {
        ['get', 'add', 'clear'].forEach((method: any) =>
          jest.spyOn(manager['keyManifest'], method)
        );
      }
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.resetModules();
    });

    it('returns undefined when there is nothing in the cache', async () => {
      const result = await manager.getToken(defaultKey);

      expect(result).toBeFalsy();
    });

    it('sets up the key manifest correctly', () => {
      if (cache.allKeys) {
        expect(manager['keyManifest']).toBeUndefined();
      } else {
        expect(manager['keyManifest']).toBeTruthy();
      }
    });

    it('should return an entry from the cache if any of the scopes match', async () => {
      const data = {
        ...defaultData,
        scope: 'read:messages write:messages'
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages'
      });

      expect(await manager.getToken(key)).toStrictEqual(data);
    });

    it('should return an entry from the cache if no scopes provided', async () => {
      const data = {
        ...defaultData,
        scope: 'read:messages write:messages'
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE
      });

      expect(await manager.getToken(key)).toStrictEqual(data);
    });

    it('should return an entry directly from the cache if the key matches exactly', async () => {
      const data = {
        ...defaultData,
        scope: 'read:messages write:messages'
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages write:messages'
      });

      expect(await manager.getToken(key)).toStrictEqual(data);
    });

    it('should not fetch from the cache if allKeys returns empty array of keys', async () => {
      // Simulate a cache implementation that returns an empty array for 'allKeys'
      // but also has a valid entry in there - this tries to test a custom cache implementation
      // that doesn't return an expected value for `allKeys`, it should just behave
      // as any other entry that returns not found.
      const cache = new InMemoryCache().enclosedCache;
      const getSpy = jest.spyOn(cache, 'get');
      const manager = new CacheManager(cache);

      jest.spyOn(cache, 'allKeys').mockReturnValue([]);
      cache.set(defaultKey.toKey(), defaultData);

      expect(
        await manager.getToken(
          new CacheKey({ clientId: 'test', audience: 'test', scope: 'test' })
        )
      ).not.toBeDefined();

      // Make sure we don't try and get a cache value with a key of `undefined`
      expect(getSpy).not.toHaveBeenCalledWith(undefined);
    });

    if (keyManifest) {
      it('should update the key manifest when the key has only been added to the underlying cache', async () => {
        const manifestKey = `${CACHE_KEY_PREFIX}::${defaultData.client_id}`;

        await manager.set(defaultData);

        // Remove the manifest entry that is created by the manifest
        await cache.remove(manifestKey);

        const result = await manager.getToken(defaultKey);

        expect(result).toStrictEqual(defaultData);
        expect(await cache.get(manifestKey)).toBeTruthy();
      });
    }

    it('should not return an entry if not all of the scopes match', async () => {
      const data = {
        ...defaultData,
        scope: 'read:messages write:messages'
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages read:actions'
      });

      expect(await manager.getToken(key)).toBeFalsy();
    });

    it('returns undefined from the cache when expires_in < expiryAdjustmentSeconds', async () => {
      const data = {
        ...defaultData,
        expires_in: 40
      };

      await manager.set(data);

      expect(
        await manager.getToken(
          new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: TEST_SCOPES
          }),
          {
            expiryAdjustmentSeconds: 60,
          }
        )
      ).toBeFalsy();
    });

    it('returns undefined if the item was not found in the underlying cache', async () => {
      const cacheSpy = jest.spyOn(cache, 'remove');

      await manager.set(defaultData);
      expect(await manager.getToken(defaultKey)).toStrictEqual(defaultData);
      cache.remove(defaultKey.toKey());
      expect(await manager.getToken(defaultKey)).toBeFalsy();
      expect(cacheSpy).toHaveBeenCalledWith(defaultKey.toKey());
    });

    describe('when refresh tokens are used', () => {
      it('strips everything except the refresh token when expiry has been reached', async () => {
        const now = Date.now();
        const realDateNow = Date.now.bind(global.Date);

        const data = {
          ...defaultData,
          refresh_token: TEST_REFRESH_TOKEN,
          decodedToken: {
            claims: {
              __raw: TEST_ID_TOKEN,
              name: 'Test',
              exp: nowSeconds() + dayInSeconds * 2
            },
            user: { name: 'Test' }
          }
        };

        await manager.set(data);

        const cacheKey = CacheKey.fromCacheEntry(data);

        // Test that the cache state is normal up until just before the expiry time..
        expect(await manager.getToken(cacheKey)).toStrictEqual(data);

        // Advance the time to just past the expiry..
        const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
        global.Date.now = dateNowStub;

        expect(await manager.getToken(cacheKey)).toStrictEqual({
          refresh_token: TEST_REFRESH_TOKEN
        });

        global.Date.now = realDateNow;
      });
    });

    it('reads from the cache when expires_in > date.now', async () => {
      const data = {
        ...defaultData,
        expires_in: 70
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      const result = await manager.getToken(
        cacheKey,
        {
          expiryAdjustmentSeconds: 60,
        },
      );

      // And test that the cache has been emptied
      expect(result).toBeTruthy();
    });

    it('reads from the cache when expires_in > date.now using custom now provider', async () => {
      const now = Date.now();
      const data = {
        ...defaultData,
        expires_in: 50
      };
      const expiryAdjustmentSeconds = 60;

      const provider = jest.fn().mockResolvedValue(Date.now());
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Move back in time to ensure the token is valid
      provider.mockResolvedValue(
        now - (expiryAdjustmentSeconds - data.expires_in) * 1000
      );

      const result = await manager.getToken(
        cacheKey,
        { expiryAdjustmentSeconds },
      );

      // And test that the cache has been emptied
      expect(result).toBeTruthy();
    });

    it('expires the cache on read when the date.now > expires_in', async () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2
          },
          user: { name: 'Test' }
        }
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);

      global.Date.now = dateNowStub;

      const result = await manager.getToken(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('expires the cache on read when the date.now > expires_in when using custom now provider with a promise', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2
          },
          user: { name: 'Test' }
        }
      };

      const provider = jest.fn().mockResolvedValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockResolvedValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.getToken(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('expires the cache on read when the date.now > expires_in when using custom now provider', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2
          },
          user: { name: 'Test' }
        }
      };

      const provider = jest.fn().mockReturnValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockReturnValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.getToken(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('expires the cache on read when the date.now > token.exp', async () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expires_in: dayInSeconds * 120
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
      global.Date.now = dateNowStub;

      const result = await manager.getToken(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('expires the cache on read when the date.now > token.exp when using custom now provider with a promise', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expires_in: dayInSeconds * 120
      };

      const provider = jest.fn().mockResolvedValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockResolvedValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.getToken(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('expires the cache on read when the date.now > token.exp when using custom now provider', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expires_in: dayInSeconds * 120
      };

      const provider = jest.fn().mockReturnValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.getToken(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockReturnValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.getToken(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('clears all keys from the cache', async () => {
      const entry1 = { ...defaultData };
      const entry2 = { ...defaultData, scope: 'scope-1' };
      const entry3 = { ...defaultData, client_id: 'some-other-client' };

      await manager.set(entry1);
      await manager.set(entry2);
      await manager.set(entry3);

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry1))).toStrictEqual(
        entry1
      );

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry2))).toStrictEqual(
        entry2
      );

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry3))).toStrictEqual(
        entry3
      );

      await manager.clear();
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry1))).toBeFalsy();
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry2))).toBeFalsy();
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry3))).toBeFalsy();
    });

    it('clears only the keys relating to a specific client ID from the cache', async () => {
      const entry1 = { ...defaultData };
      const entry2 = { ...defaultData, scope: 'scope-1' };
      const entry3 = { ...defaultData, client_id: 'some-other-client' };

      await manager.set(entry1);
      await manager.set(entry2);
      await manager.set(entry3);

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry1))).toStrictEqual(
        entry1
      );

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry2))).toStrictEqual(
        entry2
      );

      expect(await manager.getToken(CacheKey.fromCacheEntry(entry3))).toStrictEqual(
        entry3
      );

      await manager.clear(TEST_CLIENT_ID);
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry1))).toBeFalsy();
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry2))).toBeFalsy();

      // Should not be removed as it has a different client ID from the manager instance
      expect(await manager.getToken(CacheKey.fromCacheEntry(entry3))).toStrictEqual(
        entry3
      );
    });

    describe('getIdToken', () => {
      beforeEach(async () => {
        await manager.clear();
      });

      it('should read from the id token cache if exists', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:messages'
        });

        await manager.setIdToken(
          defaultData.client_id,
          defaultData.id_token as string,
          defaultData.decodedToken as DecodedToken
        );

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID
            },
            CACHE_KEY_PREFIX,
            '@@user@@'
          ).toKey()
        );
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();

        cacheSpy.mockClear();
      });

      it('should read from the access token cache if not found in id token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:messages'
        });

        await manager.set({
          ...defaultData,
          scope: 'read:messages'
        });

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(cacheKey.toKey());
        expect(cache.get).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();

        cacheSpy.mockClear();
      });

      it('should return undefined when nothing found', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:messages'
        });

        const cacheSpy = jest.spyOn(cache, 'get').mockImplementation(key => {
          if (key.indexOf('@@user@@') > -1) {
            return null;
          } else {
            return null;
          }
        });

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID
            },
            CACHE_KEY_PREFIX,
            '@@user@@'
          ).toKey()
        );
        expect(cache.get).toHaveBeenCalledWith(cacheKey.toKey());
        expect(result).toBeUndefined();

        cacheSpy.mockClear();
      });

      it('should return undefined when no id token in access token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:messages'
        });

        await manager.set({
          ...defaultData,
          scope: 'read:messages',
          id_token: undefined
        });

        const result = await manager.getIdToken(cacheKey);

        expect(result).toBeUndefined();
      });

      it('should return undefined when no decoded token in access token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: 'read:messages'
        });

        await manager.set({
          ...defaultData,
          scope: 'read:messages',
          decodedToken: undefined
        });

        const result = await manager.getIdToken(cacheKey);

        expect(result).toBeUndefined();
      });

      it('should return undefined if not found in id token cache and no scope set', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE
        });

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID
            },
            CACHE_KEY_PREFIX,
            '@@user@@'
          ).toKey()
        );
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();

        cacheSpy.mockClear();
      });
      it('should return undefined if not found in id token cache and no audience set', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
          scope: 'read:messages'
        });

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID
            },
            CACHE_KEY_PREFIX,
            '@@user@@'
          ).toKey()
        );
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();

        cacheSpy.mockClear();
      });
    });

    describe('getToken', () => {
      describe('when there is nothing in the cache', () => {
        it('returns undefined', async () => {
          const result = await manager.getToken(defaultKey);

          expect(result).toBeFalsy();
        });
      });

      describe('when some entry match with exact audience, organization and scopes and is active', () => {
        it('returns entry', async () => {
          jest.spyOn(manager, 'getActiveToken');

          const data = {
            ...defaultData,
            scope: TEST_SCOPES,
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: TEST_SCOPES
          });

          const res = await manager.getToken(key);

          expect(res).toStrictEqual(data);
          expect(manager.getActiveToken).toHaveBeenCalledTimes(1);
        });
      });

      describe('when some entry match with exact audience, organization and scopes and is not active', () => {
        it('returns entry', async () => {
          jest.spyOn(manager, 'getActiveToken');
          jest.spyOn(manager, 'getInactiveToken');
          jest.spyOn(manager, 'getRefreshToken');
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(true);

          const data = {
            ...defaultData,
            scope: TEST_SCOPES,
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: TEST_SCOPES
          });

          const res = await manager.getToken(key);

          const expectedResult = { refresh_token: TEST_REFRESH_TOKEN };

          expect(res).toStrictEqual(expectedResult);
          expect(manager.getActiveToken).toHaveBeenCalledTimes(1);
          expect(manager.getInactiveToken).toHaveBeenCalledTimes(1);
          expect(manager.getRefreshToken).toHaveBeenCalledTimes(1);
        });
      });

      describe('when some entry match with exact audience, organization and has compatible scopes', () => {
        it('returns entry', async () => {
          jest.spyOn(manager, 'getActiveToken');
          jest.spyOn(manager, 'getInactiveToken');
          jest.spyOn(manager, 'getSiblingToken');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const res = await manager.getToken(key);

          expect(res).toStrictEqual(data);
          expect(manager.getActiveToken).toHaveBeenCalledTimes(1);
          expect(manager.getInactiveToken).toHaveBeenCalledTimes(1);
        });
      });

      describe('when some entry match with the same organization', () => {
        it('returns entry', async () => {
          jest.spyOn(manager, 'getActiveToken');
          jest.spyOn(manager, 'getInactiveToken');
          jest.spyOn(manager, 'getSiblingToken');
          jest.spyOn(manager, 'getMRRTToken');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: 'New audience',
            // organization: 'organizationA',
            scope: 'read:book',
          });

          const res = await manager.getToken(key);

          expect(res).toMatchObject({
            refresh_token: data.refresh_token,
            audience: key.audience,
            scope: key.scope,
          });
          expect(manager.getActiveToken).toHaveBeenCalledTimes(1);
          expect(manager.getInactiveToken).toHaveBeenCalledTimes(1);
          expect(manager.getSiblingToken).toHaveBeenCalledTimes(1);
          expect(manager.getMRRTToken).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('getRefreshToken', () => {
      describe('when entry does not have refresh_token', () => {
        it('returns undefined and removes entry from memory', async () => {
          jest.spyOn(manager, 'onNoRefreshableToken');

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const entry = {
            body: {
              ...defaultData,
              scope: 'read:user update:user',
              audience: TEST_AUDIENCE,
              organization: 'organizationA',
            },
            expiresAt: 0,
          };

          const res = await manager.getRefreshToken(entry, key);

          expect(res).toBeFalsy();
          expect(manager.onNoRefreshableToken).toHaveBeenCalledTimes(1);
        });
      });

      describe('when entry has refresh_token', () => {
        it('sets entry in cache and returns refresh_token', async () => {
          jest.spyOn(cache, 'set');

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const entry = {
            body: {
              ...defaultData,
              scope: 'read:user update:user',
              audience: TEST_AUDIENCE,
              organization: 'organizationA',
              refresh_token: TEST_REFRESH_TOKEN,
            },
            expiresAt: 0,
          };

          const expectedResult = { refresh_token: TEST_REFRESH_TOKEN };

          const res = await manager.getRefreshToken(entry, key);

          expect(res?.body).toEqual(expectedResult);
          expect(cache.set).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('onNoRefreshableToken', () => {
      it('removes entry and key from cache', async () => {
        jest.spyOn(cache, 'remove');

        const key = new CacheKey({
          clientId: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          // organization: 'organizationA',
          scope: 'read:user'
        });

        await manager.onNoRefreshableToken(key);

        expect(cache.remove).toHaveBeenCalledTimes(1);
      });
    });

    describe('getActiveToken', () => {
      describe('when entry is not found', () => {
        it('returns undefined', async () => {
          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const res = await manager.getActiveToken(
            key,
            0,
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when entry is found but is expired', () => {
        it('returns undefined', async () => {
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(true);

          const data = {
            ...defaultData,
            scope: 'read:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const res = await manager.getActiveToken(
            key,
            0,
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when entry is found and is active', () => {
        it('returns entry', async () => {
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(false);

          const data = {
            ...defaultData,
            scope: 'read:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user'
          });

          const res = await manager.getActiveToken(
            key,
            0,
          );

          expect(res?.body).toEqual(data);
        });
      });
    });

    describe('getInactiveToken', () => {
      describe('when entry is not found', () => {
        it('returns undefined', async () => {
          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: 'read:user'
          });

          const res = await manager.getInactiveToken(
            key,
            0,
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when entry is found and is expired', () => {
        it('calls getRefreshToken', async () => {
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(true);
          jest.spyOn(manager, 'getRefreshToken');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          await manager.getInactiveToken(
            key,
            0,
          );

          expect(manager.getRefreshToken).toBeCalledTimes(1);
        });
      });
      describe('when entry is found and is not expired', () => {
        it('returns entry', async () => {
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(false);

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getInactiveToken(
            key,
            0,
          );

          expect(res?.body).toEqual(data);
        });
      });
    });

    describe('getSiblingToken', () => {
      describe('when key is not found', () => {
        it('returns undefined', async () => {
          jest.spyOn(CacheManagerUtils, 'findKey').mockReturnValue(undefined);

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getSiblingToken(
            key,
            [],
            0,
          );

          expect(res).toBeFalsy();
        });
      });

      describe('when key is found but the entry does not exist', () => {
        it('returns undefined', async () => {
          const foundKey = '@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user';

          jest.spyOn(CacheManagerUtils, 'findKey').mockReturnValue(foundKey);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getSiblingToken(
            key,
            [foundKey],
            0,
          );

          expect(res).toBeFalsy();
        });
      });

      describe('when key and entry are found and is expired', () => {
        it('calls getRefreshToken', async () => {
          const foundKey = '@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user';

          jest.spyOn(CacheManagerUtils, 'findKey').mockReturnValue(foundKey);
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(true);
          jest.spyOn(manager, 'getRefreshToken');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          await manager.getSiblingToken(
            key,
            [foundKey],
            0,
          );

          expect(manager.getRefreshToken).toHaveBeenCalledTimes(1);
        });
      });

      describe('when key and entry are found and not expired', () => {
        it('returns entry', async () => {
          const foundKey = '@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user';

          jest.spyOn(CacheManagerUtils, 'findKey').mockReturnValue(foundKey);
          jest.spyOn(CacheManagerUtils, 'isTokenExpired').mockResolvedValue(false);
          jest.spyOn(manager, 'getRefreshToken');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getSiblingToken(
            key,
            [foundKey],
            0,
          );

          expect(res?.body).toEqual(data);
        });
      });
    });

    describe('getMRRTToken', () => {
      describe('when key is not found', () => {
        it('returns undefined', async () => {
          jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(false);
          jest.spyOn(CacheManagerUtils, 'hasMatchingOrganization').mockReturnValue(false);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: 'New audience',
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getMRRTToken(
            key,
            ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'],
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when key is found but not entry', () => {
        it('returns undefined', async () => {
          jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(true);
          jest.spyOn(CacheManagerUtils, 'hasMatchingOrganization').mockReturnValue(true);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: 'New audience',
            // organization: 'organizationA',
            scope: 'read:user update:user'
          });

          const res = await manager.getMRRTToken(
            key,
            ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'],
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when entry is found but it does not have refresh_token', () => {
        it('returns undefined', async () => {
          jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(true);
          jest.spyOn(CacheManagerUtils, 'hasMatchingOrganization').mockReturnValue(true);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: 'New audience',
            // organization: 'organizationA',
            scope: 'read:books update:books'
          });

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
          };

          await manager.set(data);

          const res = await manager.getMRRTToken(
            key,
            ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'],
          );

          expect(res).toBeFalsy();
        });
      });
      describe('when entry is found and has refresh_token', () => {
        it('returns entry', async () => {
          jest.spyOn(CacheManagerUtils, 'hasDefaultParameters').mockReturnValue(true);
          jest.spyOn(CacheManagerUtils, 'hasMatchingOrganization').mockReturnValue(true);

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const key = new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: 'New audience',
            // organization: 'organizationA',
            scope: 'read:books update:books'
          });

          const res = await manager.getMRRTToken(
            key,
            ['@@auth0spajs@@::auth0_client_id::my_audience::read:user update:user'],
          );

          expect(res?.body).toMatchObject({
            refresh_token: data.refresh_token,
            scope: key.scope,
            audience: key.audience,
          });
        });
      });
    });

    describe('updateEntry', () => {
      describe('when there are not keys in cache', () => {
        it('returns undefined', async () => {
          const res = await manager.updateEntry('1234', '4567');

          expect(res).toBeFalsy();
        });
      });
      describe('when it does not find any matching entry', () => {
        it('returns undefined', async () => {
          jest.spyOn(cache, 'get').mockReturnValue(undefined);

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
          };

          await manager.set(data);

          const res = await manager.updateEntry('1234', '4567');

          expect(res).toBeFalsy();
        });
      });
      describe('when it does find a matching entry but it does not have same refresh_token', () => {
        it('returns undefined', async () => {
          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: '1234',
          };

          await manager.set(data);

          const res = await manager.updateEntry(TEST_REFRESH_TOKEN, '4567');

          expect(res).toBeFalsy();
        });
      });
      describe('when it does find a matching entry and has same refresh_token', () => {
        it('updates entry in cache with new refresh_token', async () => {
          jest.spyOn(manager, 'set');

          const data = {
            ...defaultData,
            scope: 'read:user update:user',
            audience: TEST_AUDIENCE,
            organization: 'organizationA',
            refresh_token: TEST_REFRESH_TOKEN,
            clientId: TEST_CLIENT_ID,
          };

          await manager.set(data);

          const newToken = '4567';

          await manager.updateEntry(TEST_REFRESH_TOKEN, newToken);

          expect(manager.set).toHaveBeenCalled();
        });
      });
    });
  });
});
