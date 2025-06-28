import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';

// @ts-ignore

import { fetchResponse, setupFn, setupMessageEventLister } from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CODE_CHALLENGE,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  TEST_STATE
} from '../constants';

import { Auth0ClientOptions } from '../../src';
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

describe('Auth0Client', () => {
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

  describe('exchangeToken()', () => {
    const localSetup = async (clientOptions?: Partial<Auth0ClientOptions>) => {
      const auth0 = setup(clientOptions);

      setupMessageEventLister(mockWindow, { state: TEST_STATE });

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      auth0['_requestToken'] = async function (requestOptions: any) {
        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      return auth0;
    };

    // This test verifies that scope and audience parameters are included in actual HTTP requests
    // It was created to catch the api.ts destructuring bug that dropped these parameters
    describe('HTTP Request Bug Detection Tests', () => {
      it('should include scope and audience in HTTP request body - DETECTS api.ts bug', async () => {
        // Simple test setup without complex mocking
        const auth0 = setup({
          clientId: 'test-client-id',
          domain: 'test.auth0.com',
          authorizationParams: {
            audience: 'https://default-api.com',
            scope: 'openid profile'
          }
        });

        setupMessageEventLister(mockWindow, { state: TEST_STATE });

        // Mock fetch to capture and reject (we only care about the request, not response)
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

        // Verify fetch was called with the token exchange request
        expect(mockFetch).toHaveBeenCalled();

        // Get the last fetch call (should be our token exchange)
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const [url, requestOptions] = lastCall;

        // Verify this is a token exchange request
        expect(url).toContain('/oauth/token');
        expect(requestOptions.body).toContain(
          'urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange'
        );

        // Parse the request body
        const requestBody = new URLSearchParams(requestOptions.body);
        const actualParams = Object.fromEntries(requestBody.entries());

        // **CRITICAL ASSERTIONS**: These will FAIL if the api.ts bug exists
        // The bug caused audience and scope to be dropped from the HTTP request
        expect(actualParams.audience).toBe('https://api.records.com');
        expect(actualParams.scope).toContain('read:records');
        expect(actualParams.scope).toContain('write:records');

        // Verify other expected parameters are present
        expect(actualParams.grant_type).toBe(
          'urn:ietf:params:oauth:grant-type:token-exchange'
        );
        expect(actualParams.subject_token).toBe('test-external-token');
        expect(actualParams.subject_token_type).toBe(
          'urn:ietf:params:oauth:grant-type:jwt-bearer'
        );
        expect(actualParams.client_id).toBe('test-client-id');
      });
    });

    // Original unit tests (kept for backward compatibility)
    // ... existing code ...

    it('calls `exchangeToken` with the correct default options', async () => {
      const auth0 = await localSetup();
      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token', // valid token type (not reserved)
        scope: 'openid profile email',
        audience: 'https://api.test.com'
      };
      const result = await auth0.exchangeToken(cteOptions);
      console.log(result);
      expect(result.id_token).toEqual('fake_id_token');
      expect(result.access_token).toEqual('fake_access_token');
      expect(result.expires_in).toEqual(3600);
      expect(typeof result.scope).toBe('string');
    });

    it('passes the correct scope and audience parameters to _requestToken', async () => {
      const auth0 = await localSetup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com', // client default audience
          scope: 'openid profile' // client default scope
        }
      });

      // Mock _requestToken to capture the parameters
      let capturedRequestOptions: any;
      auth0['_requestToken'] = async function (requestOptions: any) {
        capturedRequestOptions = requestOptions;
        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token',
        scope: 'openid profile email read:records', // custom scope for token exchange
        audience: 'https://api.custom.com' // custom audience for token exchange
      };

      await auth0.exchangeToken(cteOptions);

      // Verify the parameters passed to _requestToken
      expect(capturedRequestOptions).toEqual({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token',
        scope: 'openid profile email read:records', // Should use the custom scope
        audience: 'https://api.custom.com' // Should use the custom audience, NOT the client default
      });
    });

    it('handles undefined scope correctly', async () => {
      const auth0 = await localSetup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com',
          scope: 'openid profile' // client default scope
        }
      });

      let capturedRequestOptions: any;
      auth0['_requestToken'] = async function (requestOptions: any) {
        capturedRequestOptions = requestOptions;
        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token',
        audience: 'https://api.custom.com'
        // scope is undefined - should use client default
      };

      await auth0.exchangeToken(cteOptions);

      // When scope is undefined, should fallback to client default scope
      expect(capturedRequestOptions.scope).toEqual('openid profile');
      expect(capturedRequestOptions.audience).toEqual('https://api.custom.com');
    });

    it('handles undefined audience correctly by falling back to client default', async () => {
      const auth0 = await localSetup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://default-api.com', // client default audience
          scope: 'openid profile' // client default scope
        }
      });

      let capturedRequestOptions: any;
      auth0['_requestToken'] = async function (requestOptions: any) {
        capturedRequestOptions = requestOptions;
        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token',
        scope: 'openid profile email read:records'
        // audience is undefined - should use client default
      };

      await auth0.exchangeToken(cteOptions);

      // When audience is undefined, should fallback to client default audience
      expect(capturedRequestOptions.scope).toEqual(
        'openid profile email read:records'
      );
      expect(capturedRequestOptions.audience).toEqual(
        'https://default-api.com'
      );
    });

    it('demonstrates how wrong audience causes scope-related issues', async () => {
      const auth0 = await localSetup({
        clientId: 'test-client-id',
        domain: 'test.auth0.com',
        authorizationParams: {
          audience: 'https://basic-api.com', // API that only supports basic scopes
          scope: 'openid profile'
        }
      });

      // Simulate Auth0's behavior: wrong audience = scope restrictions
      let capturedRequestOptions: any;
      auth0['_requestToken'] = async function (requestOptions: any) {
        capturedRequestOptions = requestOptions;

        // Simulate what happens in Auth0 when audience/scope mismatch:
        if (
          requestOptions.audience === 'https://basic-api.com' &&
          requestOptions.scope.includes('read:sensitive')
        ) {
          // Auth0 would return an error like this:
          throw new Error(
            'invalid_scope: Scope "read:sensitive" is not authorized for audience "https://basic-api.com"'
          );
        }

        return {
          decodedToken: {
            encoded: {
              header: 'fake_header',
              payload: 'fake_payload',
              signature: 'fake_signature'
            },
            header: {},
            claims: { __raw: 'fake_raw' },
            user: {}
          },
          id_token: 'fake_id_token',
          access_token: 'fake_access_token',
          expires_in: 3600,
          scope: requestOptions.scope
        };
      };

      const cteOptions: CustomTokenExchangeOptions = {
        subject_token: 'external_token_value',
        subject_token_type: 'urn:acme:legacy-system-token',
        audience: 'https://sensitive-api.com', // This is what user WANTS
        scope: 'openid profile read:sensitive' // Scope valid for sensitive-api
      };

      // Before the fix: audience would be wrong (https://basic-api.com)
      // This would cause scope error because basic-api doesn't support read:sensitive

      await auth0.exchangeToken(cteOptions);

      // After the fix: correct audience is used, avoiding scope errors
      expect(capturedRequestOptions.audience).toEqual(
        'https://sensitive-api.com'
      );
      expect(capturedRequestOptions.scope).toEqual(
        'openid profile read:sensitive'
      );
    });
  });
});
