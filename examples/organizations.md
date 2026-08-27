## Organizations

[Organizations](https://auth0.com/docs/organizations) is a set of features that provide better support for developers who build and maintain SaaS and Business-to-Business (B2B) applications.

### Log in to an organization

Log in to an organization by specifying the `organization` parameter when setting up the client:

```js
await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});
```

You can also specify the organization when logging in:

```js
// Using a redirect
await client.loginWithRedirect({
  authorizationParams: {
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});

// Using a popup window
await client.loginWithPopup({
  authorizationParams: {
    organization: '<MY_ORG_ID_OR_NAME>'
  }
});
```

### Switch to a different organization

When working with multiple organizations, there might be a situation where you want your users to be able to switch between different organizations.

To do this, clear the local logged in state from your application and login to Auth0 again, leveraging any existing Auth0 session to prevent the user from being prompted for their credentials.

```ts
async function switchOrganization(newOrganization: string) {
  await client.logout({ openUrl: false });
  await client.loginWithRedirect({
    authorizationParams: {
      organization: newOrganization
    }
  });
}
```

**Note:** Ensure to pass any additional parameters to `loginWithRedirect` (or `loginWithPopup`) just as you might have passed on other occurences of calling login.

### Accept user invitations

Accept a user invitation through the SDK by creating a route within your application that can handle the user invitation URL, and log the user in by passing the `organization` and `invitation` parameters from this URL. You can either use `loginWithRedirect` or `loginWithPopup` as needed.

```js
const url = new URL(invitationUrl);
const params = new URLSearchParams(url.search);
const organization = params.get('organization');
const invitation = params.get('invitation');

if (organization && invitation) {
  await client.loginWithRedirect({
    authorizationParams: {
      invitation,
      organization
    }
  });
}
```
