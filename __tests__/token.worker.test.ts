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

  it(`keeps a non-rotating token when the refresh response carries no refresh_token`, async () => {
    // Seed a non-rotating (online) refresh token via the initial code exchange.
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'ort' }),
        headers: new Headers()
      })
    );
    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({ grant_type: 'authorization_code' })
      }
    });

    // First refresh: server exchanges the ORT but returns no new refresh_token.
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => ({ access_token: 'at' }),
        headers: new Headers()
      })
    );
    await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({ grant_type: 'refresh_token' })
      },
      preserveRefreshToken: true
    });

    // Second refresh: the stored ORT must still be injected (not evicted).
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => ({ access_token: 'at2' }),
        headers: new Headers()
      })
    );
    const response = await messageHandlerAsync({
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({ grant_type: 'refresh_token' })
      },
      preserveRefreshToken: true
    });

    expect(response.json.error).toBeUndefined();
    expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'ort'
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

  describe('revokeMessageHandler', () => {
    let revokeHandlerAsync;

    // Builds a revokeMessageHandler message matching the format sent by revokeToken in api.ts.
    const revokeOpts = ({
      audience = 'my_audience',
      timeout = 5000,
      useFormData = false,
      useMrrt = false
    }: {
      audience?: string;
      timeout?: number;
      useFormData?: boolean;
      useMrrt?: boolean;
    } = {}) => ({
      timeout,
      fetchUrl: `${ALLOWED_BASE_URL}/oauth/revoke`,
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
      ...(useMrrt && { useMrrt }),
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
        fetchUrl: TOKEN_ENDPOINT,
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
      expect(mockFetch.mock.calls[1][0]).toBe(`${ALLOWED_BASE_URL}/oauth/revoke`);
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'audience1', scope: 'openid' }
      });

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'audience2', scope: 'openid' }
      });

      expect(responseAudience2.json.error).toBe('missing_refresh_token');
    });

    it('revokes all distinct refresh tokens when multiple scope entries exist for the same audience', async () => {
      // Seed two distinct refresh tokens under the same audience but different scopes
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt_scope_a' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid read:data' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt_scope_b' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid write:data' }
      });

      // Both revoke calls succeed
      mockFetch
        .mockReturnValueOnce(
          Promise.resolve({ ok: true, text: () => Promise.resolve('') })
        )
        .mockReturnValueOnce(
          Promise.resolve({ ok: true, text: () => Promise.resolve('') })
        );

      const response = await revokeHandlerAsync(revokeOpts({ audience: 'my_audience' }));

      expect(response.ok).toBe(true);
      // One fetch call per distinct RT
      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 seeds + 2 revokes

      const revokeCall1Body = JSON.parse(mockFetch.mock.calls[2][1].body);
      const revokeCall2Body = JSON.parse(mockFetch.mock.calls[3][1].body);
      const revokedTokens = [revokeCall1Body.token, revokeCall2Body.token];

      expect(revokedTokens).toContain('rt_scope_a');
      expect(revokedTokens).toContain('rt_scope_b');

      // Both tokens should be gone from worker memory
      const afterRevokeA = await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'my_audience', scope: 'openid read:data' }
      });
      expect(afterRevokeA.json.error).toBe('missing_refresh_token');

      const afterRevokeB = await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'my_audience', scope: 'openid write:data' }
      });
      expect(afterRevokeB.json.error).toBe('missing_refresh_token');
    });

    it('stops and returns error if the first revoke call fails when multiple RTs exist', async () => {
      // Seed two distinct refresh tokens
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt_scope_a' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid read:data' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt_scope_b' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid write:data' }
      });

      // First revoke fails
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve(JSON.stringify({ error_description: 'token invalid' }))
        })
      );

      const response = await revokeHandlerAsync(revokeOpts({ audience: 'my_audience' }));

      expect(response.error).toBe('token invalid');
      // Second revoke should not have been attempted
      expect(mockFetch).toHaveBeenCalledTimes(3); // 2 seeds + 1 failed revoke
    });

    it('returns error from outer catch when body is malformed JSON and a token is stored', async () => {
      // Seed a refresh token
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'seeded_rt', foo: 'bar' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'my_audience', scope: 'openid' },
        timeout: 5000
      });

      // Malformed body causes JSON.parse to throw, hitting the outer catch
      const response = await revokeHandlerAsync({
        ...revokeOpts(),
        fetchOptions: {
          method: 'POST',
          body: 'not valid json',
          headers: { 'Content-Type': 'application/json', 'Auth0-Client': 'test' }
        }
      });

      expect(response.error).toBeTruthy();
    });

    describe('with useMrrt', () => {
      const tokenMsg = (audience: string, grant_type: string) => ({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type })
        },
        auth: { audience, scope: 'openid offline_access' },
        useMrrt: true
      });

      const revokedTokens = () =>
        mockFetch.mock.calls
          .filter(([url]) => url.endsWith('/oauth/revoke'))
          .map(([, opts]) => JSON.parse(opts.body).token);

      const revokeOk = () =>
        Promise.resolve({ ok: true, text: () => Promise.resolve('') });

      it('revokes every stored RT, including the latest_refresh_token slot, so the revoked audience cannot be refreshed', async () => {
        // Two interactive grants diverge the store:
        // audience1|* = rt1, audience2|* = rt2, latest_refresh_token = rt2
        mockFetch.mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => ({ refresh_token: 'rt1' }),
            headers: new Headers()
          })
        );
        await messageHandlerAsync(tokenMsg('audience1', 'authorization_code'));

        mockFetch.mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => ({ refresh_token: 'rt2' }),
            headers: new Headers()
          })
        );
        await messageHandlerAsync(tokenMsg('audience2', 'authorization_code'));

        mockFetch.mockReturnValueOnce(revokeOk()).mockReturnValueOnce(revokeOk());

        const response = await revokeHandlerAsync(
          revokeOpts({ audience: 'audience1', useMrrt: true })
        );

        expect(response).toEqual({ ok: true });
        expect(revokedTokens().sort()).toEqual(['rt1', 'rt2']);

        // Without the fix the MRRT fallback picked up rt2 here.
        const refreshAudience1 = await messageHandlerAsync(
          tokenMsg('audience1', 'refresh_token')
        );
        expect(refreshAudience1.json.error).toBe('missing_refresh_token');

        const refreshAudience2 = await messageHandlerAsync(
          tokenMsg('audience2', 'refresh_token')
        );
        expect(refreshAudience2.json.error).toBe('missing_refresh_token');

        // 2 seeds + 2 revokes; neither refresh reached the network
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      it('revokes an orphaned latest_refresh_token slot no audience entry references', async () => {
        mockFetch.mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => ({ refresh_token: 'rt1' }),
            headers: new Headers()
          })
        );
        await messageHandlerAsync(tokenMsg('audience1', 'authorization_code'));

        // A refresh that returns no RT evicts audience1|* but leaves
        // latest_refresh_token = rt1 behind.
        mockFetch.mockReturnValueOnce(
          Promise.resolve({
            ok: false,
            json: () => ({ error: 'mfa_required', mfa_token: 'mfa-token' }),
            headers: new Headers()
          })
        );
        await messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));

        mockFetch.mockReturnValueOnce(revokeOk());

        const response = await revokeHandlerAsync(
          revokeOpts({ audience: 'audience1', useMrrt: true })
        );

        expect(response).toEqual({ ok: true });
        expect(revokedTokens()).toEqual(['rt1']);

        const refresh = await messageHandlerAsync(
          tokenMsg('audience1', 'refresh_token')
        );
        expect(refresh.json.error).toBe('missing_refresh_token');
      });

      it('revokes the whole store regardless of the requested audience', async () => {
        mockFetch.mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => ({ refresh_token: 'rt1' }),
            headers: new Headers()
          })
        );
        await messageHandlerAsync(tokenMsg('audience1', 'authorization_code'));

        mockFetch.mockReturnValueOnce(revokeOk());

        await revokeHandlerAsync(
          revokeOpts({ audience: 'https://no-such-api/', useMrrt: true })
        );

        expect(revokedTokens()).toEqual(['rt1']);
      });

      it('returns ok:true without calling fetch when the store is empty', async () => {
        const response = await revokeHandlerAsync(revokeOpts({ useMrrt: true }));

        expect(response).toEqual({ ok: true });
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('keeps the failed RT and the ones it has not reached yet when a revoke call fails', async () => {
        for (const [audience, refresh_token] of [
          ['audience1', 'rt1'],
          ['audience2', 'rt2'],
          ['audience3', 'rt3']
        ]) {
          mockFetch.mockReturnValueOnce(
            Promise.resolve({
              ok: true,
              json: () => ({ refresh_token }),
              headers: new Headers()
            })
          );
          await messageHandlerAsync(tokenMsg(audience, 'authorization_code'));
        }

        mockFetch.mockReturnValueOnce(revokeOk()).mockReturnValueOnce(
          Promise.resolve({
            ok: false,
            status: 503,
            text: () => Promise.resolve('')
          })
        );

        const response = await revokeHandlerAsync(
          revokeOpts({ audience: 'audience1', useMrrt: true })
        );

        expect(response.error).toBe('HTTP error 503');

        // The loop stopped at the failure: one RT revoked, one failed, one never sent.
        expect(revokedTokens()).toHaveLength(2);
        const [revoked, failed] = revokedTokens();
        const [unattempted] = ['rt1', 'rt2', 'rt3'].filter(
          rt => rt !== revoked && rt !== failed
        );

        // A retry sends only what is still stored: the failed RT and the unattempted one.
        mockFetch.mockReturnValueOnce(revokeOk()).mockReturnValueOnce(revokeOk());

        const retry = await revokeHandlerAsync(
          revokeOpts({ audience: 'audience1', useMrrt: true })
        );

        expect(retry).toEqual({ ok: true });
        expect(revokedTokens().slice(2).sort()).toEqual(
          [failed, unattempted].sort()
        );
      });
    });

    it('without useMrrt, only revokes the requested audience and leaves others usable', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt1' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'audience1', scope: 'openid' }
      });

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt2' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
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

      expect(JSON.parse(mockFetch.mock.calls[2][1].body).token).toBe('rt1');

      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'rt2b' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'audience2', scope: 'openid' }
      });

      expect(JSON.parse(mockFetch.mock.calls[3][1].body).refresh_token).toBe(
        'rt2'
      );
    });
  });

  describe('token requests racing a revocation', () => {
    // A real timeout, so a response the test holds back doesn't time out.
    const tokenMsg = (audience: string, grant_type: string, useMrrt = true) => ({
      timeout: 5000,
      fetchUrl: TOKEN_ENDPOINT,
      fetchOptions: { method: 'POST', body: JSON.stringify({ grant_type }) },
      auth: { audience, scope: 'openid offline_access' },
      useMrrt
    });

    const revokeMsg = (audience: string, useMrrt = true) => ({
      type: 'revoke',
      timeout: 5000,
      fetchUrl: `${ALLOWED_BASE_URL}/oauth/revoke`,
      fetchOptions: {
        method: 'POST',
        body: JSON.stringify({ client_id: 'client_id' }),
        headers: {}
      },
      useMrrt,
      auth: { audience }
    });

    const tokenResponse = (refresh_token: string) => ({
      ok: true,
      json: () => ({ access_token: `at_for_${refresh_token}`, refresh_token }),
      headers: new Headers()
    });

    const revokeOk = () =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('') });

    const revokeFails = () =>
      Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('') });

    // A fetch response the test releases by hand.
    const heldResponse = () => {
      let release!: (response: unknown) => void;
      const promise = new Promise(resolve => (release = resolve));
      return { promise, release };
    };

    const callsTo = (path: string) =>
      mockFetch.mock.calls
        .filter(([url]) => url.endsWith(path))
        .map(([, opts]) => JSON.parse(opts.body));

    const refreshTokensSent = () =>
      callsTo('/oauth/token')
        .filter(body => body.grant_type === 'refresh_token')
        .map(body => body.refresh_token);

    const tokensRevoked = () => callsTo('/oauth/revoke').map(body => body.token);

    const login = async (audience: string, refreshToken: string, useMrrt = true) => {
      mockFetch.mockReturnValueOnce(Promise.resolve(tokenResponse(refreshToken)));
      await messageHandlerAsync(tokenMsg(audience, 'authorization_code', useMrrt));
    };

    const settle = () => new Promise(resolve => setTimeout(resolve, 0));

    it('with useMrrt, does not store the token rotated from one revoked while the refresh was in flight', async () => {
      await login('audience1', 'rt1');

      const refresh = heldResponse();
      mockFetch.mockReturnValueOnce(refresh.promise).mockReturnValueOnce(revokeOk());

      const refreshing = messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      expect(await messageHandlerAsync(revokeMsg('audience1'))).toEqual({ ok: true });
      expect(tokensRevoked()).toEqual(['rt1']);

      // Auth0 answered the refresh before it processed the revocation.
      refresh.release(tokenResponse('rt1_rotated'));
      const refreshed = await refreshing;

      // The caller still gets its access token, but the rotated token is not kept.
      expect(refreshed.ok).toBe(true);
      expect(refreshed.json).toEqual({ access_token: 'at_for_rt1_rotated' });

      const after = await messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      expect(after.json.error).toBe('missing_refresh_token');
      expect(refreshTokensSent()).toEqual(['rt1']);
    });

    it('makes a response that arrives during a revocation wait for it, then drops the rotated token', async () => {
      await login('audience1', 'rt1');

      const refresh = heldResponse();
      const revoke = heldResponse();
      mockFetch.mockReturnValueOnce(refresh.promise).mockReturnValueOnce(revoke.promise);

      const refreshing = messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      const revoking = messageHandlerAsync(revokeMsg('audience1'));
      await settle();
      expect(tokensRevoked()).toEqual(['rt1']);

      // The refresh response arrives while the revoke request is still pending.
      let refreshed;
      refreshing.then(response => (refreshed = response));
      refresh.release(tokenResponse('rt1_rotated'));
      await settle();
      expect(refreshed).toBeUndefined();

      revoke.release({ ok: true, text: () => Promise.resolve('') });
      expect(await revoking).toEqual({ ok: true });
      expect((await refreshing).json).toEqual({ access_token: 'at_for_rt1_rotated' });

      const after = await messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      expect(after.json.error).toBe('missing_refresh_token');
      expect(refreshTokensSent()).toEqual(['rt1']);
    });

    it('holds a refresh that arrives during a revocation until it finishes, then finds no token', async () => {
      await login('audience1', 'rt1');

      const revoke = heldResponse();
      mockFetch.mockReturnValueOnce(revoke.promise);

      const revoking = messageHandlerAsync(revokeMsg('audience1'));
      const refreshing = messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      await settle();

      // The refresh is waiting instead of sending a token that is being revoked.
      expect(refreshTokensSent()).toEqual([]);

      revoke.release({ ok: true, text: () => Promise.resolve('') });
      expect(await revoking).toEqual({ ok: true });
      expect((await refreshing).json.error).toBe('missing_refresh_token');
      expect(refreshTokensSent()).toEqual([]);
    });

    it('without useMrrt, only drops rotations of the tokens it revoked', async () => {
      await login('audience1', 'rt1', false);
      await login('audience2', 'rt2', false);

      const refresh1 = heldResponse();
      const refresh2 = heldResponse();
      mockFetch
        .mockReturnValueOnce(refresh1.promise)
        .mockReturnValueOnce(refresh2.promise)
        .mockReturnValueOnce(revokeOk());

      const refreshing1 = messageHandlerAsync(tokenMsg('audience1', 'refresh_token', false));
      const refreshing2 = messageHandlerAsync(tokenMsg('audience2', 'refresh_token', false));
      expect(await messageHandlerAsync(revokeMsg('audience1', false))).toEqual({ ok: true });
      expect(tokensRevoked()).toEqual(['rt1']);

      refresh1.release(tokenResponse('rt1_rotated'));
      refresh2.release(tokenResponse('rt2_rotated'));
      await refreshing1;
      await refreshing2;

      mockFetch.mockReturnValueOnce(Promise.resolve(tokenResponse('rt2_next')));

      const after1 = await messageHandlerAsync(tokenMsg('audience1', 'refresh_token', false));
      await messageHandlerAsync(tokenMsg('audience2', 'refresh_token', false));

      expect(after1.json.error).toBe('missing_refresh_token');
      // audience2 kept its rotated token and used it for the next refresh.
      expect(refreshTokensSent()).toEqual(['rt1', 'rt2', 'rt2_rotated']);
    });

    it('keeps the rotated token when the revocation of the token it came from fails', async () => {
      await login('audience1', 'rt1');

      const refresh = heldResponse();
      mockFetch.mockReturnValueOnce(refresh.promise).mockReturnValueOnce(revokeFails());

      const refreshing = messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));
      expect(await messageHandlerAsync(revokeMsg('audience1'))).toEqual({
        error: 'HTTP error 503',
        revoked: 0
      });

      refresh.release(tokenResponse('rt1_rotated'));
      await refreshing;

      mockFetch.mockReturnValueOnce(Promise.resolve(tokenResponse('rt1_next')));
      await messageHandlerAsync(tokenMsg('audience1', 'refresh_token'));

      expect(refreshTokensSent()).toEqual(['rt1', 'rt1_rotated']);
    });

    it('keeps the refresh token from a login that completes during a revocation', async () => {
      await login('audience1', 'rt1');

      const loginResponse = heldResponse();
      mockFetch.mockReturnValueOnce(loginResponse.promise).mockReturnValueOnce(revokeOk());

      const loggingIn = messageHandlerAsync(tokenMsg('audience2', 'authorization_code'));
      expect(await messageHandlerAsync(revokeMsg('audience1'))).toEqual({ ok: true });

      // A new login isn't issued from a revoked token, so its token is stored.
      loginResponse.release(tokenResponse('rt2'));
      await loggingIn;

      mockFetch.mockReturnValueOnce(Promise.resolve(tokenResponse('rt2_next')));
      await messageHandlerAsync(tokenMsg('audience2', 'refresh_token'));

      expect(refreshTokensSent()).toEqual(['rt2']);
    });

    it('runs revocations one at a time', async () => {
      await login('audience1', 'rt1', false);
      await login('audience2', 'rt2', false);

      const firstRevoke = heldResponse();
      mockFetch.mockReturnValueOnce(firstRevoke.promise).mockReturnValueOnce(revokeOk());

      const revoking1 = messageHandlerAsync(revokeMsg('audience1', false));
      const revoking2 = messageHandlerAsync(revokeMsg('audience2', false));
      await settle();

      expect(tokensRevoked()).toEqual(['rt1']);

      firstRevoke.release({ ok: true, text: () => Promise.resolve('') });
      expect(await revoking1).toEqual({ ok: true });
      expect(await revoking2).toEqual({ ok: true });
      expect(tokensRevoked()).toEqual(['rt1', 'rt2']);
    });

    it.each([
      ['an error response', revokeFails, 'HTTP error 503'],
      ['a network error', () => Promise.reject(new Error('Failed to fetch')), 'Failed to fetch']
    ])('reports how many tokens it revoked before %s', async (_, failure, error) => {
      await login('audience1', 'rt1');
      await login('audience2', 'rt2');
      await login('audience3', 'rt3');

      mockFetch.mockReturnValueOnce(revokeOk()).mockImplementationOnce(failure);

      expect(await messageHandlerAsync(revokeMsg('audience1'))).toEqual({
        error,
        revoked: 1
      });
    });
  });

  describe('clear message', () => {
    it('clear empties the refresh-token store', async () => {
      // Seed a refresh token via a normal authorization_code round-trip
      mockFetch.mockReturnValueOnce(
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
          body: JSON.stringify({ grant_type: 'authorization_code' })
        }
      });

      const { messageRouter } = require('../src/worker/token.worker');

      // Dispatch the clear message and assert ACK
      const ack = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      expect(ack).toEqual({ ok: true });

      // A subsequent refresh_token grant must now fail because the store is empty
      const response = await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        }
      });

      expect(response.json.error).toBe('missing_refresh_token');
      expect(response.json.error_description).toContain(
        MISSING_REFRESH_TOKEN_ERROR_MESSAGE
      );
      // Only one fetch call was issued (the seed); the refresh after clear
      // short-circuits without going to the network.
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('clear wipes the MRRT latest_refresh_token slot', async () => {
      const { messageRouter } = require('../src/worker/token.worker');

      const mrrtFor = (audience: string, scope: string) => (opts: any) =>
        new Promise<any>(resolve =>
          messageRouter({
            data: { ...opts, useMrrt: true, auth: { audience, scope } },
            ports: [{ postMessage: resolve }]
          })
        );

      // Seed an MRRT under audience1/scope1 — this should populate the
      // latest_refresh_token MRRT slot in the worker.
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'shared_rt' }),
          headers: new Headers()
        })
      );

      await mrrtFor('audience1', 'scope1')({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        }
      });

      // Sanity: the MRRT slot allows audience2 to refresh using the same RT
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'shared_rt' }),
          headers: new Headers()
        })
      );

      const before = await mrrtFor('audience2', 'scope2')({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        }
      });
      expect(before.json).toEqual({});

      // Now clear
      const ack = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );
      expect(ack).toEqual({ ok: true });

      // After clear: an MRRT-eligible refresh against a brand-new audience3
      // must fail with missing_refresh_token (latest_refresh_token slot wiped)
      const after = await mrrtFor('audience3', 'scope3')({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        }
      });
      expect(after.json.error).toBe('missing_refresh_token');

      // And the original (audience1/scope1) entry is also gone
      const original = await mrrtFor('audience1', 'scope1')({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        }
      });
      expect(original.json.error).toBe('missing_refresh_token');
    });

    it('clear with no ports is a safe no-op', () => {
      const { messageRouter } = require('../src/worker/token.worker');

      expect(() =>
        messageRouter({ data: { type: 'clear' }, ports: [] })
      ).not.toThrow();
    });

    it('clear on an empty store still ACKs ok:true', async () => {
      const { messageRouter } = require('../src/worker/token.worker');

      const ack = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      expect(ack).toEqual({ ok: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('clear is idempotent — back-to-back clears each ACK', async () => {
      const { messageRouter } = require('../src/worker/token.worker');

      const ack1 = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );
      const ack2 = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      expect(ack1).toEqual({ ok: true });
      expect(ack2).toEqual({ ok: true });
    });

    it('clear does not depend on init / allowedBaseUrl gating', async () => {
      // Re-import without invoking the init message — clear should still ACK
      jest.resetModules();
      const { messageRouter } = require('../src/worker/token.worker');

      const ack = await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      expect(ack).toEqual({ ok: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('clear does not contact the network', async () => {
      // Seed a refresh token first
      mockFetch.mockReturnValueOnce(
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
          body: JSON.stringify({ grant_type: 'authorization_code' })
        }
      });

      const fetchCallsBefore = mockFetch.mock.calls.length;

      const { messageRouter } = require('../src/worker/token.worker');
      await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      expect(mockFetch.mock.calls.length).toBe(fetchCallsBefore);
    });

    it('worker remains usable after clear — a fresh authorization_code seeds a new RT', async () => {
      // Seed
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'first_rt' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        }
      });

      // Clear
      const { messageRouter } = require('../src/worker/token.worker');
      await new Promise(resolve =>
        messageRouter({
          data: { type: 'clear' },
          ports: [{ postMessage: resolve }]
        })
      );

      // Seed again — simulates a re-login on the same client instance
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'second_rt' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        }
      });

      // Use the new RT
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'second_rt' }),
          headers: new Headers()
        })
      );
      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        }
      });

      // The refresh request should have used the second RT, not the cleared first
      const refreshCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(JSON.parse(refreshCall[1].body)).toEqual({
        grant_type: 'refresh_token',
        refresh_token: 'second_rt'
      });
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
        fetchUrl: TOKEN_ENDPOINT,
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
        fetchUrl: `${ALLOWED_BASE_URL}/oauth/revoke`,
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

    it('rejects unauthorized fetchUrl for type=revoke', async () => {
      const response = await routerAsync({
        type: 'revoke',
        timeout: 5000,
        fetchUrl: 'https://evil.com/oauth/revoke',
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ client_id: 'client_id' }),
          headers: { 'Content-Type': 'application/json', 'Auth0-Client': 'test' }
        },
        auth: { audience: 'my_audience' }
      });

      expect(response.ok).toBe(false);
      expect(response.json.error).toBe('invalid_fetch_url');
      expect(response.json.error_description).toBe('Unauthorized fetch URL');
    });
  });

  describe('skipTokenStorage', () => {
    it('strips refresh_token from the response when skipTokenStorage is true', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => ({ access_token: 'at', refresh_token: 'rt' }),
          headers: new Headers()
        })
      );

      const response = await messageHandlerAsync({
        type: 'refresh',
        skipTokenStorage: true,
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'token-exchange' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      expect(response.json.refresh_token).toBeUndefined();
      expect(response.json.access_token).toBe('at');
    });

    it('does not store the refresh_token when skipTokenStorage is true', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ access_token: 'at', refresh_token: 'rt' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        type: 'refresh',
        skipTokenStorage: true,
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'token-exchange' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      // Subsequent refresh_token grant should fail — nothing was stored
      const response = await messageHandlerAsync({
        type: 'refresh',
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      expect(response.json.error).toBe('missing_refresh_token');
      // Only one fetch call was made (the exchange); the refresh short-circuits
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not overwrite a previously stored refresh_token when skipTokenStorage is true', async () => {
      // Seed a refresh token via a normal authorization_code grant
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ refresh_token: 'stored_rt' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'authorization_code' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      // Token exchange with skipTokenStorage — must not touch the stored RT
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ access_token: 'at', refresh_token: 'exchange_rt' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        type: 'refresh',
        skipTokenStorage: true,
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'token-exchange' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      // The subsequent refresh_token grant must still use 'stored_rt'
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => ({ access_token: 'new_at' }),
          headers: new Headers()
        })
      );

      await messageHandlerAsync({
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({ grant_type: 'refresh_token' })
        },
        auth: { audience: 'default', scope: 'openid' }
      });

      const refreshBody = JSON.parse(mockFetch.mock.calls[2][1].body);
      expect(refreshBody.refresh_token).toBe('stored_rt');
    });
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

    it('propagates the rotated RT to all MRRT entries after MFA completion', async () => {
      const { messageRouter } = require('../src/worker/token.worker');

      const sendAs = (audience: string, scope: string, opts: any) =>
        new Promise(resolve =>
          messageRouter({
            data: { ...opts, useMrrt: true, auth: { audience, scope } },
            ports: [{ postMessage: resolve }]
          })
        );

      // Login: audience1 entry seeded with RT1.
      mockFetch.mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'rt1' }),
        headers: new Headers()
      }));
      await sendAs('audience1', 'scope1', {
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: { method: 'POST', body: JSON.stringify({ grant_type: 'authorization_code' }) }
      });

      // MRRT refresh for audience2: both entries converge on RT2.
      mockFetch.mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'rt2' }),
        headers: new Headers()
      }));
      await sendAs('audience2', 'scope2', {
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: { method: 'POST', body: JSON.stringify({ grant_type: 'refresh_token' }) }
      });

      // audience1 refresh is refused with mfa_required: RT2 consumed, audience1 entry evicted.
      mockFetch.mockReturnValueOnce(Promise.resolve({
        ok: false,
        json: () => ({ error: 'mfa_required', mfa_token: 'mfa-token' }),
        headers: new Headers()
      }));
      await sendAs('audience1', 'scope1', {
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: { method: 'POST', body: JSON.stringify({ grant_type: 'refresh_token' }) }
      });

      // MFA completion grant: server rotates RT2 → RT3.
      mockFetch.mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'rt3', access_token: 'at3' }),
        headers: new Headers()
      }));
      await sendAs('audience1', 'scope1', {
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: {
          method: 'POST',
          body: JSON.stringify({
            grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
            mfa_token: 'mfa-token',
            otp: '123456'
          })
        }
      });

      // audience2 must now refresh with RT3; presenting RT2 would trip reuse detection.
      mockFetch.mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => ({ refresh_token: 'rt4' }),
        headers: new Headers()
      }));
      await sendAs('audience2', 'scope2', {
        fetchUrl: TOKEN_ENDPOINT,
        fetchOptions: { method: 'POST', body: JSON.stringify({ grant_type: 'refresh_token' }) }
      });

      const lastCallBody = JSON.parse(mockFetch.mock.calls[4][1].body);
      expect(lastCallBody.refresh_token).toBe('rt3');
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
