import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

import { setupFn } from './helpers';

import {
  TEST_CODE_CHALLENGE,
  TEST_DOMAIN,
  TEST_STATE
} from '../constants';

jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

describe('Auth0Client', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
    delete (window as any).location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        },
        replace: {
          configurable: true,
          value: jest.fn()
        },
        search: {
          configurable: true,
          writable: true,
          value: ''
        }
      }
    ) as Location;

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    jest.spyOn(scope, 'getUniqueScopes');
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('Native to Web SSO - Session Transfer Token', () => {
    describe('enableSessionTransfer option', () => {
      it('should automatically include session_transfer_token from URL when enableSessionTransfer is true (default)', async () => {
        // Set session_transfer_token in URL
        (window.location as any).search = '?session_transfer_token=test-stt-token-123';

        const auth0 = setup();

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        // Verify session_transfer_token is included in authorize URL
        expect(url.searchParams.get('session_transfer_token')).toBe('test-stt-token-123');
      });

      it('should automatically include session_transfer_token when enableSessionTransfer is explicitly true', async () => {
        (window.location as any).search = '?session_transfer_token=explicit-true-token';

        const auth0 = setup({
          enableSessionTransfer: true
        });

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        expect(url.searchParams.get('session_transfer_token')).toBe('explicit-true-token');
      });

      it('should NOT include session_transfer_token when enableSessionTransfer is false', async () => {
        (window.location as any).search = '?session_transfer_token=should-not-appear';

        const auth0 = setup({
          enableSessionTransfer: false
        });

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        // session_transfer_token should NOT be in the URL
        expect(url.searchParams.get('session_transfer_token')).toBeNull();
      });

      it('should NOT override manually provided session_transfer_token in authorizationParams', async () => {
        (window.location as any).search = '?session_transfer_token=url-token';

        const auth0 = setup();

        await auth0.loginWithRedirect({
          authorizationParams: {
            session_transfer_token: 'manual-token'
          }
        });

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        // Manual token should take precedence
        expect(url.searchParams.get('session_transfer_token')).toBe('manual-token');
      });

      it('should not include session_transfer_token when not present in URL', async () => {
        (window.location as any).search = '';

        const auth0 = setup();

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        expect(url.searchParams.get('session_transfer_token')).toBeNull();
      });

      it('should handle URL with other query params alongside session_transfer_token', async () => {
        (window.location as any).search = '?foo=bar&session_transfer_token=mixed-params-token&baz=qux';

        const auth0 = setup();

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        expect(url.searchParams.get('session_transfer_token')).toBe('mixed-params-token');
      });

      it('should handle URL-encoded session_transfer_token', async () => {
        const encodedToken = encodeURIComponent('token+with/special=chars');
        (window.location as any).search = `?session_transfer_token=${encodedToken}`;

        const auth0 = setup();

        await auth0.loginWithRedirect();

        const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

        expect(url.searchParams.get('session_transfer_token')).toBe('token+with/special=chars');
      });

      it('should clear session_transfer_token from URL after extraction in loginWithRedirect', async () => {
        const mockReplaceState = jest.fn();
        window.history.replaceState = mockReplaceState;

        // Recreate window.location with href property
        delete (window as any).location;
        window.location = Object.defineProperties(
          {},
          {
            ...Object.getOwnPropertyDescriptors(oldWindowLocation),
            href: {
              configurable: true,
              writable: true,
              value: 'https://example.com?session_transfer_token=test-token&other=param'
            },
            search: {
              configurable: true,
              writable: true,
              value: '?session_transfer_token=test-token&other=param'
            },
            assign: {
              configurable: true,
              value: jest.fn()
            }
          }
        ) as Location;

        const auth0 = setup();

        await auth0.loginWithRedirect();

        // Verify token was extracted and included in authorize URL
        const authorizeUrl = new URL(mockWindow.location.assign.mock.calls[0][0]);
        expect(authorizeUrl.searchParams.get('session_transfer_token')).toBe('test-token');

        // Verify URL was cleaned (replaceState was called)
        expect(mockReplaceState).toHaveBeenCalledTimes(1);
        const cleanedUrl = mockReplaceState.mock.calls[0][2];
        expect(cleanedUrl).toBe('https://example.com/?other=param');
      });

      it('should NOT clear session_transfer_token from URL when manually provided in authorizationParams', async () => {
        const mockReplaceState = jest.fn();
        window.history.replaceState = mockReplaceState;

        delete (window as any).location;
        window.location = Object.defineProperties(
          {},
          {
            ...Object.getOwnPropertyDescriptors(oldWindowLocation),
            href: {
              configurable: true,
              writable: true,
              value: 'https://example.com?session_transfer_token=url-token'
            },
            search: {
              configurable: true,
              writable: true,
              value: '?session_transfer_token=url-token'
            },
            assign: {
              configurable: true,
              value: jest.fn()
            }
          }
        ) as Location;

        const auth0 = setup();

        await auth0.loginWithRedirect({
          authorizationParams: {
            session_transfer_token: 'manual-token'
          }
        });

        // Manual token should be used, not the one from URL
        const authorizeUrl = new URL(mockWindow.location.assign.mock.calls[0][0]);
        expect(authorizeUrl.searchParams.get('session_transfer_token')).toBe('manual-token');

        // URL should NOT be cleaned since token wasn't extracted from URL
        expect(mockReplaceState).not.toHaveBeenCalled();
      });

      it('should NOT clear URL when enableSessionTransfer is false', async () => {
        const mockReplaceState = jest.fn();
        window.history.replaceState = mockReplaceState;

        delete (window as any).location;
        window.location = Object.defineProperties(
          {},
          {
            ...Object.getOwnPropertyDescriptors(oldWindowLocation),
            href: {
              configurable: true,
              writable: true,
              value: 'https://example.com?session_transfer_token=test-token'
            },
            search: {
              configurable: true,
              writable: true,
              value: '?session_transfer_token=test-token'
            },
            assign: {
              configurable: true,
              value: jest.fn()
            }
          }
        ) as Location;

        const auth0 = setup({
          enableSessionTransfer: false
        });

        await auth0.loginWithRedirect();

        // Token should not be included
        const authorizeUrl = new URL(mockWindow.location.assign.mock.calls[0][0]);
        expect(authorizeUrl.searchParams.get('session_transfer_token')).toBeNull();

        // URL should NOT be cleaned
        expect(mockReplaceState).not.toHaveBeenCalled();
      });
    });

    describe('loginWithPopup with session transfer', () => {
      it('should include session_transfer_token in popup flow when present in URL', async () => {
        (window.location as any).search = '?session_transfer_token=popup-stt-token';

        const auth0 = setup();

        // Mock popup response
        mockWindow.addEventListener.mockImplementationOnce((type: string, cb: Function) => {
          if (type === 'message') {
            setTimeout(() => {
              cb({
                data: {
                  type: 'authorization_response',
                  response: {
                    state: TEST_STATE,
                    code: 'test-code'
                  }
                }
              });
            }, 0);
          }
        });

        mockWindow.open.mockReturnValue({
          close: () => {},
          location: { href: '' }
        });

        try {
          await auth0.loginWithPopup();
        } catch {
          // Expected to fail due to incomplete mock setup
        }

        // Verify session_transfer_token was included in the popup authorize URL
        const popupUrl = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;
        const url = new URL(popupUrl);
        expect(url.searchParams.get('session_transfer_token')).toBe('popup-stt-token');
      });

      it('should clear session_transfer_token from URL after extraction in loginWithPopup', async () => {
        const mockReplaceState = jest.fn();
        window.history.replaceState = mockReplaceState;

        delete (window as any).location;
        window.location = Object.defineProperties(
          {},
          {
            ...Object.getOwnPropertyDescriptors(oldWindowLocation),
            href: {
              configurable: true,
              writable: true,
              value: 'https://example.com?session_transfer_token=popup-token&foo=bar'
            },
            search: {
              configurable: true,
              writable: true,
              value: '?session_transfer_token=popup-token&foo=bar'
            },
            assign: {
              configurable: true,
              value: jest.fn()
            },
            origin: {
              configurable: true,
              writable: true,
              value: 'https://example.com'
            }
          }
        ) as Location;

        const auth0 = setup();

        mockWindow.addEventListener.mockImplementationOnce((type: string, cb: Function) => {
          if (type === 'message') {
            setTimeout(() => {
              cb({
                data: {
                  type: 'authorization_response',
                  response: {
                    state: TEST_STATE,
                    code: 'test-code'
                  }
                }
              });
            }, 0);
          }
        });

        mockWindow.open.mockReturnValue({
          close: () => {},
          location: { href: '' }
        });

        try {
          await auth0.loginWithPopup();
        } catch {
          // Expected to fail due to incomplete mock setup
        }

        // Verify token was extracted and included in authorize URL
        const popupUrl = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;
        const url = new URL(popupUrl);
        expect(url.searchParams.get('session_transfer_token')).toBe('popup-token');

        // Verify URL was cleaned (replaceState was called)
        expect(mockReplaceState).toHaveBeenCalledTimes(1);
        const cleanedUrl = mockReplaceState.mock.calls[0][2];
        expect(cleanedUrl).toBe('https://example.com/?foo=bar');
      });
    });
  });
});
