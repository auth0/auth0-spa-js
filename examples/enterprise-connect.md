## Enterprise Connect

Enterprise Connect lets a B2B SaaS layer enterprise SSO (SAML, OIDC federation) on top of its own auth server without replacing it.
Auth0 acts as a relay: it authenticates the enterprise user against their IdP and returns an enriched ID token, which the SDK caches like any other login.

> [!IMPORTANT]
> Enterprise Connect is an Early Access feature. The tenant setup (entitlements, connection type, and the claims a token carries) depends on your Auth0 configuration and may change. Confirm the tenant-side requirements with your Auth0 contact. The SDK surface described here is stable.

### How the flow works

1. The user enters their email. Your app calls `isFederatedDomain` with the email domain to run [WebFinger](https://datatracker.ietf.org/doc/html/rfc7033) discovery.
2. If the domain is managed by Auth0 for enterprise SSO, call `loginWithRedirect` with the email as `login_hint` so Auth0 can resolve the connection and organization. If it is not managed, fall back to your own login.
3. The user authenticates at their identity provider and is redirected back to your callback.
4. Your app calls `handleRedirectCallback`, exactly as in a normal login. The ID token is verified and cached; read the claims with `getIdTokenClaims` / `getUser`.

> [!IMPORTANT]
> `isFederatedDomain` is a routing hint, not a security control. It returns `false` on any failure (a 429, a network error, or a genuinely unmanaged domain all look the same), so a discovery failure routes the user to your fallback login rather than granting access. It never, on its own, signs anyone in - the callback must still complete, and you must still validate the resulting claims (see [Validate the organization](#validate-the-organization)).

### Initialise the SDK

```ts
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: 'YOUR_DOMAIN',
  clientId: 'YOUR_CLIENT_ID',
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: 'openid profile email' // no offline_access -- EC issues no refresh token
    // Do not set organization -- HRD resolves it from login_hint
  }
});
```

### Login

Check the email domain with `isFederatedDomain`, then start the redirect with the email as `login_hint`:

```ts
import { isFederatedDomain } from '@auth0/auth0-spa-js';

const email = document.querySelector('#email').value;
const emailDomain = email.split('@')[1];

// 1. Discover whether the domain is managed for enterprise SSO
const federated = await isFederatedDomain('YOUR_DOMAIN', emailDomain);

if (!federated) {
  // Domain is not managed by Auth0; fall back to your own login
  showPasswordForm(email);
} else {
  // 2. Redirect to Auth0 with the email as login_hint. Home Realm Discovery
  //    resolves the connection and organization from the domain -- do not
  //    pass organization yourself, or you break multi-customer setups.
  await auth0.loginWithRedirect({
    authorizationParams: { login_hint: email }
  });
}
```

### Handle the callback

No changes to your existing callback handling:

```ts
await auth0.handleRedirectCallback();
const claims = await auth0.getIdTokenClaims();

// claims.org_id is the resolved organization
console.log('Logged in as', claims.email, 'in org', claims.org_id);
```

### Validate the organization

> [!WARNING]
> Validate `org_id` after every callback. WebFinger discovery and `login_hint` are routing mechanisms, not proof that the user belongs to a customer you serve - on their own they do not authorize anyone. Read `org_id` from the ID token claims and check it against your own list of known organizations before treating the user as signed in for that customer. Without this check, a user authenticating through any managed connection could obtain a session in a context you did not intend.

```ts
const claims = await auth0.getIdTokenClaims();

if (!allowedOrgs.includes(claims.org_id)) {
  await auth0.logout();
  throw new Error('User does not belong to this organization');
}
```

Because this runs in the browser, treat it as a routing/UX guard, not a security boundary - a user controls their own client. Enforce the real `org_id` check server-side on every API call that trusts the token. If you serve exactly one organization today, this is still a single check worth keeping: an app that skips it silently lets in users from other tenants the day it onboards a second customer.

### Logout

EC logout must use `federated: true` to terminate the enterprise IdP session (SAML
SLO). Without it the IdP session stays alive and the next login silently reuses the
previous user:

```ts
await auth0.logout({
  logoutParams: {
    federated: true,
    returnTo: window.location.origin
  }
});
```
