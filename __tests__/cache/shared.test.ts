import { isKeyManifestEntry, isWrappedCacheEntry } from '../../src/cache';
import { TEST_ID_TOKEN } from '../constants';

describe('Shared cache utils', () => {
  describe('isWrappedCacheEntry', () => {
    it('returns true if the object exhibits the properties of a WrappedCacheEntry', () => {
      const obj = {
        body: {
          id_token: TEST_ID_TOKEN
        },
        expiresAt: 123
      };

      expect(isWrappedCacheEntry(obj)).toBeTruthy();
    });

    it('returns false if not a wrapped cache entry', () => {
      expect(isWrappedCacheEntry({})).toBeFalsy();
    });
  });

  describe('isKeyManifestEntry', () => {
    it('returns true if the object exhibits the properties of a KeyManifestEntry', () => {
      const obj = {
        keys: ['key-1']
      };

      expect(isKeyManifestEntry(obj)).toBeTruthy();
    });

    it('returns false if the object is not a KeyManifestEntry', () => {
      expect(isKeyManifestEntry({})).toBeFalsy();
    });
  });
});
