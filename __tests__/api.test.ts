import unfetch from 'unfetch';
import { DEFAULT_SILENT_TOKEN_RETRY_COUNT } from '../src/constants';
import version from '../src/version';

// @ts-ignore
import Worker from '../src/worker/token.worker';

jest.mock('unfetch');
const mockUnfetch = <jest.Mock>unfetch;

describe('oauthToken', () => {
  let oauthToken;
  let abortController;

  beforeEach(() => {
    const utils = require('../src/utils');
    oauthToken = utils.oauthToken;

    // Set up an AbortController that we can test has been called in the event of a timeout
    abortController = new AbortController();
    jest.spyOn(abortController, 'abort');
    utils.createAbortController = jest.fn(() => abortController);
  });

  it('calls oauth/token with the correct url', async () => {
    mockUnfetch.mockReturnValue(
      new Promise(res =>
        res({ ok: true, json: () => new Promise(ress => ress(true)) })
      )
    );
    const auth0Client = {
      name: 'auth0-spa-js',
      version: version
    };

    await oauthToken({
      grant_type: 'authorization_code',
      baseUrl: 'https://test.com',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn',
      auth0Client
    });

    expect(mockUnfetch).toBeCalledWith('https://test.com/oauth/token', {
      body:
        '{"redirect_uri":"http://localhost","grant_type":"authorization_code","client_id":"client_idIn","code":"codeIn","code_verifier":"code_verifierIn"}',
      headers: {
        'Content-type': 'application/json',
        'Auth0-Client': btoa(JSON.stringify(auth0Client))
      },
      method: 'POST',
      signal: abortController.signal
    });

    expect(mockUnfetch.mock.calls[0][1].signal).not.toBeUndefined();
  });

  it('calls oauth/token with a worker with the correct url', async () => {
    mockUnfetch.mockReturnValue(
      new Promise(res =>
        res({ ok: true, json: () => new Promise(ress => ress(true)) })
      )
    );
    const worker = new Worker();
    const spy = jest.spyOn(worker, 'postMessage');
    const body = {
      redirect_uri: 'http://localhost',
      grant_type: 'authorization_code',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn'
    };
    const auth0Client = {
      name: 'auth0-spa-js',
      version: version
    };

    await oauthToken(
      {
        grant_type: 'authorization_code',
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn',
        audience: '__test_audience__',
        scope: '__test_scope__',
        auth0Client
      },
      worker
    );

    expect(mockUnfetch).toBeCalledWith('https://test.com/oauth/token', {
      body: JSON.stringify(body),
      headers: {
        'Content-type': 'application/json',
        'Auth0-Client': btoa(JSON.stringify(auth0Client))
      },
      method: 'POST',
      signal: abortController.signal
    });

    expect(mockUnfetch.mock.calls[0][1].signal).not.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      {
        body: JSON.stringify(body),
        audience: '__test_audience__',
        scope: '__test_scope__',
        headers: {
          'Content-type': 'application/json',
          'Auth0-Client': btoa(JSON.stringify(auth0Client))
        },
        method: 'POST',
        timeout: 10000,
        url: 'https://test.com/oauth/token'
      },
      expect.arrayContaining([expect.anything()])
    );
  });

  it('handles error with error response', async () => {
    const theError = {
      error: 'the-error',
      error_description: 'the-error-description'
    };

    mockUnfetch.mockReturnValue(
      new Promise(res =>
        res({
          ok: false,
          json: () => new Promise(ress => ress(theError))
        })
      )
    );

    try {
      await oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn'
      });
    } catch (error) {
      expect(error.message).toBe(theError.error_description);
      expect(error.error).toBe(theError.error);
      expect(error.error_description).toBe(theError.error_description);
    }
  });

  it('handles error without error response', async () => {
    mockUnfetch.mockReturnValue(
      new Promise(res =>
        res({
          ok: false,
          json: () => new Promise(ress => ress(false))
        })
      )
    );

    try {
      await oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn'
      });
    } catch (error) {
      expect(error.message).toBe(
        `HTTP error. Unable to fetch https://test.com/oauth/token`
      );
      expect(error.error).toBe('request_error');
      expect(error.error_description).toBe(
        `HTTP error. Unable to fetch https://test.com/oauth/token`
      );
    }
  });

  it('retries the request in the event of a network failure', async () => {
    // Fetch only fails in the case of a network issue, so should be
    // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
    // with the failure in the body.
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    mockUnfetch.mockReturnValue(Promise.reject(new Error('Network failure')));

    try {
      await oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn'
      });
    } catch (error) {
      expect(error.message).toBe('Network failure');

      expect(mockUnfetch).toHaveBeenCalledTimes(
        DEFAULT_SILENT_TOKEN_RETRY_COUNT
      );
    }
  });

  it('continues the program after failing a couple of times then succeeding', async () => {
    // Fetch only fails in the case of a network issue, so should be
    // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
    // with the failure in the body.
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    mockUnfetch
      .mockReturnValueOnce(Promise.reject(new Error('Network failure')))
      .mockReturnValueOnce(Promise.reject(new Error('Network failure')))
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'access-token' })
        })
      );

    const result = await oauthToken({
      baseUrl: 'https://test.com',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn'
    });

    expect(result.access_token).toBe('access-token');
    expect(mockUnfetch).toHaveBeenCalledTimes(3);
    expect(abortController.abort).not.toHaveBeenCalled();
  });

  it('throws a fetch error when the network is down', async () => {
    mockUnfetch.mockReturnValue(Promise.reject(new ProgressEvent('error')));

    await expect(
      oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn'
      })
    ).rejects.toMatchObject({ message: 'Failed to fetch' });
  });

  it('surfaces a timeout error when the fetch continuously times out', async () => {
    const createPromise = () =>
      new Promise((resolve, _) => {
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ access_token: 'access-token' })
            }),
          500
        );
      });

    mockUnfetch.mockReturnValue(createPromise());

    try {
      await oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn',
        timeout: 100
      });
    } catch (e) {
      expect(e.message).toBe("Timeout when executing 'fetch'");
      expect(mockUnfetch).toHaveBeenCalledTimes(3);
      expect(abortController.abort).toHaveBeenCalledTimes(3);
    }
  });

  it('retries the request in the event of a timeout', async () => {
    const fetchResult = {
      ok: true,
      json: () => Promise.resolve({ access_token: 'access-token' })
    };

    mockUnfetch.mockReturnValueOnce(
      new Promise((resolve, _) => {
        setTimeout(() => resolve(fetchResult), 1000);
      })
    );

    mockUnfetch.mockReturnValue(Promise.resolve(fetchResult));

    const result = await oauthToken({
      baseUrl: 'https://test.com',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn',
      timeout: 500
    });

    expect(result.access_token).toBe('access-token');
    expect(mockUnfetch).toHaveBeenCalledTimes(2);
    expect(abortController.abort).toHaveBeenCalled();
  });
});
