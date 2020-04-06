import { DEFAULT_SILENT_TOKEN_RETRY_COUNT } from '../src/constants';
import { messageHandler } from '../src/token.worker';
import mockUnfetch from 'unfetch';

jest.mock('unfetch');

const oauthToken = (opts): any =>
  new Promise(resolve => {
    messageHandler({
      data: { url: '', ports: [{ postMessage: resolve }], ...opts }
    });
  });

describe('oauthToken', () => {
  let abortController;
  let OriginalAbortController;

  beforeEach(() => {
    jest.resetModules();

    abortController = new AbortController();
    abortController.abort = jest.fn();
    OriginalAbortController = AbortController;
    // @ts-ignore
    global.AbortController = function() {
      return abortController;
    };
  });

  afterEach(() => {
    (mockUnfetch as jest.Mock).mockReset();
    (abortController.abort as jest.Mock).mockReset();
    // @ts-ignore
    global.AbortController = OriginalAbortController;
  });

  it('calls oauth/token with the correct url', async () => {
    (mockUnfetch as jest.Mock).mockReturnValue(
      new Promise(res =>
        res({ ok: true, json: () => new Promise(ress => ress(true)) })
      )
    );

    await oauthToken({
      grant_type: 'authorization_code',
      baseUrl: 'https://test.com',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn'
    });

    expect(mockUnfetch).toBeCalledWith('https://test.com/oauth/token', {
      body:
        '{"redirect_uri":"http://localhost","grant_type":"authorization_code","client_id":"client_idIn","code":"codeIn","code_verifier":"code_verifierIn"}',
      headers: { 'Content-type': 'application/json' },
      method: 'POST',
      signal: abortController.signal
    });

    expect(
      (mockUnfetch as jest.Mock).mock.calls[0][1].signal
    ).not.toBeUndefined();
  });

  it('handles error with error response', async () => {
    const theError = {
      error: 'the-error',
      error_description: 'the-error-description'
    };

    (mockUnfetch as jest.Mock).mockReturnValue(
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
    (mockUnfetch as jest.Mock).mockReturnValue(
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
    (mockUnfetch as jest.Mock).mockReturnValue(
      Promise.reject(new Error('Network failure'))
    );

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
    // @ts-ignore
    (mockUnfetch as jest.Mock)
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

    (mockUnfetch as jest.Mock).mockReturnValue(createPromise());

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

    (mockUnfetch as jest.Mock).mockReturnValueOnce(
      new Promise((resolve, _) => {
        setTimeout(() => resolve(fetchResult), 1000);
      })
    );

    (mockUnfetch as jest.Mock).mockReturnValue(Promise.resolve(fetchResult));

    jest.useFakeTimers();
    const promise = oauthToken({
      baseUrl: 'https://test.com',
      client_id: 'client_idIn',
      code: 'codeIn',
      code_verifier: 'code_verifierIn',
      timeout: 500
    });

    jest.runAllTimers();
    const result = await promise;

    expect(result.access_token).toBe('access-token');
    expect(mockUnfetch).toHaveBeenCalledTimes(2);
    expect(abortController.abort).toHaveBeenCalled();
  });
});
