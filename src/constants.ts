import { PopupConfigOptions } from './global';
import version from './version';

/**
 * @ignore
 */
export const DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;

/**
 * @ignore
 */
export const DEFAULT_POPUP_CONFIG_OPTIONS: PopupConfigOptions = {
  timeoutInSeconds: DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
};

/**
 * @ignore
 */
export const DEFAULT_SILENT_TOKEN_RETRY_COUNT = 3;

/**
 * @ignore
 */
export const CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = 2;

/**
 * @ignore
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 10000;

export const CACHE_LOCATION_MEMORY = 'memory';
export const CACHE_LOCATION_LOCAL_STORAGE = 'localstorage';

/**
 * @ignore
 */
export const MISSING_REFRESH_TOKEN_ERROR_MESSAGE = 'Missing Refresh Token';

/**
 * @ignore
 */
export const INVALID_REFRESH_TOKEN_ERROR_MESSAGE = 'invalid refresh token';

/**
 * @ignore
 */
export const DEFAULT_SCOPE = 'openid profile email';

/**
 * @ignore
 */
export const DEFAULT_SESSION_CHECK_EXPIRY_DAYS = 1;

/**
 * @ignore
 */
export const DEFAULT_AUTH0_CLIENT = {
  name: 'auth0-spa-js',
  version: version
};

export const DEFAULT_NOW_PROVIDER = () => Date.now();
