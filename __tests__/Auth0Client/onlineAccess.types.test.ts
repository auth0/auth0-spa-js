/**
 * Compile-time enforcement of the online-access option, via `createAuth0Client`
 * overloads (the interface itself stays plain, non-breaking optional fields).
 *
 * These assertions are validated by ts-jest's type checker at test time: each
 * `@ts-expect-error` MUST sit over a genuine type error, or TypeScript reports an
 * unused-directive error and the suite fails. The runtime safety net (the
 * `InvalidConfigurationError` throw) is covered separately in onlineAccess.test.ts.
 *
 * The overloads only narrow on a literal `refreshTokenMode: 'online'`, so these cover
 * the common literal mistakes a TS user would make at the call site.
 */
import { createAuth0Client } from '../../src';

const base = {
  domain: 'example.auth0.com',
  clientId: 'client_id'
};

describe('createAuth0Client — online access type enforcement', () => {
  it('requires useRefreshTokens: true and useDpop: true when refreshTokenMode is online', () => {
    // Compile-only — never invoked. Wrapped in a never-true guard so the calls
    // are type-checked but do not execute (no DOM/crypto needed).
    const _typecheck = async () => {
      // Valid combo.
      await createAuth0Client({
        ...base,
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true
      });

      // Missing useRefreshTokens → compile error.
      // @ts-expect-error refreshTokenMode: 'online' requires useRefreshTokens: true
      await createAuth0Client({ ...base, refreshTokenMode: 'online', useDpop: true });

      // Missing useDpop → compile error.
      // @ts-expect-error refreshTokenMode: 'online' requires useDpop: true
      await createAuth0Client({
        ...base,
        refreshTokenMode: 'online',
        useRefreshTokens: true
      });

      // useDpop: false → compile error.
      // @ts-expect-error refreshTokenMode: 'online' requires useDpop: true (not false)
      await createAuth0Client({
        ...base,
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: false
      });
    };
    void _typecheck;

    expect(true).toBe(true);
  });

  it('leaves the legacy (offline / non-online) call unconstrained', () => {
    const _typecheck = async () => {
      // Legacy combos remain valid — the overloads must not constrain them.
      await createAuth0Client({ ...base, useRefreshTokens: true, useDpop: false });
      await createAuth0Client({ ...base, refreshTokenMode: 'offline', useRefreshTokens: true });
    };
    void _typecheck;

    expect(true).toBe(true);
  });
});
