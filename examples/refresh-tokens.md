## Refresh Tokens

Refresh tokens can be used to request new access tokens. [Read more about how our refresh tokens work for browser-based applications](https://auth0.com/docs/tokens/concepts/refresh-token-rotation) to help you decide whether or not you need to use them.

To enable the use of refresh tokens, set the `useRefreshTokens` option to `true`:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

Using this setting will cause the SDK to automatically send the `offline_access` scope to the authorization server. Refresh tokens will then be used to exchange for new access tokens instead of using a hidden iframe, and calls the `/oauth/token` endpoint directly. This means that in most cases the SDK does not rely on third-party cookies when using refresh tokens.

**Note** This configuration option requires Rotating Refresh Tokens to be [enabled for your Auth0 Tenant](https://auth0.com/docs/tokens/guides/configure-refresh-token-rotation).

### Refresh Token fallback

In all cases where a refresh token is not available, the SDK falls back to the standard technique of using a hidden iframe with `prompt=none` to try and get a new access token and refresh token. This scenario would occur for example if you are using the in-memory cache and you have refreshed the page. In this case, any refresh token that was stored previously would be lost.

If the fallback mechanism fails, a `login_required` error will be thrown and could be handled in order to put the user back through the authentication process.

**Note**: This fallback mechanism does still require access to the Auth0 session cookie, so if third-party cookies are being blocked then this fallback will not work and the user must re-authenticate in order to get a new refresh token.

### Using Multi-Resource Refresh Tokens

Refresh tokens from one API can be used to request new access tokens for another API. [Read more about how MRRT works for browser-based applications](https://auth0.com/docs/secure/tokens/refresh-tokens/multi-resource-refresh-token) to help you decide wether or not you need to use this funcfionality.

To enable the use of MRRT, set the `useMrrt` option to `true`, and as well enable the use of refresh tokens:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  useMrrt: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

Using this setting will make the SDK able to reuse the refresh token not only for APIs requested at login, but also for additional APIs allowed in the MRRT policy.

**Note**: This configuration option requires the refresh token policies of your application [to be configured](https://auth0.com/docs/secure/tokens/refresh-tokens/multi-resource-refresh-token/configure-and-implement-multi-resource-refresh-token).

##### Configuring Scopes Per Audience

When working with multiple APIs, you can define different default scopes for each audience by passing an object instead of a string. This is particularly useful when different APIs require different default scopes:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  useMrrt: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
    audience: 'https://api.example.com', // Default audience
    scope: {
      'https://api.example.com':
        'openid profile email offline_access read:products read:orders',
      'https://analytics.example.com':
        'openid profile email offline_access read:analytics write:analytics',
      'https://admin.example.com':
        'openid profile email offline_access read:admin write:admin delete:admin'
    }
  }
});
```

**How it works:**

- Each key in the `scope` object is an `audience` identifier
- The corresponding value is the scope string for that audience
- When calling `getAccessToken({ audience: "..." })`, the SDK automatically uses the configured scopes for that audience. When scopes are also passed in the method call, they will be merged with the default scopes for that audience.

> [!NOTE]
> This new option only works in the initialization of the client, it's not applicable to other runtime methods.
> When using scope as an object, and no entry for the default audience is provided, the SDK will use the scopes of the `DEFAULT_AUDIENCE`. Those will be `openid, email, profile` and `offline_access` if `useRefreshTokens` is enabled.

### Revoking Refresh Tokens

The `revokeRefreshToken()` method explicitly revokes a refresh token via the `/oauth/revoke` endpoint ([RFC 7009](https://www.rfc-editor.org/rfc/rfc7009)). This invalidates the refresh token so it can no longer be used to obtain new access tokens.

This method only has an effect when `useRefreshTokens` is `true`. If refresh tokens are disabled it returns immediately without doing anything.

> [!WARNING]
> In [online access](online-access.md#online-access-online-refresh-tokens) mode (`refreshTokenMode: RefreshTokenMode.Online`), `revokeRefreshToken()` behaves differently from offline mode:
> - The ORT **is** revoked at the authorization server via `/oauth/revoke`.
> - Because the ORT is session-bound, the Auth0 **session is terminated server-side** as part of revocation.
> - The entire local cache is cleared immediately — the access token, ID token, and user profile are wiped. `isAuthenticated()` returns `false` and `getUser()` returns `undefined` right away.
>
> After calling `revokeRefreshToken()` in online mode, redirect the user to login — `getTokenSilently()` will fail because the session is gone. For a redirect-based sign-out, `logout()` achieves the same result.

```js
// Revoke the refresh token for the default audience
await auth0.revokeRefreshToken();
```

**How it affects the cache:**
- **Offline mode:** only the refresh token entry is cleared — the access token remains in cache until it expires. Once it expires, `getTokenSilently()` will attempt silent auth (via iframe, if `useRefreshTokensFallback` is enabled and the Auth0 session is still active) before requiring a new interactive login.
- **Online mode:** the entire local cache is cleared (access token, ID token, user profile). `isAuthenticated()` returns `false` immediately. The user must log in again.

**Difference from `logout()`:**
- In **offline mode**, `revokeRefreshToken()` invalidates the rotating refresh token at the server and strips it from the cache, but does **not** terminate the Auth0 session or clear the rest of the local cache (access token, ID token, user profile remain until they expire).
- In **online mode**, `revokeRefreshToken()` terminates the Auth0 session server-side and clears the entire local cache immediately — equivalent to a silent `logout()` without a redirect.

In both modes, if you want a **redirect-based** sign-out, use `logout()` instead.

#### Error Handling

`revokeRefreshToken()` throws a `GenericError` if the `/oauth/revoke` endpoint returns an error (for example, if the token has already been revoked or is invalid). Wrap the call in a try/catch:

```js
import { GenericError } from '@auth0/auth0-spa-js';

try {
  await auth0.revokeRefreshToken();
} catch (e) {
  if (e instanceof GenericError) {
    console.error(e.error, e.error_description);
  }
}
```

#### Revoking Refresh Tokens for Multiple Audiences

If your application requests tokens for more than one audience, each audience may have its own refresh token. Call `revokeRefreshToken()` once per audience to revoke them all:

```js
await auth0.revokeRefreshToken({ audience: 'https://api.example.com' });
await auth0.revokeRefreshToken({ audience: 'https://api2.example.com' });
```

Omitting the `audience` option targets the audience configured in `authorizationParams` (or the default audience if none is set).

#### Multiple Refresh Tokens per Audience

A single audience can accumulate more than one refresh token if different scope combinations were obtained through separate authorization flows. A single `revokeRefreshToken()` call handles all of them — the SDK collects every distinct refresh token stored for that audience and revokes them sequentially in one call.

If one revocation fails, the error is thrown immediately. Any tokens already revoked in that sequence are stripped from the cache; the remaining ones are left untouched.

#### Revoking Refresh Tokens with MRRT

When using [Multi-Resource Refresh Tokens (MRRT)](#using-multi-resource-refresh-tokens), a single refresh token may cover multiple audiences. Revoking it for any one of those audiences invalidates the shared token and clears all cache entries that reference it:

```js
// With MRRT, this single call revokes the shared token and
// cleans up all cache entries that reference it
await auth0.revokeRefreshToken();
```
