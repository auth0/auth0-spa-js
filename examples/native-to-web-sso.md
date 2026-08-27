## Native to Web SSO

[Native to Web SSO](https://auth0.com/docs/authenticate/single-sign-on/native-to-web) enables seamless single sign-on when users transition from a native mobile application to a web application. The SDK can automatically extract session transfer tokens from URL query parameters and include them in authorization requests.

### Configuring Session Transfer Token Detection

To enable Native to Web SSO, configure the `sessionTransferTokenQueryParamName` option with the name of the query parameter that contains the session transfer token:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token', // Enable and configure
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// When your web app is opened with:
// https://yourapp.com?session_transfer_token=xyz123

// The SDK automatically includes the token in authorization:
await auth0.loginWithRedirect();
// The /authorize request will include session_transfer_token=xyz123
```

**Default:** The feature is **disabled by default** (`undefined`). You must explicitly configure a parameter name to enable it.

**Important:** After extracting the token, the SDK automatically removes it from the URL using `window.history.replaceState()`. This prevents the token from being accidentally reused on subsequent authentication requests, which is important since session transfer tokens are typically single-use.

### Using Custom Parameter Names

You can configure the SDK to extract the session transfer token from any query parameter name. This is useful if your native app uses a custom parameter name:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'stt', // Custom parameter name
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

// When your web app is opened with:
// https://yourapp.com?stt=xyz123

// The SDK extracts the token and sends it to Auth0 as session_transfer_token:
await auth0.loginWithRedirect();
```

The token is always sent to Auth0's `/authorize` endpoint as `session_transfer_token`, regardless of the parameter name you use in your app's URL.

### Using with loginWithPopup

The SDK supports Native to Web SSO with both `loginWithRedirect()` and `loginWithPopup()`. The session transfer token is automatically extracted from the URL and cleaned after use in both flows:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token'
});

// When your web app is opened with:
// https://yourapp.com?session_transfer_token=xyz123

// The SDK automatically includes the token in loginWithPopup:
await auth0.loginWithPopup();

// After login completes, the URL is cleaned:
// https://yourapp.com
```

This is particularly useful for web applications that prefer popup-based authentication flows, as the main page URL persists throughout the login process (unlike redirect flows where the browser navigates away).

### Manually Providing Session Transfer Token

You can also manually provide the session transfer token in `authorizationParams`, which overrides automatic detection:

```js
// Extract token from URL manually
const params = new URLSearchParams(window.location.search);
const sessionTransferToken = params.get('my_custom_param');

if (sessionTransferToken) {
  await auth0.loginWithRedirect({
    authorizationParams: {
      session_transfer_token: sessionTransferToken
    }
  });
}
```

**Note:** Manually provided tokens take precedence over automatically detected ones. When you provide a token manually, the URL is not automatically cleaned.

### Using with Organizations

When using Native to Web SSO with [Organizations](https://auth0.com/docs/manage-users/organizations), ensure the `organization` parameter in your web application matches the organization associated with the session transfer token:

```js
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  sessionTransferTokenQueryParamName: 'session_transfer_token'
});

// The native app authenticated with org_abc123
// The web app must use the same organization
await auth0.loginWithRedirect({
  authorizationParams: {
    organization: 'org_abc123'
    // session_transfer_token is automatically included from URL
  }
});
```

If there is an organization mismatch, authentication will fail and the user will be prompted to log in again.
