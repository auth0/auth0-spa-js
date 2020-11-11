import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../src/utils';
import * as scope from '../src/scope';

import {
  expectToHaveBeenCalledWithAuth0ClientParam,
  expectToHaveBeenCalledWithHash
} from './helpers';

import { TEST_AUTH0_CLIENT_QUERY_STRING } from './constants';

// @ts-ignore
import { acquireLockSpy } from 'browser-tabs-lock';

import {
  checkSessionFn,
  loginWithPopupFn,
  loginWithRedirectFn,
  setupFn
} from './Auth0Client.helpers';

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
} from './constants';

import { DEFAULT_POPUP_CONFIG_OPTIONS } from '../src/constants';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../src/jwt');
jest.mock('../src/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;
const mockCookies = require('es-cookie');
const tokenVerifier = require('../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const assertUrlEquals = (actualUrl, host, path, queryParams) => {
  const url = new URL(actualUrl);
  expect(url.host).toEqual(host);
  expect(url.pathname).toEqual(path);
  for (let [key, value] of Object.entries(queryParams)) {
    expect(url.searchParams.get(key)).toEqual(value);
  }
};

const assertPost = (url, body, callNum = 0) => {
  const [actualUrl, opts] = mockFetch.mock.calls[callNum];
  expect(url).toEqual(actualUrl);
  expect(body).toEqual(JSON.parse(opts.body));
};

const fetchResponse = (ok, json) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(json)
  });

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(
  mockWindow,
  mockFetch,
  fetchResponse
);
const loginWithPopup = loginWithPopupFn(mockWindow, mockFetch, fetchResponse);
const checkSession = checkSessionFn(mockFetch, fetchResponse);

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
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('constructor', () => {
    it('automatically adds the offline_access scope during construction', () => {
      const auth0 = setup({
        useRefreshTokens: true,
        scope: 'test-scope'
      });

      expect((<any>auth0).scope).toBe('test-scope offline_access');
    });

    it('ensures the openid scope is defined when customizing default scopes', () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: 'test-scope'
        }
      });

      expect((<any>auth0).defaultScope).toBe('openid test-scope');
    });

    it('allows an empty custom default scope', () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: null
        }
      });

      expect((<any>auth0).defaultScope).toBe('openid');
    });

    it('should create issuer from domain', () => {
      const auth0 = setup({
        domain: 'test.dev'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://test.dev/');
    });

    it('should allow issuer as a domain', () => {
      const auth0 = setup({
        issuer: 'foo.bar.com'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://foo.bar.com/');
    });

    it('should allow issuer as a fully qualified url', () => {
      const auth0 = setup({
        issuer: 'https://some.issuer.com/'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://some.issuer.com/');
    });
  });

  describe('loginWithPopup', () => {
    it('should log the user in and get the user and claims', async () => {
      const auth0 = setup({ scope: 'foo' });
      await loginWithPopup(auth0);

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser()).toEqual(expectedUser);
      expect(await auth0.getUser({})).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'default' })).toEqual(
        expectedUser
      );
      expect(await auth0.getUser({ scope: 'foo' })).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'invalid' })).toBeUndefined();
      expect(await auth0.getIdTokenClaims()).toBeTruthy();
      expect(await auth0.getIdTokenClaims({})).toBeTruthy();
      expect(
        await auth0.getIdTokenClaims({ audience: 'default' })
      ).toBeTruthy();
      expect(await auth0.getIdTokenClaims({ scope: 'foo' })).toBeTruthy();
      expect(
        await auth0.getIdTokenClaims({ audience: 'invalid' })
      ).toBeUndefined();
    });

    it('should log the user in with custom scope', async () => {
      const auth0 = setup({
        scope: 'scope1',
        advancedOptions: {
          defaultScope: 'scope2'
        }
      });
      await loginWithPopup(auth0, { scope: 'scope3' });

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser({ scope: 'scope1 scope2 scope3' })).toEqual(
        expectedUser
      );
    });

    it('encodes state with random string', async () => {
      const auth0 = setup();

      await loginWithPopup(auth0);

      const [[url]] = (<jest.Mock>mockWindow.open).mock.calls;
      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        state: TEST_STATE,
        nonce: TEST_NONCE
      });
    });

    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const auth0 = setup();

      await loginWithPopup(auth0);

      const [[url]] = (<jest.Mock>mockWindow.open).mock.calls;
      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256'
      });
    });

    it('should log the user in with a popup and redirect using a default redirect URI', async () => {
      const auth0 = setup({ leeway: 10, redirect_uri: null });

      await loginWithPopup(auth0, {
        connection: 'test-connection',
        audience: 'test'
      });

      expect(mockWindow.open).toHaveBeenCalled();
      const [[url]] = (<jest.Mock>mockWindow.open).mock.calls;
      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        redirect_uri: 'http://localhost',
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('should log the user in with a popup and redirect', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0, {
        connection: 'test-connection',
        audience: 'test'
      });

      expect(mockWindow.open).toHaveBeenCalled();
      const [[url]] = (<jest.Mock>mockWindow.open).mock.calls;
      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('should log the user in with a popup and get the token', async () => {
      const auth0 = setup();

      await loginWithPopup(auth0);

      expect(mockWindow.open).toHaveBeenCalled();
      assertPost('https://auth0_domain/oauth/token', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: 'my_code'
      });
    });

    it('uses default config', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0);

      expect(utils.runPopup).toHaveBeenCalledWith(
        expect.any(String),
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
    });

    it('should be able to provide custom config', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0, {}, { timeoutInSeconds: 3 });

      expect(utils.runPopup).toHaveBeenCalledWith(expect.any(String), {
        timeoutInSeconds: 3
      });
    });

    it('throws an error if not resolved before timeout', async () => {
      const auth0 = setup({ leeway: 10 });

      await expect(
        loginWithPopup(auth0, {}, { timeoutInSeconds: 0.005 }, { delay: 10 })
      ).rejects.toThrowError('Timeout');
    });

    it('uses a custom popup specified in the configuration and redirect', async () => {
      const auth0 = setup();
      const popup = {
        location: { href: '' },
        close: jest.fn()
      };

      await loginWithPopup(
        auth0,
        { connection: 'test-connection', audience: 'test' },
        { popup }
      );

      expect(mockWindow.open).not.toHaveBeenCalled();
      assertUrlEquals(popup.location.href, TEST_DOMAIN, '/authorize', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('uses a custom popup specified in the configuration and get a token', async () => {
      const auth0 = setup();
      const popup = {
        location: { href: '' },
        close: jest.fn()
      };

      await loginWithPopup(auth0, {}, { popup });

      expect(mockWindow.open).not.toHaveBeenCalled();
      assertPost('https://auth0_domain/oauth/token', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: 'my_code'
      });
    });

    it('opens popup with custom auth0Client', async () => {
      const auth0Client = { name: '__test_client_name__', version: '9.9.9' };
      const auth0 = await setup({ auth0Client });

      await loginWithPopup(auth0);

      expect(mockWindow.open).toHaveBeenCalled();
      const [[url]] = (<jest.Mock>mockWindow.open).mock.calls;
      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        auth0Client: btoa(JSON.stringify(auth0Client))
      });
    });

    it('throws error if state from popup response is different from the provided state', async () => {
      const auth0 = setup();

      await expect(
        loginWithPopup(auth0, undefined, undefined, {
          authorize: {
            response: {
              state: 'other-state'
            }
          }
        })
      ).rejects.toThrowError('Invalid state');
    });

    it('calls `tokenVerifier.verify` with the `issuer` from in the oauth/token response', async () => {
      const auth0 = setup({
        issuer: 'test-123.auth0.com'
      });

      await loginWithPopup(auth0);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.auth0.com/'
        })
      );
    });
    it('calls `tokenVerifier.verify` with the `leeway` from constructor', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          leeway: 10
        })
      );
    });
    it('calls `tokenVerifier.verify` with undefined `max_age` when value set in constructor is an empty string', async () => {
      const auth0 = setup({ max_age: '' });

      await loginWithPopup(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: undefined
        })
      );
    });
    it('calls `tokenVerifier.verify` with the parsed `max_age` string from constructor', async () => {
      const auth0 = setup({ max_age: '10' });

      await loginWithPopup(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });
    it('calls `tokenVerifier.verify` with the parsed `max_age` number from constructor', async () => {
      const auth0 = setup({ max_age: 10 });

      await loginWithPopup(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization id', async () => {
      const auth0 = setup({ organization: 'test_org_123' });

      await loginWithPopup(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_123'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization id given in the login method', async () => {
      const auth0 = setup();
      await loginWithPopup(auth0, { organization: 'test_org_123' });

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_123'
        })
      );
    });

    it('saves into cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPopup(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
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

    it('saves decoded token into cache', async () => {
      const auth0 = setup();

      const mockDecodedToken = {
        claims: { sub: 'sub', aud: 'aus' },
        user: { sub: 'sub' }
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPopup(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
        expect.objectContaining({
          decodedToken: mockDecodedToken
        })
      );
    });

    it('should not save refresh_token in memory cache', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPopup(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalled();
      expect(auth0['cache']['save']).not.toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });
    it('should save refresh_token in local storage cache', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPopup(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });

    it('saves `auth0.is.authenticated` key in storage', async () => {
      const auth0 = setup();

      await loginWithPopup(auth0);

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

      await loginWithPopup(auth0);

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

    it('should throw an error on token failure', async () => {
      const auth0 = setup();

      await expect(
        loginWithPopup(auth0, {}, {}, { token: { success: false } })
      ).rejects.toThrowError(
        'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
      );
    });
  });

  describe('loginWithRedirect', () => {
    it('should log the user in and get the token', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0);
      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);
      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256'
      });
      assertPost('https://auth0_domain/oauth/token', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: TEST_CODE
      });
    });

    it('should log the user in and get the user', async () => {
      const auth0 = setup({ scope: 'foo' });
      await loginWithRedirect(auth0);

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser()).toEqual(expectedUser);
      expect(await auth0.getUser({})).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'default' })).toEqual(
        expectedUser
      );
      expect(await auth0.getUser({ scope: 'foo' })).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'invalid' })).toBeUndefined();
    });

    it('should log the user in and get the user with custom scope', async () => {
      const auth0 = setup({
        scope: 'scope1',
        advancedOptions: {
          defaultScope: 'scope2'
        }
      });
      await loginWithRedirect(auth0, { scope: 'scope3' });

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser({ scope: 'scope1 scope2 scope3' })).toEqual(
        expectedUser
      );
    });

    it('should log the user in with custom auth0Client', async () => {
      const auth0Client = { name: '__test_client__', version: '0.0.0' };
      const auth0 = setup({ auth0Client });
      await loginWithRedirect(auth0);
      expectToHaveBeenCalledWithAuth0ClientParam(
        mockWindow.location.assign,
        auth0Client
      );
    });

    it('should log the user in with custom fragment', async () => {
      const auth0Client = { name: '__test_client__', version: '0.0.0' };
      const auth0 = setup({ auth0Client });
      await loginWithRedirect(auth0, { fragment: '/reset' });
      expectToHaveBeenCalledWithHash(mockWindow.location.assign, '#/reset');
    });

    it('uses session storage for transactions by default', async () => {
      const auth0 = setup();
      await auth0.loginWithRedirect();

      expect((sessionStorage.setItem as jest.Mock).mock.calls[0][0]).toBe(
        'a0.spajs.txs'
      );
    });

    it('uses cookie storage for transactions', async () => {
      const auth0 = setup({ useCookiesForTransactions: true });

      await loginWithRedirect(auth0);

      // Don't necessarily need to check the contents of the cookie (the storage tests are doing that),
      // just that cookies were used when I set the correct option.
      expect((mockCookies.set as jest.Mock).mock.calls[1][0]).toEqual(
        'a0.spajs.txs'
      );
    });

    it('should throw an error on token failure', async () => {
      const auth0 = setup();

      await expect(
        loginWithRedirect(auth0, undefined, {
          token: {
            success: false
          }
        })
      ).rejects.toThrowError(
        'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
      );
    });
  });

  describe('handleRedirectCallback', () => {
    it('should not attempt to log the user in with Object prototype properties as state', async () => {
      window.history.pushState({}, '', `/?code=foo&state=constructor`);

      const auth0 = await setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await expect(auth0.handleRedirectCallback()).rejects.toThrow(
        'Invalid state'
      );
    });

    it('should throw an error if the /authorize call redirects with an error param', async () => {
      const auth0 = setup();
      let error;
      try {
        await loginWithRedirect(auth0, undefined, {
          authorize: {
            error: 'some-error'
          }
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.error).toBe('some-error');
    });
  });

  describe('getTokenSilently', () => {
    it('uses the cache when expires_in > constant leeway', async () => {
      const auth0 = setup();
      await loginWithRedirect(auth0, undefined, {
        token: {
          response: { expires_in: 70 }
        }
      });

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      mockFetch.mockReset();

      await auth0.getTokenSilently();
      expect(mockFetch).not.toHaveBeenCalled();
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
      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await auth0.getTokenSilently();
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
      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await auth0.getTokenSilently();
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
      mockFetch.mockResolvedValue(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await auth0.getTokenSilently();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('refreshes the token from a web worker', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      expect((<any>auth0).worker).toBeDefined();

      await loginWithRedirect(auth0);

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

      assertPost('https://auth0_domain/oauth/token', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: TEST_CODE
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

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN
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

      assertPost('https://auth0_domain/oauth/token', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: TEST_CODE
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

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'refresh_token',
          redirect_uri: TEST_REDIRECT_URI,
          refresh_token: TEST_REFRESH_TOKEN
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
          name: 'Safari 10',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
          supported: false
        },
        {
          name: 'Safari 11',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.28 (KHTML, like Gecko) Version/11.0 Safari/604.1.28',
          supported: false
        },
        {
          name: 'Safari 12',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.1 Safari/605.1.15',
          supported: false
        },
        {
          name: 'Safari 12.1',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
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
      const constants = require('../src/constants');
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
      // Called thrice for the refresh token grant in utils (noop)
      // Called thrice for the refresh token grant in token worker
      expect(AbortController.prototype.abort).toBeCalledTimes(6);
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
      const constants = require('../src/constants');
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
      // Called thrice for the refresh token grant in utils
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
      const auth0 = setup();
      await loginWithRedirect(auth0);
      (auth0 as any).cache.clear();
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
  });

  describe('checkSession', () => {
    it("skips checking the auth0 session when there's no auth cookie", async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe');

      await auth0.checkSession();

      expect(utils.runIframe).not.toHaveBeenCalled();
    });

    it('checks the auth0 session when there is an auth cookie', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });
      (<jest.Mock>esCookie.get).mockReturnValue(true);
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );
      await auth0.checkSession();

      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('checks the legacy samesite cookie', async () => {
      const auth0 = setup();
      (<jest.Mock>esCookie.get).mockReturnValueOnce(undefined);
      await checkSession(auth0);
      expect(<jest.Mock>esCookie.get).toHaveBeenCalledWith(
        'auth0.is.authenticated'
      );
      expect(<jest.Mock>esCookie.get).toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated'
      );
    });

    it('skips checking the legacy samesite cookie when configured', async () => {
      const auth0 = setup({
        legacySameSiteCookie: false
      });
      await checkSession(auth0);
      expect(<jest.Mock>esCookie.get).toHaveBeenCalledWith(
        'auth0.is.authenticated'
      );
      expect(<jest.Mock>esCookie.get).not.toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated'
      );
    });
  });

  describe('getUser', () => {
    it('returns undefined if there is no cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cache'], 'get').mockReturnValueOnce(undefined);

      const decodedToken = await auth0.getUser();
      expect(decodedToken).toBeUndefined();
    });
  });

  describe('getIdTokenClaims', () => {
    it('returns undefined if there is no cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cache'], 'get').mockReturnValueOnce(undefined);

      const decodedToken = await auth0.getIdTokenClaims();
      expect(decodedToken).toBeUndefined();
    });

    // The getIdTokenClaims is dependent on the result of a successful or failed login.
    // As the SDK allows for a user to login using a redirect or a popup approach,
    // functionality has to be guaranteed to be working in both situations.

    // To avoid excessive test duplication, tests are being generated twice.
    //  - once for loginWithRedirect
    //  - once for loginWithPopup
    [
      {
        name: 'loginWithRedirect',
        login: loginWithRedirect
      },
      {
        name: 'loginWithPopup',
        login: loginWithPopup
      }
    ].forEach(
      ({
        name,
        login
      }: {
        name: string;
        login: typeof loginWithRedirect | typeof loginWithPopup;
      }) => {
        describe(`when ${name}`, () => {
          it('returns the ID token claims', async () => {
            const auth0 = setup({ scope: 'foo' });
            await login(auth0);

            expect(await auth0.getIdTokenClaims()).toHaveProperty('exp');
            expect(await auth0.getIdTokenClaims()).not.toHaveProperty('me');
            expect(await auth0.getIdTokenClaims({})).toHaveProperty('exp');
            expect(
              await auth0.getIdTokenClaims({ audience: 'default' })
            ).toHaveProperty('exp');
            expect(
              await auth0.getIdTokenClaims({ scope: 'foo' })
            ).toHaveProperty('exp');
            expect(
              await auth0.getIdTokenClaims({ audience: 'invalid' })
            ).toBeUndefined();
          });

          it('returns the ID token claims with custom scope', async () => {
            const auth0 = setup({
              scope: 'scope1',
              advancedOptions: {
                defaultScope: 'scope2'
              }
            });
            await login(auth0, { scope: 'scope3' });

            expect(
              await auth0.getIdTokenClaims({ scope: 'scope1 scope2 scope3' })
            ).toHaveProperty('exp');
          });

          describe('when using refresh tokens', () => {
            it('returns the ID token claims with offline_access', async () => {
              const auth0 = setup({ scope: 'foo', useRefreshTokens: true });
              await login(auth0);

              expect(
                await auth0.getIdTokenClaims({ scope: 'foo offline_access' })
              ).toHaveProperty('exp');
            });

            it('returns the ID token claims with custom scope and offline_access', async () => {
              const auth0 = setup({
                scope: 'scope1',
                advancedOptions: {
                  defaultScope: 'scope2'
                },
                useRefreshTokens: true
              });
              await login(auth0, { scope: 'scope3' });

              expect(
                await auth0.getIdTokenClaims({
                  scope: 'scope1 scope2 scope3 offline_access'
                })
              ).toHaveProperty('exp');
            });
          });
        });
      }
    );
  });

  describe('isAuthenticated', () => {
    describe('loginWithRedirect', () => {
      it('returns true if there is an user', async () => {
        const auth0 = setup();
        await loginWithRedirect(auth0);

        const result = await auth0.isAuthenticated();
        expect(result).toBe(true);
      });

      it('returns false if error was returned', async () => {
        const auth0 = setup();
        try {
          await loginWithRedirect(auth0, undefined, {
            authorize: {
              error: 'some-error'
            }
          });
        } catch {}
        const result = await auth0.isAuthenticated();
        expect(result).toBe(false);
      });

      it('returns false if token call fails', async () => {
        const auth0 = setup();
        try {
          await loginWithRedirect(auth0, undefined, {
            token: { success: false }
          });
        } catch {}
        const result = await auth0.isAuthenticated();
        expect(result).toBe(false);
      });
    });

    describe('loginWithPopup', () => {
      it('returns true if there is an user', async () => {
        const auth0 = setup();
        await loginWithPopup(auth0);

        const result = await auth0.isAuthenticated();
        expect(result).toBe(true);
      });
    });

    it('returns false if code not part of URL', async () => {
      const auth0 = setup();
      try {
        await loginWithPopup(auth0, undefined, undefined, {
          authorize: {
            response: {
              error: 'some error'
            }
          }
        });
      } catch {}
      const result = await auth0.isAuthenticated();
      expect(result).toBe(false);
    });

    it('returns false if there is no user', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cache'], 'get').mockReturnValueOnce(undefined);

      const result = await auth0.isAuthenticated();
      expect(result).toBe(false);
    });
  });
});
