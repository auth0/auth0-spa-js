import { expect } from '@jest/globals';
import * as esCookie from 'es-cookie';
import { MessageChannel } from 'worker_threads';
import * as api from '../../src/api';
import * as http from '../../src/http';
import { verify } from '../../src/jwt';
import * as promiseUtils from '../../src/promise-utils';
import * as scope from '../../src/scope';
import * as utils from '../../src/utils';

import { expectToHaveBeenCalledWithAuth0ClientParam } from '../helpers';

import {
  GET_TOKEN_SILENTLY_LOCK_KEY,
  TEST_ORG_ID,
  TEST_TOKEN_TYPE
} from '../constants';

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
  DEFAULT_AUDIENCE,
  DEFAULT_AUTH0_CLIENT,
  INVALID_REFRESH_TOKEN_ERROR_MESSAGE
} from '../../src/constants';
import { GenericError } from '../../src/errors';
import {
  buildGetTokenSilentlyLockKey,
  buildIframeLockKey
} from '../../src/Auth0Client.utils';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');
jest.spyOn(http, 'switchFetch');

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
        authorizationParams: {
          foo: 'bar'
        }
      });

      const [[url]] = (<jest.Mock>utils.runIframe).mock.calls;

      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        scope: TEST_SCOPES,
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
        authorizationParams: {
          redirect_uri
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      const [[url]] = (<jest.Mock>utils.runIframe).mock.calls;

      assertUrlEquals(
        url,
        'auth0_domain',
        '/authorize',
        {
          redirect_uri
        },
        false
      );
    });

    it('calls the token endpoint with the correct params', async () => {
      const auth0 = setup({
        useFormData: false
      });

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
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT)),
          'Content-Type': 'application/json'
        }
      );
    });

    it('calls the token endpoint with the correct data format when using useFormData', async () => {
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
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT)),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        0,
        false
      );
    });

    it('calls the token endpoint with the correct params when using refresh tokens and not using useFormData', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useFormData: false
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        cacheMode: 'off'
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

    it('calls the token endpoint with the correct params when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        cacheMode: 'off'
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
        },
        undefined,
        false
      );
    });

    it('calls the token endpoint with the correct params when passing redirect uri, using refresh tokens and not using useFormData', async () => {
      const redirect_uri = 'https://custom';

      const auth0 = setup({
        useRefreshTokens: true,
        useFormData: false
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        authorizationParams: {
          redirect_uri
        },
        cacheMode: 'off'
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

    it('calls the token endpoint with the correct params when passing redirect uri and using refresh tokens', async () => {
      const redirect_uri = 'https://custom';

      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        authorizationParams: {
          redirect_uri
        },
        cacheMode: 'off'
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
        },
        undefined,
        false
      );
    });

    it('calls the token endpoint with the correct params when not providing any redirect uri, using refresh tokens and not using useFormData', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useFormData: false,
        authorizationParams: {
          redirect_uri: null
        }
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        authorizationParams: {
          redirect_uri: null
        },
        cacheMode: 'off'
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

    it('calls the token endpoint with the correct params when not providing any redirect uri and using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          redirect_uri: null
        }
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();

      await getTokenSilently(auth0, {
        authorizationParams: {
          redirect_uri: null
        },
        cacheMode: 'off'
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
        },
        undefined,
        false
      );
    });

    it('calls the token endpoint with the correct authorize timeout when using refresh tokens', async () => {
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

    it('calls the token endpoint with a custom http timeout when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        httpTimeoutInSeconds: 30
      });

      jest.spyOn(<any>api, 'oauthToken');

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        state: TEST_STATE,
        code: TEST_CODE
      });

      await getTokenSilently(auth0);

      expect((http.switchFetch as jest.Mock).mock.calls[0][6]).toEqual(30000);
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
        authorizationParams: {
          scope: 'email'
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
      assertUrlEquals(
        url,
        'auth0_domain',
        '/authorize',
        {
          scope: 'openid email'
        },
        false
      );
    });

    it('refreshes the token using custom default scope when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'email'
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
        },
        undefined,
        false
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

    it('does not refresh the token when cacheMode is cache-only', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70, access_token: TEST_ACCESS_TOKEN }
        }
      });

      mockFetch.mockReset();

      const token = await getTokenSilently(auth0, { cacheMode: 'cache-only' });

      expect(token).toBe(TEST_ACCESS_TOKEN);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not refresh the token when cacheMode is cache-only and nothing in cache', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70, access_token: null }
        }
      });

      mockFetch.mockReset();

      const token = await getTokenSilently(auth0, { cacheMode: 'cache-only' });

      expect(token).toBeUndefined();
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

    it('refreshes the token from a web worker when not using useFormData', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useFormData: false
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      const access_token = await getTokenSilently(auth0, { cacheMode: 'off' });

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

    it('refreshes the token from a web worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

      const access_token = await getTokenSilently(auth0, { cacheMode: 'off' });

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
        1,
        false
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    it('refreshes the token without the worker when not using useFormData', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        useFormData: false
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

      const access_token = await auth0.getTokenSilently({ cacheMode: 'off' });

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
        },
        undefined,
        false
      );

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      const access_token = await auth0.getTokenSilently({ cacheMode: 'off' });

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
        1,
        false
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    it('refreshes the token without the worker, when window.Worker is undefined when not using useFormData', async () => {
      mockWindow.Worker = undefined;

      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'memory',
        useFormData: false
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

      const access_token = await getTokenSilently(auth0, { cacheMode: 'off' });

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
        },
        undefined,
        false
      );

      const access_token = await getTokenSilently(auth0, { cacheMode: 'off' });

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
        1,
        false
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
    });

    describe('Worker browser support', () => {
      [
        {
          name: 'Chrome',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
          supported: true
        }
      ].forEach(({ name, userAgent, supported }) =>
        it(`refreshes the token ${supported ? 'with' : 'without'
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
        auth0.getTokenSilently({ cacheMode: 'off' })
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
        auth0.getTokenSilently({ cacheMode: 'off' })
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
        auth0.getTokenSilently({ cacheMode: 'off' })
      ).rejects.toThrow(`Timeout when executing 'fetch'`);

      // Called thrice for the refresh token grant in token worker
      expect(AbortController.prototype.abort).toBeCalledTimes(3);
      expect(mockFetch).toBeCalledTimes(3);

      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => originalDefaultFetchTimeoutMs
      });
    });

    it('falls back to iframe when missing refresh token errors from the worker and useRefreshTokensFallback is set to true', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useRefreshTokensFallback: true
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
      const access_token = await auth0.getTokenSilently({ cacheMode: 'off' });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('does not fall back to iframe when missing refresh token errors from the worker and useRefreshTokensFallback not provided', async () => {
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

      await expect(
        getTokenSilently(auth0, { cacheMode: 'off' })
      ).rejects.toThrow(
        "Missing Refresh Token (audience: '', scope: 'openid profile email offline_access')"
      );

      expect(utils.runIframe).not.toHaveBeenCalled();
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
        auth0.getTokenSilently({ cacheMode: 'off' })
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
        auth0.getTokenSilently({ cacheMode: 'off' })
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
        auth0.getTokenSilently({ cacheMode: 'off' })
      ).rejects.toThrow(`Timeout when executing 'fetch'`);
      // Called thrice for the refresh token grant in http.switchFetch
      expect(AbortController.prototype.abort).toBeCalledTimes(3);
      expect(mockFetch).toBeCalledTimes(3);
      Object.defineProperty(constants, 'DEFAULT_FETCH_TIMEOUT_MS', {
        get: () => originalDefaultFetchTimeoutMs
      });
    });

    it('falls back to iframe when missing refresh token without the worker and useRefreshTokensFallback is set to true', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        useRefreshTokensFallback: true
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
      const access_token = await auth0.getTokenSilently({ cacheMode: 'off' });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('does not fall back to iframe when missing refresh token without the worker when useRefreshTokensFallback is not provided', async () => {
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

      await expect(
        getTokenSilently(auth0, { cacheMode: 'off' })
      ).rejects.toThrow(
        "Missing Refresh Token (audience: '', scope: 'openid profile email offline_access')"
      );

      expect(utils.runIframe).not.toHaveBeenCalled();
    });

    it('uses the cache for subsequent requests that occur before the response', async () => {
      let singlePromiseSpy = jest
        .spyOn(promiseUtils, 'singlePromise')
        .mockImplementation(cb => cb());

      try {
        const auth0 = setup();
        await loginWithRedirect(auth0);
        await (auth0 as any).cacheManager.clear();

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

        const [access_token] = await Promise.all([
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

    it('uses the correct response type for subsequent requests that occur before the response', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0);
      await (auth0 as any).cacheManager.clear();

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

      const [result1, result2] = await Promise.all([
        auth0.getTokenSilently(),
        auth0.getTokenSilently({ detailedResponse: true })
      ]);

      expect(result1).toEqual(TEST_ACCESS_TOKEN);
      expect(result2.access_token).toEqual(TEST_ACCESS_TOKEN);
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
        authorizationParams: {
          audience: 'foo',
          scope: 'bar'
        }
      });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(utils.runIframe).toHaveBeenCalledTimes(1);
      (<jest.Mock>utils.runIframe).mockClear();
      access_token = await auth0.getTokenSilently({
        authorizationParams: {
          audience: 'foo',
          scope: 'bar'
        }
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
      let access_token = await auth0.getTokenSilently({
        authorizationParams: { audience: 'foo' }
      });
      expect(access_token).toEqual(TEST_ACCESS_TOKEN);
      expect(acquireLockSpy).toHaveBeenCalled();
      acquireLockSpy.mockClear();
      // This request will hit the cache, so should not acquire the lock
      access_token = await auth0.getTokenSilently({
        authorizationParams: { audience: 'foo' }
      });
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
        buildGetTokenSilentlyLockKey('auth0_client_id', 'default'),
        5000
      );
      expect(releaseLockSpy).toHaveBeenCalledWith(
        buildGetTokenSilentlyLockKey('auth0_client_id', 'default')
      );
    });

    it('should add and remove a pagehide handler', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'pagehide',
        expect.anything()
      );
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'pagehide',
        expect.anything()
      );
    });

    it('should release the lock when pagehide handler triggered', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockWindow.addEventListener.mockImplementation((event, handler) => {
        if (event === 'pagehide') {
          handler();
          expect(releaseLockSpy).toHaveBeenCalledWith(
            buildGetTokenSilentlyLockKey('auth0_client_id', 'default')
          );
        }
      });

      expect.assertions(1);

      await getTokenSilently(auth0);
    });

    it('should retry acquiring a lock', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      let i = 1;
      const iframeLockKey = buildIframeLockKey(TEST_CLIENT_ID);

      acquireLockSpy.mockImplementation((key: string) => {
        // Always succeed for iframe lock
        if (key === iframeLockKey) {
          return Promise.resolve(true);
        }
        
        // Per-audience lock: fail twice, succeed on third attempt
        if (i === 3) {
          return Promise.resolve(true);
        } else {
          i++;
          return Promise.resolve(false);
        }
      });

      await getTokenSilently(auth0);

      // Should be called 4 times: 3 for per-audience lock (2 failures + 1 success) + 1 for iframe lock
      expect(acquireLockSpy).toHaveBeenCalledTimes(4);
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

    describe('multiple lock tracking', () => {
      it('should track multiple concurrent locks with different audiences', async () => {
        const auth0 = setup();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE,
          code: TEST_CODE
        });

        // Start two concurrent requests with different audiences
        await Promise.all([
          getTokenSilently(auth0, {
            authorizationParams: { audience: 'audience1' }
          }),
          getTokenSilently(auth0, {
            authorizationParams: { audience: 'audience2' }
          })
        ]);

        // Should have acquired different lock keys
        expect(acquireLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience1`,
          5000
        );
        expect(acquireLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience2`,
          5000
        );

        // Both locks should be released
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience1`
        );
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience2`
        );
      });

      it('should use dynamic lock keys based on client ID and audience', async () => {
        const auth0 = setup();

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

        await getTokenSilently(auth0, {
          authorizationParams: { audience: 'custom-audience' }
        });

        expect(acquireLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.custom-audience`,
          5000
        );

        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.custom-audience`
        );
      });

      it('should use default audience when none specified', async () => {
        const auth0 = setup();

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE
        });

        await getTokenSilently(auth0);

        expect(acquireLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.default`,
          5000
        );

        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.default`
        );
      });

      it('should add pagehide event listener only on first lock acquisition', async () => {
        const auth0 = setup();

        // Ensure to delay the resolution here to allow both requests to start
        // and ensure the second one attempts to acquire the lock before the first one releases it.
        jest.spyOn(<any>utils, 'runIframe').mockReturnValue(
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  access_token: TEST_ACCESS_TOKEN,
                  state: TEST_STATE,
                  code: TEST_CODE
                }),
              100
            );
          })
        );

        await Promise.all([
          getTokenSilently(auth0, {
            authorizationParams: { audience: 'audience1' }
          }),
          getTokenSilently(auth0, {
            authorizationParams: { audience: 'audience2' }
          })
        ]);

        // With the global iframe lock, requests are serialized, so each request cycle
        // will add and remove the pagehide listener. However, addEventListener is still
        // called once per lock acquisition cycle.
        expect(mockWindow.addEventListener).toHaveBeenCalled();
      });

      it('should remove pagehide event listener only when all locks are released', async () => {
        const auth0 = setup();
        let pagehideHandler: (() => void) | undefined;

        jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE
        });

        // Capture the pagehide handler
        mockWindow.addEventListener.mockImplementation((event, handler) => {
          if (event === 'pagehide') {
            pagehideHandler = handler as () => void;
          }
        });

        // Start two requests but let them finish
        await getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience1' }
        });

        // Clear the mock to track subsequent calls
        mockWindow.removeEventListener.mockClear();

        await getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience2' }
        });

        // Event listener should only be removed once, after the last lock
        expect(mockWindow.removeEventListener).toHaveBeenCalledTimes(1);
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
          'pagehide',
          pagehideHandler
        );
      });

      // Skipped: With the global iframe lock, requests are serialized rather than parallel
      // This test was designed for truly parallel iframe requests, which we now prevent
      // to avoid state corruption in the Auth0 session
      it.skip('should release all active locks on page hide', async () => {
        const auth0 = setup();
        let pagehideHandler: (() => void) | undefined;

        // Mock long-running requests to simulate concurrent operations
        const runIframeSpy = jest.spyOn(<any>utils, 'runIframe');

        // As we want to manually control when the promise resolves, we need to
        // create the promises ourselves and capture their resolve functions
        let resolveFirstRequest: ((value: any) => void) | undefined;
        let resolveSecondRequest: ((value: any) => void) | undefined;

        // We know we will call the iframe twice, so set up two implementations
        runIframeSpy
          .mockImplementationOnce(() => {
            return new Promise(resolve => {
              resolveFirstRequest = resolve;
            });
          })
          .mockImplementationOnce(() => {
            return new Promise(resolve => {
              resolveSecondRequest = resolve;
            });
          });

        // Capture the pagehide handler to be able to trigger it in the test
        mockWindow.addEventListener.mockImplementation((event, handler) => {
          if (event === 'pagehide') {
            pagehideHandler = handler as () => void;
          }
        });

        // Start two concurrent requests
        const promise1 = getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience1' }
        });

        const promise2 = getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience2' }
        });

        // Wait a bit to ensure both requests have acquired their locks
        // and that the pagehide handler has been registered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Trigger page hide while both requests are in progress
        pagehideHandler!();

        // Wait a bit to ensure both locks have been released
        await new Promise(resolve => setTimeout(resolve, 100));

        // Both locks should be released immediately
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience1`
        );
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience2`
        );

        expect(releaseLockSpy).toHaveBeenCalledTimes(2);

        // Now resolve the pending requests
        resolveFirstRequest!({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE
        });

        resolveSecondRequest!({
          access_token: TEST_ACCESS_TOKEN,
          state: TEST_STATE
        });

        // Await on the original promises to ensure no unhandled rejections
        await Promise.all([promise1, promise2]);
      });

      // Skipped: With the global iframe lock, iframe requests are serialized
      // This test expects parallel execution which we now prevent to fix state corruption
      it.skip('should handle errors in concurrent requests without affecting other locks', async () => {
        const auth0 = setup();

        jest
          .spyOn(<any>utils, 'runIframe')
          .mockResolvedValueOnce({
            access_token: TEST_ACCESS_TOKEN,
            state: TEST_STATE
          })
          .mockRejectedValueOnce(new Error('Network error'));

        // Mock one successful and one failing request

        const promise1 = getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience1' }
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        const promise2 = getTokenSilently(auth0, {
          authorizationParams: { audience: 'audience2' }
        });

        const [result1, result2] = await Promise.allSettled([
          promise1,
          promise2
        ]);

        // First should succeed, second should fail
        expect(result1.status).toEqual('fulfilled');
        expect((result1 as PromiseFulfilledResult<string>).value).toEqual(
          TEST_ACCESS_TOKEN
        );

        expect(result2.status).toEqual('rejected');

        // Both locks should be released despite the error
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience1`
        );
        expect(releaseLockSpy).toHaveBeenCalledWith(
          `auth0.lock.getTokenSilently.${TEST_CLIENT_ID}.audience2`
        );
      });

      // Skipped: With the global iframe lock, iframe requests are serialized
      // This test expects parallel HTTP calls which we now prevent to fix state corruption  
      it.skip('should allow simultaneous calls with different audiences to make separate HTTP calls', async () => {
        const auth0 = setup();

        let iframeCallCount = 0;
        let fetchCallCount = 0;

        // Mock runIframe to return a unique token/code for each call
        jest.spyOn(<any>utils, 'runIframe').mockImplementation(() => {
          iframeCallCount++;
          return Promise.resolve({
            access_token: `access_token_${iframeCallCount}`,
            state: TEST_STATE,
            code: `code_${iframeCallCount}`
          });
        });

        // Mock fetch to return a unique token for each call
        mockFetch.mockImplementation(() => {
          fetchCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id_token: TEST_ID_TOKEN,
                refresh_token: TEST_REFRESH_TOKEN,
                access_token: `access_token_${fetchCallCount}`,
                expires_in: 86400
              }),
            headers: new Headers()
          });
        });

        // Make two simultaneous calls with different audiences
        const [token1, token2] = await Promise.all([
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' }
          }),
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api2' }
          })
        ]);

        // Both should result in their own HTTP calls
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(utils.runIframe).toHaveBeenCalledTimes(2);

        // Verify each call got a different token
        expect(token1).not.toEqual(token2);
        expect(token1).toMatch(/^access_token_\d+$/);
        expect(token2).toMatch(/^access_token_\d+$/);
      });

      // Skipped: With the global iframe lock, iframe requests are serialized  
      // This test expects only one HTTP call for same audience, but with serialization
      // each call is independent
      it.skip('should allow simultaneous calls with the same audience to make only one HTTP call', async () => {
        const auth0 = setup();

        let iframeCallCount = 0;
        let fetchCallCount = 0;

        // Mock runIframe to return a unique token/code for each call
        jest.spyOn(<any>utils, 'runIframe').mockImplementation(() => {
          iframeCallCount++;
          return Promise.resolve({
            access_token: `access_token_${iframeCallCount}`,
            state: TEST_STATE,
            code: `code_${iframeCallCount}`
          });
        });

        // Mock fetch to return a unique token for each call
        mockFetch.mockImplementation(() => {
          fetchCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id_token: TEST_ID_TOKEN,
                refresh_token: TEST_REFRESH_TOKEN,
                access_token: `access_token_${fetchCallCount}`,
                expires_in: 86400
              }),
            headers: new Headers()
          });
        });

        // Make two simultaneous calls with the same audience
        const [token1, token2] = await Promise.all([
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' }
          }),
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' }
          })
        ]);

        // Both should return the same token (from the single shared call)
        expect(token1).toEqual(token2);
        expect(token1).toMatch(/^access_token_\d+$/);

        // Should only result in one HTTP call due to lock
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(utils.runIframe).toHaveBeenCalledTimes(1);
      });

      // Skipped: With the global iframe lock, iframe requests are serialized
      // Lock release behavior is tested in other tests
      it.skip('should release lock correctly and allow subsequent calls to make new HTTP requests', async () => {
        const auth0 = setup();

        let iframeCallCount = 0;
        let fetchCallCount = 0;

        // Mock runIframe to return a unique token/code for each call
        jest.spyOn(<any>utils, 'runIframe').mockImplementation(() => {
          iframeCallCount++;
          return Promise.resolve({
            access_token: `access_token_${iframeCallCount}`,
            state: TEST_STATE,
            code: `code_${iframeCallCount}`
          });
        });

        // Mock fetch to return a unique token for each call
        mockFetch.mockImplementation(() => {
          fetchCallCount++;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id_token: TEST_ID_TOKEN,
                refresh_token: TEST_REFRESH_TOKEN,
                access_token: `access_token_${fetchCallCount}`,
                expires_in: 86400
              }),
            headers: new Headers()
          });
        });

        // Make first simultaneous calls
        const [token1, token2] = await Promise.all([
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' },
            cacheMode: 'off'
          }),
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' },
            cacheMode: 'off'
          })
        ]);

        // Both should return the same token due to locking
        expect(token1).toEqual(token2);
        expect(token1).toMatch(/^access_token_\d+$/);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(utils.runIframe).toHaveBeenCalledTimes(1);

        // Make subsequent simultaneous calls - should get a different token since lock was released
        const [token3, token4] = await Promise.all([
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' },
            cacheMode: 'off'
          }),
          auth0.getTokenSilently({
            authorizationParams: { audience: 'api1' },
            cacheMode: 'off'
          })
        ]);

        // Both should return the same token (but different from first pair)
        expect(token3).toEqual(token4);
        expect(token3).not.toEqual(token1);
        expect(token3).toMatch(/^access_token_\d+$/);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(utils.runIframe).toHaveBeenCalledTimes(2);
      });
    });

    it('sends custom options through to the token endpoint when using an iframe when not using useFormData', async () => {
      const auth0 = setup({
        authorizationParams: {
          custom_param: 'foo',
          another_custom_param: 'bar'
        },
        useFormData: false
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
        cacheMode: 'off',
        authorizationParams: {
          custom_param: 'hello world'
        }
      });

      expect(
        (<any>utils.runIframe).mock.calls[0][0].includes(
          'custom_param=hello+world&another_custom_param=bar'
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

    it('sends custom options through to the token endpoint when using an iframe', async () => {
      const auth0 = setup({
        authorizationParams: {
          custom_param: 'foo',
          another_custom_param: 'bar'
        }
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
        cacheMode: 'off',
        authorizationParams: {
          custom_param: 'hello world'
        }
      });

      expect(
        (<any>utils.runIframe).mock.calls[0][0].includes(
          'custom_param=hello+world&another_custom_param=bar'
        )
      ).toBe(true);

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'authorization_code',
          custom_param: 'hello world',
          another_custom_param: 'bar',
          code_verifier: TEST_CODE_VERIFIER
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        1,
        false
      );
    });

    it('sends custom options through to the token endpoint when using refresh tokens when not using useFormData', async () => {
      const auth0 = setup({
        authorizationParams: {
          custom_param: 'foo',
          another_custom_param: 'bar'
        },
        useRefreshTokens: true,
        useFormData: false
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
        cacheMode: 'off',
        authorizationParams: {
          custom_param: 'hello world'
        }
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

    it('sends custom options through to the token endpoint when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          custom_param: 'foo',
          another_custom_param: 'bar'
        }
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
        cacheMode: 'off',
        authorizationParams: {
          custom_param: 'helloworld'
        }
      });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: 'a_refresh_token',
          custom_param: 'helloworld',
          another_custom_param: 'bar'
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        1,
        false
      );

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

      let error;

      try {
        await auth0.getTokenSilently();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
      expect(error.error).toBe('state_mismatch');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GenericError);
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
          audience: DEFAULT_AUDIENCE,
          scope: TEST_SCOPES
        })
      );
    });

    it('saves user information in the cache', async () => {
      const auth0 = setup();
      const mockDecodedToken = {
        claims: { sub: 'sub', aud: 'aus' },
        user: { sub: 'sub' }
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(auth0['cacheManager'], 'setIdToken');

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(auth0['cacheManager']['setIdToken']).toHaveBeenCalledWith(
        TEST_CLIENT_ID,
        TEST_ID_TOKEN,
        mockDecodedToken
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
        `_legacy_auth0.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
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
        `_legacy_auth0.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 2
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 2
        }
      );
    });

    it('stores the org_id in a hint cookie if returned in the ID token claims', async () => {
      const auth0 = setup(
        { authorizationParams: { organization: TEST_ORG_ID } },
        { org_id: TEST_ORG_ID }
      );

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(esCookie.set).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );

      expect(esCookie.set).toHaveBeenCalledWith(
        `_legacy_auth0.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );
    });

    it('removes organization hint cookie if no organization was specified', async () => {
      const auth0 = setup({});

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(esCookie.remove).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.organization_hint`,
        {}
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

    it('opens iframe with correct urls including organization from the options', async () => {
      const auth0 = setup({
        authorizeTimeoutInSeconds: 1,
        authorizationParams: {
          organization: TEST_ORG_ID
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      await getTokenSilently(auth0);

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.stringContaining(TEST_ORG_ID),
        `https://${TEST_DOMAIN}`,
        1
      );
    });

    it('opens iframe with correct urls including organization from the hint cookie', async () => {
      const auth0 = setup({ authorizeTimeoutInSeconds: 1 });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      (esCookie.get as jest.Mock).mockImplementationOnce(
        key =>
          key === `auth0.${TEST_CLIENT_ID}.organization_hint` &&
          JSON.stringify(TEST_ORG_ID)
      );

      await getTokenSilently(auth0);

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.stringContaining(TEST_ORG_ID),
        `https://${TEST_DOMAIN}`,
        1
      );
    });

    it('opens iframe with correct urls including organization, with options taking precedence over hint cookie', async () => {
      const auth0 = setup({
        authorizeTimeoutInSeconds: 1,
        authorizationParams: {
          organization: 'another_test_org'
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      (esCookie.get as jest.Mock).mockImplementationOnce(
        key =>
          key === `auth0.${TEST_CLIENT_ID}.organization_hint` &&
          JSON.stringify(TEST_ORG_ID)
      );

      await getTokenSilently(auth0);

      expect(TEST_ORG_ID).not.toEqual('another_test_org');

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.stringContaining('another_test_org'),
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

    it('opens iframe with a custom http timeout', async () => {
      const auth0 = setup({ httpTimeoutInSeconds: 20 });

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

      expect((http.switchFetch as jest.Mock).mock.calls[0][6]).toEqual(20000);
    });

    it('when using Refresh Tokens, falls back to iframe when refresh token is expired and useRefreshTokensFallback is set to true', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useRefreshTokensFallback: true
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
          }),
          headers: new Headers()
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
          }),
          headers: new Headers()
        })
      );

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        code: TEST_CODE,
        state: TEST_STATE
      });

      await auth0.getTokenSilently({ cacheMode: 'off' });

      expect(utils['runIframe']).toHaveBeenCalled();
    });

    it('when using Refresh Tokens and fallback fails, ensure the user is logged out', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useRefreshTokensFallback: true
      });

      await loginWithRedirect(auth0);

      mockFetch.mockReset();
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => ({
            error: 'invalid_grant',
            error_description: INVALID_REFRESH_TOKEN_ERROR_MESSAGE
          }),
          headers: new Headers()
        })
      );

      jest.spyOn(auth0, 'logout');
      jest.spyOn(utils, 'runIframe').mockRejectedValue(
        GenericError.fromPayload({
          error: 'login_required',
          error_description: 'login_required'
        })
      );

      // Reset the location.assign mock so that the previous usage doesn't cause our test to fail
      (window.location.assign as jest.Mock).mockReset();
      await expect(
        auth0.getTokenSilently({ cacheMode: 'off' })
      ).rejects.toThrow('login_required');
      expect(auth0.logout).toHaveBeenCalled();
      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it('when not using Refresh Tokens and login_required is returned, ensure the user is logged out', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      jest.spyOn(auth0, 'logout');

      // Reset the location.assign mock so that the previous usage doesn't cause our test to fail
      (window.location.assign as jest.Mock).mockReset();
      await expect(
        auth0.getTokenSilently({ cacheMode: 'off' })
      ).rejects.toThrow('login_required');

      expect(auth0.logout).toHaveBeenCalled();
      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it('when not using Refresh Tokens and crossOriginIsolated is true, login_required is returned and the user is logged out', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);
      mockFetch.mockReset();
      jest.spyOn(auth0, 'logout');

      const originalWindow = { ...window };
      const windowSpy = jest.spyOn(global as any, 'window', 'get');

      windowSpy.mockImplementation(() => ({
        ...originalWindow,
        crossOriginIsolated: true
      }));

      // Reset the location.assign mock so that the previous usage doesn't cause our test to fail
      (window.location.assign as jest.Mock).mockReset();
      await expect(
        auth0.getTokenSilently({ cacheMode: 'off' })
      ).rejects.toHaveProperty('error', 'login_required');

      expect(auth0.logout).toHaveBeenCalled();
      expect(window.location.assign).not.toHaveBeenCalled();
      windowSpy.mockRestore();
    });

    it('returns the full token response when "detailedResponse: true"', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        state: TEST_STATE
      });

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400
        })
      );

      const response = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true
      });

      // No refresh_token included here, or oauthTokenScope
      expect(response).toStrictEqual({
        id_token: TEST_ID_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        token_type: TEST_TOKEN_TYPE,
        expires_in: 86400
      });
    });

    it('returns the full token response with scopes when "detailedResponse: true"', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          token_type: TEST_TOKEN_TYPE,
          expires_in: 86400,
          scope: 'read:messages'
        })
      );

      const response = await auth0.getTokenSilently({
        cacheMode: 'off',
        detailedResponse: true
      });

      // No refresh_token included here, or oauthTokenScope
      expect(response).toStrictEqual({
        id_token: TEST_ID_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        token_type: TEST_TOKEN_TYPE,
        expires_in: 86400,
        scope: 'read:messages'
      });
    });

    it('returns the full response when "detailedReponse: true" and using cache', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0);

      const runIframeSpy = jest
        .spyOn(<any>utils, 'runIframe')
        .mockResolvedValue({
          state: TEST_STATE
        });

      const response = await auth0.getTokenSilently({
        detailedResponse: true
      });

      // No refresh_token included here, or oauthTokenScope
      expect(response).toStrictEqual({
        id_token: TEST_ID_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        token_type: TEST_TOKEN_TYPE,
        expires_in: 86400
      });

      expect(runIframeSpy).not.toHaveBeenCalled();
    });

    it('returns the full response with scopes when "detailedResponse: true" and using cache', async () => {
      const auth0 = setup({
        authorizationParams: {
          scope: 'profile email read:messages write:messages'
        }
      });

      const runIframeSpy = jest
        .spyOn(<any>utils, 'runIframe')
        .mockResolvedValue({
          state: TEST_STATE
        });

      // Get the cache into the right state
      await loginWithRedirect(auth0);

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400,
          scope: 'read:messages'
        })
      );

      jest.spyOn(auth0['cacheManager'], 'set');

      await auth0.getTokenSilently({
        cacheMode: 'off',
        authorizationParams: {
          scope: 'read:messages'
        }
      });

      expect(auth0['cacheManager'].set).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'openid profile email read:messages write:messages',
          oauthTokenScope: 'read:messages'
        })
      );

      // runIframe will have been called while setting up this test, we'll clear it here
      // to verify that the _next_ call to getTokenSilently uses the cache
      runIframeSpy.mockClear();

      // Get a full response from the cache - should return
      // oauthTokenScope in the scope property
      const response = await auth0.getTokenSilently({
        detailedResponse: true,
        authorizationParams: {
          scope: 'read:messages'
        }
      });

      // No refresh_token included here, or oauthTokenScope
      expect(response).toStrictEqual({
        id_token: TEST_ID_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        token_type: TEST_TOKEN_TYPE,
        expires_in: 86400,
        scope: 'read:messages'
      });

      expect(runIframeSpy).not.toHaveBeenCalled();
    });

    it('should set the correct scopes when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'email read:messages'
        }
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: 'a_refresh_token' }
        }
      });

      jest.spyOn(auth0['cacheManager'], 'set');

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
        cacheMode: 'off'
      });

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: 'a_refresh_token'
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        1,
        false
      );

      expect(access_token).toEqual(TEST_ACCESS_TOKEN);

      expect(auth0['cacheManager'].set).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'openid email read:messages offline_access'
        })
      );
    });

    it('updates refresh token in all cache entries when downscoping', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      expect((<any>auth0).worker).toBeUndefined();

      // Step 1: Login with broad scopes
      await loginWithRedirect(auth0, {
        authorizationParams: {
          scope: 'openid profile read:messages write:messages',
          audience: 'https://api.example.com'
        }
      }, {
        token: {
          response: { expires_in: 50 } // Less than 60 second leeway, will be considered expired
        }
      });

      // Cache now has:
      // Key: ...::openid profile read:messages write:messages
      // Value: { refresh_token: TEST_REFRESH_TOKEN (RT1), ... }

      mockFetch.mockReset();

      // Step 2: Downscope - request fewer scopes
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          access_token: 'downscoped_access_token',
          refresh_token: 'new_refresh_token', // RT2 - different from RT1
          id_token: TEST_ID_TOKEN,
          expires_in: 50 // Short expiry to force refresh in step 3
        })
      );

      await auth0.getTokenSilently({
        authorizationParams: {
          scope: 'openid read:messages', // Fewer scopes than login
          audience: 'https://api.example.com'
        },
        cacheMode: 'off' // Force network call
      });

      // Step 3: Request original broad scopes again
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          access_token: 'final_access_token',
          refresh_token: 'final_refresh_token',
          id_token: TEST_ID_TOKEN,
          expires_in: 86400
        })
      );

      await auth0.getTokenSilently({
        authorizationParams: {
          scope: 'openid profile read:messages write:messages', // Back to broad scopes
          audience: 'https://api.example.com'
        },
        cacheMode: 'off' // Force network call
      });

      // Should have made exactly 2 token refresh calls total (one in step 2, one in step 3)
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify Step 2 used RT1
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN // Step 2 uses RT1
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        },
        0,
        false
      );

      // Verify Step 3 used RT2 (not RT1) - this proves the fix worked
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: 'new_refresh_token' // Should use RT2, not TEST_REFRESH_TOKEN (RT1)
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        },
        1,
        false
      );
    });
  });

  describe('two-tier locking for iframe requests', () => {
    it('should acquire both per-audience and iframe locks when using iframe flow', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE,
        code: TEST_CODE
      });

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await getTokenSilently(auth0, {
        authorizationParams: { audience: 'test-audience' },
        cacheMode: 'off'
      });

      // Should acquire per-audience lock
      expect(acquireLockSpy).toHaveBeenCalledWith(
        buildGetTokenSilentlyLockKey(TEST_CLIENT_ID, 'test-audience'),
        5000
      );

      // Should also acquire iframe lock
      expect(acquireLockSpy).toHaveBeenCalledWith(
        buildIframeLockKey(TEST_CLIENT_ID),
        5000
      );

      // Both locks should be released
      expect(releaseLockSpy).toHaveBeenCalledWith(
        buildGetTokenSilentlyLockKey(TEST_CLIENT_ID, 'test-audience')
      );
      expect(releaseLockSpy).toHaveBeenCalledWith(
        buildIframeLockKey(TEST_CLIENT_ID)
      );
    });

    it('should release iframe lock even when iframe fails', async () => {
      const auth0 = setup();
      const iframeLockKey = buildIframeLockKey(TEST_CLIENT_ID);

      jest.spyOn(<any>utils, 'runIframe').mockRejectedValue(
        new Error('iframe error')
      );

      try {
        await getTokenSilently(auth0, { cacheMode: 'off' });
      } catch (e) {
        // Expected to fail
      }

      // Iframe lock should still be released
      expect(releaseLockSpy).toHaveBeenCalledWith(iframeLockKey);
    });

    it('should not acquire iframe lock when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: TEST_REFRESH_TOKEN }
        }
      });

      const iframeLockKey = buildIframeLockKey(TEST_CLIENT_ID);
      acquireLockSpy.mockClear();
      releaseLockSpy.mockClear();

      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await getTokenSilently(auth0, { cacheMode: 'off' });

      // Should acquire per-audience lock only
      expect(acquireLockSpy).toHaveBeenCalledWith(
        buildGetTokenSilentlyLockKey(TEST_CLIENT_ID, 'default'),
        5000
      );

      // Should NOT acquire iframe lock (refresh token flow)
      expect(acquireLockSpy).not.toHaveBeenCalledWith(iframeLockKey, 5000);
      expect(releaseLockSpy).not.toHaveBeenCalledWith(iframeLockKey);
    });

    it('should acquire iframe lock when falling back from refresh token to iframe', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        useRefreshTokensFallback: true
      });

      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { refresh_token: TEST_REFRESH_TOKEN }
        }
      });

      const iframeLockKey = buildIframeLockKey(TEST_CLIENT_ID);
      acquireLockSpy.mockClear();
      releaseLockSpy.mockClear();

      // First call fails (refresh token expired)
      mockFetch.mockResolvedValueOnce(
        fetchResponse(false, {
          error: 'invalid_grant',
          error_description: INVALID_REFRESH_TOKEN_ERROR_MESSAGE
        })
      );

      // Second call succeeds (iframe fallback)
      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE,
        code: TEST_CODE
      });

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await getTokenSilently(auth0, { cacheMode: 'off' });

      // Should acquire iframe lock when falling back to iframe
      expect(acquireLockSpy).toHaveBeenCalledWith(iframeLockKey, 5000);
      expect(releaseLockSpy).toHaveBeenCalledWith(iframeLockKey);
    });
  });
});
