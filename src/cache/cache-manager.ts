import { DEFAULT_NOW_PROVIDER } from '../constants';
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
    expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS,
    useMrrt = false,
    cacheMode?: string
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

      // To refresh using MRRT we need to send a request to the server
      // If cacheMode is 'cache-only', this will make us unable to call the server
      // so it won't be needed to find a valid refresh token
      if (!matchedKey && useMrrt && cacheMode !== 'cache-only') {
        return this.getEntryWithRefreshToken(cacheKey, keys);
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
        return this.modifiedCachedEntry(wrappedEntry, cacheKey);
      }

      await this.cache.remove(cacheKey.toKey());
      await this.keyManifest?.remove(cacheKey.toKey());

      return;
    }

    return wrappedEntry.body;
  }

  private async modifiedCachedEntry(wrappedEntry: WrappedCacheEntry, cacheKey: CacheKey): Promise<Partial<CacheEntry>> {
    // We need to keep audience and scope in order to check them later when doing refresh
    // using MRRT. See getScopeToRequest method.
    wrappedEntry.body = {
      refresh_token: wrappedEntry.body.refresh_token,
      audience: wrappedEntry.body.audience,
      scope: wrappedEntry.body.scope,
    };

    await this.cache.set(cacheKey.toKey(), wrappedEntry);

    return {
      refresh_token: wrappedEntry.body.refresh_token,
      audience: wrappedEntry.body.audience,
      scope: wrappedEntry.body.scope,
    };
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

  async remove(
    client_id: string,
    audience?: string,
    scope?: string,
  ): Promise<void> {
    const cacheKey = new CacheKey({
      clientId: client_id,
      scope: scope,
      audience: audience
    });

    await this.cache.remove(cacheKey.toKey());
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

  /**
   * Returns the first entry that contains a refresh_token that satisfies the following conditions
   * The keys inside the cache are in the format {prefix}::{clientId}::{audience}::{scope}.
   * - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
   * - `clientId` is strict equal to the `cacheKey.clientId`
   * @param keyToMatch The provided cache key
   * @param allKeys A list of existing cache keys
   */
  private async getEntryWithRefreshToken(keyToMatch: CacheKey, allKeys: Array<string>): Promise<Partial<CacheEntry> | undefined> {
    for (const key of allKeys) {
      const cacheKey = CacheKey.fromKey(key);

      if (cacheKey.prefix === CACHE_KEY_PREFIX &&
        cacheKey.clientId === keyToMatch.clientId) {
        const cachedEntry = await this.cache.get<WrappedCacheEntry>(key);

        if (cachedEntry?.body?.refresh_token) {
          return this.modifiedCachedEntry(cachedEntry, keyToMatch);
        }
      }
    }

    return undefined;
  }

  /**
   * Updates in the cache all entries that has a match with previous refresh_token with the
   * new refresh_token obtained from the server
   * @param oldRefreshToken Old refresh_token used on refresh
   * @param newRefreshToken New refresh_token obtained from the server after refresh
  */
  async updateEntry(
    oldRefreshToken: string,
    newRefreshToken: string,
  ): Promise<void> {
    const allKeys = await this.getCacheKeys();

    if (!allKeys) return;

    for (const key of allKeys) {
      const entry = await this.cache.get<WrappedCacheEntry>(key);

      if (entry?.body?.refresh_token === oldRefreshToken) {
        const cacheEntry = {
          ...entry.body,
          refresh_token: newRefreshToken,
        } as CacheEntry;

        await this.set(cacheEntry);
      }
    }
  }
}
