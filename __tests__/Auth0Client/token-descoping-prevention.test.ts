import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

import {
  fetchResponse,
  setupFn,
  loginWithRedirectFn,
  getTokenSilentlyFn,
  assertPostFn
} from './helpers';

import {
  TEST_CODE_CHALLENGE,
  TEST_REFRESH_TOKEN,
  TEST_CLIENT_ID,
  TEST_REDIRECT_URI
} from '../constants';
import version from '../../src/version';

import { expect } from '@jest/globals';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
const getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);
const assertPost = assertPostFn(mockFetch);

/**
 * Test Suite: Access Token Descoping Prevention
 *
 * This test suite specifically validates that the SDK correctly handles scope parameters
 * to prevent "Access Token Descoping" issues in refresh token flows while still allowing
 * scope parameters for token exchange flows.
 *
 * Background:
 * - Refresh Token flows should NOT include 'scope' parameter to prevent descoping
 * - Token Exchange flows SHOULD include 'scope' parameter for proper authorization
 * - Including scope in refresh token requests can cause unexpected scope reduction
 */
describe('Auth0Client - Access Token Descoping Prevention', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
    delete (window as any).location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        },
        replace: {
          configurable: true,
          value: jest.fn()
        }
      }
    ) as Location;
    // --

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    jest.spyOn(scope, 'getUniqueScopes');
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('Refresh Token Flows - Scope Exclusion (Descoping Prevention)', () => {
    it('should exclude scope from refresh token requests to prevent Access Token Descoping', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'openid profile email read:records write:records', // Broad scope initially granted
          audience: 'https://api.example.com'
        }
      });

      // Perform initial login to establish refresh token
      await loginWithRedirect(auth0);

      // Reset mocks to focus on refresh token request
      mockFetch.mockReset();

      // Trigger token refresh
      await getTokenSilently(auth0, { cacheMode: 'off' });

      // CRITICAL: Verify that refresh token request excludes scope to prevent descoping
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: TEST_REFRESH_TOKEN
          // IMPORTANT: No 'scope' or 'audience' should be present to prevent descoping
        },
        {
          'Auth0-Client': btoa(
            JSON.stringify({ name: 'auth0-spa-js', version: version })
          )
        },
        0, // call number
        false // form data, not JSON
      );
    });

    it('should exclude scope even when getTokenSilently is called with cacheMode off', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'openid profile',
          audience: 'https://api.example.com'
        }
      });

      // Perform initial login to establish refresh token
      await loginWithRedirect(auth0);

      // Reset mocks to focus on refresh token request
      mockFetch.mockReset();

      // Call getTokenSilently with cacheMode off - should use refresh token without scope
      await getTokenSilently(auth0, {
        cacheMode: 'off'
      });

      // CRITICAL: Refresh token request should exclude scope to prevent descoping
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: TEST_REFRESH_TOKEN
          // IMPORTANT: No 'scope' should be present to prevent descoping
        },
        {
          'Auth0-Client': btoa(
            JSON.stringify({ name: 'auth0-spa-js', version: version })
          )
        },
        0, // call number
        false // form data, not JSON
      );
    });
  });

  describe('Token Exchange Flows - Scope Inclusion (Required for Authorization)', () => {
    it('should include scope and audience in token exchange requests', async () => {
      const auth0 = setup({
        authorizationParams: {
          scope: 'openid profile',
          audience: 'https://api.default.com'
        }
      });

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          access_token: 'exchanged-access-token',
          id_token: 'exchanged-id-token',
          expires_in: 3600,
          scope: 'openid profile read:records'
        })
      );

      // Perform token exchange
      await auth0.exchangeToken({
        subject_token: 'external-legacy-token',
        subject_token_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        audience: 'https://api.records.com', // Different audience for exchange
        scope: 'openid profile read:records write:records' // Specific scope for exchange
      });

      // CRITICAL: Verify scope and audience are included for token exchange
      // Find the token exchange request using mockFetch calls
      const tokenExchangeCall = mockFetch.mock.calls.find(([url, options]) => {
        if (!options?.body) return false;
        // Handle both JSON and form data
        try {
          const body = JSON.parse(options.body);
          return (
            body.grant_type ===
            'urn:ietf:params:oauth:grant-type:token-exchange'
          );
        } catch {
          const params = new URLSearchParams(options.body);
          return (
            params.get('grant_type') ===
            'urn:ietf:params:oauth:grant-type:token-exchange'
          );
        }
      });

      expect(tokenExchangeCall).toBeDefined();
      expect(tokenExchangeCall[0]).toBe('https://auth0_domain/oauth/token');

      // Parse the request body
      const options = tokenExchangeCall[1];
      let requestBody: any;
      try {
        requestBody = JSON.parse(options.body);
      } catch {
        // Handle form data
        const params = new URLSearchParams(options.body);
        requestBody = Object.fromEntries(params.entries());
      }

      // Verify scope and audience are included for token exchange
      expect(requestBody.scope).toBe(
        'openid profile read:records write:records'
      );
      expect(requestBody.audience).toBe('https://api.records.com');

      // Verify token exchange specific parameters
      expect(requestBody.grant_type).toBe(
        'urn:ietf:params:oauth:grant-type:token-exchange'
      );
      expect(requestBody.subject_token).toBe('external-legacy-token');
      expect(requestBody.subject_token_type).toBe(
        'urn:ietf:params:oauth:grant-type:jwt-bearer'
      );
    });
  });
});
