import 'fast-text-encoding';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { loginWithPopupFn, loginWithRedirectFn, setupFn } from './helpers';

import { TEST_CODE_CHALLENGE } from '../constants';

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
const loginWithPopup = loginWithPopupFn(mockWindow, mockFetch);

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

  describe('isAuthenticated', () => {
    describe('loginWithRedirect', () => {
      it('returns true if there is a user', async () => {
        const auth0 = setup();
        await loginWithRedirect(auth0);

        const result = await auth0.isAuthenticated();
        expect(result).toBe(true);
      });

      it('returns false if error was returned', async () => {
        const auth0 = setup();

        try {
          await loginWithRedirect(auth0, undefined, {
            authorize: {
              error: 'some-error'
            }
          });
        } catch {}

        const result = await auth0.isAuthenticated();

        expect(result).toBe(false);
      });

      it('returns false if token call fails', async () => {
        const auth0 = setup();
        try {
          await loginWithRedirect(auth0, undefined, {
            token: { success: false }
          });
        } catch {}
        const result = await auth0.isAuthenticated();
        expect(result).toBe(false);
      });
    });

    describe('loginWithPopup', () => {
      it('returns true if there is a user', async () => {
        const auth0 = setup();
        await loginWithPopup(auth0);

        const result = await auth0.isAuthenticated();
        expect(result).toBe(true);
      });
    });

    it('returns false if code not part of URL', async () => {
      const auth0 = setup();

      try {
        await loginWithPopup(auth0, undefined, undefined, {
          authorize: {
            response: {
              error: 'some error'
            }
          }
        });
      } catch {}

      const result = await auth0.isAuthenticated();

      expect(result).toBe(false);
    });

    it('returns false if there is no user', async () => {
      const auth0 = setup();
      const result = await auth0.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
