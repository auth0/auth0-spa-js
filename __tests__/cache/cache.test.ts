import {
  CacheKey,
  ICache,
  InMemoryCache,
  LocalStorageCache
} from '../../src/cache';
import { CacheEntry } from '../../src/cache/shared';

import {
  TEST_CLIENT_ID,
  TEST_SCOPES,
  TEST_ID_TOKEN,
  TEST_ACCESS_TOKEN,
  dayInSeconds,
  nowSeconds,
  TEST_AUDIENCE
} from '../constants';
import { InMemoryAsyncCacheNoKeys } from './shared';
import { expect } from '@jest/globals';

const cacheFactories = [
  { new: () => new LocalStorageCache(), name: 'LocalStorage Cache' },
  { new: () => new InMemoryCache().enclosedCache, name: 'In-memory Cache' },
  {
    new: () => new InMemoryAsyncCacheNoKeys(),
    name: 'In-memory async cache with no allKeys'
  }
];

const defaultEntry: CacheEntry = {
  client_id: TEST_CLIENT_ID,
  audience: TEST_AUDIENCE,
  scope: TEST_SCOPES,
  id_token: TEST_ID_TOKEN,
  access_token: TEST_ACCESS_TOKEN,
  expires_in: dayInSeconds,
  decodedToken: {
    claims: {
      __raw: TEST_ID_TOKEN,
      exp: nowSeconds() + dayInSeconds + 100,
      name: 'Test'
    },
    user: { name: 'Test' }
  }
};

cacheFactories.forEach(cacheFactory => {
  describe(cacheFactory.name, () => {
    let cache: ICache;

    beforeEach(() => {
      cache = cacheFactory.new();
    });

    it('returns undefined when there is no data', async () => {
      expect(await cache.get('some-fictional-key')).toBeFalsy();
    });

    it('retrieves values from the cache', async () => {
      const data = {
        ...defaultEntry,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test'
          },
          user: { name: 'Test' }
        }
      };

      const cacheKey = CacheKey.fromCacheEntry(data);

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match', async () => {
      const data = {
        ...defaultEntry,
        scope: 'the_scope the_scope2',
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test'
          },
          user: { name: 'Test' }
        }
      };

      const cacheKey = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'the_scope'
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
      const data = {
        ...defaultEntry,
        scope: 'the_scope the_scope2 the_scope3',
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test'
          },
          user: { name: 'Test' }
        }
      };

      const cacheKey = new CacheKey({
        clientId: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'the_scope3 the_scope'
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('returns undefined when not all scopes match', async () => {
      const data = {
        client_id: TEST_CLIENT_ID,
        audience: TEST_AUDIENCE,
        scope: 'the_scope the_scope2 the_scope3',
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

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Set cache with one set of scopes..
      await cache.set(cacheKey.toKey(), data);

      // Retrieve with another
      expect(
        await cache.get(
          new CacheKey({
            clientId: TEST_CLIENT_ID,
            audience: TEST_AUDIENCE,
            scope: 'the_scope4 the_scope'
          }).toKey()
        )
      ).toBeFalsy();
    });

    it('can remove an item from the cache', async () => {
      const cacheKey = CacheKey.fromCacheEntry(defaultEntry).toKey();

      await cache.set(cacheKey, defaultEntry);
      expect(await cache.get<CacheEntry>(cacheKey)).toStrictEqual(defaultEntry);
      await cache.remove(cacheKey);
      expect(await cache.get(cacheKey)).toBeFalsy();
    });
  });
});
