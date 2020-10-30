import {
  Auth0ClientOptions,
  IdToken,
  PopupConfigOptions,
  PopupLoginOptions,
  RedirectLoginOptions
} from '../src';
import Auth0Client from '../src/Auth0Client';
import { DEFAULT_SCOPE } from '../src/constants';

export const TEST_DOMAIN = 'auth0_domain';
export const TEST_CLIENT_ID = 'auth0_client_id';
export const TEST_REDIRECT_URI = 'my_callback_url';
export const TEST_ID_TOKEN = 'my_id_token';
export const TEST_ACCESS_TOKEN = 'my_access_token';
export const TEST_REFRESH_TOKEN = 'my_refresh_token';
export const TEST_STATE = 'MTIz';
export const TEST_NONCE = 'MTIz';
export const TEST_CODE = 'my_code';
export const TEST_SCOPES = DEFAULT_SCOPE;
export const TEST_CODE_CHALLENGE = 'TEST_CODE_CHALLENGE';
export const TEST_CODE_VERIFIER = '123';

export const setupFn = mockVerify => {
  return (config?: Partial<Auth0ClientOptions>, claims?: Partial<IdToken>) => {
    const auth0 = new Auth0Client(
      Object.assign(
        {
          domain: TEST_DOMAIN,
          client_id: TEST_CLIENT_ID,
          redirect_uri: TEST_REDIRECT_URI
        },
        config
      )
    );

    mockVerify.mockReturnValue({
      claims: Object.assign(
        {
          exp: Date.now() / 1000 + 86400
        },
        claims
      ),
      user: {
        sub: 'me'
      }
    });

    return auth0;
  };
};

export const loginWithRedirectFn = (mockWindow, mockFetch, fetchResponse) => {
  return async (
    auth0,
    options: RedirectLoginOptions = undefined,
    tokenSuccess = true,
    tokenResponse = {},
    code = TEST_CODE,
    state = TEST_STATE
  ) => {
    await auth0.loginWithRedirect(options);
    expect(mockWindow.location.assign).toHaveBeenCalled();
    window.history.pushState({}, '', `/?code=${code}&state=${state}`);
    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        tokenSuccess,
        Object.assign(
          {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          },
          tokenResponse
        )
      )
    );
    await auth0.handleRedirectCallback();
  };
};

export const loginWithPopupFn = (mockWindow, mockFetch, fetchResponse) => {
  return async (
    auth0,
    options: PopupLoginOptions = undefined,
    config: PopupConfigOptions = undefined,
    tokenSuccess = true,
    tokenResponse = {}
  ) => {
    mockWindow.open.mockReturnValue({
      close: () => {}
    });
    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        tokenSuccess,
        Object.assign(
          {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          },
          tokenResponse
        )
      )
    );
    await auth0.loginWithPopup(options, config);
  };
};

export const checkSessionFn = (mockFetch, fetchResponse) => {
  return async auth0 => {
    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 86400
      })
    );
    await auth0.checkSession();
  };
};
