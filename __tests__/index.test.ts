jest.mock('browser-tabs-lock');
jest.mock('../src/jwt');
jest.mock('../src/storage');
jest.mock('../src/cache');
jest.mock('../src/transaction-manager');
jest.mock('../src/utils');

import Auth0Client from '../src/Auth0Client';
import createAuth0Client from '../src/index';
import { AuthenticationError } from '../src/errors';
import version from '../src/version';
import { DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS } from '../src/constants';
const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

const TEST_DOMAIN = 'test.auth0.com';
const TEST_CLIENT_ID = 'test-client-id';
const TEST_QUERY_PARAMS = 'query=params';
const TEST_SCOPES = 'unique:scopes';
const TEST_ENCODED_STATE = 'encoded-state';
const TEST_RANDOM_STRING = 'random-string';
const TEST_ARRAY_BUFFER = 'this-is-an-array-buffer';
const TEST_BASE64_ENCODED_STRING = 'base64-url-encoded-string';
const TEST_CODE = 'code';
const TEST_ID_TOKEN = 'id-token';
const TEST_ACCESS_TOKEN = 'access-token';
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

const DEFAULT_POPUP_CONFIG_OPTIONS: PopupConfigOptions = {
  timeoutInSeconds: DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
};

const setup = async (options = {}) => {
  const auth0 = await createAuth0Client({
    domain: TEST_DOMAIN,
    client_id: TEST_CLIENT_ID,
    ...options
  });
  const getInstance = m => require(m).default.mock.instances[0];
  const storage = {
    get: require('../src/storage').get,
    save: require('../src/storage').save,
    remove: require('../src/storage').remove
  };
  const lock = require('browser-tabs-lock');
  const cache = getInstance('../src/cache');
  const tokenVerifier = require('../src/jwt').verify;
  const transactionManager = getInstance('../src/transaction-manager');
  const utils = require('../src/utils');
  utils.createQueryParams.mockReturnValue(TEST_QUERY_PARAMS);
  utils.getUniqueScopes.mockReturnValue(TEST_SCOPES);
  utils.encodeState.mockReturnValue(TEST_ENCODED_STATE);
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
  return {
    auth0,
    storage,
    cache,
    tokenVerifier,
    transactionManager,
    utils,
    lock
  };
};

