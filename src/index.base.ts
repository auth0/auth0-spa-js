import Auth0Client from './Auth0Client';
import { Auth0ClientOptions } from './global';

import './global';

export * from './global';

export default async function createAuth0Client(options: Auth0ClientOptions) {
  const auth0 = new Auth0Client(options);
  await auth0.checkSession();
  return auth0;
}

export { Auth0Client };

export {
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError,
  MfaRequiredError
} from './errors';

export { ICache, LocalStorageCache, InMemoryCache, Cacheable } from './cache';
