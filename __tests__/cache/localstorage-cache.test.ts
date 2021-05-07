import { LocalStorageCache, ICache, CacheKey } from '../../src/cache';
import { CacheEntry } from '../../src/cache/shared';

import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_SCOPES,
  dayInSeconds,
  nowSeconds
} from '../constants';

describe('LocalStorageCache', () => {
  let cache: ICache;
  let defaultEntry: CacheEntry;

  beforeEach(() => {
    cache = new LocalStorageCache();

    jest.clearAllMocks();
    localStorage.clear();
    (<any>localStorage.removeItem).mockClear();

    defaultEntry = {
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
  });

  it('can retrieve an item from the cache', async () => {
    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await cache.set(cacheKey.toKey(), defaultEntry);
    expect(await cache.get(cacheKey.toKey())).toStrictEqual(defaultEntry);
  });

  it('can retrieve an item from the cache when scopes do not match', async () => {
    localStorage.setItem(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__`,
      JSON.stringify(defaultEntry)
    );

    expect(
      await cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: '__TEST_SCOPE__'
        }).toKey()
      )
    ).toStrictEqual(defaultEntry);
  });

  it('can retrieve an item from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
    localStorage.setItem(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__ __TEST_SCOPE3__`,
      JSON.stringify(defaultEntry)
    );

    expect(
      await cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: '__TEST_SCOPE3__ __TEST_SCOPE__'
        }).toKey()
      )
    ).toStrictEqual(defaultEntry);
  });

  it('returns undefined if the data is not json', async () => {
    localStorage.setItem(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::${TEST_SCOPES}`,
      'some data'
    );

    expect(
      await cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: TEST_SCOPES
        }).toKey()
      )
    ).toBeFalsy();
  });

  it('returns undefined when not all scopes match', async () => {
    localStorage.setItem(
      `@@auth0spajs@@::${TEST_CLIENT_ID}::${TEST_AUDIENCE}::__TEST_SCOPE__ __TEST_SCOPE2__ __TEST_SCOPE3__`,
      JSON.stringify(defaultEntry)
    );

    expect(
      await cache.get(
        new CacheKey({
          client_id: TEST_CLIENT_ID,
          audience: TEST_AUDIENCE,
          scope: '__TEST_SCOPE4__ __TEST_SCOPE__'
        }).toKey()
      )
    ).toBeFalsy();
  });

  it('returns undefined when there is no data', async () => {
    expect(await cache.get('some-fictional-key')).toBeFalsy();
  });

  it('removes the correct items when the cache is cleared', () => {
    const keys = [
      'some-key',
      '@@auth0spajs@@::key-1',
      'some-key-2',
      '@@auth0spajs@@::key-2'
    ];

    for (const key of keys) {
      localStorage.setItem(key, "doesn't matter what the data is");
    }

    cache.clear();

    expect(localStorage.removeItem).toHaveBeenCalledTimes(2);

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0spajs@@::key-1'
    );

    expect(localStorage.removeItem).toHaveBeenCalledWith(
      '@@auth0spajs@@::key-2'
    );
  });

  it('can remove an item from the cache', async () => {
    const cacheKey = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await cache.set(cacheKey.toKey(), defaultEntry);
    expect(await cache.get(cacheKey.toKey())).toStrictEqual(defaultEntry);
    await cache.remove(cacheKey.toKey());
    expect(await cache.get(cacheKey.toKey())).toBeFalsy();
  });
});
