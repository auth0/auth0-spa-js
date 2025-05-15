import { DEFAULT_NOW_PROVIDER } from '../constants';
import CacheManagerUtils from './cache-manager-utils';
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
    // should we filter first by organization?

    // If we don't have any tokens in memory, we should request an AT
    const keys = await this.getCacheKeys();
    console.log('1- keys', keys)
    if (!keys) return;

    // active + audience + scope + organization
    const activeTokenMatchingAudienceScopeOrganization = await this.getActiveTokenMatchingAudienceScopeOrganization(cacheKey, expiryAdjustmentSeconds);
    console.log('2- activeTokenMatchingAudienceScopeOrganization', activeTokenMatchingAudienceScopeOrganization)
    if (activeTokenMatchingAudienceScopeOrganization) {
      return activeTokenMatchingAudienceScopeOrganization.body;
    }

    // RT + inactive + audience match + scope match + org
    const inactiveTokenMatchingAudienceScopeOrganization = await this.getInactiveTokenMatchingAudienceScopeOrganization(cacheKey, expiryAdjustmentSeconds);

    console.log('3- inactiveTokenMatchingAudienceScopeOrganization', inactiveTokenMatchingAudienceScopeOrganization)
    if (inactiveTokenMatchingAudienceScopeOrganization) {
      // Save temporaly the entry with the RT only
      return this.updateCacheAndGetRefreshToken(inactiveTokenMatchingAudienceScopeOrganization, cacheKey);

      //if inactive and without RT we remove it from memory
    } else {
      await this.removeEntryFromCache(cacheKey);
    }

    // RT + audience + organization match
    const tokenWithRefreshTokenMatchingAudienceOrganization = await this.getTokenWithRefreshTokenMatchingAudienceOrganization(
      cacheKey,
      keys,
    );

    console.log("4-tokenWithRefreshTokenMatchingAudienceOrganization", tokenWithRefreshTokenMatchingAudienceOrganization)
    if (tokenWithRefreshTokenMatchingAudienceOrganization) {
      // Save temporaly the entry with the RT only
      return this.updateCacheAndGetRefreshToken(tokenWithRefreshTokenMatchingAudienceOrganization, cacheKey);
    }

    console.log('5-no found')
    // no compatible tokenSet
    return;
  }

  async updateCacheAndGetRefreshToken(entry: WrappedCacheEntry, cacheKey: CacheKey): Promise<Partial<CacheEntry>> {
    entry.body = {
      refresh_token: entry.body.refresh_token,
    };

    await this.cache.set(cacheKey.toKey(), entry);

    return entry.body;
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

    if (!entry) {
      return undefined;
    }

    const isExpired = await CacheManagerUtils.isTokenExpired(
      entry,
      expiryAdjustmentSeconds,
      this.nowProvider
    );

    return isExpired && !entry.body.refresh_token ? undefined : entry;
  }

  async getTokenWithRefreshTokenMatchingAudienceOrganization(
    keyToMatch: CacheKey, keys: string[]
  ): Promise<WrappedCacheEntry | undefined> {
    const foundKey = keys.find((storageKey) => {
      return CacheManagerUtils.hasDefaultParameters(storageKey, keyToMatch)
        && CacheManagerUtils.hasMatchingAudience(storageKey, keyToMatch)
        && CacheManagerUtils.hasMatchingOrganization()
        && CacheManagerUtils.hasCompatibleTokens(storageKey, keyToMatch)
    });

    if (!foundKey) return undefined;

    const entry = await this.cache.get<WrappedCacheEntry>(foundKey);

    return entry?.body.refresh_token ? entry : undefined;
  }

  async get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS
  ): Promise<Partial<CacheEntry> | undefined> {
    let wrappedEntry = await this.cache.get<WrappedCacheEntry>(
      cacheKey.toKey()
    );

    if (!wrappedEntry) {
      const keys = await this.getCacheKeys();

      if (!keys) return;

      const matchedKey = this.matchExistingCacheKey(cacheKey, keys);

      if (matchedKey) {
        wrappedEntry = await this.cache.get<WrappedCacheEntry>(matchedKey);
      }
    }

    // If we still don't have an entry, exit.
    if (!wrappedEntry) {
      return;
    }

    const now = await this.nowProvider();
    const nowSeconds = Math.floor(now / 1000);

    if (wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds) {
      if (wrappedEntry.body.refresh_token) {
        wrappedEntry.body = {
          refresh_token: wrappedEntry.body.refresh_token
        };

        await this.cache.set(cacheKey.toKey(), wrappedEntry);
        return wrappedEntry.body;
      }

      await this.cache.remove(cacheKey.toKey());
      await this.keyManifest?.remove(cacheKey.toKey());

      return;
    }

    return wrappedEntry.body;
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

  /**
   * Finds the corresponding key in the cache based on the provided cache key.
   * The keys inside the cache are in the format {prefix}::{clientId}::{audience}::{scope}.
   * The first key in the cache that satisfies the following conditions is returned
   *  - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
   *  - `clientId` is strict equal to the `cacheKey.clientId`
   *  - `audience` is strict equal to the `cacheKey.audience`
   *  - `scope` contains at least all the `cacheKey.scope` values
   *  *
   * @param keyToMatch The provided cache key
   * @param allKeys A list of existing cache keys
   */
  private matchExistingCacheKey(keyToMatch: CacheKey, allKeys: Array<string>) {
    return allKeys.filter(key => {
      const cacheKey = CacheKey.fromKey(key);
      const scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(' '));
      const scopesToMatch = keyToMatch.scope?.split(' ') || [];

      const hasAllScopes =
        cacheKey.scope &&
        scopesToMatch.reduce(
          (acc, current) => acc && scopeSet.has(current),
          true
        );

      return (
        cacheKey.prefix === CACHE_KEY_PREFIX &&
        cacheKey.clientId === keyToMatch.clientId &&
        cacheKey.audience === keyToMatch.audience &&
        hasAllScopes
      );
    })[0];
  }
}
