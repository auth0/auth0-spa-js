# Anonymous Sessions

Anonymous sessions let you assign a persistent identity to a visitor before they log in. The visitor gets an access token tied to an opaque anonymous identity. When they eventually log in, the anonymous identity can be linked to their real account.

> **Note:** Anonymous Sessions is a feature currently in Early Access. Contact your Auth0 representative to request access.

- [Automatic creation via checkSession](#automatic-creation-via-checksession)
- [Explicit session creation with metadata](#explicit-session-creation-with-metadata)
- [Getting an access token](#getting-an-access-token)
- [Multiple audiences](#multiple-audiences)
- [Ending the session](#ending-the-session)
- [Storage modes](#storage-modes)

## Automatic creation via checkSession

Set `createAnonymousSessionOnFailedSilentAuth: true` to have the SDK automatically create an anonymous session when `checkSession()` finds no authenticated user. `createAuth0Client()` calls `checkSession()` internally, so the anonymous session is ready as soon as the client is initialized.

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  createAnonymousSessionOnFailedSilentAuth: true
});

// Anonymous session already created — call getTokenSilently when you need to call an API
const { accessToken } = await auth0.anonymous.getTokenSilently({
  audience: 'https://api.example.com'
});
```

If you use `new Auth0Client()` directly, call `checkSession()` yourself after construction.

This does not affect standalone `getTokenSilently()` calls on `auth0` itself. If you need to attach metadata to the anonymous identity, use explicit session creation instead.

## Explicit session creation with metadata

Call `auth0.anonymous.createSession()` directly to create an anonymous session with metadata attached to the identity.

```js
const session = await auth0.anonymous.createSession({
  metadata: { cart: 'cart-123' }
});

console.log(session.sessionToken); // opaque JWE — managed by the SDK
```

## Getting an access token

Call `auth0.anonymous.getTokenSilently()` to get a valid access token. The SDK returns a cached token when still fresh and renews it transparently when expired.

```js
const { accessToken } = await auth0.anonymous.getTokenSilently({
  audience: 'https://api.example.com'
});

const result = await fetch('https://api.example.com/data', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

## Multiple audiences

Each `(audience, scope)` combination gets its own access token. All tokens share the same anonymous identity.

```js
const { accessToken: tokenA } = await auth0.anonymous.getTokenSilently({
  audience: 'https://api-a.example.com'
});

const { accessToken: tokenB } = await auth0.anonymous.getTokenSilently({
  audience: 'https://api-b.example.com'
});
```

## Ending the session

Call `auth0.anonymous.logout()` to end the anonymous session and clear all locally stored tokens.

```js
await auth0.anonymous.logout();
```

## Storage modes

By default, the anonymous session is stored in `localStorage` and survives page reloads. Set `anonymousSessionsCacheMode: 'memory'` for stricter security — the session is lost on page reload.

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  anonymousSessionsCacheMode: 'memory'
});
```
