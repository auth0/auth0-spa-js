import 'fast-text-encoding';
import unfetch from 'unfetch';
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

      return auth0;
    };

    it('calls `loginWithPopup` with the correct default options', async () => {
      const auth0 = await localSetup();
      expect(await auth0.getTokenWithPopup()).toEqual(TEST_ACCESS_TOKEN);
    });

    it('respects customized scopes', async () => {
      const auth0 = await localSetup({
        advancedOptions: {
          defaultScope: 'email'
        },
        scope: 'read:email'
      });

      const config = {
        popup: {
          location: {
            href: ''
          },
          close: jest.fn()
        }
      };

      expect(await auth0.getTokenWithPopup({}, config)).toEqual(
        TEST_ACCESS_TOKEN
      );

      expect(config.popup.location.href).toMatch(
        /openid%20email%20read%3Aemail/
      );
    });

    it('passes custom login options', async () => {
      const auth0 = await localSetup();

      const loginOptions = {
        audience: 'other-audience',
        screen_hint: 'signup'
      };

      const config = {
        popup: {
          location: {
            href: ''
          },
          close: jest.fn()
        }
      };

      await auth0.getTokenWithPopup(loginOptions, config);

      expect(config.popup.location.href).toMatch(/other-audience/);
      expect(config.popup.location.href).toMatch(/screen_hint/);
    });

    it('can use the global audience', async () => {
      const auth0 = await localSetup({
        audience: 'global-audience'
      });

      const config = {
        popup: {
          location: {
            href: ''
          },
          close: jest.fn()
        }
      };

      await auth0.getTokenWithPopup({}, config);

      expect(config.popup.location.href).toMatch(/global-audience/);
    });
  });
});
