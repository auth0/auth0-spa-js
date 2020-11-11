import {
  Auth0ClientOptions,
  AuthenticationResult,
  IdToken,
  PopupConfigOptions,
  PopupLoginOptions,
  RedirectLoginOptions
} from '../src';

import Auth0Client from '../src/Auth0Client';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from './constants';

const authorizationResponse: AuthenticationResult = {
  code: 'my_code',
  state: TEST_STATE
};

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

const processDefaultLoginWithRedirectOptions = config => {
  const defaultTokenResponseOptions = {
    success: true,
    response: {}
  };
  const defaultAuthorizeResponseOptions = {
    code: TEST_CODE,
    state: TEST_STATE
  };
  const token = {
    ...defaultTokenResponseOptions,
    ...(config.token || {})
  };
  const authorize = {
    ...defaultAuthorizeResponseOptions,
    ...(config.authorize || {})
  };

  return {
    token,
    authorize
  };
};

export const loginWithRedirectFn = (mockWindow, mockFetch, fetchResponse) => {
  return async (
    auth0,
    options: RedirectLoginOptions = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
      authorize?: {
        code?: string;
        state?: string;
        error?: string;
      };
    } = {
      token: {},
      authorize: {}
    }
  ) => {
    const {
      token,
      authorize: { code, state, error }
    } = processDefaultLoginWithRedirectOptions(testConfig);
    await auth0.loginWithRedirect(options);
    expect(mockWindow.location.assign).toHaveBeenCalled();

    if (error) {
      window.history.pushState({}, '', `/?error=${error}&state=${state}`);
    } else {
      window.history.pushState({}, '', `/?code=${code}&state=${state}`);
    }

    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        token.success,
        Object.assign(
          {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          },
          token.response
        )
      )
    );
    await auth0.handleRedirectCallback();
  };
};

const processDefaultLoginWithPopupOptions = config => {
  const defaultTokenResponseOptions = {
    success: true,
    response: {}
  };

  const defaultAuthorizeResponseOptions = {
    response: authorizationResponse
  };

  const token = {
    ...defaultTokenResponseOptions,
    ...(config.token || {})
  };

  const authorize = {
    ...defaultAuthorizeResponseOptions,
    ...(config.authorize || {})
  };

  const delay = config.delay || 0;

  return {
    token,
    authorize,
    delay
  };
};

export const loginWithPopupFn = (mockWindow, mockFetch, fetchResponse) => {
  return async (
    auth0,
    options: PopupLoginOptions = undefined,
    config: PopupConfigOptions = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
      authorize?: {
        response?: any;
      };
      delay?: number;
    } = {
      token: {},
      authorize: {},
      delay: 0
    }
  ) => {
    const {
      token,
      authorize: { response },
      delay
    } = processDefaultLoginWithPopupOptions(testConfig);
    mockWindow.addEventListener.mockImplementationOnce((type, cb) => {
      if (type === 'message') {
        setTimeout(() => {
          cb({
            data: {
              type: 'authorization_response',
              response
            }
          });
        }, delay);
      }
    });

    mockWindow.open.mockReturnValue({
      close: () => {}
    });
    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        token.success,
        Object.assign(
          {
            id_token: TEST_ID_TOKEN,
            refresh_token: TEST_REFRESH_TOKEN,
            access_token: TEST_ACCESS_TOKEN,
            expires_in: 86400
          },
          token.response
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
