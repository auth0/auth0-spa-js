import { CacheKey, ICache, InMemoryCache } from '../../src/cache';
import { CacheKeyManifest } from '../../src/cache/key-manifest';
import { TEST_AUDIENCE, TEST_CLIENT_ID, TEST_SCOPES } from '../constants';
import { expect } from '@jest/globals';

describe('CacheKeyManifest', () => {
  let manifest: CacheKeyManifest;

  beforeEach(() => {
    manifest = new CacheKeyManifest(
      new InMemoryCache().enclosedCache,
      TEST_CLIENT_ID
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new item in the manifest if one does not exist', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    expect(await manifest.get()).toBeFalsy();
    await manifest.add(key.toKey());

    const entry = await manifest.get();

    expect(entry.keys).toStrictEqual([key.toKey()]);
  });

  it('should add another key to the same list if an entry already exists in the manifest', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key.toKey());

    const key2 = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: 'http://another-audience',
      scope: TEST_SCOPES
    });

    await manifest.add(key2.toKey());

    const entry = await manifest.get();

    expect(entry.keys).toHaveLength(2);
    expect(entry.keys).toStrictEqual([key.toKey(), key2.toKey()]);
  });

  it('should not add the same key twice', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key.toKey());

    const key2 = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: 'http://another-audience',
      scope: TEST_SCOPES
    });

    await manifest.add(key2.toKey());
    await manifest.add(key2.toKey());

    const entry = await manifest.get();

    // Should still only have 2 keys, despite adding key, key2 and key2 again
    expect(entry.keys).toHaveLength(2);
    expect(entry.keys).toStrictEqual([key.toKey(), key2.toKey()]);
  });

  it('can remove an entry', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await manifest.add(key.toKey());
    await manifest.remove(key.toKey());
    expect(await manifest.get()).toBeFalsy();
  });

  it('does nothing if trying to remove an item that does not exist', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    await expect(manifest.remove(key.toKey())).resolves.toBeFalsy();
  });

  it('can remove a key from an entry and leave others intact', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    const key2 = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: 'http://another-audience',
      scope: TEST_SCOPES
    });

    await manifest.add(key.toKey());
    await manifest.add(key2.toKey());
    await manifest.remove(key.toKey());
    expect((await manifest.get()).keys).toStrictEqual([key2.toKey()]);
  });

  it('does not remove the whole entry if the key was not found', async () => {
    const key = new CacheKey({
      clientId: TEST_CLIENT_ID,
      audience: TEST_AUDIENCE,
      scope: TEST_SCOPES
    });

    const randomKey = new CacheKey({
      clientId: key.clientId,
      audience: 'http://some-other-audience',
      scope: key.scope
    });

    await manifest.add(key.toKey());
    await manifest.remove(randomKey.toKey());
    expect((await manifest.get()).keys).toStrictEqual([key.toKey()]);
  });
});
