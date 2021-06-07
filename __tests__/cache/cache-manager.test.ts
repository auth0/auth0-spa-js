import { CacheManager, InMemoryCache } from '../../src/cache';
import { CacheEntry, CacheKey, ICache } from '../../src/cache/shared';
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

describe('CacheManager', () => {
  let manager: CacheManager;
  let cache: ICache;

  beforeEach(() => {
    cache = new InMemoryCache().enclosedCache;
    manager = new CacheManager(cache);
  });

  it('returns undefined when there is nothing in the key manifest', async () => {
    const result = await manager.get(defaultKey);

    expect(result).toBeFalsy();
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

  it('should return an entry from the cache if multiple scopes match', async () => {
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

    // And test that the cache has been emptied
    expect(await manager.get(cacheKey)).toBeFalsy();

    global.Date.now = realDateNow;
  });

  it('expires the cache on read when the date.now > token.exp', async () => {
    const now = Date.now();
    const realDateNow = Date.now.bind(global.Date);

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

    // And test that the cache has been emptied
    expect(await manager.get(cacheKey)).toBeFalsy();

    global.Date.now = realDateNow;
  });

  it('clears the cache', async () => {
    await manager.set(defaultData);
    expect(await manager.get(defaultKey)).toStrictEqual(defaultData);
    await manager.clear();
    expect(await manager.get(defaultKey)).toBeFalsy();
  });
});
