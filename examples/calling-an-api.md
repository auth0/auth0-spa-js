## Calling an API

Retrieve an access token to pass along in the `Authorization` header using the `getTokenSilently` API.

```html
<button id="call-api">Call an API</button>
```

```js
//with async/await
document.getElementById('call-api').addEventListener('click', async () => {
  const accessToken = await auth0.getTokenSilently();

  if (!accessToken) {
    // getTokenSilently returns undefined when cacheMode is 'cache-only' and
    // there is no cached token, or when a session ceiling has been reached.
    return;
  }

  const result = await fetch('https://myapi.com', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await result.json();
  console.log(data);
});
```

### Handling network errors

If the request to Auth0's token endpoint fails (for example, the device is offline or a browser extension blocks it), the SDK throws a `NetworkError` after retrying. If the request times out, it throws a `TimeoutError` instead. Methods that call the token endpoint, such as `getTokenSilently` and `handleRedirectCallback`, throw these errors. Without refresh tokens, `getTokenSilently` first loads an iframe, which can't detect network failures, so being offline usually gives a `TimeoutError`.

With `getTokenSilently`, these errors don't mean the user's session is invalid, so show an offline message or retry later instead of sending the user to log in again:

```js
import { NetworkError, TimeoutError } from '@auth0/auth0-spa-js';

document.getElementById('call-api').addEventListener('click', async () => {
  try {
    const accessToken = await auth0.getTokenSilently();
    // call your API
  } catch (e) {
    if (e instanceof NetworkError || e instanceof TimeoutError) {
      // temporary network issue: show an offline message or retry later
      return;
    }
    throw e;
  }
});
```

If `handleRedirectCallback` throws a `NetworkError` or `TimeoutError`, the login can't be retried. Start a new login once the network is back.
