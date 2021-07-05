import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

import {
  assertPostFn,
  assertUrlEquals,
  loginWithPopupFn,
  setupFn
} from './helpers';

// @ts-ignore

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
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

import {
  DEFAULT_AUTH0_CLIENT,
  DEFAULT_POPUP_CONFIG_OPTIONS
} from '../../src/constants';

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
const loginWithPopup = loginWithPopupFn(mockWindow, mockFetch);

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

  describe('loginWithPopup', () => {
    it('should log the user in and get the user and claims', async () => {
      const auth0 = setup({ scope: 'foo' });

      mockWindow.open.mockReturnValue({ hello: 'world' });

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

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, 'auth0_domain', '/authorize', {
        state: TEST_STATE,
        nonce: TEST_NONCE
      });
    });

    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const auth0 = setup();

      await loginWithPopup(auth0);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

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

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

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

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

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

    it('should log the user in with a popup and redirect when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithPopup(auth0);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        scope: `${TEST_SCOPES} offline_access`
      });
    });

    it('should log the user and redirect when using different default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const auth0 = setup({
        redirect_uri
      });
      await loginWithPopup(auth0);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri
      });
    });

    it('should log the user in with a popup and get the token', async () => {
      const auth0 = setup();
      await loginWithPopup(auth0);
      expect(mockWindow.open).toHaveBeenCalled();

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: 'my_code'
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('uses default config', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0);

      expect(utils.runPopup).toHaveBeenCalledWith({
        ...DEFAULT_POPUP_CONFIG_OPTIONS,
        popup: expect.anything()
      });
    });

    it('should be able to provide custom config', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPopup(auth0, {}, { timeoutInSeconds: 3 });

      expect(utils.runPopup).toHaveBeenCalledWith({
        timeoutInSeconds: 3,
        popup: expect.anything()
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
      assertPost(
        'https://auth0_domain/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: 'my_code'
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('opens popup with custom auth0Client', async () => {
      const auth0Client = { name: '__test_client_name__', version: '9.9.9' };
      const auth0 = await setup({ auth0Client });

      await loginWithPopup(auth0);

      expect(mockWindow.open).toHaveBeenCalled();

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

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

      jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithPopup(auth0);

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

    it('saves decoded token into cache', async () => {
      const auth0 = setup();

      const mockDecodedToken = {
        claims: { sub: 'sub', aud: 'aus' },
        user: { sub: 'sub' }
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithPopup(auth0);

      expect(auth0['cacheManager']['set']).toHaveBeenCalledWith(
        expect.objectContaining({
          decodedToken: mockDecodedToken
        })
      );
    });

    it('should not save refresh_token in memory cache', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      jest.spyOn(auth0['cacheManager'], 'set');
      await loginWithPopup(auth0);

      expect(auth0['cacheManager']['set']).toHaveBeenCalled();

      expect(auth0['cacheManager']['set']).not.toHaveBeenCalledWith(
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

      jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithPopup(auth0);

      expect(auth0['cacheManager']['set']).toHaveBeenCalledWith(
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
});
