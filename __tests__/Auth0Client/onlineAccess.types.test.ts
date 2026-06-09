/**
 * Compile-time enforcement of the online-access option, via `createAuth0Client`
 * overloads (the interface itself stays a plain, non-breaking optional boolean).
 *
 * These assertions are validated by ts-jest's type checker at test time: each
 * `@ts-expect-error` MUST sit over a genuine type error, or TypeScript reports an
 * unused-directive error and the suite fails. The runtime safety net (the
 * `InvalidConfigurationError` throw) is covered separately in onlineAccess.test.ts.
 *
 * The overloads only narrow on a literal `onlineAccess: true`, so these cover the
 * common literal mistakes a TS user would make at the call site.
 */
import { createAuth0Client } from '../../src';

const base = {
  domain: 'example.auth0.com',
  clientId: 'client_id'
};

describe('createAuth0Client — online access type enforcement', () => {
  it('requires useDpop: true and forbids useRefreshTokens when onlineAccess is true', () => {
    // Compile-only — never invoked. Wrapped in a never-true guard so the calls
    // are type-checked but do not execute (no DOM/crypto needed).
    const _typecheck = async () => {
      // Valid combo.
      await createAuth0Client({ ...base, onlineAccess: true, useDpop: true });

      // Missing useDpop → compile error.
      // @ts-expect-error onlineAccess: true requires useDpop: true
      await createAuth0Client({ ...base, onlineAccess: true });

      // useDpop: false → compile error.
      // @ts-expect-error onlineAccess: true requires useDpop: true (not false)
      await createAuth0Client({ ...base, onlineAccess: true, useDpop: false });

      // useRefreshTokens alongside online → compile error (it injects offline_access).
      // @ts-expect-error useRefreshTokens conflicts with onlineAccess
      await createAuth0Client({
        ...base,
        onlineAccess: true,
        useDpop: true,
        useRefreshTokens: true
      });
    };
    void _typecheck;

    expect(true).toBe(true);
  });

  it('leaves the legacy (non-online) call unconstrained', () => {
    const _typecheck = async () => {
      // Legacy combos remain valid — the overloads must not constrain them.
      await createAuth0Client({ ...base, useRefreshTokens: true, useDpop: false });
      await createAuth0Client({ ...base, onlineAccess: false, useRefreshTokens: true });
    };
    void _typecheck;

    expect(true).toBe(true);
  });
});
