## Online Access (Online Refresh Tokens)

> [!NOTE]
> Online Access (Online Refresh Tokens) support via SDKs is currently in Early Access. To request access to this feature, contact your Auth0 representative.

> [!WARNING]
> Online Refresh Tokens do not currently support resource servers with **Ephemeral Sessions** enabled. If a resource server has both `allow_online_access` and "Allow for Ephemeral Sessions" enabled, the authorization server issues an Online Refresh Token at login that is then rejected with `invalid_grant` (`"Unknown or invalid refresh token"`) on the very next refresh — this is a known backend limitation, not a client-side defect. Until Ephemeral Sessions support is added for Online Refresh Tokens, disable "Allow for Ephemeral Sessions" on any resource server used with `refreshTokenMode: RefreshTokenMode.Online`.

**Online Refresh Tokens (ORTs)** are a refresh token type bound to the lifetime of the user's Auth0 session. See the [Auth0 documentation on Online Refresh Tokens](https://auth0.com/docs/secure/tokens/refresh-tokens/online-refresh-tokens/online-refresh-tokens) for the full conceptual overview. Unlike the rotating [offline refresh tokens](refresh-tokens.md#refresh-tokens) described above, an ORT is:

- **Session-bound** — it is valid only while the underlying Auth0 session is active. When the session ends (logout, idle/absolute session expiry, or an admin revoking the session), the ORT stops working.
- **Non-rotating** — refreshing an access token with an ORT does **not** issue a new refresh token. The same ORT is reused for the life of the session.

This makes ORTs a good fit for SPAs that want a refresh-token renewal path whose lifetime tracks the SSO session rather than living independently of it.

