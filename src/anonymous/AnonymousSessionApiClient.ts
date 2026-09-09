import type {
  AnonymousSessionClient,
  AnonymousSession,
  CreateAnonymousSessionOptions,
  GetAnonymousAccessTokenOptions
} from '@auth0/auth0-auth-js';
import { AnonymousSessionCacheManager } from './AnonymousSessionCacheManager';

export type AnonymousGetTokenSilentlyOptions = Omit<
  GetAnonymousAccessTokenOptions,
  'sessionToken'
>;

const EXPIRY_LEEWAY_SECONDS = 60;

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
  private readonly cache: AnonymousSessionCacheManager;

  constructor(
    private authJsClient: AnonymousSessionClient,
    clientId: string,
    cacheMode: 'localStorage' | 'memory' = 'localStorage'
  ) {
    this.cache = new AnonymousSessionCacheManager(clientId, cacheMode);
  }

  /**
   * Creates a new anonymous session and persists the tokens locally.
   */
  async createSession(
    options?: CreateAnonymousSessionOptions
  ): Promise<AnonymousSession> {
    const session = await this.authJsClient.createSession(options);
    this.cache
      .getStore(
        (options as AnonymousGetTokenSilentlyOptions)?.audience,
        (options as AnonymousGetTokenSilentlyOptions)?.scope
      )
      .set(session);
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
    const store = this.cache.getStore(options?.audience, options?.scope);
    const stored = store.get();
    const nowSeconds = Date.now() / 1000;

    if (stored && stored.expiresAt - EXPIRY_LEEWAY_SECONDS > nowSeconds) {
      return stored;
    }

    const session = await this.authJsClient.getAccessToken({
      ...options,
      sessionToken: stored?.sessionToken ?? this.cache.getAnySessionToken()
    });
    store.set(session);
    return session;
  }

  /**
   * Ends the anonymous session and clears all locally stored tokens.
   */
  async logout(): Promise<void> {
    await this.authJsClient.logout();
    this.cache.removeAll();
  }

  /**
   * Always returns `null` in EA — session tokens are issued as opaque JWEs and
   * cannot be decoded client-side. Reserved for future JWT format support.
   */
  getClaims(): null {
    return null;
  }
}
