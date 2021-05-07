import { CacheManager, ICache, InMemoryCache } from '../src/cache';
import { CacheEntry, CacheKey } from '../src/cache/shared';
import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_SCOPES
} from './constants';

describe('CacheManager', () => {
  let manager: CacheManager;

  const defaultCacheEntry: CacheEntry = {
    access_token: TEST_ACCESS_TOKEN,
    id_token: TEST_ID_TOKEN,
    audience: TEST_AUDIENCE,
    scope: TEST_SCOPES,
    client_id: TEST_CLIENT_ID,
    expires_in: 86400,
    decodedToken: {
      user: {},
      claims: {
        __raw: TEST_ID_TOKEN
      }
    }
  };

  const defaultCacheKey = new CacheKey({
    client_id: TEST_CLIENT_ID,
    scope: TEST_SCOPES,
    audience: TEST_AUDIENCE
  });

  beforeEach(() => {
    manager = new CacheManager(new InMemoryCache().enclosedCache);
  });

  it('can get/set an item in the cache', async () => {
    await manager.set(defaultCacheEntry);
    expect(await manager.get(defaultCacheKey)).toEqual(defaultCacheEntry);
  });

  it('can clear the cache', async () => {
    await manager.set(defaultCacheEntry);
    await manager.set({ ...defaultCacheEntry, client_id: 'SOME CLIENT ID' });
    await manager.clear();

    expect(await manager.get(defaultCacheKey)).toBeFalsy();

    expect(
      await manager.get(
        new CacheKey({
          scope: defaultCacheKey.scope,
          audience: defaultCacheKey.audience,
          client_id: 'SOME CLIENT ID'
        })
      )
    ).toBeFalsy();
  });
});
