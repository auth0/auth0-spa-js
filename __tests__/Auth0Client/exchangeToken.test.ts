import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import {
  assertPostFn,
  fetchResponse,
  setupFn,
  setupMessageEventLister
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_ID_TOKEN,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

import { Auth0ClientOptions } from '../../src';
import { DEFAULT_AUTH0_CLIENT } from '../../src/constants';
import { expect } from '@jest/globals';
import { CustomTokenExchangeOptions } from '../../src/TokenExchange';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const assertPost = assertPostFn(mockFetch);

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

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

  describe('getTokenWithPopup()', () => {
    const localSetup = async (clientOptions?: Partial<Auth0ClientOptions>) => {
      const auth0 = setup(clientOptions);

      setupMessageEventLister(mockWindow, { state: TEST_STATE });

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      auth0['_requestToken'] = async function (requestOptions: any) {
        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      return auth0;
    };

    it('calls `loginWithPopup` with the correct default options', async () => {
      const auth0 = await localSetup();
      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token', // valid token type (not reserved)
        scope: 'openid profile email',
        audience: 'https://api.test.com'
      };
      const result = await auth0.exchangeToken(cteOptions);
      console.log(result);
      expect(result.id_token).toEqual('fake_id_token');
      expect(result.access_token).toEqual('fake_access_token');
      expect(result.expires_in).toEqual(3600);
      expect(typeof result.scope).toBe('string');
    });

    it('should throw an error for invalid subject_token_type from reserved namespaces', async () => {
      // List of reserved token types that must be rejected.
      const invalidTokenTypes = [
        'urn:ietf:params:oauth:foo',
        'https://auth0.com/token',
        'urn:auth0:token'
      ];

      const auth0 = await localSetup();

      // Each invalid token type should cause exchangeToken to reject with an Error.
      for (const tokenType of invalidTokenTypes) {
        const cteOptions: CustomTokenExchangeOptions = {
          subject_token: 'external_token_value',
          subject_token_type: tokenType,
          audience: 'https://api.test.com'
        };
        await expect(auth0.exchangeToken(cteOptions)).rejects.toThrow(Error);
      }
    });
  });
});
