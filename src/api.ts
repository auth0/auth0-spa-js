import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import { getJSON } from './http';
import { createQueryParams } from './utils';

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    useFormData,
    useMultiResourceRefreshTokens,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {
  const isTokenExchange =
    options.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange';
  const isMultiResourceRefreshToken =
    options.grant_type === 'refresh_token' && useMultiResourceRefreshTokens;
  const includeAudienceScope = isTokenExchange || isMultiResourceRefreshToken;

  const allParams = {
    ...options,
    ...(includeAudienceScope && audience && { audience }),
    ...(includeAudienceScope && scope && { scope })
  };

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(allParams);

  // If using MRRT, the refresh token is global for the client, so don't pass audience/scope to
  // the worker so it will cache refresh tokens as global instead of tied to audience/scope.
  const workerAudience = useMultiResourceRefreshTokens
    ? undefined
    : audience || 'default';
  const workerScope = useMultiResourceRefreshTokens ? undefined : scope;

  return await getJSON<TokenEndpointResponse>(
    `${baseUrl}/oauth/token`,
    timeout,
    workerAudience,
    workerScope,
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
