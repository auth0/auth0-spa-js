interface CacheKeyData {
  audience: string;
  scope: string;
}
interface DecodedToken {
  claims: IdToken;
  user: any;
}
interface CacheEntry extends CacheKeyData {
  id_token: string;
  access_token: string;
  expires_in: number;
  decodedToken: DecodedToken;
}
interface CachedTokens {
  [key: string]: CacheEntry;
}
export default class Cache {
  cache: CachedTokens;
  save(entry: CacheEntry): void;
  get(key: CacheKeyData): CacheEntry;
}
export {};
