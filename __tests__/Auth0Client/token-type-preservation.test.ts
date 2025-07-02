import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import { expect } from '@jest/globals';

import { setupFn, fetchResponse, loginWithRedirectFn } from './helpers';
import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN
} from '../constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

describe('Auth0Client - Token Type Preservation', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        }
      }
    ) as Location;

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.removeEventListener = jest.fn();

    mockWindow.crypto = {
      subtle: { digest: () => 'foo' },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    sessionStorage.clear();
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('Token Type Preservation - HTTP Level', () => {
    it('should preserve token_type when refreshing tokens via HTTP', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      // Perform login to set up authentication state with refresh token
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Mock HTTP refresh token response that includes token_type
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: 'new_access_token_with_type',
          refresh_token: 'new_refresh_token',
          expires_in: 3600,
          scope: 'openid profile email offline_access',
          token_type: 'Bearer' // This should be preserved
        })
      );

      const result = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true
      });

      // Verify token_type flows through the HTTP refresh flow
      expect(result).toMatchObject({
        access_token: 'new_access_token_with_type',
        token_type: 'Bearer'
      });

      // Verify actual HTTP call was made with refresh token grant
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestBodyString = mockFetch.mock.calls[0][1].body;
      expect(requestBodyString).toContain('grant_type=refresh_token');
    });

    it('should preserve token_type through cache storage after HTTP response', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      // Perform login to set up authentication state
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Mock HTTP response with token_type
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: 'cached_token',
          refresh_token: 'new_refresh_token',
          expires_in: 3600,
          scope: 'openid profile email offline_access',
          token_type: 'Bearer'
        })
      );

      // First call triggers HTTP request and caching
      await auth0.getTokenSilently({ cacheMode: 'off' });

      // Second call should use cache without HTTP - this tests cache preservation
      const cachedResult = await auth0.getTokenSilently({
        detailedResponse: true
      });

      // Verify token_type is preserved in cached response
      expect(cachedResult).toMatchObject({
        access_token: 'cached_token',
        token_type: 'Bearer'
      });

      // Only one HTTP call should have been made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTP response without token_type gracefully', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      // Perform login to set up authentication state
      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Mock HTTP response WITHOUT token_type (backward compatibility)
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: 'token_without_type',
          refresh_token: TEST_REFRESH_TOKEN,
          expires_in: 3600,
          scope: 'openid profile email offline_access'
          // Note: no token_type field
        })
      );

      const result = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true
      });

      // Should work without token_type (graceful degradation)
      expect(result).toMatchObject({
        access_token: 'token_without_type'
      });
      expect(result.token_type).toBeUndefined();

      // Verify HTTP call was made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
