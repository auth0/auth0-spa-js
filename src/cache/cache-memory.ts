import { ICache, CacheKey, findExistingCacheKey } from './shared';

export class InMemoryCache {
  public enclosedCache: ICache = (function () {
    let cache: Record<string, unknown> = {};

    return {
      set<T = unknown>(key: string, entry: T): Promise<void> {
        cache[key] = entry;
        return Promise.resolve();
      },

      get<T = unknown>(key: string): Promise<T> {
        const cacheKey = CacheKey.fromKey(key);

        const existingCacheKey = findExistingCacheKey(
          cacheKey,
          Object.keys(cache)
        );

        const cacheEntry = cache[existingCacheKey] as T;

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
