import type {
  AnonymousSessionClient,
  AnonymousSession,
  CreateAnonymousSessionOptions,
  GetAnonymousAccessTokenOptions
} from '@auth0/auth0-auth-js';

export type AnonymousGetTokenSilentlyOptions = Omit<
  GetAnonymousAccessTokenOptions,
  'sessionToken'
>;

const EXPIRY_LEEWAY_SECONDS = 60;
const STORAGE_KEY_PREFIX = '@@auth0spajs@@';

type StoredSession = AnonymousSession & { _audience?: string; _scope?: string };

type SessionStore = {
  get(): StoredSession | null;
  set(session: StoredSession): void;
  remove(): void;
};

function makeLocalStore(key: string): SessionStore {
  return {
    get() {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as AnonymousSession) : null;
      } catch {
        return null;
      }
    },
    set(session) {
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {}
    },
    remove() {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  };
}

function makeMemoryStore(): SessionStore {
  let stored: AnonymousSession | null = null;
  return {
    get: () => stored,
    set: s => {
      stored = s;
    },
    remove: () => {
      stored = null;
    }
  };
}

/**
 * Browser-layer wrapper around auth0-auth-js `AnonymousSessionClient`.
 *
 * Adds local session storage (localStorage or memory) so callers never need to
 * manage the session token themselves. `getTokenSilently()` returns a cached
 * access token when still valid and renews it transparently when expired.
 *
 * Exposed on `Auth0Client` as `auth0.anonymous`.
 */
export class AnonymousSessionApiClient {
  private store: SessionStore;

  constructor(
    private authJsClient: AnonymousSessionClient,
    clientId: string,
    cacheMode: 'localStorage' | 'memory' = 'localStorage'
  ) {
    const canUseLocalStorage =
      cacheMode === 'localStorage' &&
      typeof window !== 'undefined' &&
      !!window.localStorage;

    const storageKey = `${STORAGE_KEY_PREFIX}::${clientId}::anonymous`;
    this.store = canUseLocalStorage
      ? makeLocalStore(storageKey)
      : makeMemoryStore();
  }

  /**
   * Creates a new anonymous session and persists the tokens locally.
   */
  async createSession(
    options?: CreateAnonymousSessionOptions
  ): Promise<AnonymousSession> {
    const session = await this.authJsClient.createSession(options);
    this.store.set(session as StoredSession);
    return session;
  }

  /**
   * Returns a valid anonymous access token, creating or renewing the session as needed.
   *
   * If the stored access token is still fresh (more than 60 s remaining), it is
   * returned directly without a network call. Otherwise the session token is used
   * to re-mint the access token. If the session token has also expired, auth0-auth-js
   * silently creates a fresh identity (any previously set metadata is lost).
   */
  async getTokenSilently(
    options?: AnonymousGetTokenSilentlyOptions
  ): Promise<AnonymousSession> {
    const stored = this.store.get();
    const nowSeconds = Date.now() / 1000;
    const requestedAudience = options?.audience;
    const requestedScope = options?.scope;

    if (
      stored &&
      stored.expiresAt - EXPIRY_LEEWAY_SECONDS > nowSeconds &&
      stored._audience === requestedAudience &&
      (!requestedScope || stored._scope === requestedScope)
    ) {
      return stored;
    }

    const session = await this.authJsClient.getAccessToken({
      ...options,
      sessionToken: stored?.sessionToken
    });
    const storedSession: StoredSession = {
      ...session,
      _audience: requestedAudience,
      _scope: requestedScope
    };
    this.store.set(storedSession);
    return session;
  }

  /**
   * Ends the anonymous session and clears locally stored tokens.
   */
  async logout(): Promise<void> {
    await this.authJsClient.logout();
    this.store.remove();
  }

  /**
   * Always returns `null` in EA — session tokens are issued as opaque JWEs and
   * cannot be decoded client-side. Reserved for future JWT format support.
   */
  getClaims(): null {
    return null;
  }
}
