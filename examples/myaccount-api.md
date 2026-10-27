## MyAccount API

The MyAccount API lets you manage the current user's profile, authentication methods, factors, and connected accounts directly from the SPA.

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
const updatedPhone = await auth0.myAccount.updateAuthenticationMethod(
  'am_abc123',
  {
    preferred_authentication_method: 'voice'
  }
);
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

### Profile

Read and update the current user's profile. `getUserProfile()` needs the `read:me:profile` scope, and `updateUserProfile()` needs `update:me:profile`.

> [!NOTE]
> The profile endpoints must be enabled for your tenant. If they aren't, or the scopes weren't granted, both methods throw a `MyAccountApiError` with `status` `403`.

#### Get Profile

```js
const profile = await auth0.myAccount.getUserProfile();
// profile.given_name, profile.email, ...
```

The response includes `profile_policy`, which describes each field. Use it to decide which fields the user can edit:

```js
for (const [pointer, policy] of Object.entries(profile.profile_policy)) {
  const field = pointer.slice(1); // '/given_name' -> 'given_name'
  const editable = policy.access === 'read_write';
  // policy.reason — why the field is read-only, e.g. 'managed_by_identity_provider'
}
```

#### Select Fields

```js
// Only these fields, without profile_policy
const basic = await auth0.myAccount.getUserProfile({
  fields: ['given_name', 'family_name', 'picture']
});

// Everything except profile_policy
const withoutPolicy = await auth0.myAccount.getUserProfile({
  fields: ['profile_policy'],
  includeFields: false
});
```

#### Update Profile

Only the fields you send are changed. The response is the full updated profile.

```js
const updated = await auth0.myAccount.updateUserProfile({
  given_name: 'Alice',
  nickname: 'wonderland_alice'
});
```

If a field is read-only for this user (for example, `given_name` for a social login user), the request fails with a `MyAccountApiError` and nothing is saved. `err.validation_errors` says which field was rejected:

```js
import { MyAccountApiError } from '@auth0/auth0-spa-js';

try {
  await auth0.myAccount.updateUserProfile({ given_name: 'Alice' });
} catch (err) {
  if (err instanceof MyAccountApiError) {
    err.validation_errors?.forEach(e => console.error(e.pointer, e.detail));
  }
}
```

### Error Handling

Every MyAccount API call can throw one of two errors — wrap them all the same way:

- **`GenericError` (`error === 'missing_access_token'`)** — thrown before the request is made when no access token is available (e.g. `cacheMode: 'cache-only'` cache miss or session ceiling reached). Redirect the user to log in.
- **`MyAccountApiError`** — thrown when the API responds with an error. Contains RFC 7807 fields (`status`, `title`, `detail`, and optionally `validation_errors`).

```js
import { GenericError, MyAccountApiError } from '@auth0/auth0-spa-js';

try {
  await auth0.myAccount.enrollmentChallenge({ type: 'passkey' });
} catch (err) {
  if (err instanceof GenericError && err.error === 'missing_access_token') {
    // No token available — redirect the user to log in.
  } else if (err instanceof MyAccountApiError) {
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
