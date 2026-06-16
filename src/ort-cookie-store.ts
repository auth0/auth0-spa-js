import * as Cookies from 'es-cookie';

/**
 * Cookie-based store for Online Refresh Tokens (ORTs).
 *
 * Stores only the refresh token string — not the full cache entry — so the
 * value is a plain opaque string well under the 4 KB per-cookie browser limit.
 * Access tokens and ID tokens continue to live in the configured ICache
 * (memory by default).
 *
 * Cookie attributes:
 *   - expires: omitted → session cookie (cleared when browser closes)
 *   - SameSite: Strict
 *   - Secure: set when served over HTTPS
 *
 * The session-cookie lifetime satisfies the PRD requirement that ORTs must not
 * survive a browser close for ephemeral sessions.
 */
export class OrtCookieStore {
  private readonly domain: string | undefined;

  constructor(cookieDomain?: string) {
    this.domain = cookieDomain;
  }

  /**
   * Derives a stable cookie name from clientId + audience.
   * Format: @@auth0spajs@@::{clientId}::ort::{audience}
   */
  private cookieName(clientId: string, audience: string): string {
    return `@@auth0spajs@@::${clientId}::ort::${audience}`;
  }

  get(clientId: string, audience: string): string | undefined {
    return Cookies.get(this.cookieName(clientId, audience));
  }

  set(clientId: string, audience: string, refreshToken: string): void {
    const attrs: Cookies.CookieAttributes = {
      sameSite: 'strict',
      // No `expires` → session cookie; cleared when browser closes
    };

    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      attrs.secure = true;
    }

    if (this.domain) {
      attrs.domain = this.domain;
    }

    Cookies.set(this.cookieName(clientId, audience), refreshToken, attrs);
  }

  remove(clientId: string, audience: string): void {
    const attrs: Cookies.CookieAttributes = {};

    if (this.domain) {
      attrs.domain = this.domain;
    }

    Cookies.remove(this.cookieName(clientId, audience), attrs);
  }

  /**
   * Removes all ORT cookies for a given clientId across all audiences.
   * Used by logout().
   */
  clearByClientId(clientId: string): void {
    const prefix = `@@auth0spajs@@::${clientId}::ort::`;
    const all = Cookies.getAll();

    for (const name of Object.keys(all)) {
      if (name.startsWith(prefix)) {
        const attrs: Cookies.CookieAttributes = {};

        if (this.domain) {
          attrs.domain = this.domain;
        }

        Cookies.remove(name, attrs);
      }
    }
  }

  /**
   * Removes all ORT cookies regardless of clientId.
   * Used by logout() when clientId is null (clear-all).
   */
  clearAll(): void {
    const prefix = '@@auth0spajs@@::';
    const suffix = '::ort::';
    const all = Cookies.getAll();

    for (const name of Object.keys(all)) {
      if (name.startsWith(prefix) && name.includes(suffix)) {
        const attrs: Cookies.CookieAttributes = {};

        if (this.domain) {
          attrs.domain = this.domain;
        }

        Cookies.remove(name, attrs);
      }
    }
  }
}
