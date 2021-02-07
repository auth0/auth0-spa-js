import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';

import { assertPostFn, loginWithPasswordlessCodeFn, setupFn } from './helpers';

// @ts-ignore

import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_OTP,
  TEST_REALM,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_USER_EMAIL
} from '../constants';

import { DEFAULT_AUTH0_CLIENT } from '../../src/constants';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;
const tokenVerifier = require('../../src/jwt').verify;

const assertPost = assertPostFn(mockFetch);

const setup = setupFn(mockVerify);
const loginWithPasswordlessCode = loginWithPasswordlessCodeFn(mockFetch);

describe('Auth0Client', () => {
  beforeEach(() => {
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
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  describe('loginWithPasswordlessCode', () => {
    it('should log the user in and get the user and claims', async () => {
      const auth0 = setup({ scope: 'foo' });
      await loginWithPasswordlessCode(auth0);

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser()).toEqual(expectedUser);
      expect(await auth0.getUser({})).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'default' })).toEqual(
        expectedUser
      );
      expect(await auth0.getUser({ scope: 'foo' })).toEqual(expectedUser);
      expect(await auth0.getUser({ audience: 'invalid' })).toBeUndefined();
      expect(await auth0.getIdTokenClaims()).toBeTruthy();
      expect(await auth0.getIdTokenClaims({})).toBeTruthy();
      expect(
        await auth0.getIdTokenClaims({ audience: 'default' })
      ).toBeTruthy();
      expect(await auth0.getIdTokenClaims({ scope: 'foo' })).toBeTruthy();
      expect(
        await auth0.getIdTokenClaims({ audience: 'invalid' })
      ).toBeUndefined();
    });

    it('should log the user in with custom scope', async () => {
      const auth0 = setup({
        scope: 'scope1',
        advancedOptions: {
          defaultScope: 'scope2'
        }
      });
      await loginWithPasswordlessCode(auth0, {
        otp: TEST_OTP,
        realm: TEST_REALM,
        username: TEST_USER_EMAIL,
        scope: 'scope3'
      });

      const requestedScope = JSON.parse(mockFetch.mock.calls[0][1].body).scope;
      expect(requestedScope).toContain('scope1');
      expect(requestedScope).toContain('scope2');
      expect(requestedScope).toContain('scope3');

      const expectedUser = { sub: 'me' };

      expect(await auth0.getUser({ scope: 'scope1 scope2 scope3' })).toEqual(
        expectedUser
      );
    });

    it('should log the user in using different default audience', async () => {
      const auth0 = setup({
        audience: 'not_this_one'
      });
      await loginWithPasswordlessCode(auth0, {
        otp: TEST_OTP,
        realm: TEST_REALM,
        username: TEST_USER_EMAIL,
        audience: TEST_AUDIENCE
      });

      const requested = JSON.parse(mockFetch.mock.calls[0][1].body).audience;
      expect(requested).toBe(TEST_AUDIENCE);
    });

    it('should log the user in when overriding default audience', async () => {
      const auth0 = setup({
        audience: TEST_AUDIENCE
      });
      await loginWithPasswordlessCode(auth0);

      const requested = JSON.parse(mockFetch.mock.calls[0][1].body).audience;
      expect(requested).toBe(TEST_AUDIENCE);
    });

    it('should log the user in and get the token', async () => {
      const auth0 = setup();

      await loginWithPasswordlessCode(auth0);

      assertPost(
        'https://auth0_domain/oauth/token',
        {
          client_id: TEST_CLIENT_ID,
          grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
          otp: TEST_OTP,
          realm: TEST_REALM,
          username: TEST_USER_EMAIL,
          scope: 'openid profile email'
        },
        {
          'Auth0-Client': btoa(JSON.stringify(DEFAULT_AUTH0_CLIENT))
        }
      );
    });

    it('gets token with custom auth0Client', async () => {
      const auth0Client = { name: '__test_client_name__', version: '9.9.9' };
      const auth0 = await setup({ auth0Client });

      await loginWithPasswordlessCode(auth0);

      assertPost('https://auth0_domain/oauth/token', expect.anything(), {
        'Auth0-Client': btoa(JSON.stringify(auth0Client))
      });
    });

    it('calls `tokenVerifier.verify` with the `issuer` from in the oauth/token response', async () => {
      const auth0 = setup({
        issuer: 'test-123.auth0.com'
      });

      await loginWithPasswordlessCode(auth0);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.auth0.com/'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the `leeway` from constructor', async () => {
      const auth0 = setup({ leeway: 10 });

      await loginWithPasswordlessCode(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          leeway: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with undefined `max_age` when value set in constructor is an empty string', async () => {
      const auth0 = setup({ max_age: '' });

      await loginWithPasswordlessCode(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: undefined
        })
      );
    });

    it('calls `tokenVerifier.verify` with the parsed `max_age` string from constructor', async () => {
      const auth0 = setup({ max_age: '10' });

      await loginWithPasswordlessCode(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with the parsed `max_age` number from constructor', async () => {
      const auth0 = setup({ max_age: 10 });

      await loginWithPasswordlessCode(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization id', async () => {
      const auth0 = setup({ organization: 'test_org_123' });

      await loginWithPasswordlessCode(auth0);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_123'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization id given in the login method', async () => {
      const auth0 = setup();
      await loginWithPasswordlessCode(auth0, {
        otp: TEST_OTP,
        realm: TEST_REALM,
        username: TEST_USER_EMAIL,
        organization: 'test_org_123'
      });

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test_org_123'
        })
      );
    });

    it('saves into cache', async () => {
      const auth0 = setup();

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPasswordlessCode(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: TEST_CLIENT_ID,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400,
          audience: 'default',
          id_token: TEST_ID_TOKEN,
          scope: TEST_SCOPES
        })
      );
    });

    it('saves decoded token into cache', async () => {
      const auth0 = setup();

      const mockDecodedToken = {
        claims: { sub: 'sub', aud: 'aus' },
        user: { sub: 'sub' }
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPasswordlessCode(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
        expect.objectContaining({
          decodedToken: mockDecodedToken
        })
      );
    });

    it('should not save refresh_token in memory cache', async () => {
      const auth0 = setup({
        useRefreshTokens: true
      });

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPasswordlessCode(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalled();
      expect(auth0['cache']['save']).not.toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });

    it('should save refresh_token in local storage cache', async () => {
      const auth0 = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      jest.spyOn(auth0['cache'], 'save');

      await loginWithPasswordlessCode(auth0);

      expect(auth0['cache']['save']).toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });

    it('saves `auth0.is.authenticated` key in storage', async () => {
      const auth0 = setup();

      await loginWithPasswordlessCode(auth0);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated',
        'true',
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        'auth0.is.authenticated',
        'true',
        {
          expires: 1
        }
      );
    });

    it('saves `auth0.is.authenticated` key in storage for an extended period', async () => {
      const auth0 = setup({
        sessionCheckExpiryDays: 2
      });

      await loginWithPasswordlessCode(auth0);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        '_legacy_auth0.is.authenticated',
        'true',
        {
          expires: 2
        }
      );
      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        'auth0.is.authenticated',
        'true',
        {
          expires: 2
        }
      );
    });

    it('should throw an error on token failure', async () => {
      const auth0 = setup();

      await expect(
        loginWithPasswordlessCode(
          auth0,
          {
            otp: TEST_OTP,
            realm: TEST_REALM,
            username: TEST_USER_EMAIL
          },
          {
            token: { success: false }
          }
        )
      ).rejects.toThrowError(
        'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
      );
    });
  });
});
