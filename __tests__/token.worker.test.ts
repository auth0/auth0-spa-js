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

    const { messageHandler } = require('../src/worker/token.worker');

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
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({})
      }
    });

    expect(response.json).toEqual({
      foo: 'bar'
    });

    expect(mockFetch.mock.calls[0][1].signal).toBeDefined();
  });

  it('calls fetch without AbortSignal if AbortController is not available', async () => {
    const originalAbortController = window.AbortController;
    delete window.AbortController;

    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ foo: 'bar', refresh_token: 'baz' })
      })
    );

    const response = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({})
      }
    });

    expect(response.json).toEqual({
      foo: 'bar'
    });

    expect(mockFetch.mock.calls[0][1].signal).toBeUndefined();

    window.AbortController = originalAbortController;
  });

  it(`stores the refresh token and uses it for grant_type='refresh_token'`, async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'foo' })
      })
    );
    await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code'
        })
      }
    });

    await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'foo'
    });
  });

  it(`errors with grant_type='refresh_token' and no token is stored`, async () => {
    const response = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    expect(response.json.error_description).toEqual(
      MISSING_REFRESH_TOKEN_ERROR_MESSAGE
    );
  });

  it(`errors when fetch rejects`, async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('fail')));

    const response = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({})
      }
    });

    expect(response.error).toEqual('fail');
  });

  it(`aborts when timed out`, async () => {
    const originalAbortController = window.AbortController;
    const abortFn = jest.fn();

    window.AbortController = jest.fn(() => ({
      signal: {},
      abort: abortFn
    })) as any;

    mockFetch.mockReturnValue(
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );

    const response = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({})
      },
      timeout: 1
    });

    expect(response.error).toEqual("Timeout when executing 'fetch'");
    expect(abortFn).toHaveBeenCalled();
    window.AbortController = originalAbortController;
  });

  it(`does not abort when timed out if no abort controller`, async () => {
    const originalAbortController = window.AbortController;
    delete window.AbortController;

    mockFetch.mockReturnValue(
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );

    const response = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({})
      },
      timeout: 1
    });

    expect(response.error).toEqual("Timeout when executing 'fetch'");
    window.AbortController = originalAbortController;
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
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code'
        })
      }
    });

    await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    const result = await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    expect(result.ok).toBe(false);
    expect(mockFetch.mock.calls.length).toBe(2);

    expect(result.json.error_description).toContain(
      'The web worker is missing the refresh token'
    );
  });
});
