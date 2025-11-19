import { MissingRefreshTokenError } from '../errors';
import { FetchResponse } from '../global';
import { createQueryParams, fromEntries } from '../utils';
import { WorkerRefreshTokenMessage } from './worker.types';

let refreshTokens: Record<string, string> = {};

const cacheKey = (audience: string, scope: string) => `${audience}|${scope}`;

const cacheKeyContainsAudience = (audience: string, cacheKey: string) => cacheKey.startsWith(`${audience}|`);

const getRefreshToken = (audience: string, scope: string): string | undefined =>
  refreshTokens[cacheKey(audience, scope)];

const setRefreshToken = (
  refreshToken: string,
  audience: string,
  scope: string
) => (refreshTokens[cacheKey(audience, scope)] = refreshToken);

const deleteRefreshToken = (audience: string, scope: string) =>
  delete refreshTokens[cacheKey(audience, scope)];

const wait = (time: number) =>
  new Promise<void>(resolve => setTimeout(resolve, time));

const formDataToObject = (formData: string): Record<string, any> => {
  const queryParams = new URLSearchParams(formData);
  const parsedQuery: any = {};

  queryParams.forEach((val, key) => {
    parsedQuery[key] = val;
  });

  return parsedQuery;
};

const updateRefreshTokens = (oldRefreshToken: string | undefined, newRefreshToken: string): void => {
  Object.entries(refreshTokens).forEach(([key, token]) => {
    if (token === oldRefreshToken) {
      refreshTokens[key] = newRefreshToken;
    }
  });
}

const checkDownscoping = (scope: string, audience: string): boolean => {
  const findCoincidence = Object.keys(refreshTokens).find((key) => {
    if (key !== 'latest_refresh_token') {
      const isSameAudience = cacheKeyContainsAudience(audience, key);
      const scopesKey = key.split('|')[1].split(" ");
      const requestedScopes = scope.split(" ");
      const scopesAreIncluded = requestedScopes.every((key) => scopesKey.includes(key));

      return isSameAudience && scopesAreIncluded;
    }
  })

  return findCoincidence ? true : false;
}

const messageHandler = async ({
  data: { timeout, auth, fetchUrl, fetchOptions, useFormData, useMrrt },
  ports: [port]
}: MessageEvent<WorkerRefreshTokenMessage>) => {
  let headers: FetchResponse['headers'] = {};

  let json: {
    refresh_token?: string;
  };
  let refreshToken: string | undefined;

  const { audience, scope } = auth || {};

  try {
    const body = useFormData
      ? formDataToObject(fetchOptions.body as string)
      : JSON.parse(fetchOptions.body as string);

    if (!body.refresh_token && body.grant_type === 'refresh_token') {
      refreshToken = getRefreshToken(audience, scope);

      // When we don't have any refresh_token that matches the audience and scopes
      // stored, and useMrrt is configured to true, we will use the last refresh_token
      // returned by the server to do a refresh
      // We will avoid doing MRRT if we were to downscope while doing refresh in the same audience
      if (!refreshToken && useMrrt) {
        const latestRefreshToken = refreshTokens["latest_refresh_token"];

        const isDownscoping = checkDownscoping(scope, audience);

        if (latestRefreshToken && !isDownscoping) {
          refreshToken = latestRefreshToken;
        }
      }

      if (!refreshToken) {
        throw new MissingRefreshTokenError(audience, scope);
      }

      fetchOptions.body = useFormData
        ? createQueryParams({
          ...body,
          refresh_token: refreshToken
        })
        : JSON.stringify({
          ...body,
          refresh_token: refreshToken
        });
    }

    let abortController: AbortController | undefined;

    if (typeof AbortController === 'function') {
      abortController = new AbortController();
      fetchOptions.signal = abortController.signal;
    }

    let response: void | Response;

    try {
      response = await Promise.race([
        wait(timeout),
        fetch(fetchUrl, { ...fetchOptions })
      ]);
    } catch (error) {
      // fetch error, reject `sendMessage` using `error` key so that we retry.
      port.postMessage({
        error: error.message
      });

      return;
    }

    if (!response) {
      // If the request times out, abort it and let `switchFetch` raise the error.
      if (abortController) abortController.abort();

      port.postMessage({
        error: "Timeout when executing 'fetch'"
      });

      return;
    }

    headers = fromEntries(response.headers);
    json = await response.json();

    if (json.refresh_token) {
      // If useMrrt is configured to true we want to save the latest refresh_token
      // to be used when refreshing tokens with MRRT
      if (useMrrt) {
        refreshTokens["latest_refresh_token"] = json.refresh_token;

        // To avoid having some refresh_token that has already been used
        // we will update those inside the list with the new one obtained
        // by the server
        updateRefreshTokens(refreshToken, json.refresh_token);
      }

      setRefreshToken(json.refresh_token, audience, scope);
      delete json.refresh_token;
    } else {
      deleteRefreshToken(audience, scope);
    }

    port.postMessage({
      ok: response.ok,
      json,
      headers
    });
  } catch (error) {
    port.postMessage({
      ok: false,
      json: {
        error: error.error,
        error_description: error.message
      },
      headers
    });
  }
};

// Don't run `addEventListener` in our tests (this is replaced in rollup)
if (process.env.NODE_ENV === 'test') {
  module.exports = { messageHandler };
  /* c8 ignore next 4  */
} else {
  // @ts-ignore
  addEventListener('message', messageHandler);
}
