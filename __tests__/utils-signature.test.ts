import { fetchJWKS, findJWKByKid } from '../src/utils';
import { expect } from '@jest/globals';

// Test utility functions in isolation first
describe('Signature validation utils', () => {
  const mockFetch = <jest.Mock>fetch;
  
  beforeEach(() => {
    (<any>global).fetch = mockFetch;
    mockFetch.mockClear();
  });

  describe('fetchJWKS', () => {
    it('should fetch JWKS successfully', async () => {
      const mockJWKS = {
        keys: [
          {
            kty: 'RSA',
            kid: 'test-kid',
            use: 'sig',
            alg: 'RS256',
            n: 'test-n',
            e: 'AQAB'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJWKS),
      });

      const result = await fetchJWKS('https://example.com/');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/.well-known/jwks.json');
      expect(result).toEqual(mockJWKS);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchJWKS('https://example.com/'))
        .rejects.toThrow('Failed to fetch JWKS from https://example.com/.well-known/jwks.json: 404 Not Found');
    });
  });

  describe('findJWKByKid', () => {
    const mockJWKS = {
      keys: [
        {
          kty: 'RSA',
          kid: 'key1',
          n: 'test-n-1',
          e: 'AQAB'
        },
        {
          kty: 'RSA',
          kid: 'key2',
          n: 'test-n-2',
          e: 'AQAB'
        }
      ]
    };

    it('should find key by kid', () => {
      const result = findJWKByKid(mockJWKS, 'key1');
      expect(result).toEqual(mockJWKS.keys[0]);
    });

    it('should return undefined for non-existent kid', () => {
      const result = findJWKByKid(mockJWKS, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
