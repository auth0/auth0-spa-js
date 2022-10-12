import { ICache, InMemoryCache, LocalStorageCache } from './cache';
import {
  Auth0ClientOptions,
  AuthorizationParams,
  AuthorizeOptions
} from './global';
import { getUniqueScopes } from './scope';

/**
 * @ignore
 */
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

/**
 * @ignore
 */
export const buildOrganizationHintCookieName = (clientId: string) =>
  `auth0.${clientId}.organization_hint`;

/**
 * @ignore
 */
export const OLD_IS_AUTHENTICATED_COOKIE_NAME = 'auth0.is.authenticated';

/**
 * @ignore
 */
export const buildIsAuthenticatedCookieName = (clientId: string) =>
  `auth0.${clientId}.is.authenticated`;

/**
 * @ignore
 */
const cacheLocationBuilders: Record<string, () => ICache> = {
  memory: () => new InMemoryCache().enclosedCache,
  localstorage: () => new LocalStorageCache()
};

/**
 * @ignore
 */
export const cacheFactory = (location: string) => {
  return cacheLocationBuilders[location];
};

/**
 * @ignore
 */
export const getAuthorizeParams = (
  clientOptions: Auth0ClientOptions & {
    authorizationParams: AuthorizationParams;
  },
  scope: string,
  authorizationParams: AuthorizationParams,
  state: string,
  nonce: string,
  code_challenge: string,
  redirect_uri: string | undefined,
  response_mode: string | undefined
): AuthorizeOptions => {
  return {
    client_id: clientOptions.clientId,
    ...clientOptions.authorizationParams,
    ...authorizationParams,
    scope: getUniqueScopes(scope, authorizationParams.scope),
    response_type: 'code',
    response_mode: response_mode || 'query',
    state,
    nonce,
    redirect_uri:
      redirect_uri || clientOptions.authorizationParams.redirect_uri,
    code_challenge,
    code_challenge_method: 'S256'
  };
};
