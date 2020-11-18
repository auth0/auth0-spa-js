import { IdToken, User } from './global';

interface CacheKeyData {
  audience: string;
  scope: string;
  client_id: string;
}

interface DecodedToken {
  claims: IdToken;
  user: User;
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

export interface ICache {
  save(entry: CacheEntry): void;
  get(key: CacheKeyData, expiryAdjustmentSeconds?: number): Partial<CacheEntry>;
  clear(): void;
}

const keyPrefix = '@@auth0spajs@@';
const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

const createKey = (e: CacheKeyData) =>
  `${keyPrefix}::${e.client_id}::${e.audience}::${e.scope}`;

type CachePayload = {
  body: Partial<CacheEntry>;
  expiresAt: number;
};

/**
 * Wraps the specified cache entry and returns the payload
 * @param entry The cache entry to wrap
 */
const wrapCacheEntry = (entry: CacheEntry): CachePayload => {
  const expiresInTime = Math.floor(Date.now() / 1000) + entry.expires_in;
  const expirySeconds = Math.min(expiresInTime, entry.decodedToken.claims.exp);

  return {
    body: entry,
    expiresAt: expirySeconds
  };
};

export class LocalStorageCache implements ICache {
  public save(entry: CacheEntry): void {
    const cacheKey = createKey(entry);
    const payload = wrapCacheEntry(entry);

    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  }

  public get(
    key: CacheKeyData,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Partial<CacheEntry> {
    const cacheKey = createKey(key);
    const payload = this.readJson(cacheKey);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!payload) return;

    if (payload.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (payload.body.refresh_token) {
        const newPayload = this.stripData(payload);
        this.writeJson(cacheKey, newPayload);

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
  private readJson(cacheKey: string): CachePayload {
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
   * Writes the payload as JSON to localstorage
   * @param cacheKey The cache key
   * @param payload The payload to write as JSON
   */
  private writeJson(cacheKey: string, payload: CachePayload) {
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  }

  /**
   * Produce a copy of the payload with everything removed except the refresh token
   * @param payload The payload
   */
  private stripData(payload: CachePayload): CachePayload {
    const { refresh_token } = payload.body;

    const strippedPayload: CachePayload = {
      body: { refresh_token: refresh_token },
      expiresAt: payload.expiresAt
    };

    return strippedPayload;
  }
}

export class InMemoryCache {
  public enclosedCache: ICache = (function () {
    let cache: CachePayload = {
      body: {},
      expiresAt: 0
    };

    return {
      save(entry: CacheEntry) {
        const key = createKey(entry);
        const payload = wrapCacheEntry(entry);

        cache[key] = payload;
      },

      get(
        key: CacheKeyData,
        expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
      ) {
        const cacheKey = createKey(key);
        const wrappedEntry: CachePayload = cache[cacheKey];
        const nowSeconds = Math.floor(Date.now() / 1000);

        if (!wrappedEntry) {
          return;
        }

        if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
          if (wrappedEntry.body.refresh_token) {
            wrappedEntry.body = {
              refresh_token: wrappedEntry.body.refresh_token
            };

            return wrappedEntry.body;
          }

          delete cache[cacheKey];

          return;
        }

        return wrappedEntry.body;
      },

      clear() {
        cache = {
          body: {},
          expiresAt: 0
        };
      }
    };
  })();
}
