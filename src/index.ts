import 'core-js/es/string/starts-with';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';

import Auth0Client from './Auth0Client';
import * as ClientStorage from './storage';

//this is necessary to export the type definitions used in this file
import './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
  if (!window.crypto && (<any>window).msCrypto) {
    (<any>window).crypto = (<any>window).msCrypto;
  }
  if (!window.crypto) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
    );
  }
  if (typeof window.crypto.subtle === 'undefined') {
    throw new Error(`
      auth0-spa-js must run on a secure origin.
      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-error-invalid-state-in-firefox-when-refreshing-the-page-immediately-after-a-login 
      for more information.
    `);
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
