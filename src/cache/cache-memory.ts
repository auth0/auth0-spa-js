import { ICache, CacheEntry, CacheKey, findExistingCacheKey } from './shared';

export class InMemoryCache {
  public enclosedCache: ICache = (function () {
    let cache: Record<string, unknown> = {};

    return {
      set(key: string, entry: unknown): Promise<void> {
        cache[key] = entry;
        return Promise.resolve();
      },

      get(key: string): Promise<Partial<CacheEntry> | undefined> {
        const cacheKey = CacheKey.fromKey(key);

        const existingCacheKey = findExistingCacheKey(
          cacheKey,
          Object.keys(cache)
        );

        const cacheEntry = cache[existingCacheKey];

        if (!cacheEntry) {
          return Promise.resolve(null);
        }

        return Promise.resolve(cacheEntry);
      },

      remove(key: string): Promise<void> {
        delete cache[key];
        return Promise.resolve();
      },

      clear(): Promise<void> {
        cache = {};
        return Promise.resolve();
      }
    };
  })();
}
