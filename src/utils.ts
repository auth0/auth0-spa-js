import { AuthenticationResult, PopupConfigOptions } from './global';

import {
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
  CLEANUP_IFRAME_TIMEOUT_IN_SECONDS
} from './constants';

import {
  PopupTimeoutError,
  TimeoutError,
  GenericError,
  PopupCancelledError
} from './errors';

export const parseAuthenticationResult = (
  queryString: string
): AuthenticationResult => {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substring(0, queryString.indexOf('#'));
  }

  const searchParams = new URLSearchParams(queryString);

  return {
    state: searchParams.get('state')!,
    code: searchParams.get('code') || undefined,
    connect_code: searchParams.get('connect_code') || undefined,
    error: searchParams.get('error') || undefined,
    error_description: searchParams.get('error_description') || undefined
  };
};

export const runIframe = (
  authorizeUrl: string,
  eventOrigin: string,
  timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
) => {
  return new Promise<AuthenticationResult>((res, rej) => {
    const iframe = window.document.createElement('iframe');

    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';

    const removeIframe = () => {
      if (window.document.body.contains(iframe)) {
        window.document.body.removeChild(iframe);
        window.removeEventListener('message', iframeEventHandler, false);
      }
    };

    let iframeEventHandler: (e: MessageEvent) => void;

    const timeoutSetTimeoutId = setTimeout(() => {
      rej(new TimeoutError());
      removeIframe();
    }, timeoutInSeconds * 1000);

    iframeEventHandler = function (e: MessageEvent) {
      if (e.origin != eventOrigin) return;
      if (!e.data || e.data.type !== 'authorization_response') return;

      const eventSource = e.source;

      if (eventSource) {
        (eventSource as any).close();
      }

      e.data.response.error
        ? rej(GenericError.fromPayload(e.data.response))
        : res(e.data.response);

      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', iframeEventHandler, false);

      // Delay the removal of the iframe to prevent hanging loading status
      // in Chrome: https://github.com/auth0/auth0-spa-js/issues/240
      setTimeout(removeIframe, CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000);
    };

    window.addEventListener('message', iframeEventHandler, false);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizeUrl);
  });
};

export const openPopup = (url: string) => {
  const width = 400;
  const height = 600;
  const left = window.screenX + (window.innerWidth - width) / 2;
  const top = window.screenY + (window.innerHeight - height) / 2;

  return window.open(
    url,
    'auth0:authorize:popup',
    `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
  );
};

export const runPopup = (config: PopupConfigOptions) => {
  return new Promise<AuthenticationResult>((resolve, reject) => {
    let popupEventListener: (e: MessageEvent) => void;

    // Check each second if the popup is closed triggering a PopupCancelledError
    const popupTimer = setInterval(() => {
      if (config.popup && config.popup.closed) {
        clearInterval(popupTimer);
        clearTimeout(timeoutId);
        window.removeEventListener('message', popupEventListener, false);
        reject(new PopupCancelledError(config.popup));
      }
    }, 1000);

    const timeoutId = setTimeout(() => {
      clearInterval(popupTimer);
      reject(new PopupTimeoutError(config.popup));
      window.removeEventListener('message', popupEventListener, false);
    }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000);

    popupEventListener = function (e: MessageEvent) {
      if (!e.data || e.data.type !== 'authorization_response') {
        return;
      }

      clearTimeout(timeoutId);
      clearInterval(popupTimer);
      window.removeEventListener('message', popupEventListener, false);
      config.popup.close();

      if (e.data.response.error) {
        return reject(GenericError.fromPayload(e.data.response));
      }

      resolve(e.data.response);
    };

    window.addEventListener('message', popupEventListener);
  });
};

export const getCrypto = () => {
  return window.crypto;
};

export const createRandomString = () => {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach(v => (random += charset[v % charset.length]));
  return random;
};

export const encode = (value: string) => btoa(value);
export const decode = (value: string) => atob(value);

const stripUndefined = (params: any) => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
};

const ALLOWED_AUTH0CLIENT_PROPERTIES = [
  {
    key: 'name',
    type: ['string']
  },
  {
    key: 'version',
    type: ['string', 'number']
  },
  {
    key: 'env',
    type: ['object']
  }
];

/**
 * Strips any property that is not present in ALLOWED_AUTH0CLIENT_PROPERTIES
 * @param auth0Client - The full auth0Client object
 * @returns The stripped auth0Client object
 */
export const stripAuth0Client = (auth0Client: any) => {
  return Object.keys(auth0Client).reduce((acc: any, key: string) => {
    const allowedProperty = ALLOWED_AUTH0CLIENT_PROPERTIES.find(
      p => p.key === key
    );
    if (
      allowedProperty &&
      allowedProperty.type.includes(typeof auth0Client[key])
    ) {
      acc[key] = auth0Client[key];
    }

    return acc;
  }, {});
};

export const createQueryParams = ({ clientId: client_id, ...params }: any) => {
  return new URLSearchParams(
    stripUndefined({ client_id, ...params })
  ).toString();
};

export const sha256 = async (s: string) => {
  const digestOp: any = getCrypto().subtle.digest(
    { name: 'SHA-256' },
    new TextEncoder().encode(s)
  );

  return await digestOp;
};

const urlEncodeB64 = (input: string) => {
  const b64Chars: { [index: string]: string } = { '+': '-', '/': '_', '=': '' };
  return input.replace(/[+/=]/g, (m: string) => b64Chars[m]);
};

// https://stackoverflow.com/questions/30106476/
const decodeB64 = (input: string) =>
  decodeURIComponent(
    atob(input)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

export const urlDecodeB64 = (input: string) =>
  decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));

export const bufferToBase64UrlEncoded = (input: number[] | Uint8Array) => {
  const ie11SafeInput = new Uint8Array(input);
  return urlEncodeB64(
    window.btoa(String.fromCharCode(...Array.from(ie11SafeInput)))
  );
};

export const validateCrypto = () => {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
    );
  }
  if (typeof getCrypto().subtle === 'undefined') {
    throw new Error(`
      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/main/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.
    `);
  }
};

/**
 * @ignore
 */
export const getDomain = (domainUrl: string) => {
  if (!/^https?:\/\//.test(domainUrl)) {
    return `https://${domainUrl}`;
  }

  return domainUrl;
};

/**
 * @ignore
 */
export const getTokenIssuer = (
  issuer: string | undefined,
  domainUrl: string
) => {
  if (issuer) {
    return issuer.startsWith('https://') ? issuer : `https://${issuer}/`;
  }

  return `${domainUrl}/`;
};

export const parseNumber = (value: any): number | undefined => {
  if (typeof value !== 'string') {
    return value;
  }
  return parseInt(value, 10) || undefined;
};

/**
 * Ponyfill for `Object.fromEntries()`, which is not available until ES2020.
 *
 * When the target of this project reaches ES2020, this can be removed.
 */
export const fromEntries = <T = any>(
  iterable: Iterable<[PropertyKey, T]>
): Record<PropertyKey, T> => {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;

    return obj;
  }, {} as Record<PropertyKey, T>);
};
