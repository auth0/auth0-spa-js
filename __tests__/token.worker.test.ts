import { MISSING_REFRESH_TOKEN_ERROR_MESSAGE } from '../src/constants';
import { assertPostFn } from './Auth0Client/helpers';
import * as utils from '../src/utils';
import { expect } from '@jest/globals';

const mockFetch = <jest.Mock>window.fetch;

describe('token worker', () => {
  let originalFetch;
  let messageHandlerAsync;
  let secondMessageHandlerAsync;

  beforeEach(() => {
    originalFetch = window.fetch;
    // The web worker uses native fetch.
    window.fetch = mockFetch;

    const { messageHandler } = require('../src/worker/token.worker');

    messageHandlerAsync = opts =>
      new Promise(resolve =>
        messageHandler({ data: opts, ports: [{ postMessage: resolve }] })
      );

    secondMessageHandlerAsync = opts =>
      new Promise(resolve =>
        messageHandler({ data: { ...opts, useMrrt: true, auth: { audience: 'example', scope: 'scope1' } }, ports: [{ postMessage: resolve }] })
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

  it('calls fetch and uses form post data', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'foo' }),
        headers: new Headers()
      })
    );
    await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: utils.createQueryParams({
          grant_type: 'authorization_code'
        })
      },
      useFormData: true
    });

    await messageHandlerAsync({
      fetchUrl: '/foo',
      fetchOptions: {
        method: 'POST',
        body: utils.createQueryParams({
          grant_type: 'refresh_token'
        })
      },
      useFormData: true
    });

    assertPostFn(mockFetch)(
      '/foo',
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
        json: () => ({ refresh_token: 'foo' }),
        headers: new Headers()
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

    expect(response.json.error).toBe('missing_refresh_token');
    expect(response.json.error_description).toContain(
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
      MISSING_REFRESH_TOKEN_ERROR_MESSAGE
    );
  });

  describe('revokeMessageHandler', () => {
    let revokeHandlerAsync;

    // Builds a revokeMessageHandler message in the new format (fetchUrl + fetchOptions),
    // matching what doRevoke in http.ts now sends to the worker.
    const revokeOpts = ({
      audience = 'my_audience',
      timeout = 5000,
      useFormData = false
    }: { audience?: string; timeout?: number; useFormData?: boolean } = {}) => ({
      timeout,
      fetchUrl: 'https://test.auth0.com/oauth/revoke',
      fetchOptions: {
        method: 'POST',
        body: useFormData
          ? 'client_id=client_id'
          : JSON.stringify({ client_id: 'client_id' }),
        headers: {
          'Content-Type': useFormData
            ? 'application/x-www-form-urlencoded'
            : 'application/json',
          'Auth0-Client': 'test'
        }
      },
      ...(useFormData && { useFormData }),
      auth: { audience, scope: 'openid' }
    });

    beforeEach(() => {
      const { revokeMessageHandler } = require('../src/worker/token.worker');

      revokeHandlerAsync = (opts) =>
        new Promise(resolve =>
          revokeMessageHandler({ data: opts, ports: [{ postMessage: resolve }] })
        );
    });

    it('returns ok:true without calling fetch when no refresh token is stored', async () => {
      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.ok).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls /oauth/revoke and returns ok:true on success', async () => {
      // Seed a refresh token into worker memory via the message handler
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      // Now revoke
      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: true, text: () => Promise.resolve('') })
      );

      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toBe('https://test.auth0.com/oauth/revoke');
    });

    it('removes the refresh token from worker memory after successful revocation', async () => {
      // Seed a refresh token
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: true, text: () => Promise.resolve('') })
      );

      await revokeHandlerAsync(revokeOpts());

      // Trying to use the refresh token now should fail with missing_refresh_token
      const response = await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      expect(response.json.error).toBe('missing_refresh_token');
    });

    it('returns an error when fetch rejects', async () => {
      // Seed a refresh token
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(Promise.reject(new Error('Network failure')));

      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.error).toBe('Network failure');
    });

    it('returns a timeout error when fetch times out', async () => {
      // Seed a refresh token
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const response = await revokeHandlerAsync(revokeOpts({ timeout: 1 }));

      expect(response.error).toBe("Timeout when executing 'fetch'");
    });

    it('returns an error when the server responds with an error', async () => {
      // Seed a refresh token
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 400,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                error: 'invalid_token',
                error_description: 'The token has been revoked'
              })
            )
        })
      );

      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.error).toBe('The token has been revoked');
    });

    it('sends a form-encoded body when useFormData is true', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: true, text: () => Promise.resolve('') })
      );

      await revokeHandlerAsync(revokeOpts({ useFormData: true }));

      const [, options] = mockFetch.mock.calls[1];
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      const params = Object.fromEntries(new URLSearchParams(options.body));
      expect(params).toMatchObject({ client_id: 'client_id', token: 'foo' });
    });

    it('returns a generic HTTP error when the error response body is empty', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('') })
      );

      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.error).toBe('HTTP error 503');
    });

    it('falls back to generic HTTP error when error response body is malformed JSON', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'foo' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: false, status: 400, text: () => Promise.resolve('not valid json') })
      );

      const response = await revokeHandlerAsync(revokeOpts());

      expect(response.error).toBe('HTTP error 400');
    });

    it('cleans up all entries sharing the same refresh token (MRRT)', async () => {
      // Seed the same refresh token under two different audience/scope combinations
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'shared_token' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'audience1', scope: 'openid' }
      });

      await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'audience2', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: true, text: () => Promise.resolve('') })
      );

      await revokeHandlerAsync(revokeOpts({ audience: 'audience1' }));

      // audience2 should also have its refresh token cleared
      const responseAudience2 = await messageHandlerAsync({
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'audience2', scope: 'openid' }
      });

      expect(responseAudience2.json.error).toBe('missing_refresh_token');
    });
  });

  describe('messageRouter', () => {
    let routerAsync;

    beforeEach(() => {
      const { messageRouter } = require('../src/worker/token.worker');

      routerAsync = (opts) =>
        new Promise(resolve =>
          messageRouter({ data: opts, ports: [{ postMessage: resolve }] })
        );
    });

    it('routes type=refresh to messageHandler', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ foo: 'bar' }),
          headers: new Headers()
        })
      );

      const response = await routerAsync({
        type: 'refresh',
        fetchUrl: 'https://test.auth0.com/oauth/token',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({})
        }
      });

      expect(response.json).toEqual({ foo: 'bar' });
    });

    it('routes type=revoke to revokeMessageHandler', async () => {
      const response = await routerAsync({
        type: 'revoke',
        timeout: 5000,
        fetchUrl: 'https://test.auth0.com/oauth/revoke',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ client_id: 'client_id' }),
          headers: { 'Content-Type': 'application/json', 'Auth0-Client': 'test' }
        },
        auth: { audience: 'my_audience', scope: 'openid' }
      });

      // No refresh token stored, so revoke returns ok:true without calling fetch
      expect(response.ok).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("useMrrt", () => {
    beforeEach(() => {
      originalFetch = window.fetch;
      // The web worker uses native fetch.
      window.fetch = mockFetch;

      const { messageHandler } = require('../src/worker/token.worker');

      messageHandlerAsync = opts =>
        new Promise(resolve =>
          messageHandler({ data: { ...opts, useMrrt: true, auth: { audience: 'audience1', scope: 'scope1' } }, ports: [{ postMessage: resolve }] })
        );

      secondMessageHandlerAsync = opts =>
        new Promise(resolve =>
          messageHandler({ data: { ...opts, useMrrt: true, auth: { audience: 'audience2', scope: 'scope2' } }, ports: [{ postMessage: resolve }] })
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

      await secondMessageHandlerAsync({
        fetchUrl: '/foo',
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

      const { messageHandler } = require('../src/worker/token.worker');

      messageHandlerAsync = opts =>
        new Promise(resolve =>
          messageHandler({ data: { ...opts, useMrrt: true, auth: { audience: 'default', scope: 'scope1' } }, ports: [{ postMessage: resolve }] })
        );

      secondMessageHandlerAsync = opts =>
        new Promise(resolve =>
          messageHandler({ data: { ...opts, useMrrt: true, auth: { audience: 'audience2', scope: 'scope2' } }, ports: [{ postMessage: resolve }] })
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
        fetchUrl: '/foo',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'authorization_code'
          })
        },
      });

      await messageHandlerAsync({
        fetchUrl: '/foo',
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
        fetchUrl: '/foo',
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