> [!IMPORTANT]
> Online access requires DPoP. Sender-constraining the token via [DPoP](dpop.md#device-bound-tokens-with-dpop) is mandatory because the ORT is non-rotating — binding it to the browser's key pair is what mitigates token replay if it is exfiltrated. You must set `useDpop: true` explicitly; the SDK does not enable it for you.

### Enabling Online Access

Set `refreshTokenMode` to `RefreshTokenMode.Online` together with `useRefreshTokens: true` and `useDpop: true`:

```js
import { createAuth0Client, RefreshTokenMode } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true, // required — online access is a refresh-token grant
  refreshTokenMode: RefreshTokenMode.Online,
  useDpop: true, // required — DPoP is mandatory for online access
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

`refreshTokenMode` is a sub-option of `useRefreshTokens`. It defaults to `RefreshTokenMode.Offline` (the rotating [offline refresh tokens](refresh-tokens.md#refresh-tokens) described above); setting it to `RefreshTokenMode.Online` opts into Online Refresh Tokens. Always reference the exported `RefreshTokenMode` enum rather than hard-coding the mode.

Enabling this option causes the SDK to:

- Send the `online_access` scope to the authorization server (instead of `offline_access`). You do **not** need to add it to `authorizationParams.scope` yourself — the SDK injects it.
- Route token renewal through the `refresh_token` grant against `/oauth/token` (the same path used by offline refresh tokens), rather than a hidden iframe.
- Store the non-rotating ORT in the existing cache and reuse it on every refresh, never replacing it.

> [!NOTE]
> Online access is **opt-in**. When `refreshTokenMode` is unset or `RefreshTokenMode.Offline`, the SDK behaves exactly as before.

### `RefreshTokenMode.Offline` vs. `RefreshTokenMode.Online`

`refreshTokenMode` selects which refresh-token type the refresh-token grant uses. It is a sub-option of `useRefreshTokens` (which must be `true` for either mode) and defaults to `RefreshTokenMode.Offline`:

| | `RefreshTokenMode.Offline` (default) | `RefreshTokenMode.Online` |
| --- | --- | --- |
| Requires | `useRefreshTokens: true` | `useRefreshTokens: true` + `useDpop: true` |
| Scope injected | `offline_access` | `online_access` |
| Token lifetime | Independent of the session (survives logout until revoked/expired) | Bound to the Auth0 session |
| Rotation | Rotating (a new RT is issued on each refresh) | Non-rotating (same RT reused) |
| DPoP | Optional | **Required** (`useDpop: true`) |

The two modes inject mutually exclusive scopes (`offline_access` vs. `online_access`), so the SDK emits only one — it never sends both. You select between them with `refreshTokenMode`, not by combining flags.

### Configuration validation

The SDK enforces the DPoP requirement at two layers:

1. **Compile-time (TypeScript).** When you call `createAuth0Client` with `refreshTokenMode: RefreshTokenMode.Online`, the compiler requires both `useRefreshTokens: true` and `useDpop: true`:

   ```ts
   import { createAuth0Client, RefreshTokenMode } from '@auth0/auth0-spa-js';

   // ❌ compile error: `useRefreshTokens: true` and `useDpop: true` are required for online mode
   createAuth0Client({ domain, clientId, refreshTokenMode: RefreshTokenMode.Online });

   // ❌ compile error: `useDpop: true` is still required
   createAuth0Client({ domain, clientId, refreshTokenMode: RefreshTokenMode.Online, useRefreshTokens: true });

   // ✅ valid
   createAuth0Client({ domain, clientId, refreshTokenMode: RefreshTokenMode.Online, useRefreshTokens: true, useDpop: true });
   ```

   > [!NOTE]
   > The compile-time check narrows on the online mode value. A dynamically-typed value (e.g. a `refreshTokenMode` read from config at runtime), an `as any` cast, or plain JavaScript all bypass it — which is why the runtime check below exists too.

2. **Runtime (all consumers, including plain JS).** The `Auth0Client` constructor throws an `InvalidConfigurationError` when online mode is requested but `useRefreshTokens` or `useDpop` is not `true`. The error's `suggestion` tells you exactly which option to set:

   ```js
   import { createAuth0Client, RefreshTokenMode, InvalidConfigurationError } from '@auth0/auth0-spa-js';

   try {
     const auth0 = await createAuth0Client({
       domain: '<AUTH0_DOMAIN>',
       clientId: '<AUTH0_CLIENT_ID>',
       refreshTokenMode: RefreshTokenMode.Online,
       useRefreshTokens: true // missing useDpop: true
     });
   } catch (e) {
     if (e instanceof InvalidConfigurationError) {
       console.error(e.error_description); // includes the suggested fix
       console.error(e.suggestion); // 'Set `useDpop: true` (DPoP is mandatory for online access).'
     }
   }
   ```

### Logging out

Because an ORT is bound to the Auth0 session, the way to invalidate it is to end the session with `logout()`, which clears the local cache and redirects to `/v2/logout`:

```js
await auth0.logout({ logoutParams: { returnTo: window.location.origin } });
```

After logout, the ORT is no longer valid; a subsequent `getTokenSilently()` falls through to the [iframe fallback](refresh-tokens.md#refresh-token-fallback) (if `useRefreshTokensFallback` is enabled) and ultimately to an interactive login.

> [!WARNING]
> In online mode, [`revokeRefreshToken()`](refresh-tokens.md#revoking-refresh-tokens) revokes the ORT at the authorization server **and terminates the Auth0 session**. The entire local cache (access token, ID token, user profile) is cleared immediately — `isAuthenticated()` returns `false` right away. Redirect the user to login after calling this. Use `logout()` instead if you want a redirect-based sign-out.

### Using with Multi-Resource Refresh Tokens (MRRT)

Online access is compatible with [MRRT](refresh-tokens.md#using-multi-resource-refresh-tokens): a single ORT can be exchanged for access tokens across the audiences allowed by your refresh-token policies. The ORT remains non-rotating throughout — the same token is reused for every cross-audience exchange.

```js
import { createAuth0Client, RefreshTokenMode } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  refreshTokenMode: RefreshTokenMode.Online,
  useDpop: true,
  useMrrt: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
    audience: 'https://api.example.com'
  }
});
```
