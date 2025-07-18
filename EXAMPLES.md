# Examples

- [Logging Out](#logging-out)
- [Calling an API](#calling-an-api)
- [Refresh Tokens](#refresh-tokens)
- [Data Caching Options](#creating-a-custom-cache)
- [Organizations](#organizations)

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

In all cases where a refresh token is not available, the SDK falls back to the legacy technique of using a hidden iframe with `prompt=none` to try and get a new access token and refresh token. This scenario would occur for example if you are using the in-memory cache and you have refreshed the page. In this case, any refresh token that was stored previously would be lost.

If the fallback mechanism fails, a `login_required` error will be thrown and could be handled in order to put the user back through the authentication process.

**Note**: This fallback mechanism does still require access to the Auth0 session cookie, so if third-party cookies are being blocked then this fallback will not work and the user must re-authenticate in order to get a new refresh token.

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

// Exchange external token for Auth0 tokens
async function performTokenExchange() {
  try {
    // Option 1: Use client's default audience
    const tokenResponse = await auth0.exchangeToken({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      scope: 'openid profile email'
      // audience will default to audience from client config
    });

    // Option 2: Specify custom audience for this token exchange
    const customTokenResponse = await auth0.exchangeToken({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      audience: 'https://different-api.example.com',
      scope: 'openid profile read:records'
    });

    console.log('Received tokens:', tokenResponse);
  } catch (error) {
    console.error('Exchange failed:', error);
  }
}
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
    return await auth0.exchangeToken(/* ... */);
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

[Token Exchange Documentation](https://auth0.com/docs/authenticate/login/token-exchange)  
[RFC 8693 Spec](https://tools.ietf.org/html/rfc8693)
