import fetch from 'unfetch';
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_SILENT_TOKEN_RETRY_COUNT
} from './constants';
import { TokenEndpointOptions } from './global';

let refreshToken;

export const createAbortController = () => new AbortController();

const fetchWithTimeout = (url, options, timeout = DEFAULT_FETCH_TIMEOUT_MS) => {
  const controller = createAbortController();
  const signal = controller.signal;

  const fetchOptions = {
    ...options,
    signal
  };

  // The promise will resolve with one of these two promises (the fetch and the timeout), whichever completes first.
  return Promise.race([
    fetch(url, fetchOptions),
    new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error("Timeout when executing 'fetch'"));
      }, timeout);
    })
  ]);
};

const getJSON = async (url, timeout, options) => {
  let fetchError, response;

  for (let i = 0; i < DEFAULT_SILENT_TOKEN_RETRY_COUNT; i++) {
    try {
      response = await fetchWithTimeout(url, options, timeout);
      fetchError = null;
      break;
    } catch (e) {
      // Fetch only fails in the case of a network issue, so should be
      // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
      // with the failure in the body.
      // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
      fetchError = e;
    }
  }

  if (fetchError) {
    throw fetchError;
  }

  const { error, error_description, ...success } = await response.json();

  if (!response.ok) {
    const errorMessage =
      error_description || `HTTP error. Unable to fetch ${url}`;
    const e = <any>new Error(errorMessage);

    e.error = error || 'request_error';
    e.error_description = errorMessage;

    throw e;
  }

  return success;
};

export const oauthToken = async ({
  baseUrl,
  timeout,
  ...options
}: TokenEndpointOptions) =>
  await getJSON(`${baseUrl}/oauth/token`, timeout, {
    method: 'POST',
    body: JSON.stringify({
      redirect_uri: self.location.origin,
      ...options
    }),
    headers: {
      'Content-type': 'application/json'
    }
  });

addEventListener('message', async ({ data: { storeToken, ...opts } }) => {
  try {
    if (
      storeToken &&
      !opts.refresh_token &&
      opts.grant_type === 'refresh_token'
    ) {
      if (!refreshToken) {
        throw new Error(
          'The web worker is missing the refresh token, you need to get it using the authorization_code grant_type first'
        );
      }
      opts.refresh_token = refreshToken;
    }

    const response = await oauthToken(opts);

    if (storeToken && response.refresh_token) {
      refreshToken = response.refresh_token;
      delete response.refresh_token;
    }

    // @ts-ignore Need separate tsconfig https://github.com/microsoft/vscode/issues/90642
    postMessage(response);
  } catch (error) {
    // @ts-ignore Make sure the error bubbles up to the worker's onerror handler
    postMessage({ error });
  }
});
