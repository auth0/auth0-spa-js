import { verify } from '../../src/jwt';

// @ts-ignore

import { assertUrlEquals, setupFn } from './helpers';

import { TEST_CLIENT_ID, TEST_CODE_CHALLENGE, TEST_DOMAIN } from '../constants';

jest.mock('../../src/jwt');

const mockWindow = <any>global;
const mockVerify = <jest.Mock>verify;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });
  describe('buildAuthorizeUrl', () => {
    it('creates correct query params with empty options', async () => {
      const auth0 = setup();

      const url = await auth0.buildAuthorizeUrl();

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          client_id: TEST_CLIENT_ID
        },
        false
      );
    });
  });
});
