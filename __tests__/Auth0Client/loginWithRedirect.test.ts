import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

import {
  expectToHaveBeenCalledWithAuth0ClientParam,
  expectToHaveBeenCalledWithHash
} from '../helpers';

// @ts-ignore

import {
  assertPostFn,
  assertUrlEquals,
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
  TEST_SCOPES,
  TEST_STATE
} from '../constants';
import version from '../../src/version';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;
const mockCookies = require('es-cookie');
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const assertPost = assertPostFn(mockFetch);
const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

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
        },
        replace: {
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
          'Auth0-Client': btoa(
            JSON.stringify({
              name: 'auth0-spa-js',
              version: version
            })
          )
        }
      );
    });

    it('should log the user in using different default scope', async () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await loginWithRedirect(auth0);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        scope: 'openid email'
      });
    });

    it('should log the user in using different default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const auth0 = setup({
        redirect_uri
      });

      await loginWithRedirect(auth0);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri
      });
    });

    it('should log the user in when overriding default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const auth0 = setup({
        redirect_uri
      });

      await loginWithRedirect(auth0, {
        redirect_uri: 'https://my-redirect-uri/callback'
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri: 'https://my-redirect-uri/callback'
      });
    });

    it('should log the user in by calling window.location.replace when redirectMethod=replace param is passed', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0, {
        audience: 'test_audience',
        redirectMethod: 'replace'
      });

      const url = new URL(mockWindow.location.replace.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        audience: 'test_audience'
      });
    });

    it('should log the user in with custom params', async () => {
      const auth0 = setup();

      await loginWithRedirect(auth0, {
        audience: 'test_audience'
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        audience: 'test_audience'
      });
    });

    it('should log the user in using offline_access when using refresh tokens', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      await loginWithRedirect(auth0);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        scope: `${TEST_SCOPES} offline_access`
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

    it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
      const auth0 = setup({
        issuer: 'test-123.auth0.com'
      });

      await loginWithRedirect(auth0);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.auth0.com/',
          id_token: TEST_ID_TOKEN
        })
      );
    });

    it('calls `tokenVerifier.verify` with the global organization id', async () => {
      const auth0 = setup({ organization: 'test_org_123' });

      await loginWithRedirect(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_123'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the specific organization id', async () => {
      const auth0 = setup({ organization: 'test_org_123' });

      await loginWithRedirect(auth0, { organization: 'test_org_456' });

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_456'
        })
      );
    });

    it('saves into cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithRedirect(auth0);

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

      await loginWithRedirect(auth0);

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

      await loginWithRedirect(auth0);

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
  });
});
