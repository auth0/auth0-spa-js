import 'fast-text-encoding';
import Auth0Client from '../src/Auth0Client';
import unfetch from 'unfetch';
import { verify } from '../src/jwt';
// @ts-ignore
import TokenWorker from '../src/token.worker';
import { MessageChannel } from 'worker_threads';

jest.mock('unfetch');
jest.mock('../src/jwt');
jest.mock('../src/token.worker');

const mockWindow = <any>global;
const mockFetch = (mockWindow.fetch = <jest.Mock>unfetch);
const mockVerify = <jest.Mock>verify;

const assertUrlEquals = (actualUrl, host, path, queryParams) => {
  const url = new URL(actualUrl);
  expect(url.host).toEqual(host);
  expect(url.pathname).toEqual(path);
  for (let [key, value] of Object.entries(queryParams)) {
    expect(url.searchParams.get(key)).toEqual(value);
  }
};

const assertPost = (url, body, callNum = 0) => {
  const [actualUrl, opts] = mockFetch.mock.calls[callNum];
  expect(url).toEqual(actualUrl);
  expect(body).toEqual(JSON.parse(opts.body));
};

const fetchResponse = (ok, json) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(json)
  });

const setup: any = (config?, claims?) => {
  const auth0 = new Auth0Client(
    Object.assign(
      {
        domain: 'auth0_domain',
        client_id: 'auth0_client_id',
        redirect_uri: 'my_callback_url'
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
    )
  });
  return auth0;
};

const login: any = async (
  auth0,
  tokenSuccess = true,
  tokenResponse?,
  code = 'my_code',
  state = 'MTIz'
) => {
  await auth0.loginWithRedirect();
  expect(mockWindow.location.assign).toHaveBeenCalled();
  window.history.pushState({}, '', `/?code=${code}&state=${state}`);
  mockFetch.mockResolvedValue(
    fetchResponse(
      tokenSuccess,
      Object.assign(
        {
          id_token: 'my_id_token',
          refresh_token: 'my_refresh_token',
          access_token: 'my_access_token',
          expires_in: 86400
        },
        tokenResponse
      )
    )
  );
  await auth0.handleRedirectCallback();
};

describe('Auth0Client', () => {
  beforeEach(() => {
    mockWindow.location.assign = jest.fn();
    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log the user in and get the token', async () => {
    const auth0 = setup();
    await login(auth0);
    const url = new URL(mockWindow.location.assign.mock.calls[0][0]);
    assertUrlEquals(url, 'auth0_domain', '/authorize', {
      client_id: 'auth0_client_id',
      redirect_uri: 'my_callback_url',
      scope: 'openid profile email',
      response_type: 'code',
      response_mode: 'query',
      state: 'MTIz',
      nonce: 'MTIz',
      code_challenge: '',
      code_challenge_method: 'S256'
    });
    assertPost('https://auth0_domain/oauth/token', {
      redirect_uri: 'my_callback_url',
      client_id: 'auth0_client_id',
      code_verifier: '123',
      grant_type: 'authorization_code',
      code: 'my_code'
    });
  });

  it('refreshes the token from a web worker', async () => {
    const auth0 = setup({
      useRefreshTokens: true
    });
    expect(auth0.worker).toBeDefined();
    await login(auth0);
    const access_token = await auth0.getTokenSilently({ ignoreCache: true });
    assertPost(
      'https://auth0_domain/oauth/token',
      {
        client_id: 'auth0_client_id',
        grant_type: 'refresh_token',
        redirect_uri: 'my_callback_url',
        refresh_token: 'my_refresh_token'
      },
      1
    );
    expect(access_token).toEqual('my_access_token');
  });

  it('refreshes the token from the main page', async () => {
    const auth0 = setup({
      useRefreshTokens: true,
      cacheLocation: 'localstorage'
    });
    expect(auth0.worker).toBeUndefined();
    await login(auth0);
    assertPost('https://auth0_domain/oauth/token', {
      redirect_uri: 'my_callback_url',
      client_id: 'auth0_client_id',
      code_verifier: '123',
      grant_type: 'authorization_code',
      code: 'my_code'
    });
    const access_token = await auth0.getTokenSilently({ ignoreCache: true });
    assertPost(
      'https://auth0_domain/oauth/token',
      {
        client_id: 'auth0_client_id',
        grant_type: 'refresh_token',
        redirect_uri: 'my_callback_url',
        refresh_token: 'my_refresh_token'
      },
      1
    );
    expect(access_token).toEqual('my_access_token');
  });
});
