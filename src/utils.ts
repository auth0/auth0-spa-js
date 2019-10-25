import fetch from 'unfetch';

import { DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS } from './constants';

const dedupe = arr => arr.filter((x, i) => arr.indexOf(x) === i);

const TIMEOUT_ERROR = { error: 'timeout', error_description: 'Timeout' };
export const getUniqueScopes = (...scopes: string[]) => {
  const scopeString = scopes.filter(Boolean).join();
  return dedupe(scopeString.replace(/\s/g, ',').split(','))
    .join(' ')
    .trim();
};

export const parseQueryResult = (queryString: string) => {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substr(0, queryString.indexOf('#'));
  }

  let queryParams = queryString.split('&');

  let parsedQuery: any = {};
  queryParams.forEach(qp => {
    let [key, val] = qp.split('=');
    parsedQuery[key] = decodeURIComponent(val);
  });

  return <AuthenticationResult>{
    ...parsedQuery,
    expires_in: parseInt(parsedQuery.expires_in)
  };
};

export const runIframe = (authorizeUrl: string, eventOrigin: string) => {
  return new Promise<AuthenticationResult>((res, rej) => {
    var iframe = window.document.createElement('iframe');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';

    const timeoutSetTimeoutId = setTimeout(() => {
      rej(TIMEOUT_ERROR);
      window.document.body.removeChild(iframe);
    }, 60 * 1000);

    const iframeEventHandler = function(e: MessageEvent) {
      if (e.origin != eventOrigin) return;
      if (!e.data || e.data.type !== 'authorization_response') return;
      (<any>e.source).close();
      e.data.response.error ? rej(e.data.response) : res(e.data.response);
      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', iframeEventHandler, false);
      window.document.body.removeChild(iframe);
    };
    window.addEventListener('message', iframeEventHandler, false);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizeUrl);
  });
};

export const openPopup = () => {
  const popup = window.open(
    '',
    'auth0:authorize:popup',
    'left=100,top=100,width=400,height=600,resizable,scrollbars=yes,status=1'
  );
  if (!popup) {
    throw new Error('Could not open popup');
  }
  return popup;
};

export const runPopup = (
  popup: any,
  authorizeUrl: string,
  config: PopupConfigOptions
) => {
  popup.location.href = authorizeUrl;
  return new Promise<AuthenticationResult>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({ ...TIMEOUT_ERROR, popup });
    }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000);
    window.addEventListener('message', e => {
      if (!e.data || e.data.type !== 'authorization_response') {
        return;
      }
      clearTimeout(timeoutId);
      popup.close();
      if (e.data.response.error) {
        return reject(e.data.response);
      }
      resolve(e.data.response);
    });
  });
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

export const encodeState = (state: string) => btoa(state);
export const decodeState = (state: string) => atob(state);

export const createQueryParams = (params: any) => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};

export const sha256 = async (s: string) => {
  const digestOp = getCryptoSubtle().digest(
    { name: 'SHA-256' },
    new TextEncoder().encode(s)
  );

  // msCrypto (IE11) uses the old spec, which is not Promise based
  // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
  // Instead of returning a promise, it returns a CryptoOperation
  // with a result property in it.
  // As a result, the various events need to be handled in the event that we're
  // working in IE11 (hence the msCrypto check). These events just call resolve
  // or reject depending on their intention.
  if ((<any>window).msCrypto) {
    return new Promise((res, rej) => {
      digestOp.oncomplete = e => {
        res(e.target.result);
      };

      digestOp.onerror = (e: ErrorEvent) => {
        rej(e.error);
      };

      digestOp.onabort = () => {
        rej('The digest operation was aborted');
      };
    });
  }

  return await digestOp;
};

const urlEncodeB64 = (input: string) => {
  const b64Chars = { '+': '-', '/': '_', '=': '' };
  return input.replace(/[\+\/=]/g, (m: string) => b64Chars[m]);
};

// https://stackoverflow.com/questions/30106476/
const decodeB64 = input =>
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

export const bufferToBase64UrlEncoded = input => {
  const ie11SafeInput = new Uint8Array(input);
  return urlEncodeB64(
    window.btoa(String.fromCharCode(...Array.from(ie11SafeInput)))
  );
};

const getJSON = async (url, options) => {
  const response = await fetch(url, options);
  const { error, error_description, ...success } = await response.json();
  if (!response.ok) {
    const errorMessage =
      error_description || `HTTP error. Unable to fetch ${url}`;
    const e = <any>new Error(errorMessage);
    e.error = error || 'request_error';
    e.error_description = errorMessage;
    throw e;
  }
  return success;
};

export const oauthToken = async ({ baseUrl, ...options }: OAuthTokenOptions) =>
  await getJSON(`${baseUrl}/oauth/token`, {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      redirect_uri: window.location.origin,
      ...options
    }),
    headers: {
      'Content-type': 'application/json'
    }
  });

export const getCrypto = () => {
  //ie 11.x uses msCrypto
  return <Crypto>(window.crypto || (<any>window).msCrypto);
};

export const getCryptoSubtle = () => {
  const crypto = getCrypto();
  //safari 10.x uses webkitSubtle
  return crypto.subtle || (<any>crypto).webkitSubtle;
};

export const validateCrypto = () => {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
    );
  }
  if (typeof getCryptoSubtle() === 'undefined') {
    throw new Error(`
      auth0-spa-js must run on a secure origin.
      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin 
      for more information.
    `);
  }
};
