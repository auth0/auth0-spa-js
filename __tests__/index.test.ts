import { expectToHaveBeenCalledWithAuth0ClientParam } from './helpers';
import { CacheLocation, Auth0ClientOptions } from '../src/global';
import * as scope from '../src/scope';

// @ts-ignore
import { acquireLockSpy, releaseLockSpy } from 'browser-tabs-lock';

jest.mock('../src/jwt');
jest.mock('../src/storage', () => ({
  SessionStorage: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  },
  CookieStorage: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  },
  CookieStorageWithLegacySameSite: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  }
}));

jest.mock('../src/transaction-manager');
jest.mock('../src/utils');

import createAuth0Client, {
  Auth0Client,
  GetTokenSilentlyOptions
} from '../src/index';

import { AuthenticationError } from '../src/errors';
import { DEFAULT_POPUP_CONFIG_OPTIONS } from '../src/constants';

import {
  GET_TOKEN_SILENTLY_LOCK_KEY,
  TEST_ACCESS_TOKEN,
  TEST_APP_STATE,
  TEST_ARRAY_BUFFER,
  TEST_AUTH0_CLIENT_QUERY_STRING,
  TEST_BASE64_ENCODED_STRING,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_ENCODED_STATE,
  TEST_ID_TOKEN,
  TEST_ORG_ID,
  TEST_QUERY_PARAMS,
  TEST_RANDOM_STRING,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_USER_ID
} from './constants';

const mockEnclosedCache = {
  get: jest.fn(),
  save: jest.fn(),
  clear: jest.fn()
};

jest.mock('../src/cache', () => ({
  InMemoryCache: () => ({
    enclosedCache: mockEnclosedCache
  }),
  LocalStorageCache: () => mockEnclosedCache
}));

jest.mock('../src/token.worker');

const webWorkerMatcher = expect.objectContaining({
  postMessage: expect.any(Function)
});

