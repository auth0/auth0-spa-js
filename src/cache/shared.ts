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

  static fromCacheEntry(entry: CacheEntry): CacheKey {
    const { scope, audience, client_id } = entry;

    return new CacheKey({
      scope,
      audience,
      client_id
    });
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

export interface WrappedCacheEntry {
  body: Partial<CacheEntry>;
  expiresAt: number;
}

export interface KeyManifestEntry {
  keys: string[];
}

export type Cacheable = WrappedCacheEntry | KeyManifestEntry;

/* This is not used internally but could serve useful for those that
   implement their own caches */
export function isWrappedCacheEntry(value: any): value is WrappedCacheEntry {
  const maybeCacheEntry: WrappedCacheEntry = value;

  if (maybeCacheEntry.body && maybeCacheEntry.expiresAt) {
    return true;
  }

  return false;
}

/* This is not used internally but could serve useful for those that
   implement their own caches */
export function isKeyManifestEntry(value: any): value is KeyManifestEntry {
  const maybeKeyManifestEntry: KeyManifestEntry = value;

  if (maybeKeyManifestEntry.keys && Array.isArray(maybeKeyManifestEntry.keys)) {
    return true;
  }

  return false;
}

export interface ICache {
  set<T = Cacheable>(key: string, entry: T): Promise<void>;
  get<T = Cacheable>(key: string): Promise<T>;
  remove(key: string): Promise<void>;
}
