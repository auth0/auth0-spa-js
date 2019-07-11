# Frequently Asked Questions

Below are a number of questions or issues that have arisen from using the SDK.

## Why does the `Auth0Client` object take a long time to initialize?

Sometimes the `createAuth0Client` asynchronous method can take over 30 seconds to complete. This is usually down to a configuration problem between your application, and the Auth0 application you're trying to log in with. Things to check:

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
