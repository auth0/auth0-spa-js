import { Provider } from 'oidc-provider';

const config = {
  clients: [
    {
      client_id: 'testing',
      client_secret: 'auth0-spa-js-testing-secret',
      redirect_uris: ['http://localhost:3000'],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token']
    }
  ],
  routes: {
    authorization: '/authorize',
    token: '/oauth/token'
  },
  scopes: ['openid', 'offline_access'],
  clientBasedCORS(ctx, origin, client) {
    return true;
  },
  features: {
    webMessageResponseMode: {
      enabled: true
    }
  },
  rotateRefreshToken: true
};

export function createApp(opts) {
  const issuer = `http://localhost:${opts.port || 3000}/`;
  return new Provider(issuer, config).app;
}
