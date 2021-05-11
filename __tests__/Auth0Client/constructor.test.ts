import 'fast-text-encoding';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { loginWithRedirectFn, setupFn } from './helpers';

import { TEST_CLIENT_ID, TEST_CODE_CHALLENGE, TEST_DOMAIN } from '../constants';
import { ICache } from '../../src/cache';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;

const mockCache: ICache = {
  set: jest.fn().mockResolvedValue(null),
  get: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null)
};

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const assertUrlEquals = (actualUrl, host, path, queryParams) => {
  const url = new URL(actualUrl);
  expect(url.host).toEqual(host);
  expect(url.pathname).toEqual(path);
  for (let [key, value] of Object.entries(queryParams)) {
    expect(url.searchParams.get(key)).toEqual(value);
  }
};

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

  describe('constructor', () => {
    it('automatically adds the offline_access scope during construction', () => {
      const auth0 = setup({
        useRefreshTokens: true,
        scope: 'test-scope'
      });

      expect((<any>auth0).scope).toBe('test-scope offline_access');
    });

    it('ensures the openid scope is defined when customizing default scopes', () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: 'test-scope'
        }
      });

      expect((<any>auth0).defaultScope).toBe('openid test-scope');
    });

    it('allows an empty custom default scope', () => {
      const auth0 = setup({
        advancedOptions: {
          defaultScope: null
        }
      });

      expect((<any>auth0).defaultScope).toBe('openid');
    });

    it('should create issuer from domain', () => {
      const auth0 = setup({
        domain: 'test.dev'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://test.dev/');
    });

    it('should allow issuer as a domain', () => {
      const auth0 = setup({
        issuer: 'foo.bar.com'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://foo.bar.com/');
    });

    it('should allow issuer as a fully qualified url', () => {
      const auth0 = setup({
        issuer: 'https://some.issuer.com/'
      });

      expect((<any>auth0).tokenIssuer).toEqual('https://some.issuer.com/');
    });

    it('uses a custom cache if one was given in the configuration', async () => {
      const auth0 = setup({
        cache: mockCache
      });

      await loginWithRedirectFn(mockWindow, mockFetch)(auth0);

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('uses a custom cache if both `cache` and `cacheLocation` were specified', async () => {
      const auth0 = setup({
        cache: mockCache,
        cacheLocation: 'localstorage'
      });

      await loginWithRedirectFn(mockWindow, mockFetch)(auth0);

      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('buildLogoutUrl', () => {
    it('creates correct query params with empty options', async () => {
      const auth0 = setup();

      const url = auth0.buildLogoutUrl();

      assertUrlEquals(url, TEST_DOMAIN, '/v2/logout', {
        client_id: TEST_CLIENT_ID
      });
    });

    it('creates correct query params with `options.client_id` is null', async () => {
      const auth0 = setup();

      const url = new URL(auth0.buildLogoutUrl({ client_id: null }));
      expect(url.searchParams.get('client_id')).toBeNull();
    });

    it('creates correct query params with `options.client_id` defined', async () => {
      const auth0 = setup();

      const url = auth0.buildLogoutUrl({ client_id: 'another-client-id' });

      assertUrlEquals(url, TEST_DOMAIN, '/v2/logout', {
        client_id: 'another-client-id'
      });
    });

    it('creates correct query params with `options.returnTo` defined', async () => {
      const auth0 = setup();

      const url = auth0.buildLogoutUrl({
        returnTo: 'https://return.to',
        client_id: null
      });

      assertUrlEquals(url, TEST_DOMAIN, '/v2/logout', {
        returnTo: 'https://return.to'
      });
    });

    it('creates correct query params when `options.federated` is true', async () => {
      const auth0 = setup();

      const url = auth0.buildLogoutUrl({ federated: true, client_id: null });

      assertUrlEquals(url, TEST_DOMAIN, '/v2/logout', {
        federated: ''
      });
    });
  });
});
