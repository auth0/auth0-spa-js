import 'fast-text-encoding';

import {
  parseQueryResult,
  createQueryParams,
  bufferToBase64UrlEncoded,
  createRandomString,
  encode,
  decode,
  sha256,
  runPopup,
  runIframe,
  urlDecodeB64,
  getCrypto,
  getCryptoSubtle,
  validateCrypto
} from '../src/utils';

import { DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS } from '../src/constants';

(<any>global).TextEncoder = TextEncoder;

afterEach(() => {
  jest.resetAllMocks();
});

describe('utils', () => {
  describe('parseQueryResult', () => {
    it('parses the query string', () => {
      expect(
        parseQueryResult('value=test&otherValue=another-test')
      ).toMatchObject({
        value: 'test',
        otherValue: 'another-test'
      });
    });
    it('strips off hash values', () => {
      expect(
        parseQueryResult('code=some-code&state=some-state#__')
      ).toMatchObject({
        code: 'some-code',
        state: 'some-state'
      });
    });
    it('converts `expires_in` to int', () => {
      expect(parseQueryResult('value=test&expires_in=10')).toMatchObject({
        value: 'test',
        expires_in: 10
      });
    });
  });
  describe('createQueryParams', () => {
    it('creates query string from object', () => {
      expect(
        createQueryParams({
          id: 1,
          value: 'test',
          url: 'http://example.com',
          nope: undefined
        })
      ).toBe('id=1&value=test&url=http%3A%2F%2Fexample.com');
    });
  });
  describe('urlDecodeB64', () => {
    let oldATOB;
    beforeEach(() => {
      oldATOB = (<any>global).atob;
      (<any>global).atob = jest.fn(s => s);
    });
    afterEach(() => {
      (<any>global).atob = oldATOB;
    });
    it('decodes string correctly', () => {
      expect(urlDecodeB64('abc@123-_')).toBe('abc@123+/');
      expect(atob).toHaveBeenCalledWith('abc@123+/');
    });
    it('decodes string with utf-8 chars', () => {
      // restore atob to the default atob
      (<any>global).atob = oldATOB;

      // first we use encodeURIComponent to get percent-encoded UTF-8,
      // then we convert the percent encodings into raw bytes which
      // can be fed into btoa.
      // https://stackoverflow.com/questions/30106476/
      const b64EncodeUnicode = str =>
        btoa(
          encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(<any>('0x' + p1))
          )
        );
      const input = 'Błżicz@123!!';
      const encoded = b64EncodeUnicode(input);
      const output = urlDecodeB64(encoded);
      expect(output).toBe(input);
    });
  });
  describe('bufferToBase64UrlEncoded', () => {
    let oldBTOA;
    beforeEach(() => {
      oldBTOA = (<any>global).btoa;
      (<any>global).btoa = jest.fn(s => s);
    });
    afterEach(() => {
      (<any>global).btoa = oldBTOA;
    });
    it('decodes input in a safe way for urls', () => {
      const input = 'abc@123+/=';
      expect(bufferToBase64UrlEncoded(new TextEncoder().encode(input))).toBe(
        'abc@123-_'
      );
      expect(btoa).toHaveBeenCalledWith(input);
    });
  });
  describe('createRandomString', () => {
    it('creates random string based on crypto.getRandomValues', () => {
      (<any>global).crypto = {
        getRandomValues: () => [1, 5, 10, 15, 100]
      };
      expect(createRandomString()).toBe('15AFY');
    });
    it('creates random string with a length between 43 and 128', () => {
      (<any>global).crypto = {
        getRandomValues: (a: Uint8Array) => Array(a.length).fill(0)
      };
      const result = createRandomString();
      expect(result.length).toBeGreaterThanOrEqual(43);
      expect(result.length).toBeLessThanOrEqual(128);
    });
  });
  describe('encode', () => {
    it('encodes state', () => {
      expect(encode('test')).toBe('dGVzdA==');
    });
  });
  describe('decode', () => {
    it('decodes state', () => {
      expect(decode('dGVzdA==')).toBe('test');
    });
  });

  describe('sha256', () => {
    it('generates a digest of the given data', async () => {
      (<any>global).crypto = {
        subtle: {
          digest: jest.fn((alg, encoded) => {
            expect(alg).toMatchObject({ name: 'SHA-256' });
            expect(Array.from(encoded)).toMatchObject([116, 101, 115, 116]);
            return new Promise(res => res(true));
          })
        }
      };
      const result = await sha256('test');
      expect(result).toBe(true);
    });
    it('handles ie11 digest.result scenario', () => {
      (<any>global).msCrypto = {};

      const digestResult = {
        oncomplete: null
      };

      (<any>global).crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          })
        }
      };

      const sha = sha256('test').then(r => {
        expect(r).toBe(true);
      });

      digestResult.oncomplete({ target: { result: true } });

      return sha;
    });
    it('handles ie11 digest.result error scenario', () => {
      (<any>global).msCrypto = {};

      const digestResult = {
        onerror: null
      };

      (<any>global).crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          })
        }
      };

      const sha = sha256('test').catch(e => {
        expect(e).toBe('An error occurred');
      });

      digestResult.onerror({ error: 'An error occurred' });

      return sha;
    });

    it('handles ie11 digest.result abort scenario', () => {
      (<any>global).msCrypto = {};

      const digestResult = {
        onabort: null
      };

      (<any>global).crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          })
        }
      };

      const sha = sha256('test').catch(e => {
        expect(e).toBe('The digest operation was aborted');
      });

      digestResult.onabort();

      return sha;
    });
  });
  describe('bufferToBase64UrlEncoded ', () => {
    it('generates correct base64 encoded value from a buffer', async () => {
      const result = bufferToBase64UrlEncoded([116, 101, 115, 116]);
      expect(result).toBe('dGVzdA');
    });
  });

  describe('runPopup', () => {
    const TIMEOUT_ERROR = {
      error: 'timeout',
      error_description: 'Timeout',
      message: 'Timeout'
    };

    const POPUP_CANCEL_ERROR = {
      error: 'cancelled',
      error_description: 'Popup closed'
    };

    const url = 'https://authorize.com';

    const setup = customMessage => {
      const popup = {
        location: { href: url },
        close: jest.fn(),
        closed: false
      };

      window.addEventListener = <any>jest.fn((message, callback) => {
        expect(message).toBe('message');
        callback(customMessage);
      });

      return { popup, url };
    };

    describe('with invalid messages', () => {
      ['', {}, { data: 'test' }, { data: { type: 'other-type' } }].forEach(
        m => {
          it(`ignores invalid messages: ${JSON.stringify(m)}`, async () => {
            const { popup, url } = setup(m);
            /**
             * We need to run the timers after we start `runPopup` to simulate
             * the window event listener, but we also need to use `jest.useFakeTimers`
             * to trigger the timeout. That's why we're using a real `setTimeout`,
             * then using fake timers then rolling back to real timers
             */
            setTimeout(() => {
              // Since RunPopup function uses setInterval, we have a recursive timer,
              // In order to prevent an enless loop we need to use runOnlyPendingTimers.
              jest.runOnlyPendingTimers();
            }, 10);
            jest.useFakeTimers();
            await expect(runPopup({ popup })).rejects.toMatchObject(
              TIMEOUT_ERROR
            );
            jest.useRealTimers();
          });
        }
      );
    });

    it('returns authorization response message', async () => {
      const message = {
        data: {
          type: 'authorization_response',
          response: { id_token: 'id_token' }
        }
      };

      const { popup, url } = setup(message);

      await expect(runPopup({ popup })).resolves.toMatchObject(
        message.data.response
      );

      expect(popup.location.href).toBe(url);
      expect(popup.close).toHaveBeenCalled();
    });

    it('returns authorization error message', async () => {
      const message = {
        data: {
          type: 'authorization_response',
          response: {
            error: 'error',
            error_description: 'error_description'
          }
        }
      };

      const { popup, url } = setup(message);

      await expect(runPopup({ popup })).rejects.toMatchObject({
        ...message.data.response,
        message: 'error_description'
      });

      expect(popup.location.href).toBe(url);
      expect(popup.close).toHaveBeenCalled();
    });

    it('times out after config.timeoutInSeconds', async () => {
      const { popup, url } = setup('');
      const seconds = 10;

      /**
       * We need to run the timers after we start `runPopup`, but we also
       * need to use `jest.useFakeTimers` to trigger the timeout.
       * That's why we're using a real `setTimeout`, then using fake timers
       * then rolling back to real timers
       */
      setTimeout(() => {
        jest.runOnlyPendingTimers();
        jest.advanceTimersByTime(seconds * 1000);
      }, 10);

      jest.useFakeTimers();

      await expect(
        runPopup({
          timeoutInSeconds: seconds,
          popup
        })
      ).rejects.toMatchObject({ ...TIMEOUT_ERROR, popup });

      jest.useRealTimers();
    });
    it('times out after DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS if config is not defined', async () => {
      const { popup, url } = setup('');

      /**
       * We need to run the timers after we start `runPopup`, but we also
       * need to use `jest.useFakeTimers` to trigger the timeout.
       * That's why we're using a real `setTimeout`, then using fake timers
       * then rolling back to real timers
       */
      setTimeout(() => {
        jest.runOnlyPendingTimers();
        jest.advanceTimersByTime(DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS * 1000);
      }, 10);

      jest.useFakeTimers();

      await expect(runPopup({ popup })).rejects.toMatchObject(TIMEOUT_ERROR);

      jest.useRealTimers();
    });

    it('rejects with PopupCancelledError if popup is closed early', async () => {
      const { popup, url } = setup('');
      popup.closed = true;

      /**
       * We need to run the timers after we start `runPopup`, but we also
       * need to use `jest.useFakeTimers` to trigger the timeout.
       * That's why we're using a real `setTimeout`, then using fake timers
       * then rolling back to real timers
       */
      setTimeout(() => {
        jest.runOnlyPendingTimers();
        jest.advanceTimersByTime(DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS * 1000);
      }, 10);

      jest.useFakeTimers();

      await expect(runPopup({ popup })).rejects.toMatchObject(
        POPUP_CANCEL_ERROR
      );

      jest.useRealTimers();
    });
  });
  describe('runIframe', () => {
    const TIMEOUT_ERROR = {
      error: 'timeout',
      error_description: 'Timeout',
      message: 'Timeout'
    };
    const setup = customMessage => {
      const iframe = {
        setAttribute: jest.fn(),
        style: { display: '' }
      };
      const url = 'https://authorize.com';
      const origin =
        (customMessage && customMessage.origin) || 'https://origin.com';
      window.addEventListener = <any>jest.fn((message, callback) => {
        expect(message).toBe('message');
        callback(customMessage);
      });
      window.removeEventListener = jest.fn();
      window.document.createElement = <any>jest.fn(type => {
        expect(type).toBe('iframe');
        return iframe;
      });
      window.document.body.contains = () => true;
      window.document.body.appendChild = jest.fn();
      window.document.body.removeChild = jest.fn();
      return { iframe, url, origin };
    };
    it('handles iframe correctly', async () => {
      const origin = 'https://origin.com';
      const message = {
        origin,
        source: { close: jest.fn() },
        data: {
          type: 'authorization_response',
          response: { id_token: 'id_token' }
        }
      };
      const { iframe, url } = setup(message);
      jest.useFakeTimers();
      await runIframe(url, origin);
      jest.runOnlyPendingTimers();
      expect(message.source.close).toHaveBeenCalled();
      expect(window.document.body.appendChild).toHaveBeenCalledWith(iframe);
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      expect(iframe.setAttribute.mock.calls).toMatchObject([
        ['width', '0'],
        ['height', '0'],
        ['src', url]
      ]);
      expect(iframe.style.display).toBe('none');
    });
    describe('with invalid messages', () => {
      [
        '',
        {},
        { origin: 'other-origin' },
        { data: 'test' },
        { data: { type: 'other-type' } }
      ].forEach(m => {
        it(`ignores invalid messages: ${JSON.stringify(m)}`, async () => {
          const { iframe, url, origin } = setup(m);
          jest.useFakeTimers();
          const promise = runIframe(url, origin);
          jest.runOnlyPendingTimers();
          await expect(promise).rejects.toMatchObject(TIMEOUT_ERROR);
          expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
        });
      });
    });
    it('returns authorization response message', async () => {
      const origin = 'https://origin.com';
      const message = {
        origin,
        source: { close: jest.fn() },
        data: {
          type: 'authorization_response',
          response: { id_token: 'id_token' }
        }
      };
      const { iframe, url } = setup(message);
      jest.useFakeTimers();
      await expect(runIframe(url, origin)).resolves.toMatchObject(
        message.data.response
      );
      jest.runOnlyPendingTimers();
      expect(message.source.close).toHaveBeenCalled();
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
    });
    it('returns authorization error message', async () => {
      const origin = 'https://origin.com';
      const message = {
        origin,
        source: { close: jest.fn() },
        data: {
          type: 'authorization_response',
          response: {
            error: 'error',
            error_description: 'error_description'
          }
        }
      };
      const { iframe, url } = setup(message);
      jest.useFakeTimers();
      await expect(runIframe(url, origin)).rejects.toMatchObject({
        ...message.data.response,
        message: 'error_description'
      });
      jest.runOnlyPendingTimers();
      expect(message.source.close).toHaveBeenCalled();
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      expect(window.removeEventListener).toBeCalled();
    });
    it('times out after timeoutInSeconds', async () => {
      const { iframe, url, origin } = setup('');
      const seconds = 10;
      jest.useFakeTimers();
      const promise = runIframe(url, origin, seconds);
      jest.runTimersToTime(seconds * 1000);
      await expect(promise).rejects.toMatchObject(TIMEOUT_ERROR);
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
    });
    it('removes the message event listener in the event of a timeout', async () => {
      const { url, origin } = setup('');
      const seconds = 10;
      jest.useFakeTimers();
      const promise = runIframe(url, origin, seconds);
      jest.runTimersToTime(seconds * 1000);
      await expect(promise).rejects.toMatchObject(TIMEOUT_ERROR);
      expect(window.removeEventListener).toBeCalled();
    });
  });
  describe('getCrypto', () => {
    it('should use msCrypto when window.crypto is unavailable', () => {
      (<any>global).crypto = undefined;
      (<any>global).msCrypto = 'ms';

      const theCrypto = getCrypto();
      expect(theCrypto).toBe('ms');
    });
    it('should use window.crypto when available', () => {
      (<any>global).crypto = 'window';
      (<any>global).msCrypto = 'ms';

      const theCrypto = getCrypto();
      expect(theCrypto).toBe('window');
    });
  });
  describe('getCryptoSubtle', () => {
    it('should use crypto.webkitSubtle when available', () => {
      (<any>global).crypto = { subtle: undefined, webkitSubtle: 'webkit' };

      const theSubtle = getCryptoSubtle();
      expect(theSubtle).toBe('webkit');
    });
    it('should use crypto.subtle when available', () => {
      (<any>global).crypto = { subtle: 'window', webkitSubtle: 'webkit' };

      const theSubtle = getCryptoSubtle();
      expect(theSubtle).toBe('window');
    });
    it('should use msCrypto.subtle when available', () => {
      (<any>global).crypto = undefined;
      (<any>global).msCrypto = { subtle: 'ms' };

      const cryptoSubtle = getCryptoSubtle();
      expect(cryptoSubtle).toBe('ms');
    });
  });
  describe('validateCrypto', () => {
    it('should throw error if crypto is unavailable', () => {
      (<any>global).crypto = undefined;
      (<any>global).msCrypto = undefined;

      expect(validateCrypto).toThrowError(
        'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
      );
    });
    it('should throw error if crypto.subtle is undefined', () => {
      (<any>global).crypto = {};

      expect(validateCrypto).toThrowError(`
      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.
    `);
    });
  });
});
