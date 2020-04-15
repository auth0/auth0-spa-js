import 'core-js/es/string/starts-with';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

import Auth0Client from './Auth0Client';
import * as ClientStorage from './storage';
import { Auth0ClientOptions } from './global';
import { CACHE_LOCATION_MEMORY } from './constants';

import './global';

export * from './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
  const auth0 = new Auth0Client(options);

  if (
    auth0.cacheLocation === CACHE_LOCATION_MEMORY &&
    !ClientStorage.get('auth0.is.authenticated')
  ) {
    return auth0;
  }

  try {
    await auth0.getTokenSilently();
  } catch (error) {
    if (error.error !== 'login_required') {
      throw error;
    }
  }

  return auth0;
}

export { Auth0Client };
