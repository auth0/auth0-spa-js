## Custom Token Exchange (CTE)

Enable secure token exchange between external identity providers and Auth0 using RFC 8693 standards.

### Basic Implementation

```js
// Initialize client with custom token exchange configuration
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    audience: 'https://your-api.example.com'
  }
});

// Exchange external token for Auth0 tokens and log user in
async function performTokenExchange() {
  try {
    // Option 1: Use client's default audience
    const tokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      scope: 'openid profile email'
      // audience will default to audience from client config
    });

    // Option 2: Specify custom audience for this token exchange
    const customTokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      audience: 'https://different-api.example.com',
      scope: 'openid profile read:records'
    });

    // Option 3: Exchange token within an organization context
    const orgTokenResponse = await auth0.loginWithCustomTokenExchange({
      subject_token: 'EXTERNAL_PROVIDER_TOKEN',
      subject_token_type: 'urn:example:external-token',
      organization: '<MY_ORG_ID_OR_NAME>', // Organization ID or name
      scope: 'openid profile email'
    });

    console.log('Received tokens:', tokenResponse);

    // User is now logged in - you can access user info
    const user = await auth0.getUser();
    console.log('Logged in user:', user);
  } catch (error) {
    console.error('Exchange failed:', error);
  }
}

// Note: exchangeToken() is deprecated - use loginWithCustomTokenExchange() instead
```

> ⚠️ **Deprecated** — `exchangeToken()` will be removed in the next major version. Use `loginWithCustomTokenExchange()` instead.

### Required Auth0 Configuration

1. **Create Token Exchange Profile** in Auth0 Dashboard:

```typescript
await managementClient.tokenExchangeProfiles.create({
  action_id: 'custom-auth-action',
  name: 'External System Exchange',
  subject_token_type: 'urn:example:external-token',
  type: 'custom_authentication'
});
```

2. **Add Required Scopes** to your API in Auth0:

```text
urn:auth0:oauth2:grant-type:token-exchange
```

### Security Considerations

- Validate external tokens in Auth0 Actions using cryptographic verification
- Implement anti-replay mechanisms for subject tokens
- Store refresh tokens securely when using `offline_access` scope

### Error Handling

```js
async function safeTokenExchange() {
  try {
    return await auth0.loginWithCustomTokenExchange(/* ... */);
  } catch (error) {
    if (error.error === 'invalid_token') {
      // Handle token validation errors
      await auth0.logout();
      window.location.reload();
      return;
    }
    if (error.error === 'insufficient_scope') {
      // Request additional scopes
      return await auth0.loginWithPopup({
        authorizationParams: {
          scope: 'additional_scope_required'
        }
      });
    }

    // Network and server failures are not handled here
    throw error;
  }
}
```

### Delegation and Impersonation

Use `customTokenExchange()` when one principal needs to act on behalf of another — for example, an AI agent acting on behalf of a user. Unlike `loginWithCustomTokenExchange()`, this method has no side effects: it does not update the session or affect `isAuthenticated()` / `getUser()`.

Pass `actor_token` and `actor_token_type` alongside the subject token to identify the acting party per [RFC 8693](https://tools.ietf.org/html/rfc8693):

```js
const tokenResponse = await auth0.customTokenExchange({
  subject_token: '<USER_TOKEN>',
  subject_token_type: 'urn:acme:user-token',
  actor_token: '<AGENT_TOKEN>',
  actor_token_type: 'https://idp.example.com/token-type/agent',
  audience: 'https://api.example.com'
});

// Use tokenResponse.access_token to call a downstream API
// The current user session is unchanged
```

[Token Exchange Documentation](https://auth0.com/docs/authenticate/login/token-exchange)
[RFC 8693 Spec](https://tools.ietf.org/html/rfc8693)
