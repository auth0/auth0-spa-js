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

If the request to Auth0 can't complete (for example, the device is offline, a browser extension blocks it, or it times out), `getTokenSilently` throws a `NetworkError` after retrying. Other methods that call the token endpoint, such as `handleRedirectCallback`, throw it too.

A network error doesn't mean the user's session is invalid, so show an offline message or retry later instead of sending the user to log in again:

```js
import { NetworkError } from '@auth0/auth0-spa-js';

try {
  const accessToken = await auth0.getTokenSilently();
  // call your API
} catch (e) {
  if (e instanceof NetworkError) {
    // temporary network issue: show an offline message or retry later
    return;
  }
  throw e;
}
```
