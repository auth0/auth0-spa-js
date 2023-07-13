![Auth0 SDK for Single Page Applications using Authorization Code Grant Flow with PKCE.](https://cdn.auth0.com/website/sdks/banners/spa-js-banner.png)

![Release](https://img.shields.io/npm/v/@auth0/auth0-spa-js)
[![Codecov](https://img.shields.io/codecov/c/github/auth0/auth0-spa-js)](https://codecov.io/gh/auth0/auth0-spa-js)
![Downloads](https://img.shields.io/npm/dw/@auth0/auth0-spa-js)
[![License](https://img.shields.io/:license-mit-blue.svg?style=flat)](https://opensource.org/licenses/MIT)
![CircleCI](https://img.shields.io/circleci/build/github/auth0/auth0-spa-js)

📚 [Documentation](#documentation) - 🚀 [Getting Started](#getting-started) - 💻 [API Reference](#api-reference) - 💬 [Feedback](#feedback)

## Documentation

- [Quickstart](https://auth0.com/docs/quickstart/spa/vanillajs/interactive) - our interactive guide for quickly adding login, logout and user information to your app using Auth0.
- [Sample app](https://github.com/auth0-samples/auth0-javascript-samples/tree/master/01-Login) - a full-fledged sample app integrated with Auth0.
- [FAQs](https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md) - frequently asked questions about auth0-spa-js SDK.
- [Examples](https://github.com/auth0/auth0-spa-js/blob/master/EXAMPLES.md) - code samples for common scenarios.
- [Docs Site](https://auth0.com/docs) - explore our Docs site and learn more about Auth0.

## Getting Started

### Installation

Using [npm](https://npmjs.org) in your project directory run the following command:

```sh
npm install @auth0/auth0-spa-js
```

From the CDN:

```html
<script src="https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js"></script>
```

### Configure Auth0

Create a **Single Page Application** in the [Auth0 Dashboard](https://manage.auth0.com/#/applications).

> **If you're using an existing application**, verify that you have configured the following settings in your Single Page Application:
>
> - Click on the "Settings" tab of your application's page.
> - Ensure that "Token Endpoint Authentication Method" under "Application Properties" is set to "None"
> - Scroll down and click on the "Show Advanced Settings" link.
> - Under "Advanced Settings", click on the "OAuth" tab.
> - Ensure that "JsonWebToken Signature Algorithm" is set to `RS256` and that "OIDC Conformant" is enabled.

Next, configure the following URLs for your application under the "Application URIs" section of the "Settings" page:

- **Allowed Callback URLs**: `http://localhost:3000`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

> These URLs should reflect the origins that your application is running on. **Allowed Callback URLs** may also include a path, depending on where you're handling the callback (see below).

Take note of the **Client ID** and **Domain** values under the "Basic Information" section. You'll need these values in the next step.

### Configure the SDK

Create an `Auth0Client` instance before rendering or initializing your application. You should only have one instance of the client.

```js
import { createAuth0Client } from '@auth0/auth0-spa-js';

//with async/await
const auth0 = await createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

//or, you can just instantiate the client on its own
import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>'
  }
});

//if you do this, you'll need to check the session yourself
try {
  await auth0.getTokenSilently();
} catch (error) {
  if (error.error !== 'login_required') {
    throw error;
  }
}
```

### Logging In

You can then use login using the `Auth0Client` instance you created:

```html
<button id="login">Click to Login</button>
```

```js
//redirect to the Universal Login Page
document.getElementById('login').addEventListener('click', async () => {
  await auth0.loginWithRedirect();
});

//in your callback route (<MY_CALLBACK_URL>)
window.addEventListener('load', async () => {
  const redirectResult = await auth0.handleRedirectCallback();
  //logged in. you can get the user profile like this:
  const user = await auth0.getUser();
  console.log(user);
});
```

For other comprehensive examples, see the [EXAMPLES.md](https://github.com/auth0/auth0-spa-js/blob/master/EXAMPLES.md) document.

## API Reference

Explore API Methods available in auth0-spa-js.

- [Configuration Options](https://auth0.github.io/auth0-spa-js/interfaces/Auth0ClientOptions.html)

- [Auth0Client](https://auth0.github.io/auth0-spa-js/classes/Auth0Client.html)
- [createAuth0Client](https://auth0.github.io/auth0-spa-js/functions/createAuth0Client.html)

## Feedback

### Contributing

We appreciate feedback and contribution to this repo! Before you get started, please see the following:

- [Auth0's general contribution guidelines](https://github.com/auth0/open-source-template/blob/master/GENERAL-CONTRIBUTING.md)
- [Auth0's code of conduct guidelines](https://github.com/auth0/open-source-template/blob/master/CODE-OF-CONDUCT.md)
- [This repo's contribution guide](https://github.com/auth0/auth0-spa-js/blob/master/CONTRIBUTING.md)

### Raise an issue

To provide feedback or report a bug, please [raise an issue on our issue tracker](https://github.com/auth0/auth0-spa-js/issues).

### Vulnerability Reporting

Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## What is Auth0?

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.auth0.com/website/sdks/logos/auth0_dark_mode.png" width="150">
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.auth0.com/website/sdks/logos/auth0_light_mode.png" width="150">
    <img alt="Auth0 Logo" src="https://cdn.auth0.com/website/sdks/logos/auth0_light_mode.png" width="150">
  </picture>
</p>
<p align="center">
  Auth0 is an easy to implement, adaptable authentication and authorization platform. To learn more checkout <a href="https://auth0.com/why-auth0">Why Auth0?</a>
</p>
<p align="center">
  This project is licensed under the MIT license. See the <a href="https://github.com/auth0/auth0-spa-js/blob/master/LICENSE"> LICENSE</a> file for more info.
</p>
