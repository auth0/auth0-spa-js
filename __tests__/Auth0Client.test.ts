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
const mockFetch = <jest.Mock>unfetch;
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
    claims: Object.assign({}, claims)
  });
  return auth0;
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
    // The web worker uses native fetch.
    mockWindow.fetch = mockFetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should log the user in and get the token', async () => {
    const auth0 = setup();
    await auth0.loginWithRedirect();
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
    window.history.pushState({}, '', '/?code=my_code&state=MTIz');
    mockFetch.mockResolvedValue(
      fetchResponse(true, {
        id_token: 'foo'
      })
    );
    await auth0.handleRedirectCallback();
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
    await auth0.loginWithRedirect();
    expect(mockWindow.location.assign).toHaveBeenCalled();
    window.history.pushState({}, '', '/?code=my_code&state=MTIz');
    mockFetch.mockResolvedValue(
      fetchResponse(true, {
        id_token: 'my_id_token',
        refresh_token: 'my_refresh_token'
      })
    );
    await auth0.handleRedirectCallback();
    assertPost('https://auth0_domain/oauth/token', {
      redirect_uri: 'my_callback_url',
      client_id: 'auth0_client_id',
      code_verifier: '123',
      grant_type: 'authorization_code',
      code: 'my_code'
    });
    await auth0.getTokenSilently();
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
  });
});
