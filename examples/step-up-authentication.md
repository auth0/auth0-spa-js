## Step-Up Authentication

Step-up authentication lets you request elevated access for sensitive operations (e.g. a specific audience or scope) and automatically handle MFA challenges via a popup, without manually catching errors or managing the MFA API.

When `getTokenSilently()` encounters an MFA step-up error and `interactiveErrorHandler` is configured, the SDK automatically opens a Universal Login popup to complete MFA, then returns the token. This works regardless of whether you use refresh tokens (`useRefreshTokens: true`) or the default configuration.

### Setup

Enable the interactive error handler when creating the client. Step-up authentication works with or without refresh tokens — no additional configuration is needed. When using refresh tokens, consider combining with [Multi-Resource Refresh Tokens (MRRT)](refresh-tokens.md#using-multi-resource-refresh-tokens), which allow a single refresh token to obtain access tokens for multiple APIs — making step-up requests across different audiences seamless.

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  interactiveErrorHandler: 'popup',
  useRefreshTokens: true, // optional — works with or without refresh tokens
  useMrrt: true, // optional — useful when stepping up across multiple APIs
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

### Usage

Call `getTokenSilently()` with the audience and scope that require step-up authentication. If MFA is required, the popup opens automatically and the token is returned once the user completes the challenge — no manual error handling needed.

```js
const accessToken = await auth0.getTokenSilently({
  authorizationParams: {
    audience: 'https://api.example.com',
    scope: 'read:sensitive-data'
  }
});

const result = await fetch('https://api.example.com/sensitive', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Error Handling

The MFA challenge itself is handled automatically, but popup lifecycle errors can still occur. These are thrown to the caller:

```js
import {
  PopupOpenError,
  PopupCancelledError,
  PopupTimeoutError
} from '@auth0/auth0-spa-js';

try {
  const accessToken = await auth0.getTokenSilently({
    authorizationParams: {
      audience: 'https://api.example.com',
      scope: 'read:sensitive-data'
    }
  });
} catch (error) {
  if (error instanceof PopupOpenError) {
    // Browser blocked the popup — prompt user to allow popups
  }
  if (error instanceof PopupCancelledError) {
    // User closed the popup before completing MFA
  }
  if (error instanceof PopupTimeoutError) {
    // Popup did not complete within the allowed time
  }
}
```

> [!NOTE]
> If `interactiveErrorHandler` is not configured, MFA errors are thrown to the caller as usual. When using refresh tokens, you can handle `MfaRequiredError` manually using the [MFA API](mfa.md#multi-factor-authentication-mfa).