describe('Auth0', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.location.assign = jest.fn();
    (<any>global).crypto = {
      subtle: {
        digest: () => ''
      }
    };
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
  });
  describe('loginWithPopup()', () => {
    it('opens popup', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({});
      expect(utils.openPopup).toHaveBeenCalled();
    });
    it('encodes state with random string', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({});
      expect(utils.encodeState).toHaveBeenCalledWith(TEST_RANDOM_STRING);
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
        redirect_uri: 'http://localhost',
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256'
      });
    });
    it('opens popup with correct popup, url and default config', async () => {
      const { auth0, utils } = await setup();
      const popup = {};
      utils.openPopup.mockReturnValue(popup);
      await auth0.loginWithPopup();
      expect(utils.runPopup).toHaveBeenCalledWith(
        popup,
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
    });
    it('opens popup with correct popup, url and custom config', async () => {
      const { auth0, utils } = await setup();
      const popup = {};
      utils.openPopup.mockReturnValue(popup);
      await auth0.loginWithPopup({}, { timeoutInSeconds: 1 });
      expect(utils.runPopup).toHaveBeenCalledWith(
        popup,
        `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
        { timeoutInSeconds: 1 }
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
      expect(utils.oauthToken).toHaveBeenCalledWith({
        audience: undefined,
        baseUrl: 'https://test.auth0.com',
        client_id: TEST_CLIENT_ID,
        code: TEST_CODE,
        code_verifier: TEST_RANDOM_STRING
      });
    });
    it('calls oauth/token with correct params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithPopup({ audience: 'test-audience' });
      expect(utils.oauthToken).toHaveBeenCalledWith({
        audience: 'test-audience',
        baseUrl: 'https://test.auth0.com',
        client_id: TEST_CLIENT_ID,
        code: TEST_CODE,
        code_verifier: TEST_RANDOM_STRING
      });
    });
    it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
      const { auth0, tokenVerifier } = await setup();

      await auth0.loginWithPopup({});
      expect(tokenVerifier).toHaveBeenCalledWith({
        id_token: TEST_ID_TOKEN,
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
        nonce: TEST_RANDOM_STRING,
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
      expect(utils.openPopup).toHaveBeenCalled();
    });
  });
  describe('loginWithRedirect()', () => {
    const REDIRECT_OPTIONS = {
      redirect_uri: 'https://redirect.uri',
      appState: TEST_APP_STATE,
      connection: 'test-connection'
    };
    it('encodes state with random string', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(utils.encodeState).toHaveBeenCalledWith(TEST_RANDOM_STRING);
    });
    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(utils.sha256).toHaveBeenCalledWith(TEST_RANDOM_STRING);
      expect(utils.bufferToBase64UrlEncoded).toHaveBeenCalledWith(
        TEST_ARRAY_BUFFER
      );
    });
    it('creates correct query params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_RANDOM_STRING,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });
    it('creates correct query params without leeway', async () => {
      const { auth0, utils } = await setup({ leeway: 10 });

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_RANDOM_STRING,
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

      await auth0.loginWithRedirect(options);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_RANDOM_STRING,
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

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);

      expect(utils.createQueryParams).toHaveBeenCalledWith({
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_RANDOM_STRING,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });
    it('creates correct query params with custom params', async () => {
      const { auth0, utils } = await setup();

      await auth0.loginWithRedirect({ ...REDIRECT_OPTIONS, audience: 'test' });
      expect(utils.createQueryParams).toHaveBeenCalledWith({
        audience: 'test',
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: TEST_CODE,
        response_mode: 'query',
        state: TEST_ENCODED_STATE,
        nonce: TEST_RANDOM_STRING,
        redirect_uri: REDIRECT_OPTIONS.redirect_uri,
        code_challenge: TEST_BASE64_ENCODED_STRING,
        code_challenge_method: 'S256',
        connection: 'test-connection'
      });
    });

    it('calls `transactionManager.create` with new transaction', async () => {
      const { auth0, transactionManager } = await setup();

      await auth0.loginWithRedirect(REDIRECT_OPTIONS);
      expect(transactionManager.create).toHaveBeenCalledWith(
        TEST_ENCODED_STATE,
        {
          appState: TEST_APP_STATE,
          audience: 'default',
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_RANDOM_STRING,
          scope: TEST_SCOPES
        }
      );
    });
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
    describe('when there is a valid query string in the url', async () => {
      const localSetup = async () => {
        window.history.pushState(
          {},
          'Test',
          `?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
        );
        const result = await setup();
        result.transactionManager.get.mockReturnValue({
          code_verifier: TEST_RANDOM_STRING,
          nonce: TEST_RANDOM_STRING,
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

        expect(utils.oauthToken).toHaveBeenCalledWith({
          audience: undefined,
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING
        });
      });
      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_RANDOM_STRING,
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
    describe('when there is a valid query string in a hash', async () => {
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
          nonce: TEST_RANDOM_STRING,
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

        expect(utils.oauthToken).toHaveBeenCalledWith({
          audience: undefined,
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING
        });
      });
      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await localSetup();

        await auth0.handleRedirectCallback();

        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_RANDOM_STRING,
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
      const { auth0, utils, cache } = await setup();
      await auth0.getUser();
      expect(cache.get).toHaveBeenCalledWith({
        audience: 'default',
        scope: TEST_SCOPES
      });
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        'openid profile email'
      );
    });
    it('uses custom options when provided', async () => {
      const { auth0, utils, cache } = await setup();
      await auth0.getUser({ audience: 'the-audience', scope: 'the-scope' });
      expect(cache.get).toHaveBeenCalledWith({
        audience: 'the-audience',
        scope: TEST_SCOPES
      });
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        'the-scope'
      );
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
    it('uses default options', async () => {
      const { auth0, utils, cache } = await setup();
      await auth0.getIdTokenClaims();
      expect(cache.get).toHaveBeenCalledWith({
        audience: 'default',
        scope: TEST_SCOPES
      });
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        'openid profile email'
      );
    });
    it('uses custom options when provided', async () => {
      const { auth0, utils, cache } = await setup();
      await auth0.getIdTokenClaims({
        audience: 'the-audience',
        scope: 'the-scope'
      });
      expect(cache.get).toHaveBeenCalledWith({
        audience: 'the-audience',
        scope: TEST_SCOPES
      });
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        'the-scope'
      );
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
    describe('when `options.ignoreCache` is false', async () => {
      it('calls `cache.get` with the correct options', async () => {
        const { auth0, cache, utils } = await setup();
        cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

        await auth0.getTokenSilently();

        expect(cache.get).toHaveBeenCalledWith({
          audience: 'default',
          scope: TEST_SCOPES
        });
        expect(utils.getUniqueScopes).toHaveBeenCalledWith(
          'openid profile email',
          'openid profile email'
        );
      });
      it('returns cached access_token when there is a cache', async () => {
        const { auth0, cache } = await setup();
        cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

        const token = await auth0.getTokenSilently();

        expect(token).toBe(TEST_ACCESS_TOKEN);
      });
      it('acquires and releases lock when there is a cache', async () => {
        const { auth0, cache, lock } = await setup();
        cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });

        await auth0.getTokenSilently();
        expect(lock.acquireLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY,
          5000
        );
        expect(lock.releaseLockMock).toHaveBeenCalledWith(
          GET_TOKEN_SILENTLY_LOCK_KEY
        );
      });
      it('continues method execution when there is no cache available', async () => {
        const { auth0, utils } = await setup();

        await auth0.getTokenSilently();
        //we only evaluate that the code didn't bail out because of the cache
        expect(utils.encodeState).toHaveBeenCalledWith(TEST_RANDOM_STRING);
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
        expect(utils.encodeState).toHaveBeenCalledWith(TEST_RANDOM_STRING);
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
          scope: TEST_SCOPES,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_RANDOM_STRING,
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
          scope: TEST_SCOPES,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_RANDOM_STRING,
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
          scope: TEST_SCOPES,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_RANDOM_STRING,
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
          scope: TEST_SCOPES,
          response_type: TEST_CODE,
          response_mode: 'web_message',
          prompt: 'none',
          state: TEST_ENCODED_STATE,
          nonce: TEST_RANDOM_STRING,
          redirect_uri: 'http://localhost',
          code_challenge: TEST_BASE64_ENCODED_STRING,
          code_challenge_method: 'S256'
        });
        expect(utils.getUniqueScopes).toHaveBeenCalledWith(
          'openid profile email',
          undefined,
          defaultOptionsIgnoreCacheTrue.scope
        );
      });
      it('opens iframe with correct urls', async () => {
        const { auth0, utils } = await setup();
        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(utils.runIframe).toHaveBeenCalledWith(
          `https://test.auth0.com/authorize?${TEST_QUERY_PARAMS}${TEST_TELEMETRY_QUERY_STRING}`,
          'https://test.auth0.com'
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
        expect(utils.oauthToken).toHaveBeenCalledWith({
          audience: defaultOptionsIgnoreCacheTrue.audience,
          baseUrl: 'https://test.auth0.com',
          client_id: TEST_CLIENT_ID,
          code: TEST_CODE,
          code_verifier: TEST_RANDOM_STRING
        });
      });
      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const { auth0, tokenVerifier } = await setup();

        await auth0.getTokenSilently(defaultOptionsIgnoreCacheTrue);
        expect(tokenVerifier).toHaveBeenCalledWith({
          id_token: TEST_ID_TOKEN,
          nonce: TEST_RANDOM_STRING,
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
          access_token: TEST_ACCESS_TOKEN,
          audience: defaultOptionsIgnoreCacheTrue.audience,
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
  describe('getTokenWithPopup()', async () => {
    const localSetup = async () => {
      const result = await setup();
      result.auth0.loginWithPopup = jest.fn();
      result.cache.get.mockReturnValue({ access_token: TEST_ACCESS_TOKEN });
      return result;
    };
    it('calls `loginWithPopup` with the correct default options', async () => {
      const { auth0, utils } = await localSetup();

      await auth0.getTokenWithPopup();
      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        {
          audience: undefined,
          scope: TEST_SCOPES
        },
        DEFAULT_POPUP_CONFIG_OPTIONS
      );
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        undefined,
        'openid profile email'
      );
    });
    it('calls `loginWithPopup` with the correct custom options', async () => {
      const { auth0, utils } = await localSetup();
      const loginOptions = {
        audience: 'other-audience',
        scope: 'other-scope'
      };
      const configOptions = { timeoutInSeconds: 1 };

      await auth0.getTokenWithPopup(loginOptions, configOptions);
      expect(auth0.loginWithPopup).toHaveBeenCalledWith(
        loginOptions,
        configOptions
      );
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        undefined,
        'other-scope'
      );
    });
    it('calls `cache.get` with the correct options', async () => {
      const { auth0, cache, utils } = await localSetup();

      await auth0.getTokenWithPopup();
      expect(cache.get).toHaveBeenCalledWith({
        audience: 'default',
        scope: TEST_SCOPES
      });
      expect(utils.getUniqueScopes).toHaveBeenCalledWith(
        'openid profile email',
        undefined,
        'openid profile email'
      );
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

    expect(auth0.getTokenSilently).toHaveBeenCalledWith({
      audience: undefined,
      ignoreCache: true,
      scope: undefined
    });
  });
  it('calls getTokenSilently with audience and scope', async () => {
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
    expect(auth0.getTokenSilently).toHaveBeenCalledWith({
      ignoreCache: true,
      ...options
    });
  });
});
