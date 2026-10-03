# Anonymous Sessions

Anonymous sessions assign a persistent identity to a visitor before they log in. The visitor gets an access token tied to an anonymous identity, which Auth0 exposes as `event.anonymous_session` in Post-Login Actions. You can write a Post-Login Action to link the anonymous identity to the authenticated user after login. Nothing is linked automatically.

> **Note:** Anonymous Sessions is a feature currently in Early Access. Contact your Auth0 representative to request access.

- [Automatic creation via checkSession](#automatic-creation-via-checksession)
- [Explicit session creation with metadata](#explicit-session-creation-with-metadata)
- [Getting an access token](#getting-an-access-token)
- [Multiple audiences](#multiple-audiences)
- [Linking to an authenticated user](#linking-to-an-authenticated-user)
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

// Anonymous session already created. Call getTokenSilently when you need to call an API
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
```

> **Note:** Metadata can only be set at creation time. Calling `createSession()` again creates a new anonymous identity rather than updating the existing one.

## Getting an access token

Call `auth0.anonymous.getTokenSilently()` to get a valid access token. The SDK returns a cached token when still fresh and renews it when the access token expires. If the session itself is expired or invalid, the SDK throws an `AnonymousSessionError` — catch it and call `createSession()` to start a new session.

```js
import { AnonymousSessionError } from '@auth0/auth0-spa-js';

try {
  const { accessToken } = await auth0.anonymous.getTokenSilently({
    audience: 'https://api.example.com'
  });

  const result = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
} catch (e) {
  if (
    e instanceof AnonymousSessionError &&
    (e.code === 'session_expired' || e.code === 'invalid_session_token')
  ) {
    // Session is permanently gone. Start a new one.
    await auth0.anonymous.createSession();
  } else {
    throw e;
  }
}
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

## Linking to an authenticated user

When the user logs in, the SDK automatically mints a short-lived transfer ticket from the stored session token and passes it to `/authorize` as `anon_transfer_token`. This works for both `loginWithRedirect()` and `loginWithPopup()` — no extra configuration needed.

Auth0 delivers the anonymous identity to your Post-Login Action as `event.anonymous_session`:

```js
exports.onExecutePostLogin = async (event, api) => {
  if (event.anonymous_session) {
    api.idToken.setCustomClaim('https://anon/metadata', event.anonymous_session.metadata);
    api.idToken.setCustomClaim('https://anon/user_id', event.anonymous_session.user_id);
  }
};
```

The anonymous session is **not** automatically cleared after login. Call `anonymous.logout()` explicitly once you have finished using the session data.

## Ending the session

Call `auth0.anonymous.logout()` to end the anonymous session and clear all locally stored tokens.

```js
await auth0.anonymous.logout();
```

## Storage modes

By default, the anonymous session is stored in `localStorage` and survives page reloads. Set `anonymousSessionsCacheMode: 'memory'` for stricter security. The session will not persist across page reloads in this mode.

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  anonymousSessionsCacheMode: 'memory'
});
```
