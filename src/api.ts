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
    useMRRT,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {

  // When doing a refresh with MRRT enabled, we need to send to the server both audience and scopes inside the body
  const newOptions = options.grant_type === 'refresh_token' && useMRRT ? { ...options, audience, scope } : options;

  const body = useFormData
    ? createQueryParams(newOptions)
    : JSON.stringify(newOptions);

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
