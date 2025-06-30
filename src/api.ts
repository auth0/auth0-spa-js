import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import { getJSON } from './http';
import { createQueryParams } from './utils';

const stripUndefined = (params: any) => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
};

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
  // Only include scope and audience for token exchange requests
  // For other grant types (especially refresh_token), excluding scope prevents "Access Token Descoping"
  const isTokenExchange =
    options.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange';

  const allParams = isTokenExchange ? { ...options, audience, scope } : options;

  const body = useFormData
    ? createQueryParams(allParams)
    : JSON.stringify(stripUndefined(allParams));

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
