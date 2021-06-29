import { CacheKeyManifest } from './key-manifest';

import {
  CacheEntry,
  ICache,
  CacheKey,
  CACHE_KEY_PREFIX,
  WrappedCacheEntry
} from './shared';

const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

export class CacheManager {
  private readonly keyManifest?: CacheKeyManifest;

  constructor(private cache: ICache, clientId: string) {
    // If the cache implementation doesn't provide an `allKeys` method,
    // use a built-in key manifest.
    if (!cache.allKeys) {
      this.keyManifest = new CacheKeyManifest(this.cache, clientId);
    }
  }

  async get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    let wrappedEntry = await this.cache.get<WrappedCacheEntry>(
      cacheKey.toKey()
    );

    if (!wrappedEntry) {
      const keys = await this.getCacheKeys();

      if (!keys) return;

      const matchedKey = this.matchExistingCacheKey(cacheKey, keys);
      wrappedEntry = await this.cache.get<WrappedCacheEntry>(matchedKey);
    }

    // If we still don't have an entry, exit.
    if (!wrappedEntry) {
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Make sure the key manifest knows about the key.
    // This helps to migrate keys into the manifest, as the manifest takes care
    // of duplicates for us.
    await this.keyManifest?.add(cacheKey.toKey());

    if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (wrappedEntry.body.refresh_token) {
        wrappedEntry.body = {
          refresh_token: wrappedEntry.body.refresh_token
        };

        await this.cache.set(cacheKey.toKey(), wrappedEntry);
        return wrappedEntry.body;
      }

      await this.cache.remove(cacheKey.toKey());
      await this.keyManifest?.remove(cacheKey.toKey());

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
    await this.keyManifest?.add(cacheKey.toKey());
  }

  async clear(): Promise<void> {
    const keys = await this.getCacheKeys();

    if (keys) {
      keys.forEach(async key => {
        await this.cache.remove(key);
      });

      await this.keyManifest?.clear();
    }
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

  private async getCacheKeys(): Promise<string[]> {
    return this.keyManifest
      ? (await this.keyManifest.get())?.keys
      : await this.cache.allKeys();
  }

  /**
   * Finds the corresponding key in the cache based on the provided cache key.
   * The keys inside the cache are in the format {prefix}::{client_id}::{audience}::{scope}.
   * The first key in the cache that satisfies the following conditions is returned
   *  - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
   *  - `client_id` is strict equal to the `cacheKey.client_id`
   *  - `audience` is strict equal to the `cacheKey.audience`
   *  - `scope` contains at least all the `cacheKey.scope` values
   *  *
   * @param keyToMatch The provided cache key
   * @param allKeys A list of existing cache keys
   */
  private matchExistingCacheKey(keyToMatch: CacheKey, allKeys: Array<string>) {
    return allKeys.filter(key => {
      const cacheKey = CacheKey.fromKey(key);
      const scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(' '));
      const scopesToMatch = keyToMatch.scope.split(' ');

      const hasAllScopes =
        cacheKey.scope &&
        scopesToMatch.reduce(
          (acc, current) => acc && scopeSet.has(current),
          true
        );

      return (
        cacheKey.prefix === CACHE_KEY_PREFIX &&
        cacheKey.client_id === keyToMatch.client_id &&
        cacheKey.audience === keyToMatch.audience &&
        hasAllScopes
      );
    })[0];
  }
}
