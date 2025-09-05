/**
 * Represents the configuration options required for initiating a Custom Token Exchange request
 * following RFC 8693 specifications.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8693 | RFC 8693: OAuth 2.0 Token Exchange}
 */
export type CustomTokenExchangeOptions = {
  /**
   * The type identifier for the subject token being exchanged
   *
   * @pattern
   * - Must be a namespaced URI under your organization's control
   * - Forbidden patterns:
   *   - `^urn:ietf:params:oauth:*` (IETF reserved)
   *   - `^https:\/\/auth0\.com/*` (Auth0 reserved)
   *   - `^urn:auth0:*` (Auth0 reserved)
   *
   * @example
   * "urn:acme:legacy-system-token"
   * "https://api.yourcompany.com/token-type/v1"
   */
  subject_token_type: string;

  /**
   * The opaque token value being exchanged for Auth0 tokens
   *
   * @security
   * - Must be validated in Auth0 Actions using strong cryptographic verification
   * - Implement replay attack protection
   * - Recommended validation libraries: `jose`, `jsonwebtoken`
   *
   * @example
   * "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
   */
  subject_token: string;

  /**
   * The target audience for the requested Auth0 token
   *
   * @remarks
   * Must match exactly with an API identifier configured in your Auth0 tenant.
   * If not provided, falls back to the client's default audience.
   *
   * @example
   * "https://api.your-service.com/v1"
   */
  audience?: string;

  /**
   * Space-separated list of OAuth 2.0 scopes being requested
   *
   * @remarks
   * Subject to API authorization policies configured in Auth0
   *
   * @example
   * "openid profile email read:data write:data"
   */
  scope?: string;

  /**
   * Additional custom parameters for Auth0 Action processing
   *
   * @remarks
   * Accessible in Action code via `event.request.body`
   *
   * @example
   * ```typescript
   * {
   *   custom_parameter: "session_context",
   *   device_fingerprint: "a3d8f7...",
   * }
   * ```
   */
  [key: string]: unknown;
};
