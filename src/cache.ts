import { IdToken, User } from './global';

interface CacheKeyData {
  audience: string;
  scope: string;
  client_id: string;
}

export class CacheKey {
  public client_id: string;
  public scope: string;
  public audience: string;

  constructor(data: CacheKeyData, public prefix: string = keyPrefix) {
    this.client_id = data.client_id;
    this.scope = data.scope;
    this.audience = data.audience;
  }

  toKey(): string {
    return `${this.prefix}::${this.client_id}::${this.audience}::${this.scope}`;
  }

  static fromKey(key: string): CacheKey {
    const [prefix, client_id, audience, scope] = key.split('::');

    return new CacheKey({ client_id, scope, audience }, prefix);
  }
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
  get(
    key: CacheKey,
    expiryAdjustmentSeconds?: number
  ): Partial<CacheEntry> | undefined;
  clear(): void;
}

const keyPrefix = '@@auth0spajs@@';
const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

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
const findExistingCacheKey = (
  cacheKey: CacheKey,
  existingCacheKeys: Array<string>
) => {
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
      currentPrefix === keyPrefix &&
      currentClientId === client_id &&
      currentAudience === audience &&
      hasAllScopes
    );
  })[0];
};

export class LocalStorageCache implements ICache {
  public save(entry: CacheEntry): void {
    const cacheKey = new CacheKey({
      client_id: entry.client_id,
      scope: entry.scope,
      audience: entry.audience
    });
    const payload = wrapCacheEntry(entry);

    window.localStorage.setItem(cacheKey.toKey(), JSON.stringify(payload));
  }

  public get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Partial<CacheEntry> | undefined {
    const payload = this.readJson(cacheKey);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!payload) return;

    if (payload.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (payload.body.refresh_token) {
        const newPayload = this.stripData(payload);
        this.writeJson(cacheKey.toKey(), newPayload);

        return newPayload.body;
      }

      localStorage.removeItem(cacheKey.toKey());
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
  private readJson(cacheKey: CacheKey): CachePayload {
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
    let cache: Record<string, CachePayload> = {};

    return {
      save(entry: CacheEntry) {
        const cacheKey = new CacheKey({
          client_id: entry.client_id,
          scope: entry.scope,
          audience: entry.audience
        });
        const payload = wrapCacheEntry(entry);

        cache[cacheKey.toKey()] = payload;
      },

      get(
        cacheKey: CacheKey,
        expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
      ): Partial<CacheEntry> | undefined {
        const existingCacheKey = findExistingCacheKey(
          cacheKey,
          Object.keys(cache)
        );
        const wrappedEntry: CachePayload = cache[existingCacheKey];
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

          delete cache[cacheKey.toKey()];

          return;
        }

        return wrappedEntry.body;
      },

      clear() {
        cache = {};
      }
    };
  })();
}
