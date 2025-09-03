import { ICache, InMemoryCache, LocalStorageCache } from './cache';
import {
  Auth0ClientOptions,
  AuthorizationParams,
  AuthorizeOptions,
  LogoutOptions
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
  response_mode: string | undefined,
  thumbprint: string | undefined
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
    code_challenge_method: 'S256',
    dpop_jkt: thumbprint
  };
};

/**
 * @ignore
 *
 * Function used to provide support for the deprecated onRedirect through openUrl.
 */
export const patchOpenUrlWithOnRedirect = <
  T extends Pick<LogoutOptions, 'openUrl' | 'onRedirect'>
>(
  options: T
) => {
  const { openUrl, onRedirect, ...originalOptions } = options;

  const result = {
    ...originalOptions,
    openUrl: openUrl === false || openUrl ? openUrl : onRedirect
  };

  return result as T;
};

/**
 * @ignore
 * 
 * Checks if all scopes are included inside other array of scopes
 */
export const allScopesAreIncluded = (scopesToCheck?: string, scopesContainer?: string): boolean => {
  const oldScopes = scopesContainer?.split(" ") || [];
  const newScopes = scopesToCheck?.split(" ") || [];
  return newScopes.every((scope) => oldScopes.includes(scope));
}

/**
 * @ignore
 *
 * For backward compatibility we are going to check if we are going to downscope while doing a refresh request
 * while MRRT is allowed. If the audience is the same for the refresh_token we are going to use and it has
 * lower scopes than the ones originally in the token, we are going to return the scopes that were stored
 * with the refresh_token in the tokenset.
 * @param useMrrt Setting that the user can activate to use MRRT in their requests
 * @param authorizationParams Contains the audience and scope that the user requested to obtain a token
 * @param oldAudience Audience stored with the refresh_token wich we are going to use in the request
 * @param oldScope Scope stored with the refresh_token wich we are going to use in the request
 */
export const getScopeToRequest = (
  useMrrt: boolean | undefined,
  authorizationParams: { audience?: string, scope: string },
  oldAudience?: string,
  oldScope?: string
): string => {
  if (useMrrt && oldAudience && oldScope) {
    if (authorizationParams.audience !== oldAudience) {
      return authorizationParams.scope;
    }

    const oldScopes = oldScope.split(" ");
    const newScopes = authorizationParams.scope?.split(" ") || [];
    const newScopesAreIncluded = newScopes.every((scope) => oldScopes.includes(scope));

    return oldScopes.length >= newScopes.length && newScopesAreIncluded ? oldScope : authorizationParams.scope;
  }

  return authorizationParams.scope;
}

/**
 * @ignore
 * 
 * Checks if the refresh request has been done using MRRT
 * @param oldAudience Audience from the refresh token used to refresh
 * @param oldScope Scopes from the refresh token used to refresh
 * @param requestAudience Audience sent to the server
 * @param requestScope Scopes sent to the server
 */
export const isRefreshWithMrrt = (
  oldAudience: string | undefined,
  oldScope: string | undefined,
  requestAudience: string | undefined,
  requestScope: string,
): boolean => {
  if (oldAudience !== requestAudience) {
    return true;
  }

  return !allScopesAreIncluded(requestScope, oldScope);
}