import 'fast-text-encoding';
import * as esCookie from 'es-cookie';
import unfetch from 'unfetch';
import { verify } from '../../src/jwt';
import * as utils from '../../src/utils';

// @ts-ignore

import { assertPostFn, loginWithPasswordlessFn, setupFn } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_CONNECTION,
  TEST_ID_TOKEN,
  TEST_NONCE,
  TEST_OTP,
  TEST_REALM,
  TEST_REDIRECT_URI,
  TEST_SCOPES,
  TEST_STATE,
  TEST_USER_EMAIL
} from '../constants';
import version from '../../src/version';
import { PasswordlessLoginOptions } from '../../src';
import TransactionManager from '../../src/transaction-manager';

jest.mock('unfetch');
jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;
const mockCookies = require('es-cookie');
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

const assertPost = assertPostFn(mockFetch);
const setup = setupFn(mockVerify);
const loginWithPasswordless = loginWithPasswordlessFn(mockFetch);

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
    sessionStorage.clear();
    jest.spyOn(TransactionManager.prototype, 'create');
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  describe('loginWithPasswordless', () => {
    describe('when using link mode', () => {
      let defaultLoginWithPasswordlessOptions = Object.freeze<PasswordlessLoginOptions>(
        {
          connection: TEST_CONNECTION,
          send: 'link',
          email: TEST_USER_EMAIL
        }
      );

      it('should log the user in and get the token', async () => {
        const auth0 = setup();

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        assertPost(
          'https://auth0_domain/passwordless/start',
          {
            client_id: TEST_CLIENT_ID,
            connection: TEST_CONNECTION,
            send: 'link',
            email: TEST_USER_EMAIL,
            authParams: {
              redirect_uri: TEST_REDIRECT_URI,
              scope: TEST_SCOPES,
              response_type: 'code',
              response_mode: 'query',
              state: TEST_STATE,
              nonce: TEST_NONCE,
              code_challenge: TEST_CODE_CHALLENGE,
              code_challenge_method: 'S256'
            }
          },
          {
            'Auth0-Client': btoa(
              JSON.stringify({
                name: 'auth0-spa-js',
                version: version
              })
            )
          }
        );

        assertPost(
          'https://auth0_domain/oauth/token',
          {
            redirect_uri: TEST_REDIRECT_URI,
            client_id: TEST_CLIENT_ID,
            code_verifier: TEST_CODE_VERIFIER,
            grant_type: 'authorization_code',
            code: TEST_CODE
          },
          {
            'Auth0-Client': btoa(
              JSON.stringify({
                name: 'auth0-spa-js',
                version: version
              })
            )
          },
          1
        );
      });

      it('should log the user in using different default scope', async () => {
        const auth0 = setup({
          advancedOptions: {
            defaultScope: 'email'
          }
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.authParams.scope).toBe('openid email');
      });

      it('should log the user in using different default redirect_uri', async () => {
        const redirect_uri = 'https://custom-redirect-uri/callback';

        const auth0 = setup({
          redirect_uri
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        console.log(mockFetch.mock.calls[0][1]);
        expect(body.authParams.redirect_uri).toBe(redirect_uri);
      });

      it('should log the user in when overriding default redirect_uri', async () => {
        const redirect_uri = 'https://custom-redirect-uri/callback';

        const auth0 = setup({
          redirect_uri
        });

        await loginWithPasswordless(auth0, {
          ...defaultLoginWithPasswordlessOptions,
          redirect_uri: 'https://my-redirect-uri/callback'
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        console.log(mockFetch.mock.calls[0][1]);
        expect(body.authParams.redirect_uri).toBe(
          'https://my-redirect-uri/callback'
        );
      });

      it('should log the user in with custom params', async () => {
        const auth0 = setup();

        await loginWithPasswordless(auth0, {
          ...defaultLoginWithPasswordlessOptions,
          audience: 'test_audience'
        });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        console.log(mockFetch.mock.calls[0][1]);
        expect(body.authParams.audience).toBe('test_audience');
      });

      it('should log the user in using offline_access when using refresh tokens', async () => {
        const auth0 = setup({
          useRefreshTokens: true
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.authParams.scope).toBe(`${TEST_SCOPES} offline_access`);
      });

      it('should log the user in and get the user', async () => {
        const auth0 = setup({ scope: 'foo' });
        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        const expectedUser = { sub: 'me' };

        expect(await auth0.getUser()).toEqual(expectedUser);
        expect(await auth0.getUser({})).toEqual(expectedUser);
        expect(await auth0.getUser({ audience: 'default' })).toEqual(
          expectedUser
        );
        expect(await auth0.getUser({ scope: 'foo' })).toEqual(expectedUser);
        expect(await auth0.getUser({ audience: 'invalid' })).toBeUndefined();
      });

      it('should log the user in and get the user with custom scope', async () => {
        const auth0 = setup({
          scope: 'scope1',
          advancedOptions: {
            defaultScope: 'scope2'
          }
        });

        await loginWithPasswordless(auth0, {
          connection: TEST_CONNECTION,
          send: 'link',
          email: TEST_USER_EMAIL,
          scope: 'scope3'
        });

        const expectedUser = { sub: 'me' };

        expect(await auth0.getUser({ scope: 'scope1 scope2 scope3' })).toEqual(
          expectedUser
        );
      });

      it('should log the user in with custom auth0Client', async () => {
        const auth0Client = { name: '__test_client__', version: '0.0.0' };
        const auth0 = setup({ auth0Client });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        assertPost(
          'https://auth0_domain/passwordless/start',
          expect.anything(),
          {
            'Auth0-Client': btoa(JSON.stringify(auth0Client))
          }
        );
      });

      it('should start transaction', async () => {
        const auth0 = setup();
        await loginWithPasswordless(
          auth0,
          defaultLoginWithPasswordlessOptions,
          { onlyStart: true }
        );

        expect(TransactionManager.prototype.create).toBeCalled();
      });

      it('uses session storage for transactions by default', async () => {
        const auth0 = setup();
        await loginWithPasswordless(
          auth0,
          defaultLoginWithPasswordlessOptions,
          { onlyStart: true }
        );

        expect((sessionStorage.setItem as jest.Mock).mock.calls[0][0]).toBe(
          'a0.spajs.txs'
        );
      });

      it('uses cookie storage for transactions', async () => {
        const auth0 = setup({ useCookiesForTransactions: true });

        await loginWithPasswordless(
          auth0,
          defaultLoginWithPasswordlessOptions,
          { onlyStart: true }
        );

        // Don't necessarily need to check the contents of the cookie (the storage tests are doing that),
        // just that cookies were used when I set the correct option.
        expect((mockCookies.set as jest.Mock).mock.calls[1][0]).toEqual(
          'a0.spajs.txs'
        );
      });

      it('should throw an error on start failure', async () => {
        const auth0 = setup();

        await expect(
          loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions, {
            start: {
              success: false
            }
          })
        ).rejects.toThrowError(
          'HTTP error. Unable to fetch https://auth0_domain/passwordless/start'
        );
      });

      it('should throw an error on token failure', async () => {
        const auth0 = setup();

        await expect(
          loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions, {
            token: {
              success: false
            }
          })
        ).rejects.toThrowError(
          'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
        );
      });

      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const auth0 = setup({
          issuer: 'test-123.auth0.com'
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        expect(tokenVerifier).toHaveBeenCalledWith(
          expect.objectContaining({
            iss: 'https://test-123.auth0.com/',
            id_token: TEST_ID_TOKEN
          })
        );
      });

      it('calls `tokenVerifier.verify` with the global organization id', async () => {
        const auth0 = setup({ organization: 'test_org_123' });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        expect(tokenVerifier).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'test_org_123'
          })
        );
      });

      it('calls `tokenVerifier.verify` with the specific organization id', async () => {
        const auth0 = setup({ organization: 'test_org_123' });

        await loginWithPasswordless(auth0, {
          ...defaultLoginWithPasswordlessOptions,
          organization: 'test_org_456'
        });

        expect(tokenVerifier).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'test_org_456'
          })
        );
      });

      it('saves into cache', async () => {
        const auth0 = setup();

        jest.spyOn(auth0['cache'], 'save');

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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

      it('saves `auth0.is.authenticated` key in storage', async () => {
        const auth0 = setup();

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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
    });

    describe('when using code mode', () => {
      let defaultLoginWithPasswordlessOptions = Object.freeze<PasswordlessLoginOptions>(
        {
          connection: TEST_CONNECTION,
          send: 'code',
          email: TEST_USER_EMAIL
        }
      );

      it('should log the user in and get the token', async () => {
        const auth0 = setup();

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        assertPost(
          'https://auth0_domain/passwordless/start',
          {
            client_id: TEST_CLIENT_ID,
            connection: TEST_CONNECTION,
            send: 'code',
            email: TEST_USER_EMAIL,
            authParams: {
              redirect_uri: TEST_REDIRECT_URI,
              scope: TEST_SCOPES,
              response_type: 'code',
              response_mode: 'query',
              state: TEST_STATE,
              nonce: TEST_NONCE,
              code_challenge: TEST_CODE_CHALLENGE,
              code_challenge_method: 'S256'
            }
          },
          {
            'Auth0-Client': btoa(
              JSON.stringify({
                name: 'auth0-spa-js',
                version: version
              })
            )
          }
        );

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
            'Auth0-Client': btoa(
              JSON.stringify({
                name: 'auth0-spa-js',
                version: version
              })
            )
          },
          1
        );
      });

      it('should log the user in using offline_access when using refresh tokens', async () => {
        const auth0 = setup({
          useRefreshTokens: true
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        assertPost(
          'https://auth0_domain/oauth/token',
          {
            client_id: TEST_CLIENT_ID,
            grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
            otp: TEST_OTP,
            realm: TEST_REALM,
            username: TEST_USER_EMAIL,
            scope: `${TEST_SCOPES} offline_access`
          },
          {
            'Auth0-Client': btoa(
              JSON.stringify({
                name: 'auth0-spa-js',
                version: version
              })
            )
          },
          1
        );
      });

      it('should log the user in and get the user', async () => {
        const auth0 = setup({ scope: 'foo' });
        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        const expectedUser = { sub: 'me' };

        expect(await auth0.getUser()).toEqual(expectedUser);
        expect(await auth0.getUser({})).toEqual(expectedUser);
        expect(await auth0.getUser({ audience: 'default' })).toEqual(
          expectedUser
        );
        expect(await auth0.getUser({ scope: 'foo' })).toEqual(expectedUser);
        expect(await auth0.getUser({ audience: 'invalid' })).toBeUndefined();
      });

      it('should not start transaction', async () => {
        const auth0 = setup();
        await loginWithPasswordless(
          auth0,
          defaultLoginWithPasswordlessOptions,
          { onlyStart: true }
        );

        expect(TransactionManager.prototype.create).not.toBeCalled();
      });

      it('should throw an error on start failure', async () => {
        const auth0 = setup();

        await expect(
          loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions, {
            start: {
              success: false
            }
          })
        ).rejects.toThrowError(
          'HTTP error. Unable to fetch https://auth0_domain/passwordless/start'
        );
      });

      it('should throw an error on token failure', async () => {
        const auth0 = setup();

        await expect(
          loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions, {
            token: {
              success: false
            }
          })
        ).rejects.toThrowError(
          'HTTP error. Unable to fetch https://auth0_domain/oauth/token'
        );
      });

      it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
        const auth0 = setup({
          issuer: 'test-123.auth0.com'
        });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);
        expect(tokenVerifier).toHaveBeenCalledWith(
          expect.objectContaining({
            iss: 'https://test-123.auth0.com/',
            id_token: TEST_ID_TOKEN
          })
        );
      });

      it('calls `tokenVerifier.verify` with the global organization id', async () => {
        const auth0 = setup({ organization: 'test_org_123' });

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

        expect(tokenVerifier).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: 'test_org_123'
          })
        );
      });

      it('saves into cache', async () => {
        const auth0 = setup();

        jest.spyOn(auth0['cache'], 'save');

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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

      it('saves `auth0.is.authenticated` key in storage', async () => {
        const auth0 = setup();

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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

        await loginWithPasswordless(auth0, defaultLoginWithPasswordlessOptions);

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
    });
  });
});
