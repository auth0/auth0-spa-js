import { ICache, InMemoryCache, LocalStorageCache } from './cache';
import {
  Auth0ClientOptions,
  AuthorizationParams,
  AuthorizeOptions,
  ClientAuthorizationParams,
  LogoutOptions
} from './global';
import { scopesToRequest } from './scope';
import { ONLINE_ACCESS_SCOPE } from './constants';

/**
 * @ignore
 */
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

/**
 * @ignore
 */
export const GET_TOKEN_FROM_IFRAME_LOCK_KEY = 'auth0.lock.getTokenFromIFrame';

/**
 * @ignore
 */
export const buildGetTokenSilentlyLockKey = (
  clientId: string,
  audience: string
) => `${GET_TOKEN_SILENTLY_LOCK_KEY}.${clientId}.${audience}`;

/**
 * @ignore
 * Builds a global lock key for iframe-based authentication flows.
 * This ensures only one iframe authorization request runs at a time per client,
 * preventing "Invalid state" errors from concurrent iframe requests overwriting
 * each other's state in the Auth0 session.
 */
export const buildIframeLockKey = (clientId: string) =>
  `${GET_TOKEN_FROM_IFRAME_LOCK_KEY}.${clientId}`;

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
    authorizationParams: ClientAuthorizationParams;
  },
  scope: Record<string, string>,
  authorizationParams: AuthorizationParams & { scope?: string },
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
    scope: scopesToRequest(scope, authorizationParams.scope, authorizationParams.audience),
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
 * Function used to trim the `online_access` scope from a list of scopes. 
 * This is used in the MRRT flow to avoid spurious missing scope errors, 
 * since `online_access` is never echoed back in the response.
 */
const withoutOnlineAccessScope = (scopes: string[]): string[] =>
  scopes.filter((scope) => scope !== ONLINE_ACCESS_SCOPE);

/**
 * @ignore
 *
 * Checks if all scopes are included inside other array of scopes
 */
export const allScopesAreIncluded = (scopeToInclude?: string, scopes?: string): boolean => {
  const scopeGroup = scopes?.split(" ") || [];
  const scopesToInclude = scopeToInclude?.split(" ") || [];
  return scopesToInclude.every((key) => scopeGroup.includes(key));
}

/**
 * @ignore
 *
 * Returns the scopes that are missing after a refresh.
 *
 * When `onlineAccess` is true, `online_access` is stripped from the requested scopes before
 * comparing: in online mode the server reuses the same (non-rotating) ORT for an MRRT
 * cross-audience exchange and never echoes `online_access` back in the response scope, so
 * comparing it would flag a spurious missing scope. Outside online mode the strip is not
 * applied, so a genuinely missing `online_access` is still reported.
 */
export const getMissingScopes = (
  requestedScope?: string,
  respondedScope?: string,
  onlineAccess?: boolean
): string => {
  const splitRequested = requestedScope?.split(" ") || [];
  const requestedScopes = onlineAccess
    ? withoutOnlineAccessScope(splitRequested)
    : splitRequested;
  const respondedScopes = respondedScope?.split(" ") || [];

  const missingScopes = requestedScopes.filter((scope) => respondedScopes.indexOf(scope) == -1);

  return missingScopes.join(",");
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
 * @param cachedAudience Audience stored with the refresh_token wich we are going to use in the request
 * @param cachedScope Scope stored with the refresh_token wich we are going to use in the request
 */
export const getScopeToRequest = (
  useMrrt: boolean | undefined,
  authorizationParams: { audience?: string, scope: string },
  cachedAudience?: string,
  cachedScope?: string
): string => {
  if (useMrrt && cachedAudience && cachedScope) {
    if (authorizationParams.audience !== cachedAudience) {
      return authorizationParams.scope;
    }

    const cachedScopes = cachedScope.split(" ");
    const newScopes = authorizationParams.scope?.split(" ") || [];
    const newScopesAreIncluded = newScopes.every((scope) => cachedScopes.includes(scope));

    return cachedScopes.length >= newScopes.length && newScopesAreIncluded ? cachedScope : authorizationParams.scope;
  }

  return authorizationParams.scope;
}

/**
 * @ignore
 * 
 * Checks if the refresh request has been done using MRRT
 * @param cachedAudience Audience from the refresh token used to refresh
 * @param cachedScope Scopes from the refresh token used to refresh
 * @param requestAudience Audience sent to the server
 * @param requestScope Scopes sent to the server
 */
export const isRefreshWithMrrt = (
  cachedAudience: string | undefined,
  cachedScope: string | undefined,
  requestAudience: string | undefined,
  requestScope: string,
): boolean => {
  if (cachedAudience !== requestAudience) {
    return true;
  }

  return !allScopesAreIncluded(requestScope, cachedScope);
}