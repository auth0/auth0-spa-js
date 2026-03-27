import { MISSING_REFRESH_TOKEN_ERROR_MESSAGE } from '../src/constants';
import { assertPostFn } from './Auth0Client/helpers';
import * as utils from '../src/utils';
import { expect } from '@jest/globals';
import { FetchResponse } from '../src/global';

const mockFetch = <jest.Mock>window.fetch;
const ALLOWED_BASE_URL = 'https://tenant.auth0.com';
const TOKEN_ENDPOINT = `${ALLOWED_BASE_URL}/oauth/token`;

describe('token worker', () => {
  let originalFetch;
  let messageHandlerAsync;
  let secondMessageHandlerAsync;

  beforeEach(() => {
    originalFetch = window.fetch;
    // The web worker uses native fetch.
    window.fetch = mockFetch;

    const { messageRouter } = require('../src/worker/token.worker');

    messageRouter({
      data: { type: 'init', allowedBaseUrl: ALLOWED_BASE_URL },
      ports: []
    });

    messageHandlerAsync = opts =>
      new Promise(resolve =>
        messageRouter({ data: opts, ports: [{ postMessage: resolve }] })
      );

    secondMessageHandlerAsync = opts =>
      new Promise(resolve =>
        messageRouter({
          data: {
            ...opts,
            useMrrt: true,
            auth: { audience: 'example', scope: 'scope1' }
          },
          ports: [{ postMessage: resolve }]
        })
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
        json: () => ({ foo: 'bar', refresh_token: 'baz' }),
        headers: new Headers()
      })
    );

    const response = await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
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

  it('calls fetch and uses form post data', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'foo' }),
        headers: new Headers()
      })
    );
    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: utils.createQueryParams({
          grant_type: 'authorization_code'
        })
      },
      useFormData: true
    });

    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: utils.createQueryParams({
          grant_type: 'refresh_token'
        })
      },
      useFormData: true
    });

    assertPostFn(mockFetch)(
      TOKEN_ENDPOINT,
      {
        grant_type: 'refresh_token',
        refresh_token: 'foo'
      },
      {},
      1,
      false
    );
  });

  it('calls fetch without AbortSignal if AbortController is not available', async () => {
    const originalAbortController = window.AbortController;
    delete window.AbortController;

    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ foo: 'bar', refresh_token: 'baz' }),
        headers: new Headers()
      })
    );

    const response = await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
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
        json: () => ({ refresh_token: 'foo' }),
        headers: new Headers()
      })
    );
    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code'
        })
      }
    });

    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
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
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    expect(response.json.error).toBe('missing_refresh_token');
    expect(response.json.error_description).toContain(
      MISSING_REFRESH_TOKEN_ERROR_MESSAGE
    );
  });

  it(`errors when fetch rejects`, async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('fail')));

    const response = await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
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
      fetchUrl: TOKEN_ENDPOINT,
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
      fetchUrl: TOKEN_ENDPOINT,
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
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      )
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({}),
          headers: new Headers()
        })
      );

    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code'
        })
      }
    });

    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    const result = await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
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
      MISSING_REFRESH_TOKEN_ERROR_MESSAGE
    );
  });

  it('rejects messages sent to an unauthorized URL', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'foo' }),
        headers: new Headers()
      })
    );

    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code'
        })
      }
    });

    const response = await messageHandlerAsync({
      fetchUrl: 'https://attacker.example.com/oauth/token',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token'
        })
      }
    });

    expect(response.ok).toBe(false);
    expect(response.json.error).toBe('invalid_fetch_url');
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  it('rejects messages with a malformed fetchUrl', async () => {
    const response = await messageHandlerAsync({
      fetchUrl: 'not-a-valid-url',
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({ grant_type: 'refresh_token' })
      }
    });

    expect(response.ok).toBe(false);
    expect(response.json.error).toBe('invalid_fetch_url');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('ignores init message with a malformed allowedBaseUrl', async () => {
    jest.resetModules();

    const { messageRouter } = require('../src/worker/token.worker');

    messageRouter({
      data: { type: 'init', allowedBaseUrl: 'not-a-valid-url' },
      ports: []
    });

    const response = await new Promise<FetchResponse>(resolve =>
      messageRouter({
        data: {
          fetchUrl: TOKEN_ENDPOINT,
          fetchOptions: {
            method: 'POST',
            body: JSON.stringify({ grant_type: 'refresh_token' })
          }
        },
        ports: [{ postMessage: resolve }]
      })
    );

    expect(response.ok).toBe(false);
    expect(response.json.error).toBe('invalid_fetch_url');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects token requests before worker initialization', async () => {
    jest.resetModules();

    const { messageRouter } = require('../src/worker/token.worker');

    const response = await new Promise<FetchResponse>(resolve =>
      messageRouter({
        data: {
          fetchUrl: TOKEN_ENDPOINT,
          fetchOptions: {
            method: 'POST',
            body: JSON.stringify({ grant_type: 'refresh_token' })
          }
        },
        ports: [{ postMessage: resolve }]
      })
    );

    expect(response.ok).toBe(false);
    expect(response.json.error).toBe('invalid_fetch_url');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  describe("useMrrt", () => {
    beforeEach(() => {
      originalFetch = window.fetch;
      // The web worker uses native fetch.
      window.fetch = mockFetch;

      const { messageRouter } = require('../src/worker/token.worker');

      messageHandlerAsync = opts =>
        new Promise(resolve =>
          messageRouter({
            data: {
              ...opts,
              useMrrt: true,
              auth: { audience: 'audience1', scope: 'scope1' }
            },
            ports: [{ postMessage: resolve }]
          })
        );

      secondMessageHandlerAsync = opts =>
        new Promise(resolve =>
          messageRouter({
            data: {
              ...opts,
              useMrrt: true,
              auth: { audience: 'audience2', scope: 'scope2' }
            },
            ports: [{ postMessage: resolve }]
          })
        );
    });

    it('when useMrrt is configured it sets latest_refresh_token and uses it for the second audience', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers(),
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'authorization_code'
          })
        }
      });

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'refresh_token'
          })
        }
      });

      await secondMessageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'refresh_token'
          })
        }
      });

      expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'foo'
      });
    });
  });

  describe("useMrrt with default audience", () => {
    beforeEach(() => {
      originalFetch = window.fetch;
      // The web worker uses native fetch.
      window.fetch = mockFetch;

      const { messageRouter } = require('../src/worker/token.worker');

      messageHandlerAsync = opts =>
        new Promise(resolve =>
          messageRouter({
            data: {
              ...opts,
              useMrrt: true,
              auth: { audience: 'default', scope: 'scope1' }
            },
            ports: [{ postMessage: resolve }]
          })
        );

      secondMessageHandlerAsync = opts =>
        new Promise(resolve =>
          messageRouter({
            data: {
              ...opts,
              useMrrt: true,
              auth: { audience: 'audience2', scope: 'scope2' }
            },
            ports: [{ postMessage: resolve }]
          })
        );
    });

    it('when is default audience we store its refresh token as latest_refresh_token and uses it for the second audience', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers(),
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'authorization_code'
          })
        },
      });

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'refresh_token'
          })
        },
        auth: {
          audience: "default",
        },
      });

      await secondMessageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'refresh_token'
          })
        }
      });

      expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'foo'
      });
    });
  });
});
