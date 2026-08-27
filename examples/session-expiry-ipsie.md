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
