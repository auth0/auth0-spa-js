import { PopupConfigOptions } from './global';

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
export const MISSING_REFRESH_TOKEN_ERROR_MESSAGE =
  'The web worker is missing the refresh token';
