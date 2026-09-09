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

type SessionStore = {
  get(): AnonymousSession | null;
  set(session: AnonymousSession): void;
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
 * Each unique audience+scope combination gets its own cache slot so tokens are
 * never returned for the wrong resource server or scope.
 *
 * Exposed on `Auth0Client` as `auth0.anonymous`.
 */
export class AnonymousSessionApiClient {
  private readonly baseKey: string;
  private readonly useLocalStorage: boolean;
  private readonly stores = new Map<string, SessionStore>();

  constructor(
    private authJsClient: AnonymousSessionClient,
    clientId: string,
    cacheMode: 'localStorage' | 'memory' = 'localStorage'
  ) {
    this.baseKey = `${STORAGE_KEY_PREFIX}::${clientId}::anonymous`;
    this.useLocalStorage =
      cacheMode === 'localStorage' &&
      typeof window !== 'undefined' &&
      !!window.localStorage;
  }

  private getStore(audience?: string, scope?: string): SessionStore {
    const key = `${this.baseKey}::${audience ?? ''}::${scope ?? ''}`;
    if (!this.stores.has(key)) {
      this.stores.set(
        key,
        this.useLocalStorage ? makeLocalStore(key) : makeMemoryStore()
      );
    }
    return this.stores.get(key)!;
  }

  // Returns the sessionToken from any stored slot so the same anonymous identity
  // is reused when fetching a token for a new audience or scope.
  // In localStorage mode, scans localStorage directly so the token survives page reloads.
  private getAnySessionToken(): string | undefined {
    if (this.useLocalStorage) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith(this.baseKey + '::')) {
            try {
              const raw = window.localStorage.getItem(key);
              if (raw) {
                const session = JSON.parse(raw) as AnonymousSession;
                if (session?.sessionToken) return session.sessionToken;
              }
            } catch {}
          }
        }
      } catch {}
      return undefined;
    }
    for (const store of this.stores.values()) {
      const session = store.get();
      if (session?.sessionToken) return session.sessionToken;
    }
    return undefined;
  }

  /**
   * Creates a new anonymous session and persists the tokens locally.
   */
  async createSession(
    options?: CreateAnonymousSessionOptions
  ): Promise<AnonymousSession> {
    const session = await this.authJsClient.createSession(options);
    this.getStore(
      (options as AnonymousGetTokenSilentlyOptions)?.audience,
      (options as AnonymousGetTokenSilentlyOptions)?.scope
    ).set(session);
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
    const store = this.getStore(options?.audience, options?.scope);
    const stored = store.get();
    const nowSeconds = Date.now() / 1000;

    if (stored && stored.expiresAt - EXPIRY_LEEWAY_SECONDS > nowSeconds) {
      return stored;
    }

    const session = await this.authJsClient.getAccessToken({
      ...options,
      sessionToken: stored?.sessionToken ?? this.getAnySessionToken()
    });
    store.set(session);
    return session;
  }

  /**
   * Ends the anonymous session and clears all locally stored tokens.
   */
  async logout(): Promise<void> {
    await this.authJsClient.logout();
    this.stores.forEach(store => store.remove());
    this.stores.clear();
  }

  /**
   * Always returns `null` in EA — session tokens are issued as opaque JWEs and
   * cannot be decoded client-side. Reserved for future JWT format support.
   */
  getClaims(): null {
    return null;
  }
}
