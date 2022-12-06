# SPA-JS v2 Migration Guide

With the v2 release of Auth0-SPA-JS, we have improved both performance and developer experience while trying to limit the amount of breaking changes. However, as with any major version bump, v2 of Auth0-SPA-JS contains a set of breaking changes.

**Please review this guide thoroughly to understand the changes required to migrate your application to v2.**

- [Polyfills and supported browsers](#polyfills-and-supported-browsers)
- [Public API changes](#public-api-changes)
  - [client_id has been renamed to clientId](#client_id-has-been-renamed-to-clientid)
  - [Introduction of authorizationParams](#introduction-of-authorizationparams)
  - [Introduction of logoutParams](#introduction-of-logoutparams)
  - [buildAuthorizeUrl has been removed](#buildauthorizeurl-has-been-removed)
  - [buildLogoutUrl has been removed](#buildlogouturl-has-been-removed)
  - [localOnly logout has been removed, and replaced by openUrl](#localonly-logout-has-been-removed-and-replaced-by-openurl)
  - [redirectMethod has been removed from loginWithRedirect](#redirectmethod-has-been-removed-from-loginwithredirect)
  - [ignoreCache on getTokenSilentlyhas been replaced by cacheMode](#ignorecache-on-gettokensilently-has-been-replaced-by-cachemode)
  - [application/x-www-form-urlencoded is used by default instead of application/json](#applicationx-www-form-urlencoded-is-used-by-default-instead-of-applicationjson)
  - [No more iframe fallback by default when using refresh tokens](#no-more-iframe-fallback-by-default-when-using-refresh-tokens)
  - [getUser and getIdTokenClaims](#getuser-and-getidtokenclaims)
  - [Changes to default scopes (profile and email)](#changes-to-default-scopes-profile-and-email)
    - [advancedOptions and defaultScope are removed](#advancedoptions-and-defaultscope-are-removed)
  - [checkSession no longer throws exceptions](#checksession-no-longer-throws-exceptions)
  - [getIdTokenClaimsOptions type has been removed](#getidtokenclaimsoptions-type-has-been-removed)
- [Module output](#module-output)
  - [No more default export](#no-more-default-export)
  - [Changes on how to create an instance when relying on globally available API’s (e.g. using CDN)](#changes-on-how-to-create-an-instance-when-relying-on-globally-available-apis-eg-using-cdn)

## Polyfills and supported browsers

As [Microsoft has dropped support for IE11](https://blogs.windows.com/windowsexperience/2022/06/15/internet-explorer-11-has-retired-and-is-officially-out-of-support-what-you-need-to-know), we are no longer including any polyfills in our bundle, as all of these polyfills were for IE11. Therefore <u>we no longer support IE11 from v2 of this SDK</u>. In addition, our bundle output is now set to ES2017, which should work fine on all major browsers.

The following is the list of polyfills that got removed. If you would need any of these, you will need to include these in your application.

- [AbortController](https://www.npmjs.com/package/abortcontroller-polyfill): Used to polyfill [AbortController on IE11, Opera Mini, and some mobile-specific browsers](https://caniuse.com/?search=abortcontroller).
- [Promise](https://www.npmjs.com/package/promise-polyfill): Used to polyfill [Promise on IE11 and Opera Mini](https://caniuse.com/promises)
- [Core-js](https://www.npmjs.com/package/core-js): Used to polyfill a couple of things, also mostly on IE11, Opera Mini, and some mobile-specific browsers:
  - [string/startsWith](https://caniuse.com/?search=startsWith)
  - [string/includes](https://caniuse.com/es6-string-includes)
  - [set](https://caniuse.com/mdn-javascript_builtins_set)
  - [symbol](https://caniuse.com/mdn-javascript_builtins_symbol)
  - [array/from](https://caniuse.com/mdn-javascript_builtins_array_from)
  - [array/includes](https://caniuse.com/array-includes)
- [fast-text-encoding](https://www.npmjs.com/package/fast-text-encoding): Used to polyfill TextEncoder and TextDecoder on IE11 and Opera Mini.
- [unfetch](https://www.npmjs.com/package/unfetch): Used to [ponyfill fetch on IE11](https://caniuse.com/?search=fetch).

Because of this, we have <u>dropped 60% in bundle size</u>, ensuring your users have a better experience when integrating Auth0 using our SPA-JS SDK.

## Public API changes

With the release of this new major version, a couple of changes were made that affect the public API of the Auth0-SPA-JS SDK. Most of these should be noticed by TypeScript. However, it’s advised to take the time to go through this list thoroughly.

### `client_id` has been renamed to `clientId`

A breaking change that will affect everyone is the renaming of `client_id` to `clientId` in pretty much every method that accepts a client identifier. As an example, providing the client id in v1 can be done by setting `client_id`:

```ts
const client = new Auth0Client({ client_id: '' });
```

While with v2, you need to set `clientId` instead.

```ts
const client = new Auth0Client({ clientId: '' });
```

This change needs to occur with every method on `Auth0Client` that takes a client id.

### Introduction of `authorizationParams`

Another breaking change that will affect pretty much everyone is the introduction of `authorizationParams`, a more structured approach to providing parameters - including custom parameters - to Auth0.

In v1, objects passed to our methods are always a mix of properties used for configuring the SDK and properties with the sole purpose to pass through to Auth0.

```ts
const client = new Auth0Client({
  client_id: '',
  audience: '',
  redirect_uri: '',
});

await client.loginWithRedirect({
  appState: {
    key: value // state to restore when getting redirected back
  }
  screen_hint: 'signup', // 1st-class property to send to Auth0
  any_custom_property: 'value' // Any additional custom property to send to Auth0
});
```

With v2 of our SDK, we have improved the API by separating those properties used to configure the SDK, from properties that are sent to Auth0. The SDK configuration properties will stay on the root, while any property that should be sent to Auth0 should be set on `authorizationParams`.

```ts
const client = new Auth0Client({
  clientId: '',
  authorizationParams: {
    audience: '',
    redirect_uri: ''
  }
});

await client.loginWithRedirect({
  appState: {
    key: value // state to restore when getting redirected back
  },
  authorizationParams: {
    screen_hint: 'signup',
    any_custom_property: 'value'
  }
});
```

The above changes affect the following methods:

- loginWithRedirect
- loginWithPopup
- getTokenWithPopup
- getTokenSilently

If you are using any of the above methods in your application(s), ensure to update all of these as mentioned above.

### Introduction of `logoutParams`

In v1 of our SDK, `logout` can be called with an object containing a number of properties, both a mix between properties used to configure the SDK as well as those used to pass through to Auth0.

With v2, logout now takes an object that can only contain two properties, `clientId` and `logoutParams`.

Any property, apart from clientId, that you used to set on the root of the object passed to `logout` should now be set on `logoutParams` instead.

```ts
await client.logout({
  clientId: '',
  logoutParams: {
    federated: true / false,
    returnTo: '',
    any_custom_property: 'value'
  }
});
```

### `buildAuthorizeUrl` has been removed

In v1, we introduced `buildAuthorizeUrl` for applications that couldn’t rely on `window.location.assign` to redirect to Auth0 when calling `loginWithRedirect`, a typical example is for people using v1 of our SDK with Ionic:

```ts
// Ask auth0-spa-js to build the login URL
const url = await client.buildAuthorizeUrl();
// Redirect using Capacitor's Browser plugin
await Browser.open({ url });
```

With v2, we have removed `buildAuthorizeUrl`. This means that the snippet above will no longer work, and you should update your code by using `openUrl` instead.

```ts
await client.loginWithRedirect({
  async openUrl(url) {
    // Redirect using Capacitor's Browser plugin
    await Browser.open({ url });
  }
});
```

The above snippet aligns more with the intent, using our SDK to login but relying on Capacitor (or any other external browser) to do the actual redirect.

### `buildLogoutUrl` has been removed

In v1, we introduced `buildLogoutUrl` for applications that are unable to use `window.location.assign` when logging out from Auth0, a typical example is for people using v1 of our SDK with Ionic:

```ts
// Ask auth0-spa-js to build the logout URL
const url = await client.buildLogoutUrl();
// Redirect using Capacitor's Browser plugin
await Browser.open({ url });
```

With v2, `buildLogoutUrl` has been removed and you should update any code that is not able to rely on `window.location.assign` to use `openUrl` when calling `logout`:

```ts
client.logout({
  async openUrl(url) {
    // Redirect using Capacitor's Browser plugin
    await Browser.open({ url });
  }
});
```

This method was removed because, when using our SDK, the logout method is expected to be called regardless of the browser used. Instead of calling both `logout` and `buildLogoutUrl`, you can now change the redirect behaviour when calling `logout`.

### `localOnly` logout has been removed, and replaced by `openUrl: false`

When calling the SDK's `logout` method, v1 supports the ability to specify `localOnly: true`, ensuring our SDK does not redirect to Auth0 but only clears the user state from the application.

With v2, we have removed `localOnly`, but instead provided a way for developers to take control of the redirect behavior by setting `openUrl`. In order to achieve localOnly logout with v2, you should set `openUrl` to false.

```ts
client.logout({
  openUrl: false
});
```

### `redirectMethod` has been removed from `loginWithRedirect`

In v1, Auth0Client’s `loginWithRedirect` takes a `redirectMethod` that can be set to any of `assign` and `replace`, allowing the users to control whether the SDK should redirect using `window.location.assign` or `window.location.replace`.

```ts
await client.loginWithRedirect({
  redirectMethod: 'replace'
});
```

With the release of v2, we have removed `redirectMethod`. If you want to use anything but `window.location.assign` to handle the redirect to Auth0, you should implement `openUrl`:

```ts
await client.loginWithRedirect({
  async openUrl(url) {
    window.location.replace(url);
  }
});
```

### `ignoreCache` on `getTokenSilently` has been replaced by `cacheMode`

In v1, users can bypass the cache when calling getTokenSilently by passing ignoreCache: true.

```ts
const token = await client.getTokenSilently({ ignoreCache: true });
```

With v2, we wanted to add the ability to only retrieve a token from the cache, without contacting Auth0 if no token was found. To do so, we have removed the `ignoreCache` property and replaced it with `cacheMode` that can take any of the following three values:

- **on** (default): read from the cache caching, but fall back to Auth0 as needed
- **off**: ignore the cache, instead always call Auth0
- **cache-only**: read from the cache, don’t fall back to Auth0

Any code that was previously using `ignoreCache: true` should be changed to use `cacheMode: 'off'`:

```ts
const token = await client.getTokenSilently({ cacheMode: 'off' });
```

### `application/x-www-form-urlencoded` is used by default instead of `application/json`

Auth0’s token endpoint supports both `application/x-www-form-urlencoded` and `application/json` content types. However, using `application/x-www-form-urlencoded` provides a small performance benefit.

In v1 of the SDK, the default was to send request to /oauth/token using json, allowing to opt-in to use x-www-form-urlencoded by setting the `useFormData` flag to _true_.

With v2, we have flipped the default value for `useFormData` to **true**, meaning we will be sending requests to Auth0’s token endpoint using `application/x-www-form-urlencoded` as the content type by default.

> :warning: This can affect existing rules and actions, and it’s important to ensure all your actions still work as expected after upgrading to v2.
> To restore the original behaviour, you can set `useFormData` to **false**, and your rules and actions should continue to work as before.

### No more iframe fallback by default when using refresh tokens

When using refresh tokens in v1, we fall back to using iframes whenever a refresh token exchange would fail. This has caused problems before in environments that do not support iframes, and we have specifically introduced `useRefreshTokensFallback` to be able to opt-out of falling back to iframes in the case a refresh_grant fails.

With v2, we have flipped the default value for `useRefreshTokensFallback` to false we do not fall back to using iframes by default when `useRefreshTokens` is `true`, and the refresh token exchange fails.

If you want to restore the original behaviour, and still fall back to iframes when the refresh token exchange fails, you can set `useRefreshTokensFallback` to true.

### `getUser` and `getIdTokenClaims`

With v1 of our SDK, both `getUser` and `getIdTokenClaims` supported optional audience and scope parameters when retrieving the user profile.

```ts
const user = await getUser();
const user = await getUser({ audience, scope });

const claims = await getIdTokenClaims();
const claims = await getIdTokenClaims({ audience, scope });
```

As an application should only have one user, it makes little sense to be passing these parameters when trying to retrieve the current user.

With v2, both `getUser` and `getIdTokenClaims` have dropped support for any arguments, and should be called as such.

```ts
const user = await getUser();
const claims = await getIdTokenClaims();
```

### Changes to default scopes (profile and email)

Our SDK defaults to requesting `openid profile email` as the scopes. However, when the user explicitly sets the `scope` when constructing `Auth0Client`, v1 would still include `openid profile email` as well.

With v2, we have reworked this to still default to `openid profile email` when the scope property has been omitted, but only include openid when the user sets a scope explicitly.

This means that the following code in v1:

```ts
const client = new Auth0Client({
  scope: 'scope1'
});
```

Needs to be updated to explicitly include the `profile email` scopes to achieve the same in v2:

```ts
const client = new Auth0Client({
  scope: 'profile email scope1'
});
```

#### advancedOptions and defaultScope are removed

With v1 of our SDK, users can set both `scope: '...'` and `advancedOptions: { defaultScope: '...' }` when constructing `Auth0Client`. As this has proven to be confusing, with v2 we have decided to drop `defaultScope` altogether. As this was its own property, we have also removed `advancedOptions`. Any code that used to rely on `defaultScope` will need to move those scopes into `scope` instead:

```ts
const client = new Auth0Client({
  advancedOptions: { defaultScope: 'email' }
  scope: 'scope1'
});
```

Will need to move those scopes into `scope` instead:

```ts
const client = new Auth0Client({
  scope: 'email scope1'
});
```

As you can see, `scope` becomes a merged value of the previous `defaultScope` and `scope`.

### `checkSession` no longer throws exceptions

The SDK’s checkSession method is a method that’s supposed to be called when the page has finished loading, to see if the SDK can determine the user based on any information available from previous sessions.

This could result in certain exceptions when there are issues with your SDK and/or Auth0 tenant configuration. Getting these errors when calling checkSession has shown to be confusing, and it makes more sense to throw these exceptions when the user has explicitly interacted with Auth0, for example by calling `loginWithRedirect` or `getTokenSilently`.

With v2, calling `checkSession` will not throw any exceptions, while still showing these errors when calling any other SDK’s method.

### `getIdTokenClaimsOptions` type has been removed

In v1, `getIdTokenClaimsOptions` is an alias for `GetIdTokenClaimsOptions` which was added to avoid introducing a breaking change when the type was renamed. With v2, we have removed `getIdTokenClaimsOptions` and only allow using `GetIdTokenClaimsOptions`.

## Module output

### No more default export

Previously our SDK exported a default function that’s both our `createAuth0Client` factory, as well as contained additional functions such as `Auth0Client`, as well as our different types of errors.

```ts
import createAuth0Client from '@auth0/auth0-spa-js';

const client = createAuth0Client();
const client = createAuth0Client.createAuth0Client();
const client = new createAuth0Client.Auth0Client();
const errorTypes = [createAuth0Client.GenericError, ...];
```

With the release of v2, we no longer export a default value, instead, each exported value is only available by using a named import.

```ts
import {createAuth0Client, Auth0Client, GenericError} from '@auth0/auth0-spa-js';

const client = createAuth0Client();
const client = new Auth0Client();
const errorTypes = [GenericError, ...]
```

The above syntax is, for the most part, also available in v1, so this is not something entirely new. The thing that’s changed is the fact that `createAuth0Client` is now also a named export, without any additional methods attached to it.

### Changes on how to create an instance when relying on globally available API’s (e.g. using CDN)

On top of that, we also used to have a globally available `createAuth0Client` and `Auth0Client`, which is typically used for applications that do not use a module loader and/or bundler.

As of v2, these applications will need to update their code to ensure they access `createAuth0Client` and `Auth0Client` from the globally available `auth0` property instead of directly on the window object.

```ts
const client = auth0.createAuth0Client();
const client = new auth0.Auth0Client();
```
