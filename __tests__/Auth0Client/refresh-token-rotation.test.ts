import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { fetchResponse, setupFn, loginWithRedirectFn } from './helpers';
import {
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_REDIRECT_URI,
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

describe('Auth0Client - Refresh Token Rotation', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // Mock window.location.assign properly
    delete window.location;
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

  it('should handle refresh token rotation by using new tokens correctly', async () => {
    const auth0 = setup({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      authorizationParams: {
        redirect_uri: TEST_REDIRECT_URI
      },
      useRefreshTokens: true,
      cacheLocation: 'localstorage'
    });

    // Step 1: Initial login to establish cache
    await loginWithRedirect(auth0);
    mockFetch.mockClear();

    // Step 2: Mock first refresh request that triggers token rotation
    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: 'new-rotated-refresh-token', // New token due to rotation
        access_token: 'new-access-token-1',
        expires_in: 86400,
        scope: 'openid profile'
      })
    );

    // First call with cacheMode: 'off' to force refresh
    const token1 = await auth0.getTokenSilently({
      cacheMode: 'off',
      authorizationParams: {
        scope: 'openid profile'
      }
    });

    expect(token1).toBe('new-access-token-1');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify the refresh token was used in the request
    const firstCallBody: any = Array.from(new URLSearchParams(mockFetch.mock.calls[0][1].body).entries()).reduce(
      (acc, curr) => ({ ...acc, [curr[0]]: curr[1] }),
      {}
    );
    expect(firstCallBody.grant_type).toBe('refresh_token');
    expect(firstCallBody.refresh_token).toBe(TEST_REFRESH_TOKEN);

    mockFetch.mockClear();

    // Step 3: Mock second refresh request - should use the NEW rotated token
    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: 'another-new-refresh-token',
        access_token: 'new-access-token-2',
        expires_in: 86400,
        scope: 'openid profile' // Different scope subset
      })
    );

    // Second call with different scope to force another refresh
    const token2 = await auth0.getTokenSilently({
      cacheMode: 'off',
      authorizationParams: {
        scope: 'openid profile' // Different scope subset
      }
    });

    expect(token2).toBe('new-access-token-2');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify the NEW refresh token was used (not the old one)
    const secondCallBody: any = Array.from(new URLSearchParams(mockFetch.mock.calls[0][1].body).entries()).reduce(
      (acc, curr) => ({ ...acc, [curr[0]]: curr[1] }),
      {}
    );
    expect(secondCallBody.grant_type).toBe('refresh_token');
    expect(secondCallBody.refresh_token).toBe('new-rotated-refresh-token');
    
    // This is the key test: the second call should NOT use the original refresh token
    expect(secondCallBody.refresh_token).not.toBe(TEST_REFRESH_TOKEN);
  });

  it('should not break when refresh token rotation does not occur', async () => {
    const auth0 = setup({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      authorizationParams: {
        redirect_uri: TEST_REDIRECT_URI
      },
      useRefreshTokens: true,
      cacheLocation: 'localstorage'
    });

    await loginWithRedirect(auth0);
    mockFetch.mockClear();

    // Mock refresh request that returns the SAME refresh token (no rotation)
    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN, // Same token returned
        access_token: 'same-refresh-access-token',
        expires_in: 86400,
        scope: 'openid profile'
      })
    );

    const token = await auth0.getTokenSilently({
      cacheMode: 'off',
      authorizationParams: {
        scope: 'openid profile'
      }
    });

    expect(token).toBe('same-refresh-access-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify it still works correctly
    const callBody: any = Array.from(new URLSearchParams(mockFetch.mock.calls[0][1].body).entries()).reduce(
      (acc, curr) => ({ ...acc, [curr[0]]: curr[1] }),
      {}
    );
    expect(callBody.refresh_token).toBe(TEST_REFRESH_TOKEN);
  });
});
