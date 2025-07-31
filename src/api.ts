import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import * as dpopUtils from './dpop/utils';
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
    dpop,
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

  const isDpopSupported = dpopUtils.isGrantTypeSupported(options.grant_type);

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
    useFormData,
    isDpopSupported ? dpop : undefined
  );
}
