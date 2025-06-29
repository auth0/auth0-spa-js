import { CacheManager, CacheEntry, CacheKey } from './cache';

import {
  Auth0ClientOptions,
  AuthorizationParams,
  GetTokenSilentlyOptions,
  TokenEndpointResponse
} from './global';

/**
 * Interface for managing refresh token rotation detection and cleanup
 */
export interface RotationManager {
  detectRotation(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    },
    invalidToken?: string
  ): Promise<GetTokenSilentlyResult | undefined>;

  cleanupInvalidated(
    invalidToken: string | undefined,
    clientId: string,
    audience: string
  ): Promise<void>;
}

/**
 * Interface for cache operations that support refresh token indexing
 */
export interface CacheIndex {
  findRefreshTokensByClient(
    clientId: string,
    audience: string
  ): Promise<CacheEntry[]>;
  findAnyValidRefreshToken(
    clientId: string,
    audience: string
  ): Promise<CacheEntry | undefined>;
}

/**
 * Error types for rotation detection
 */
export class RefreshTokenRotationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RefreshTokenRotationError';
  }
}

/**
 * Token result type for rotation operations
 */
export type GetTokenSilentlyResult = TokenEndpointResponse & {
  decodedToken: any;
  scope: string;
  oauthTokenScope?: string;
  audience: string;
};

/**
 * Shared utility functions for cache operations
 */
class CacheUtils {
  /**
   * Safely retrieves all cache keys from a cache instance
   */
  static async getAllCacheKeys(cache: any): Promise<string[]> {
    try {
      const cacheKeysResult = cache.allKeys ? cache.allKeys() : [];
      return Array.isArray(cacheKeysResult)
        ? cacheKeysResult
        : await cacheKeysResult;
    } catch (error) {
      // Handle localStorage quota exceeded or other storage errors gracefully
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new RefreshTokenRotationError(
          'Cache storage quota exceeded',
          error
        );
      }
      throw error;
    }
  }
}

/**
 * Manages cache indexing for efficient refresh token lookups
 */
export class CacheIndexManager implements CacheIndex {
  constructor(
    private cacheManager: CacheManager,
    private options: Auth0ClientOptions
  ) {
    if (!options.clientId) {
      throw new Error('Client ID is required for cache index management');
    }
  }

