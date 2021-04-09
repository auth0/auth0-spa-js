import {
  Auth0ClientOptions,
  AuthenticationResult,
  GetTokenSilentlyOptions,
  IdToken,
  PopupConfigOptions,
  PopupLoginOptions,
  RedirectLoginOptions
} from '../../src';

import Auth0Client from '../../src/Auth0Client';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

const authorizationResponse: AuthenticationResult = {
  code: 'my_code',
  state: TEST_STATE
};

export const assertPostFn = mockFetch => {
  return (url, body, headers = null, callNum = 0) => {
    const [actualUrl, opts] = mockFetch.mock.calls[callNum];
    expect(url).toEqual(actualUrl);
    expect(body).toEqual(JSON.parse(opts.body));
    if (headers) {
      Object.keys(headers).forEach(header =>
        expect(headers[header]).toEqual(opts.headers[header])
      );
    }
  };
};

export const assertUrlEquals = (actualUrl, host, path, queryParams) => {
  const url = new URL(actualUrl);
  expect(url.host).toEqual(host);
  expect(url.pathname).toEqual(path);
  for (let [key, value] of Object.entries(queryParams)) {
    expect(url.searchParams.get(key)).toEqual(value);
  }
};

export const fetchResponse = (ok, json) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(json)
  });

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
    authorize,
    useHash: config.useHash,
    customCallbackUrl: config.customCallbackUrl
  };
};

export const loginWithRedirectFn = (mockWindow, mockFetch) => {
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
        errorDescription?: string;
      };
      useHash?: boolean;
      customCallbackUrl?: string;
    } = {
      token: {},
      authorize: {}
    }
  ) => {
    const {
      token,
      authorize: { code, state, error, errorDescription },
      useHash,
      customCallbackUrl
    } = processDefaultLoginWithRedirectOptions(testConfig);
    await auth0.loginWithRedirect(options);
    const redirectMethod = options?.redirectMethod || 'assign';
    expect(mockWindow.location[redirectMethod]).toHaveBeenCalled();

    if (error && errorDescription) {
      window.history.pushState(
        {},
        '',
        `/${
          useHash ? '#' : ''
        }?error=${error}&error_description=${errorDescription}&state=${state}`
      );
    } else if (error) {
      window.history.pushState(
        {},
        '',
        `/${useHash ? '#' : ''}?error=${error}&state=${state}`
      );
    } else if (code) {
      window.history.pushState(
        {},
        '',
        `/${useHash ? '#' : ''}?code=${code}&state=${state}`
      );
    } else {
      window.history.pushState({}, '', `/`);
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

    return await auth0.handleRedirectCallback(customCallbackUrl);
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

export const setupMessageEventLister = (
  mockWindow: any,
  response: any = {},
  delay = 0
) => {
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
    close: () => {},
    location: {
      href: ''
    }
  });
};

export const loginWithPopupFn = (mockWindow, mockFetch) => {
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

    setupMessageEventLister(mockWindow, response, delay);

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

export const checkSessionFn = mockFetch => {
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

const processDefaultGetTokenSilentlyOptions = config => {
  const defaultTokenResponseOptions = {
    success: true,
    response: {}
  };
  const token = {
    ...defaultTokenResponseOptions,
    ...(config.token || {})
  };

  return {
    token
  };
};

export const getTokenSilentlyFn = (mockWindow, mockFetch) => {
  return async (
    auth0,
    options: GetTokenSilentlyOptions = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
    } = {
      token: {}
    }
  ) => {
    const { token } = processDefaultGetTokenSilentlyOptions(testConfig);

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

    return await auth0.getTokenSilently(options);
  };
};
