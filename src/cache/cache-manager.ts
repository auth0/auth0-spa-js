import { CacheEntry, ICache, CacheKey } from './shared';

const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

type WrappedCacheEntry = {
  body: Partial<CacheEntry>;
  expiresAt: number;
};

export class CacheManager {
  constructor(private cache: ICache) {}

  async get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    const key = cacheKey.toKey();
    const wrappedEntry = await this.cache.get<WrappedCacheEntry>(key);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!wrappedEntry) return;

    if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (wrappedEntry.body.refresh_token) {
        wrappedEntry.body = {
          refresh_token: wrappedEntry.body.refresh_token
        };

        await this.cache.set(key, wrappedEntry);
        return wrappedEntry.body;
      }

      await this.cache.remove(key);
      return;
    }

    return wrappedEntry.body;
  }

  set(entry: CacheEntry): Promise<void> {
    const cacheKey = new CacheKey({
      client_id: entry.client_id,
      scope: entry.scope,
      audience: entry.audience
    });

    const wrappedEntry = this.wrapCacheEntry(entry);

    return this.cache.set(cacheKey.toKey(), wrappedEntry);
  }

  clear(): Promise<void> {
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