  async findRefreshTokensByClient(
    clientId: string,
    audience: string
  ): Promise<CacheEntry[]> {
    try {
      const cache = (this.cacheManager as any).cache;
      const cacheKeys = await CacheUtils.getAllCacheKeys(cache);

      const entries: CacheEntry[] = [];

      for (const key of cacheKeys) {
        const cacheKey = CacheKey.fromKey(key);
        if (
          cacheKey.clientId === clientId &&
          cacheKey.audience === audience &&
          cacheKey.scope // Only entries with scopes (not id token entries)
        ) {
          const entry = await cache.get(key);
          if (entry?.refresh_token) {
            entries.push(entry);
          }
        }
      }

      return entries;
    } catch (error) {
      throw new RefreshTokenRotationError(
        'Failed to find refresh tokens by client',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async findAnyValidRefreshToken(
    clientId: string,
    audience: string
  ): Promise<CacheEntry | undefined> {
    const entries = await this.findRefreshTokensByClient(clientId, audience);
    return entries.length > 0 ? entries[0] : undefined;
  }
}

/**
 * Manages refresh token rotation detection and recovery
 */
export class RefreshTokenRotationManager implements RotationManager {
  public readonly cacheIndex: CacheIndexManager;
  private readonly clientId: string;

  constructor(
    private cacheManager: CacheManager,
    private options: Auth0ClientOptions & {
      authorizationParams: AuthorizationParams;
    },
    private requestToken: (options: any, additionalParams?: any) => Promise<any>
  ) {
    // Ensure clientId is defined
    if (!options.clientId) {
      throw new Error(
        'Client ID is required for refresh token rotation management'
      );
    }
    this.clientId = options.clientId!;
    this.cacheIndex = new CacheIndexManager(cacheManager, options);
  }

  async detectRotation(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    },
    invalidToken?: string
  ): Promise<GetTokenSilentlyResult | undefined> {
    // Only proceed if using localStorage where multiple entries can exist
    if (this.options.cacheLocation !== 'localstorage') {
      return undefined;
    }

    try {
      const audience = options.authorizationParams.audience || 'default';

      // Find candidate refresh tokens efficiently
      const candidateEntries = await this.cacheIndex.findRefreshTokensByClient(
        this.clientId,
        audience
      );

      // Filter out the failed token and try alternatives
      const validCandidates = candidateEntries.filter(
        entry => entry.refresh_token !== invalidToken
      );

      // Try each candidate refresh token
      for (const entry of validCandidates) {
        try {
          const result = await this.tryRefreshToken(
            options,
            entry.refresh_token!
          );

          // If successful, clean up invalidated tokens
          await this.cleanupInvalidated(invalidToken, this.clientId, audience);

          return result;
        } catch (retryError) {
          // Continue to next candidate if this one fails
          continue;
        }
      }
    } catch (error) {
      // Log rotation detection failure for debugging (production-safe)
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[Auth0] Refresh token rotation detection failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return undefined;
  }

  async cleanupInvalidated(
    invalidToken: string | undefined,
    clientId: string,
    audience: string
  ): Promise<void> {
    if (!invalidToken) {
      return;
    }

    try {
      const keysToCleanup = await this.findKeysWithInvalidToken(
        invalidToken,
        clientId,
        audience
      );
      await this.removeInvalidatedKeys(keysToCleanup);
    } catch (error) {
      this.logCleanupError(error);
    }
  }

  /**
   * Finds cache keys that contain the invalidated refresh token
   */
  private async findKeysWithInvalidToken(
    invalidToken: string,
    clientId: string,
    audience: string
  ): Promise<string[]> {
    const cache = (this.cacheManager as any).cache;
    const cacheKeys = await CacheUtils.getAllCacheKeys(cache);
    const keysToCleanup: string[] = [];

    for (const key of cacheKeys) {
      if (
        await this.shouldCleanupKey(
          key,
          invalidToken,
          clientId,
          audience,
          cache
        )
      ) {
        keysToCleanup.push(key);
      }
    }

    return keysToCleanup;
  }

  /**
   * Determines if a cache key should be cleaned up based on invalidated token
   */
  private async shouldCleanupKey(
    key: string,
    invalidToken: string,
    clientId: string,
    audience: string,
    cache: any
  ): Promise<boolean> {
    const cacheKey = CacheKey.fromKey(key);

    if (
      cacheKey.clientId !== clientId ||
      cacheKey.audience !== audience ||
      !cacheKey.scope
    ) {
      return false;
    }

    const entry = await cache.get(key);
    return entry?.refresh_token === invalidToken;
  }

  /**
   * Removes invalidated keys from cache and key manifest
   */
  private async removeInvalidatedKeys(keysToCleanup: string[]): Promise<void> {
    const cache = (this.cacheManager as any).cache;
    const keyManifest = (this.cacheManager as any).keyManifest;

    for (const key of keysToCleanup) {
      await cache.remove(key);
      if (keyManifest) {
        await keyManifest.remove(key);
      }
    }
  }

  /**
   * Logs cleanup errors in a production-safe manner
   */
  private logCleanupError(error: unknown): void {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Auth0] Failed to cleanup invalidated refresh tokens:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async tryRefreshToken(
    options: GetTokenSilentlyOptions & {
      authorizationParams: AuthorizationParams & { scope: string };
    },
    refreshToken: string
  ): Promise<GetTokenSilentlyResult> {
    const redirect_uri =
      options.authorizationParams.redirect_uri ||
      this.options.authorizationParams.redirect_uri ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const timeout =
      typeof options.timeoutInSeconds === 'number'
        ? options.timeoutInSeconds * 1000
        : null;

    const tokenResult = await this.requestToken({
      ...options.authorizationParams,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri,
      ...(timeout && { timeout })
    });

    return {
      ...tokenResult,
      scope: options.authorizationParams.scope,
      oauthTokenScope: tokenResult.scope,
      audience: options.authorizationParams.audience || 'default'
    };
  }
}
