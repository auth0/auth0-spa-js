import { CACHE_KEY_PREFIX, CacheKey, WrappedCacheEntry } from "./shared";

/**
 * Finds the corresponding key in the cache based on the provided cache key.
 * The keys inside the cache are in the format {prefix}::{clientId}::{audience}::{scope}.
 * - `scope` contains at least all the `cacheKey.scope` values
 */
const hasCompatibleScopes = (key: string, keyToMatch: CacheKey): boolean => {
  const cacheKey = CacheKey.fromKey(key);
  const scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(' '));
  const scopesToMatch = keyToMatch.scope?.split(' ') || [];

  return cacheKey.scope
    ? scopesToMatch.reduce(
      (acc, current) => acc && scopeSet.has(current),
      true
    ) : false;
};

/**
 * Finds the corresponding key in the cache based on the provided cache key.
 * The keys inside the cache are in the format {prefix}::{clientId}::{audience}::{scope}.
 * - `audience` is strict equal to the `cacheKey.audience`
 */
const hasMatchingAudience = (key: string, keyToMatch: CacheKey): boolean => {
  const cacheKey = CacheKey.fromKey(key);

  return cacheKey.audience === keyToMatch.audience
};

// TODO-ari: remove that. Only created for testing purposes
const hasAudience = (key: string): boolean => {
  const cacheKey = CacheKey.fromKey(key);

  return cacheKey.audience !== '@@user@@';
}

/**
 * Finds the corresponding key in the cache based on the provided cache key.
 * The keys inside the cache are in the format {prefix}::{clientId}::{audience}::{scope}.
 * - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
 * - `clientId` is strict equal to the `cacheKey.clientId`
 */
const hasDefaultParameters = (key: string, keyToMatch: CacheKey): boolean => {
  const cacheKey = CacheKey.fromKey(key);

  return cacheKey.prefix === CACHE_KEY_PREFIX
    && cacheKey.clientId === keyToMatch.clientId;
};

const hasMatchingOrganization = (): boolean => {
  return true;
};

const isTokenExpired = async (
  entry: WrappedCacheEntry,
  expiryAdjustmentSeconds: number,
  nowProvider: () => number | Promise<number>
): Promise<boolean> => {
  const now = await nowProvider();
  const nowSeconds = Math.floor(now / 1000);

  return entry.expiresAt - expiryAdjustmentSeconds < nowSeconds;
};

const isMatchingKey = (
  storageKey: string,
  keyToMatch: CacheKey,
): boolean => {
  return CacheManagerUtils.hasMatchingAudience(storageKey, keyToMatch)
    && CacheManagerUtils.hasMatchingOrganization()
    && CacheManagerUtils.hasCompatibleScopes(storageKey, keyToMatch);
}

const findKey = (
  keys: string[],
  keyToMatch: CacheKey,
): string | undefined => {
  return keys.find((storageKey) => {
    return CacheManagerUtils.hasDefaultParameters(storageKey, keyToMatch)
      && CacheManagerUtils.isMatchingKey(storageKey, keyToMatch)
  });
}

export const CacheManagerUtils = {
  hasCompatibleScopes,
  hasMatchingAudience,
  hasDefaultParameters,
  hasMatchingOrganization,
  isTokenExpired,
  findKey,
  isMatchingKey,
  hasAudience,
};
