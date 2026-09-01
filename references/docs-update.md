# Docs Update Rules — auth0-spa-js

> A PR that changes public API, configuration, or supported patterns is **not complete** until the relevant docs are updated in the same PR. The inline Boundaries → Always Do rule ("update README.md and the relevant file under examples/ in the same PR") is the enforceable version of this; the tables below say _which_ doc to touch.

Read when you change the public API, configuration, install requirements, token/cache/DPoP behavior, or add an integration pattern.

## Tracked Docs

| Doc           | Covers                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`   | Install, getting started, configuration, common usage                                                                                                                                                                                                                                                    |
| `examples/` | Detailed usage, one file per feature (indexed by `EXAMPLES.md`) — logout, calling an API, refresh tokens, online access, data caching, organizations, Native-to-Web SSO, custom token exchange, connect accounts for Token Vault, SDK configuration, passkeys, DPoP, MFA, step-up auth, MyAccount, session expiry from upstream IdP (IPSIE), among others |

## When You Change Code, Update These Docs

| When this changes                                                       | Update                                                |
| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Public API on `Auth0Client` / `createAuth0Client` / `global.ts` options | `README.md` (usage), `examples/` (affected samples) |
| Public method or export added                                           | `examples/` (add a usage sample)                      |
| Public method or export removed or renamed                              | `README.md` + `examples/` — update every reference  |
| Install / package requirements                                          | `README.md` (installation)                            |
| Token storage, cache, DPoP, or refresh behavior                         | `examples/` (relevant file)                           |
| New integration pattern (framework, org, provider)                      | `examples/` (new file, linked from the index)          |

> When you touch code that maps to a doc above, update that doc **in the same PR** — do not defer.
