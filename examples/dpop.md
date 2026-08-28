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
const response = await fetch('https://api.example.com/foo', {
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

const response = await fetcher.fetchWithAuth('https://api.example.com/foo', {
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
    })
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
