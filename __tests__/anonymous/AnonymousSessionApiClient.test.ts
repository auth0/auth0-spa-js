import { AnonymousSessionApiClient } from '../../src/anonymous/AnonymousSessionApiClient';
import type { ILockManager } from '../../src/lock';
import type { AnonymousSession } from '@auth0/auth0-auth-js';

const mockSession = (overrides: Partial<AnonymousSession> = {}): AnonymousSession => ({
  sessionToken: 'session_token_123',
  accessToken: 'access_token_123',
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  ...overrides
});

const makeAuthJsClient = () => ({
  createSession: jest.fn(),
  getAccessToken: jest.fn(),
  logout: jest.fn()
});

const makeLockManager = (): jest.Mocked<ILockManager> => ({
  runWithLock: jest.fn().mockImplementation((_key, _timeout, cb) => cb())
});

const STORAGE_KEY = '@@auth0spajs@@::test_client::anonymous::["",""]';


describe('AnonymousSessionApiClient', () => {
  let authJsClient: ReturnType<typeof makeAuthJsClient>;

  const makeClient = (cacheMode?: 'localStorage' | 'memory', lockManager?: ILockManager) =>
    new AnonymousSessionApiClient(authJsClient as any, 'test_client', cacheMode, lockManager);

  beforeEach(() => {
    authJsClient = makeAuthJsClient();
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('uses localStorage when cacheMode is localStorage', () => {
      const client = makeClient('localStorage');
      // Verify by storing a session and checking localStorage
      authJsClient.createSession.mockResolvedValue(mockSession());
      return client.createSession().then(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
      });
    });

    it('uses memory store when cacheMode is memory', () => {
      const client = makeClient('memory');
      authJsClient.createSession.mockResolvedValue(mockSession());
      return client.createSession().then(() => {
        expect(localStorage.setItem).not.toHaveBeenCalled();
      });
    });

    it('defaults to localStorage', () => {
      const client = makeClient();
      authJsClient.createSession.mockResolvedValue(mockSession());
      return client.createSession().then(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
      });
    });
  });

  describe('createSession', () => {
    it('calls authJsClient.createSession with options', async () => {
      const client = makeClient('memory');
      const options = { audience: 'https://api.example.com', metadata: { cart: '123' } };
      const session = mockSession();
      authJsClient.createSession.mockResolvedValue(session);

      const result = await client.createSession(options);

      expect(authJsClient.createSession).toHaveBeenCalledWith(options);
      expect(result).toBe(session);
    });

    it('stores the returned session', async () => {
      const client = makeClient('localStorage');
      const session = mockSession();
      authJsClient.createSession.mockResolvedValue(session);

      await client.createSession();

      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    });

    it('works without options', async () => {
      const client = makeClient('memory');
      authJsClient.createSession.mockResolvedValue(mockSession());

      await client.createSession();

      expect(authJsClient.createSession).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getTokenSilently', () => {
    it('returns cached session when access token is still fresh', async () => {
      const client = makeClient('memory');
      const freshSession = mockSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 });
      authJsClient.createSession.mockResolvedValue(freshSession);
      await client.createSession();
      authJsClient.getAccessToken.mockClear();

      const result = await client.getTokenSilently();

      expect(authJsClient.getAccessToken).not.toHaveBeenCalled();
      expect(result).toBe(freshSession);
    });

    it('renews via session token when access token is expired', async () => {
      const client = makeClient('memory');
      const expiredSession = mockSession({
        sessionToken: 'stored_session_token',
        expiresAt: Math.floor(Date.now() / 1000) - 10
      });
      authJsClient.getAccessToken.mockResolvedValueOnce(expiredSession);
      await client.getTokenSilently({ audience: 'https://api.example.com' });

      const renewedSession = mockSession({ accessToken: 'new_access_token' });
      authJsClient.getAccessToken.mockResolvedValue(renewedSession);

      const result = await client.getTokenSilently({ audience: 'https://api.example.com' });

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        audience: 'https://api.example.com',
        sessionToken: 'stored_session_token'
      });
      expect(result).toBe(renewedSession);
    });

    it('creates a new session when no session is stored', async () => {
      const client = makeClient('memory');
      const newSession = mockSession();
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      const result = await client.getTokenSilently();

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        sessionToken: undefined
      });
      expect(result).toBe(newSession);
    });

    it('stores the renewed session', async () => {
      const client = makeClient('localStorage');
      const expiredSession = mockSession({ expiresAt: Math.floor(Date.now() / 1000) - 10 });
      authJsClient.createSession.mockResolvedValue(expiredSession);
      await client.createSession();

      const renewedSession = mockSession({ accessToken: 'new_access_token' });
      authJsClient.getAccessToken.mockResolvedValue(renewedSession);
      await client.getTokenSilently();

      expect(localStorage.setItem).toHaveBeenLastCalledWith(STORAGE_KEY, expect.any(String));
    });

    it('bypasses cache when audience differs from cached session', async () => {
      const client = makeClient('memory');
      const freshSession = mockSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 });
      authJsClient.getAccessToken.mockResolvedValueOnce(freshSession);
      await client.getTokenSilently({ audience: 'https://api-a.example.com' });
      authJsClient.getAccessToken.mockClear();

      const newSession = mockSession({ accessToken: 'new_access_token' });
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      const result = await client.getTokenSilently({ audience: 'https://api-b.example.com' });

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        audience: 'https://api-b.example.com',
        sessionToken: freshSession.sessionToken
      });
      expect(result).toBe(newSession);
    });

    it('reuses sessionToken from localStorage on page reload when fetching a new audience', async () => {
      // Simulate a previous session stored in localStorage (e.g. from a prior page load)
      const previousSession = mockSession({
        sessionToken: 'persisted_session_token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      });
      const existingKey = '@@auth0spajs@@::test_client::anonymous::https://api-a.example.com::';
      localStorage.setItem(existingKey, JSON.stringify(previousSession));

      // New client instance (simulates page reload — stores Map is empty)
      const freshClient = makeClient('localStorage');
      const newSession = mockSession({ accessToken: 'new_access_token' });
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      await freshClient.getTokenSilently({ audience: 'https://api-b.example.com' });

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        audience: 'https://api-b.example.com',
        sessionToken: 'persisted_session_token'
      });
    });

    it('bypasses cache when scope differs from cached session', async () => {
      const client = makeClient('memory');
      const freshSession = mockSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 });
      authJsClient.getAccessToken.mockResolvedValueOnce(freshSession);
      await client.getTokenSilently({ scope: 'openid' });
      authJsClient.getAccessToken.mockClear();

      const newSession = mockSession({ accessToken: 'new_access_token' });
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      const result = await client.getTokenSilently({ scope: 'openid profile' });

      expect(authJsClient.getAccessToken).toHaveBeenCalled();
      expect(result).toBe(newSession);
    });

    it('returns cached session when audience and scope both match', async () => {
      const client = makeClient('memory');
      const freshSession = mockSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 });
      authJsClient.getAccessToken.mockResolvedValueOnce(freshSession);
      await client.getTokenSilently({ audience: 'https://api.example.com', scope: 'openid' });
      authJsClient.getAccessToken.mockClear();

      const result = await client.getTokenSilently({ audience: 'https://api.example.com', scope: 'openid' });

      expect(authJsClient.getAccessToken).not.toHaveBeenCalled();
      expect(result).toMatchObject(freshSession);
    });

    it('treats a session expiring within the 60s leeway as expired', async () => {
      const client = makeClient('memory');
      const almostExpiredSession = mockSession({
        sessionToken: 'stored_session_token',
        expiresAt: Math.floor(Date.now() / 1000) + 30 // within leeway
      });
      authJsClient.createSession.mockResolvedValue(almostExpiredSession);
      await client.createSession();

      const renewedSession = mockSession();
      authJsClient.getAccessToken.mockResolvedValue(renewedSession);

      await client.getTokenSilently();

      expect(authJsClient.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('calls authJsClient.logout', async () => {
      const client = makeClient('memory');
      authJsClient.logout.mockResolvedValue(undefined);

      await client.logout();

      expect(authJsClient.logout).toHaveBeenCalled();
    });

    it('clears the stored session', async () => {
      const client = makeClient('memory');
      const session = mockSession();
      authJsClient.createSession.mockResolvedValue(session);
      await client.createSession();
      authJsClient.logout.mockResolvedValue(undefined);

      await client.logout();

      // After logout, getTokenSilently should create a new session (no stored sessionToken)
      authJsClient.getAccessToken.mockResolvedValue(mockSession());
      await client.getTokenSilently();
      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({ sessionToken: undefined });
    });

    it('clears localStorage on logout', async () => {
      const client = makeClient('localStorage');
      authJsClient.createSession.mockResolvedValue(mockSession());
      await client.createSession();
      authJsClient.logout.mockResolvedValue(undefined);

      await client.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('clears localStorage slots written before page reload on logout', async () => {
      // Simulate slots persisted from a previous session
      const keyA = '@@auth0spajs@@::test_client::anonymous::https://api-a.example.com::';
      const keyB = '@@auth0spajs@@::test_client::anonymous::https://api-b.example.com::';
      localStorage.setItem(keyA, JSON.stringify(mockSession()));
      localStorage.setItem(keyB, JSON.stringify(mockSession()));

      // New client instance (stores Map is empty)
      const freshClient = makeClient('localStorage');
      authJsClient.logout.mockResolvedValue(undefined);

      await freshClient.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith(keyA);
      expect(localStorage.removeItem).toHaveBeenCalledWith(keyB);
    });
  });

  describe('getClaims', () => {
    it('always returns null in EA', () => {
      const client = makeClient('memory');
      expect(client.getClaims()).toBeNull();
    });
  });

  describe('localStorage store', () => {
    it('returns null from get when key is not set', async () => {
      const client = makeClient('localStorage');
      const newSession = mockSession();
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      // No prior createSession — localStorage has no entry, get() returns null
      await client.getTokenSilently();

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({ sessionToken: undefined });
    });
  });

  describe('locking', () => {
    it('acquires a lock when no session token exists', async () => {
      const lockManager = makeLockManager();
      const client = makeClient('memory', lockManager);
      authJsClient.getAccessToken.mockResolvedValue(mockSession());

      await client.getTokenSilently();

      expect(lockManager.runWithLock).toHaveBeenCalledWith(
        'anonymous::test_client',
        5000,
        expect.any(Function)
      );
    });

    it('does not acquire a lock when a session token is already stored', async () => {
      const lockManager = makeLockManager();
      const client = makeClient('memory', lockManager);
      const expiredSession = mockSession({
        sessionToken: 'existing_token',
        expiresAt: Math.floor(Date.now() / 1000) - 10
      });
      authJsClient.getAccessToken.mockResolvedValueOnce(expiredSession).mockResolvedValue(mockSession());
      // First call stores a session with a sessionToken (goes through the lock)
      await client.getTokenSilently();
      lockManager.runWithLock.mockClear();

      // Second call: access token expired but sessionToken present — no lock needed
      await client.getTokenSilently();

      expect(lockManager.runWithLock).not.toHaveBeenCalled();
    });

    it('uses a session token created by another call while waiting for the lock', async () => {
      const lockManager: ILockManager = {
        runWithLock: jest.fn().mockImplementation((_key, _timeout, cb) => {
          // Simulate another tab/call writing a session to localStorage before we run
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSession({ sessionToken: 'concurrent_token' })));
          return cb();
        })
      };
      const client = makeClient('localStorage', lockManager);
      authJsClient.getAccessToken.mockResolvedValue(mockSession({ accessToken: 'renewed_token' }));

      await client.getTokenSilently();

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        sessionToken: 'concurrent_token'
      });
    });
  });

  describe('localStorage store error handling', () => {
    it('returns null when localStorage.getItem throws', async () => {
      (localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('storage error');
      });
      const client = makeClient('localStorage');
      const newSession = mockSession();
      authJsClient.getAccessToken.mockResolvedValue(newSession);

      // Should not throw — falls back to creating a new session
      await expect(client.getTokenSilently()).resolves.toBe(newSession);
    });

    it('silently swallows localStorage.setItem errors', async () => {
      const client = makeClient('localStorage');
      (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('quota exceeded');
      });
      authJsClient.createSession.mockResolvedValue(mockSession());

      await expect(client.createSession()).resolves.toBeDefined();
    });

    it('silently swallows localStorage.removeItem errors during logout', async () => {
      const client = makeClient('localStorage');
      authJsClient.createSession.mockResolvedValue(mockSession());
      await client.createSession();
      (localStorage.removeItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('storage error');
      });
      authJsClient.logout.mockResolvedValue(undefined);

      await expect(client.logout()).resolves.toBeUndefined();
    });

    it('returns undefined from getAnySessionToken when scan throws', async () => {
      const lockManager = makeLockManager();
      const client = makeClient('localStorage', lockManager);
      (localStorage.key as jest.Mock).mockImplementationOnce(() => {
        throw new Error('storage error');
      });
      authJsClient.getAccessToken.mockResolvedValue(mockSession());

      await client.getTokenSilently();

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({ sessionToken: undefined });
    });

    it('skips malformed localStorage entries in getAnySessionToken', async () => {
      const existingKey = '@@auth0spajs@@::test_client::anonymous::["https://api-a.example.com",""]';
      localStorage.setItem(existingKey, 'not-valid-json');

      const lockManager = makeLockManager();
      const client = makeClient('localStorage', lockManager);
      authJsClient.getAccessToken.mockResolvedValue(mockSession());

      await client.getTokenSilently({ audience: 'https://api-b.example.com' });

      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        audience: 'https://api-b.example.com',
        sessionToken: undefined
      });
    });

    it('ignores non-matching keys in localStorage scan', async () => {
      localStorage.setItem('unrelated-key', 'some-value');
      const lockManager = makeLockManager();
      const client = makeClient('localStorage', lockManager);
      authJsClient.getAccessToken.mockResolvedValue(mockSession());

      await client.getTokenSilently();

      // Non-matching key is skipped — getAnySessionToken returns undefined
      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({ sessionToken: undefined });
    });

    it('ignores entries without a sessionToken in getAnySessionToken', async () => {
      const existingKey = '@@auth0spajs@@::test_client::anonymous::["https://api-a.example.com",""]';
      localStorage.setItem(existingKey, JSON.stringify({ accessToken: 'abc', expiresAt: 9999 }));

      const lockManager = makeLockManager();
      const client = makeClient('localStorage', lockManager);
      authJsClient.getAccessToken.mockResolvedValue(mockSession());

      await client.getTokenSilently({ audience: 'https://api-b.example.com' });

      // Entry without sessionToken is skipped
      expect(authJsClient.getAccessToken).toHaveBeenCalledWith({
        audience: 'https://api-b.example.com',
        sessionToken: undefined
      });
    });

    it('silently swallows store.remove() errors on logout', async () => {
      const client = makeClient('localStorage');
      authJsClient.createSession.mockResolvedValue(mockSession());
      await client.createSession(); // stores session in Map AND localStorage

      // Clear localStorage so keysToRemove scan finds nothing
      // but stores Map still has the entry — store.remove() will be called
      localStorage.clear();
      (localStorage.removeItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('storage error');
      });
      authJsClient.logout.mockResolvedValue(undefined);

      await expect(client.logout()).resolves.toBeUndefined();
    });

    it('silently swallows localStorage scan errors during removeAll', async () => {
      authJsClient.createSession.mockResolvedValue(mockSession());
      const client = makeClient('localStorage');
      await client.createSession(); // ensure length > 0 so the loop runs
      (localStorage.key as jest.Mock).mockImplementationOnce(() => {
        throw new Error('storage error');
      });
      authJsClient.logout.mockResolvedValue(undefined);

      await expect(client.logout()).resolves.toBeUndefined();
    });
  });
});
