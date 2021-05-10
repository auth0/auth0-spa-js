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

interface CacheConstructor {
  new (): ICache;
}

const cacheDescriptors = [
  { ctor: LocalStorageCache, name: 'LocalStorage Cache' },
  { ctor: () => new InMemoryCache().enclosedCache, name: 'In-memory Cache' }
];

const defaultEntry = {
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

cacheDescriptors.forEach(descriptor => {
  describe(descriptor.name, () => {
    let cache: ICache;

    beforeEach(() => {
      cache = new (descriptor.ctor as CacheConstructor)();
    });

    it('returns undefined when there is no data', async () => {
      expect(await cache.get('some-fictional-key')).toBeFalsy();
    });

    it('retrieves values from the cache', async () => {
      const data = {
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
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

      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: TEST_SCOPES
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match', async () => {
      const data = {
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: 'the_scope the_scope2',
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

      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: 'the_scope'
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
      const data = {
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
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

      const cacheKey = new CacheKey({
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
        scope: 'the_scope3 the_scope'
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get(cacheKey.toKey())).toStrictEqual(data);
    });

    it('returns undefined when not all scopes match', async () => {
      const data = {
        client_id: TEST_CLIENT_ID,
        audience: 'the_audience',
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

      // Set cache with one set of scopes..
      await cache.set(
        new CacheKey({
          client_id: data.client_id,
          scope: data.scope,
          audience: data.audience
        }).toKey(),
        data
      );

      // Retrieve with another
      expect(
        await cache.get(
          new CacheKey({
            client_id: TEST_CLIENT_ID,
            audience: 'the_audience',
            scope: 'the_scope4 the_scope'
          }).toKey()
        )
      ).toBeFalsy();
    });

    it('can remove an item from the cache', async () => {
      const cacheKey = new CacheKey({
        client_id: defaultEntry.client_id,
        audience: defaultEntry.audience,
        scope: defaultEntry.scope
      }).toKey();

      await cache.set(cacheKey, defaultEntry);
      expect(await cache.get(cacheKey)).toStrictEqual(defaultEntry);
      await cache.remove(cacheKey);
      expect(await cache.get(cacheKey)).toBeFalsy();
    });
  });
});

describe('LocalStorage Cache', () => {
  it('removes the correct items when the cache is cleared', async () => {
    const cache = new LocalStorageCache();

    // Put some data into local storage that could have been set outside the SDK
    localStorage.setItem('some-key-1', "doesn't matter what the data is");
    localStorage.setItem('some-key-2', "doesn't matter what the data is");

    const keys = [
      new CacheKey({
        client_id: defaultEntry.client_id,
        audience: defaultEntry.audience,
        scope: defaultEntry.scope
      }),
      new CacheKey({
        client_id: 'client-id-2',
        audience: defaultEntry.audience,
        scope: defaultEntry.scope
      })
    ];

    for (const cacheKey of keys) {
      await cache.set(cacheKey.toKey(), defaultEntry);
    }

    const [key1, key2] = keys;

    expect(localStorage.getItem(key1.toKey())).toBeTruthy();
    expect(localStorage.getItem(key2.toKey())).toBeTruthy();

    await cache.clear();

    // Check that it only clears the keys relevant to the SDK/cache (internally, clear() does this based
    // on the prefix value.
    expect(localStorage.getItem('some-key-1')).toBeTruthy();
    expect(localStorage.getItem(key1.toKey())).toBeFalsy();
    expect(localStorage.getItem('some-key-2')).toBeTruthy();
    expect(localStorage.getItem(key2.toKey())).toBeFalsy();
  });
});
