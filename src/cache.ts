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

const createKey = (e: CacheKeyData) => `${e.audience}::${e.scope}`;

const getExpirationTimeoutInMilliseconds = (expiresIn: number, exp: number) => {
  const expTime =
    (new Date(exp * 1000).getTime() - new Date().getTime()) / 1000;
  return Math.min(expiresIn, expTime) * 1000 * 0.8;
};

export default class Cache {
  cache: CachedTokens = {};
  public save(entry: CacheEntry) {
    const key = createKey(entry);
    this.cache[key] = entry;
    const timeout = getExpirationTimeoutInMilliseconds(
      entry.expires_in,
      entry.decodedToken.claims.exp
    );
    setTimeout(() => {
      delete this.cache[key];
    }, timeout);
  }
  public get(key: CacheKeyData) {
    return this.cache[createKey(key)];
  }
}
