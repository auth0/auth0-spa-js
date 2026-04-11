import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import {
  DEFAULT_AUTH0_CLIENT,
  DEFAULT_AUDIENCE,
  DEFAULT_FETCH_TIMEOUT_MS
} from './constants';

/**
 * @ignore
 * Internal options for the revokeToken API call.
 * Kept in api.ts (not global.ts) so it is not part of the public type surface.
 */
interface RevokeTokenOptions {
  baseUrl: string;
  /** Maps directly to the OAuth `client_id` parameter. */
  client_id: string;
  /** Tokens to revoke. Empty for the worker path — the worker holds its own store. */
  refreshTokens: string[];
  audience?: string;
  timeout?: number;
  auth0Client?: any;
  useFormData?: boolean;
  onRefreshTokenRevoked?: (refreshToken: string) => Promise<void> | void;
}
import * as dpopUtils from './dpop/utils';
import { GenericError } from './errors';
import { getJSON, fetchWithTimeout } from './http';
import { sendMessage } from './worker/worker.utils';
import { createQueryParams, stripAuth0Client } from './utils';

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    useFormData,
    useMrrt,
    dpop,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {
  const isTokenExchange =
    options.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange';

  const refreshWithMrrt = options.grant_type === 'refresh_token' && useMrrt;

  const allParams = {
    ...options,
    ...(isTokenExchange && audience && { audience }),
    ...(isTokenExchange && scope && { scope }),
    ...(refreshWithMrrt && { audience, scope })
  };

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(allParams);

  const isDpopSupported = dpopUtils.isGrantTypeSupported(options.grant_type);

  return await getJSON<TokenEndpointResponse>(
    `${baseUrl}/oauth/token`,
    timeout,
    audience || DEFAULT_AUDIENCE,
    scope,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': useFormData
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
        'Auth0-Client': btoa(
          JSON.stringify(stripAuth0Client(auth0Client || DEFAULT_AUTH0_CLIENT))
        )
      }
    },
    worker,
    useFormData,
    useMrrt,
    isDpopSupported ? dpop : undefined
  );
}

/**
 * Revokes refresh tokens using the /oauth/revoke endpoint.
 *
 * Mirrors the oauthToken pattern: the worker/non-worker dispatch lives here,
 * keeping Auth0Client free of transport concerns.
 *
 * - Worker path: sends a single message; the worker holds its own RT store and
 *   loops internally. refreshTokens is empty (worker ignores it).
 * - Non-worker path: loops over refreshTokens and issues one request per token.
 *
 * @throws {GenericError} If any revoke request fails
 */
export async function revokeToken(
  {
    baseUrl,
    timeout,
    auth0Client,
    useFormData,
    refreshTokens,
    audience,
    client_id,
    onRefreshTokenRevoked
  }: RevokeTokenOptions,
  worker?: Worker
): Promise<void> {
  const resolvedTimeout = timeout || DEFAULT_FETCH_TIMEOUT_MS;
  // token_type_hint is a SHOULD per RFC 7009 §2.1; used in both paths below.
  const token_type_hint = 'refresh_token' as const;
  const fetchUrl = `${baseUrl}/oauth/revoke`;
  const headers = {
    'Content-Type': useFormData
      ? 'application/x-www-form-urlencoded'
      : 'application/json',
    'Auth0-Client': btoa(
      JSON.stringify(stripAuth0Client(auth0Client || DEFAULT_AUTH0_CLIENT))
    )
  };

  if (worker) {
    // Worker holds its own RT store and injects each token into the request.
    // Send the base body (without token) so the worker can loop over its tokens.
    const baseParams = { client_id, token_type_hint };
    const body = useFormData
      ? createQueryParams(baseParams)
      : JSON.stringify(baseParams);

    try {
      return await sendMessage(
        {
          type: 'revoke',
          timeout: resolvedTimeout,
          fetchUrl,
          fetchOptions: { method: 'POST', body, headers },
          useFormData,
          auth: { audience: audience ?? DEFAULT_AUDIENCE }
        },
        worker
      );
    } catch (e) {
      throw new GenericError('revoke_error', (e as Error).message);
    }
  }

  for (const refreshToken of refreshTokens) {
    const params = { client_id, token_type_hint, token: refreshToken };
    const body = useFormData
      ? createQueryParams(params)
      : JSON.stringify(params);

    const response = await fetchWithTimeout(
      fetchUrl,
      { method: 'POST', body, headers },
      resolvedTimeout
    );

    if (!response.ok) {
      let error: string | undefined;
      let errorDescription: string | undefined;
      try {
        ({ error, error_description: errorDescription } = JSON.parse(await response.text()));
      } catch {
        // body absent or not valid JSON
      }
      throw new GenericError(error || 'revoke_error', errorDescription || `HTTP error ${response.status}`);
    }

    await onRefreshTokenRevoked?.(refreshToken);
  }
}