const setup = async (clientOptions: Partial<Auth0ClientOptions> = {}) => {
  const getDefaultInstance = m => require(m).default.mock.instances[0];
  const cache = mockEnclosedCache;
  const tokenVerifier = require('../src/jwt').verify;
  const utils = require('../src/utils');

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

  utils.oauthToken.mockReturnValue(
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

  const auth0 = await createAuth0Client({
    domain: TEST_DOMAIN,
    client_id: TEST_CLIENT_ID,
    ...clientOptions
  });
  const transactionManager = getDefaultInstance('../src/transaction-manager');

  return {
    auth0,
    cookieStorage: require('../src/storage').CookieStorageWithLegacySameSite,
    cache,
    tokenVerifier,
    transactionManager,
    utils,
    popup
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
    );
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

  describe('buildAuthorizeUrl', () => {
    const REDIRECT_OPTIONS = {
      redirect_uri: 'https://redirect.uri',
      appState: TEST_APP_STATE,
      connection: 'test-connection'
    };

    it('encodes state with random string', async () => {
      const { auth0, utils } = await setup();

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);
      expect(utils.encode).toHaveBeenCalledWith(TEST_RANDOM_STRING);
    });

    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const { auth0, utils } = await setup();

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);
      expect(utils.sha256).toHaveBeenCalledWith(TEST_RANDOM_STRING);
      expect(utils.bufferToBase64UrlEncoded).toHaveBeenCalledWith(
        TEST_ARRAY_BUFFER
      );
    });

    it('creates correct query params', async () => {
      const { auth0, utils } = await setup();

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params with different default scopes', async () => {
      const { auth0, utils } = await setup({
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: 'openid email',
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params when using refresh tokens', async () => {
      const { auth0, utils } = await setup({
        useRefreshTokens: true
      });

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: `${TEST_SCOPES} offline_access`,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params without leeway', async () => {
      const { auth0, utils } = await setup({ leeway: 10 });

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params when providing a default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const { redirect_uri: _ignore, ...options } = REDIRECT_OPTIONS;
      const { auth0, utils } = await setup({
        redirect_uri
      });

      await auth0.buildAuthorizeUrl(options);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params when overriding redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const { auth0, utils } = await setup({
        redirect_uri
      });

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params with custom params', async () => {
      const { auth0, utils } = await setup();

      await auth0.buildAuthorizeUrl({ ...REDIRECT_OPTIONS, audience: 'test' });

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        audience: 'test',
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('calls `transactionManager.create` with new transaction', async () => {
      const { auth0, transactionManager } = await setup();

      await auth0.buildAuthorizeUrl(REDIRECT_OPTIONS);

      expect(transactionManager.create).toHaveBeenCalledWith({
        appState: TEST_APP_STATE,
        audience: 'default',
        code_verifier: TEST_RANDOM_STRING,
        nonce: TEST_ENCODED_STATE,
        scope: TEST_SCOPES,
        redirect_uri: 'https://redirect.uri'
      });
    });

    it('calls `transactionManager.create` and stores the organization ID if specified in the options', async () => {
      const { auth0, transactionManager } = await setup();

      await auth0.buildAuthorizeUrl({
        ...REDIRECT_OPTIONS,
        organization: TEST_ORG_ID
      });

      expect(transactionManager.create).toHaveBeenCalledWith({
        appState: TEST_APP_STATE,
        audience: 'default',
        code_verifier: TEST_RANDOM_STRING,
        nonce: TEST_ENCODED_STATE,
        scope: TEST_SCOPES,
        redirect_uri: 'https://redirect.uri',
        organizationId: TEST_ORG_ID
      });
    });

    it('calls `transactionManager.create` and stores the organization ID if specified in the constructor', async () => {
      const { auth0, transactionManager } = await setup({
        organization: TEST_ORG_ID
      });

      await auth0.buildAuthorizeUrl({
        ...REDIRECT_OPTIONS
      });

      expect(transactionManager.create).toHaveBeenCalledWith({
        appState: TEST_APP_STATE,
        audience: 'default',
        code_verifier: TEST_RANDOM_STRING,
        nonce: TEST_ENCODED_STATE,
        scope: TEST_SCOPES,
        redirect_uri: 'https://redirect.uri',
        organizationId: TEST_ORG_ID
      });
    });

    it('returns the url', async () => {
      const { auth0 } = await setup();

      const url = await auth0.buildAuthorizeUrl({
        ...REDIRECT_OPTIONS
      });

      expect(url).toBe(
        `https://${TEST_DOMAIN}/authorize?query=params${TEST_AUTH0_CLIENT_QUERY_STRING}`
      );
    });

    it('returns the url when no arguments are passed', async () => {
      const { auth0 } = await setup();

      const url = await auth0.buildAuthorizeUrl();

      expect(url).toBe(
        `https://${TEST_DOMAIN}/authorize?query=params${TEST_AUTH0_CLIENT_QUERY_STRING}`
      );
    });
  });

  describe('handleRedirectCallback()', () => {
    describe('when there is a valid query string in the url', () => {
      const localSetup = async (
        clientOptions?: Partial<Auth0ClientOptions>
      ) => {
        window.history.pushState(
          {},
          'Test',
          `?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
        const result = await setup(clientOptions);
        result.transactionManager.get.mockReturnValue({
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_ENCODED_STATE,
          audience: 'default',
          scope: TEST_SCOPES,
          appState: TEST_APP_STATE
        });
        result.cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });
        return result;
      };

      xit('calls oauth/token without redirect uri if not set in transaction', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const txn = transactionManager.get.mockReturnValue({
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_RANDOM_STRING,
          audience: 'default',
          scope: TEST_SCOPES,
          appState: TEST_APP_STATE
        });
        await auth0.handleRedirectCallback();
        const arg = utils.oauthToken.mock.calls[0][0];
        expect(arg.hasOwnProperty('redirect_uri')).toBeFalsy();
      });
    });
    describe('when there is a valid query string in a hash', () => {
      const localSetup = async (
        clientOptions?: Partial<Auth0ClientOptions>
      ) => {
        window.history.pushState({}, 'Test', `/`);
        window.history.pushState(
          {},
          'Test',
          `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
        const result = await setup(clientOptions);
        result.transactionManager.get.mockReturnValue({
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_ENCODED_STATE,
          audience: 'default',
          scope: TEST_SCOPES,
          appState: TEST_APP_STATE
        });
        result.cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });
        return result;
      };

      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_ENCODED_STATE,
          aud: TEST_CLIENT_ID,
          iss: `https://${TEST_DOMAIN}/`,
          leeway: undefined,
          max_age: undefined
        });
      });
      it('saves cache', async () => {
        const { auth0, cache } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(cache.save).toHaveBeenCalledWith({
          client_id: TEST_CLIENT_ID,
          access_token: TEST_ACCESS_TOKEN,
          audience: 'default',
          id_token: TEST_ID_TOKEN,
          scope: TEST_SCOPES,
          decodedToken: {
            claims: { sub: TEST_USER_ID, aud: TEST_CLIENT_ID },
            user: { sub: TEST_USER_ID }
          }
        });
      });
      it('saves `auth0.is.authenticated` key in storage', async () => {
        const { auth0, cookieStorage } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(cookieStorage.save).toHaveBeenCalledWith(
          'auth0.is.authenticated',
          true,
          {
            daysUntilExpire: 1
          }
        );
      });
      it('saves `auth0.is.authenticated` key in storage for an extended period', async () => {
        const { auth0, cookieStorage } = await localSetup({
          sessionCheckExpiryDays: 2
        });

        await auth0.handleRedirectCallback();

        expect(cookieStorage.save).toHaveBeenCalledWith(
          'auth0.is.authenticated',
          true,
          {
            daysUntilExpire: 2
          }
        );
      });
      it('returns the transactions appState', async () => {
        const { auth0 } = await localSetup();

        const response = await auth0.handleRedirectCallback();

        expect(response).toEqual({
          appState: TEST_APP_STATE
        });
      });
    });
  });

  describe('getTokenWithPopup()', () => {
    const localSetup = async (clientOptions?: Partial<Auth0ClientOptions>) => {
      const result = await setup(clientOptions);
      result.auth0.loginWithPopup = jest.fn();
      result.cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });
      return result;
    };

    it('calls `loginWithPopup` with the correct default options', async () => {
      const { auth0 } = await localSetup();

      await auth0.getTokenWithPopup();

      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: undefined,
          scope: TEST_SCOPES
        },
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
    });

    it('respects customized default scopes', async () => {
      const { auth0 } = await localSetup({
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await auth0.getTokenWithPopup();

      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: undefined,
          scope: 'openid email'
        },
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
    });

    it('calls `loginWithPopup` with the correct custom options', async () => {
      const { auth0 } = await localSetup();
      const loginOptions = {
        audience: 'other-audience',
        scope: 'other-scope'
      };

      const configOptions = { timeoutInSeconds: 1 };

      await auth0.getTokenWithPopup(loginOptions, configOptions);

      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: 'other-audience',
          scope: `${TEST_SCOPES} other-scope`
        },
        configOptions
      );
    });

    it('calls `cache.get` with the correct options', async () => {
      const { auth0, cache } = await localSetup();

      await auth0.getTokenWithPopup();

      expect(cache.get).toHaveBeenCalledWith({
        audience: 'default',
        scope: TEST_SCOPES,
        client_id: TEST_CLIENT_ID
      });
    });

    it('returns cached access_token', async () => {
      const { auth0 } = await localSetup();

      const token = await auth0.getTokenWithPopup();
      expect(token).toBe(TEST_ACCESS_TOKEN);
    });

    it('accepts empty options and config', async () => {
      const { auth0 } = await localSetup({ audience: 'foo' });

      await auth0.getTokenWithPopup();
      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: 'foo',
          scope: 'openid profile email'
        },
        { timeoutInSeconds: 60 }
      );
    });

    it('accepts partial options and config', async () => {
      const { auth0 } = await localSetup({ audience: 'foo' });

      await auth0.getTokenWithPopup({ scope: 'bar' }, { popup: 'baz' });
      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: 'foo',
          scope: 'openid profile email bar'
        },
        { timeoutInSeconds: 60, popup: 'baz' }
      );
    });
  });

  describe('buildLogoutUrl()', () => {
    it('creates correct query params with empty options', async () => {
      const { auth0, utils } = await setup();

      auth0.buildLogoutUrl();
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID
      });
    });

    it('creates correct query params with `options.client_id` is null', async () => {
      const { auth0, utils } = await setup();

      auth0.buildLogoutUrl({ client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({});
    });

    it('creates correct query params with `options.client_id` defined', async () => {
      const { auth0, utils } = await setup();

      auth0.buildLogoutUrl({ client_id: 'another-client-id' });
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: 'another-client-id'
      });
    });

    it('creates correct query params with `options.returnTo` defined', async () => {
      const { auth0, utils } = await setup();

      auth0.buildLogoutUrl({ returnTo: 'https://return.to', client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        returnTo: 'https://return.to'
      });
    });

    it('creates correct query params when `options.federated` is true', async () => {
      const { auth0, utils } = await setup();

      auth0.buildLogoutUrl({ federated: true, client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({});
    });
  });
});

