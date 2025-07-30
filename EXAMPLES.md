# Examples

- [Logging Out](#logging-out)
- [Calling an API](#calling-an-api)
- [Refresh Tokens](#refresh-tokens)
- [Data Caching Options](#creating-a-custom-cache)
- [Organizations](#organizations)
- [Device-bound tokens with DPoP](#device-bound-tokens-with-dpop)

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

## Device-bound tokens with DPoP

**Demonstrating Proof-of-Possession** –or just **DPoP**– is an OAuth 2.0 extension defined in [RFC9449](https://datatracker.ietf.org/doc/html/rfc9449).

It defines a mechanism for securely binding tokens to a specific device by means of cryptographic signatures. Without it, **a token leak caused by XSS or other vulnerability could result in an attacker impersonating the real user.**

In order to support DPoP in `auth0-spa-js`, we require some APIs found in modern browsers:

- [Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto): it allows to create and use cryptographic keys that will be used for creating the proofs (i.e. signatures) used in DPoP.

- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): it allows to use cryptographic keys [without giving access to the private material](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto#storing_keys).

The following OAuth 2.0 flows are currently supported by `auth0-spa-js`:

- [Authorization Code Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow) (`authorization_code`).

- [Refresh Token Flow](https://auth0.com/docs/secure/tokens/refresh-tokens) (`refresh_token`).

- [Custom Token Exchange Flow](https://auth0.com/docs/authenticate/custom-token-exchange) (`urn:ietf:params:oauth:grant-type:token-exchange`).

Currently, only the `ES256` algorithm is supported.

### Enabling DPoP

Currently, DPoP is disabled by default. To enable it, set the `useDpop` option to `true` when creating the SDK instance. For example:

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

After enabling DPoP, supported OAuth 2.0 flows in Auth0 will start transparently issuing tokens that will be cryptographically bound to the current browser.

Note that a DPoP token will have to be sent to a resource server with an `Authorization: DPoP <token>` header instead of `Authorization: Bearer <token>` as usual.

If you're using both types at the same time, you can use the `detailedResponse` option in `getTokenSilently()` to get access to the `token_type` property and know what kind of token you got:

```js
const headers = {
  Authorization: `${token.token_type} ${token.access_token}`
};
```

If all your clients are already using DPoP, you may want to increase security and make Auth0 reject non-DPoP interactions by enabling the "Require Token Sender-Constraining" option in your Auth0's application settings. Check [the docs](https://auth0.com/docs/get-started/applications/configure-sender-constraining) for details.

### Clearing DPoP data

When using DPoP some temporary data is stored in the user's browser. When you log the user out with `client.logout()`, it will be deleted.

### Using DPoP in your own requests

Enabling `useDpop` **protects every internal request that the SDK sends to Auth0** (i.e. the authorization server).

However, if you want to use a DPoP access token to authenticate against a custom API (i.e. a resource server), some extra work is required. The `Auth0Client` class provides some low-level methods that will give the pieces you need:

- `getDpopNonce()`
- `setDpopNonce()`
- `generateDpopProof()`

However, due to the nature of how DPoP works, **this is not a trivial task**:

- When a nonce is missing or expired, the request might need to be retried.
- Received nonces must be stored and managed.
- DPoP headers must be generated and included in every request, and regenerated with retries.

Because of this, we recommend you to use the provided `fetchWithDpop()` method, **which will do all this work for you.**

#### Simple request example

If you don't have special requirements and you just want to do a simple request, you can treat `fetchWithDpop()` as a wrapper over the Fetch API `fetch()` method, like so:

```js
const response = await client.fetchWithDpop({
  // Used to identify nonces belonging to this request.
  nonceId: 'my_api_request',

  // Basic parameters for the request.
  method: 'POST',
  url: 'https://api.example.com/v1/user',
  body: JSON.stringify({ name: 'John Doe' }),

  // Include your own headers - DPoP headers will be appended at the end.
  headers: { 'user-agent': 'My Simple Client 1.0' },

  // In milliseconds. Optional.
  timeout: 5000
});

// `response` is now a standard Fetch API `Response` object.
const json = await response.json();
console.log(json);
```

Note that this method will do the following for you transparently:

- Use `getTokenSilently()` to get the access token to use in the request.
- Generate and include DPoP headers where needed.
- Store and update any DPoP nonces.
- Handle retries caused by an expired nonce.

#### Advanced request example

If you need something more complex than the above example, you can provide a custom implementation in the `fetch` property.

This implementation **must** return 3 things:

1. The response status code as a number.
2. The response headers – as a plain object or as a Fetch API's `Headers`-like interface.
3. A free-form output value that you want to return to the caller.

Your implementation will be called with a plain object containing every piece you might need to make the request on your own.

##### With 3rd party libraries (axios, etc)

```js
const response = await client.fetchWithDpop({
  name: 'my_api_request',

  method: 'POST',
  url: 'https://api.example.com/v1/user',
  body: JSON.stringify({ name: 'John Doe' }),
  timeout: 5000,

  fetch(params) {
    const response = await axios(params);

    return {
      status: response.status,
      headers: response.headers,
      output: response, // or whatever you need at the output
    };
  },
});

console.log(response.status);
console.log(response.headers);
console.log(response.data);
```

##### With Fetch API

```js
const response = await client.fetchWithDpop({
  nonceId: 'my_api_request',

  method: 'POST',
  url: 'https://api.example.com/v1/user',
  body: JSON.stringify({ name: 'John Doe' }),
  timeout: 5000,

  fetch(params) {
    const response = await fetch(params.url, {
      ...params,

        // Unfortunately, Fetch API doesn't support timeouts so you have
        // to manually create an `AbortSignal` if you need a timeout.
        signal: params.timeout
          ? AbortSignal.timeout(params.timeout)
          : undefined,
      });

    return {
      status: response.status,
      headers: response.headers,
      output: response // or whatever you need at the output
    };
  },
});

console.log(response.status);
console.log(response.headers);
console.log(response.body);
```

#### Passing an access token

The `fetchWithDpop()` method assumes that you're using the SDK to get the access token to include in the request. This means that it will call `getTokenSilently()` internally unless instructed otherwise.

However, if you happen to have an access token at hand before calling `fetchWithDpop()` or you need to pass specific parameters to `getTokenSilently()`, you can use the `accessToken` property:

```js
const response = await client.fetchWithDpop({
  // ...

  // You can provide a simple string...
  accessToken: '<SOME_ACCESS_TOKEN>'

  // ... or you can pass a function (async or not) that returns a string.
  accessToken: (client) => {
    return client.getTokenSilently({
      authorizationParams: { foo: 'bar' },
    });
  },
});
```

#### A note on instance-level vs. call-level configuration

If you are doing just one kind of request, it might be useful to pass a default configuration for `fetchWithDpop()` in the `dpopFetchConfig` option in the `Auth0Client` constructor.

But you can also pass the configuration directly to each call to the `fetchWithDpop()` method, which will override any class-level configuration that you might have.

Both approaches are valid and will behave identically.
