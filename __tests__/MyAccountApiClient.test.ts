import {
  MyAccountApiClient,
  MyAccountApiError
} from '../src/myaccount';
import { Fetcher } from '../src/fetcher';

const mockFetcher = {
  fetchWithAuth: jest.fn()
} as unknown as Fetcher<Response>;

const apiBase = 'https://api.example.com/';
const api = new MyAccountApiClient(mockFetcher, apiBase);

describe('MyAccountApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connectAccount returns response on success', async () => {
    const mockResponse = {
      ok: true,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({
          connect_uri: 'uri',
          auth_session: 'session',
          connect_params: { ticket: 'ticket' },
          expires_in: 3600
        }))
    };
    mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue(mockResponse);

    const params = {
      connection: 'google-oauth2',
      redirect_uri: 'https://redirect'
    };
    const result = await api.connectAccount(params);

    expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
      `${apiBase}v1/connected-accounts/connect`,
      expect.objectContaining({ method: 'POST' }),
      { scope: ['create:me:connected_accounts'] }
    );
    expect(result.connect_uri).toBe('uri');
  });

  it('completeAccount returns response on success', async () => {
    const mockResponse = {
      ok: true,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({
          id: '123',
          connection: 'google-oauth2',
          access_type: 'offline',
          created_at: '2024-01-01T00:00:00Z'
        }))
    };
    mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue(mockResponse);

    const params = {
      auth_session: 'session',
      connect_code: 'code',
      redirect_uri: 'https://redirect'
    };
    const result = await api.completeAccount(params);

    expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
      `${apiBase}v1/connected-accounts/complete`,
      expect.objectContaining({ method: 'POST' }),
      { scope: ['create:me:connected_accounts'] }
    );
    expect(result.id).toBe('123');
  });

  it('throws MyAccountApiError on API error response with validation errors', async () => {
    const errorBody = {
      type: 'error',
      status: 400,
      title: 'Bad Request',
      detail: 'Invalid input',
      validation_errors: [
        { detail: 'Connection is invalid', field: 'connection' },
        { detail: 'Redirect URI is missing', field: 'redirect_uri' }
      ]
    };
    const mockResponse = {
      ok: false,
      text: jest.fn().mockResolvedValue(JSON.stringify(errorBody))
    };
    mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue(mockResponse);

    await expect(
      api.connectAccount({ connection: 'bad', redirect_uri: 'uri' })
    ).rejects.toThrow(MyAccountApiError);

    try {
      await api.connectAccount({ connection: 'bad', redirect_uri: 'uri' });
    } catch (err) {
      expect(err).toBeInstanceOf(MyAccountApiError);
      expect(err.validation_errors).toEqual(errorBody.validation_errors);
    }
  });

  it('throws MyAccountApiError on invalid JSON', async () => {
    const mockResponse = {
      ok: false,
      text: jest.fn().mockResolvedValue('Not JSON')
    };
    mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue(mockResponse);

    await expect(
      api.connectAccount({ connection: 'bad', redirect_uri: 'uri' })
    ).rejects.toThrow(MyAccountApiError);
  });

  it('throws MyAccountApiError on empty response', async () => {
    const mockResponse = {
      ok: false,
      text: jest.fn().mockResolvedValue('')
    };
    mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue(mockResponse);

    await expect(
      api.connectAccount({ connection: 'bad', redirect_uri: 'uri' })
    ).rejects.toThrow('SyntaxError: Unexpected end of JSON input');
  });

  describe('getFactors', () => {
    it('returns list of factors on success', async () => {
      const factors = [
        { type: 'totp', usage: ['secondary'] },
        { type: 'phone', usage: ['secondary'] }
      ];
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ factors }))
      });

      const result = await api.getFactors();

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/factors`,
        { method: 'GET' },
        { scope: ['read:me:factors'] }
      );
      expect(result).toEqual(factors);
    });

    it('throws MyAccountApiError on failure', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          type: 'error', status: 403, title: 'Forbidden', detail: 'Insufficient scope'
        }))
      });

      await expect(api.getFactors()).rejects.toThrow(MyAccountApiError);
    });
  });

  describe('getAuthenticationMethods', () => {
    it('returns list of authentication methods on success', async () => {
      const methods = [
        { id: 'am_1', type: 'passkey', confirmed: true, created_at: '2024-01-01T00:00:00Z' }
      ];
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ authentication_methods: methods }))
      });

      const result = await api.getAuthenticationMethods();

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods`,
        { method: 'GET' },
        { scope: ['read:me:authentication_methods'] }
      );
      expect(result).toEqual(methods);
    });

    it('filters by type when provided', async () => {
      const methods = [
        { id: 'am_1', type: 'passkey', confirmed: true, created_at: '2024-01-01T00:00:00Z' }
      ];
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ authentication_methods: methods }))
      });

      const result = await api.getAuthenticationMethods('passkey');

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods?type=passkey`,
        { method: 'GET' },
        { scope: ['read:me:authentication_methods'] }
      );
      expect(result).toEqual(methods);
    });
  });

  describe('getAuthenticationMethod', () => {
    it('returns a single authentication method by id', async () => {
      const method = { id: 'am_1', type: 'passkey', confirmed: true, created_at: '2024-01-01T00:00:00Z' };
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(method))
      });

      const result = await api.getAuthenticationMethod('am_1');

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods/am_1`,
        { method: 'GET' },
        { scope: ['read:me:authentication_methods'] }
      );
      expect(result.id).toBe('am_1');
    });
  });

  describe('deleteAuthenticationMethod', () => {
    it('calls DELETE on the correct endpoint', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({ ok: true });

      await api.deleteAuthenticationMethod('am_1');

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods/am_1`,
        { method: 'DELETE' },
        { scope: ['delete:me:authentication_methods'] }
      );
    });

    it('throws MyAccountApiError on failure', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          type: 'error', status: 404, title: 'Not Found', detail: 'Method not found'
        }))
      });

      await expect(api.deleteAuthenticationMethod('am_missing')).rejects.toThrow(MyAccountApiError);
    });

    it('URL-encodes special characters in the id', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({ ok: true });

      await api.deleteAuthenticationMethod('passkey|abc123');

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods/passkey%7Cabc123`,
        { method: 'DELETE' },
        { scope: ['delete:me:authentication_methods'] }
      );
    });
  });

  describe('updateAuthenticationMethod', () => {
    it('calls PATCH with correct body and returns updated method', async () => {
      const updated = { id: 'am_1', type: 'totp', confirmed: true, created_at: '2024-01-01T00:00:00Z', usage: ['primary'], name: 'My Key' };
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(updated))
      });

      const result = await api.updateAuthenticationMethod('am_1', { name: 'My Key' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods/am_1`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My Key' })
        },
        { scope: ['update:me:authentication_methods'] }
      );
      expect(result).toMatchObject({ name: 'My Key' });
    });

    it('sends preferred_authentication_method for phone type', async () => {
      const updated = { id: 'am_2', type: 'phone', confirmed: true, created_at: '2024-01-01T00:00:00Z', preferred_authentication_method: 'voice' };
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(updated))
      });

      const result = await api.updateAuthenticationMethod('am_2', { preferred_authentication_method: 'voice' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods/am_2`,
        expect.objectContaining({
          body: JSON.stringify({ preferred_authentication_method: 'voice' })
        }),
        { scope: ['update:me:authentication_methods'] }
      );
      expect((result as any).preferred_authentication_method).toBe('voice');
    });
  });

  describe('enrollmentChallenge', () => {
    it('sends POST to correct endpoint with correct scope', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: jest.fn().mockReturnValue('https://api.example.com/me/v1/authentication-methods/passkey%7Cnew') },
        text: jest.fn().mockResolvedValue(JSON.stringify({ auth_session: 's' }))
      });

      await api.enrollmentChallenge({ type: 'passkey' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'passkey' })
        },
        { scope: ['create:me:authentication_methods'] }
      );
    });

    it('parses id and location from Location header', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: jest.fn().mockReturnValue('https://api.example.com/me/v1/authentication-methods/passkey%7Cnew') },
        text: jest.fn().mockResolvedValue(JSON.stringify({ auth_session: 'session-abc' }))
      });

      const result = await api.enrollmentChallenge({ type: 'passkey' });

      expect(result.id).toBe('passkey|new');
      expect(result.location).toBe('https://api.example.com/me/v1/authentication-methods/passkey%7Cnew');
    });

    it('falls back to empty string when Location header is absent', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: jest.fn().mockReturnValue(null) },
        text: jest.fn().mockResolvedValue(JSON.stringify({ auth_session: 'session-abc' }))
      });

      const result = await api.enrollmentChallenge({ type: 'passkey' });

      expect(result.id).toBe('');
      expect(result.location).toBe('');
    });

    it('includes connection and identity when provided', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: jest.fn().mockReturnValue('https://api.example.com/me/v1/authentication-methods/passkey%7Cnew') },
        text: jest.fn().mockResolvedValue(JSON.stringify({ auth_session: 's' }))
      });

      await api.enrollmentChallenge({ type: 'passkey', connection: 'Username-Password-Authentication', identity_user_id: 'auth0|123' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        `${apiBase}v1/authentication-methods`,
        expect.objectContaining({
          body: JSON.stringify({ type: 'passkey', connection: 'Username-Password-Authentication', identity_user_id: 'auth0|123' })
        }),
        { scope: ['create:me:authentication_methods'] }
      );
    });

    it('throws MyAccountApiError on failure', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          type: 'error', status: 400, title: 'Bad Request', detail: 'Connection does not support passkeys'
        }))
      });

      await expect(api.enrollmentChallenge({ type: 'passkey' })).rejects.toThrow(MyAccountApiError);
      await expect(api.enrollmentChallenge({ type: 'passkey' })).rejects.toMatchObject({
        message: 'Connection does not support passkeys',
        status: 400,
        title: 'Bad Request'
      });
    });

    it('preserves validation_errors in MyAccountApiError', async () => {
      const errorBody = {
        type: 'error',
        status: 400,
        title: 'Bad Request',
        detail: 'Validation failed',
        validation_errors: [
          { detail: 'Connection is invalid', field: 'connection' }
        ]
      };
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify(errorBody))
      });

      await expect(api.enrollmentChallenge({ type: 'passkey' })).rejects.toMatchObject({
        status: 400,
        detail: 'Validation failed',
        validation_errors: [{ detail: 'Connection is invalid', field: 'connection' }]
      });
    });

    it('throws MyAccountApiError for non-passkey enrollment failure', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          type: 'error', status: 400, title: 'Bad Request', detail: 'Invalid phone number'
        }))
      });

      await expect(api.enrollmentChallenge({ type: 'phone', phone_number: 'bad' })).rejects.toThrow(MyAccountApiError);
    });
  });

  describe('enrollmentVerify', () => {
    const authn_response = {
      id: 'cred-id',
      rawId: 'cmF3SWQ',
      type: 'public-key',
      response: { clientDataJSON: 'Y2xpZW50', attestationObject: 'YXR0ZXN0' }
    } as any;

    const verifiedMethod = {
      id: 'passkey|new',
      type: 'passkey',
      confirmed: true,
      created_at: '2024-01-01T00:00:00.000Z',
      usage: ['primary'],
      key_id: 'key-abc',
      public_key: 'pub-key-abc',
      credential_device_type: 'multi_device',
      credential_backed_up: true,
      identity_user_id: 'auth0|123',
      user_handle: 'handle-abc'
    };

    it('sends POST to verify endpoint with authn_response', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(verifiedMethod))
      });

      await api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auth_session: 'session-abc', authn_response })
        },
        { scope: ['create:me:authentication_methods'] }
      );
    });

    it('resolves with the verified authentication method on success', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(verifiedMethod))
      });

      const result = await api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response });

      expect(result).toMatchObject({ id: 'passkey|new', type: 'passkey', confirmed: true });
    });

    it('throws MyAccountApiError on failure', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          type: 'error', status: 400, title: 'Bad Request', detail: 'Invalid credential'
        }))
      });

      await expect(api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response })).rejects.toThrow(MyAccountApiError);
      await expect(api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response })).rejects.toMatchObject({
        message: 'Invalid credential',
        status: 400,
        title: 'Bad Request'
      });
    });

    it('sends otp_code for phone verify', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ id: 'phone|dev_abc', type: 'phone' }))
      });

      await api.enrollmentVerify({ type: 'phone', location: 'https://api.example.com/me/v1/authentication-methods/phone%7Cdev_abc', auth_session: 'session-abc', otp_code: '123456' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/me/v1/authentication-methods/phone%7Cdev_abc/verify',
        expect.objectContaining({
          body: JSON.stringify({ auth_session: 'session-abc', otp_code: '123456' })
        }),
        { scope: ['create:me:authentication_methods'] }
      );
    });

    it('sends new_password for password verify', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ id: 'password|dev_abc', type: 'password' }))
      });

      await api.enrollmentVerify({ type: 'password', location: 'https://api.example.com/me/v1/authentication-methods/password%7Cdev_abc', auth_session: 'session-abc', new_password: 'secret123!' });

      expect(mockFetcher.fetchWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/me/v1/authentication-methods/password%7Cdev_abc/verify',
        expect.objectContaining({
          body: JSON.stringify({ auth_session: 'session-abc', new_password: 'secret123!' })
        }),
        { scope: ['create:me:authentication_methods'] }
      );
    });

    it('rethrows non-MyAccountApiError errors', async () => {
      const networkError = new Error('Network failure');
      mockFetcher.fetchWithAuth = jest.fn().mockRejectedValue(networkError);

      await expect(
        api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response })
      ).rejects.toThrow('Network failure');
    });

    it('rethrows unexpected errors from _handleResponse in enrollmentVerify', async () => {
      mockFetcher.fetchWithAuth = jest.fn().mockResolvedValue({ ok: false });
      jest.spyOn(api as any, '_handleResponse').mockRejectedValue(new Error('unexpected'));

      await expect(
        api.enrollmentVerify({ type: 'passkey', location: 'https://api.example.com/me/v1/authentication-methods/passkey%7Cnew', auth_session: 'session-abc', authn_response })
      ).rejects.toThrow('unexpected');
    });
  });
});
