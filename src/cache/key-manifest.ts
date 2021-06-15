import { CACHE_KEY_PREFIX, ICache, CacheKey, KeyManifestEntry } from './shared';

export class CacheKeyManifest {
  private readonly manifestKey: string;

  constructor(private cache: ICache, private clientId: string) {
    this.manifestKey = this.createManifestKeyFrom(clientId);
  }

  async add(key: string): Promise<void> {
    const existingEntry = await this.cache.get<KeyManifestEntry>(
      this.manifestKey
    );

    if (!existingEntry) {
      return await this.cache.set<KeyManifestEntry>(this.manifestKey, {
        keys: [key]
      });
    }

    if (!existingEntry.keys.includes(key)) {
      existingEntry.keys.push(key);
      await this.cache.set<KeyManifestEntry>(this.manifestKey, existingEntry);
    }
  }

  async remove(key: string): Promise<void> {
    const existingEntry = await this.cache.get<KeyManifestEntry>(
      this.manifestKey
    );

    if (existingEntry) {
      const index = existingEntry.keys.indexOf(key);

      if (index > -1) {
        existingEntry.keys.splice(index, 1);
      }

      if (existingEntry.keys.length > 0) {
        return await this.cache.set(this.manifestKey, existingEntry);
      }

      return await this.cache.remove(this.manifestKey);
    }
  }

  get(): Promise<KeyManifestEntry> {
    const manifestKey = this.createManifestKeyFrom(this.clientId);
    return this.cache.get<KeyManifestEntry>(manifestKey);
  }

  clear(): Promise<void> {
    const manifestKey = this.createManifestKeyFrom(this.clientId);
    return this.cache.remove(manifestKey);
  }

  private createManifestKeyFrom(clientId: string): string {
    return `${CACHE_KEY_PREFIX}::${clientId}`;
  }
}
