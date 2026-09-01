## Accessing SDK Configuration

After initializing the Auth0Client, you can retrieve the configuration details:

```js
import { createAuth0Client } from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: 'YOUR_DOMAIN',
  clientId: 'YOUR_CLIENT_ID'
});

// Get configuration
const config = auth0.getConfiguration();
console.log(config.domain, config.clientId);
```

This is useful when you need to:

- Display the current domain to the user
- Log configuration for debugging
- Pass configuration to other services or analytics
- Verify the SDK is configured correctly
