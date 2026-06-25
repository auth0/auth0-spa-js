import { getMissingScopes } from '../src/Auth0Client.utils';

/**
 * `online_access` is stripped from the requested scopes in the MRRT flow only: the server
 * does not issue a new ORT for an MRRT cross-audience exchange, so the same (non-rotating)
 * ORT is reused and `online_access` is never echoed back in the response scope. Comparing
 * the injected `online_access` against the response would otherwise flag it as a spurious
 * missing scope. `offline_access` is intentionally NOT excluded — the server does echo it
 * back, so a genuinely missing `offline_access` should still be reported.
 */
describe('getMissingScopes ignores online_access', () => {
  it('does not report online_access as missing', () => {
    expect(
      getMissingScopes('openid online_access fs:read', 'openid fs:read')
    ).toBe('');
  });

  it('still reports genuinely missing resource scopes', () => {
    expect(
      getMissingScopes('openid online_access fs:read fs:write', 'openid fs:read')
    ).toBe('fs:write');
  });

  it('still reports a genuinely missing offline_access', () => {
    expect(
      getMissingScopes('openid offline_access fs:read', 'openid fs:read')
    ).toBe('offline_access');
  });
});
