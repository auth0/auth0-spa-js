import { expect } from '@jest/globals';
import { MessageChannel } from 'worker_threads';
import { verify } from '../../src/jwt';
import * as scope from '../../src/scope';
import * as utils from '../../src/utils';

import { loginWithPopupFn, loginWithRedirectFn, setupFn } from './helpers';

import { checkScopesInToken } from '../../src/Auth0Client.utils';
import { TEST_ACCESS_TOKEN, TEST_CODE_CHALLENGE } from '../constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');
jest.mock('../../src/Auth0Client.utils', () => {
    const originalModule = jest.requireActual('../../src/Auth0Client.utils');
    return {
        ...originalModule,
        checkScopesInToken: jest.fn()
    };
});
const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
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
        delete window.location;
        window.location = Object.defineProperties(
            {},
            {
                ...Object.getOwnPropertyDescriptors(oldWindowLocation),
                assign: {
                    configurable: true,
                    value: jest.fn()
                }
            }
        ) as Location;
        // --

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
        mockFetch.mockReset();
        jest.clearAllMocks();
        window.location = oldWindowLocation;
    });

    describe('requireAuth', () => {
        it('redirects to login if not authenticated', async () => {
            const auth0 = setup();

            jest.spyOn(auth0, 'isAuthenticated').mockResolvedValue(false);
            jest.spyOn(auth0, 'loginWithRedirect').mockResolvedValue(undefined);

            const result = await auth0.isAuthorized({
                audience: 'test-audience',
                scope: 'test-scope',
                redirectTo: '/test'
            });

            expect(auth0.isAuthenticated).toHaveBeenCalled();
            expect(auth0.loginWithRedirect).toHaveBeenCalledWith({
                authorizationParams: { audience: 'test-audience', scope: 'test-scope' },
                appState: { targetUrl: '/test' }
            });
            expect(result).toBe(false);
        });

        it('returns true if authenticated and token is valid', async () => {
            const auth0 = setup();

            jest.spyOn(auth0, 'isAuthenticated').mockResolvedValue(true);
            jest.spyOn(auth0, 'getTokenSilently').mockResolvedValue(TEST_ACCESS_TOKEN);
            jest.spyOn(auth0, 'loginWithRedirect').mockImplementation(() => Promise.resolve());
            const checkScopesInTokenMock = jest.spyOn(require('../../src/Auth0Client.utils'), 'checkScopesInToken');
            checkScopesInTokenMock.mockReturnValue(true);

            const result = await auth0.isAuthorized({ scope: 'test-scope' });

            expect(auth0.isAuthenticated).toHaveBeenCalled();
            expect(auth0.loginWithRedirect).not.toHaveBeenCalled();
            expect(auth0.getTokenSilently).toHaveBeenCalledWith({
                authorizationParams: { scope: 'test-scope' }
            });
            expect(checkScopesInTokenMock).toHaveBeenCalledWith(TEST_ACCESS_TOKEN, 'test-scope');
            expect(result).toBe(true);
        });

        it('returns false if token does not include required scopes', async () => {
            const auth0 = setup();

            jest.spyOn(auth0, 'isAuthenticated').mockResolvedValue(true);
            jest.spyOn(auth0, 'getTokenSilently').mockResolvedValue(TEST_ACCESS_TOKEN);
            (checkScopesInToken as jest.Mock).mockReturnValue(false);

            const result = await auth0.isAuthorized({ scope: 'missing-scope' });

            expect(auth0.getTokenSilently).toHaveBeenCalledWith({
                authorizationParams: { scope: 'missing-scope' }
            });
            expect(checkScopesInToken).toHaveBeenCalledWith(TEST_ACCESS_TOKEN, 'missing-scope');
            expect(result).toBe(false);
        });

        it('returns false if an error occurs during token retrieval', async () => {
            const auth0 = setup();

            jest.spyOn(auth0, 'isAuthenticated').mockResolvedValue(true);
            jest.spyOn(auth0, 'getTokenSilently').mockRejectedValue(new Error('Token error'));

            const result = await auth0.isAuthorized({ scope: 'test-scope' });

            expect(auth0.getTokenSilently).toHaveBeenCalledWith({
                authorizationParams: { scope: 'test-scope' }
            });
            expect(result).toBe(false);
        });
    })
});