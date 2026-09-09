import type { AnonymousSession } from '@auth0/auth0-auth-js';

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

export class AnonymousSessionCacheManager {
  private readonly stores = new Map<string, SessionStore>();

  private readonly baseKey: string;
  private readonly useLocalStorage: boolean;

  constructor(clientId: string, cacheMode: 'localStorage' | 'memory') {
    this.baseKey = `${STORAGE_KEY_PREFIX}::${clientId}::anonymous`;
    this.useLocalStorage =
      cacheMode === 'localStorage' &&
      typeof window !== 'undefined' &&
      !!window.localStorage;
  }

  getStore(audience?: string, scope?: string): SessionStore {
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
  getAnySessionToken(): string | undefined {
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

  removeAll(): void {
    if (this.useLocalStorage) {
      const keysToRemove: string[] = [];
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith(this.baseKey + '::')) keysToRemove.push(key);
        }
      } catch {}
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      });
    }
    this.stores.forEach(store => store.remove());
    this.stores.clear();
  }
}
