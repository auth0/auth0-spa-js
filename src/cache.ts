import { IdToken } from './global';

interface CacheKeyData {
  audience: string;
  scope: string;
  client_id: string;
}

interface DecodedToken {
  claims: IdToken;
  user: any;
}

interface CacheEntry {
  id_token: string;
  access_token: string;
  expires_in: number;
  decodedToken: DecodedToken;
  audience: string;
  scope: string;
  client_id: string;
  refresh_token?: string;
}

interface CachedTokens {
  [key: string]: Partial<CacheEntry>;
}

export interface ICache {
  save(entry: CacheEntry): void;
  get(key: CacheKeyData): Partial<CacheEntry>;
  clear(): void;
}

const keyPrefix = '@@auth0spajs@@';
const createKey = (e: CacheKeyData) =>
  `${keyPrefix}::${e.client_id}::${e.audience}::${e.scope}`;

const getExpirationTimeoutInMilliseconds = (expiresIn: number, exp: number) => {
  const expTime =
    (new Date(exp * 1000).getTime() - new Date().getTime()) / 1000;
  return Math.min(expiresIn, expTime) * 1000 * 0.8;
};

type LocalStorageCachePayload = {
  body: Partial<CacheEntry>;
  expiresAt: number;
};

export class LocalStorageCache implements ICache {
  public save(entry: CacheEntry): void {
    const cacheKey = createKey(entry);
    const expiresInTime = Math.floor(Date.now() / 1000) + entry.expires_in;

    const expirySeconds =
      Math.min(expiresInTime, entry.decodedToken.claims.exp) - 60; // take off a small leeway

    const payload: LocalStorageCachePayload = {
      body: entry,
      expiresAt: expirySeconds
    };

    const timeout = getExpirationTimeoutInMilliseconds(
      entry.expires_in,
      entry.decodedToken.claims.exp
    );

    setTimeout(() => {
      const payload = this.getPayload(cacheKey);

      if (!payload || !payload.body) {
        return;
      }

      if (payload.body.refresh_token) {
        const newPayload = this.stripPayload(payload);
        localStorage.setItem(cacheKey, JSON.stringify(newPayload));

        return;
      }

      localStorage.removeItem(cacheKey);
    }, timeout);

    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  }

  public get(key: CacheKeyData): Partial<CacheEntry> {
    const cacheKey = createKey(key);
    const payload = this.getPayload(cacheKey);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!payload) return;

    if (payload.expiresAt < nowSeconds) {
      if (payload.body.refresh_token) {
        const newPayload = this.stripPayload(payload);
        localStorage.setItem(cacheKey, JSON.stringify(newPayload));

        return newPayload.body;
      }

      localStorage.removeItem(cacheKey);
      return;
    }

    return payload.body;
  }

  public clear() {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      if (localStorage.key(i).startsWith(keyPrefix)) {
        localStorage.removeItem(localStorage.key(i));
      }
    }
  }

  /**
   * Retrieves data from local storage and parses it into the correct format
   * @param cacheKey The cache key
   */
  private getPayload(cacheKey: string): LocalStorageCachePayload {
    const json = window.localStorage.getItem(cacheKey);
    let payload;

    if (!json) {
      return;
    }

    payload = JSON.parse(json);

    if (!payload) {
      return;
    }

    return payload;
  }

  /**
   * Produce a copy of the payload with everything removed except the refresh token
   * @param payload The payload
   */
  private stripPayload(
    payload: LocalStorageCachePayload
  ): LocalStorageCachePayload {
    const { refresh_token } = payload.body;

    const newPayload: LocalStorageCachePayload = {
      body: { refresh_token: refresh_token },
      expiresAt: payload.expiresAt
    };

    return newPayload;
  }
}

export class InMemoryCache {
  public enclosedCache: ICache = (function() {
    let cache: CachedTokens = {};

    return {
      save(entry: CacheEntry) {
        const key = createKey(entry);
        cache[key] = entry;

        const timeout = getExpirationTimeoutInMilliseconds(
          entry.expires_in,
          entry.decodedToken.claims.exp
        );

        setTimeout(() => {
          const payload = cache[key];

          if (!payload) return;

          if (payload.refresh_token) {
            cache[key] = { refresh_token: payload.refresh_token };
            return;
          }

          delete cache[key];
        }, timeout);
      },

      get(key: CacheKeyData) {
        return cache[createKey(key)];
      },

      clear() {
        cache = {};
      }
    };
  })();
}
