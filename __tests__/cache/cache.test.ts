import {
  CacheKey,
  ICache,
  InMemoryCache,
  LocalStorageCache
} from '../../src/cache';

import {
  TEST_CLIENT_ID,
  TEST_SCOPES,
  TEST_ID_TOKEN,
  TEST_ACCESS_TOKEN,
  dayInSeconds,
  nowSeconds
} from '../constants';

interface CacheConstructor {
  new (): ICache;
}

const cacheDescriptors = [
  { ctor: LocalStorageCache, name: 'LocalStorageCache' },
  { ctor: () => new InMemoryCache().enclosedCache, name: 'In-memory Cache' }
];

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
  });
});
