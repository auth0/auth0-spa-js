import { Provider, interactionPolicy } from 'oidc-provider';

const { base, Prompt, Check } = interactionPolicy;
const policy = base();

policy.add(
  new Prompt(
    { name: 'noop', requestable: false },
    new Check('foo', 'bar', ctx => {
      if (ctx.query?.scope?.includes('offline_access')) {
        ctx.oidc.params.scope = `${ctx.oidc.params.scope} offline_access`;
      }
      return Check.NO_NEED_TO_PROMPT;
    })
  ),
  0
);

const config = {
  clients: [
    {
      client_id: 'testing',
      redirect_uris: ['http://127.0.0.1:3000', 'http://localhost:3000'],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token']
    },
    {
      client_id: 'multi-client-1',
      redirect_uris: [
        'http://127.0.0.1:3000/multiple_clients.html',
        'http://localhost:3000/multiple_clients.html'
      ],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token']
    },
    {
      client_id: 'multi-client-2',
      redirect_uris: [
        'http://127.0.0.1:3000/multiple_clients.html',
        'http://localhost:3000/multiple_clients.html'
      ],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token']
    },
    {
      client_id: 'multi-client-3',
      redirect_uris: [
        'http://127.0.0.1:3000/multiple_clients.html',
        'http://localhost:3000/multiple_clients.html'
      ],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token']
    }
  ],
  claims: {
    org_id: null
  },
  routes: {
    authorization: '/authorize', // lgtm [js/hardcoded-credentials]
    token: '/oauth/token',
    end_session: '/v2/logout'
  },
  scopes: ['openid', 'offline_access'],
  clientBasedCORS(ctx, origin, client) {
    return true;
  },
  features: {
    webMessageResponseMode: {
      enabled: true
    },
    claimsParameter: {
      enabled: true
    }
  },
  rotateRefreshToken: true,
  interactions: {
    policy
  },
  findAccount(ctx, id) {
    return {
      accountId: id,
      claims(use, scope, claims) {
        return {
          sub: id,
          ...(claims?.org_id ? { org_id: claims.org_id.values[0] } : null)
        };
      }
    };
  }
};

export function createApp(opts) {
  const issuer = `http://127.0.0.1:${opts.port || 3000}/`;
  const provider = new Provider(issuer, config);

  provider.use(async (ctx, next) => {
    await next();

    if (ctx.oidc?.route === 'end_session_success') {
      ctx.redirect('http://127.0.0.1:3000');
    }
  });

  return provider.app;
}
