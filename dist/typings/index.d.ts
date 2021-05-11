import 'core-js/es/string/starts-with';
import 'core-js/es/symbol';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'core-js/es/set';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';
import Auth0Client from './Auth0Client';
import { Auth0ClientOptions } from './global';
import './global';
export * from './global';
export default function createAuth0Client(
  options: Auth0ClientOptions
): Promise<Auth0Client>;
export { Auth0Client };
export {
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError
} from './errors';
