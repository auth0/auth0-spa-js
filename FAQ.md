# Frequently Asked Questions

Below are a number of questions or issues that have arisen from using the SDK.

## Why is the user logged out when they refresh the page in their SPA?

After logging in, if the page is refreshed and the user appears logged out, it usually means that the silent authentication step has failed to work.

This could be affected by a couple of things:

- When not using refresh tokens, the SDK relies on third-party cookie support to log in silently. If you're not using refresh tokens, you could be using a browser that blocks third-party cookies by default (Safari, Brave, etc)
- You're using the [classic login experience](https://auth0.com/docs/universal-login/classic-experience), and trying to log in using a social provider that uses Auth0's developer keys (see [Limitations of Developer Keys when using Classic Universal Login](https://auth0.com/docs/connections/social/devkeys#limitations-of-developer-keys-when-using-classic-universal-login))

Please try these to see if you can get unblocked:

- Try it in a browser like Chrome which does not block third-party cookies by default (yet)
- Use the New Login Experience, if possible
- Supply the social connection with your own client ID and secret in the Auth0 dashboard

### Using Multi-factor Authentication (MFA)

By default, `auth0-spa-js` uses the `prompt=none` and `response_mode=web_message` flow for silent auth, which depends on the user's Auth0 session.

If you have "Require Multi-factor Auth" set to "Always" in your [Auth0 Dashboard](https://manage.auth0.com/#/security/mfa), silent authentication from your SPA will fail unless:

- The user is using a one-time code and selects "Remember me for 30 days"
- `allowRememberBrowser` is [configured in a Rule](https://auth0.com/docs/login/mfa/customize-mfa-user-pages#change-authentication-request-frequency) and `provider` is set to `google-authenticator`

If silent auth is being used and Auth0 needs interaction from the user to complete the MFA step, then authentication will fail with an `mfa_required` error and the user must log in interactively.

To resolve this:

- Use a Rule to [configure the MFA step](https://auth0.com/docs/login/mfa/customize-mfa-user-pages#change-authentication-request-frequency) to allow the user to remember the browser for up to 30 days
- Use refresh tokens + local storage so that the auto-login on page refresh does not depend on the user's session. Please [read the docs on storage options](https://auth0.com/docs/libraries/auth0-single-page-app-sdk#change-storage-options) and [rotating refresh tokens](https://auth0.com/docs/libraries/auth0-single-page-app-sdk#use-rotating-refresh-tokens) as these change the security profile of your application.

## Why does the `Auth0Client` object take a long time to initialize?

Sometimes the `createAuth0Client` asynchronous method can take over 30 seconds to complete. `createAuth0Client` may also return `undefined` and produce an error when you try to access it.

This is usually down to a configuration problem between your application, and the Auth0 application you're trying to log in with. Things to check:

- Make sure that options passed to `createAuth0Client` include the correct client ID and domain values for the app you're using
- Ensure that the **Allowed Callback URLs**, **Allowed Web Origins**, and **Allowed Logout URLs** are [correctly set up in your Auth0 app settings](https://auth0.com/docs/quickstart/spa/react/#configure-callback-urls) for your application

To verify that you're hitting this problem, [check the logs](https://manage.auth0.com/#/logs) in your Auth0 dashboard for any failed login events, which may provide a clue as to the problem.

## Why do I get an "invalid algorithm" error?

The SDK only supports JWTs that use the **RS256** [signing algorithm](https://auth0.com/docs/applications/concepts/signing-algorithms). If you're getting this error, it's likely that the Auth0 application you're authenticating with is set up to sign tokens using **HS256**.

The way around this error is to change the settings for your Auth0 application to sign tokens using RS256. To do this:

- Log in to [your dashboard](https://manage.auth0.com)
- Open the settings page for the application you're using
- Scroll to the bottom and click **Show advanced settings**
- Click the **OAuth** tab
- Ensure the **JsonWebToken Signature Algorithm** value is set to **RS256**
- Click **Save**

The next time you try to authenticate, you should not receive this error.

## Why do I get `auth0-spa-js must run on a secure origin`?

Internally, the SDK uses [Web Cryptography API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) to create [SHA-256 digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest).

According to the spec ([via Github issues](https://github.com/w3c/webcrypto/issues/28)), Web Cryptography API requires a secure origin, so that accessing `Crypto.subtle` in a not secure context return undefined.

In most browsers, secure origins are origins that match at least one of the following (scheme, host, port) patterns:

```
(https, *, *)
(wss, *, *)
(*, localhost, *)
(*, 127/8, *)
(*, ::1/128, *)
(file, *, —)
```

If you're running your application from a secure origin, it's possible that your browser doesn't support the Web Crypto API. For a compatibility table, please check https://caniuse.com/#feat=mdn-api_subtlecrypto

## Why am I getting a `missing_refresh_token` error after upgrading to v2?

v1 of the SDK used an iframe as a backup if no refresh token was available. You could control this behaviour with the `useRefreshTokensFallback` option, which was `true` by default. With v2, we have flipped the default for `useRefreshTokensFallback` to `false` (see [the migration guide](https://github.com/auth0/auth0-spa-js/blob/master/MIGRATION_GUIDE.md#no-more-iframe-fallback-by-default-when-using-refresh-tokens)). As a result, you may encounter `missing_refresh_token` errors. 

To mitigate this, use one of the following solutions:
- Handle the error, and log the user in again using `loginWithRedirect` or `loginWithPopup`.
- Revert to the v1 behaviour by setting `useRefreshTokenFallback` to `true`.

In all cases, the fallback will not work in browsers where third-party cookies are blocked, unless you are using [custom domains](https://auth0.com/docs/customize/custom-domains).

## Why is the passwordless magic link not working?

By default, the SDK stores transactional data in the browser's session storage. This means that the authentication flow needs to be finished in the same browser tab it was started.
This can cause issues when using passwordless with magic links, as that typically opens in a new tab. To solve this, our SDK can be configured to store the transactional data in a cookie instead of session storage:

```ts
new Auth0Client({
  useCookiesForTransaction: true
});
```

## Why is isAuthenticated returning true when there are no tokens available to call an API?
As long as the SDK has an id token, you are considered authenticated, because it knows who you are. It might be that there isn't a valid access token and you are unable to call an API, we still know who you are because of the id token.

Authentication is about who u are (id token), not what you can do (access token). The latter is authorization, which is also why you pass the access token to the API in the Authorization header.

So even when the refresh token fails, or `getTokenSilently` returning nothing, that doesn't impact the existence of the id token, and as a consequence of that, the authentication state. So it's expected for isAuthenticated to stay true in that case.

On top of that, the SDK can have multiple access tokens and multiple refresh tokens (e.g. when using multiple audience and scope combinations to call multiple API's), but only one id token.
If we have multiple access and refresh tokens, and one of the refresh tokens fails, it doesnt mean the other access tokens or refresh tokens are invalid and they might still be perfectly usable.
