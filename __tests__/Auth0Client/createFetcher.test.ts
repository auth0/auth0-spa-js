import { Auth0Client } from '../../src/Auth0Client';
import 'fake-indexeddb/auto';

(<any>global).crypto = { subtle: {} };

describe('Auth0Client', () => {
  let client: Auth0Client;

  beforeEach(() => {
    client = new Auth0Client({
      domain: 'test.auth0.com',
      clientId: 'abc123',
      useDpop: true
    });
  });

  describe('createFetcher', () => {
    it('retries with dpop nonce in JWT payload after 401 with dpop-nonce header', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockImplementationOnce(async () => {
          return {
            status: 401,
            headers: Object.entries({
              'dpop-nonce': 'test-nonce',
              'www-authenticate': `DPoP error="use_dpop_nonce"`
            })
          };
      });
      mockFetch.mockImplementationOnce(async () => {
        return {
          status: 200,
          headers: { get: () => undefined },
        };
      });
      (client as any).generateDpopProof = jest.fn().mockReturnValue('proof');
      const fetcher = client.createFetcher({
        dpopNonceId: 'nonce-id',
        getAccessToken: jest.fn().mockReturnValue('at'),
        fetch: mockFetch,
      });

      await fetcher.fetchWithAuth('https://api.example.com/data');

      const retry = (client as any).generateDpopProof.mock.calls[1][0];
      expect(retry.nonce).toBe('test-nonce');
    });

    it('retries with expired dpop nonce', async () => {
      const mockFetch = jest.fn();
      mockFetch.mockImplementationOnce(async () => {
          return {
            status: 401,
            headers: Object.entries({
              'dpop-nonce': 'test-nonce',
              'www-authenticate': `DPoP error="invalid_dpop_nonce" error_description="DPoP nonce is too old"`
            })
          };
      });
      mockFetch.mockImplementationOnce(async () => {
        return {
          status: 200,
          headers: { get: () => undefined },
        };
      });
      (client as any).generateDpopProof = jest.fn().mockReturnValue('proof');
      const fetcher = client.createFetcher({
        dpopNonceId: 'nonce-id',
        getAccessToken: jest.fn().mockReturnValue('at'),
        fetch: mockFetch,
      });

      await fetcher.fetchWithAuth('https://api.example.com/data');

      const retry = (client as any).generateDpopProof.mock.calls[1][0];
      expect(retry.nonce).toBe('test-nonce');
    });

  });

});
