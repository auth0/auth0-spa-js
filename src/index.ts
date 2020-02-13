import 'core-js/es/string/starts-with';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

// @ts-ignore
import Auth0Client from './Auth0Client';
import * as ClientStorage from './storage';
import { Auth0ClientOptions } from './global';
import './global';

import { validateCrypto, getUniqueScopes } from './utils';

export * from './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
  validateCrypto();

  if (options.useRefreshTokens) {
    options.scope = getUniqueScopes(options.scope, 'offline_access');
  }

  const auth0 = new Auth0Client(options);

  if (!ClientStorage.get('auth0.is.authenticated')) {
    return auth0;
  }

  try {
    await auth0.getTokenSilently({
      audience: options.audience,
      scope: options.scope,
      ignoreCache: true
    });
  } catch (error) {
    // ignore
  }

  return auth0;
}

export type Auth0Client = Auth0Client;
