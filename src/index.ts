import 'fast-text-encoding';
import Auth0Client from './Auth0Client';
import * as ClientStorage from './storage';

//this is necessary to export the type definitions used in this file
import './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
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
