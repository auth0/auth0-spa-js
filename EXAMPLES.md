# Examples

- [Logging Out](#logging-out)
- [Calling an API](#calling-an-api)
- [Refresh Tokens](#refresh-tokens)
- [Online Access (Online Refresh Tokens)](#online-access-online-refresh-tokens)
- [Data Caching Options](#creating-a-custom-cache)
- [Organizations](#organizations)
- [Native to Web SSO](#native-to-web-sso)
- [Custom Token Exchange (CTE)](#custom-token-exchange-cte)
- [Device-bound tokens with DPoP](#device-bound-tokens-with-dpop)
- [Connect Accounts for using Token Vault](#connect-accounts-for-using-token-vault)
- [Accessing SDK Configuration](#accessing-sdk-configuration)
- [Passkeys](#passkeys)
- [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
- [Step-Up Authentication](#step-up-authentication)
- [MyAccount API](#myaccount-api)
- [Session Expiry from Upstream IdP (IPSIE)](#session-expiry-from-upstream-idp-ipsie)

## Logging Out

```html
<button id="logout">Logout</button>
```

```js
document.getElementById('logout').addEventListener('click', () => {
  auth0.logout();
});
```

You can redirect users back to your app after logging out. This URL must appear in the **Allowed Logout URLs** setting for the app in your [Auth0 Dashboard](https://manage.auth0.com):

```js
auth0.logout({
  logoutParams: {
    returnTo: 'https://your.custom.url.example.com/'
  }
});
```

## Calling an API

Retrieve an access token to pass along in the `Authorization` header using the `getTokenSilently` API.

```html
<button id="call-api">Call an API</button>
```

```js
//with async/await
document.getElementById('call-api').addEventListener('click', async () => {
  const accessToken = await auth0.getTokenSilently();
  const result = await fetch('https://myapi.com', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await result.json();
  console.log(data);
});
```

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

> [!NOTE]
> In [online access](#online-access-online-refresh-tokens) mode (`refreshTokenMode: RefreshTokenMode.Online`), `revokeRefreshToken()` only clears the cached refresh token locally — it does **not** revoke the Online Refresh Token at the authorization server. Online Refresh Tokens are non-rotating and session-bound, and the server does not support token-only revocation for them. To end an online session, call `logout()` instead, which terminates the session and thereby invalidates the ORT.

```js
// Revoke the refresh token for the default audience
await auth0.revokeRefreshToken();
```

**How it affects the cache:** The access token is preserved in the cache — only the refresh token entry is cleared. Once the access token expires, `getTokenSilently()` will attempt silent auth (via iframe, if `useRefreshTokensFallback` is enabled and the Auth0 session is still active) before requiring a new interactive login.

**Difference from `logout()`:** `revokeRefreshToken()` invalidates the refresh token on the Auth0 server and removes it from the local cache, but it does **not** clear the user's Auth0 session or the rest of the local cache. If you want to fully terminate the session, use `logout()` instead.

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

## Online Access (Online Refresh Tokens)

**Online Refresh Tokens (ORTs)** are a refresh token type bound to the lifetime of the user's Auth0 session. Unlike the rotating [offline refresh tokens](#refresh-tokens) described above, an ORT is:

- **Session-bound** — it is valid only while the underlying Auth0 session is active. When the session ends (logout, idle/absolute session expiry, or an admin revoking the session), the ORT stops working.
- **Non-rotating** — refreshing an access token with an ORT does **not** issue a new refresh token. The same ORT is reused for the life of the session.

This makes ORTs a good fit for SPAs that want a refresh-token renewal path whose lifetime tracks the SSO session rather than living independently of it.

> [!IMPORTANT]
> Online access requires DPoP. Sender-constraining the token via [DPoP](#device-bound-tokens-with-dpop) is mandatory because the ORT is non-rotating — binding it to the browser's key pair is what mitigates token replay if it is exfiltrated. You must set `useDpop: true` explicitly; the SDK does not enable it for you.

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

`refreshTokenMode` is a sub-option of `useRefreshTokens`. It defaults to `RefreshTokenMode.Offline` (the rotating [offline refresh tokens](#refresh-tokens) described above); setting it to `RefreshTokenMode.Online` opts into Online Refresh Tokens. Always reference the exported `RefreshTokenMode` enum rather than hard-coding the mode.

Enabling this option causes the SDK to:

- Send the `online_access` scope to the authorization server (instead of `offline_access`). You do **not** need to add it to `authorizationParams.scope` yourself — the SDK injects it.
- Route token renewal through the `refresh_token` grant against `/oauth/token` (the same path used by offline refresh tokens), rather than a hidden iframe.
- Store the non-rotating ORT in the existing cache and reuse it on every refresh, never replacing it.

> [!NOTE]
> Online access is **opt-in**. When `refreshTokenMode` is unset or `RefreshTokenMode.Offline`, the SDK behaves exactly as before.

> [!NOTE]
> This feature requires the `online_refresh_tokens` flag to be enabled for your tenant and `allow_online_access` to be enabled on the resource server (on by default).

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

After logout, the ORT is no longer valid; a subsequent `getTokenSilently()` falls through to the [iframe fallback](#refresh-token-fallback) (if `useRefreshTokensFallback` is enabled) and ultimately to an interactive login.

> [!NOTE]
> In online mode, [`revokeRefreshToken()`](#revoking-refresh-tokens) only clears the cached token locally — it does **not** revoke the ORT at the authorization server. The server has no token-only revocation for non-rotating ORTs, so `logout()` is the only way to invalidate an ORT.

### Using with Multi-Resource Refresh Tokens (MRRT)

Online access is compatible with [MRRT](#using-multi-resource-refresh-tokens): a single ORT can be exchanged for access tokens across the audiences allowed by your refresh-token policies. The ORT remains non-rotating throughout — the same token is reused for every cross-audience exchange.

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

## Data caching options

The SDK can be configured to cache ID tokens and access tokens either in memory or in local storage. The default is in memory. This setting can be controlled using the `cacheLocation` option when creating the Auth0 client.

To use the in-memory mode, no additional options need are required as this is the default setting. To configure the SDK to cache data using local storage, set `cacheLocation` as follows:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',,
  cacheLocation: 'localstorage' // valid values are: 'memory' or 'localstorage',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

**Important:** This feature will allow the caching of data **such as ID and access tokens** to be stored in local storage. Exercising this option changes the security characteristics of your application and **should not be used lightly**. Extra care should be taken to mitigate against XSS attacks and minimize the risk of tokens being stolen from local storage.

### Creating a custom cache

The SDK can be configured to use a custom cache store that is implemented by your application. This is useful if you are using this SDK in an environment where more secure token storage is available, such as potentially a hybrid mobile app.

To do this, provide an object to the `cache` property of the SDK configuration.

The object should implement the following functions. Note that all of these functions can optionally return a Promise or a static value.

| Signature                        | Return type                    | Description                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get(key)`                       | Promise<object> or object      | Returns the item from the cache with the specified key, or `undefined` if it was not found                                                                                                                                                                                                        |
| `set(key: string, object: any) ` | Promise<void> or void          | Sets an item into the cache                                                                                                                                                                                                                                                                       |
| `remove(key)`                    | Promise<void> or void          | Removes a single item from the cache at the specified key, or no-op if the item was not found                                                                                                                                                                                                     |
| `allKeys()`                      | Promise<string[]> or string [] | (optional) Implement this if your cache has the ability to return a list of all keys. Otherwise, the SDK internally records its own key manifest using your cache. **Note**: if you only want to ensure you only return keys used by this SDK, the keys we use are prefixed with `@@auth0spajs@@` |

Here's an example of a custom cache implementation that uses `sessionStorage` to store tokens and apply it to the Auth0 SPA SDK:

```js
const sessionStorageCache = {
  get: function (key) {
    return JSON.parse(sessionStorage.getItem(key));
  },

  set: function (key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  remove: function (key) {
    sessionStorage.removeItem(key);
  },

  // Optional
  allKeys: function () {
    return Object.keys(sessionStorage);
  }
};

await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  cache: sessionStorageCache,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

**Note:** The `cache` property takes precedence over the `cacheLocation` property if both are set. A warning is displayed in the console if this scenario occurs.

We also export the internal `InMemoryCache` and `LocalStorageCache` implementations, so you can wrap your custom cache around these implementations if you wish.

## Organizations

[Organizations](https://auth0.com/docs/organizations) is a set of features that provide better support for developers who build and maintain SaaS and Business-to-Business (B2B) applications.

### Log in to an organization

Log in to an organization by specifying the `organization` parameter when setting up the client:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});
```

You can also specify the organization when logging in:

```js
// Using a redirect
await client.loginWithRedirect({
  authorizationParams: {
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});

// Using a popup window
await client.loginWithPopup({
  authorizationParams: {
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});
```

### Switch to a different organization

When working with multiple organizations, there might be a situation where you want your users to be able to switch between different organizations.

To do this, clear the local logged in state from your application and login to Auth0 again, leveraging any existing Auth0 session to prevent the user from being prompted for their credentials.

```ts
async function switchOrganization(newOrganization: string) {
  await client.logout({ openUrl: false });
  await client.loginWithRedirect({
    authorizationParams: {
      organization: newOrganization
    }
  });
}
```

**Note:** Ensure to pass any additional parameters to `loginWithRedirect` (or `loginWithPopup`) just as you might have passed on other occurences of calling login.

### Accept user invitations

Accept a user invitation through the SDK by creating a route within your application that can handle the user invitation URL, and log the user in by passing the `organization` and `invitation` parameters from this URL. You can either use `loginWithRedirect` or `loginWithPopup` as needed.

```js
const url = new URL(invitationUrl);
const params = new URLSearchParams(url.search);
const organization = params.get('organization');
const invitation = params.get('invitation');

if (organization && invitation) {
  await client.loginWithRedirect({
    authorizationParams: {
      invitation,
      organization
    }
  });
}
```

## Native to Web SSO

[Native to Web SSO](https://auth0.com/docs/authenticate/single-sign-on/native-to-web) enables seamless single sign-on when users transition from a native mobile application to a web application. The SDK can automatically extract session transfer tokens from URL query parameters and include them in authorization requests.

### Configuring Session Transfer Token Detection

To enable Native to Web SSO, configure the `sessionTransferTokenQueryParamName` option with the name of the query parameter that contains the session transfer token:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token', // Enable and configure
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// When your web app is opened with:
// https://yourapp.com?session_transfer_token=xyz123

// The SDK automatically includes the token in authorization:
await auth0.loginWithRedirect();
// The /authorize request will include session_transfer_token=xyz123
```

**Default:** The feature is **disabled by default** (`undefined`). You must explicitly configure a parameter name to enable it.

**Important:** After extracting the token, the SDK automatically removes it from the URL using `window.history.replaceState()`. This prevents the token from being accidentally reused on subsequent authentication requests, which is important since session transfer tokens are typically single-use.

### Using Custom Parameter Names

You can configure the SDK to extract the session transfer token from any query parameter name. This is useful if your native app uses a custom parameter name:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'stt', // Custom parameter name
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// When your web app is opened with:
// https://yourapp.com?stt=xyz123

// The SDK extracts the token and sends it to Auth0 as session_transfer_token:
await auth0.loginWithRedirect();
```

The token is always sent to Auth0's `/authorize` endpoint as `session_transfer_token`, regardless of the parameter name you use in your app's URL.

### Using with loginWithPopup

The SDK supports Native to Web SSO with both `loginWithRedirect()` and `loginWithPopup()`. The session transfer token is automatically extracted from the URL and cleaned after use in both flows:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token'
});

// When your web app is opened with:
// https://yourapp.com?session_transfer_token=xyz123

// The SDK automatically includes the token in loginWithPopup:
await auth0.loginWithPopup();

// After login completes, the URL is cleaned:
// https://yourapp.com
```

This is particularly useful for web applications that prefer popup-based authentication flows, as the main page URL persists throughout the login process (unlike redirect flows where the browser navigates away).

### Manually Providing Session Transfer Token

You can also manually provide the session transfer token in `authorizationParams`, which overrides automatic detection:

```js
// Extract token from URL manually
const params = new URLSearchParams(window.location.search);
const sessionTransferToken = params.get('my_custom_param');

if (sessionTransferToken) {
  await auth0.loginWithRedirect({
    authorizationParams: {
      session_transfer_token: sessionTransferToken
    }
  });
}
```

**Note:** Manually provided tokens take precedence over automatically detected ones. When you provide a token manually, the URL is not automatically cleaned.

### Using with Organizations

When using Native to Web SSO with [Organizations](https://auth0.com/docs/manage-users/organizations), ensure the `organization` parameter in your web application matches the organization associated with the session transfer token:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token'
});

// The native app authenticated with org_abc123
// The web app must use the same organization
await auth0.loginWithRedirect({
  authorizationParams: {
    organization: 'org_abc123'
    // session_transfer_token is automatically included from URL
  }
});
```

If there is an organization mismatch, authentication will fail and the user will be prompted to log in again.

## Custom Token Exchange (CTE)

Enable secure token exchange between external identity providers and Auth0 using RFC 8693 standards.

### Basic Implementation

```js
// Initialize client with custom token exchange configuration
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    audience: 'https://your-api.example.com'
  }
});

// Exchange external token for Auth0 tokens and log user in
async function performTokenExchange() {
  try {
    // Option 1: Use client's default audience
    const tokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      scope: 'openid profile email'
      // audience will default to audience from client config
    });

    // Option 2: Specify custom audience for this token exchange
    const customTokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      audience: 'https://different-api.example.com',
      scope: 'openid profile read:records'
    });

    // Option 3: Exchange token within an organization context
    const orgTokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      organization: '<MY_ORG_ID_OR_NAME>', // Organization ID or name
      scope: 'openid profile email'
    });

    console.log('Received tokens:', tokenResponse);

    // User is now logged in - you can access user info
    const user = await auth0.getUser();
    console.log('Logged in user:', user);
  } catch (error) {
    console.error('Exchange failed:', error);
  }
}

// Note: exchangeToken() is deprecated - use loginWithCustomTokenExchange() instead
```

### Required Auth0 Configuration

1. **Create Token Exchange Profile** in Auth0 Dashboard:

```typescript
await managementClient.tokenExchangeProfiles.create({
  action_id: 'custom-auth-action',
  name: 'External System Exchange',
  subject_token_type: 'urn:example:external-token',
  type: 'custom_authentication'
});
```

2. **Add Required Scopes** to your API in Auth0:

```
urn:auth0:oauth2:grant-type:token-exchange
```

### Security Considerations

- Validate external tokens in Auth0 Actions using cryptographic verification
- Implement anti-replay mechanisms for subject tokens
- Store refresh tokens securely when using `offline_access` scope

### Error Handling

```js
async function safeTokenExchange() {
  try {
    return await auth0.loginWithCustomTokenExchange(/* ... */);
  } catch (error) {
    if (error.error === 'invalid_token') {
      // Handle token validation errors
      await auth0.logout();
      window.location.reload();
    }
    if (error.error === 'insufficient_scope') {
      // Request additional scopes
      await auth0.loginWithPopup({
        authorizationParams: {
          scope: 'additional_scope_required'
        }
      });
    }
  }
}
```

### Delegation and Impersonation

Use `customTokenExchange()` when one principal needs to act on behalf of another — for example, an AI agent acting on behalf of a user. Unlike `loginWithCustomTokenExchange()`, this method has no side effects: it does not update the session or affect `isAuthenticated()` / `getUser()`.

Pass `actor_token` and `actor_token_type` alongside the subject token to identify the acting party per [RFC 8693](https://tools.ietf.org/html/rfc8693):

```js
const tokenResponse = await auth0.customTokenExchange({
  subject_token: '<USER_TOKEN>',
  subject_token_type: 'urn:acme:user-token',
  actor_token: '<AGENT_TOKEN>',
  actor_token_type: 'https://idp.example.com/token-type/agent',
  audience: 'https://api.example.com'
});

// Use tokenResponse.access_token to call a downstream API
// The current user session is unchanged
```

[Token Exchange Documentation](https://auth0.com/docs/authenticate/login/token-exchange)
[RFC 8693 Spec](https://tools.ietf.org/html/rfc8693)

## Device-bound tokens with DPoP

**Demonstrating Proof-of-Possession** —or simply **DPoP**— is a recent OAuth 2.0 extension defined in [RFC9449](https://datatracker.ietf.org/doc/html/rfc9449).

It defines a mechanism for securely binding tokens to a specific device using cryptographic signatures. Without it, **a token leak caused by XSS or other vulnerabilities could allow an attacker to impersonate the real user.**

To support DPoP in `auth0-spa-js`, some APIs available in modern browsers are required:

- [Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto): allows to create and use cryptographic keys, which are used to generate the proofs (i.e. signatures) required for DPoP.

- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): enables the use of cryptographic keys [without exposing the private material](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto#storing_keys).

The following OAuth 2.0 flows are currently supported by `auth0-spa-js`:

- [Authorization Code Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow) (`authorization_code`).

- [Refresh Token Flow](https://auth0.com/docs/secure/tokens/refresh-tokens) (`refresh_token`).

- [Custom Token Exchange Flow](https://auth0.com/docs/authenticate/custom-token-exchange) (`urn:ietf:params:oauth:grant-type:token-exchange`).

> [!IMPORTANT]
> Currently, only the `ES256` algorithm is supported.

### Enabling DPoP

DPoP is disabled by default. To enable it, set the `useDpop` option to `true` when creating the SDK instance. For example:

```js
const client = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useDpop: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

After enabling DPoP, **every new session using a supported OAuth 2.0 flow in Auth0 will begin transparently to use tokens that are cryptographically bound to the current browser**.

> [!IMPORTANT]
> DPoP will only be used for new user sessions created after enabling it. Any previously existing sessions will continue using non-DPoP tokens until the user logs in again.
>
> You decide how to handle this transition. For example, you might require users to log in again the next time they use your application.

> [!NOTE]
> Using DPoP requires storing some temporary data in the user's browser. When you log the user out with `client.logout()`, this data is deleted.

> [!TIP]
> If all your clients are already using DPoP, you may want to increase security by making Auth0 reject any non-DPoP interactions. See [the docs on Sender Constraining](https://auth0.com/docs/secure/sender-constraining/configure-sender-constraining) for details.

### Using DPoP in your own requests

You use a DPoP token the same way as a "traditional" access token, except it must be sent to the server with an `Authorization: DPoP <token>` header instead of the usual `Authorization: Bearer <token>`.

To determine the type of a token, use the `detailedResponse` option in `getTokenSilently()` to access the `token_type` property, which will be either `DPoP` or `Bearer`.

For internal requests sent by `auth0-spa-js` to Auth0, simply enable the `useDpop` option and **every interaction with Auth0 will be protected**.

However, **to use DPoP with a custom, external API, some additional work is required**. The `Auth0Client` class provides some low-level methods to help with this:

- `getDpopNonce()`
- `setDpopNonce()`
- `generateDpopProof()`

However, due to the nature of how DPoP works, **this is not a trivial task**:

- When a nonce is missing or expired, the request may need to be retried.
- Received nonces must be stored and managed.
- DPoP headers must be generated and included in every request, and regenerated for retries.

Because of this, we recommend using the provided `fetchWithAuth()` method, which **handles all of this for you**.

#### Simple usage

The `fetchWithAuth()` method is a drop-in replacement for the native `fetch()` function from the Fetch API, so if you're already using it, the change will be minimal.

For example, if you had this code:

```js
await fetch('https://api.example.com/foo', {
  method: 'GET',
  headers: { 'user-agent': 'My Client 1.0' }
});

console.log(response.status);
console.log(response.headers);
console.log(await response.json());
```

You would change it as follows:

```js
const fetcher = client.createFetcher({
  dpopNonceId: 'my_api_request'
});

await fetcher.fetchWithAuth('https://api.example.com/foo', {
  method: 'GET',
  headers: { 'user-agent': 'My Client 1.0' }
});

console.log(response.status);
console.log(response.headers);
console.log(await response.json());
```

When using `fetchWithAuth()`, the following will be handled for you automatically:

- Use `getTokenSilently()` to get the access token to inject in the headers.
- Generate and inject DPoP headers when needed.
- Store and update any DPoP nonces.
- Handle retries caused by a rejected nonce.

> [!IMPORTANT]
> If your API requires DPoP, a `dpopNonceId` **must** be present in the `createFetcher()` parameters, since it’s used to keep track of the DPoP nonces for each request.

#### Advanced usage

If you need something more complex than the example above, you can provide a custom implementation in the `fetch` property.

However, since `auth0-spa-js` needs to make decisions based on HTTP responses, your implementation **must return an object with _at least_ two properties**:

1. `status`: the response status code as a number.
2. `headers`: the response headers as a plain object or as a Fetch API’s Headers-like interface.

Whatever it returns, it will be passed as the output of the `fetchWithAuth()` method.

Your implementation will be called with a standard, ready-to-use [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object, which will contain any headers needed for authorization and DPoP usage (if enabled). Depending on your needs, you can use this object directly or treat it as a container with everything required to make the request your own way.

##### Example with `axios`

```js
const fetcher = client.createFetcher({
  dpopNonceId: 'my_api_request',
  fetch: (request) =>
    // The `Request` object has everything you need to do a request in a
    // different library. Make sure that your output meets the requirements
    // about the `status` and `headers` properties.
    axios.request({
      url: request.url,
      method: request.method,
      data: request.body,
      headers: Object.fromEntries(request.headers),
      timeout: 2000,
      // etc.
    }),
  },
});

const response = await fetcher.fetchWithAuth('https://api.example.com/foo', {
  method: 'POST',
  body: JSON.stringify({ name: 'John Doe' }),
  headers: { 'user-agent': 'My Client 1.0' },
});

console.log(response.status);
console.log(response.headers);
console.log(response.data);
```

##### Timeouts with native `fetch()`

The Fetch API doesn’t support passing a timeout value directly; instead, you’re expected to use an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). For example:

```js
const fetcher = client.createFetcher();

await fetcher.fetchWithAuth('https://api.example.com/foo', {
  signal: AbortSignal.timeout(2000)
});
```

This works, but if you define your request parameters statically when your app starts and then call `fetchWithAuth()` after an indeterminate amount of time, you'll find that **the request will timeout immediately**. This happens because the `AbortSignal` **starts counting time as soon as it is created**.

To work around this, you can pass a thin wrapper over the native `fetch()` so that a new `AbortSignal` is created each time a request is made:

```js
const fetcher = client.createFetcher({
  fetch: request => fetch(request, { signal: AbortSignal.timeout(2000) })
});

await fetcher.fetchWithAuth('https://api.example.com/foo');
```

##### Having a base URL

If you need to make requests to different endpoints of the same API, passing a `baseUrl` to `createFetcher()` can be useful:

```js
const fetcher = client.createFetcher({
  baseUrl: 'https://api.example.com'
});

await fetcher.fetchWithAuth('/foo'); // => https://api.example.com/foo
await fetcher.fetchWithAuth('/bar'); // => https://api.example.com/bar
await fetcher.fetchWithAuth('/xyz'); // => https://api.example.com/xyz

// If the passed URL is absolute, `baseUrl` will be ignored for convenience:
await fetcher.fetchWithAuth('https://other-api.example.com/foo');
```

##### Passing an access token

The `fetchWithAuth()` method assumes you’re using the SDK to get the access token for the request. This means that by default, it will always call `getTokenSilently()` internally before making the request.

However, if you already have an access token or need to pass specific parameters to `getTokenSilently()`, you can override this behavior with a custom access token factory, like so:

```js
client.createFetcher({
  getAccessToken: () =>
    client.getTokenSilently({
      authorizationParams: {
        audience: '<SOME_AUDIENCE>',
        scope: '<SOME_SCOPE>'
        // etc.
      }
    }),
  detailedResponse: true // If you need a mix of DPoP and Bearer tokens per fetcher, it will need to know the token type.
});
```

## Connect Accounts for using Token Vault

The Connect Accounts feature uses the Auth0 My Account API to allow users to link multiple third party accounts to a single Auth0 user profile.

When using Connected Accounts, Auth0 acquires tokens from upstream Identity Providers (like Google) and stores them in a secure [Token Vault](https://auth0.com/docs/secure/tokens/token-vault). These tokens can then be used to access third-party APIs (like Google Calendar) on behalf of the user.

The tokens in the Token Vault are then accessible to [Resource Servers](https://auth0.com/docs/get-started/apis) (APIs) configured in Auth0. The SPA application can then issue requests to the API, which can retrieve the tokens from the Token Vault and use them to access the third-party APIs.

This is particularly useful for applications that require access to different resources on behalf of a user, like AI Agents.

### Configure the SDK

The SDK must be configured with an audience (an API Identifier) - this will be the resource server that uses the tokens from the Token Vault.

The SDK must also be configured to use refresh tokens and MRRT ([Multiple Resource Refresh Tokens](https://auth0.com/docs/secure/tokens/refresh-tokens/multi-resource-refresh-token)) since we will use the refresh token grant to get Access Tokens for the My Account API in addition to the API we are calling.

The My Account API requires DPoP tokens, so we also need to enable DPoP.

```js
const auth0 = new Auth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  useMrrt: true,
  useDpop: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

### Login to the application

Use the login methods to authenticate to the application and get a refresh and access token for the API.

```js
// Login specifying any scopes for the Auth0 API
await auth0.loginWithRedirect({
  authorizationParams: {
    audience: '<AUTH0 API IDENTIFIER>',
    scope: 'openid profile email read:calendar'
  }
});

// Handle redirect callback on login.
const query = new URLSearchParams(window.location.search);
if ((query.has('code') || query.has('error')) && query.has('state')) {
  await auth0.handleRedirectCallback();
  const user = await auth0.getUser();
  console.log(user);
}
```

### Connect to a third party account

Use the new `connectAccountWithRedirect` method to redirect the user to the third party Identity Provider to connect their account.

```js
// Start the connect flow by redirecting to the thrid party API's login, defined as an Auth0 connection
await auth0.connectAccountWithRedirect({
  connection: '<CONNECTION eg, google-apps-connection>',
  scopes: ['<SCOPE eg https://www.googleapis.com/auth/calendar.acls.readonly>'],
  authorizationParams: {
    // additional authorization params to forward to the authorization server
  }
});

// Handle redirect callback on connect. *Note* the `connect_code` param
const query = new URLSearchParams(window.location.search);
if ((query.has('connect_code') || query.has('error')) && query.has('state')) {
  const result = await auth0.handleRedirectCallback();
  if (result.connection) {
    console.log(`You are connected to ${result.connection}!`);
  }
}
```

You can now [call the API](#calling-an-api) with your access token and the API can use [Access Token Exchange with Token Vault](https://auth0.com/docs/secure/tokens/token-vault/access-token-exchange-with-token-vault) to get tokens from the Token Vault to access third party APIs on behalf of the user.

> [!IMPORTANT]
> You must enable `Offline Access` from the Connection Permissions settings to be able to use the connection with Connected Accounts.

## Accessing SDK Configuration

After initializing the Auth0Client, you can retrieve the configuration details:

```js
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: 'YOUR_DOMAIN',
  clientId: 'YOUR_CLIENT_ID'
});

// Get configuration
const config = auth0.getConfiguration();
console.log(config.domain, config.clientId);
```

This is useful when you need to:

- Display the current domain to the user
- Log configuration for debugging
- Pass configuration to other services or analytics
- Verify the SDK is configured correctly

## Passkeys

Passkeys provide password-less authentication using platform biometrics (Face ID, Touch ID, Windows Hello) or security keys via the WebAuthn standard. The SDK supports two flows:

1. **Signup**: Register a new user with a passkey
2. **Login**: Authenticate an existing user with a passkey

- [Important: Use Refresh Tokens with Passkeys](#important-use-refresh-tokens-with-passkeys)
- [Signup with Passkey](#signup-with-passkey)
- [Login with Passkey](#login-with-passkey)
- [Complete Passkey Flow Example](#complete-passkey-flow-example)
- [Error Handling](#passkey-error-handling)

### Setup

Before using passkeys, ensure the following are configured in your [Auth0 Dashboard](https://manage.auth0.com):

1. **Enable passkey authentication method**: Go to **Authentication** > **Database** > your connection > **Authentication Methods** > **Passkey**.
2. **Enable the WebAuthn passkey grant**: Go to your **Application** > **Advanced Settings** > **Grant Types** and enable the **Passkey** grant.
3. **Custom domain required**: Passkeys are bound to an origin (domain). A [custom domain](https://auth0.com/docs/customize/custom-domains) must be configured — passkeys will not work on the default `*.auth0.com` domain.

### Important: Use Refresh Tokens with Passkeys

> [!IMPORTANT]
> When using passkeys, you **must** configure the SDK with `useRefreshTokens: true`.

Passkey authentication uses a direct token exchange (`/oauth/token` with the WebAuthn grant type). It does **not** create an Auth0 session cookie because there is no redirect to `/authorize`. This means that when the access token expires, the SDK cannot silently obtain a new one using an iframe (which relies on the Auth0 session cookie via `prompt=none`).

Without refresh tokens, `getTokenSilently()` will either:
- Fail with a `login_required` error (if no Auth0 session exists), or
- Return tokens for a **different user** if a separate Auth0 session cookie exists from a prior redirect-based login, causing an unintended session swap.

To avoid this, always enable refresh tokens:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true, // Required for passkey-based sessions
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

You must also enable **Refresh Token Rotation** in your Auth0 Dashboard under **Applications** > your app > **Settings** > **Refresh Token Rotation**.

### Signup with Passkey

Register a new user with a passkey. The SDK handles the entire flow internally: requesting a challenge from Auth0, triggering the browser's WebAuthn credential creation ceremony, serializing the result, and exchanging it for tokens.

```js
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// One call handles everything — the user sees the biometric prompt
const tokens = await auth0.passkey.signup({
  email: 'user@example.com',
  name: 'Jane Doe' // optional display name
});

// User is now logged in — getUser() works immediately
const user = await auth0.getUser();
console.log('Signed up:', user);
```

You can also pass `scope` and `audience` to control the access token:

```js
const tokens = await auth0.passkey.signup({
  email: 'user@example.com',
  scope: 'openid profile email read:products',
  audience: 'https://api.example.com'
});
```

#### Organization-Scoped Signup

To register a user within an organization context:

```js
const tokens = await auth0.passkey.signup({
  email: 'user@example.com',
  organization: 'org_abc123'
});
```

#### All Supported Signup Properties

```js
const tokens = await auth0.passkey.signup({
  // At least one identifier is required
  email: 'user@example.com',
  phoneNumber: '+1234567890',       // optional: E.164 format
  username: 'janedoe',              // optional

  // Profile fields (all optional)
  name: 'Jane Doe',
  givenName: 'Jane',
  familyName: 'Doe',
  nickname: 'janie',
  picture: 'https://example.com/avatar.png',
  userMetadata: { plan: 'pro' },

  // Connection and org
  realm: 'my-db-connection',
  organization: 'org_abc123',

  // Token options
  scope: 'openid profile email',
  audience: 'https://api.example.com'
});
```

> [!NOTE]
> `passkey.signup()` and `passkey.login()` cache tokens and establish a session automatically, just like `loginWithRedirect()`. After calling them, `isAuthenticated()`, `getUser()`, and `getTokenSilently()` all work as expected.
>
> Remember to configure `useRefreshTokens: true`. See [Important: Use Refresh Tokens with Passkeys](#important-use-refresh-tokens-with-passkeys).

### Login with Passkey

Authenticate an existing user with their registered passkey. Like signup, a single call handles the entire flow.

```js
const tokens = await auth0.passkey.login();

const user = await auth0.getUser();
console.log('Logged in:', user);
```

#### Specifying a Realm

If your tenant has multiple database connections with passkeys enabled, specify the `realm`:

```js
const tokens = await auth0.passkey.login({
  realm: 'Username-Password-Authentication'
});
```

#### Organization-Scoped Login

To authenticate within an organization context:

```js
const tokens = await auth0.passkey.login({
  organization: 'org_abc123'
});
```

### Complete Passkey Flow Example

```js
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// --- Signup (single call) ---
async function signupWithPasskey(email, displayName) {
  await auth0.passkey.signup({ email, name: displayName });
  return await auth0.getUser();
}

// --- Login (single call) ---
async function loginWithPasskey() {
  await auth0.passkey.login();
  return await auth0.getUser();
}
```

### Passkey Error Handling

> [!TIP]
> Both `signup()` and `login()` throw an `Error` with a descriptive message if the user cancels the biometric prompt (i.e., the WebAuthn API returns `null`). Wrap calls in try/catch to handle cancellation, network failures, or misconfigured connections.

## Multi-Factor Authentication (MFA)

The MFA API allows you to manage multi-factor authentication for users. The SDK automatically handles MFA context, eliminating the need for manual parsing of error payloads.

> [!NOTE]
> Multi Factor Authentication support via SDKs is currently in Early Access. To request access to this feature, contact your Auth0 representative.

- [Understanding the MFA Response](#understanding-the-mfa-response)
- [Handling MFA required errors](#handling-mfa-required-errors)
- [Getting Authenticators](#getting-authenticators)
- [Getting Enrollment Factors](#getting-enrollment-factors)
- [Enrollment](#enrollment)
  - [Enrolling OTP (Authenticator App)](#enrolling-otp-authenticator-app)
  - [Enrolling SMS](#enrolling-sms)
  - [Enrolling Email](#enrolling-email)
  - [Enrolling Push Notification](#enrolling-push-notification)
- [Challenge](#challenge)
  - [Challenge with SMS](#challenge-with-sms)
  - [Challenge with Email](#challenge-with-email)
  - [Challenge with Push Notification](#challenge-with-push-notification)
  - [Challenge with OTP](#challenge-with-otp)
- [Verify](#verify)
  - [Verify with OOB](#verify-with-oob)
  - [Verify with OTP](#verify-with-otp)
  - [Verify with Push Notification](#verify-with-push-notification)
  - [Verify with Recovery Code](#verify-with-recovery-code)
- [Complete MFA Flow Example](#complete-mfa-flow-example)
- [Error Handling](#error-handling)

### Setup

Before using the MFA API, configure MFA in your [Auth0 Dashboard](https://manage.auth0.com) under **Security** > **Multi-factor Auth**. For detailed configuration, see the [Auth0 MFA documentation](https://auth0.com/docs/secure/multi-factor-authentication/customize-mfa/customize-mfa-enrollments-universal-login).

#### Understanding the MFA Response

When MFA is required, the error payload contains an `mfa_requirements` object that indicates either a **challenge** flow (user has enrolled authenticators) or an **enroll** flow (user needs to set up MFA).

**Challenge Flow Response** (user has existing authenticators):

```json
{
  "error": "mfa_required",
  "error_description": "Multifactor authentication required",
  "mfa_token": "Fe26.2*...",
  "mfa_requirements": {
    "challenge": [
      { "type": "otp" },
      { "type": "email" }
      ...
    ]
  }
}
```

**Enroll Flow Response** (user needs to enroll an authenticator):

```json
{
  "error": "mfa_required",
  "error_description": "Multifactor authentication required",
  "mfa_token": "Fe26.2*...",
  "mfa_requirements": {
    "enroll": [
      { "type": "otp" },
      { "type": "phone" },
      { "type": "push-notification" }
      ...
    ]
  }
}
```

Based on the response:
- **`mfa_requirements.challenge`**: User has enrolled authenticators → proceed with **List Authenticators → Challenge → Verify** flow
- **`mfa_requirements.enroll`**: User needs to set up MFA → proceed with **Enroll → Verify** flow

> [!NOTE]
> The SDK handles this logic automatically. When you call `getEnrollmentFactors()` or `getAuthenticators()`, the SDK uses the stored context to return the appropriate data.

### Handling MFA Required Errors

When MFA is required, the SDK automatically stores the context. You can then call MFA methods with just the token:

```js
try {
  await auth0.getTokenSilently();
} catch (error) {
  if (error instanceof MfaRequiredError) {
    // Check if enrollment is required
    const enrollmentFactors = await auth0.mfa.getEnrollmentFactors(error.mfa_token);

    if (enrollmentFactors.length > 0) {
      // User needs to enroll - show enrollment options
      console.log('Available enrollment factors:', enrollmentFactors);
    } else {
      // User has enrolled authenticators - proceed with challenge
      const authenticators = await auth0.mfa.getAuthenticators(error.mfa_token);
      console.log('Available authenticators:', authenticators);
    }
  }
}
```

### Getting Authenticators

The SDK automatically filters authenticators based on challenge types from the MFA context:

```js
try {
  await auth0.getTokenSilently();
} catch (error) {
  if (error instanceof MfaRequiredError) {
    const authenticators = await auth0.mfa.getAuthenticators(error.mfa_token);
    // SDK automatically filters by challenge types from the error
    showAuthenticatorPicker(authenticators);
  }
}
```

### Getting Enrollment Factors

Check what MFA factors are available for enrollment:

```js
try {
  const factors = await auth0.mfa.getEnrollmentFactors(mfaToken);

  if (factors.length > 0) {
    console.log('Available enrollment options:', factors);
    showEnrollmentOptions(factors);
  } else {
    console.log('User already enrolled');
  }
} catch (error) {
  if (error instanceof MfaEnrollmentFactorsError) {
    console.error('Could not retrieve enrollment factors:', error.error_description);
  }
}
```

### Enrollment

#### Enrolling OTP (Authenticator App) [auth0-docs](enrolment)

```js
// Enroll OTP authenticator (Google Authenticator, Microsoft Authenticator, etc.)
const enrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'otp'
});

// Display QR code to user
const qrCodeUri = enrollment.barcodeUri; // otpauth://totp/...
const secret = enrollment.secret; // Base32 secret for manual entry
```

#### Enrolling SMS

```js
// Enroll SMS authenticator
const smsEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'sms',
  phoneNumber: '+12025551234' // E.164 format
});

const oobCode = smsEnrollment.oobCode; // Use this code to complete enrollment verification;
```

#### Enrolling Voice

```js
// Enroll Voice authenticator
const voiceEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'voice',
  phoneNumber: '+12025551234' // E.164 format
});

const oobCode = voiceEnrollment.oobCode; // Use this code to complete enrollment verification
```

#### Enrolling Email

```js
// Enroll Email authenticator
const emailEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'email',
  email: 'user@example.com' 
});

const oobCode = voiceEnrollment.oobCode; // Use this code to complete enrollment verification

// Use this code to complete enrollment verification
```

#### Enrolling Push Notification

```js
// Enroll Push Notification authenticator (Auth0 Guardian)
const pushEnrollment = await auth0.mfa.enroll({
  mfaToken: mfaToken,
  factorType: 'push'
});

// Display QR code for Guardian app enrollment
const qrCodeUri = pushEnrollment.barcodeUri; // Scan with Auth0 Guardian app
const oobCode = pushEnrollment.oobCode;

// User scans QR code with Auth0 Guardian mobile app
// Push notifications will be used for future MFA challenges
```

### Challenge

#### Challenge with SMS

```js
// Initiate SMS challenge - sends code via text message
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'sms|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User will receive SMS with verification code
```

#### Challenge with Email

```js
// Initiate Email challenge - sends code via email
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'email|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User will receive email with verification code
```

#### Challenge with Push Notification

```js
// Initiate Push Notification challenge - sends push to Guardian app
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'push|dev_xxx'
});

const oobCode = challenge.oobCode; // Save for verification
// User receives push notification on their Auth0 Guardian mobile app
// They approve/deny the authentication request
```

#### Challenge with OTP

> [!NOTE]
> Once you have successfully enrolled an OTP factor, you do not need to explicitly call the challenge method to generate a code. The code is generated automatically by your authenticator app—simply open it and provide the displayed code in the verify call.

### Verify

#### Verify with OOB (SMS or email)

```js
// Verify MFA challenge and get tokens
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  oobCode: challenge.oobCode,
  bindingCode: '123456' // Code user received via SMS
});

const accessToken = tokens.access_token; // Use to call your API
const idToken = tokens.id_token; // Contains user identity information
```

#### Verify with OTP

```js
// Verify OTP code from authenticator app
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  otp: '123456' // 6-digit code from authenticator app
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

#### Verify with Push Notification

```js
// Challenge the push notification authenticator
const challenge = await auth0.mfa.challenge({
  mfaToken: mfaToken,
  challengeType: 'oob',
  authenticatorId: 'push|dev_xxx' // Push authenticator ID
});

// User receives push notification on their mobile device
// They approve the request in the Auth0 Guardian app

// Poll or wait for user to approve, then verify
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  oobCode: challenge.oobCode,
  bindingCode: 'APPROVAL_CODE' // Code from Guardian app (if binding required)
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

#### Verify with Recovery Code

Recovery codes can be used to complete MFA verification without initiating a challenge. Each recovery code can only be used once.

```js
const tokens = await auth0.mfa.verify({
  mfaToken: mfaToken,
  recoveryCode: 'XXXX-XXXX-XXXX' // One of the recovery codes
});

const accessToken = tokens.access_token;
const idToken = tokens.id_token;
```

### Complete MFA Flow Example

Here's a complete example showing enrollment and challenge flows:

> [!TIP]
> See a complete MFA implementation in [static/mfa_flow.html](static/mfa_flow.html) that demonstrates enrollment, challenge, and verification flows.

```js
async function handleMfaFlow() {
  try {
    await auth0.getTokenSilently();
  } catch (error) {
    if (error instanceof MfaRequiredError) {
      const mfaToken = error.mfa_token;

      // Check if enrollment is needed
      const enrollmentFactors = await auth0.mfa.getEnrollmentFactors(mfaToken);

      if (enrollmentFactors.length > 0) {
        // User needs to enroll
        const selectedFactor = await showEnrollmentUI(enrollmentFactors);

        // Enroll based on user selection
        if (selectedFactor.type === 'otp') {
          const enrollment = await auth0.mfa.enroll({
            mfaToken: mfaToken,
            factorType: 'otp'
          });
          await showQRCode(enrollment.barcodeUri);

          // User scans QR and enters code to verify enrollment
          const verifyCode = await promptUserForCode();
          const tokens = await auth0.mfa.verify({
            mfaToken: mfaToken,
            otp: verifyCode
          });

          return tokens;
        }
      } else {
        // User has authenticators - proceed with challenge
        const authenticators = await auth0.mfa.getAuthenticators(mfaToken);
        const selected = await showAuthenticatorPicker(authenticators);

        // Initiate challenge
        const challenge = await auth0.mfa.challenge({
          mfaToken: mfaToken,
          challengeType: selected.type === 'otp' ? 'otp' : 'oob',
          authenticatorId: selected.id
        });

        // Get code from user
        const code = await promptUserForCode();

        // Verify
        const tokens = await auth0.mfa.verify({
          mfaToken: mfaToken,
          otp: selected.type === 'otp' ? code : undefined,
          oobCode: selected.type !== 'otp' ? challenge.oobCode : undefined,
          bindingCode: selected.type !== 'otp' ? code : undefined
        });

        return tokens;
      }
    }
  }
}
```

### Error Handling

Each MFA operation has its own typed error for precise error handling:

```js
import {
  MfaEnrollmentError,
  MfaListAuthenticatorsError,
  MfaChallengeError,
  MfaVerifyError,
  MfaEnrollmentFactorsError
} from '@auth0/auth0-spa-js';

// Get authenticators
try {
  const authenticators = await auth0.mfa.getAuthenticators(mfaToken);
} catch (error) {
  if (error instanceof MfaListAuthenticatorsError) {
    console.error('Failed to get authenticators:', error.error_description);
  }
}

// Get enrollment factors
try {
  const factors = await auth0.mfa.getEnrollmentFactors(mfaToken);
} catch (error) {
  if (error instanceof MfaEnrollmentFactorsError) {
    console.error('Context not found:', error.error_description);
    // MFA token may have expired - restart the flow
  }
}

// Enroll authenticator
try {
  const enrollment = await auth0.mfa.enroll({
    mfaToken,
    factorType: 'otp'
  });
} catch (error) {
  if (error instanceof MfaEnrollmentError) {
    console.error('Enrollment failed:', error.error_description);
  }
}

// Challenge authenticator
try {
  const challenge = await auth0.mfa.challenge({
    mfaToken,
    challengeType: 'otp',
    authenticatorId
  });
} catch (error) {
  if (error instanceof MfaChallengeError) {
    console.error('Challenge failed:', error.error_description);
  }
}

// Verify challenge
try {
  const tokens = await auth0.mfa.verify({
    mfaToken,
    otp: '123456'
  });
} catch (error) {
  if (error instanceof MfaVerifyError) {
    if (error.error === 'invalid_otp') {
      console.error('Invalid code entered');
    } else if (error.error === 'expired_token') {
      console.error('MFA token expired - restart flow');
    }
  }
}
```

> [!NOTE]
> You may also encounter an `MfaRequiredError` if you have multiple challenge factors configured.

## Step-Up Authentication

Step-up authentication lets you request elevated access for sensitive operations (e.g. a specific audience or scope) and automatically handle MFA challenges via a popup, without manually catching errors or managing the MFA API.

When `getTokenSilently()` encounters an MFA step-up error and `interactiveErrorHandler` is configured, the SDK automatically opens a Universal Login popup to complete MFA, then returns the token. This works regardless of whether you use refresh tokens (`useRefreshTokens: true`) or the default configuration.

### Setup

Enable the interactive error handler when creating the client. Step-up authentication works with or without refresh tokens — no additional configuration is needed. When using refresh tokens, consider combining with [Multi-Resource Refresh Tokens (MRRT)](#using-multi-resource-refresh-tokens), which allow a single refresh token to obtain access tokens for multiple APIs — making step-up requests across different audiences seamless.

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  interactiveErrorHandler: 'popup',
  useRefreshTokens: true, // optional — works with or without refresh tokens
  useMrrt: true, // optional — useful when stepping up across multiple APIs
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

### Usage

Call `getTokenSilently()` with the audience and scope that require step-up authentication. If MFA is required, the popup opens automatically and the token is returned once the user completes the challenge — no manual error handling needed.

```js
const accessToken = await auth0.getTokenSilently({
  authorizationParams: {
    audience: 'https://api.example.com',
    scope: 'read:sensitive-data'
  }
});

const result = await fetch('https://api.example.com/sensitive', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Error Handling

The MFA challenge itself is handled automatically, but popup lifecycle errors can still occur. These are thrown to the caller:

```js
import {
  PopupOpenError,
  PopupCancelledError,
  PopupTimeoutError
} from '@auth0/auth0-spa-js';

try {
  const accessToken = await auth0.getTokenSilently({
    authorizationParams: {
      audience: 'https://api.example.com',
      scope: 'read:sensitive-data'
    }
  });
} catch (error) {
  if (error instanceof PopupOpenError) {
    // Browser blocked the popup — prompt user to allow popups
  }
  if (error instanceof PopupCancelledError) {
    // User closed the popup before completing MFA
  }
  if (error instanceof PopupTimeoutError) {
    // Popup did not complete within the allowed time
  }
}
```

> [!NOTE]
> If `interactiveErrorHandler` is not configured, MFA errors are thrown to the caller as usual. When using refresh tokens, you can handle `MfaRequiredError` manually using the [MFA API](#multi-factor-authentication-mfa).

## MyAccount API

The MyAccount API lets you manage the current user's authentication methods, factors, and connected accounts directly from the SPA.

> [!NOTE]
> The MyAccount API requires refresh tokens and MRRT if your app is configured with a custom API audience. DPoP is supported but optional.

### Factors

Get the list of MFA factors and their enabled status for the current user.

```js
const factors = await auth0.myAccount.getFactors();
// [{ type: 'totp', usage: ['secondary'] }, { type: 'phone', usage: ['secondary'] }]
```

### Authentication Methods

#### List All

```js
const methods = await auth0.myAccount.getAuthenticationMethods();
```

#### Filter by Type

```js
const passkeys = await auth0.myAccount.getAuthenticationMethods('passkey');
```

#### Get by ID

```js
const method = await auth0.myAccount.getAuthenticationMethod('am_abc123');
```

#### Delete

```js
await auth0.myAccount.deleteAuthenticationMethod('am_abc123');
```

#### Update

```js
// Rename any method
const updated = await auth0.myAccount.updateAuthenticationMethod('am_abc123', {
  name: 'My Work Laptop'
});

// Change preferred delivery method for phone
const updated = await auth0.myAccount.updateAuthenticationMethod('am_abc123', {
  preferred_authentication_method: 'voice'
});
```

### Enrollment

Enrollment is a two-step flow: get a challenge, then verify the credential.

#### Passkey

```js
// Step 1: get the WebAuthn creation challenge
const challenge = await auth0.myAccount.enrollmentChallenge({ type: 'passkey' });

// Step 2: trigger the browser ceremony
const credential = await navigator.credentials.create({
  publicKey: {
    ...challenge.authn_params_public_key,
    challenge: base64urlToBuffer(challenge.authn_params_public_key.challenge),
    user: {
      ...challenge.authn_params_public_key.user,
      id: base64urlToBuffer(challenge.authn_params_public_key.user.id)
    }
  }
});

// Step 3: verify and complete enrollment
const method = await auth0.myAccount.enrollmentVerify({
  type: 'passkey',
  location: challenge.location,
  auth_session: challenge.auth_session,
  authn_response: serializeCredential(credential)
});
```

#### Phone

```js
// Step 1: request OTP to the phone number
const challenge = await auth0.myAccount.enrollmentChallenge({
  type: 'phone',
  phone_number: '+15551234567',
  preferred_authentication_method: 'sms'
});

// Step 2: verify with the OTP the user received
await auth0.myAccount.enrollmentVerify({
  type: 'phone',
  location: challenge.location,
  auth_session: challenge.auth_session,
  otp_code: '123456'
});
```

#### Email

```js
const challenge = await auth0.myAccount.enrollmentChallenge({
  type: 'email',
  email: 'user@example.com'
});

await auth0.myAccount.enrollmentVerify({
  type: 'email',
  location: challenge.location,
  auth_session: challenge.auth_session,
  otp_code: '123456'
});
```

#### TOTP

```js
const challenge = await auth0.myAccount.enrollmentChallenge({ type: 'totp' });
// challenge.barcode_uri — show this as a QR code for the user to scan
// challenge.manual_input_code — fallback manual entry code

await auth0.myAccount.enrollmentVerify({
  type: 'totp',
  location: challenge.location,
  auth_session: challenge.auth_session,
  otp_code: '123456'
});
```

#### Push Notification

```js
const challenge = await auth0.myAccount.enrollmentChallenge({ type: 'push-notification' });
// challenge.barcode_uri — show this as a QR code to link the authenticator app

// No OTP needed — user approves on their device
await auth0.myAccount.enrollmentVerify({
  type: 'push-notification',
  location: challenge.location,
  auth_session: challenge.auth_session
});
```

#### Recovery Code

```js
const challenge = await auth0.myAccount.enrollmentChallenge({ type: 'recovery-code' });
// challenge.recovery_code — display this to the user to save securely

// Verify just confirms the user has saved the code
await auth0.myAccount.enrollmentVerify({
  type: 'recovery-code',
  location: challenge.location,
  auth_session: challenge.auth_session
});
```

#### Password

```js
const challenge = await auth0.myAccount.enrollmentChallenge({ type: 'password' });

await auth0.myAccount.enrollmentVerify({
  type: 'password',
  location: challenge.location,
  auth_session: challenge.auth_session,
  new_password: 'newSecurePassword123!'
});
```

### Error Handling

All MyAccount API errors throw `MyAccountApiError` with RFC 7807 fields.

```js
import { MyAccountApiError } from '@auth0/auth0-spa-js';

try {
  await auth0.myAccount.enrollmentChallenge({ type: 'passkey' });
} catch (err) {
  if (err instanceof MyAccountApiError) {
    console.error(err.status, err.title, err.detail);
    if (err.validation_errors) {
      err.validation_errors.forEach(e => console.error(e.field, e.detail));
    }
  }
}

try {
  await auth0.myAccount.deleteAuthenticationMethod('am_abc123');
} catch (err) {
  if (err instanceof MyAccountApiError) {
    console.error(err.status, err.title, err.detail);
  }
}
```

> [!IMPORTANT]
> `interactiveErrorHandler` only affects `getTokenSilently()`. Other methods like `loginWithPopup()` and `loginWithRedirect()` are not affected.

## Session Expiry from Upstream IdP (IPSIE)

### Overview

When using Okta or OIDC enterprise connections configured with `id_token_session_expiry_supported: true`, Auth0 includes a `session_expiry` claim in the ID token. This represents the latest moment the upstream identity provider considers the session valid — an absolute Unix timestamp in seconds.

You can also emit this claim via a Post-Login Action:

```js
exports.onExecutePostLogin = async (event, api) => {
  // IMPORTANT: value must be Unix seconds, not milliseconds.
  // Wrong:  Date.now() + 7200000          — milliseconds, throws invalid_token at login
  // Correct: Math.floor(Date.now() / 1000) + 7200  — 2-hour ceiling
  api.idToken.setCustomClaim('session_expiry', Math.floor(Date.now() / 1000) + 7200);
};
```

### Prerequisites

- Okta or OIDC enterprise connection with `id_token_session_expiry_supported: true`, **or**
- A Post-Login Action that sets `session_expiry` as a Unix timestamp in seconds

### Behavior

Once the ceiling is reached (with a 30-second clock-skew tolerance), the SDK tears down the local session. No network call is made past the ceiling.

```ts
// Before ceiling is reached
const user = await auth0.getUser();            // returns the user object
const token = await auth0.getTokenSilently();  // returns the access token

// After ceiling is reached
const user = await auth0.getUser();            // returns undefined
const token = await auth0.getTokenSilently();  // returns undefined — no network call made
const claims = await auth0.getIdTokenClaims(); // returns undefined
const isAuth = await auth0.isAuthenticated();  // returns false
```

The ceiling is pinned to the value set at initial login. Silent token refreshes cannot extend it.

### Upgrading Existing Apps

If your app assumes `getUser()` or `getTokenSilently()` always return a value for a logged-in user, add null checks to handle the breach gracefully:

```ts
const token = await auth0.getTokenSilently();

if (!token) {
  await auth0.loginWithRedirect();
  return;
}

fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

```ts
const user = await auth0.getUser();

if (!user) {
  await auth0.loginWithRedirect();
  return;
}

console.log(`Hello, ${user.name}`);
```
