import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import { expect } from '@jest/globals';
import { Auth0Client } from '../../src/Auth0Client';
import { createAuth0Client } from '../../src/index';
import { TEST_CLIENT_ID, TEST_DOMAIN } from '../constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockVerify = <jest.Mock>verify;

describe('Auth0Client', () => {
    const oldWindowLocation = window.location;

    beforeEach(() => {
        delete (window as any).location;
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

        mockWindow.open = jest.fn();
        mockWindow.addEventListener = jest.fn();
        mockWindow.crypto = {
            subtle: {
                digest: () => 'foo'
            },
            getRandomValues: () => '123'
        };
        mockWindow.MessageChannel = MessageChannel;
        mockWindow.Worker = {};
        jest.spyOn(String.prototype, 'charCodeAt');

        mockVerify.mockReturnValue({
            user: {
                sub: 'me'
            },
            claims: {
                sub: 'me',
                aud: TEST_CLIENT_ID
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        window.location = oldWindowLocation;
    });

    describe('getConfiguration', () => {
        it('returns an object with domain and clientId', () => {
            const auth0 = new Auth0Client({
                domain: TEST_DOMAIN,
                clientId: TEST_CLIENT_ID
            });

            const config = auth0.getConfiguration();

            expect(config).toEqual({
                domain: TEST_DOMAIN,
                clientId: TEST_CLIENT_ID
            });
        });

        it('returns a frozen object', () => {
            const auth0 = new Auth0Client({
                domain: TEST_DOMAIN,
                clientId: TEST_CLIENT_ID
            });

            const config = auth0.getConfiguration();

            expect(Object.isFrozen(config)).toBe(true);
        });

        it('does not allow modification of returned object', () => {
            const auth0 = new Auth0Client({
                domain: TEST_DOMAIN,
                clientId: TEST_CLIENT_ID
            });

            const config = auth0.getConfiguration();

            expect(() => {
                (config as any).domain = 'modified.com';
            }).toThrow();
        });


        it('returns new object instance on each call', () => {
            const auth0 = new Auth0Client({
                domain: TEST_DOMAIN,
                clientId: TEST_CLIENT_ID
            });

            const config1 = auth0.getConfiguration();
            const config2 = auth0.getConfiguration();

            expect(config1).toEqual(config2);
            expect(config1).not.toBe(config2);
        });

        it('works with createAuth0Client factory function', async () => {
            const customDomain = 'factory.auth0.com';
            const customClientId = 'factory-client-id';

            mockWindow.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            });

            const auth0 = await createAuth0Client({
                domain: customDomain,
                clientId: customClientId
            });

            const config = auth0.getConfiguration();

            expect(config).toEqual({
                domain: customDomain,
                clientId: customClientId
            });
            expect(Object.isFrozen(config)).toBe(true);
        });
    });
});
