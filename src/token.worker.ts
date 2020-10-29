import { MISSING_REFRESH_TOKEN_ERROR_MESSAGE } from './constants';

let refreshTokens = {};

const cacheKey = (audience, scope) => `${audience}|${scope}`;

const getRefreshToken = (audience, scope) =>
  refreshTokens[cacheKey(audience, scope)];

const setRefreshToken = (refreshToken, audience, scope) =>
  (refreshTokens[cacheKey(audience, scope)] = refreshToken);

const deleteRefreshToken = (audience, scope) =>
  delete refreshTokens[cacheKey(audience, scope)];

const wait: any = time => new Promise(resolve => setTimeout(resolve, time));

const messageHandler = async ({
  data: { url, timeout, audience, scope, ...opts },
  ports: [port]
}) => {
  let json;
  try {
    const body = JSON.parse(opts.body);
    if (!body.refresh_token && body.grant_type === 'refresh_token') {
      const refreshToken = getRefreshToken(audience, scope);
      if (!refreshToken) {
        throw new Error(MISSING_REFRESH_TOKEN_ERROR_MESSAGE);
      }
      opts.body = JSON.stringify({ ...body, refresh_token: refreshToken });
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    let response;
    try {
      response = await Promise.race([
        wait(timeout),
        fetch(url, { ...opts, signal })
      ]);
    } catch (error) {
      // fetch error, reject `sendMessage` using `error` key so that we retry.
      port.postMessage({
        error: error.message
      });
      return;
    }

    if (!response) {
      // If the request times out, abort it and let `fetchWithTimeout` raise the error.
      abortController.abort();
      return;
    }

    json = await response.json();

    if (json.refresh_token) {
      setRefreshToken(json.refresh_token, audience, scope);
      delete json.refresh_token;
    } else {
      deleteRefreshToken(audience, scope);
    }

    port.postMessage({
      ok: response.ok,
      json
    });
  } catch (error) {
    port.postMessage({
      ok: false,
      json: {
        error_description: error.message
      }
    });
  }
};

// Don't run `addEventListener` in our tests (this is replaced in rollup)
/* istanbul ignore else  */
if (process.env.NODE_ENV === 'test') {
  module.exports = { messageHandler };
} else {
  // @ts-ignore
  addEventListener('message', messageHandler);
}
