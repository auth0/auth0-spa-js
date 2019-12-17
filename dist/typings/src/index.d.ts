import 'core-js/es/string/starts-with';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import Auth0Client from './Auth0Client';
import './global';
export default function createAuth0Client(
  options: Auth0ClientOptions
): Promise<Auth0Client>;
