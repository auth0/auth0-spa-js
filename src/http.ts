import {
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_SILENT_TOKEN_RETRY_COUNT
} from './constants';

import { fromEntries } from './utils';
import { sendMessage } from './worker/worker.utils';
import { FetchOptions, FetchResponse } from './global';
import {
  GenericError,
  MfaRequiredError,
  MissingRefreshTokenError,
  UseDpopNonceError
} from './errors';
import { Dpop } from './dpop/dpop';
import { DPOP_NONCE_HEADER } from './dpop/utils';

export const createAbortController = () => new AbortController();

const dofetch = async (fetchUrl: string, fetchOptions: FetchOptions) => {
  const response = await fetch(fetchUrl, fetchOptions);

  return {
    ok: response.ok,
    json: await response.json(),

    /**
     * This is not needed, but do it anyway so the object shape is the
     * same as when using a Web Worker (which *does* need this, see
     * src/worker/token.worker.ts).
     */
    headers: fromEntries(response.headers)
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
  useFormData?: boolean,
  useMrrt?: boolean
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
      useFormData,
      useMrrt
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
  timeout = DEFAULT_FETCH_TIMEOUT_MS,
  useMrrt?: boolean,
): Promise<any> => {
  if (worker) {
    return fetchWithWorker(
      fetchUrl,
      audience,
      scope,
      fetchOptions,
      timeout,
      worker,
      useFormData,
      useMrrt
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
  useFormData?: boolean,
  useMrrt?: boolean,
  dpop?: Pick<Dpop, 'generateProof' | 'getNonce' | 'setNonce'>,
  isDpopRetry?: boolean
): Promise<T> {
  if (dpop) {
    const dpopProof = await dpop.generateProof({
      url,
      method: options.method || 'GET',
      nonce: await dpop.getNonce()
    });

    options.headers = { ...options.headers, dpop: dpopProof };
  }

  let fetchError: null | Error = null;
  let response!: FetchResponse;

  for (let i = 0; i < DEFAULT_SILENT_TOKEN_RETRY_COUNT; i++) {
    try {
      response = await switchFetch(
        url,
        audience,
        scope,
        options,
        worker,
        useFormData,
        timeout,
        useMrrt,
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
    headers,
    ok
  } = response;

  let newDpopNonce: string | undefined;

  if (dpop) {
    /**
     * Note that a new DPoP nonce can appear in both error and success responses!
     *
     * @see {@link https://www.rfc-editor.org/rfc/rfc9449.html#section-8.2-3}
     */
    newDpopNonce = headers[DPOP_NONCE_HEADER];

    if (newDpopNonce) {
      await dpop.setNonce(newDpopNonce);
    }
  }

  if (!ok) {
    const errorMessage =
      error_description || `HTTP error. Unable to fetch ${url}`;

    if (error === 'mfa_required') {
      throw new MfaRequiredError(error, errorMessage, data.mfa_token);
    }

    if (error === 'missing_refresh_token') {
      throw new MissingRefreshTokenError(audience, scope);
    }

    /**
     * When DPoP is used and we get a `use_dpop_nonce` error from the server,
     * we must retry ONCE with any new nonce received in the rejected request.
     *
     * If a new nonce was not received or the retry fails again, we give up and
     * throw the error as is.
     */
    if (error === 'use_dpop_nonce') {
      if (!dpop || !newDpopNonce || isDpopRetry) {
        throw new UseDpopNonceError(newDpopNonce);
      }

      // repeat the call but with isDpopRetry=true to avoid any more retries
      return getJSON(
        url,
        timeout,
        audience,
        scope,
        options,
        worker,
        useFormData,
        useMrrt,
        dpop,
        true // !
      );
    }

    throw new GenericError(error || 'request_error', errorMessage);
  }

  return data;
}
