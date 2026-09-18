const STORAGE_KEY_PREFIX = '@@auth0spajs@@';
const SESSION_TOKEN_SUFFIX = 'session';

type SharedSession = {
  sessionToken: string;
  sessionTokenExpiresAt?: number;
};

type AccessTokenSlot = {
  accessToken: string;
  expiresAt: number;
  scope?: string;
};

type Store<T> = {
  get(): T | null;
  set(value: T): void;
  remove(): void;
};

function makeLocalStore<T>(key: string): Store<T> {
  return {
    get() {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    remove() {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  };
}

function makeMemoryStore<T>(): Store<T> {
  let stored: T | null = null;
  return {
    get: () => stored,
    set: v => { stored = v; },
    remove: () => { stored = null; }
  };
}

export type { AccessTokenSlot, SharedSession };

export class AnonymousSessionCacheManager {
  private readonly slots = new Map<string, Store<AccessTokenSlot>>();
  private readonly sessionStore: Store<SharedSession>;
  private readonly sessionKey: string;

  private readonly baseKey: string;
  private readonly useLocalStorage: boolean;

  constructor(clientId: string, cacheMode: 'localStorage' | 'memory') {
    this.baseKey = `${STORAGE_KEY_PREFIX}::${clientId}::anonymous`;
    this.useLocalStorage =
      cacheMode === 'localStorage' &&
      typeof window !== 'undefined' &&
      !!window.localStorage;

    this.sessionKey = `${this.baseKey}::${SESSION_TOKEN_SUFFIX}`;
    this.sessionStore = this.useLocalStorage
      ? makeLocalStore<SharedSession>(this.sessionKey)
      : makeMemoryStore<SharedSession>();
  }

  getStore(audience?: string, scope?: string): Store<AccessTokenSlot> {
    const key = `${this.baseKey}::${JSON.stringify([audience ?? '', scope ?? ''])}`;
    if (!this.slots.has(key)) {
      this.slots.set(
        key,
        this.useLocalStorage ? makeLocalStore<AccessTokenSlot>(key) : makeMemoryStore<AccessTokenSlot>()
      );
    }
    return this.slots.get(key)!;
  }

  getSessionToken(): SharedSession | null {
    return this.sessionStore.get();
  }

  setSessionToken(session: SharedSession): void {
    this.sessionStore.set(session);
  }

  removeAll(): void {
    this.sessionStore.remove();
    this.slots.forEach(store => store.remove());
    this.slots.clear();

    if (this.useLocalStorage) {
      try {
        const prefix = this.baseKey + '::';
        const stale: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith(prefix)) stale.push(key);
        }
        stale.forEach(key => window.localStorage.removeItem(key));
      } catch {}
    }
  }
}
