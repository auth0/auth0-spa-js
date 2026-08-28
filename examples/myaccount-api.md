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
