import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import { DEFAULT_AUTH0_CLIENT, DEFAULT_AUDIENCE } from './constants';
import * as dpopUtils from './dpop/utils';
import { getJSON } from './http';
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
