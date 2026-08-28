## Passkeys

Passkeys provide password-less authentication using platform biometrics (Face ID, Touch ID, Windows Hello) or security keys via the WebAuthn standard. The SDK supports two flows:

1. **Signup**: Register a new user with a passkey
2. **Login**: Authenticate an existing user with a passkey

- [Important: Use Refresh Tokens with Passkeys](#important-use-refresh-tokens-with-passkeys)
- [Signup with Passkey](#signup-with-passkey)
- [Login with Passkey](#login-with-passkey)
- [Granular Passkey APIs](#granular-passkey-apis)
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
  useRefreshTokens: true, // Required for passkey-based sessions
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

### Granular Passkey APIs

For advanced use cases where you need fine-grained control, you can use the individual API methods to handle each step of the passkey flow separately.

#### Get Signup Challenge

Request a passkey signup challenge to start the granular signup flow:

```js
const challenge = await auth0.passkey.getSignupChallenge({
  email: 'user@example.com',
  name: 'Jane Doe' // optional display name
});

// challenge.authSession — save this to complete signup later
// challenge.publicKey — pass to navigator.credentials.create()
```

#### Get Login Challenge

Request a passkey login challenge to start the granular login flow:

```js
const challenge = await auth0.passkey.getLoginChallenge({
  realm: 'Username-Password-Authentication' // optional
});

// challenge.authSession — save this to complete login later
// challenge.publicKey — pass to navigator.credentials.get()
```

#### Get Token with Passkey

Exchange a signed credential for tokens. This is the final step after running the WebAuthn ceremony:

```js
// After navigator.credentials.create() or navigator.credentials.get()
const credential = await navigator.credentials.create({
  publicKey: challenge.publicKey
});

const tokens = await auth0.passkey.getTokenWithPasskey({
  authSession: challenge.authSession,
  credential: credential, // the raw PublicKeyCredential
  scope: 'openid profile email',
  audience: 'https://api.example.com'
});
```

#### Complete Granular Signup Example

```js
async function granularSignup(email, displayName) {
  // Step 1: Get challenge
  const challenge = await auth0.passkey.getSignupChallenge({
    email,
    name: displayName
  });

  // Step 2: Create credential
  const credential = await navigator.credentials.create({
    publicKey: challenge.publicKey
  });

  if (!credential) {
    throw new Error('Credential creation cancelled');
  }

  // Step 3: Exchange for tokens
  const tokens = await auth0.passkey.getTokenWithPasskey({
    authSession: challenge.authSession,
    credential
  });

  return tokens;
}
```

#### Complete Granular Login Example

```js
async function granularLogin() {
  // Step 1: Get challenge
  const challenge = await auth0.passkey.getLoginChallenge();

  // Step 2: Get credential
  const credential = await navigator.credentials.get({
    publicKey: challenge.publicKey
  });

  if (!credential) {
    throw new Error('Credential assertion cancelled');
  }

  // Step 3: Exchange for tokens
  const tokens = await auth0.passkey.getTokenWithPasskey({
    authSession: challenge.authSession,
    credential
  });

  return tokens;
}
```

> [!NOTE]
> The granular APIs (`getSignupChallenge`, `getLoginChallenge`, `getTokenWithPasskey`) provide the same automatic token caching and session establishment as the simplified `signup()` and `login()` methods. After successful completion, `isAuthenticated()`, `getUser()`, and `getTokenSilently()` work as expected.

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
