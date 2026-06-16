/**
 * Tests for OrtCookieStore integration with online-access mode.
 *
 * Covers:
 *   - ORT is written to a session cookie on login, not into the main ICache
 *   - ORT is read back from the cookie during silent renewal
 *   - ORT cookie is cleared on logout (by-clientId and clear-all paths)
 *   - Existing (non-online) token flows are unaffected
 */
import { expect } from '@jest/globals';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as Cookies from 'es-cookie';
import * as DpopModule from '../../src/dpop/dpop';
import { verify } from '../../src/jwt';

import {
  getTokenSilentlyFn,
  loginWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_CLIENT_ID,
  TEST_REFRESH_TOKEN
} from '../constants';
import { DEFAULT_AUDIENCE } from '../../src/constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue('test-code-challenge');

const setup = setupFn(mockVerify);
const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
const getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);

const ORT_COOKIE_NAME = `@@auth0spajs@@::${TEST_CLIENT_ID}::ort::${DEFAULT_AUDIENCE}`;

describe('Auth0Client — ORT cookie store', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
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

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.removeEventListener = jest.fn();
    mockWindow.crypto = {
      subtle: { digest: () => 'foo' },
      getRandomValues() { return '123'; }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};

    jest.spyOn(scope, 'getUniqueScopes');
    jest.spyOn(DpopModule, 'Dpop').mockImplementation(
      () =>
        ({
          calculateThumbprint: jest.fn().mockResolvedValue('test-thumbprint'),
          generateProof: jest.fn().mockResolvedValue('test-dpop-proof'),
          getNonce: jest.fn().mockResolvedValue(undefined),
          setNonce: jest.fn().mockResolvedValue(undefined),
          clear: jest.fn().mockResolvedValue(undefined)
        } as any)
    );

    sessionStorage.clear();
    mockCookies.get.mockReturnValue(undefined);
    mockCookies.getAll.mockReturnValue({});
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('OrtCookieStore is created only in online-access mode', () => {
    it('ortCookieStore is defined when onlineAccess: true', () => {
      const auth0 = setup({ onlineAccess: true, useDpop: true } as any);
      expect((auth0 as any).ortCookieStore).toBeDefined();
    });

    it('ortCookieStore is undefined when onlineAccess is unset', () => {
      const auth0 = setup();
      expect((auth0 as any).ortCookieStore).toBeUndefined();
    });

    it('ortCookieStore is undefined when onlineAccess is false', () => {
      const auth0 = setup({ onlineAccess: false } as any);
      expect((auth0 as any).ortCookieStore).toBeUndefined();
    });

    it('ortCookieStore is undefined when using rotating refresh tokens', () => {
      const auth0 = setup({ useRefreshTokens: true });
      expect((auth0 as any).ortCookieStore).toBeUndefined();
    });
  });

  describe('ORT written to cookie on login, NOT stored in main ICache', () => {
    it('writes the ORT to a session cookie after loginWithRedirect', async () => {
      // Use localstorage so the worker is not active and refresh_token flows
      // through _saveEntryInCache (worker mode strips it before the main thread).
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'localstorage'
      } as any);

      await loginWithRedirect(auth0);

      // es-cookie set() must have been called with the ORT cookie name and the
      // refresh token value. expires must NOT be present (session cookie).
      expect(mockCookies.set).toHaveBeenCalledWith(
        ORT_COOKIE_NAME,
        TEST_REFRESH_TOKEN,
        expect.objectContaining({ sameSite: 'strict' })
      );
      const callArgs = (mockCookies.set as jest.Mock).mock.calls.find(
        ([name]) => name === ORT_COOKIE_NAME
      );
      expect(callArgs).toBeDefined();
      expect(callArgs[2]).not.toHaveProperty('expires');
    });

    it('does NOT store refresh_token inside the main ICache entry in online mode', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'localstorage'
      } as any);

      const cacheSetSpy = jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithRedirect(auth0);

      // Every call to cacheManager.set must not have a refresh_token in the body
      for (const call of cacheSetSpy.mock.calls) {
        expect(call[0]).not.toHaveProperty('refresh_token');
      }
    });

    it('still stores refresh_token in the main cache when NOT in online mode', async () => {
      const auth0 = setup({ useRefreshTokens: true, cacheLocation: 'localstorage' });

      const cacheSetSpy = jest.spyOn(auth0['cacheManager'], 'set');

      await loginWithRedirect(auth0);

      const callWithRt = cacheSetSpy.mock.calls.find(
        ([entry]) => entry && entry.refresh_token
      );
      expect(callWithRt).toBeDefined();
    });

    it('does NOT call es-cookie set() when NOT in online mode', async () => {
      const auth0 = setup({ useRefreshTokens: true, cacheLocation: 'localstorage' });

      await loginWithRedirect(auth0);

      const ortCookieCall = (mockCookies.set as jest.Mock).mock.calls.find(
        ([name]) => name === ORT_COOKIE_NAME
      );
      expect(ortCookieCall).toBeUndefined();
    });
  });

  describe('ORT read back from cookie during silent renewal', () => {
    it('reads the ORT from the cookie when main cache has no refresh_token', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'memory'
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Simulate cookie returning the ORT on the next page load (cache is empty,
      // cookie survived). es-cookie mock returns the token for the ORT key.
      mockCookies.get.mockImplementation((name: string) =>
        name === ORT_COOKIE_NAME ? TEST_REFRESH_TOKEN : undefined
      );

      const requestTokenSpy = jest.spyOn(auth0 as any, '_requestToken');

      await getTokenSilently(auth0, { cacheMode: 'off' });

      // The token endpoint must have been called with the ORT
      const callArgs = requestTokenSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs.refresh_token).toBe(TEST_REFRESH_TOKEN);
    });
  });

  describe('ORT cookie cleared on logout', () => {
    it('removes the ORT cookie when logout is called', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'memory'
      } as any);

      await loginWithRedirect(auth0);
      mockFetch.mockReset();

      // Simulate stored cookies
      mockCookies.getAll.mockReturnValue({
        [ORT_COOKIE_NAME]: TEST_REFRESH_TOKEN
      });

      await auth0.logout({ openUrl: false });

      expect(mockCookies.remove).toHaveBeenCalledWith(
        ORT_COOKIE_NAME,
        expect.anything()
      );
    });

    it('clears ORT cookies for the matching clientId on logout', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'memory'
      } as any);

      const cookieName = ORT_COOKIE_NAME;
      const otherClientCookie = `@@auth0spajs@@::other_client::ort::${DEFAULT_AUDIENCE}`;

      mockCookies.getAll.mockReturnValue({
        [cookieName]: TEST_REFRESH_TOKEN,
        [otherClientCookie]: 'other_token'
      });

      await auth0.logout({ openUrl: false });

      const removedNames = (mockCookies.remove as jest.Mock).mock.calls.map(
        ([name]) => name
      );
      expect(removedNames).toContain(cookieName);
      expect(removedNames).not.toContain(otherClientCookie);
    });

    it('clears ALL ORT cookies when logout is called with clientId: null', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cacheLocation: 'memory'
      } as any);

      const cookieName = ORT_COOKIE_NAME;
      const otherClientCookie = `@@auth0spajs@@::other_client::ort::${DEFAULT_AUDIENCE}`;

      mockCookies.getAll.mockReturnValue({
        [cookieName]: TEST_REFRESH_TOKEN,
        [otherClientCookie]: 'other_token'
      });

      await auth0.logout({ clientId: null, openUrl: false });

      const removedNames = (mockCookies.remove as jest.Mock).mock.calls.map(
        ([name]) => name
      );
      expect(removedNames).toContain(cookieName);
      expect(removedNames).toContain(otherClientCookie);
    });

    it('does NOT call cookie remove for ORT when not in online mode', async () => {
      const auth0 = setup({ useRefreshTokens: true, cacheLocation: 'localstorage' });

      mockCookies.getAll.mockReturnValue({});

      await auth0.logout({ openUrl: false });

      const ortCookieRemove = (mockCookies.remove as jest.Mock).mock.calls.find(
        ([name]) => typeof name === 'string' && name.includes('::ort::')
      );
      expect(ortCookieRemove).toBeUndefined();
    });
  });

  describe('ORT cookie uses correct attributes', () => {
    it('sets secure: true on HTTPS', () => {
      // Test OrtCookieStore directly to avoid the non-configurable window.location
      // property constraint that the Auth0Client beforeEach imposes.
      const { OrtCookieStore } = require('../../src/ort-cookie-store');

      const originalProtocol = window.location.protocol;
      // jsdom allows replacing window.location entirely for this kind of test.
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { protocol: 'https:' }
      });

      const store = new OrtCookieStore();
      store.set('clientId', 'aud', 'ort-value');

      const callArgs = (mockCookies.set as jest.Mock).mock.calls.find(
        ([name]) => name === '@@auth0spajs@@::clientId::ort::aud'
      );
      expect(callArgs?.[2]).toMatchObject({ secure: true, sameSite: 'strict' });

      // Restore
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...window.location, protocol: originalProtocol }
      });
    });

    it('passes cookieDomain to es-cookie when configured', async () => {
      const auth0 = setup({
        onlineAccess: true,
        useDpop: true,
        cookieDomain: '.example.com',
        cacheLocation: 'localstorage'
      } as any);

      await loginWithRedirect(auth0);

      const callArgs = (mockCookies.set as jest.Mock).mock.calls.find(
        ([name]) => name === ORT_COOKIE_NAME
      );
      expect(callArgs?.[2]).toMatchObject({ domain: '.example.com' });
    });
  });
});
