import { ICache } from '../../src/cache';

export interface CacheConstructor {
  new (): ICache;
}
