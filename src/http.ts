import fetch from 'unfetch';

import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_SILENT_TOKEN_RETRY_COUNT
} from './constants';

import { sendMessage } from './worker/worker.utils';
import { FetchOptions } from './global';
import { GenericError } from './errors';

export const createAbortController = () => new AbortController();

const switchFetch = async (
  fetchUrl: string,
  audience: string,
  scope: string,
  fetchOptions: FetchOptions,
  timeout: number,
  worker?: Worker
): Promise<any> => {
  if (worker) {
    // AbortSignal is not serializable, need to implement in the Web Worker
    delete fetchOptions.signal;

    return sendMessage(
      {
        auth: {
          audience,
          scope
        },
        timeout,
        fetchUrl,
        fetchOptions
      },
      worker
    );
  } else {
    const response = await fetch(fetchUrl, fetchOptions);
    return {
      ok: response.ok,
      json: await response.json()
    };
  }
};

export const fetchWithTimeout = (
  url: string,
  audience: string,
  scope: string,
  options: FetchOptions,
  worker?: Worker,
  timeout = DEFAULT_FETCH_TIMEOUT_MS
): Promise<any> => {
  const controller = createAbortController();
  const signal = controller.signal;

  const fetchOptions = {
    ...options,
    signal
  };

  let timeoutId: NodeJS.Timeout;

  // The promise will resolve with one of these two promises (the fetch or the timeout), whichever completes first.
  return Promise.race([
    switchFetch(url, audience, scope, fetchOptions, timeout, worker),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error("Timeout when executing 'fetch'"));
      }, timeout);
    })
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export async function getJSON<T>(
  url: string,
  timeout: number,
  audience: string,
  scope: string,
  options: FetchOptions,
  worker?: Worker
): Promise<T> {
  let fetchError: null | Error = null;
  let response: any;

  for (let i = 0; i < DEFAULT_SILENT_TOKEN_RETRY_COUNT; i++) {
    try {
      response = await fetchWithTimeout(
        url,
        audience,
        scope,
        options,
        worker,
        timeout
      );
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
    // unfetch uses XMLHttpRequest under the hood which throws
    // ProgressEvents on error, which don't have message properties
    fetchError.message = fetchError.message || 'Failed to fetch';
    throw fetchError;
  }

  const {
    json: { error, error_description, ...success },
    ok
  } = response;

  if (!ok) {
    const errorMessage =
      error_description || `HTTP error. Unable to fetch ${url}`;

    throw new GenericError(error || 'request_error', errorMessage);
  }

  return success;
}
