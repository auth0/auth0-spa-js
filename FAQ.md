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

## Why do I get `Error: Invalid state` in Firefox when refreshing the page immediately after a login?

This is caused by a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1422334) in Firefox.

When logging in with a redirect, you will be redirected back to your app with `code` and `state` values set as URL query parameters. These values are used by `handleRedirectCallback` to obtain an access token, and should be removed from the URL and browser history when the `code` has been successfully exchanged for a token (to reduce attack surface). This can be done with [history.replaceState](<https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method>).

For example, in the [Auth0 React Samples](https://github.com/auth0-samples/auth0-react-samples), a function [onRedirectCallback](https://github.com/auth0-samples/auth0-react-samples/blob/master/01-Login/src/react-auth0-spa.js#L27) is called for this purpose. This function [calls](https://github.com/auth0-samples/auth0-react-samples/blob/master/01-Login/src/index.js#L10) `history.replaceState`. But due to the mentioned bug, Firefox will reload the last URL from cache when refreshing the page (i.e. the "last" URL before calling `history.replaceState`).

This means that after logging in and being redirected to your app with `state` and `code` parameters in the URL, even though `history.replaceState` removed them from the URL and browser history, the bug just loads the full redirect URL from cache when you refresh the page. For example `http://localhost:3000?code=123&state=xyz`.

In the sample app this triggers the [handleRedirectCallback](https://github.com/auth0-samples/auth0-react-samples/blob/master/01-Login/src/react-auth0-spa.js#L25) code again, but with "stale" `code` and `state` values. And this result in `Error: Invalid state`, because the `code` already has been exchanged for a token, making the `state` invalid at this point in time.

We can fix this with a temporary workaround (suggested in the Firefox bug report) by adding `location.hash = location.hash;` **before** calling `history.replaceState`:

```js
const onRedirectCallback = appState => {
  // Temporary Firefox workaround
  window.location.hash = window.location.hash; // eslint-disable-line no-self-assign

  window.history.replaceState(
    {},
    document.title,
    appState && appState.targetUrl
      ? appState.targetUrl
      : window.location.pathname
  );
};
```

With this change, an immediate refresh after login works as expected.

Note that even though the workaround doesn't cause any weird side effects in browers, you should ideally remove it after the bug has been fixed in Firefox.

For more context see this [issue](https://github.com/auth0-samples/auth0-react-samples/issues/145).

## Why do I get `auth0_spa_js_1.default is not a function` when using Typescript?

If you're hitting this issue, set `esModuleInterop: true` in your `tsconfig.json` file (inside `compilerOptions`).

Due to how the type system works in Typescript, if one of your dependencies uses `allowSyntheticDefaultImports: true`, then all the consumers of that dependency must use `allowSyntheticDefaultImports: true` as well. This, of course, is not ideal and might break your app if you depend on this setting being `false`. The Typescript team added the `esModuleInterop` flag that helps in this scenario.

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
