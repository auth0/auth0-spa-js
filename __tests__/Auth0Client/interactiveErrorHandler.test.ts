import { expect } from '@jest/globals';
import { MessageChannel } from 'worker_threads';
import * as http from '../../src/http';
import { verify } from '../../src/jwt';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore
import { acquireLockSpy } from 'browser-tabs-lock';

import {
  fetchResponse,
  loginWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_STATE,
  TEST_TOKEN_TYPE
} from '../constants';

import { GenericError, MfaRequiredError } from '../../src/errors';
import { MFA_STEP_UP_ERROR_DESCRIPTION } from '../../src/constants';

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
jest.spyOn(http, 'switchFetch');

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

const TEST_AUDIENCE = 'https://api.example.com';

/**
 * Sets up the popup mock so that window.addEventListener('message', cb)
 * fires the authorization_response. Unlike setupMessageEventLister, this
 * handles the case where addEventListener is also called for 'pagehide'
 * by the lock management code.
 */
const setupPopupMock = (mockWin: any, response: any = {}) => {
  // Use mockImplementation (not Once) so it persists across multiple
  // addEventListener calls. Only the 'message' type triggers the callback.
  mockWin.addEventListener.mockImplementation((type: string, cb: Function) => {
    if (type === 'message') {
      setTimeout(() => {
        cb({
          data: {
            type: 'authorization_response',
            response
          }
        });
      }, 0);
    }
  });

  mockWin.open.mockReturnValue({
    close: () => { },
    location: {
      href: ''
    }
  });
};

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
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
  });

  afterEach(() => {
    mockFetch.mockReset();
    acquireLockSpy.mockResolvedValue(true);
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('interactiveErrorHandler', () => {
    describe('popup mode', () => {
      it('should open popup when getTokenSilently receives mfa_required error', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          interactiveErrorHandler: 'popup'
        });

        // Login with the target audience so refresh token is stored for it
        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          }
        });

        mockFetch.mockReset();

        // The refresh token grant returns mfa_required
        mockFetch.mockResolvedValueOnce(
          fetchResponse(false, {
            error: 'mfa_required',
            error_description: 'MFA is required',
            mfa_token: 'mfa_token_123',
            mfa_requirements: { challenge: [{ type: 'otp' }] }
          })
        );

        // Set up popup mock (must happen before getTokenSilently triggers loginWithPopup)
        setupPopupMock(mockWindow, {
          code: 'my_code',
          state: TEST_STATE
        });

        // Token response from popup's code exchange
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        const token = await auth0.getTokenSilently({
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          },
          cacheMode: 'off'
        });

        expect(token).toBeTruthy();
        expect(utils.runPopup).toHaveBeenCalled();
      });

      it('should preserve authorizationParams in popup flow', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          interactiveErrorHandler: 'popup'
        });

        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:sensitive-data'
          }
        });

        mockFetch.mockReset();

        // The refresh token grant returns mfa_required
        mockFetch.mockResolvedValueOnce(
          fetchResponse(false, {
            error: 'mfa_required',
            error_description: 'MFA is required',
            mfa_token: 'mfa_token_123',
            mfa_requirements: { challenge: [{ type: 'otp' }] }
          })
        );

        setupPopupMock(mockWindow, {
          code: 'my_code',
          state: TEST_STATE
        });

        // Token response from popup's code exchange
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        await auth0.getTokenSilently({
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:sensitive-data'
          },
          cacheMode: 'off'
        });

        // Verify the popup URL contains the audience parameter
        const popupCallArgs = (utils.runPopup as jest.Mock).mock.calls[0][0];
        const popupUrl = new URL(popupCallArgs.popup.location.href);
        expect(popupUrl.searchParams.get('audience')).toBe(TEST_AUDIENCE);
        expect(popupUrl.searchParams.get('scope')).toContain(
          'read:sensitive-data'
        );
      });

      it('should return verbose token response from cache after successful popup when detailedResponse is true', async () => {
        const auth0 = setup({
          useRefreshTokens: true,
          interactiveErrorHandler: 'popup'
        });

        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          }
        });

        mockFetch.mockReset();

        // The refresh token grant returns mfa_required
        mockFetch.mockResolvedValueOnce(
          fetchResponse(false, {
            error: 'mfa_required',
            error_description: 'MFA is required',
            mfa_token: 'mfa_token_123',
            mfa_requirements: { challenge: [{ type: 'otp' }] }
          })
        );

        setupPopupMock(mockWindow, {
          code: 'my_code',
          state: TEST_STATE
        });

        // Token response from popup's code exchange
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        const result = await auth0.getTokenSilently({
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          },
          detailedResponse: true,
          cacheMode: 'off'
        });

        expect(result).toMatchObject({
          access_token: TEST_ACCESS_TOKEN,
          id_token: TEST_ID_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: expect.any(Number)
        });
      });

      it('should not handle mfa_required when interactiveErrorHandler is not configured', async () => {
        const auth0 = setup({
          useRefreshTokens: true
        });

        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE
          }
        });

        mockFetch.mockReset();

        // The refresh token grant returns mfa_required
        mockFetch.mockResolvedValueOnce(
          fetchResponse(false, {
            error: 'mfa_required',
            error_description: 'MFA is required',
            mfa_token: 'mfa_token_123',
            mfa_requirements: { challenge: [{ type: 'otp' }] }
          })
        );

        await expect(
          auth0.getTokenSilently({
            authorizationParams: {
              audience: TEST_AUDIENCE
            },
            cacheMode: 'off'
          })
        ).rejects.toBeInstanceOf(MfaRequiredError);

        // Verify popup was NOT opened
        expect(utils.runPopup).not.toHaveBeenCalled();
      });
    });

    describe('iframe flow', () => {
      it('should open popup when iframe returns MFA step-up error', async () => {
        const auth0 = setup({
          interactiveErrorHandler: 'popup',
        });

        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          }
        });

        mockFetch.mockReset();

        // Mock runIframe to reject with MFA step-up error
        jest.spyOn(<any>utils, 'runIframe').mockRejectedValue(
          GenericError.fromPayload({
            error: 'login_required',
            error_description: MFA_STEP_UP_ERROR_DESCRIPTION
          })
        );

        setupPopupMock(mockWindow, {
          code: 'my_code',
          state: TEST_STATE
        });

        // Token response from popup's code exchange
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        const token = await auth0.getTokenSilently({
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          },
          cacheMode: 'off'
        });

        expect(token).toBeTruthy();
        expect(utils.runPopup).toHaveBeenCalled();
      });

      it('should not call logout when handler is configured and error is iframe MFA step-up', async () => {
        const auth0 = setup({
          interactiveErrorHandler: 'popup'
        });

        await loginWithRedirect(auth0, {
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          }
        });

        mockFetch.mockReset();

        jest.spyOn(auth0, 'logout');

        // Mock runIframe to reject with MFA step-up error
        jest.spyOn(<any>utils, 'runIframe').mockRejectedValue(
          GenericError.fromPayload({
            error: 'login_required',
            error_description: MFA_STEP_UP_ERROR_DESCRIPTION
          })
        );

        setupPopupMock(mockWindow, {
          code: 'my_code',
          state: TEST_STATE
        });

        // Token response from popup's code exchange
        mockFetch.mockResolvedValueOnce(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            token_type: TEST_TOKEN_TYPE,
            expires_in: 86400
          })
        );

        await auth0.getTokenSilently({
          authorizationParams: {
            audience: TEST_AUDIENCE,
            scope: 'read:data'
          },
          cacheMode: 'off'
        });

        expect(auth0.logout).not.toHaveBeenCalled();
      });
    });
  });
});
