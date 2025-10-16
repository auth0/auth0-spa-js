import {
  MyAccountApiClient,
  MyAccountApiError
} from '../src/MyAccountApiClient';
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
      expect.objectContaining({ method: 'POST' })
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
      expect.objectContaining({ method: 'POST' })
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
});
