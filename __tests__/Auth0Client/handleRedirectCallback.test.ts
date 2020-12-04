import 'fast-text-encoding';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { fetchResponse, loginWithRedirectFn, setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_APP_STATE,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
  TEST_ENCODED_STATE,
  TEST_ID_TOKEN,
  TEST_RANDOM_STRING,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_USER_ID
} from '../constants';
import { Auth0ClientOptions } from '../../src/global';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

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
      const appState = {
        key: 'property'
      };
      try {
        await loginWithRedirect(
          auth0,
          { appState },
          {
            authorize: {
              state: 'error-state',
              error: 'some-error',
              errorDescription: 'some-error-description'
            }
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.error).toBe('some-error');
      expect(error.error_description).toBe('some-error-description');
      expect(error.state).toBe('error-state');
      expect(error.appState).toBe(appState);
    });

    it('should clear the transaction data when the /authorize call redirects with a code param', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['transactionManager'], 'remove');

      await loginWithRedirect(auth0);

      expect(auth0['transactionManager'].remove).toHaveBeenCalledWith();
    });

    it('should clear the transaction data when the /authorize call redirects with an error param', async () => {
      const auth0 = setup();
      let error;
      jest.spyOn(auth0['transactionManager'], 'remove');

      try {
        await loginWithRedirect(
          auth0,
          {},
          {
            authorize: {
              error: 'some-error'
            }
          }
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(auth0['transactionManager'].remove).toHaveBeenCalledWith();
    });

    it('should throw an error if the /authorize call redirects with no params', async () => {
      const auth0 = setup();
      let error;
      try {
        await loginWithRedirect(
          auth0,
          {},
          {
            authorize: {
              error: null,
              state: null,
              code: null
            }
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(
        'There are no query params available for parsing.'
      );
    });

    it('should throw an error if there is no transaction', async () => {
      const auth0 = setup();
      let error;
      try {
        await auth0.handleRedirectCallback('test?foo=bar');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
    });

    it('returns the transactions appState', async () => {
      const auth0 = setup();
      const appState = {
        key: 'property'
      };
      const result = await loginWithRedirect(auth0, { appState });
      expect(result).toBeDefined();
      expect(result.appState).toBe(appState);
    });
  });

  it('calls oauth/token without redirect uri if not set in transaction', async () => {
    window.history.pushState(
      {},
      'Test',
      `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
    );

    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 86400
      })
    );

    const auth0 = setup();
    delete auth0['options']['redirect_uri'];

    await auth0.loginWithRedirect();
    await auth0.handleRedirectCallback();

    expect(mockFetch.mock.calls[0][0]).toBe('https://auth0_domain/oauth/token');

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.redirect_uri).toBeUndefined();
  });

  describe('when there is a valid query string in a hash', () => {
    it('should throw an error if the /authorize call redirects with an error param', async () => {
      const auth0 = setup();
      let error;
      const appState = {
        key: 'property'
      };
      try {
        await loginWithRedirect(
          auth0,
          { appState },
          {
            authorize: {
              state: 'error-state',
              error: 'some-error',
              errorDescription: 'some-error-description'
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.error).toBe('some-error');
      expect(error.error_description).toBe('some-error-description');
      expect(error.state).toBe('error-state');
      expect(error.appState).toBe(appState);
    });

    it('should clear the transaction data when the /authorize call redirects with a code param', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['transactionManager'], 'remove');
      await loginWithRedirect(
        auth0,
        {},
        {
          useHash: true
        }
      );

      expect(auth0['transactionManager'].remove).toHaveBeenCalledWith();
    });

    it('should clear the transaction data when the /authorize call redirects with an error param', async () => {
      const auth0 = setup();
      let error;
      jest.spyOn(auth0['transactionManager'], 'remove');

      try {
        await loginWithRedirect(
          auth0,
          {},
          {
            authorize: {
              error: 'some-error'
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(auth0['transactionManager'].remove).toHaveBeenCalledWith();
    });

    it('should throw an error if the /authorize call redirects with no params', async () => {
      const auth0 = setup();
      let error;
      try {
        await loginWithRedirect(
          auth0,
          {},
          {
            authorize: {
              state: null,
              code: null
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(
        'There are no query params available for parsing.'
      );
    });

    it('should throw an error if there is no transaction', async () => {
      const auth0 = setup();
      let error;
      try {
        await auth0.handleRedirectCallback('#test?foo=bar');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
    });
  });
});
