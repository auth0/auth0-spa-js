import {
  TokenEndpointOptions,
  TokenEndpointResponse,
  RevokeTokenOptions
} from './global';
import {
  DEFAULT_AUTH0_CLIENT,
  DEFAULT_AUDIENCE,
  DEFAULT_FETCH_TIMEOUT_MS
} from './constants';
import * as dpopUtils from './dpop/utils';
import { getJSON, doRevoke } from './http';
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
 * Revokes a refresh token using the /oauth/revoke endpoint.
 *
 * @param options - The options for revoking the token
 * @param worker  - Optional Web Worker; when provided the worker holds the
 *                  refresh token in memory and injects it into the request
 * @returns A promise that resolves when the token is successfully revoked
 * @throws {Error} If the API request fails
 */
export async function revokeToken(
  {
    baseUrl,
    timeout,
    auth0Client,
    useFormData,
    refreshToken,
    audience,
    scope,
    clientId
  }: RevokeTokenOptions,
  worker?: Worker
): Promise<void> {
  // For the worker path refreshToken is undefined — the worker holds it in
  // memory and injects it (mirroring how messageHandler injects refresh_token).
  // For the non-worker path it is included directly in the body.
  const allParams = {
    client_id: clientId,
    ...(refreshToken !== undefined && { token: refreshToken })
  };

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(allParams);

  return await doRevoke(
    `${baseUrl}/oauth/revoke`,
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
    timeout || DEFAULT_FETCH_TIMEOUT_MS,
    audience,
    scope,
    worker,
    useFormData
  );
}
