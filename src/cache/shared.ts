import { IdToken, User } from '../global';

export const CACHE_KEY_PREFIX = '@@auth0spajs@@';

export interface CacheKeyData {
  audience: string;
  scope: string;
  client_id: string;
}

export class CacheKey {
  public client_id: string;
  public scope: string;
  public audience: string;

  constructor(data: CacheKeyData, public prefix: string = CACHE_KEY_PREFIX) {
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

export interface CacheEntry {
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
  set<T = unknown>(key: string, entry: T): Promise<void>;
  get<T = unknown>(key: string): Promise<T>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

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
export function findExistingCacheKey(
  cacheKey: CacheKey,
  existingCacheKeys: Array<string>
) {
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
      currentPrefix === CACHE_KEY_PREFIX &&
      currentClientId === client_id &&
      currentAudience === audience &&
      hasAllScopes
    );
  })[0];
}
