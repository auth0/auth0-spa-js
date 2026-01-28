import { Auth0Client } from '../../src/Auth0Client';
import { expect } from '@jest/globals';
import { setupFn, getTokenSilentlyFn } from './helpers';
import { verify } from '../../src/jwt';
import * as utils from '../../src/utils';

// Mock the utils module
jest.mock('../../src/utils');

// Mock the other dependencies
jest.mock('../../src/jwt');
jest.mock('../../src/transaction-manager');
jest.mock('../../src/worker/token.worker');
jest.mock('../../src/storage', () => ({
  CookieStorageWithLegacySameSite: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  }
}));

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

describe('Auth0Client - Event Origin Extraction', () => {
  let auth0Client: Auth0Client;
  let setup: ReturnType<typeof setupFn>;
  let getTokenSilently: ReturnType<typeof getTokenSilentlyFn>;

  beforeEach(() => {
    // Set up the helper functions
    setup = setupFn(mockVerify);
    getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);

    // Setup utils mocks
    jest.spyOn(utils, 'createQueryParams').mockReturnValue('query=params');
    jest.spyOn(utils, 'encode').mockReturnValue('encoded-state');
    jest.spyOn(utils, 'createRandomString').mockReturnValue('random-string');
    jest
      .spyOn(utils, 'sha256')
      .mockReturnValue(Promise.resolve('array-buffer'));
    jest
      .spyOn(utils, 'bufferToBase64UrlEncoded')
      .mockReturnValue('base64-encoded');
    jest.spyOn(utils, 'validateCrypto').mockReturnValue(undefined);
    jest.spyOn(utils, 'getDomain').mockImplementation((domain: string) => {
      if (!/^https?:\/\//.test(domain)) {
        return `https://${domain}`;
      }
      return domain;
    });

    jest.spyOn(utils, 'runIframe').mockReturnValue(
      Promise.resolve({
        state: 'encoded-state',
        code: 'test-code'
      })
    );

    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('when domainUrl is a valid URL', () => {
    it('should extract origin correctly and pass it to runIframe', async () => {
      // Create client with a valid domain URL
      auth0Client = setup({
        domain: 'https://example.auth0.com',
        authorizeTimeoutInSeconds: 60
      });

      // Mock cache to return undefined (no cached token)
      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      // Call getTokenSilently which internally calls _getTokenFromIFrame
      await getTokenSilently(auth0Client);

      // Verify that runIframe was called with the correct origin
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String), // authorize URL
        'https://example.auth0.com', // extracted origin
        60, // timeout
        'web_message', // response_mode
        expect.any(String) // redirect_uri
      );
    });

    it('should extract origin from domain with path', async () => {
      // Create client with domain that has a path
      auth0Client = setup({
        domain: 'https://example.auth0.com/path',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      await getTokenSilently(auth0Client);

      // Should extract just the origin, not the full URL with path
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://example.auth0.com', // origin without path
        60,
        'web_message',
        expect.any(String)
      );
    });

    it('should extract origin from domain with port', async () => {
      // Create client with domain that has a port
      auth0Client = setup({
        domain: 'https://localhost:3000',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      await getTokenSilently(auth0Client);

      // Should include the port in the origin
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://localhost:3000',
        60,
        'web_message',
        expect.any(String)
      );
    });
  });

  describe('when domainUrl is not a valid URL', () => {
    it('should fall back to original domainUrl for invalid domain', async () => {
      // Create client with an invalid domain (like in tests)
      auth0Client = setup({
        domain: 'auth0_domain',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      await getTokenSilently(auth0Client);

      // Should fall back to the processed domainUrl (https://auth0_domain)
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://auth0_domain', // fallback to original domainUrl
        60,
        'web_message',
        expect.any(String)
      );
    });

    it('should fall back to original domainUrl for malformed URL', async () => {
      // Create client with a malformed URL
      auth0Client = setup({
        domain: 'not-a-valid-url',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      await getTokenSilently(auth0Client);

      // Should fall back to the processed domainUrl
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://not-a-valid-url', // fallback to original domainUrl
        60,
        'web_message',
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    it('should not throw error when URL constructor fails', async () => {
      // Create client with an invalid domain
      auth0Client = setup({
        domain: 'invalid-domain',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      // This should not throw an error despite invalid URL
      await expect(getTokenSilently(auth0Client)).resolves.toBeDefined();

      // Verify that runIframe was still called
      expect(utils.runIframe).toHaveBeenCalled();
    });
  });

  describe('integration with existing error handling', () => {
    it('should handle login_required error with valid URL', async () => {
      auth0Client = setup({
        domain: 'https://example.auth0.com',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      // Mock runIframe to throw login_required error
      (utils.runIframe as jest.Mock).mockRejectedValue({
        error: 'login_required',
        error_description: 'Login required'
      });

      // Mock logout method
      const mockLogout = jest.fn();
      auth0Client.logout = mockLogout;

      await expect(getTokenSilently(auth0Client)).rejects.toMatchObject({
        error: 'login_required'
      });

      // Verify that runIframe was called with correct origin
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://example.auth0.com',
        60,
        'web_message',
        expect.any(String)
      );

      // Verify that logout was called
      expect(mockLogout).toHaveBeenCalledWith({ openUrl: false });
    });

    it('should handle login_required error with invalid URL', async () => {
      auth0Client = setup({
        domain: 'auth0_domain',
        authorizeTimeoutInSeconds: 60
      });

      const mockCacheGet = jest.fn().mockReturnValue(undefined);
      (auth0Client as any).cache = { get: mockCacheGet };

      // Mock runIframe to throw login_required error
      (utils.runIframe as jest.Mock).mockRejectedValue({
        error: 'login_required',
        error_description: 'Login required'
      });

      // Mock logout method
      const mockLogout = jest.fn();
      auth0Client.logout = mockLogout;

      await expect(getTokenSilently(auth0Client)).rejects.toMatchObject({
        error: 'login_required'
      });

      // Verify that runIframe was called with fallback domainUrl
      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        'https://auth0_domain',
        60,
        'web_message',
        expect.any(String)
      );

      // Verify that logout was called
      expect(mockLogout).toHaveBeenCalledWith({ openUrl: false });
    });
  });
});
