import { Cacheable, ICache } from '../../src/cache';

export class InMemoryAsyncCacheNoKeys implements ICache {
  private cache: Record<string, unknown> = {};

  set<T = Cacheable>(key: string, entry: T) {
    this.cache[key] = entry;
    return Promise.resolve();
  }

  get<T = Cacheable>(key: string) {
    const cacheEntry = this.cache[key] as T;

    if (!cacheEntry) {
      return Promise.resolve(null);
    }

    return Promise.resolve(cacheEntry);
  }

  remove(key: string) {
    delete this.cache[key];
    return Promise.resolve();
  }
}
