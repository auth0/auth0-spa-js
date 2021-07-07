import {
  CacheManager,
  InMemoryCache,
  LocalStorageCache
} from '../../src/cache';

import {
  CacheEntry,
  CacheKey,
  CACHE_KEY_PREFIX,
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

const defaultKey = new CacheKey({
  client_id: TEST_CLIENT_ID,
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
  { new: () => new LocalStorageCache(), name: 'LocalStorageCache' },
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
    let withKeyManifest: boolean;

    beforeEach(() => {
      cache = cacheFactory.new();
      manager = new CacheManager(cache, TEST_CLIENT_ID);
      withKeyManifest = !!!cache.allKeys;

      if (withKeyManifest) {
        ['get', 'add', 'clear'].forEach((method: any) =>
          jest.spyOn(manager['keyManifest'], method)
        );
      }
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns undefined when there is nothing in the cache', async () => {
      const result = await manager.get(defaultKey);

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
        client_id: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages'
      });

      expect(await manager.get(key)).toStrictEqual(data);
    });

    it('should return an entry directly from the cache if the key matches exactly', async () => {
      const data = {
        ...defaultData,
        scope: 'read:messages write:messages'
      };

      await manager.set(data);

      const key = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages write:messages'
      });

      expect(await manager.get(key)).toStrictEqual(data);
    });

    if (withKeyManifest) {
      it('should update the key manifest when the key has only been added to the underlying cache', async () => {
        const manifestKey = `${CACHE_KEY_PREFIX}::${defaultData.client_id}`;

        await manager.set(defaultData);

        // Remove the manifest entry that is created by the manifest
        await cache.remove(manifestKey);

        const result = await manager.get(defaultKey);

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
        client_id: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'read:messages read:actions'
      });

      expect(await manager.get(key)).toBeFalsy();
    });

    it('returns undefined from the cache when expires_in < expiryAdjustmentSeconds', async () => {
      const data = {
        ...defaultData,
        expires_in: 40
      };

      await manager.set(data);

      expect(
        await manager.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: 'the_audience',
            scope: TEST_SCOPES
          }),
          60
        )
      ).toBeFalsy();
    });

    it('returns undefined if the item was not found in the underlying cache', async () => {
      const cacheSpy = jest.spyOn(cache, 'remove');

      await manager.set(defaultData);
      expect(await manager.get(defaultKey)).toStrictEqual(defaultData);
      cache.remove(defaultKey.toKey());
      expect(await manager.get(defaultKey)).toBeFalsy();
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
        expect(await manager.get(cacheKey)).toStrictEqual(data);

        // Advance the time to just past the expiry..
        const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
        global.Date.now = dateNowStub;

        expect(await manager.get(cacheKey)).toStrictEqual({
          refresh_token: TEST_REFRESH_TOKEN
        });

        global.Date.now = realDateNow;
      });
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
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);

      global.Date.now = dateNowStub;

      const result = await manager.get(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (withKeyManifest) {
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
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
      global.Date.now = dateNowStub;

      const result = await manager.get(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (withKeyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(
          `@@auth0spajs@@::${data.client_id}`
        );
      }
    });

    it('clears the cache', async () => {
      const entry1 = { ...defaultData };
      const entry2 = { ...defaultData, scope: 'scope-1' };

      await manager.set(entry1);
      await manager.set(entry2);

      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toStrictEqual(
        entry1
      );

      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toStrictEqual(
        entry2
      );

      await manager.clear();
      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toBeFalsy();
      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toBeFalsy();
    });
  });
});
