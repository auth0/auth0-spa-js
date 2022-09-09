import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

// @ts-ignore

import { setupFn } from './helpers';

import { TEST_CODE_CHALLENGE } from '../constants';
import { ICache } from '../../src';

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

  describe('getUser', () => {
    it('returns undefined if there is no user in the cache', async () => {
      const auth0 = setup();
      const decodedToken = await auth0.getUser();

      expect(decodedToken).toBeUndefined();
    });

    it('searches the user in the cache', async () => {
      const cache: ICache = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };
      const auth0 = setup({ cache });
      await auth0.getUser();

      expect(cache.get).toBeCalledWith(
        '@@auth0spajs@@::auth0_client_id::@@user@@'
      );
    });

    it('fallback to searching the user stored with the access token', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };

      getMock.mockImplementation((key: string) => {
        if (
          key ===
          '@@auth0spajs@@::auth0_client_id::default::openid profile email'
        ) {
          return {
            body: { id_token: 'abc', decodedToken: { user: { sub: '123' } } }
          };
        }
      });

      const auth0 = setup({ cache });
      const user = await auth0.getUser();

      expect(cache.get).toBeCalledWith(
        '@@auth0spajs@@::auth0_client_id::@@user@@'
      );
      expect(cache.get).toBeCalledWith(
        '@@auth0spajs@@::auth0_client_id::default::openid profile email'
      );
      expect(user?.sub).toBe('123');
    });

    it('does not fallback to searching the user stored with the access token when user found', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@auth0spajs@@::auth0_client_id::@@user@@') {
          return { id_token: 'abc', decodedToken: { user: { sub: '123' } } };
        }
      });

      const auth0 = setup({ cache });
      const user = await auth0.getUser();

      expect(cache.get).toBeCalledWith(
        '@@auth0spajs@@::auth0_client_id::@@user@@'
      );
      expect(cache.get).not.toBeCalledWith(
        '@@auth0spajs@@::auth0_client_id::default::openid profile email'
      );
      expect(user?.sub).toBe('123');
    });

    it('should return from the in memory cache if no changes', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@auth0spajs@@::auth0_client_id::@@user@@') {
          return { id_token: 'abcd', decodedToken: { user: { sub: '123' } } };
        }
      });

      const auth0 = setup({ cache });
      const user = await auth0.getUser();
      const secondUser = await auth0.getUser();

      expect(user).toBe(secondUser);
    });

    it('should return a new object from the cache when the user object changes', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@auth0spajs@@::auth0_client_id::@@user@@') {
          return { id_token: 'abcd', decodedToken: { user: { sub: '123' } } };
        }
      });

      const auth0 = setup({ cache });
      const user = await auth0.getUser();
      const secondUser = await auth0.getUser();

      expect(user).toBe(secondUser);

      getMock.mockImplementation((key: string) => {
        if (key === '@@auth0spajs@@::auth0_client_id::@@user@@') {
          return {
            id_token: 'abcdefg',
            decodedToken: { user: { sub: '123' } }
          };
        }
      });

      const thirdUser = await auth0.getUser();
      expect(thirdUser).not.toBe(user);
    });

    it('should return undefined if there is no cache entry', async () => {
      const cache: ICache = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn()
      };

      const auth0 = setup({ cache });
      await expect(auth0.getUser()).resolves.toBe(undefined);
    });
  });
});
