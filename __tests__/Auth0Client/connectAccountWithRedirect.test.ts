import { Auth0Client, RedirectConnectAccountOptions } from '../../src';

(<any>global).crypto = {
  subtle: {
    digest: () => ''
  },
  getRandomValues: () => ''
};

describe('Auth0Client', () => {
  let client: Auth0Client;
  let mockMyAccountApi: any;
  let mockTransactionManager: any;
  const oldLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = {
      ...oldLocation,
      assign: jest.fn()
    } as Location;
    mockMyAccountApi = {
      connectAccount: jest.fn().mockResolvedValue({
        connect_uri: 'https://connect.example.com',
        connect_params: { ticket: 'test-ticket' },
        auth_session: 'test-session'
      })
    };
    mockTransactionManager = {
      create: jest.fn()
    };
    client = new Auth0Client({
      domain: 'test',
      clientId: 'abc',
      useDpop: true,
      useMrrt: true,
      authorizationParams: {}
    } as any);
    (client as any).myAccountApi = mockMyAccountApi;
    (client as any).transactionManager =
      mockTransactionManager;
  });

  afterEach(() => {
    window.location = oldLocation;
  });

  describe('connectAccountWithRedirect', () => {
    it('should call myAccountApi.connectAccount with correct params', async () => {
      const options: RedirectConnectAccountOptions<any> = {
        connection: 'google-oauth2',
        scopes: ['profile', 'email'],
        authorization_params: {
          prompt: 'consent',
        }
      };

      await client.connectAccountWithRedirect(options);

      expect(mockMyAccountApi.connectAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: 'google-oauth2',
          scopes: ['profile', 'email'],
          state: expect.any(String),
          code_challenge: expect.any(String),
          code_challenge_method: 'S256',
          authorization_params: {
            prompt: 'consent',
          }
        })
      );
    });

    it('should create a transaction with correct state and code_verifier', async () => {
      const options: RedirectConnectAccountOptions<any> = {
        connection: 'github',
        appState: { 'returnTo': '/dashboard' }
      };

      await client.connectAccountWithRedirect(options);

      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.any(String),
          code_verifier: expect.any(String),
          auth_session: 'test-session',
          redirect_uri: expect.any(String),
          appState: { 'returnTo': '/dashboard' },
          connection: 'github',
          response_type: 'connect_code'
        })
      );
    });

    it('should use openUrl if provided', async () => {
      const openUrl = jest.fn();
      const options: RedirectConnectAccountOptions<any> = {
        connection: 'github',
        openUrl
      };

      await client.connectAccountWithRedirect(options);

      expect(openUrl).toHaveBeenCalledWith(
        'https://connect.example.com/?ticket=test-ticket'
      );
    });

    it('should fallback to window.location.assign if openUrl is not provided', async () => {
      const options: RedirectConnectAccountOptions<any> = {
        connection: 'github'
      };

      await client.connectAccountWithRedirect(options);

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.objectContaining({ href: 'https://connect.example.com/?ticket=test-ticket' })
      );
    });

    it('should throw if connection is not provided', async () => {
      await expect((client as any).connectAccountWithRedirect({})).rejects.toThrow(
        'connection is required'
      );
    });

    it('should throw if myAccountApi.connectAccount fails', async () => {
      mockMyAccountApi.connectAccount.mockRejectedValue(
        new Error('API error')
      );
      const options: RedirectConnectAccountOptions<any> = {
        connection: 'github'
      };

      await expect(client.connectAccountWithRedirect(options)).rejects.toThrow(
        'API error'
      );
    });
  });
});
