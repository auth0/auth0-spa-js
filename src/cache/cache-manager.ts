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
  private readonly keyManifest: CacheKeyManifest;

  constructor(private cache: ICache) {
    this.keyManifest = new CacheKeyManifest(cache);
  }

  async get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    let wrappedEntry = await this.cache.get<WrappedCacheEntry>(
      cacheKey.toKey()
    );

    if (!wrappedEntry) {
      // Try again by loosely-matching the key against a set of keys we've stored
      // in the key manifest.
      const keyManifestEntry = await this.keyManifest.get(cacheKey);

      if (keyManifestEntry) {
        const matchedKey = this.matchExistingCacheKey(
          cacheKey,
          keyManifestEntry.keys
        );
        wrappedEntry = await this.cache.get<WrappedCacheEntry>(matchedKey);
      }

      // If we still don't have an entry..
      if (!wrappedEntry) {
        return;
      }
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Make sure the key manifest knows about the key.
    // This helps to migrate keys into the manifest, as the manifest takes care
    // of duplicates for us.
    await this.keyManifest.add(cacheKey);

    if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (wrappedEntry.body.refresh_token) {
        wrappedEntry.body = {
          refresh_token: wrappedEntry.body.refresh_token
        };

        await this.cache.set(cacheKey.toKey(), wrappedEntry);
        return wrappedEntry.body;
      }

      await this.cache.remove(cacheKey.toKey());
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

  /**
   * Finds the corresponding key in the cache based on the provided cache key.
   * The keys inside the cache are in the format {prefix}::{client_id}::{audience}::{scope}.
   * The first key in the cache that satisfies the following conditions is returned
   *  - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
   *  - `client_id` is strict equal to the `cacheKey.client_id`
   *  - `audience` is strict equal to the `cacheKey.audience`
   *  - `scope` contains at least all the `cacheKey.scope` values
   *  *
   * @param cacheKey The provided cache key
   * @param existingCacheKeys A list of existing cache keys
   */
  matchExistingCacheKey(cacheKey: CacheKey, existingCacheKeys: Array<string>) {
    const { client_id, audience, scope } = cacheKey;

    return existingCacheKeys.filter(key => {
      const {
        prefix: currentPrefix,
        client_id: currentClientId,
        audience: currentAudience,
        scope: currentScopes
      } = CacheKey.fromKey(key);

      const currentScopesArr = currentScopes && currentScopes.split(' ');

      const hasAllScopes =
        currentScopes &&
        scope
          .split(' ')
          .reduce(
            (acc, current) => acc && currentScopesArr.includes(current),
            true
          );

      return (
        currentPrefix === CACHE_KEY_PREFIX &&
        currentClientId === client_id &&
        currentAudience === audience &&
        hasAllScopes
      );
    })[0];
  }
}
