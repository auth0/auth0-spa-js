import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { MfaRequiredError } from '../../src/errors';

import { fetchResponse, loginWithRedirectFn, setupFn } from './helpers';

import {
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

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

const API_AUDIENCE = 'https://api.example.com';
const MY_ACCOUNT_AUDIENCE = 'https://auth0_domain/me/';
const MFA_TOKEN = 'mfa-token-abc123';

const requestBody = (body: string): Record<string, string> => {
  try {
    return JSON.parse(body);
  } catch {
    return Object.fromEntries(new URLSearchParams(body).entries());
  }
};

const refreshTokenSentInCall = (callNum: number) =>
  requestBody(mockFetch.mock.calls[callNum][1].body).refresh_token;

// Echoes the requested scope back: the MRRT path rejects a response that does
// not cover every scope it asked for.
const mockTokenResponse = (refresh_token: string) =>
  mockFetch.mockImplementationOnce((_url: string, init: { body: string }) =>
    fetchResponse(true, {
      id_token: TEST_ID_TOKEN,
      access_token: `access-token-for-${refresh_token}`,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 86400,
      scope: requestBody(init.body).scope
    })
  );

const mockMfaRequired = () =>
  mockFetch.mockResolvedValueOnce(
    fetchResponse(false, {
      error: 'mfa_required',
      error_description: 'Multifactor authentication required',
      mfa_token: MFA_TOKEN
    })
  );

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
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
    // --

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.removeEventListener = jest.fn();
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
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('_requestTokenForMfa', () => {
    it('propagates the refresh token rotated by the MFA grant to every MRRT cache entry', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useMrrt: true,
        cacheLocation: 'localstorage'
      });

      // Login: the API entry holds RT1.
      await loginWithRedirect(auth0, {
        authorizationParams: { audience: API_AUDIENCE, scope: 'openid profile' }
      });

      mockFetch.mockReset();

      // MRRT refresh for a second audience: both entries converge on RT2.
      mockTokenResponse('rt2');
      await auth0.getTokenSilently({
        authorizationParams: {
          audience: MY_ACCOUNT_AUDIENCE,
          scope: 'openid read:me:authentication_methods'
        },
        cacheMode: 'off'
      });

      // A write scope the tenant challenges: the exchange is refused with an
      // mfa_token, and the completion grant answers with RT3, rotating RT2 away.
      mockMfaRequired();
      await expect(
        auth0.getTokenSilently({
          authorizationParams: {
            audience: MY_ACCOUNT_AUDIENCE,
            scope: 'openid create:me:authentication_methods'
          },
          cacheMode: 'off'
        })
      ).rejects.toBeInstanceOf(MfaRequiredError);

      mockTokenResponse('rt3');
      await auth0.mfa.verify({ mfaToken: MFA_TOKEN, otp: '123456' });

      // The API entry, untouched by the MFA grant, must now refresh with RT3;
      // presenting RT2 would trip the server's reuse detection.
      mockTokenResponse('rt4');
      await auth0.getTokenSilently({
        authorizationParams: {
          audience: API_AUDIENCE,
          scope: 'openid profile'
        },
        cacheMode: 'off'
      });

      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(refreshTokenSentInCall(0)).toBe(TEST_REFRESH_TOKEN);
      expect(refreshTokenSentInCall(1)).toBe('rt2');
      expect(refreshTokenSentInCall(3)).toBe('rt3');
    });

    it('propagates the rotated refresh token to entries sharing it without MRRT', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      // Login with a broad scope: that entry holds RT1.
      await loginWithRedirect(auth0, {
        authorizationParams: {
          audience: API_AUDIENCE,
          scope: 'openid profile read:messages'
        }
      });

      mockFetch.mockReset();

      // A downscoped request has no entry of its own, so it borrows the broad
      // entry's RT1, is refused with an mfa_token, and the completion grant
      // answers with RT2 under the narrower key.
      mockMfaRequired();
      await expect(
        auth0.getTokenSilently({
          authorizationParams: { audience: API_AUDIENCE, scope: 'openid' },
          cacheMode: 'off'
        })
      ).rejects.toBeInstanceOf(MfaRequiredError);

      mockTokenResponse('rt2');
      await auth0.mfa.verify({ mfaToken: MFA_TOKEN, otp: '123456' });

      // The broad entry lent RT1 to the refused exchange, so it must move to RT2.
      mockTokenResponse('rt3');
      await auth0.getTokenSilently({
        authorizationParams: {
          audience: API_AUDIENCE,
          scope: 'openid profile read:messages'
        },
        cacheMode: 'off'
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(refreshTokenSentInCall(0)).toBe(TEST_REFRESH_TOKEN);
      expect(refreshTokenSentInCall(2)).toBe('rt2');
    });
  });
});