describe('default creation function', () => {
  it('does nothing if there is nothing in storage', async () => {
    jest.spyOn(Auth0Client.prototype, 'getTokenSilently');
    const getSpy = jest
      .spyOn(require('../src/storage').CookieStorageWithLegacySameSite, 'get')
      .mockReturnValueOnce(false);

    const auth0 = await createAuth0Client({
      domain: TEST_DOMAIN,
      client_id: TEST_CLIENT_ID
    });

    expect(getSpy).toHaveBeenCalledWith('auth0.is.authenticated');

    expect(auth0.getTokenSilently).not.toHaveBeenCalled();
  });

  it('calls getTokenSilently if there is a storage item with key `auth0.is.authenticated`', async () => {
    Auth0Client.prototype.getTokenSilently = jest.fn();

    require('../src/storage').CookieStorage.get.mockReturnValue(true);

    const auth0 = await createAuth0Client({
      domain: TEST_DOMAIN,
      client_id: TEST_CLIENT_ID
    });

    expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
  });

  describe('when refresh tokens are not used', () => {
    it('calls getTokenSilently', async () => {
      const utils = require('../src/utils');

      const options = {
        audience: 'the-audience',
        scope: 'the-scope'
      };

      Auth0Client.prototype.getTokenSilently = jest.fn();

      require('../src/storage').get = () => true;

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
      const options = {
        audience: 'the-audience',
        scope: 'the-scope',
        useRefreshTokens: true
      };

      Auth0Client.prototype.getTokenSilently = jest.fn();

      require('../src/storage').get = () => true;

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID,
        ...options
      });

      expect((<any>auth0).scope).toBe('the-scope offline_access');

      expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
    });
  });

  describe('when localstorage is used', () => {
    it('refreshes token state regardless of isauthenticated cookie', async () => {
      const cacheLocation: CacheLocation = 'localstorage';

      const options = {
        audience: 'the-audience',
        scope: 'the-scope',
        cacheLocation
      };

      Auth0Client.prototype.getTokenSilently = jest.fn();

      require('../src/storage').get = () => false;

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID,
        ...options
      });

      expect(auth0.getTokenSilently).toHaveBeenCalledWith(undefined);
    });
  });
});
