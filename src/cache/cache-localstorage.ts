import { ICache, CACHE_KEY_PREFIX, Cacheable } from './shared';

export class LocalStorageCache implements ICache {
  public set<T = Cacheable>(key: string, entry: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(entry));
    return Promise.resolve();
  }

  public get<T = Cacheable>(key: string): Promise<T> {
    const json = window.localStorage.getItem(key);

    if (!json) return Promise.resolve(null);

    try {
      const payload = JSON.parse(json);
      return Promise.resolve(payload);
    } catch (e) {
      /* istanbul ignore next */
      return Promise.resolve(null);
    }
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
}
