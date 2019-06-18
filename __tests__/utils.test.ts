import 'fast-text-encoding';
import {
  getUniqueScopes,
  parseQueryResult,
  createQueryParams,
  bufferToBase64UrlEncoded,
  createRandomString,
  encodeState,
  decodeState,
  sha256,
  openPopup,
  oauthToken,
  runPopup,
  runIframe,
  urlDecodeB64
} from '../src/utils';

(<any>global).TextEncoder = TextEncoder;

describe('utils', () => {
  describe('getUniqueScopes', () => {
    it('removes duplicates', () => {
      expect(getUniqueScopes('openid openid', 'email')).toBe('openid email');
    });
    it('handles whitespace', () => {
      expect(getUniqueScopes(' openid    profile  ', ' ')).toBe(
        'openid profile'
      );
    });
    it('handles undefined/empty/null', () => {
      expect(
        getUniqueScopes('openid profile', 'email', undefined, '', null)
      ).toBe('openid profile email');
    });
  });
  describe('parseQueryResult', () => {
    it('parses the query string', () => {
      expect(
        parseQueryResult('value=test&otherValue=another-test')
      ).toMatchObject({
        value: 'test',
        otherValue: 'another-test'
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
        createQueryParams({ id: 1, value: 'test', url: 'http://example.com' })
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
      expect(createRandomString()).toBe('15AFa');
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
  describe('encodeState', () => {
    it('encodes state', () => {
      expect(encodeState('test')).toBe('dGVzdA==');
    });
  });
  describe('decodeState', () => {
    it('decodes state', () => {
      expect(decodeState('dGVzdA==')).toBe('test');
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
  });
  describe('openPopup', () => {
    it('opens the popup', () => {
      window.open = <any>jest.fn(() => true);
      expect(openPopup()).toBe(true);
      expect(window.open).toHaveBeenCalledWith(
        '',
        'auth0:authorize:popup',
        'left=100,top=100,width=400,height=600,resizable,scrollbars=yes,status=1'
      );
    });
    it('throws error when the popup is blocked', () => {
      window.open = jest.fn(() => undefined);
      expect(openPopup).toThrowError('Could not open popup');
    });
  });
  describe('oauthToken', () => {
    it('calls oauth/token with the correct url', async () => {
      (<any>global).fetch = jest.fn(
        () =>
          new Promise(res =>
            res({ json: () => new Promise(ress => ress(true)) })
          )
      );
      await oauthToken({
        baseUrl: 'https://test.com',
        client_id: 'client_idIn',
        code: 'codeIn',
        code_verifier: 'code_verifierIn'
      });
      expect(fetch).toHaveBeenCalledWith('https://test.com/oauth/token', {
        body:
          '{"grant_type":"authorization_code","redirect_uri":"http://localhost","client_id":"client_idIn","code":"codeIn","code_verifier":"code_verifierIn"}',
        headers: { 'Content-type': 'application/json' },
        method: 'POST'
      });
    });
  });
  describe('runPopup', () => {
    const TIMEOUT_ERROR = { error: 'timeout', error_description: 'Timeout' };
    const setup = customMessage => {
      const popup = {
        location: { href: '' },
        close: jest.fn()
      };
      const url = 'https://authorize.com';
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
              jest.runAllTimers();
            }, 10);
            jest.useFakeTimers();
            await expect(runPopup(popup, url)).rejects.toMatchObject(
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
      await expect(runPopup(popup, url)).resolves.toMatchObject(
        message.data.response
      );
      expect(popup.location.href).toBe(url);
      expect(popup.close).toHaveBeenCalled();
    });
    it('returns authorization error message', async () => {
      const message = {
        data: {
          type: 'authorization_response',
          response: { error: 'error' }
        }
      };
      const { popup, url } = setup(message);
      await expect(runPopup(popup, url)).rejects.toMatchObject(
        message.data.response
      );
      expect(popup.location.href).toBe(url);
      expect(popup.close).toHaveBeenCalled();
    });
    it('times out after 60s', async () => {
      const { popup, url } = setup('');
      /**
       * We need to run the timers after we start `runPopup`, but we also
       * need to use `jest.useFakeTimers` to trigger the timeout.
       * That's why we're using a real `setTimeout`, then using fake timers
       * then rolling back to real timers
       */
      setTimeout(() => {
        jest.runTimersToTime(60 * 1000);
      }, 10);
      jest.useFakeTimers();
      await expect(runPopup(popup, url)).rejects.toMatchObject(TIMEOUT_ERROR);
      jest.useRealTimers();
    });
  });
  describe('runIframe', () => {
    const TIMEOUT_ERROR = { error: 'timeout', error_description: 'Timeout' };
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
      await runIframe(url, origin);

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
          /**
           * We need to run the timers after we start `runIframe` to simulate
           * the window event listener, but we also need to use `jest.useFakeTimers`
           * to trigger the timeout. That's why we're using a real `setTimeout`,
           * then using fake timers then rolling back to real timers
           */
          setTimeout(() => {
            jest.runAllTimers();
          }, 10);
          jest.useFakeTimers();
          await expect(runIframe(url, origin)).rejects.toMatchObject(
            TIMEOUT_ERROR
          );
          jest.useRealTimers();
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
      await expect(runIframe(url, origin)).resolves.toMatchObject(
        message.data.response
      );
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
          response: { error: 'error' }
        }
      };
      const { iframe, url } = setup(message);
      await expect(runIframe(url, origin)).rejects.toMatchObject(
        message.data.response
      );
      expect(message.source.close).toHaveBeenCalled();
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
    });
    it('times out after 60s', async () => {
      const { iframe, url, origin } = setup('');
      /**
       * We need to run the timers after we start `runIframe` to simulate
       * the window event listener, but we also need to use `jest.useFakeTimers`
       * to trigger the timeout. That's why we're using a real `setTimeout`,
       * then using fake timers then rolling back to real timers
       */
      setTimeout(() => {
        jest.runAllTimers();
      }, 10);
      jest.useFakeTimers();
      await expect(runIframe(url, origin)).rejects.toMatchObject(TIMEOUT_ERROR);
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      jest.useRealTimers();
    });
  });
});
