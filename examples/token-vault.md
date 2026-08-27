## Connect Accounts for using Token Vault

The Connect Accounts feature uses the Auth0 My Account API to allow users to link multiple third party accounts to a single Auth0 user profile.

When using Connected Accounts, Auth0 acquires tokens from upstream Identity Providers (like Google) and stores them in a secure [Token Vault](https://auth0.com/docs/secure/tokens/token-vault). These tokens can then be used to access third-party APIs (like Google Calendar) on behalf of the user.

The tokens in the Token Vault are then accessible to [Resource Servers](https://auth0.com/docs/get-started/apis) (APIs) configured in Auth0. The SPA application can then issue requests to the API, which can retrieve the tokens from the Token Vault and use them to access the third-party APIs.

This is particularly useful for applications that require access to different resources on behalf of a user, like AI Agents.

### Configure the SDK

The SDK must be configured with an audience (an API Identifier) - this will be the resource server that uses the tokens from the Token Vault.

The SDK must also be configured to use refresh tokens and MRRT ([Multiple Resource Refresh Tokens](https://auth0.com/docs/secure/tokens/refresh-tokens/multi-resource-refresh-token)) since we will use the refresh token grant to get Access Tokens for the My Account API in addition to the API we are calling.

The My Account API requires DPoP tokens, so we also need to enable DPoP.

```js
const auth0 = new Auth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  useRefreshTokens: true,
  useMrrt: true,
  useDpop: true,
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});
```

### Login to the application

Use the login methods to authenticate to the application and get a refresh and access token for the API.

```js
// Login specifying any scopes for the Auth0 API
await auth0.loginWithRedirect({
  authorizationParams: {
    audience: '<AUTH0 API IDENTIFIER>',
    scope: 'openid profile email read:calendar'
  }
});

// Handle redirect callback on login.
const query = new URLSearchParams(window.location.search);
if ((query.has('code') || query.has('error')) && query.has('state')) {
  await auth0.handleRedirectCallback();
  const user = await auth0.getUser();
  console.log(user);
}
```

### Connect to a third party account

Use the new `connectAccountWithRedirect` method to redirect the user to the third party Identity Provider to connect their account.

```js
// Start the connect flow by redirecting to the thrid party API's login, defined as an Auth0 connection
await auth0.connectAccountWithRedirect({
  connection: '<CONNECTION eg, google-apps-connection>',
  scopes: ['<SCOPE eg https://www.googleapis.com/auth/calendar.acls.readonly>'],
  authorizationParams: {
    // additional authorization params to forward to the authorization server
  }
});

// Handle redirect callback on connect. *Note* the `connect_code` param
const query = new URLSearchParams(window.location.search);
if ((query.has('connect_code') || query.has('error')) && query.has('state')) {
  const result = await auth0.handleRedirectCallback();
  if (result.connection) {
    console.log(`You are connected to ${result.connection}!`);
  }
}
```

You can now [call the API](calling-an-api.md#calling-an-api) with your access token and the API can use [Access Token Exchange with Token Vault](https://auth0.com/docs/secure/tokens/token-vault/access-token-exchange-with-token-vault) to get tokens from the Token Vault to access third party APIs on behalf of the user.

> [!IMPORTANT]
> You must enable `Offline Access` from the Connection Permissions settings to be able to use the connection with Connected Accounts.
