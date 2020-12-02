import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_SILENT_TOKEN_RETRY_COUNT
} from './constants';

import { sendMessage } from './worker/worker.utils';

export const createAbortController = () => new AbortController();

const switchFetch = async (
  url: string,
  audience: string,
  scope: string,
  opts: { [index: string]: any },
  timeout: number,
  worker: Worker
) => {
  if (worker) {
    console.log(opts);
    // AbortSignal is not serializable, need to implement in the Web Worker
    delete opts.signal;
    return sendMessage({ url, audience, scope, timeout, ...opts }, worker);
  } else {
    const response = await fetch(url, opts);
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
  options: { [index: string]: any },
  worker: Worker,
  timeout = DEFAULT_FETCH_TIMEOUT_MS
) => {
  const controller = createAbortController();
  const signal = controller.signal;

  const fetchOptions = {
    ...options,
    signal
  };

  let timeoutId: ReturnType<typeof setTimeout>;
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

export const getJSON = async (
  url: string,
  timeout: number,
  audience: string,
  scope: string,
  options: { [index: string]: any },
  worker: Worker
) => {
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
    const e: any = new Error(errorMessage);

    e.error = error || 'request_error';
    e.error_description = errorMessage;

    throw e;
  }

  return success;
};
