/**
 * Compile-time enforcement of the online-access overloads, type-checked by ts-jest:
 * each `@ts-expect-error` must sit over a genuine type error. The runtime safety net
 * is covered in onlineAccess.test.ts.
 */
import { createAuth0Client, RefreshTokenMode } from '../../src';

const base = {
  domain: 'example.auth0.com',
  clientId: 'client_id'
};

describe('createAuth0Client — online access type enforcement', () => {
  it('requires useRefreshTokens: true and useDpop: true when refreshTokenMode is online', () => {
    // Compile-only — type-checked but never executed.
    const _typecheck = async () => {
      // Valid combo, using the RefreshTokenMode enum.
      await createAuth0Client({
        ...base,
        refreshTokenMode: RefreshTokenMode.Online,
        useRefreshTokens: true,
        useDpop: true
      });

      // Raw string still accepted for backward compatibility.
      await createAuth0Client({
        ...base,
        refreshTokenMode: 'online',
        useRefreshTokens: true,
        useDpop: true
      });

      // Missing useRefreshTokens → compile error.
      // @ts-expect-error online mode requires useRefreshTokens: true
      await createAuth0Client({ ...base, refreshTokenMode: RefreshTokenMode.Online, useDpop: true });

      // Missing useDpop → compile error.
      // @ts-expect-error online mode requires useDpop: true
      await createAuth0Client({
        ...base,
        refreshTokenMode: RefreshTokenMode.Online,
        useRefreshTokens: true
      });

      // useDpop: false → compile error.
      // @ts-expect-error online mode requires useDpop: true (not false)
      await createAuth0Client({
        ...base,
        refreshTokenMode: RefreshTokenMode.Online,
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
      await createAuth0Client({ ...base, refreshTokenMode: RefreshTokenMode.Offline, useRefreshTokens: true });
      // Raw string still accepted for backward compatibility.
      await createAuth0Client({ ...base, refreshTokenMode: 'offline', useRefreshTokens: true });
    };
    void _typecheck;

    expect(true).toBe(true);
  });
});
