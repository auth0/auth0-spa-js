import { DEFAULT_NOW_PROVIDER } from '../constants';
import { CacheManagerUtils } from './cache-manager-utils';
import { CacheKeyManifest } from './key-manifest';

import {
  CacheEntry,
  ICache,
  CacheKey,
  CACHE_KEY_PREFIX,
  WrappedCacheEntry,
  DecodedToken,
  CACHE_KEY_ID_TOKEN_SUFFIX,
  IdTokenEntry
} from './shared';

const DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;

export class CacheManager {
  private nowProvider: () => number | Promise<number>;

  constructor(
    private cache: ICache,
    private keyManifest?: CacheKeyManifest,
    nowProvider?: () => number | Promise<number>
  ) {
    this.nowProvider = nowProvider || DEFAULT_NOW_PROVIDER;
  }

  async setIdToken(
    clientId: string,
    idToken: string,
    decodedToken: DecodedToken
  ): Promise<void> {
    const cacheKey = this.getIdTokenCacheKey(clientId);
    await this.cache.set(cacheKey, {
      id_token: idToken,
      decodedToken
    });
    await this.keyManifest?.add(cacheKey);
  }

  async getIdToken(cacheKey: CacheKey): Promise<IdTokenEntry | undefined> {
    const entry = await this.cache.get<IdTokenEntry>(
      this.getIdTokenCacheKey(cacheKey.clientId)
    );

    if (!entry && cacheKey.scope && cacheKey.audience) {
      const entryByScope = await this.get(cacheKey);

      if (!entryByScope) {
        return;
      }

      if (!entryByScope.id_token || !entryByScope.decodedToken) {
        return;
      }

      return {
        id_token: entryByScope.id_token,
        decodedToken: entryByScope.decodedToken
      };
    }

    if (!entry) {
      return;
    }

    return { id_token: entry.id_token, decodedToken: entry.decodedToken };
  }

  async get(
    cacheKey: CacheKey,
    options: {
      expiryAdjustmentSeconds: number,
    } = {
        expiryAdjustmentSeconds: DEFAULT_EXPIRY_ADJUSTMENT_SECONDS,
      },
  ): Promise<Partial<CacheEntry> | undefined> {
    const activeToken = await this.getActiveToken(
      cacheKey,
      options.expiryAdjustmentSeconds,
    );

    if (activeToken) {
      return activeToken.body;
    }

    const inactiveToken = await this.getInactiveToken(
      cacheKey,
      options.expiryAdjustmentSeconds,
    );

    if (inactiveToken) {
      return inactiveToken.body;
    }

    const keys = await this.getCacheKeys();

    if (!keys) return;

    const siblingToken = await this.getSiblingToken(
      cacheKey,
      keys,
      options.expiryAdjustmentSeconds,
    );

    if (siblingToken) {
      return siblingToken.body;
    }

    return;
  }

  async onNoRefreshableToken(cacheKey: CacheKey): Promise<undefined> {
    await this.cache.remove(cacheKey.toKey());
    await this.keyManifest?.remove(cacheKey.toKey());
    return;
  }

  async getRefreshToken(entry: WrappedCacheEntry, cacheKey: CacheKey): Promise<WrappedCacheEntry | undefined> {
    if (!entry.body.refresh_token) {
      return this.onNoRefreshableToken(cacheKey);
    }

    entry.body = {
      refresh_token: entry.body.refresh_token,
    };

    await this.cache.set(cacheKey.toKey(), entry);

    return entry;
  };

  async getActiveToken(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds: number,
  ): Promise<WrappedCacheEntry | undefined> {
    const entry = await this.cache.get<WrappedCacheEntry>(
      cacheKey.toKey()
    );

    if (!entry) {
      return undefined;
    }

    const isExpired = await CacheManagerUtils.isTokenExpired(
      entry,
      expiryAdjustmentSeconds,
      this.nowProvider,
    );

    return isExpired ? undefined : entry;
  }

  async getInactiveToken(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds: number
  ): Promise<WrappedCacheEntry | undefined> {
    const entry = await this.cache.get<WrappedCacheEntry>(
      cacheKey.toKey()
    );

    if (!entry) return undefined;

    const isExpired = await CacheManagerUtils.isTokenExpired(
      entry,
      expiryAdjustmentSeconds,
      this.nowProvider
    );

    if (isExpired) {
      return this.getRefreshToken(entry, cacheKey);
    }

    return entry;
  }

  async getSiblingToken(
    keyToMatch: CacheKey,
    keys: string[],
    expiryAdjustmentSeconds: number,
  ): Promise<WrappedCacheEntry | undefined> {
    const foundKey = CacheManagerUtils.findKey(keys, keyToMatch);

    if (!foundKey) return undefined;

    const entry = await this.cache.get<WrappedCacheEntry>(foundKey);

    if (!entry) return undefined;

    const isExpired = await CacheManagerUtils.isTokenExpired(
      entry,
      expiryAdjustmentSeconds,
      this.nowProvider,
    );

    if (isExpired) {
      return this.getRefreshToken(entry, keyToMatch);
    }

    return entry;
  }

  async set(entry: CacheEntry): Promise<void> {
    const cacheKey = new CacheKey({
      clientId: entry.client_id,
      scope: entry.scope,
      audience: entry.audience
    });

    const wrappedEntry = await this.wrapCacheEntry(entry);

    await this.cache.set(cacheKey.toKey(), wrappedEntry);
    await this.keyManifest?.add(cacheKey.toKey());
  }

  async clear(clientId?: string): Promise<void> {
    const keys = await this.getCacheKeys();

    /* c8 ignore next */
    if (!keys) return;

    await keys
      .filter(key => (clientId ? key.includes(clientId) : true))
      .reduce(async (memo, key) => {
        await memo;
        await this.cache.remove(key);
      }, Promise.resolve());

    await this.keyManifest?.clear();
  }

  private async wrapCacheEntry(entry: CacheEntry): Promise<WrappedCacheEntry> {
    const now = await this.nowProvider();
    const expiresInTime = Math.floor(now / 1000) + entry.expires_in;

    return {
      body: entry,
      expiresAt: expiresInTime
    };
  }

  private async getCacheKeys(): Promise<string[] | undefined> {
    if (this.keyManifest) {
      return (await this.keyManifest.get())?.keys;
    } else if (this.cache.allKeys) {
      return this.cache.allKeys();
    }
  }

  /**
   * Returns the cache key to be used to store the id token
   * @param clientId The client id used to link to the id token
   * @returns The constructed cache key, as a string, to store the id token
   */
  private getIdTokenCacheKey(clientId: string) {
    return new CacheKey(
      { clientId },
      CACHE_KEY_PREFIX,
      CACHE_KEY_ID_TOKEN_SUFFIX
    ).toKey();
  }
}
