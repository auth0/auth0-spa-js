import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_SILENT_TOKEN_RETRY_COUNT
} from './constants';

import { sendMessage } from './worker/worker.utils';
import { FetchOptions } from './global';
import {
  GenericError,
  MfaRequiredError,
  MissingRefreshTokenError
} from './errors';

export const createAbortController = () => new AbortController();

const dofetch = async (fetchUrl: string, fetchOptions: FetchOptions) => {
  const response = await fetch(fetchUrl, fetchOptions);

  return {
    ok: response.ok,
    json: await response.json()
  };
};

const fetchWithoutWorker = async (
  fetchUrl: string,
  fetchOptions: FetchOptions,
  timeout: number
) => {
  const controller = createAbortController();
  fetchOptions.signal = controller.signal;

  let timeoutId: NodeJS.Timeout;

  // The promise will resolve with one of these two promises (the fetch or the timeout), whichever completes first.
  return Promise.race([
    dofetch(fetchUrl, fetchOptions),

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

const fetchWithWorker = async (
  fetchUrl: string,
  audience: string,
  scope: string,
  fetchOptions: FetchOptions,
  timeout: number,
  worker: Worker,
  useFormData?: boolean
) => {
  return sendMessage(
    {
      auth: {
        audience,
        scope
      },
      timeout,
      fetchUrl,
      fetchOptions,
      useFormData
    },
    worker
  );
};

export const switchFetch = async (
  fetchUrl: string,
  audience: string,
  scope: string,
  fetchOptions: FetchOptions,
  worker?: Worker,
  useFormData?: boolean,
  timeout = DEFAULT_FETCH_TIMEOUT_MS
): Promise<any> => {
  if (worker) {
    return fetchWithWorker(
      fetchUrl,
      audience,
      scope,
      fetchOptions,
      timeout,
      worker,
      useFormData
    );
  } else {
    return fetchWithoutWorker(fetchUrl, fetchOptions, timeout);
  }
};

export async function getJSON<T>(
  url: string,
  timeout: number | undefined,
  audience: string,
  scope: string,
  options: FetchOptions,
  worker?: Worker,
  useFormData?: boolean
): Promise<T> {
  let fetchError: null | Error = null;
  let response: any;

  for (let i = 0; i < DEFAULT_SILENT_TOKEN_RETRY_COUNT; i++) {
    try {
      response = await switchFetch(
        url,
        audience,
        scope,
        options,
        worker,
        useFormData,
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
    throw fetchError;
  }

  const {
    json: { error, error_description, ...data },
    ok
  } = response;

  if (!ok) {
    const errorMessage =
      error_description || `HTTP error. Unable to fetch ${url}`;

    if (error === 'mfa_required') {
      throw new MfaRequiredError(error, errorMessage, data.mfa_token);
    }

    if (error === 'missing_refresh_token') {
      throw new MissingRefreshTokenError(audience, scope);
    }

    throw new GenericError(error || 'request_error', errorMessage);
  }

  return data;
}
