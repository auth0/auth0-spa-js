import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as promiseUtils from '../../src/promise-utils';
import * as scope from '../../src/scope';
import * as api from '../../src/api';

import { expectToHaveBeenCalledWithAuth0ClientParam } from '../helpers';

import { GET_TOKEN_SILENTLY_LOCK_KEY } from '../constants';

// @ts-ignore
import { acquireLockSpy } from 'browser-tabs-lock';

import {
  assertPostFn,
  assertUrlEquals,
  fetchResponse,
  getTokenSilentlyFn,
  loginWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_NONCE,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_STATE
} from '../constants';

import { releaseLockSpy } from '../../__mocks__/browser-tabs-lock';
import {
  DEFAULT_AUTH0_CLIENT,
  INVALID_REFRESH_TOKEN_ERROR_MESSAGE
} from '../../src/constants';
import { GenericError } from '../../src/errors';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const assertPost = assertPostFn(mockFetch);
const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
const getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);

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
    );
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
    acquireLockSpy.mockResolvedValue(true);
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('getTokenSilently', () => {
    it('uses the cache when expires_in > constant leeway', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70 }
        }
      });

      jest.spyOn(<any>utils, 'runIframe');

      mockFetch.mockReset();

      const token = await auth0.getTokenSilently();

      expect(token).toBe(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls the authorize endpoint using the correct params', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0, {
        foo: 'bar'
      });

      const [[url]] = (<jest.Mock>utils.runIframe).mock.calls;

      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        client_id: TEST_CLIENT_ID,
        response_type: 'code',
        response_mode: 'web_message',
        prompt: 'none',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        redirect_uri: TEST_REDIRECT_URI,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        foo: 'bar'
      });
    });

    it('calls the authorize endpoint using the correct params when using a default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const auth0 = setup({
        redirect_uri
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      const [[url]] = (<jest.Mock>utils.runIframe).mock.calls;

      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        redirect_uri
      });
    });

    it('calls the token endpoint with the correct params', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE,
        code: TEST_CODE
      });

      await getTokenSilently(auth0);

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('calls the token endpoint with the correct params when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        ignoreCache: true
      });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('calls the token endpoint with the correct params when passing redirect uri and using refresh tokens', async () => {
      const redirect_uri = 'https://custom';
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        redirect_uri,
        ignoreCache: true
      });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('calls the token endpoint with the correct params when not providing any redirect uri and using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        redirect_uri: null
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        redirect_uri: null,
        ignoreCache: true
      });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: 'http://localhost',
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('calls the token endpoint with the correct timeout when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      jest.spyOn(<any>api, 'oauthToken');
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        state: TEST_STATE,
        code: TEST_CODE
      });

      await getTokenSilently(auth0, {
        timeoutInSeconds: 10
      });

      expect(api.oauthToken).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000
        }),
        expect.anything()
      );
    });

    it('refreshes the token when no cache available', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      const token = await getTokenSilently(auth0);

      expect(token).toBe(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('refreshes the token using custom default scope', async () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 0 }
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      const [[url]] = (<jest.Mock>utils.runIframe).mock.calls;
      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        scope: 'openid email'
      });
    });

    it('refreshes the token using custom default scope when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 50 }
        }
      });

      jest.spyOn(<any>utils, 'runIframe');

      mockFetch.mockReset();

      await getTokenSilently(auth0);

      expect(utils.runIframe).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('refreshes the token using custom auth0Client', async () => {
      const auth0Client = { name: '__test_client__', version: '0.0.0' };
      const auth0 = setup({ auth0Client });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        code: TEST_CODE,
        state: TEST_STATE
      });

      mockFetch.mockReset();

      await getTokenSilently(auth0);

      expectToHaveBeenCalledWithAuth0ClientParam(utils.runIframe, auth0Client);
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Auth0-Client': btoa(JSON.stringify(auth0Client))
        }
      );
    });

    it('refreshes the token when cache available without access token', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70, access_token: null }
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockReset();

      const token = await getTokenSilently(auth0);

      expect(token).toBe(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('refreshes the token when expires_in < constant leeway', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 50 }
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockReset();

      await getTokenSilently(auth0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('uses the cache when expires_in > constant leeway & refresh tokens are used', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70 }
        }
      });

      mockFetch.mockReset();

      await getTokenSilently(auth0);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('refreshes the token when expires_in < constant leeway & refresh tokens are used', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 50 }
        }
      });

      mockFetch.mockReset();

      await getTokenSilently(auth0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('refreshes the token from a web worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      const access_token = await getTokenSilently(auth0, { ignoreCache: true });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        },
        1
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    it('refreshes the token without the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      expect((<any>auth0).worker).toBeUndefined();

      await loginWithRedirect(auth0);

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      const access_token = await auth0.getTokenSilently({ ignoreCache: true });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        },
        1
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    it('refreshes the token without the worker, when window.Worker is undefined', async () => {
      mockWindow.Worker = undefined;

      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'memory'
      });

      expect((<any>auth0).worker).toBeUndefined();

      await loginWithRedirect(auth0);

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );

      const access_token = await getTokenSilently(auth0, { ignoreCache: true });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        },
        1
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    describe('Worker browser support', () => {
      [
        {
          name: 'IE11',
          userAgent:
            'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
          supported: false
        },
        {
          name: 'Chrome',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
          supported: true
        }
      ].forEach(({ name, userAgent, supported }) =>
        it(`refreshes the token ${
          supported ? 'with' : 'without'
        } the worker, when ${name}`, async () => {
          const originalUserAgent = window.navigator.userAgent;

          Object.defineProperty(window.navigator, 'userAgent', {
            value: userAgent,
            configurable: true
          });

          const auth0 = setup({
            useRefreshTokens: true,
            cacheLocation: 'memory'
          });

          if (supported) {
            expect((<any>auth0).worker).toBeDefined();
          } else {
            expect((<any>auth0).worker).toBeUndefined();
          }

          Object.defineProperty(window.navigator, 'userAgent', {
            value: originalUserAgent
          });
        })
      );
    });

    describe('concurrency', () => {
      it('should call _getTokenSilently multiple times when no call in flight concurrently', async () => {
        const client = setup();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE,
          code: TEST_CODE
        });

        jest.spyOn(client as any, '_getTokenSilently');

        await getTokenSilently(client);
        await getTokenSilently(client);

        expect(client['_getTokenSilently']).toHaveBeenCalledTimes(2);
      });

      it('should not call _getTokenSilently if a call is already in flight', async () => {
        const client = setup();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE,
          code: TEST_CODE
        });

        jest.spyOn(client as any, '_getTokenSilently');

        const tokens = await Promise.all([
          getTokenSilently(client),
          getTokenSilently(client)
        ]);

        expect(client['_getTokenSilently']).toHaveBeenCalledTimes(1);
        expect(tokens[0]).toEqual(tokens[1]);
      });

      it('should not call _getTokenSilently if a call is already in flight (cross instance)', async () => {
        const client1 = setup();
        const client2 = setup();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE,
          code: TEST_CODE
        });

        jest.spyOn(client1 as any, '_getTokenSilently');
        jest.spyOn(client2 as any, '_getTokenSilently');

        const tokens = await Promise.all([
          getTokenSilently(client1),
          getTokenSilently(client2)
        ]);

        expect(client1['_getTokenSilently']).toHaveBeenCalledTimes(1);
        expect(client2['_getTokenSilently']).not.toHaveBeenCalled();
        expect(tokens[0]).toEqual(tokens[1]);
      });
    });

    it('handles fetch errors from the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockImplementation(() => Promise.reject(new Error('my_error')));

      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('my_error');

      expect(mockFetch).toBeCalledTimes(3);
    });

    it('handles api errors from the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockResolvedValue(
        fetchResponse(false, {
          error: 'my_api_error',
          error_description: 'my_error_description'
        })
      );

      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('my_error_description');

      expect(mockFetch).toBeCalledTimes(1);
    });

    it('handles timeout errors from the worker', async () => {
      const constants = require('../../src/constants');
      const originalDefaultFetchTimeoutMs = constants.DEFAULT_FETCH_TIMEOUT_MS;
      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => 100
      });
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ access_token: 'access-token' })
                }),
              500
            )
          )
      );
      jest.spyOn(AbortController.prototype, 'abort');

      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow(`Timeout when executing 'fetch'`);

      // Called thrice for the refresh token grant in token worker
      expect(AbortController.prototype.abort).toBeCalledTimes(3);
      expect(mockFetch).toBeCalledTimes(3);

      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => originalDefaultFetchTimeoutMs
      });
    });

    it('falls back to iframe when missing refresh token errors from the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });
      expect((<any>auth0).worker).toBeDefined();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: '' }
        }
      });
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      const access_token = await auth0.getTokenSilently({ ignoreCache: true });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('handles fetch errors without the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });
      expect((<any>auth0).worker).toBeUndefined();
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockFetch.mockImplementation(() => Promise.reject(new Error('my_error')));
      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('my_error');
      expect(mockFetch).toBeCalledTimes(3);
    });

    it('handles api errors without the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });
      expect((<any>auth0).worker).toBeUndefined();
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockFetch.mockResolvedValue(
        fetchResponse(false, {
          error: 'my_api_error',
          error_description: 'my_error_description'
        })
      );
      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('my_error_description');
      expect(mockFetch).toBeCalledTimes(1);
    });

    it('handles timeout errors without the worker', async () => {
      const constants = require('../../src/constants');
      const originalDefaultFetchTimeoutMs = constants.DEFAULT_FETCH_TIMEOUT_MS;
      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => 100
      });
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });
      expect((<any>auth0).worker).toBeUndefined();
      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ access_token: 'access-token' })
                }),
              500
            )
          )
      );
      jest.spyOn(AbortController.prototype, 'abort');
      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow(`Timeout when executing 'fetch'`);
      // Called thrice for the refresh token grant in http.switchFetch
      expect(AbortController.prototype.abort).toBeCalledTimes(3);
      expect(mockFetch).toBeCalledTimes(3);
      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => originalDefaultFetchTimeoutMs
      });
    });

    it('falls back to iframe when missing refresh token without the worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });
      expect((<any>auth0).worker).toBeUndefined();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: '' }
        }
      });
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      const access_token = await auth0.getTokenSilently({ ignoreCache: true });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('falls back to iframe when missing refresh token in ie11', async () => {
      const originalUserAgent = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
        configurable: true
      });
      const auth0 = setup({
        useRefreshTokens: true
      });
      expect((<any>auth0).worker).toBeUndefined();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: '' }
        }
      });
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      const access_token = await auth0.getTokenSilently({ ignoreCache: true });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent
      });
    });

    it('uses the cache for subsequent requests that occur before the response', async () => {
      let singlePromiseSpy = jest
        .spyOn(promiseUtils, 'singlePromise')
        .mockImplementation(cb => cb());

      try {
        const auth0 = setup();
        await loginWithRedirect(auth0);
        (auth0 as any).cacheManager.clear();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE
        });

        mockFetch.mockResolvedValue(
          fetchResponse(true, {
            id_token: TEST_ID_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          })
        );

        let [access_token] = await Promise.all([
          auth0.getTokenSilently(),
          auth0.getTokenSilently(),
          auth0.getTokenSilently()
        ]);

        expect(access_token).toEqual(TEST_ACCESS_TOKEN);
        expect(utils.runIframe).toHaveBeenCalledTimes(1);
      } finally {
        singlePromiseSpy.mockRestore();
      }
    });

    it('uses the cache for multiple token requests with audience and scope', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0);
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      let access_token = await auth0.getTokenSilently({
        audience: 'foo',
        scope: 'bar'
      });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalledTimes(1);
      (<jest.Mock>utils.runIframe).mockClear();
      access_token = await auth0.getTokenSilently({
        audience: 'foo',
        scope: 'bar'
      });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).not.toHaveBeenCalled();
    });

    it('should not acquire a browser lock when cache is populated', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0);
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      let access_token = await auth0.getTokenSilently({ audience: 'foo' });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(acquireLockSpy).toHaveBeenCalled();
      acquireLockSpy.mockClear();
      // This request will hit the cache, so should not acquire the lock
      access_token = await auth0.getTokenSilently({ audience: 'foo' });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(acquireLockSpy).not.toHaveBeenCalled();
    });

    it('should acquire and release a browser lock', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(acquireLockSpy).toHaveBeenCalledWith(
        GET_TOKEN_SILENTLY_LOCK_KEY,
        5000
      );
      expect(releaseLockSpy).toHaveBeenCalledWith(GET_TOKEN_SILENTLY_LOCK_KEY);
    });

    it('should retry acquiring a lock', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      let i = 1;

      acquireLockSpy.mockImplementation(() => {
        if (i === 3) {
          return Promise.resolve(true);
        } else {
          i++;
          return Promise.resolve(false);
        }
      });

      await getTokenSilently(auth0);

      expect(acquireLockSpy).toHaveBeenCalledTimes(3);
    });

    it('should trow a Timeout error if it can not acquire a lock after retrying', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      acquireLockSpy.mockResolvedValue(false);

      await expect(getTokenSilently(auth0)).rejects.toThrow('Timeout');

      expect(acquireLockSpy).toHaveBeenCalledTimes(10);
    });

    it('should release a browser lock when an error occurred', async () => {
      const auth0 = setup();
      let error;

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockResolvedValue(
        fetchResponse(false, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      try {
        await auth0.getTokenSilently();
      } catch (e) {
        error = e;
      }

      expect(error.message).toEqual(
        'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
      );
      expect(releaseLockSpy).toHaveBeenCalled();
    });

    it('sends custom options through to the token endpoint when using an iframe', async () => {
      const auth0 = setup({
        custom_param: 'foo',
        another_custom_param: 'bar'
      });

      await loginWithRedirect(auth0);

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await auth0.getTokenSilently({
        ignoreCache: true,
        custom_param: 'hello world'
      });

      expect(
        (<any>utils.runIframe).mock.calls[0][0].includes(
          'custom_param=hello%20world&another_custom_param=bar'
        )
      ).toBe(true);

      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        grant_type: 'authorization_code',
        custom_param: 'hello world',
        another_custom_param: 'bar',
        code_verifier: TEST_CODE_VERIFIER
      });
    });

    it('sends custom options through to the token endpoint when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        custom_param: 'foo',
        another_custom_param: 'bar'
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: 'a_refresh_token' }
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      expect(utils.runIframe).not.toHaveBeenCalled();

      const access_token = await auth0.getTokenSilently({
        ignoreCache: true,
        custom_param: 'hello world'
      });

      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: 'a_refresh_token',
        custom_param: 'hello world',
        another_custom_param: 'bar'
      });

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
      const auth0 = setup({
        issuer: 'test-123.auth0.com'
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.auth0.com/',
          id_token: TEST_ID_TOKEN
        })
      );
    });

    it('throws error if state from popup response is different from the provided state', async () => {
      const auth0 = setup();

      jest.spyOn(utils, 'runIframe').mockReturnValue(
        Promise.resolve({
          state: 'other-state'
        })
      );

      await expect(auth0.getTokenSilently()).rejects.toThrowError(
        'Invalid state'
      );
    });

    it('saves into cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cacheManager'], 'set');

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(auth0['cacheManager']['set']).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: TEST_CLIENT_ID,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400,
          audience: 'default',
          id_token: TEST_ID_TOKEN,
          scope: TEST_SCOPES
        })
      );
    });

    it('saves `auth0.is.authenticated` key in storage', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated',
        'true',
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        'auth0.is.authenticated',
        'true',
        {
          expires: 1
        }
      );
    });

    it('saves `auth0.is.authenticated` key in storage for an extended period', async () => {
      const auth0 = setup({
        sessionCheckExpiryDays: 2
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated',
        'true',
        {
          expires: 2
        }
      );
      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        'auth0.is.authenticated',
        'true',
        {
          expires: 2
        }
      );
    });

    it('opens iframe with correct urls and timeout from client options', async () => {
      const auth0 = setup({ authorizeTimeoutInSeconds: 1 });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        `https://${TEST_DOMAIN}`,
        1
      );
    });

    it('opens iframe with correct urls and custom timeout', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0, {
        timeoutInSeconds: 1
      });

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.any(String),
        `https://${TEST_DOMAIN}`,
        1
      );
    });

    it('when using Refresh Tokens, falls back to iframe when refresh token is expired', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => ({
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          })
        })
      );
      // Fail only the first occurring /token request by providing it as mockImplementationOnce.
      // The first request will use the mockImplementationOnce implementation,
      // while any subsequent will use the mock configured above in mockImplementation.
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => ({
            error: 'invalid_grant',
            error_description: INVALID_REFRESH_TOKEN_ERROR_MESSAGE
          })
        })
      );

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        code: TEST_CODE,
        state: TEST_STATE
      });

      await auth0.getTokenSilently({ ignoreCache: true });

      expect(utils['runIframe']).toHaveBeenCalled();
    });

    it('when using Refresh Tokens and fallback fails, ensure the user is logged out', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => ({
            error: 'invalid_grant',
            error_description: INVALID_REFRESH_TOKEN_ERROR_MESSAGE
          })
        })
      );

      jest.spyOn(auth0, 'logout');
      jest.spyOn(utils, 'runIframe').mockRejectedValue(
        GenericError.fromPayload({
          error: 'login_required',
          error_description: 'login_required'
        })
      );

      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('login_required');
      expect(auth0.logout).toHaveBeenCalledWith({ localOnly: true });
    });

    it('when not using Refresh Tokens and login_required is returned, ensure the user is logged out', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      jest.spyOn(auth0, 'logout');
      jest.spyOn(utils, 'runIframe').mockRejectedValue(
        GenericError.fromPayload({
          error: 'login_required',
          error_description: 'login_required'
        })
      );

      await expect(
        auth0.getTokenSilently({ ignoreCache: true })
      ).rejects.toThrow('login_required');
      expect(auth0.logout).toHaveBeenCalledWith({ localOnly: true });
    });
  });
});
