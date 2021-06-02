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

  it('should add another key to the same list if an entry already exists in the manifest', async () => {
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

  it('should not add the same key twice', async () => {
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
    await manifest.add(key2);

    const entry = await manifest.get(key);

    // Should still only have 2 keys, despite adding key, key2 and key2 again
    expect(entry.keys).toHaveLength(2);
    expect(entry.keys).toStrictEqual([key.toKey(), key2.toKey()]);
  });

  it('should add another entry for a different client ID', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key);

    const key2 = new CacheKey({
      client_id: 'some-other-client',
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key2);

    expect((await manifest.get(key)).keys).toStrictEqual([key.toKey()]);
    expect((await manifest.get(key2)).keys).toStrictEqual([key2.toKey()]);
  });

  it('can remove an entry', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key);
    await manifest.remove(key);
    expect(await manifest.get(key)).toBeFalsy();
  });

  it('does nothing if trying to remove an item that does not exist', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await expect(manifest.remove(key)).resolves.toBeFalsy();
  });

  it('can remove a key from an entry and leave others intact', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    const key2 = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: 'http://another-audience',
      scope: TEST_SCOPES
    });

    await manifest.add(key);
    await manifest.add(key2);

    await manifest.remove(key);
    expect((await manifest.get(key)).keys).toStrictEqual([key2.toKey()]);
  });

  it('can remove an entry and leave other entries intact', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    const key2 = new CacheKey({
      client_id: 'some-other-client',
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key);
    await manifest.add(key2);
    await manifest.remove(key);

    expect(await manifest.get(key)).toBeFalsy();
    expect((await manifest.get(key2)).keys).toStrictEqual([key2.toKey()]);
  });

  it('does not remove the whole entry if the key was not found', async () => {
    const key = new CacheKey({
      client_id: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key);

    await manifest.remove(
      new CacheKey({
        client_id: key.client_id,
        audience: 'http://some-other-audience',
        scope: key.scope
      })
    );

    expect((await manifest.get(key)).keys).toStrictEqual([key.toKey()]);
  });
});
