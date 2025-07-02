import { CacheManager, CacheKey } from './cache';

import {
  Auth0ClientOptions,
  AuthorizationParams,
  GetTokenSilentlyOptions,
  TokenEndpointResponse
} from './global';

/**
 * Manages refresh token rotation detection and recovery
 */
export class RotationManager {
  constructor(
    private readonly cacheManager: CacheManager,
    private readonly options: Auth0ClientOptions & {
      authorizationParams: AuthorizationParams;
    },
    private readonly requestToken: (
      options: any,
      additionalParams?: any
    ) => Promise<any>
  ) {}

  async detectRotation(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    },
    invalidToken?: string
  ): Promise<
    | (TokenEndpointResponse & {
        decodedToken: any;
        scope: string;
        oauthTokenScope?: string;
        audience: string;
      })
    | undefined
  > {
    // Only works with localStorage where multiple entries can exist
    if (this.options.cacheLocation !== 'localstorage') {
      return undefined;
    }

    try {
      const audience = options.authorizationParams.audience || 'default';
      const candidateEntries =
        await this.cacheManager.findRefreshTokensByClient(
          this.options.clientId!,
          audience
        );

      // Try each valid candidate token
      for (const entry of candidateEntries) {
        if (entry.refresh_token === invalidToken) continue;

        try {
          // Try refreshing with this token
          const redirect_uri =
            options.authorizationParams.redirect_uri ||
            this.options.authorizationParams.redirect_uri ||
            (typeof window !== 'undefined' ? window.location.origin : '');

          const timeout = options.timeoutInSeconds
            ? options.timeoutInSeconds * 1000
            : null;

          const tokenResult = await this.requestToken({
            ...options.authorizationParams,
            grant_type: 'refresh_token',
            refresh_token: entry.refresh_token!,
            redirect_uri,
            ...(timeout && { timeout })
          });

          this.cleanupInvalidated(invalidToken);

          return {
            ...tokenResult,
            scope: options.authorizationParams.scope,
            oauthTokenScope: tokenResult.scope,
            audience: options.authorizationParams.audience || 'default'
          };
        } catch {
          // Continue to next candidate
        }
      }
    } catch (error) {
      console.warn(
        '[Auth0] Refresh token rotation detection failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return undefined;
  }

  private cleanupInvalidated(invalidToken?: string): void {
    if (!invalidToken) return;

    // Async cleanup
    this.cacheManager
      .getAllCacheKeys()
      .then(cacheKeys => {
        const cache = (this.cacheManager as any).cache;
        const keyManifest = (this.cacheManager as any).keyManifest;

        for (const key of cacheKeys) {
          const cacheKey = CacheKey.fromKey(key);

          // Only check refresh token entries for this client
          if (cacheKey.clientId === this.options.clientId && cacheKey.scope) {
            cache
              .get(key)
              .then((entry: any) => {
                if (entry?.refresh_token === invalidToken) {
                  cache.remove(key);
                  keyManifest?.remove(key);
                }
              })
              .catch(() => {
                // Do not throw on error, continue
              });
          }
        }
      })
      .catch(() => {
        // Do not throw on error, continue
      });
  }
}
