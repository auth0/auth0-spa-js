import { getMissingScopes } from '../src/Auth0Client.utils';

/**
 * `online_access` is stripped from the requested scopes only when `onlineAccess` is true:
 * in online mode the server reuses the same (non-rotating) ORT for an MRRT cross-audience
 * exchange and never echoes `online_access` back in the response scope, so comparing it
 * would flag a spurious missing scope. Outside online mode the strip is not applied, so a
 * genuinely missing `online_access` is still reported. `offline_access` is never excluded —
 * the server echoes it back, so a genuinely missing `offline_access` should still be reported.
 */
describe('getMissingScopes', () => {
  describe('in online mode', () => {
    it('does not report online_access as missing', () => {
      expect(
        getMissingScopes('openid online_access fs:read', 'openid fs:read', true)
      ).toBe('');
    });

    it('still reports genuinely missing resource scopes', () => {
      expect(
        getMissingScopes(
          'openid online_access fs:read fs:write',
          'openid fs:read',
          true
        )
      ).toBe('fs:write');
    });
  });

  describe('outside online mode', () => {
    it('reports a genuinely missing online_access', () => {
      expect(
        getMissingScopes('openid online_access fs:read', 'openid fs:read')
      ).toBe('online_access');
    });

    it('still reports a genuinely missing offline_access', () => {
      expect(
        getMissingScopes('openid offline_access fs:read', 'openid fs:read')
      ).toBe('offline_access');
    });
  });
});
