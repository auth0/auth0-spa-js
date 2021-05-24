import { CACHE_KEY_PREFIX, ICache, CacheKey } from './shared';

type KeyManifestEntry = {
  keys: string[];
};

export class CacheKeyManifest {
  constructor(private cache: ICache) {}

  async add(key: CacheKey): Promise<void> {
    const manifestKey = this.createManifestKeyFrom(key);
    const existingEntry = await this.cache.get<KeyManifestEntry>(manifestKey);

    if (!existingEntry) {
      return await this.cache.set<KeyManifestEntry>(manifestKey, {
        keys: [key.toKey()]
      });
    }

    if (!existingEntry.keys.includes(key.toKey())) {
      existingEntry.keys.push(key.toKey());
      await this.cache.set<KeyManifestEntry>(manifestKey, existingEntry);
    }
  }

  remove(key: CacheKey) {}

  get(key: CacheKey): Promise<KeyManifestEntry> {
    const manifestKey = this.createManifestKeyFrom(key);
    return this.cache.get<KeyManifestEntry>(manifestKey);
  }

  private createManifestKeyFrom(cacheKey: CacheKey): string {
    return `${CACHE_KEY_PREFIX}::${cacheKey.client_id}`;
  }
}
