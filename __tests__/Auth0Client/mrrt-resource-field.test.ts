import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';

import {
  fetchResponse,
  setupFn,
  loginWithRedirectFn
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_TOKEN_TYPE
} from '../constants';

import { MrrtResourceMismatchError } from '../../src/errors';
import { expect } from '@jest/globals';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue('TEST_CODE_CHALLENGE');

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

describe('Auth0Client - MRRT resource field', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: { configurable: true, value: jest.fn() },
        replace: { configurable: true, value: jest.fn() }
      }
    ) as Location;

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.crypto = {
      subtle: { digest: () => 'foo' },
      getRandomValues() { return '123'; }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('resource field in verbose response', () => {
    it('includes resource in detailedResponse when server returns it on a fresh fetch', async () => {
      const audience = 'https://api.example.com';
      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: audience
        })
      );

      const result = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      expect(result.resource).toBe(audience);
    });

    it('includes resource in detailedResponse when served from cache', async () => {
      const audience = 'https://api.example.com';
      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Prime the cache with a resource field
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: audience
        })
      );

      await auth0.getTokenSilently({
        cacheMode: 'off',
        authorizationParams: { audience, scope: 'openid profile' }
      });

      // Second call should come from cache
      const result = await auth0.getTokenSilently({
        detailedResponse: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      expect(result.resource).toBe(audience);
    });

    it('omits resource from detailedResponse when server does not return it', async () => {
      const audience = 'https://api.example.com';
      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400
          // no resource field
        })
      );

      const result = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      expect(result.resource).toBeUndefined();
    });
  });

  describe('resource field audience validation', () => {
    it('throws MrrtResourceMismatchError when resource does not match requested audience', async () => {
      const requestedAudience = 'https://api.example.com';
      const receivedResource = 'https://api.other.com';

      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: receivedResource
        })
      );

      await expect(
        auth0.getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
        })
      ).rejects.toThrow(MrrtResourceMismatchError);
    });

    it('MrrtResourceMismatchError carries requested and received audiences', async () => {
      const requestedAudience = 'https://api.example.com';
      const receivedResource = 'https://api.other.com';

      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: receivedResource
        })
      );

      const error = await auth0
        .getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
        })
        .catch(e => e);

      expect(error).toBeInstanceOf(MrrtResourceMismatchError);
      expect(error.requested).toBe(requestedAudience);
      expect(error.received).toBe(receivedResource);
      expect(error.error).toBe('mrrt_resource_mismatch');
    });

    it('does not throw when resource matches requested audience', async () => {
      const audience = 'https://api.example.com';

      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: audience
        })
      );

      await expect(
        auth0.getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience, scope: 'openid profile' }
        })
      ).resolves.toBeDefined();
    });

    it('skips validation when useMrrt is false even if server returns resource', async () => {
      const requestedAudience = 'https://api.example.com';
      const receivedResource = 'https://api.other.com';

      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: false,
        authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          resource: receivedResource
        })
      );

      await expect(
        auth0.getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience: requestedAudience, scope: 'openid profile' }
        })
      ).resolves.toBeDefined();
    });

    it('skips validation when resource is absent', async () => {
      const audience = 'https://api.example.com';

      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        authorizationParams: { audience, scope: 'openid profile' }
      });

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400
          // no resource
        })
      );

      await expect(
        auth0.getTokenSilently({
          cacheMode: 'off',
          authorizationParams: { audience, scope: 'openid profile' }
        })
      ).resolves.toBeDefined();
    });
  });
});
