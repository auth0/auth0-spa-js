import { ICache, Cacheable } from './shared';

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
}
