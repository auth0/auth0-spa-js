/**
 * Compile-time enforcement of the `onlineAccess` discriminated union.
 *
 * These assertions are validated by ts-jest's type checker at test time: each
 * `@ts-expect-error` MUST sit over a genuine type error, or TypeScript reports
 * an unused-directive error and the suite fails. The runtime safety net (the
 * `InvalidConfigurationError` throw) is covered separately in onlineAccess.test.ts.
 *
 * The union only narrows on a literal `onlineAccess: true`, so these cases are
 * the common literal mistakes a TS user would make. The whole object literal
 * fails assignment as a unit, so each directive sits on the declaration line.
 */
import type { Auth0ClientOptions } from '../../src';

const base = {
  domain: 'example.auth0.com',
  clientId: 'client_id'
};

describe('Auth0ClientOptions — online access type enforcement', () => {
  it('requires useDpop: true and forbids useRefreshTokens when onlineAccess is true', () => {
    // onlineAccess: true with useDpop: true is the valid combo.
    const valid: Auth0ClientOptions = {
      ...base,
      onlineAccess: true,
      useDpop: true
    };
    expect(valid.onlineAccess).toBe(true);

    // Missing useDpop → compile error.
    // @ts-expect-error onlineAccess: true requires useDpop: true
    const missingDpop: Auth0ClientOptions = {
      ...base,
      onlineAccess: true
    };
    void missingDpop;

    // useDpop: false → compile error.
    // @ts-expect-error onlineAccess: true requires useDpop: true (not false)
    const dpopFalse: Auth0ClientOptions = {
      ...base,
      onlineAccess: true,
      useDpop: false
    };
    void dpopFalse;

    // useRefreshTokens alongside online → compile error (it injects offline_access).
    // @ts-expect-error useRefreshTokens conflicts with onlineAccess
    const withRefreshTokens: Auth0ClientOptions = {
      ...base,
      onlineAccess: true,
      useDpop: true,
      useRefreshTokens: true
    };
    void withRefreshTokens;
  });

  it('leaves the legacy (non-online) arm unconstrained', () => {
    // Legacy combos (refresh tokens without DPoP, DPoP without online, etc.)
    // remain valid — the union must not constrain the non-online arm.
    const legacy: Auth0ClientOptions = {
      ...base,
      useRefreshTokens: true,
      useDpop: false
    };
    const onlineFalse: Auth0ClientOptions = {
      ...base,
      onlineAccess: false,
      useRefreshTokens: true
    };
    expect(legacy.useRefreshTokens).toBe(true);
    expect(onlineFalse.onlineAccess).toBe(false);
  });
});
