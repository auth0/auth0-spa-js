import { ICache, Cacheable, CACHE_KEY_PREFIX, MaybePromise } from './shared';

export class LocalStorageCache implements ICache {
  public set<T = Cacheable>(key: string, entry: T) {
    localStorage.setItem(key, JSON.stringify(entry));
  }

  public get<T = Cacheable>(key: string): MaybePromise<T | undefined> {
    const json = window.localStorage.getItem(key);

    if (!json) return;

    try {
      const payload = JSON.parse(json) as T;
      return payload;
      /* c8 ignore next 3 */
    } catch (e) {
      return;
    }
  }

  public remove(key: string) {
    localStorage.removeItem(key);
  }

  public allKeys() {
    return Object.keys(window.localStorage).filter(key =>
      key.startsWith(CACHE_KEY_PREFIX)
    );
  }
}
