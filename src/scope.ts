import { DEFAULT_AUDIENCE } from "./constants";

/**
 * @ignore
 */
const dedupe = (arr: string[]) => Array.from(new Set(arr));

/**
 * @ignore
 */
/**
 * Returns a string of unique scopes by removing duplicates and unnecessary whitespace.
 *
 * @param {...(string | undefined)[]} scopes - A list of scope strings or undefined values.
 * @returns {string} A string containing unique scopes separated by a single space.
 */
export const getUniqueScopes = (...scopes: (string | undefined)[]) => {
  return dedupe(scopes.filter(Boolean).join(' ').trim().split(/\s+/)).join(' ');
};

/**
 * @ignore
 */
/**
 * We will check if the developer has created the client with a string or object of audience:scopes. We will inject
 * the base scopes to each audience, and store the base ones inside default key. As well, if the developer created the Auth0Client
 * with a string of scopes, we will store the requested ones with the base scopes inside the default key as well.
 * @param authScopes The scopes requested by the user when creating the Auth0Client
 * @param openIdScope openId scope
 * @param extraScopes Other scopes to accumulate such as offline_access
 * @returns {Record<string, string>} An object with all scopes that are going to be accumulated.
 */
export const injectDefaultScopes = (authScopes: string | Record<string, string> | undefined, openIdScope: string, ...extraScopes: string[]): Record<string, string> => {
  if (typeof authScopes !== 'object') {
    return { [DEFAULT_AUDIENCE]: getUniqueScopes(openIdScope, authScopes, ...extraScopes) };
  }

  let requestedScopes: Record<string, string> = {
    [DEFAULT_AUDIENCE]: getUniqueScopes(openIdScope, ...extraScopes),
  };

  Object.keys(authScopes).forEach((key) => {
    const audienceScopes = authScopes[key];

    requestedScopes[key] = getUniqueScopes(openIdScope, audienceScopes, ...extraScopes);
  });

  return requestedScopes;
}

/**
 * @ignore
 */
/**
 * Will return a string of scopes. If a specific audience was requested and it exist inside the scopes object, we will return those
 * related to that audience that we want to accumulate. If not, we will return the ones stored inside the default key.
 * @param authScopes Object of audience:scopes that are going to be accumulated
 * @param methodScopes The scopes requested for the developer in a specific request
 * @param audience The audience the developer requested for an specific request or the one they configured in the Auth0Client
 * @returns {string} A combination of Auth0Client scopes and the ones requested by the developer for a specific request
 */
export const scopesToRequest = (authScopes: Record<string, string>, methodScopes: string | undefined, audience: string | undefined): string => {
  let scope: string | undefined;

  if (audience) {
    scope = authScopes[audience];
  }

  if (!scope) {
    scope = authScopes[DEFAULT_AUDIENCE];
  }

  return getUniqueScopes(scope, methodScopes);
}