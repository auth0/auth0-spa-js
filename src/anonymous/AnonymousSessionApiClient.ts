import type {
  AnonymousSessionClient,
  AnonymousSession,
  CreateAnonymousSessionOptions,
  GetAnonymousAccessTokenOptions
} from '@auth0/auth0-auth-js';
import { AnonymousSessionError } from '@auth0/auth0-auth-js';
import type { ILockManager } from '../lock';
import { getLockManager } from '../lock';
import { AnonymousSessionCacheManager } from './AnonymousSessionCacheManager';

/**
 * @category Tokens & Users
 */
export type AnonymousGetTokenSilentlyOptions = Omit<
  GetAnonymousAccessTokenOptions,
  'sessionToken'
>;

export type AnonymousTokenResult = {
  accessToken: string;
  expiresAt: number;
  scope?: string;
};

const EXPIRY_LEEWAY_SECONDS = 60;
const SESSION_EXPIRED_MESSAGE = 'The anonymous session has expired. Call createSession() to start a new one.';

/**
 * Browser-layer wrapper around auth0-auth-js `AnonymousSessionClient`.
 *
 * Adds local session storage (localStorage or memory) so callers never need to
 * manage the session token themselves. `getTokenSilently()` returns a cached
 * access token when still valid and renews it transparently when expired.
 *
 * The session token is stored once and shared across all audience/scope slots.
 * Each slot stores only its own access token and expiry.
 *
 * Exposed on `Auth0Client` as `auth0.anonymous`.
 *
 * @category Clients
 */
export class AnonymousSessionApiClient {
  private readonly cache: AnonymousSessionCacheManager;
  private readonly lockManager: ILockManager;
  private readonly clientId: string;

  constructor(
    private authJsClient: AnonymousSessionClient,
    clientId: string,
    cacheMode: 'localStorage' | 'memory' = 'localStorage',
    lockManager?: ILockManager
  ) {
    this.clientId = clientId;
    this.cache = new AnonymousSessionCacheManager(clientId, cacheMode);
    this.lockManager = lockManager ?? getLockManager();
  }

  /**
   * Creates a new anonymous session and persists the tokens locally.
   */
  async createSession(
    options?: CreateAnonymousSessionOptions
  ): Promise<AnonymousSession> {
    const session = await this.authJsClient.createSession(options);
    this.cache.setSessionToken({
      sessionToken: session.sessionToken,
      ...(session.sessionTokenExpiresAt !== undefined && { sessionTokenExpiresAt: session.sessionTokenExpiresAt })
    });
    this.cache.getStore(options?.audience, options?.scope).set({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      ...(session.scope !== undefined && { scope: session.scope })
    });
    return session;
  }

  /**
   * Returns a valid anonymous access token, renewing it when expired.
   *
   * If the stored access token is still fresh (more than 60 s remaining), it is
   * returned directly without a network call. Otherwise the session token is used
   * to re-mint the access token. If the session token has also expired, the local
   * cache is cleared and an `AnonymousSessionError` with code `session_expired` is
   * thrown — call `createSession()` to start a new session.
   *
   * @throws {AnonymousSessionError} with code `session_expired` if the session token has expired.
   */
  async getTokenSilently(
    options?: AnonymousGetTokenSilentlyOptions
  ): Promise<AnonymousTokenResult> {
    const store = this.cache.getStore(options?.audience, options?.scope);
    const slot = store.get();

    if (slot && slot.expiresAt - EXPIRY_LEEWAY_SECONDS > Date.now() / 1000) {
      return slot;
    }

    // Access token expired or absent — acquire lock so concurrent callers (same tab or
    // cross-tab) don't each trigger a renewal that may mint a new anonymous identity
    // when the session token is also expired. Known cost: lock uses localStorage polling,
    // so even zero-contention renewals pay I/O overhead.
    return this.lockManager.runWithLock(
      `anonymous::${this.clientId}`,
      5000,
      async () => {
        // Re-check inside the lock: a concurrent caller may have already renewed,
        // or may have marked the session expired — stop queued callers immediately.
        if (this.cache.isSessionExpired()) {
          throw new AnonymousSessionError('session_expired', SESSION_EXPIRED_MESSAGE);
        }

        const afterLock = store.get();
        if (
          afterLock &&
          afterLock.expiresAt - EXPIRY_LEEWAY_SECONDS > Date.now() / 1000
        ) {
          return afterLock;
        }

        const sessionToken = this.cache.getSessionToken()?.sessionToken;
        const session = await this.authJsClient.getAccessToken({
          ...options,
          sessionToken
        });

        // auth0-auth-js silently creates a fresh identity when the session token
        // expires. Surface this as an error so the developer can decide whether to
        // recreate the session with the original metadata rather than silently losing it.
        if (session.sessionReplaced) {
          this.cache.removeAll();
          this.cache.markSessionExpired();
          throw new AnonymousSessionError('session_expired', SESSION_EXPIRED_MESSAGE);
        }

        this.cache.getStore(options?.audience, options?.scope).set({
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          ...(session.scope !== undefined && { scope: session.scope })
        });
        if (!this.cache.getSessionToken()) {
          this.cache.setSessionToken({
            sessionToken: session.sessionToken,
            ...(session.sessionTokenExpiresAt !== undefined && { sessionTokenExpiresAt: session.sessionTokenExpiresAt })
          });
        }
        return {
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          ...(session.scope !== undefined && { scope: session.scope })
        };
      }
    );
  }

  /**
   * Mints a short-lived transfer ticket (30s single-use JWE) for linking the
   * anonymous session during `loginWithRedirect()`. Returns `null` if no session
   * is active or the request fails — callers must never be blocked from login.
   */
  async mintTransferToken(): Promise<string | null> {
    const stored = this.cache.getSessionToken();
    if (!stored?.sessionToken) return null;
    return this.authJsClient.mintTransferToken(stored.sessionToken);
  }

  /**
   * Ends the anonymous session and clears all locally stored tokens.
   */
  async logout(): Promise<void> {
    await this.authJsClient.logout();
    this.cache.removeAll();
  }

  /**
   * Returns true if a session token exists in the local cache.
   */
  hasSession(): boolean {
    return !!this.cache.getSessionToken()?.sessionToken;
  }

  /**
   * Always returns `null` in EA — session tokens are issued as opaque JWEs and
   * cannot be decoded client-side. Reserved for future JWT format support.
   */
  getClaims(): null {
    return null;
  }

}
