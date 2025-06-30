import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

import { setupFn, setupMessageEventLister } from './helpers';

import { TEST_CODE_CHALLENGE, TEST_STATE } from '../constants';

import { expect } from '@jest/globals';
import { CustomTokenExchangeOptions } from '../../src/TokenExchange';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

describe('Auth0Client - Token Exchange Bug Fix', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
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

  describe('HTTP Request Parameter Inclusion', () => {
    it('should include scope and audience in HTTP request body', async () => {
      const auth0 = setup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      setupMessageEventLister(mockWindow, { state: TEST_STATE });

      mockFetch.mockRejectedValueOnce(
        new Error('Mocked network error for testing')
      );

      const exchangeOptions: CustomTokenExchangeOptions = {
        subject_token: 'test-external-token',
        subject_token_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        audience: 'https://api.records.com',
        scope: 'read:records write:records'
      };

      try {
        await auth0.exchangeToken(exchangeOptions);
      } catch (error) {
        // Expected to fail due to mock
      }

      expect(mockFetch).toHaveBeenCalled();
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const [url, requestOptions] = lastCall;

      expect(url).toContain('/oauth/token');
      expect(requestOptions.body).toContain(
        'urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange'
      );

      const requestBody = new URLSearchParams(requestOptions.body);
      const actualParams = Object.fromEntries(requestBody.entries());

      // Critical assertions: These verify the bug fix
      expect(actualParams.audience).toBe('https://api.records.com');
      expect(actualParams.scope).toContain('read:records');
      expect(actualParams.scope).toContain('write:records');
      expect(actualParams.grant_type).toBe(
        'urn:ietf:params:oauth:grant-type:token-exchange'
      );
      expect(actualParams.subject_token).toBe('test-external-token');
      expect(actualParams.subject_token_type).toBe(
        'urn:ietf:params:oauth:grant-type:jwt-bearer'
      );
      expect(actualParams.client_id).toBe('test-client-id');
    });

    it('should include custom audience in HTTP request when provided', async () => {
      const auth0 = setup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      setupMessageEventLister(mockWindow, { state: TEST_STATE });
      mockFetch.mockRejectedValueOnce(new Error('Mocked network error'));

      const exchangeOptions: CustomTokenExchangeOptions = {
        subject_token: 'test-token',
        subject_token_type: 'urn:custom:token-type',
        audience: 'https://custom-api.com',
        scope: 'read:data'
      };

      try {
        await auth0.exchangeToken(exchangeOptions);
      } catch (error) {
        // Expected to fail
      }

      const requestBody = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      const actualParams = Object.fromEntries(requestBody.entries());

      expect(actualParams.audience).toBe('https://custom-api.com');
      expect(actualParams.scope).toContain('read:data');
    });

    it('should use default audience when none provided in options', async () => {
      const auth0 = setup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      setupMessageEventLister(mockWindow, { state: TEST_STATE });
      mockFetch.mockRejectedValueOnce(new Error('Mocked network error'));

      const exchangeOptions: CustomTokenExchangeOptions = {
        subject_token: 'test-token',
        subject_token_type: 'urn:custom:token-type',
        scope: 'read:data'
        // No audience provided
      };

      try {
        await auth0.exchangeToken(exchangeOptions);
      } catch (error) {
        // Expected to fail
      }

      const requestBody = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      const actualParams = Object.fromEntries(requestBody.entries());

      expect(actualParams.audience).toBe('https://default-api.com');
      expect(actualParams.scope).toContain('read:data');
    });

    it('should merge custom scope with default scope', async () => {
      const auth0 = setup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile'
        }
      });

      setupMessageEventLister(mockWindow, { state: TEST_STATE });
      mockFetch.mockRejectedValueOnce(new Error('Mocked network error'));

      const exchangeOptions: CustomTokenExchangeOptions = {
        subject_token: 'test-token',
        subject_token_type: 'urn:custom:token-type',
        audience: 'https://api.com',
        scope: 'read:data write:data'
      };

      try {
        await auth0.exchangeToken(exchangeOptions);
      } catch (error) {
        // Expected to fail
      }

      const requestBody = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      const actualParams = Object.fromEntries(requestBody.entries());

      // Should include both default and custom scopes
      expect(actualParams.scope).toContain('openid');
      expect(actualParams.scope).toContain('profile');
      expect(actualParams.scope).toContain('read:data');
      expect(actualParams.scope).toContain('write:data');
    });
  });
});
