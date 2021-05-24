import { CacheKey, ICache, InMemoryCache } from '../../src/cache';
import { CacheKeyManifest } from '../../src/cache/key-manifest';
import { TEST_AUDIENCE, TEST_CLIENT_ID, TEST_SCOPES } from '../constants';

describe('CacheKeyManifest', () => {
  let manifest: CacheKeyManifest;

  beforeEach(() => {
    manifest = new CacheKeyManifest(new InMemoryCache().enclosedCache);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new item in the manifest if one does not exist', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    expect(await manifest.get(key)).toBeFalsy();
    await manifest.add(key);

    const entry = await manifest.get(key);

    expect(entry.keys).toStrictEqual([key.toKey()]);
  });

  it('should add another entry to the same list if one already exists in the manifest', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key);

    const key2 = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'http://another-audience',
      scope: TEST_SCOPES
    });

    await manifest.add(key2);

    const entry = await manifest.get(key);

    expect(entry.keys).toHaveLength(2);
    expect(entry.keys).toStrictEqual([key.toKey(), key2.toKey()]);
  });
});
