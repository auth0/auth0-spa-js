import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { fetchResponse, setupFn, setupMessageEventLister } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

import { Auth0ClientOptions } from '../../src';
import { expect } from '@jest/globals';
import { CustomTokenExchangeOptions } from '../../src/TokenExchange';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
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

  describe('exchangeToken()', () => {
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

    it('calls `exchangeToken` with the correct default options', async () => {
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
  });
});
