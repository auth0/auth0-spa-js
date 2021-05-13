import {
  CacheKey,
  findExistingCacheKey,
  ICache,
  CACHE_KEY_PREFIX
} from './shared';

export class LocalStorageCache implements ICache {
  public set(key: string, entry: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(entry));
    return Promise.resolve();
  }

  public get(key: string): Promise<unknown> {
    const cacheKey = CacheKey.fromKey(key);
    const payload = this.readJson(cacheKey);

    if (!payload) return Promise.resolve(null);

    return Promise.resolve(payload);
  }

  public remove(key: string): Promise<void> {
    localStorage.removeItem(key);
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      if (localStorage.key(i).startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(localStorage.key(i));
      }
    }

    return Promise.resolve();
  }

  /**
   * Retrieves data from local storage and parses it into the correct format
   * @param cacheKey The cache key
   */
  private readJson(cacheKey: CacheKey): unknown {
    const existingCacheKey = findExistingCacheKey(
      cacheKey,
      Object.keys(window.localStorage)
    );

    const json =
      existingCacheKey && window.localStorage.getItem(existingCacheKey);

    let payload;

    if (!json) {
      return;
    }

    try {
      payload = JSON.parse(json);
      return payload;
    } catch (e) {
      /* istanbul ignore next */
      return;
    }
  }
}
