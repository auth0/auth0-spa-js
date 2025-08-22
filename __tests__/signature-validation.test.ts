import { fetchJWKS, findJWKByKid, jwkToCryptoKey } from '../src/utils';
import { JWKS, JWK } from '../src/global';

// Mock crypto for testing
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
    },
  },
});

describe('Signature Validation Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchJWKS', () => {
    it('should fetch JWKS successfully', async () => {
      const mockJWKS: JWKS = {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJWKS),
      });

      const result = await fetchJWKS('https://example.com/');
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/.well-known/jwks.json');
      expect(result).toEqual(mockJWKS);
    });

    it('should handle trailing slash in issuer URL', async () => {
      const mockJWKS: JWKS = { keys: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockJWKS),
      });

      await fetchJWKS('https://example.com/');
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/.well-known/jwks.json');
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchJWKS('https://example.com/'))
        .rejects.toThrow('Failed to fetch JWKS from https://example.com/.well-known/jwks.json: 404 Not Found');
    });

    it('should throw error when JWKS is invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'structure' }),
      });

      await expect(fetchJWKS('https://example.com/'))
        .rejects.toThrow('Invalid JWKS response from https://example.com/.well-known/jwks.json: missing or invalid keys array');
    });

    it('should cache JWKS for 5 minutes', async () => {
      const mockJWKS: JWKS = { keys: [] };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJWKS),
      });

      // First call
      await fetchJWKS('https://example.com/');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await fetchJWKS('https://example.com/');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('findJWKByKid', () => {
    const mockJWKS: JWKS = {
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

  describe('jwkToCryptoKey', () => {
    const mockJWK: JWK = {
      kty: 'RSA',
      kid: 'test-kid',
      alg: 'RS256',
      n: 'test-n',
      e: 'AQAB'
    };

    it('should convert JWK to CryptoKey successfully', async () => {
      const mockCryptoKey = { type: 'public' };
      (global.crypto.subtle.importKey as jest.Mock).mockResolvedValueOnce(mockCryptoKey);

      const result = await jwkToCryptoKey(mockJWK);
      expect(result).toBe(mockCryptoKey);
      expect(global.crypto.subtle.importKey).toHaveBeenCalledWith(
        'jwk',
        {
          kty: 'RSA',
          n: 'test-n',
          e: 'AQAB',
          alg: 'RS256',
          use: 'sig'
        },
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: { name: 'SHA-256' }
        },
        false,
        ['verify']
      );
    });

    it('should throw error for unsupported key type', async () => {
      const ecJWK = { ...mockJWK, kty: 'EC' };
      await expect(jwkToCryptoKey(ecJWK))
        .rejects.toThrow('Unsupported key type: EC. Only RSA keys are supported.');
    });

    it('should throw error for missing n parameter', async () => {
      const invalidJWK = { ...mockJWK, n: undefined };
      await expect(jwkToCryptoKey(invalidJWK))
        .rejects.toThrow('Invalid RSA JWK: missing n or e parameter');
    });

    it('should throw error for missing e parameter', async () => {
      const invalidJWK = { ...mockJWK, e: undefined };
      await expect(jwkToCryptoKey(invalidJWK))
        .rejects.toThrow('Invalid RSA JWK: missing n or e parameter');
    });

    it('should throw error for unsupported algorithm', async () => {
      const unsupportedJWK = { ...mockJWK, alg: 'HS256' };
      await expect(jwkToCryptoKey(unsupportedJWK))
        .rejects.toThrow('Unsupported algorithm: HS256. Only RSA signature algorithms are supported.');
    });

    it('should handle crypto import error', async () => {
      (global.crypto.subtle.importKey as jest.Mock).mockRejectedValueOnce(new Error('Import failed'));

      await expect(jwkToCryptoKey(mockJWK))
        .rejects.toThrow('Failed to convert JWK to CryptoKey: Import failed');
    });
  });
});
