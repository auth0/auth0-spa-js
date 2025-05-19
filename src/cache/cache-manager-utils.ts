import { CACHE_KEY_PREFIX, CacheKey, WrappedCacheEntry } from "./shared";

const CacheManagerUtils = {
  hasCompatibleScopes(key: string, keyToMatch: CacheKey): boolean {
    const cacheKey = CacheKey.fromKey(key);
    const scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(' '));
    const scopesToMatch = keyToMatch.scope?.split(' ') || [];

    return cacheKey.scope
      ? scopesToMatch.reduce(
        (acc, current) => acc && scopeSet.has(current),
        true
      ) : false;
  },
  hasMatchingAudience(key: string, keyToMatch: CacheKey): boolean {
    const cacheKey = CacheKey.fromKey(key);

    return cacheKey.audience === keyToMatch.audience
  },
  hasDefaultParameters(key: string, keyToMatch: CacheKey): boolean {
    const cacheKey = CacheKey.fromKey(key);

    return cacheKey.prefix === CACHE_KEY_PREFIX
      && cacheKey.clientId === keyToMatch.clientId;
  },
  hasMatchingOrganization(): boolean {
    return true;
  },
  async isTokenExpired(
    entry: WrappedCacheEntry,
    expiryAdjustmentSeconds: number,
    nowProvider: () => number | Promise<number>
  ): Promise<boolean> {
    const now = await nowProvider();
    const nowSeconds = Math.floor(now / 1000);

    return entry.expiresAt - expiryAdjustmentSeconds < nowSeconds;
  },
};

export default CacheManagerUtils;
