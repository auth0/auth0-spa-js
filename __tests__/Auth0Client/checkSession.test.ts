import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { checkSessionFn, fetchResponse, setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

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
const checkSession = checkSessionFn(mockFetch);

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
});
