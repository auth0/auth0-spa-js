import * as esCookie from 'es-cookie';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

// @ts-ignore

import { checkSessionFn, fetchResponse, setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_ORG_ID,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

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
const checkSession = checkSessionFn(window.fetch);

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
        `auth0.${TEST_CLIENT_ID}.is.authenticated`
      );

      expect(<jest.Mock>esCookie.get).toHaveBeenCalledWith(
        `_legacy_auth0.${TEST_CLIENT_ID}.is.authenticated`
      );
    });

    it('skips checking the legacy samesite cookie when configured', async () => {
      const auth0 = setup({
        legacySameSiteCookie: false
      });

      await checkSession(auth0);

      expect(<jest.Mock>esCookie.get).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`
      );

      expect(<jest.Mock>esCookie.get).not.toHaveBeenCalledWith(
        `_legacy_auth0.${TEST_CLIENT_ID}.is.authenticated`
      );
    });

    it('migrates the old is.authenticated cookie to the new name', async () => {
      const auth0 = setup();

      (esCookie.get as jest.Mock).mockImplementation(name => {
        switch (name) {
          case 'auth0.is.authenticated':
            return true;
          case `auth0.${TEST_CLIENT_ID}.is.authenticated`:
            return;
        }
      });

      await checkSession(auth0);

      expect(esCookie.get).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`
      );

      expect(esCookie.get).toHaveBeenCalledWith(`auth0.is.authenticated`);

      expect(esCookie.set).toHaveBeenCalledWith(
        `auth0.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        { expires: 1 }
      );

      expect(esCookie.remove).toHaveBeenCalledWith('auth0.is.authenticated', {});
    });

    it('uses the organization hint cookie if available', async () => {
      const auth0 = setup();

      jest.spyOn(<any>utils, 'runIframe').mockResolvedValue({
        access_token: TEST_ACCESS_TOKEN,
        state: TEST_STATE
      });

      (<jest.Mock>esCookie.get)
        .mockReturnValueOnce(JSON.stringify(true))
        .mockReturnValueOnce(JSON.stringify(TEST_ORG_ID));

      await checkSession(auth0);

      expect(utils.runIframe).toHaveBeenCalledWith(
        expect.stringContaining(TEST_ORG_ID),
        `https://${TEST_DOMAIN}`,
        undefined
      );
    });
  });
});
