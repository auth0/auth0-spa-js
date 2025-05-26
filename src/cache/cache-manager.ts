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
      const entryByScope = await this.getCompatibleToken(cacheKey);

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

  async getCompatibleToken(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    const activeTokenMatchingAudienceScopeOrganization = await this.getActiveTokenMatchingAudienceScopeOrganization(
      cacheKey,
      expiryAdjustmentSeconds,
    );

    if (activeTokenMatchingAudienceScopeOrganization) {
      return activeTokenMatchingAudienceScopeOrganization.body;
    }

    const inactiveTokenMatchingAudienceScopeOrganization = await this.getInactiveTokenMatchingAudienceScopeOrganization(
      cacheKey,
      expiryAdjustmentSeconds,
    );

    if (inactiveTokenMatchingAudienceScopeOrganization) {
      return inactiveTokenMatchingAudienceScopeOrganization.body;
    }

    const keys = await this.getCacheKeys();

    if (!keys) return;

    const tokenWithRefreshTokenMatchingAudienceOrganization = await this.getTokenWithRefreshTokenMatchingAudienceOrganization(
      cacheKey,
      keys,
      expiryAdjustmentSeconds,
    );

    if (tokenWithRefreshTokenMatchingAudienceOrganization) {
      return tokenWithRefreshTokenMatchingAudienceOrganization.body;
    }

    const tokenWithRefreshTokenMatchingOrganization = await this.getTokenWithRefreshTokenMatchingOrganization(
      cacheKey,
      keys,
    );

    console.log('tokenWithRefreshTokenMatchingOrganization', tokenWithRefreshTokenMatchingOrganization)

    if (tokenWithRefreshTokenMatchingOrganization) {
      return tokenWithRefreshTokenMatchingOrganization.body;
    }

    return;
  }

  async updateCacheAndGetRefreshToken(entry: WrappedCacheEntry, cacheKey: CacheKey): Promise<WrappedCacheEntry | undefined> {
    if (!entry.body.refresh_token) {
      await this.removeEntryFromCache(cacheKey);
      return;
    }

    entry.body = {
      refresh_token: entry.body.refresh_token,
    };

    await this.cache.set(cacheKey.toKey(), entry);

    return entry;
  };

  async removeEntryFromCache(cacheKey: CacheKey): Promise<void> {
    await this.cache.remove(cacheKey.toKey());
    await this.keyManifest?.remove(cacheKey.toKey());
  }

  async getActiveTokenMatchingAudienceScopeOrganization(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
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

  async getInactiveTokenMatchingAudienceScopeOrganization(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
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
      return this.updateCacheAndGetRefreshToken(entry, cacheKey);
    }

    return entry;
  }

  async getTokenWithRefreshTokenMatchingAudienceOrganization(
    keyToMatch: CacheKey,
    keys: string[],
    expiryAdjustmentSeconds: number,
  ): Promise<WrappedCacheEntry | undefined> {
    const foundKey = keys.find((storageKey) => {
      return CacheManagerUtils.hasDefaultParameters(storageKey, keyToMatch)
        && CacheManagerUtils.hasMatchingAudience(storageKey, keyToMatch)
        && CacheManagerUtils.hasMatchingOrganization()
        && CacheManagerUtils.hasCompatibleScopes(storageKey, keyToMatch)
    });

    if (!foundKey) return undefined;

    const entry = await this.cache.get<WrappedCacheEntry>(foundKey);

    if (!entry) return undefined;

    const isExpired = await CacheManagerUtils.isTokenExpired(
      entry,
      expiryAdjustmentSeconds,
      this.nowProvider,
    );

    if (isExpired) {
      return this.updateCacheAndGetRefreshToken(entry, keyToMatch);
    }

    return entry;
  }

  async getTokenWithRefreshTokenMatchingOrganization(
    keyToMatch: CacheKey,
    keys: string[],
  ): Promise<WrappedCacheEntry | undefined> {
    const foundKey = keys.find((storageKey) => {
      return CacheManagerUtils.hasDefaultParameters(storageKey, keyToMatch)
        && CacheManagerUtils.hasMatchingOrganization()
        && CacheManagerUtils.hasAudience(storageKey)
    });

    if (!foundKey) return undefined;

    const entry = await this.cache.get<WrappedCacheEntry>(foundKey);

    if (!entry || !entry.body.refresh_token) return undefined;

    entry.body = {
      refresh_token: entry.body.refresh_token,
      scope: keyToMatch.scope,
      audience: keyToMatch.audience,
    };

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
