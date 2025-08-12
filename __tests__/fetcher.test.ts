/**
 * We don't need the DOM for this specific test suite.
 *
 * @jest-environment node
 */

import { beforeEach, describe, expect } from '@jest/globals';
import { UseDpopNonceError } from '../src/errors';
import {
  Fetcher,
  ResponseHeaders,
  type FetcherConfig,
  type FetcherHooks,
  type FetchWithAuthCallbacks
} from '../src/fetcher';
import {
  TEST_ACCESS_TOKEN,
  TEST_DPOP_NONCE,
  TEST_DPOP_PROOF
} from './constants';

function newTestFetcher(
  config: FetcherConfig<Response>,
  hooks: Partial<FetcherHooks> = {}
): Fetcher<Response> {
  const notMocked = () => {
    throw new Error('Hook not mocked');
  };

  return new Fetcher(config, {
    isDpopEnabled: notMocked,
    getAccessToken: notMocked,
    getDpopNonce: notMocked,
    setDpopNonce: notMocked,
    generateDpopProof: notMocked,
    ...hooks
  });
}

describe('Fetcher', () => {
  describe('constructor', () => {
    const fetcher = newTestFetcher({});

    describe('not passing a fetch', () => {
      it('uses native fetch', () =>
        expect(fetcher['config']['fetch']).toBe(fetch));
    });

    describe('passing a custom fetch', () => {
      const customFetch = () => Promise.resolve(new Response());

      const fetcher = newTestFetcher({ fetch: customFetch });

      it('uses custom fetch', () =>
        expect(fetcher['config']['fetch']).toBe(customFetch));
    });
  });

  describe('isAbsoluteUrl()', () => {
    const fetcher = newTestFetcher({});

    const cases: [string, boolean][] = [
      ['http://example.com', true],
      ['https://example.com', true],
      ['//example.com', true],
      ['h//example.com', false],
      ['/example.com', false],
      ['example.com', false]
    ];

    describe.each(cases)('[%s]', (url, expected) => {
      it(`is ${expected ? '' : 'not '}absolute`, () =>
        expect(fetcher['isAbsoluteUrl'](url)).toBe(expected));
    });
  });

  describe('buildUrl()', () => {
    const fetcher = newTestFetcher({});

    describe('url is absolute', () => {
      const baseUrl = undefined;
      const url = 'https://example.com/v1/user';

      it('returns untouched url', () =>
        expect(fetcher['buildUrl'](baseUrl, url)).toBe(url));
    });

    describe('url is relative and baseUrl exists', () => {
      const baseUrl = 'https://example.com/v1/';
      const url = '/user';

      it('returns combined url', () =>
        expect(fetcher['buildUrl'](baseUrl, url)).toBe(
          'https://example.com/v1/user'
        ));
    });

    describe('otherwise', () => {
      const baseUrl = undefined;
      const url = '/user';

      it('throws an error', () =>
        expect(() => fetcher['buildUrl'](baseUrl, url)).toThrow(
          'must be absolute or'
        ));
    });
  });

  describe('getAccessToken()', () => {
    describe('getAccessToken missing from config', () => {
      const fetcher = newTestFetcher(
        { getAccessToken: undefined },
        { getAccessToken: jest.fn().mockResolvedValue(TEST_ACCESS_TOKEN) }
      );

      it('returns as expected', () =>
        expect(fetcher['getAccessToken']()).resolves.toBe(TEST_ACCESS_TOKEN));
    });

    describe('getAccessToken present in config', () => {
      const fetcher = newTestFetcher({
        getAccessToken: () => Promise.resolve(TEST_ACCESS_TOKEN)
      });

      it('returns as expected', () =>
        expect(fetcher['getAccessToken']()).resolves.toBe(TEST_ACCESS_TOKEN));
    });
  });

  describe('buildBaseRequest()', () => {
    describe('no baseUrl', () => {
      const info = new Request('https://example.com', {
        headers: { test: 'from info' }
      });

      const init = { headers: { test: 'from init' } };

      const fetcher = newTestFetcher({ baseUrl: undefined });

      it('init overrides info', () =>
        expect(
          fetcher['buildBaseRequest'](info, init).headers.get('test')
        ).toBe(init.headers['test']));

      it('url is unchanged', () =>
        expect(fetcher['buildBaseRequest'](info, init).url).toBe(info.url));
    });

    describe('otherwise', () => {
      const info = new Request('/something.html', {
        headers: { test: 'from info' }
      });

      const init = { headers: { test: 'from init' } };

      const fetcher = newTestFetcher({ baseUrl: 'https://base.example.com/' });

      it('init overrides info', () =>
        expect(
          fetcher['buildBaseRequest'](info, init).headers.get('test')
        ).toBe(init.headers['test']));

      it('urls are combined', () =>
        expect(fetcher['buildBaseRequest'](info, init).url).toBe(
          'https://base.example.com/something.html'
        ));
    });
  });

  describe('setAuthorizationHeader()', () => {
    describe('dpopNonceId is present', () => {
      const fetcher = newTestFetcher({ dpopNonceId: 'foo' });
      const request = new Request('https://example.com');

      beforeEach(() => {
        fetcher['setAuthorizationHeader'](request, TEST_ACCESS_TOKEN);
      });

      it('token is included as DPoP', () =>
        expect(request.headers.get('authorization')).toBe(
          `DPoP ${TEST_ACCESS_TOKEN}`
        ));
    });

    describe('otherwise', () => {
      const fetcher = newTestFetcher({ dpopNonceId: undefined });
      const request = new Request('https://example.com');

      beforeEach(() => {
        fetcher['setAuthorizationHeader'](request, TEST_ACCESS_TOKEN);
      });

      it('token is included as Bearer', () =>
        expect(request.headers.get('authorization')).toBe(
          `Bearer ${TEST_ACCESS_TOKEN}`
        ));
    });
  });

  describe('setDpopProofHeader()', () => {
    describe('dpopNonceId is present', () => {
      const fakeDpopNonce = TEST_DPOP_NONCE;
      const fakeDpopProof = TEST_DPOP_PROOF;

      const fetcher = newTestFetcher(
        { dpopNonceId: 'foo' },
        {
          getDpopNonce: () => Promise.resolve(fakeDpopNonce),
          generateDpopProof: jest.fn().mockResolvedValue(fakeDpopProof)
        }
      );

      const request = new Request('https://example.com', { method: 'PATCH' });

      beforeEach(() => {
        fetcher['setDpopProofHeader'](request, TEST_ACCESS_TOKEN);
      });

      it('proof is generated as expected', () =>
        expect(fetcher['hooks']['generateDpopProof']).toHaveBeenCalledWith({
          accessToken: TEST_ACCESS_TOKEN,
          method: request.method,
          nonce: fakeDpopNonce,
          url: request.url
        }));

      it('request has expected DPoP header', () =>
        expect(request.headers.get('dpop')).toBe(fakeDpopProof));
    });

    describe('otherwise', () => {
      const fetcher = newTestFetcher({ dpopNonceId: undefined });
      const request = new Request('https://example.com');

      beforeEach(() => {
        fetcher['setDpopProofHeader'](request, TEST_ACCESS_TOKEN);
      });

      it('request has no DPoP header', () =>
        expect(request.headers.get('dpop')).toBeNull());
    });
  });

  describe('prepareRequest()', () => {
    const fetcher = newTestFetcher({});
    const request = new Request('https://example.com');

    beforeEach(() => {
      fetcher['getAccessToken'] = () => Promise.resolve(TEST_ACCESS_TOKEN);
      fetcher['setAuthorizationHeader'] = jest.fn();
      fetcher['setDpopProofHeader'] = jest.fn();
    });

    beforeEach(() => fetcher['prepareRequest'](request));

    it('calls setAuthorizationHeader properly', () =>
      expect(fetcher['setAuthorizationHeader']).toHaveBeenCalledWith(
        request,
        TEST_ACCESS_TOKEN
      ));

    it('calls setDpopProofHeader properly', () =>
      expect(fetcher['setDpopProofHeader']).toHaveBeenCalledWith(
        request,
        TEST_ACCESS_TOKEN
      ));
  });

  describe('getHeader()', () => {
    const fetcher = newTestFetcher({});

    const headerName = 'test-header-name';
    const headerValue = 'test-header-value';

    const cases: [string, ResponseHeaders][] = [
      ['array headers', [[headerName, headerValue]]],
      ['plain headers', { [headerName]: headerValue }],
      [
        'getter headers',
        { get: (name: string) => (name === headerName ? headerValue : '') }
      ]
    ];

    describe.each(cases)('%s', (_caseName, headers) => {
      describe('present', () => {
        it('returns the value', () =>
          expect(fetcher['getHeader'](headers, headerName)).toBe(headerValue));
      });

      describe('missing', () => {
        it('returns the value', () =>
          expect(fetcher['getHeader'](headers, 'bad')).toBe(''));
      });
    });
  });

  describe('isUseDpopNonceError()', () => {
    const fetcher = newTestFetcher({});

    describe('status 401', () => {
      describe('no www-auth header', () => {
        const response = new Response('', { status: 401, headers: {} });

        it('returns false', () =>
          expect(fetcher['hasUseDpopNonceError'](response)).toBe(false));
      });

      describe('non-nonce www-auth header', () => {
        const response = new Response('', {
          status: 401,
          headers: { 'www-authenticate': 'DPoP algs="ES256"' }
        });

        it('returns false', () =>
          expect(fetcher['hasUseDpopNonceError'](response)).toBe(false));
      });

      describe('dpop nonce www-auth header', () => {
        const response = new Response('', {
          status: 401,
          headers: {
            'www-authenticate':
              'DPoP error="use_dpop_nonce" error_description="Pls send nonce"'
          }
        });

        it('returns true', () =>
          expect(fetcher['hasUseDpopNonceError'](response)).toBe(true));
      });
    });

    describe('otherwise', () => {
      const response = new Response('', {
        status: 400,
        headers: {
          'www-authenticate':
            'DPoP error="use_dpop_nonce" error_description="Pls send nonce"'
        }
      });

      it('returns false', () =>
        expect(fetcher['hasUseDpopNonceError'](response)).toBe(false));
    });
  });

  describe('handleResponse()', () => {
    describe('on execution', () => {
      describe('new dpop nonce found', () => {
        const fetcher = newTestFetcher({}, { setDpopNonce: jest.fn() });

        beforeEach(() => {
          fetcher['getHeader'] = () => TEST_DPOP_NONCE;
        });

        beforeEach(() => {
          fetcher['handleResponse'](new Response(), {});
        });

        it('saves the nonce', () =>
          expect(fetcher['hooks'].setDpopNonce).toHaveBeenCalledWith(
            TEST_DPOP_NONCE
          ));
      });
    });

    describe('on use_dpop_nonce error', () => {
      describe('new dpop nonce found', () => {
        describe('retry hook available', () => {
          const response = new Response();
          const fakeOutput = new Response();

          const fetcher = newTestFetcher(
            {},
            { setDpopNonce: () => Promise.resolve() }
          );

          const callbacks: FetchWithAuthCallbacks<Response> = {
            onUseDpopNonceError: () => Promise.resolve(fakeOutput)
          };

          beforeEach(() => {
            fetcher['getHeader'] = () => TEST_DPOP_NONCE;
            fetcher['hasUseDpopNonceError'] = () => true;
          });

          beforeEach(() => {});

          it('delegates to onUseDpopNonceError()', () =>
            expect(
              fetcher['handleResponse'](response, callbacks)
            ).resolves.toBe(fakeOutput));
        });

        describe('otherwise', () => {
          const response = new Response();

          const fetcher = newTestFetcher(
            {},
            { setDpopNonce: () => Promise.resolve() }
          );

          const callbacks: FetchWithAuthCallbacks<Response> = {
            onUseDpopNonceError: undefined
          };

          beforeEach(() => {
            fetcher['getHeader'] = () => TEST_DPOP_NONCE;
            fetcher['hasUseDpopNonceError'] = () => true;
          });

          it('throws UseDpopNonceError', () =>
            expect(() =>
              fetcher['handleResponse'](response, callbacks)
            ).rejects.toThrow(UseDpopNonceError));
        });
      });

      describe('no new dpop nonce', () => {
        const response = new Response();

        const fetcher = newTestFetcher({});

        const callbacks: FetchWithAuthCallbacks<Response> = {
          onUseDpopNonceError: () => {
            throw new Error('not to be used');
          }
        };

        beforeEach(() => {
          fetcher['getHeader'] = () => '';
          fetcher['hasUseDpopNonceError'] = () => true;
        });

        it('throws UseDpopNonceError', () =>
          expect(() =>
            fetcher['handleResponse'](response, callbacks)
          ).rejects.toThrow(UseDpopNonceError));
      });
    });

    describe('on non-dpop error', () => {
      const response = new Response();

      const fetcher = newTestFetcher(
        {},
        { setDpopNonce: () => Promise.resolve() }
      );

      beforeEach(() => {
        fetcher['getHeader'] = () => '';
        fetcher['hasUseDpopNonceError'] = () => false;
      });

      it('returns untouched response', () =>
        expect(fetcher['handleResponse'](response, {})).resolves.toBe(
          response
        ));
    });

    describe('internalFetchWithAuth()', () => {
      const fetcher = newTestFetcher({});

      const info = '';
      const init = {};
      const callbacks: FetchWithAuthCallbacks<Response> = {};

      const request = new Request('https://base.example.com');
      const fetchResponse = new Response('https://fetch.example.com');
      const handledResponse = new Response('https://handled.example.com');

      beforeEach(() => {
        fetcher['buildBaseRequest'] = () => request;
        fetcher['prepareRequest'] = jest.fn();
        fetcher['config']['fetch'] = jest.fn().mockResolvedValue(fetchResponse);

        fetcher['handleResponse'] = jest
          .fn()
          .mockResolvedValue(handledResponse);
      });

      let output: Response;

      beforeEach(async () => {
        output = await fetcher['internalFetchWithAuth'](info, init, callbacks);
      });

      it('request is prepared', () =>
        expect(fetcher['prepareRequest']).toHaveBeenCalledWith(request));

      it('calls fetch() properly', () =>
        expect(fetcher['config']['fetch']).toHaveBeenCalledWith(request));

      it('calls handleResponse() properly', () =>
        expect(fetcher['handleResponse']).toHaveBeenCalledWith(
          fetchResponse,
          callbacks
        ));

      it('delegates to handleResponse()', () =>
        expect(output).toBe(handledResponse));
    });
  });

  describe('fetchWithAuth()', () => {
    describe('on UseDpopNonce error', () => {
      const fetcher = newTestFetcher({});

      const info = 'https://example.com';
      const init = { method: 'PATCH' };

      fetcher['internalFetchWithAuth'] = jest
        .fn(fetcher['internalFetchWithAuth'])
        .mockImplementation((_info, _init, callbacks) =>
          callbacks && callbacks.onUseDpopNonceError
            ? callbacks.onUseDpopNonceError()
            : Promise.resolve(new Response())
        );

      beforeEach(() => fetcher.fetchWithAuth(info, init));

      it('retries exactly once', () =>
        expect(fetcher['internalFetchWithAuth']).toHaveBeenCalledTimes(2));
    });
  });
});
