import { CacheLocation, Auth0ClientOptions } from '../src/global';
import * as scope from '../src/scope';

// @ts-ignore

jest.mock('../src/jwt');
jest.mock('../src/transaction-manager');
jest.mock('../src/utils');
jest.mock('../src/api');

import createAuth0Client, { Auth0Client } from '../src/index';

import {
  TEST_ACCESS_TOKEN,
  TEST_ARRAY_BUFFER,
  TEST_BASE64_ENCODED_STRING,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_ENCODED_STATE,
  TEST_ID_TOKEN,
  TEST_QUERY_PARAMS,
  TEST_RANDOM_STRING,
  TEST_USER_ID
} from './constants';
import { CookieStorage } from '../src/storage';

jest.mock('../src/worker/token.worker');

jest.mock('../src/storage', () => ({
  CookieStorageWithLegacySameSite: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  }
}));

const setup = async (
  clientOptions: Partial<Auth0ClientOptions> = {},
  callConstructor = true
) => {
  const getDefaultInstance = m => require(m).default.mock.instances[0];
  const tokenVerifier = require('../src/jwt').verify;
  const utils = require('../src/utils');
  const api = require('../src/api');

  utils.createQueryParams.mockReturnValue(TEST_QUERY_PARAMS);
  utils.encode.mockReturnValue(TEST_ENCODED_STATE);
  utils.createRandomString.mockReturnValue(TEST_RANDOM_STRING);
  utils.sha256.mockReturnValue(Promise.resolve(TEST_ARRAY_BUFFER));
  utils.bufferToBase64UrlEncoded.mockReturnValue(TEST_BASE64_ENCODED_STRING);

  utils.parseQueryResult.mockReturnValue({
    state: TEST_ENCODED_STATE,
    code: TEST_CODE
  });

  utils.runPopup.mockReturnValue(
    Promise.resolve({ state: TEST_ENCODED_STATE, code: TEST_CODE })
  );

  utils.runIframe.mockReturnValue(
    Promise.resolve({ state: TEST_ENCODED_STATE, code: TEST_CODE })
  );

  api.oauthToken.mockReturnValue(
    Promise.resolve({
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN
    })
  );

  tokenVerifier.mockReturnValue({
    user: {
      sub: TEST_USER_ID
    },
    claims: {
      sub: TEST_USER_ID,
      aud: TEST_CLIENT_ID
    }
  });

  const popup = {
    location: { href: '' },
    close: jest.fn()
  };

  const auth0 = callConstructor
    ? await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID,
        ...clientOptions
      })
    : undefined;

  const transactionManager = getDefaultInstance('../src/transaction-manager');

  return {
    auth0,
    cookieStorage: require('../src/storage').CookieStorageWithLegacySameSite,
    tokenVerifier,
    transactionManager,
    utils,
    popup,
    api
  };
};

describe('Auth0', () => {
  const oldWindowLocation = window.location;
  let getUniqueScopesSpy;

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

    window.Worker = jest.fn();

    (<any>global).crypto = {
      subtle: {
        digest: () => ''
      }
    };

    getUniqueScopesSpy = jest.spyOn(scope, 'getUniqueScopes');
  });

  afterEach(() => {
    jest.clearAllMocks();
    getUniqueScopesSpy.mockRestore();
    window.location = oldWindowLocation;

    const storage = require('../src/storage').CookieStorageWithLegacySameSite;
    storage.get.mockClear();
    storage.save.mockClear();
    storage.remove.mockClear();
  });

  describe('createAuth0Client()', () => {
    it('should create an Auth0 client', async () => {
      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID
      });

      expect(auth0).toBeInstanceOf(Auth0Client);
    });

    it('should call `utils.validateCrypto`', async () => {
      const { utils } = await setup();

      expect(utils.validateCrypto).toHaveBeenCalled();
    });

    it('should fail if an invalid cache location was given', async () => {
      await expect(
        createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID,
          cacheLocation: 'dummy'
        } as any)
      ).rejects.toThrow(new Error('Invalid cache location "dummy"'));
    });

    it('should absorb "login_required" errors', async () => {
      const { utils, cookieStorage } = await setup();

      utils.runIframe.mockImplementation(() => {
        throw {
          error: 'login_required',
          error_message: 'Login required'
        };
      });

      cookieStorage.get.mockReturnValue(true);

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID
      });

      expect(auth0).toBeInstanceOf(Auth0Client);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('should absorb other recoverable errors', async () => {
      const { utils, cookieStorage } = await setup();
      cookieStorage.get.mockReturnValue(true);
      const recoverableErrors = [
        'consent_required',
        'interaction_required',
        'account_selection_required',
        'access_denied'
      ];
      for (let error of recoverableErrors) {
        utils.runIframe.mockClear();
        utils.runIframe.mockRejectedValue({ error });
        const auth0 = await createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID
        });
        expect(auth0).toBeInstanceOf(Auth0Client);
        expect(utils.runIframe).toHaveBeenCalledTimes(1);
      }
    });

    it('should throw for other errors that are not recoverable', async () => {
      const { utils, cookieStorage } = await setup();

      utils.runIframe.mockImplementation(() => {
        throw {
          error: 'some_other_error',
          error_message: 'This is a different error to login_required'
        };
      });

      cookieStorage.get.mockReturnValue(true);

      await expect(Promise.reject(new Error('foo'))).rejects.toThrow(Error);

      await expect(
        createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID
        })
      ).rejects.toStrictEqual({
        error: 'some_other_error',
        error_message: 'This is a different error to login_required'
      });
    });
  });

  describe('default creation function', () => {
    it('does nothing if there is nothing in storage', async () => {
      const { cookieStorage } = await setup(null, false);

      jest.spyOn(Auth0Client.prototype, 'getTokenSilently');
      cookieStorage.get.mockReturnValue(undefined);

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID
      });

      expect(cookieStorage.get).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`
      );

      expect(auth0.getTokenSilently).not.toHaveBeenCalled();
    });

    it('calls getTokenSilently if the authentication hint cookie is available`', async () => {
      Auth0Client.prototype.getTokenSilently = jest.fn();

      const { cookieStorage } = await setup(null, false);

      cookieStorage.get.mockReturnValue(true);

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID
      });

      expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
    });

    describe('when refresh tokens are not used', () => {
      it('calls getTokenSilently', async () => {
        const { utils, cookieStorage } = await setup(null, false);

        const options = {
          audience: 'the-audience',
          scope: 'the-scope'
        };

        Auth0Client.prototype.getTokenSilently = jest.fn();

        cookieStorage.get.mockReturnValue(true);

        const auth0 = await createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID,
          ...options
        });

        expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
      });
    });

    describe('when refresh tokens are used', () => {
      it('creates the client with the correct scopes', async () => {
        const { cookieStorage } = await setup(null, false);

        const options = {
          audience: 'the-audience',
          scope: 'the-scope',
          useRefreshTokens: true
        };

        cookieStorage.get.mockReturnValue(true);

        Auth0Client.prototype.getTokenSilently = jest.fn();

        const auth0 = await createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID,
          ...options
        });

        expect((<any>auth0).scope).toBe('the-scope offline_access');

        expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
