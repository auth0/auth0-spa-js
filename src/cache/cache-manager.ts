import { CacheKeyManifest } from './key-manifest';
import { CacheEntry, ICache, CacheKey, findExistingCacheKey } from './shared';

const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

type WrappedCacheEntry = {
  body: Partial<CacheEntry>;
  expiresAt: number;
};

export class CacheManager {
  private readonly keyManifest: CacheKeyManifest;

  constructor(private cache: ICache) {
    this.keyManifest = new CacheKeyManifest(cache);
  }

  async get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    const keySet = await this.keyManifest.get(cacheKey);

    if (!keySet) return;

    // Find the actual key by loosely matching on scope
    const key = findExistingCacheKey(cacheKey, keySet.keys);

    if (!key) return;

    const wrappedEntry = await this.cache.get<WrappedCacheEntry>(key);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!wrappedEntry) {
      await this.keyManifest.remove(cacheKey);
      return;
    }

    if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (wrappedEntry.body.refresh_token) {
        wrappedEntry.body = {
          refresh_token: wrappedEntry.body.refresh_token
        };

        await this.cache.set(key, wrappedEntry);
        return wrappedEntry.body;
      }

      await this.cache.remove(key);
      await this.keyManifest.remove(cacheKey);
      return;
    }

    return wrappedEntry.body;
  }

  async set(entry: CacheEntry): Promise<void> {
    const cacheKey = new CacheKey({
      client_id: entry.client_id,
      scope: entry.scope,
      audience: entry.audience
    });

    const wrappedEntry = this.wrapCacheEntry(entry);

    await this.cache.set(cacheKey.toKey(), wrappedEntry);
    await this.keyManifest.add(cacheKey);
  }

  clear(): Promise<void> {
    // As the key manifest use the same cache instance, this operation
    // will also clear the manifest.
    return this.cache.clear();
  }

  private wrapCacheEntry(entry: CacheEntry): WrappedCacheEntry {
    const expiresInTime = Math.floor(Date.now() / 1000) + entry.expires_in;

    const expirySeconds = Math.min(
      expiresInTime,
      entry.decodedToken.claims.exp
    );

    return {
      body: entry,
      expiresAt: expirySeconds
    };
  }
}
