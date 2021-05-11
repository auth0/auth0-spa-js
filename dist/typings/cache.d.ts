import { IdToken, User } from './global';
interface CacheKeyData {
  audience: string;
  scope: string;
  client_id: string;
}
export declare class CacheKey {
  prefix: string;
  client_id: string;
  scope: string;
  audience: string;
  constructor(data: CacheKeyData, prefix?: string);
  toKey(): string;
  static fromKey(key: string): CacheKey;
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
export declare class LocalStorageCache implements ICache {
  save(entry: CacheEntry): void;
  get(
    cacheKey: CacheKey,
    expiryAdjustmentSeconds?: number
  ): Partial<CacheEntry> | undefined;
  clear(): void;
  /**
   * Retrieves data from local storage and parses it into the correct format
   * @param cacheKey The cache key
   */
  private readJson;
  /**
   * Writes the payload as JSON to localstorage
   * @param cacheKey The cache key
   * @param payload The payload to write as JSON
   */
  private writeJson;
  /**
   * Produce a copy of the payload with everything removed except the refresh token
   * @param payload The payload
   */
  private stripData;
}
export declare class InMemoryCache {
  enclosedCache: ICache;
}
export {};
