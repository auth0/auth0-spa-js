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

import createAuth0Client from './index.base';

export * from './index.base';
export default createAuth0Client;
