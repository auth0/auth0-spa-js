import unfetch from 'unfetch';
import { MISSING_REFRESH_TOKEN_ERROR_MESSAGE } from '../src/constants';

jest.mock('unfetch');

const mockFetch = unfetch as jest.Mock;

describe('token worker', () => {
  let originalFetch;
  let messageHandlerAsync;

  beforeEach(() => {
    originalFetch = window.fetch;
    // The web worker uses native fetch.
    window.fetch = mockFetch;

    const { messageHandler } = require('../src/token.worker');
    messageHandlerAsync = opts =>
      new Promise(resolve =>
        messageHandler({ data: opts, ports: [{ postMessage: resolve }] })
      );
  });

  afterEach(() => {
    mockFetch.mockReset();
    window.fetch = originalFetch;
    // reset the refresh token stored in the module scope between tests
    jest.resetModules();
  });

  it('calls fetch and strips the refresh token', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ foo: 'bar', refresh_token: 'baz' })
      })
    );
    const response = await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({})
    });
    expect(response.json).toEqual({
      foo: 'bar'
    });
  });

  it(`stores the refresh token and uses it for grant_type='refresh_token'`, async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'foo' })
      })
    );
    await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code'
      })
    });
    await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token'
      })
    });
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'foo'
    });
  });

  it(`errors with grant_type='refresh_token' and no token is stored`, async () => {
    const response = await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token'
      })
    });
    expect(response.json.error_description).toEqual(
      MISSING_REFRESH_TOKEN_ERROR_MESSAGE
    );
  });

  it(`errors when fetch rejects`, async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('fail')));
    const response = await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({})
    });
    expect(response.error).toEqual('fail');
  });

  it('removes the stored refresh token if none was returned from the server', async () => {
    mockFetch
      .mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' })
        })
      )
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({})
        })
      );

    await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code'
      })
    });

    await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token'
      })
    });

    const result = await messageHandlerAsync({
      url: '/foo',
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token'
      })
    });

    expect(result.ok).toBe(false);
    expect(mockFetch.mock.calls.length).toBe(2);

    expect(result.json.error_description).toContain(
      'The web worker is missing the refresh token'
    );
  });
});
