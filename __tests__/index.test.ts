jest.mock('browser-tabs-lock');
jest.mock('../src/jwt');
jest.mock('../src/storage');
jest.mock('../src/transaction-manager');
jest.mock('../src/utils');

import { CacheLocation, Auth0ClientOptions } from '../src/global';
import * as scope from '../src/scope';

import createAuth0Client, {
  Auth0Client,
  GetTokenSilentlyOptions
} from '../src/index';

import { AuthenticationError } from '../src/errors';
import version from '../src/version';

import { DEFAULT_POPUP_CONFIG_OPTIONS, DEFAULT_SCOPE } from '../src/constants';

const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

const TEST_DOMAIN = 'test.auth0.com';
const TEST_CLIENT_ID = 'test-client-id';
const TEST_QUERY_PARAMS = 'query=params';
const TEST_SCOPES = DEFAULT_SCOPE;
const TEST_ENCODED_STATE = 'encoded-state';
const TEST_RANDOM_STRING = 'random-string';
const TEST_ARRAY_BUFFER = 'this-is-an-array-buffer';
const TEST_BASE64_ENCODED_STRING = 'base64-url-encoded-string';
const TEST_CODE = 'code';
const TEST_ID_TOKEN = 'id-token';
const TEST_ACCESS_TOKEN = 'access-token';
const TEST_REFRESH_TOKEN = 'refresh-token';
const TEST_USER_ID = 'user-id';
const TEST_USER_EMAIL = 'user@email.com';
const TEST_APP_STATE = { bestPet: 'dog' };
const TEST_TELEMETRY_QUERY_STRING = `&auth0Client=${encodeURIComponent(
  btoa(
    JSON.stringify({
      name: 'auth0-spa-js',
      version: version
    })
  )
)}`;

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
  const auth0 = await createAuth0Client({
    domain: TEST_DOMAIN,
    client_id: TEST_CLIENT_ID,
    ...clientOptions
  });

  const getDefaultInstance = m => require(m).default.mock.instances[0];

  const storage = {
    get: require('../src/storage').get,
    save: require('../src/storage').save,
    remove: require('../src/storage').remove
  };

  const lock = require('browser-tabs-lock');
  const cache = mockEnclosedCache;

  const tokenVerifier = require('../src/jwt').verify;
  const transactionManager = getDefaultInstance('../src/transaction-manager');
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

  return {
    auth0,
    storage,
    cache,
    tokenVerifier,
    transactionManager,
    utils,
    lock,
    popup
  };
};

