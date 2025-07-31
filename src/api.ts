import {
  TokenEndpointOptions,
  TokenEndpointResponse,
  RevokeOptions
} from './global';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import { getJSON, createAbortController } from './http';
import { createQueryParams } from './utils';
import { DEFAULT_FETCH_TIMEOUT_MS } from './constants';

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    useFormData,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {
  const isTokenExchange =
    options.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange';

  const allParams = {
    ...options,
    ...(isTokenExchange && audience && { audience }),
    ...(isTokenExchange && scope && { scope })
  };

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(allParams);

  return await getJSON<TokenEndpointResponse>(
    `${baseUrl}/oauth/token`,
    timeout,
    audience || 'default',
    scope,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': useFormData
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
        'Auth0-Client': btoa(
          JSON.stringify(auth0Client || DEFAULT_AUTH0_CLIENT)
        )
      }
    },
    worker,
    useFormData
  );
}

export async function revokeToken({
  baseUrl,
  timeout,
  auth0Client,
  useFormData,
  refreshToken,
  clientId
}: RevokeOptions): Promise<void> {
  if (!refreshToken) {
    throw new Error('refresh_token is required for revocation');
  }

  if (!clientId) {
    throw new Error('client_id is required for revocation');
  }

  const allParams = {
    client_id: clientId,
    token: refreshToken
  };

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(allParams);

  // Use direct fetch instead of switchFetch to avoid automatic JSON parsing
  // since /oauth/revoke returns empty response body on success
  const controller = createAbortController();
  const timeoutMs = timeout || DEFAULT_FETCH_TIMEOUT_MS;

  let timeoutId: NodeJS.Timeout | undefined;

  try {
    const response = await Promise.race([
      fetch(`${baseUrl}/oauth/revoke`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': useFormData
            ? 'application/x-www-form-urlencoded'
            : 'application/json',
          'Auth0-Client': btoa(
            JSON.stringify(auth0Client || DEFAULT_AUTH0_CLIENT)
          )
        },
        signal: controller.signal
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error("Timeout when executing 'fetch'"));
        }, timeoutMs);
      })
    ]);

    if (!response.ok) {
      // For revoke endpoint, try to get error details but handle empty response
      let errorData: any = {};
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch {
        // Ignore JSON parse errors for revoke endpoint
      }

      const errorMessage =
        errorData.error_description ||
        `HTTP error ${response.status}. Unable to revoke token`;
      throw new Error(errorMessage);
    }

    // Success case - revoke endpoint returns empty response body, so no need to parse JSON
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
