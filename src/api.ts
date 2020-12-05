import { TokenEndpointOptions } from './global';
import { DEFAULT_AUTH0_CLIENT } from './constants';
import { getJSON } from './http';
import { getMissingScope } from './scope';

export type TokenEndpointResponse = {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    auth0Client,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {
  const result = await getJSON<TokenEndpointResponse>(
    `${baseUrl}/oauth/token`,
    timeout,
    audience || 'default',
    scope,
    {
      method: 'POST',
      body: JSON.stringify(options),
      headers: {
        'Content-type': 'application/json',
        'Auth0-Client': btoa(
          JSON.stringify(auth0Client || DEFAULT_AUTH0_CLIENT)
        )
      }
    },
    worker
  );

  const missingScope = getMissingScope(scope, result.scope);
  if (missingScope.length) {
    console.warn(
      `The requested scopes (${scope}) are different from the scopes of the retrieved token (${result.scope}). This could mean that your access token may not include all the scopes that you expect. It is advised to resolve this by either:
  
  - Removing \`${missingScope}\` from the scope when requesting a new token.
  - Ensuring \`${missingScope}\` is returned as part of the requested token's scopes.`
    );
  }

  return result;
}