describe('Auth0', () => {
  let getUniqueScopesSpy;

  beforeEach(() => {
    window.location.assign = jest.fn();
    window.Worker = jest.fn();

    (<any>global).crypto = {
      subtle: {
        digest: () => ''
      }
    };

    getUniqueScopesSpy = jest.spyOn(scope, 'getUniqueScopes');
  });

  afterEach(() => {
    jest.resetAllMocks();
    getUniqueScopesSpy.mockRestore();
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
      const { utils, storage } = await setup();

      utils.runIframe.mockImplementation(() => {
        throw {
          error: 'login_required',
          error_message: 'Login required'
        };
      });

      storage.get.mockReturnValue(true);

      const auth0 = await createAuth0Client({
        domain: TEST_DOMAIN,
        client_id: TEST_CLIENT_ID
      });

      expect(auth0).toBeInstanceOf(Auth0Client);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('should throw other errors that are not "login_required"', async () => {
      const { utils, storage } = await setup();

      utils.runIframe.mockImplementation(() => {
        throw {
          error: 'some_other_error',
          error_message: 'This is a different error to login_required'
        };
      });

      storage.get.mockReturnValue(true);

      // We expect one assertion, meaning that if the function under test
      // does not throw, it will still fail the test.
      expect.assertions(1);

      try {
        await createAuth0Client({
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID
        });
      } catch (e) {
        expect(e.error).toEqual('some_other_error');
      }
    });
  });

  describe('loginWithPopup()', () => {
    it('opens popup', async () => {
      const { auth0 } = await setup();

      await auth0.loginWithPopup({});
    });

    it('uses a custom popup specified in the configuration', async () => {
      const { auth0, popup, utils } = await setup();

      await auth0.loginWithPopup({}, { popup });

      expect(utils.runPopup).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        {
          popup,
          timeoutInSeconds: 60
        }
      );
    });

    it('encodes state with random string', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({});
      expect(utils.encode).toHaveBeenCalledWith(TEST_RANDOM_STRING);
    });

    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({});
      expect(utils.sha256).toHaveBeenCalledWith(TEST_RANDOM_STRING);
      expect(utils.bufferToBase64UrlEncoded).toHaveBeenCalledWith(
        TEST_ARRAY_BUFFER
      );
    });

    it('creates correct query params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({
        connection: 'test-connection'
      });

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'web_message',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: 'http://localhost',
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params without leeway', async () => {
      const { auth0, utils } = await setup({ leeway: 10 });

      await auth0.loginWithPopup({
        connection: 'test-connection'
      });

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'web_message',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: 'http://localhost',
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('creates correct query params when providing a default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const { auth0, utils } = await setup({
        redirect_uri
      });

      await auth0.loginWithPopup({});

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'web_message',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256'
      });
    });

    it('creates correct query params with custom params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({ audience: 'test' });

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        audience: 'test',
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'web_message',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri: 'http://localhost',
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256'
      });
    });

    it('opens popup with correct popup, url and default config', async () => {
      const { auth0, utils } = await setup();
      await auth0.loginWithPopup();

      expect(utils.runPopup).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
    });
    it('opens popup with correct popup, url and custom config', async () => {
      const { auth0, utils } = await setup();
      await auth0.loginWithPopup({}, { timeoutInSeconds: 1 });
      expect(
        utils.runPopup
      ).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        { timeoutInSeconds: 1 }
      );
    });

    it('opens popup with correct popup, url and timeout from client options', async () => {
      const { auth0, utils } = await setup({ authorizeTimeoutInSeconds: 1 });

      await auth0.loginWithPopup(
        {},
        {
          timeoutInSeconds: 25
        }
      );

      expect(
        utils.runPopup
      ).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        { timeoutInSeconds: 25 }
      );
    });

    it('throws error if state from popup response is different from the provided state', async () => {
      const { auth0, utils } = await setup();

      utils.runPopup.mockReturnValue(
        Promise.resolve({
          state: 'other-state'
        })
      );
      await expect(auth0.loginWithPopup({})).rejects.toThrowError(
        'Invalid state'
      );
    });
    it('calls oauth/token with correct params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({});

      expect(utils.oauthToken).toHaveBeenCalledWith(
        {
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost'
        },
        undefined
      );
    });

    it('calls oauth/token with the same custom redirect_uri as /authorize', async () => {
      const redirect_uri = 'http://another.uri';

      const { auth0, utils } = await setup({
        redirect_uri
      });

      await auth0.loginWithPopup();

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'web_message',
        state: TEST_ENCODED_STATE,
        nonce: TEST_ENCODED_STATE,
        redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256'
      });

      expect(utils.oauthToken).toHaveBeenCalledWith(
        {
          audience: undefined,
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING,
          grant_type: 'authorization_code',
          redirect_uri
        },
        undefined
      );
    });

    it('calls oauth/token with correct params and a different audience', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({ audience: 'test-audience' });
      expect(utils.oauthToken).toHaveBeenCalledWith(
        {
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost'
        },
        undefined
      );
    });
    it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
      const { auth0, tokenVerifier } = await setup();

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        aud: 'test-client-id',
        iss: 'https://test.auth0.com/',
        leeway: undefined,
        max_age: undefined
      });
    });
    it('calls `tokenVerifier.verify` with the `issuer` from in the oauth/token response', async () => {
      const { auth0, tokenVerifier } = await setup({
        issuer: 'test-123.auth0.com'
      });

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        aud: 'test-client-id',
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        iss: 'https://test-123.auth0.com/',
        leeway: undefined,
        max_age: undefined
      });
    });
    it('calls `tokenVerifier.verify` with the `leeway` from constructor', async () => {
      const { auth0, tokenVerifier } = await setup({ leeway: 10 });

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        aud: 'test-client-id',
        iss: 'https://test.auth0.com/',
        leeway: 10,
        max_age: undefined
      });
    });
    it('calls `tokenVerifier.verify` with undefined `max_age` when value set in constructor is an empty string', async () => {
      const { auth0, tokenVerifier } = await setup({ max_age: '' });

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        aud: 'test-client-id',
        iss: 'https://test.auth0.com/',
        leeway: undefined,
        max_age: undefined
      });
    });
    it('calls `tokenVerifier.verify` with the parsed `max_age` string from constructor', async () => {
      const { auth0, tokenVerifier } = await setup({ max_age: '10' });

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        aud: 'test-client-id',
        iss: 'https://test.auth0.com/',
        leeway: undefined,
        max_age: 10
      });
    });
    it('calls `tokenVerifier.verify` with the parsed `max_age` number from constructor', async () => {
      const { auth0, tokenVerifier } = await setup({ max_age: 10 });

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_ENCODED_STATE,
        aud: 'test-client-id',
        iss: 'https://test.auth0.com/',
        leeway: undefined,
        max_age: 10
      });
    });
    it('saves cache', async () => {
      const { auth0, cache } = await setup();

      await auth0.loginWithPopup({});
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
      const { auth0, storage } = await setup();

      await auth0.loginWithPopup({});
      expect(storage.save).toHaveBeenCalledWith(
        'auth0.is.authenticated',
        true,
        { daysUntilExpire: 1 }
      );
    });
    it('can be called with no arguments', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup();
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
        response_type: TEST_CODE,
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
      expect(transactionManager.create).toHaveBeenCalledWith(
        TEST_ENCODED_STATE,
        {
          appState: TEST_APP_STATE,
          audience: 'default',
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_ENCODED_STATE,
          scope: TEST_SCOPES,
          redirect_uri: 'https://redirect.uri'
        }
      );
    });

    it('returns the url', async () => {
      const { auth0 } = await setup();

      const url = await auth0.buildAuthorizeUrl({
        ...REDIRECT_OPTIONS
      });

      expect(url).toBe(
        `https://test.auth0.com/authorize?query=params${TEST_TELEMETRY_QUERY_STRING}`
      );
    });

    it('returns the url when no arguments are passed', async () => {
      const { auth0 } = await setup();

      const url = await auth0.buildAuthorizeUrl();

      expect(url).toBe(
        `https://test.auth0.com/authorize?query=params${TEST_TELEMETRY_QUERY_STRING}`
      );
    });
  });

  describe('loginWithRedirect()', () => {
    const REDIRECT_OPTIONS = {
      redirect_uri: 'https://redirect.uri',
      appState: TEST_APP_STATE,
      connection: 'test-connection'
    };

    it('calls `window.location.assign` with the correct url', async () => {
      const { auth0 } = await setup();

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?query=params${TEST_TELEMETRY_QUERY_STRING}`
      );
    });

    it('calls `window.location.assign` with the correct url and fragment if provided', async () => {
      const { auth0 } = await setup();

      await auth0.loginWithRedirect({
        ...REDIRECT_OPTIONS,
        fragment: '/reset'
      });
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?query=params${TEST_TELEMETRY_QUERY_STRING}#/reset`
      );
    });

    it('can be called with no arguments', async () => {
      const { auth0 } = await setup();

      await auth0.loginWithRedirect();

      expect(window.location.assign).toHaveBeenCalledWith(
        `https://test.auth0.com/authorize?query=params${TEST_TELEMETRY_QUERY_STRING}`
      );
    });
  });

  describe('handleRedirectCallback()', () => {
    it('throws when there is no query string', async () => {
      const { auth0 } = await setup();
      await expect(auth0.handleRedirectCallback()).rejects.toThrow(
        'There are no query params available for parsing.'
      );
    });

    describe('when there is a valid query string in the url', () => {
      const localSetup = async () => {
        window.history.pushState(
          {},
          'Test',
          `?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
        const result = await setup();
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
      it('calls parseQueryResult correctly', async () => {
        const { auth0, utils } = await localSetup();
        await auth0.handleRedirectCallback();
        expect(utils.parseQueryResult).toHaveBeenCalledWith(
          `code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
      });
      it('uses `state` from parsed query to get a transaction', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryState = 'the-state';
        utils.parseQueryResult.mockReturnValue({ state: queryState });

        await auth0.handleRedirectCallback();

        expect(transactionManager.get).toHaveBeenCalledWith(queryState);
      });
      it('throws error with AuthenticationError', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = { error: 'unauthorized' };
        utils.parseQueryResult.mockReturnValue(queryResult);

        await expect(auth0.handleRedirectCallback()).rejects.toBeInstanceOf(
          AuthenticationError
        );
      });
      it('throws AuthenticationError with message from error_description', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = {
          error: 'unauthorized',
          error_description: 'Unauthorized user'
        };
        utils.parseQueryResult.mockReturnValue(queryResult);

        await expect(auth0.handleRedirectCallback()).rejects.toThrow(
          queryResult.error_description
        );
      });

      it('throws AuthenticationError with state, error, error_description', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = {
          error: 'unauthorized',
          error_description: 'Unauthorized user',
          state: 'abcxyz'
        };
        utils.parseQueryResult.mockReturnValue(queryResult);

        let errorThrown: AuthenticationError;
        try {
          await auth0.handleRedirectCallback();
        } catch (error) {
          errorThrown = error;
        }

        expect(errorThrown.state).toEqual(queryResult.state);
        expect(errorThrown.error).toEqual(queryResult.error);
        expect(errorThrown.error_description).toEqual(
          queryResult.error_description
        );
      });

      it('throws AuthenticationError and includes the transaction state', async () => {
        const { auth0, utils, transactionManager } = await localSetup();

        const appState = {
          key: 'property'
        };

        transactionManager.get.mockReturnValue({ appState });

        const queryResult = {
          error: 'unauthorized',
          error_description: 'Unauthorized user',
          state: 'abcxyz'
        };

        utils.parseQueryResult.mockReturnValue(queryResult);

        let errorThrown: AuthenticationError;

        try {
          await auth0.handleRedirectCallback();
        } catch (error) {
          errorThrown = error;
        }

        expect(errorThrown.appState).toEqual(appState);
      });

      it('throws error when there is no transaction', async () => {
        const { auth0, transactionManager } = await localSetup();
        transactionManager.get.mockReturnValue(undefined);

        await expect(auth0.handleRedirectCallback()).rejects.toThrow(
          'Invalid state'
        );
      });
      it('clears the transaction data when an error occurs', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryResult = { error: 'unauthorized', state: '897dfuksdfuo' };
        utils.parseQueryResult.mockReturnValue(queryResult);

        try {
          await auth0.handleRedirectCallback();
        } catch (e) {
          expect(transactionManager.remove).toHaveBeenCalledWith(
            queryResult.state
          );
        }
      });
      it('uses `state` from parsed query to remove the transaction', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryState = 'the-state';
        utils.parseQueryResult.mockReturnValue({ state: queryState });

        await auth0.handleRedirectCallback();

        expect(transactionManager.remove).toHaveBeenCalledWith(queryState);
      });
      it('calls oauth/token with correct params', async () => {
        const { auth0, utils } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(utils.oauthToken).toHaveBeenCalledWith(
          {
            baseUrl: 'https://test.auth0.com',
            client_id: TEST_CLIENT_ID,
            code: TEST_CODE,
            code_verifier: TEST_RANDOM_STRING,
            grant_type: 'authorization_code'
          },
          undefined
        );
      });
      it('calls oauth/token with redirect uri from transaction if set', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const txn = transactionManager.get.mockReturnValue({
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_RANDOM_STRING,
          audience: 'default',
          scope: TEST_SCOPES,
          appState: TEST_APP_STATE,
          redirect_uri: 'http://localhost'
        });
        await auth0.handleRedirectCallback();
        const arg = utils.oauthToken.mock.calls[0][0];
        expect(arg.hasOwnProperty('redirect_uri')).toBeTruthy();
        expect(arg.redirect_uri).toEqual('http://localhost');
      });
      it('calls oauth/token without redirect uri if not set in transaction', async () => {
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
      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_ENCODED_STATE,
          aud: 'test-client-id',
          iss: 'https://test.auth0.com/',
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
        const { auth0, storage } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(storage.save).toHaveBeenCalledWith(
          'auth0.is.authenticated',
          true,
          { daysUntilExpire: 1 }
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
    describe('when there is a valid query string in a hash', () => {
      const localSetup = async () => {
        window.history.pushState({}, 'Test', `/`);
        window.history.pushState(
          {},
          'Test',
          `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
        const result = await setup();
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
      it('calls parseQueryResult correctly', async () => {
        const { auth0, utils } = await localSetup();
        await auth0.handleRedirectCallback();
        expect(utils.parseQueryResult).toHaveBeenCalledWith(
          `code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
      });
      it('calls parseQueryResult with a passed URL', async () => {
        const { auth0, utils } = await localSetup();
        const customUrl = `https://test.auth0.com?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`;
        await auth0.handleRedirectCallback(customUrl);
        expect(utils.parseQueryResult).toHaveBeenCalledWith(
          `code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
      });
      it('uses `state` from parsed query to get a transaction', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryState = 'the-state';
        utils.parseQueryResult.mockReturnValue({ state: queryState });

        await auth0.handleRedirectCallback();

        expect(transactionManager.get).toHaveBeenCalledWith(queryState);
      });
      it('throws error with AuthenticationError', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = { error: 'unauthorized' };
        utils.parseQueryResult.mockReturnValue(queryResult);

        await expect(auth0.handleRedirectCallback()).rejects.toBeInstanceOf(
          AuthenticationError
        );
      });
      it('throws AuthenticationError with message from error_description', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = {
          error: 'unauthorized',
          error_description: 'Unauthorized user'
        };
        utils.parseQueryResult.mockReturnValue(queryResult);

        await expect(auth0.handleRedirectCallback()).rejects.toThrow(
          queryResult.error_description
        );
      });
      it('throws AuthenticationError with state, error, error_description', async () => {
        const { auth0, utils } = await localSetup();
        const queryResult = {
          error: 'unauthorized',
          error_description: 'Unauthorized user',
          state: 'abcxyz'
        };
        utils.parseQueryResult.mockReturnValue(queryResult);

        let errorThrown: AuthenticationError;
        try {
          await auth0.handleRedirectCallback();
        } catch (error) {
          errorThrown = error;
        }

        expect(errorThrown.state).toEqual(queryResult.state);
        expect(errorThrown.error).toEqual(queryResult.error);
        expect(errorThrown.error_description).toEqual(
          queryResult.error_description
        );
      });
      it('clears the transaction data when an error occurs', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryResult = { error: 'unauthorized', state: '897dfuksdfuo' };
        utils.parseQueryResult.mockReturnValue(queryResult);

        try {
          await auth0.handleRedirectCallback();
        } catch (e) {
          expect(transactionManager.remove).toHaveBeenCalledWith(
            queryResult.state
          );
        }
      });
      it('throws error when there is no transaction', async () => {
        const { auth0, transactionManager } = await localSetup();
        transactionManager.get.mockReturnValue(undefined);

        await expect(auth0.handleRedirectCallback()).rejects.toThrow(
          'Invalid state'
        );
      });
      it('uses `state` from parsed query to remove the transaction', async () => {
        const { auth0, utils, transactionManager } = await localSetup();
        const queryState = 'the-state';
        utils.parseQueryResult.mockReturnValue({ state: queryState });

        await auth0.handleRedirectCallback();

        expect(transactionManager.remove).toHaveBeenCalledWith(queryState);
      });
      it('calls oauth/token with correct params', async () => {
        const { auth0, utils } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(utils.oauthToken).toHaveBeenCalledWith(
          {
            baseUrl: 'https://test.auth0.com',
            client_id: TEST_CLIENT_ID,
            code: TEST_CODE,
            code_verifier: TEST_RANDOM_STRING,
            grant_type: 'authorization_code'
          },
          undefined
        );
      });
      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_ENCODED_STATE,
          aud: 'test-client-id',
          iss: 'https://test.auth0.com/',
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
        const { auth0, storage } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(storage.save).toHaveBeenCalledWith(
          'auth0.is.authenticated',
          true,
          { daysUntilExpire: 1 }
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

  describe('getUser()', () => {
    it('returns undefined if there is no cache', async () => {
      const { auth0, cache } = await setup();
      cache.get.mockReturnValue(undefined);
      const decodedToken = await auth0.getUser();
      expect(decodedToken).toBeUndefined();
    });
    it('returns only user information if there is a cache entry', async () => {
      const { auth0, cache } = await setup();
      const userIn = {
        decodedToken: {
          claims: {
            sub: TEST_USER_ID,
            email: TEST_USER_EMAIL,
            aud: TEST_CLIENT_ID
          },
          user: { sub: TEST_USER_ID, email: TEST_USER_EMAIL }
        }
      };
      cache.get.mockReturnValue(userIn);
      const userOut = await auth0.getUser();
      expect(userOut).toEqual({ sub: TEST_USER_ID, email: TEST_USER_EMAIL });
    });
    it('uses default options', async () => {
      const { auth0, cache } = await setup();

      await auth0.getUser();

      expect(cache.get).toHaveBeenCalledWith({
        audience: 'default',
        scope: TEST_SCOPES,
        client_id: TEST_CLIENT_ID
      });
    });

    it('uses custom options when provided', async () => {
      const { auth0, cache } = await setup();
      await auth0.getUser({ audience: 'the-audience', scope: 'the-scope' });

      expect(cache.get).toHaveBeenCalledWith({
        audience: 'the-audience',
        scope: `${TEST_SCOPES} the-scope`,
        client_id: TEST_CLIENT_ID
      });
    });

    it('uses a custom default scope', async () => {
      const { auth0, cache } = await setup({
        advancedOptions: {
          defaultScope: 'email'
        }
      });

      await auth0.getUser({ audience: 'the-audience', scope: 'the-scope' });

      expect(cache.get).toHaveBeenCalledWith({
        audience: 'the-audience',
        scope: `openid email the-scope`,
        client_id: TEST_CLIENT_ID
      });
    });
  });

  describe('getIdTokenClaims()', () => {
    it('returns undefined if there is no cache', async () => {
      const { auth0, cache } = await setup();
      cache.get.mockReturnValue(undefined);
      const decodedToken = await auth0.getIdTokenClaims();
      expect(decodedToken).toBeUndefined();
    });

    it('returns full decoded token if there is a cache entry', async () => {
      const { auth0, cache } = await setup();
      const userIn = {
        decodedToken: {
          claims: {
            aud: TEST_CLIENT_ID,
            sub: TEST_USER_ID,
            email: TEST_USER_EMAIL
          },
          user: { sub: TEST_USER_ID, email: TEST_USER_EMAIL }
        }
      };
      cache.get.mockReturnValue(userIn);
      const userOut = await auth0.getIdTokenClaims();
      expect(userOut).toEqual(userIn.decodedToken.claims);
    });

    it('should respect advanced defaultScope option when provided', async () => {
      const { auth0, cache } = await setup({
        advancedOptions: { defaultScope: 'openid custom-scope' }
      });

      await auth0.getIdTokenClaims({
        audience: 'the-audience',
        scope: 'openid custom-scope'
      });

      expect(cache.get).toHaveBeenCalledWith({
        audience: 'the-audience',
        client_id: TEST_CLIENT_ID,
        scope: 'openid custom-scope'
      });
    });

    describe('when using refresh tokens', () => {
      it('uses default options with offine_access', async () => {
        const { auth0, cache } = await setup({
          useRefreshTokens: true
        });

        await auth0.getIdTokenClaims();

        expect(cache.get).toHaveBeenCalledWith({
          audience: 'default',
          scope: `${TEST_SCOPES} offline_access`,
          client_id: TEST_CLIENT_ID
        });
      });

      it('uses custom options when provided with offline_access', async () => {
        const { auth0, cache, utils } = await setup({
          useRefreshTokens: true
        });

        await auth0.getIdTokenClaims({
          audience: 'the-audience',
          scope: 'the-scope'
        });

        expect(cache.get).toHaveBeenCalledWith({
          audience: 'the-audience',
          scope: `${TEST_SCOPES} offline_access the-scope`,
          client_id: TEST_CLIENT_ID
        });
      });
    });

    describe('when not using refresh tokens', () => {
      it('uses default options', async () => {
        const { auth0, cache } = await setup();

        await auth0.getIdTokenClaims();

        expect(cache.get).toHaveBeenCalledWith({
          audience: 'default',
          scope: TEST_SCOPES,
          client_id: TEST_CLIENT_ID
        });
      });

      it('uses custom options when provided', async () => {
        const { auth0, cache } = await setup();

        await auth0.getIdTokenClaims({
          audience: 'the-audience',
          scope: 'the-scope'
        });

        expect(cache.get).toHaveBeenCalledWith({
          audience: 'the-audience',
          scope: `${TEST_SCOPES} the-scope`,
          client_id: TEST_CLIENT_ID
        });
      });
    });
  });

  describe('isAuthenticated()', () => {
    it('returns true if there is an user', async () => {
      const { auth0 } = await setup();
      auth0.getUser = jest.fn(() =>
        Promise.resolve({
          id: TEST_USER_ID
        })
      );
      const result = await auth0.isAuthenticated();
      expect(result).toBe(true);
    });
    it('returns false if there is not an user', async () => {
      const { auth0 } = await setup();
      auth0.getUser = jest.fn(() => undefined);
      const result = await auth0.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getTokenSilently()', () => {
    describe('when `options.ignoreCache` is false', () => {
      describe('when refresh tokens are not used', () => {
        it('calls `cache.get` with the correct options', async () => {
          const { auth0, cache } = await setup();
          cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

          await auth0.getTokenSilently();

          expect(cache.get).toHaveBeenCalledWith({
            audience: 'default',
            scope: TEST_SCOPES,
            client_id: TEST_CLIENT_ID
          });
        });

        it('returns cached access_token when there is a cache', async () => {
          const { auth0, cache } = await setup();
          cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

          const token = await auth0.getTokenSilently();

          expect(token).toBe(TEST_ACCESS_TOKEN);
        });

        it('continues method execution when there is no cache available', async () => {
          const { auth0, utils } = await setup();

          await auth0.getTokenSilently();

          // we only evaluate that the code didn't bail out because of the cache
          expect(utils.encode).toHaveBeenCalledWith(TEST_RANDOM_STRING);
        });

        it('continues method execution when there is a value from the cache but no access token', async () => {
          const { auth0, utils, cache } = await setup();

          cache.get.mockReturnValue({});

          await auth0.getTokenSilently();

          // we only evaluate that the code didn't bail out because the cache didn't return
          // an access token
          expect(utils.encode).toHaveBeenCalledWith(TEST_RANDOM_STRING);
        });

        it('respects the global default scopes', async () => {
          const { auth0, cache } = await setup({
            advancedOptions: {
              defaultScope: 'email'
            }
          });

          cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

          await auth0.getTokenSilently();

          expect(cache.get).toHaveBeenCalledWith({
            audience: 'default',
            scope: 'openid email',
            client_id: TEST_CLIENT_ID
          });
        });
      });

      describe('when refresh tokens are used', () => {
        it('calls `cache.get` with the correct options', async () => {
          const { auth0, cache } = await setup({
            useRefreshTokens: true
          });

          cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

          await auth0.getTokenSilently();

          expect(cache.get).toHaveBeenCalledWith({
            audience: 'default',
            scope: `${TEST_SCOPES} offline_access`,
            client_id: TEST_CLIENT_ID
          });
        });

        it('calls the token endpoint with the correct params', async () => {
          const { auth0, cache, utils } = await setup({
            useRefreshTokens: true
          });

          utils.oauthToken.mockReturnValue(
            Promise.resolve({
              id_token: TEST_ID_TOKEN,
              access_token: TEST_ACCESS_TOKEN,
              refresh_token: TEST_REFRESH_TOKEN
            })
          );

          cache.get.mockReturnValue({ refresh_token: TEST_REFRESH_TOKEN });

          await auth0.getTokenSilently({ ignoreCache: true });

          expect(cache.get).toHaveBeenCalledWith({
            audience: 'default',
            scope: `${TEST_SCOPES} offline_access`,
            client_id: TEST_CLIENT_ID
          });

          expect(utils.oauthToken).toHaveBeenCalledWith(
            {
              baseUrl: 'https://test.auth0.com',
              refresh_token: TEST_REFRESH_TOKEN,
              client_id: TEST_CLIENT_ID,
              grant_type: 'refresh_token',
              redirect_uri: 'http://localhost'
            },
            webWorkerMatcher
          );

          expect(cache.save).toHaveBeenCalledWith({
            client_id: TEST_CLIENT_ID,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            id_token: TEST_ID_TOKEN,
            scope: `${TEST_SCOPES} offline_access`,
            audience: 'default',
            decodedToken: {
              claims: { sub: TEST_USER_ID, aud: TEST_CLIENT_ID },
              user: { sub: TEST_USER_ID }
            }
          });
        });

        it('calls the token endpoint with the correct params with different default scopes', async () => {
          const { auth0, cache, utils } = await setup({
            useRefreshTokens: true,
            advancedOptions: {
              defaultScope: 'email'
            }
          });

          utils.oauthToken.mockReturnValue(
            Promise.resolve({
              id_token: TEST_ID_TOKEN,
              access_token: TEST_ACCESS_TOKEN,
              refresh_token: TEST_REFRESH_TOKEN
            })
          );

          cache.get.mockReturnValue({ refresh_token: TEST_REFRESH_TOKEN });

          await auth0.getTokenSilently({ ignoreCache: true });

          expect(cache.get).toHaveBeenCalledWith({
            audience: 'default',
            scope: `openid email offline_access`,
            client_id: TEST_CLIENT_ID
          });

          expect(utils.oauthToken).toHaveBeenCalledWith(
            {
              baseUrl: 'https://test.auth0.com',
              refresh_token: TEST_REFRESH_TOKEN,
              client_id: TEST_CLIENT_ID,
              grant_type: 'refresh_token',
              redirect_uri: 'http://localhost'
            },
            webWorkerMatcher
          );

          expect(cache.save).toHaveBeenCalledWith({
            client_id: TEST_CLIENT_ID,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            id_token: TEST_ID_TOKEN,
            scope: `openid email offline_access`,
            audience: 'default',
            decodedToken: {
              claims: { sub: TEST_USER_ID, aud: TEST_CLIENT_ID },
              user: { sub: TEST_USER_ID }
            }
          });
        });

        it('falls back to the iframe method when an audience is specified', async () => {
          const { auth0, utils } = await setup({
            useRefreshTokens: true
          });

          await auth0.getTokenSilently({
            audience: 'other-audience',
            ignoreCache: true
          });

          expect(utils.runIframe).toHaveBeenCalledWith(
            `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
            'https://test.auth0.com',
            undefined
          );
        });
      });
    });

    describe('when `options.ignoreCache` is true', () => {
      const defaultOptionsIgnoreCacheTrue: GetTokenSilentlyOptions = {
        audience: 'test:audience',
        scope: 'test:scope',
        ignoreCache: true
      };

      it('releases the lock when there is an error', async () => {
        const { auth0, lock, utils } = await setup();

        utils.runIframe.mockReturnValue(Promise.reject(new Error('Failed')));

        await expect(auth0.getTokenSilently()).rejects.toThrowError('Failed');

        expect(lock.acquireLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY,
          5000
        );

        expect(lock.releaseLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY
        );
      });

      it('encodes state with random string', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.encode).toHaveBeenCalledWith(TEST_RANDOM_STRING);
      });

      it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.sha256).toHaveBeenCalledWith(TEST_RANDOM_STRING);
        expect(utils.bufferToBase64UrlEncoded).toHaveBeenCalledWith(
          TEST_ARRAY_BUFFER
        );
      });

      it('creates correct query params', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);

        expect(utils.createQueryParams).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          client_id: TEST_CLIENT_ID,
          scope: `${TEST_SCOPES} test:scope`,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_ENCODED_STATE,
          redirect_uri: 'http://localhost',
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256'
        });
      });

      it('creates correct query params without leeway', async () => {
        const { auth0, utils } = await setup({ leeway: 10 });

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.createQueryParams).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          client_id: TEST_CLIENT_ID,
          scope: `${TEST_SCOPES} test:scope`,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_ENCODED_STATE,
          redirect_uri: 'http://localhost',
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256'
        });
      });

      it('creates correct query params when providing a default redirect_uri', async () => {
        const redirect_uri = 'https://custom-redirect-uri/callback';
        const { auth0, utils } = await setup({
          redirect_uri
        });

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.createQueryParams).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          client_id: TEST_CLIENT_ID,
          scope: `${TEST_SCOPES} test:scope`,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_ENCODED_STATE,
          redirect_uri,
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256'
        });
      });

      it('creates correct query params with custom params', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);

        expect(utils.createQueryParams).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          client_id: TEST_CLIENT_ID,
          scope: `${TEST_SCOPES} test:scope`,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_ENCODED_STATE,
          redirect_uri: 'http://localhost',
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256'
        });
      });

      it('creates correct query params when providing user specified custom query params', async () => {
        const { auth0, utils } = await setup();

        const customQueryParameterOptions = {
          ...defaultOptionsIgnoreCacheTrue,
          foo: 'bar'
        };

        await auth0.getTokenSilently(customQueryParameterOptions);

        expect(utils.createQueryParams).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          client_id: TEST_CLIENT_ID,
          scope: `${TEST_SCOPES} test:scope`,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_ENCODED_STATE,
          redirect_uri: 'http://localhost',
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256',
          foo: 'bar'
        });
      });

      it('opens iframe with correct urls', async () => {
        const { auth0, utils } = await setup();
        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.runIframe).toHaveBeenCalledWith(
          `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
          'https://test.auth0.com',
          defaultOptionsIgnoreCacheTrue.timeoutInSeconds
        );
      });

      it('opens iframe with correct urls and timeout from client options', async () => {
        const { auth0, utils } = await setup({ authorizeTimeoutInSeconds: 1 });
        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.runIframe).toHaveBeenCalledWith(
          `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
          'https://test.auth0.com',
          1
        );
      });

      it('opens iframe with correct urls and custom timeout', async () => {
        const { auth0, utils } = await setup();
        await auth0.getTokenSilently({
          ...defaultOptionsIgnoreCacheTrue,
          timeoutInSeconds: 1
        });
        expect(utils.runIframe).toHaveBeenCalledWith(
          `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
          'https://test.auth0.com',
          1
        );
      });

      it('throws error if state from popup response is different from the provided state', async () => {
        const { auth0, utils, lock } = await setup();

        utils.runIframe.mockReturnValue(
          Promise.resolve({
            state: 'other-state'
          })
        );

        await expect(
          auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue)
        ).rejects.toThrowError('Invalid state');

        expect(lock.releaseLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY
        );
      });

      it('calls oauth/token with correct params', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);

        expect(utils.oauthToken).toHaveBeenCalledWith(
          {
            baseUrl: 'https://test.auth0.com',
            client_id: TEST_CLIENT_ID,
            code: TEST_CODE,
            code_verifier: TEST_RANDOM_STRING,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost'
          },
          undefined
        );
      });

      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_ENCODED_STATE,
          aud: 'test-client-id',
          iss: 'https://test.auth0.com/',
          leeway: undefined,
          max_age: undefined
        });
      });
      it('saves cache', async () => {
        const { auth0, cache } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(cache.save).toHaveBeenCalledWith({
          client_id: TEST_CLIENT_ID,
          access_token: TEST_ACCESS_TOKEN,
          audience: defaultOptionsIgnoreCacheTrue.audience,
          id_token: TEST_ID_TOKEN,
          scope: `${TEST_SCOPES} test:scope`,
          decodedToken: {
            claims: { sub: TEST_USER_ID, aud: TEST_CLIENT_ID },
            user: { sub: TEST_USER_ID }
          }
        });
      });
      it('saves `auth0.is.authenticated` key in storage', async () => {
        const { auth0, storage } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(storage.save).toHaveBeenCalledWith(
          'auth0.is.authenticated',
          true,
          { daysUntilExpire: 1 }
        );
      });
      it('acquires and releases lock', async () => {
        const { auth0, lock } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);

        expect(lock.acquireLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY,
          5000
        );
        expect(lock.releaseLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY
        );
      });
    });
  });

  describe('getTokenWithPopup()', () => {
    const localSetup = async (options: Partial<Auth0ClientOptions> = {}) => {
      const result = await setup(options);
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
  });

  describe('logout()', () => {
    it('removes `auth0.is.authenticated` key from storage', async () => {
      const { auth0, storage } = await setup();
      auth0.logout();
      expect(storage.remove).toHaveBeenCalledWith('auth0.is.authenticated');
    });

    it('creates correct query params with empty options', async () => {
      const { auth0, utils } = await setup();

      auth0.logout();
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID
      });
    });

    it('creates correct query params with `options.client_id` is null', async () => {
      const { auth0, utils } = await setup();

      auth0.logout({ client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({});
    });

    it('creates correct query params with `options.client_id` defined', async () => {
      const { auth0, utils } = await setup();

      auth0.logout({ client_id: 'another-client-id' });
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: 'another-client-id'
      });
    });

    it('creates correct query params with `options.returnTo` defined', async () => {
      const { auth0, utils } = await setup();

      auth0.logout({ returnTo: 'https://return.to', client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        returnTo: 'https://return.to'
      });
    });

    it('creates correct query params when `options.federated` is true', async () => {
      const { auth0, utils } = await setup();

      auth0.logout({ federated: true, client_id: null });
      expect(utils.createQueryParams).toHaveBeenCalledWith({});
    });

    it('calls `window.location.assign` with the correct url', async () => {
      const { auth0 } = await setup();

      auth0.logout();
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://test.auth0.com/v2/logout?query=params${TEST_TELEMETRY_QUERY_STRING}`
      );
    });

    it('calls `window.location.assign` with the correct url when `options.federated` is true', async () => {
      const { auth0 } = await setup();

      auth0.logout({ federated: true });
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://test.auth0.com/v2/logout?query=params${TEST_TELEMETRY_QUERY_STRING}&federated`
      );
    });

    it('clears the cache', async () => {
      const { auth0, cache } = await setup();

      auth0.logout();

      expect(cache.clear).toHaveBeenCalled();
    });

    it('removes `auth0.is.authenticated` key from storage when `options.localOnly` is true', async () => {
      const { auth0, storage } = await setup();

      auth0.logout({ localOnly: true });
      expect(storage.remove).toHaveBeenCalledWith('auth0.is.authenticated');
    });

    it('skips `window.location.assign` when `options.localOnly` is true', async () => {
      const { auth0 } = await setup();

      auth0.logout({ localOnly: true });
      expect(window.location.assign).not.toHaveBeenCalledWith();
    });

    it('calls `window.location.assign` when `options.localOnly` is false', async () => {
      const { auth0 } = await setup();

      auth0.logout({ localOnly: false });
      expect(window.location.assign).toHaveBeenCalled();
    });

    it('throws when both `options.localOnly` and `options.federated` are true', async () => {
      const { auth0 } = await setup();

      const fn = () => auth0.logout({ localOnly: true, federated: true });
      expect(fn).toThrow();
    });
  });
});

describe('default creation function', () => {
  it('does nothing if there is nothing storage', async () => {
    Auth0Client.prototype.getTokenSilently = jest.fn();

    const auth0 = await createAuth0Client({
      domain: TEST_DOMAIN,
      client_id: TEST_CLIENT_ID
    });

    expect(require('../src/storage').get).toHaveBeenCalledWith(
      'auth0.is.authenticated'
    );

    expect(auth0.getTokenSilently).not.toHaveBeenCalled();
  });

  it('calls getTokenSilently if there is a storage item with key `auth0.is.authenticated`', async () => {
    Auth0Client.prototype.getTokenSilently = jest.fn();

    require('../src/storage').get = () => true;

    const auth0 = await createAuth0Client({
      domain: TEST_DOMAIN,
      client_id: TEST_CLIENT_ID
    });

    expect(auth0.getTokenSilently).toHaveBeenCalledWith();
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

      expect(auth0.getTokenSilently).toHaveBeenCalledWith();
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

      expect(auth0.getTokenSilently).toHaveBeenCalledWith();
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

      expect(auth0.getTokenSilently).toHaveBeenCalledWith();
    });
  });
});
