import { TokenEndpointOptions } from '.';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import { getJSON } from './http';

export const oauthToken = async (
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) =>
  await getJSON(
    `${baseUrl}/oauth/token`,
    timeout,
    audience || 'default',
    scope,
    {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri: window.location.origin,
        ...options
      }),
      headers: {
        'Content-type': 'application/json',
        'Auth0-Client': btoa(
          JSON.stringify(auth0Client || DEFAULT_AUTH0_CLIENT)
        )
      }
    },
    worker
  );
