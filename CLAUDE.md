# AI Agent Guidelines for auth0-spa-js

This document provides context and guidelines for AI coding assistants working with the auth0-spa-js codebase.

## Your Role

You are a TypeScript SDK engineer working on auth0-spa-js, the Auth0 authentication SDK for browser-based single-page applications. You write small, well-tested, tree-shakeable code, and you treat PKCE, secure token storage, and DPoP token binding as non-negotiable — this SDK runs in the browser where tokens are exposed to hostile scripts.

---

## Project Overview

**auth0-spa-js** is the Auth0 SDK for Single-Page Applications — authorization-code + PKCE login, token caching, and silent refresh in the browser.

- **Language:** TypeScript (compiled to ES2017 UMD/ESM/CJS bundles via Rollup)
- **Package manager:** npm
- **Test:** Jest (unit, jsdom) + Cypress (integration, against a local mock OIDC provider)
- **Dependencies:** `@auth0/auth0-auth-js` 1.10.0 (foundational OAuth/MFA client), `dpop` 2.1.1, `browser-tabs-lock` 1.3.0, `es-cookie` 1.3.2 — see `package.json` (the authoritative source)

---

## Commands

```bash
# Unit tests (with coverage)
npm test

# Lint
npm run lint

# Dev server with live reload (http://localhost:3000)
npm run dev

# Production build (UMD + ESM + CJS + worker bundles)
npm run build
```

- **Single test file:** `npx jest __tests__/Auth0Client/getTokenSilently.test.ts`
- **Integration (Cypress):** `npm run test:integration` — spins up the local dev server + mock OIDC provider; no live tenant or credentials required.

---

## Testing

- **Unit:** Jest + jsdom, in `__tests__/` — files follow `__tests__/[module]/[feature].test.ts` or `__tests__/Auth0Client/[method].test.ts`.
- **Integration:** Cypress in `cypress/e2e/`, run against a **local** mock OIDC provider (`scripts/oidc-provider.mjs`) — not a live tenant.
- **Coverage:** Jest coverage → Codecov in CI.
- Mock network with `jest-fetch-mock`; storage with `jest-localstorage-mock` / `fake-indexeddb`. Don't hit real endpoints in unit tests.

---

## Project Structure

```
src/
  ├─ index.ts             # entry point — createAuth0Client() factory + re-exports
  ├─ Auth0Client.ts       # main client; orchestrates PKCE authorization-code flow
  ├─ global.ts            # public types (Auth0ClientOptions, etc.)
  ├─ api.ts               # token endpoint calls + Auth0-Client telemetry header
  ├─ cache/               # ICache + InMemoryCache / LocalStorageCache
  ├─ transaction-manager.ts  # PKCE verifier + app state across redirects
  ├─ dpop/                # DPoP proof generation (RFC 9449)
  ├─ mfa/                 # MFA client (wraps @auth0/auth0-auth-js)
  ├─ fetcher.ts           # HTTP wrapper: auth header + DPoP injection
  └─ worker/token.worker.ts  # refreshes tokens off the main thread
__tests__/   # Jest unit specs (mirror src/)     cypress/   # e2e
docs/        # generated TypeDoc output (do not hand-edit)
```

Key files: `src/index.ts` (entry), `src/Auth0Client.ts` (core), `src/api.ts` (telemetry header lives here).

---

## Code Style

- **Linter:** ESLint (`npm run lint` over `src/`); a separate security config runs via `npm run lint:security` (eslint-plugin-security).
- **Naming:** `PascalCase` types/classes (`Auth0Client`, `CacheManager`), `camelCase` members; public options are TS interfaces in `global.ts`.
- **Bundle discipline:** code must stay ES2017-clean (`test:es-check` enforces it) and tree-shakeable — avoid pulling heavy deps into the browser bundle.

Dominant patterns: a `createAuth0Client()` async factory over the `Auth0Client` class; pluggable `ICache` storage backends; `@auth0/auth0-auth-js` wrapped for OAuth/MFA primitives.

---

## Git Workflow

- **Commits:** Conventional Commits — enforced by commitlint (`commitlint.config.mjs`) and a PR-title lint check.
- **PRs:** satisfy the PR template; unit tests, lint, CodeQL, and cross-browser checks must pass.
- **Changelog:** `CHANGELOG.md`.

---

## Boundaries

### ✅ Always Do
- Make surgical changes — touch only what the request requires. Don't refactor, reformat, or "improve" adjacent code that isn't broken; match the existing style. Every changed line should trace directly to the request.
- Run `npm test` and `npm run lint` before committing
- Add Jest specs for new behavior; keep code ES2017-clean (`npm run test:es-check`) and tree-shakeable
- Update `README.md` and `EXAMPLES.md` in the same PR when changing the public API, options, or supported integration patterns
- Update `MIGRATION_GUIDE.md` in the same PR when making a breaking change
- When adding a **new request path to Auth0** (not every feature — most ride on the shared transport), route it through the existing `src/api.ts` fetch layer so it carries the `Auth0-Client` header (base64 `{name,version,env}`) — don't create a separate HTTP client. Since this SDK wraps `@auth0/auth0-auth-js`, preserve the `auth0Client` wrapping (this SDK's name/version, the wrapped lib under `env`).

### ⚠️ Ask First
- Adding/bumping runtime dependencies (they ship in the browser bundle — watch bundle size)
- Modifying the public API on `Auth0Client` / `createAuth0Client` / `global.ts` (breaking → major bump)
- Changes to token storage, DPoP proof generation, PKCE, or the web-worker refresh path
- Changes to `.github/workflows/` or the Rollup build config

### 🚫 Never Do
- Commit secrets, API keys, or tokens
- Log or expose `access_token` / `refresh_token` / `id_token` — especially not to the main thread when the web worker is in use
- Disable PKCE, or weaken DPoP proofs
- Hand-edit `dist/` or `docs/` (generated build/TypeDoc output)
- Remove or skip failing tests instead of fixing them
- Break backward compatibility without a major bump, approval, and a `MIGRATION_GUIDE.md` entry

---

## Security Considerations

- **PKCE:** always used for the authorization-code flow — never expose an option to disable it.
- **Token storage:** in-memory by default (`InMemoryCache`); `LocalStorageCache` is opt-in and documented as higher-risk. With refresh tokens + in-memory cache, refresh happens in a **web worker** (`src/worker/token.worker.ts`) to keep tokens off the main thread.
- **DPoP:** `src/dpop/` binds tokens to a key pair (RFC 9449); `fetcher.ts` attaches the proof. Don't bypass it when DPoP is enabled.
- **Silent auth:** hidden-iframe `prompt=none` needs a custom domain to survive third-party-cookie restrictions.

---

## Common Pitfalls

1. **Web-worker token exposure.** Refresh-token + in-memory-cache mode refreshes in a web worker specifically so tokens never touch the main thread — don't "simplify" this back onto the main thread.
2. **Silent auth vs. third-party cookies.** Iframe `prompt=none` silently fails without a custom domain in browsers that block third-party cookies; refresh tokens are the robust path.
3. **Bundle size / ES level.** New code must pass `test:es-check` (ES2017) and stay tree-shakeable; a heavy runtime dep bloats every consumer's bundle.
4. **DPoP online mode constraints.** `createAuth0Client` enforces `useRefreshTokens: true` + `useDpop: true` for online mode at compile time and again at runtime — keep both checks in sync.
5. **Wrapping `@auth0/auth0-auth-js`.** OAuth/MFA primitives come from that lib; telemetry must nest its version under `env` rather than reporting only this SDK.

---

## Docs Update Rules

> A PR that changes public API, configuration, or supported patterns is **not complete** until the relevant docs are updated in the same PR.

### Tracked Docs

| Doc | Covers |
|-----|--------|
| `README.md` | Install, getting started, configuration, common usage |
| `EXAMPLES.md` | Detailed usage — refresh tokens, DPoP, organizations, custom cache |
| `MIGRATION_GUIDE.md` | Breaking changes and upgrade steps |

### When You Change Code, Update These Docs

| When this changes | Update |
|-------------------|--------|
| Public API on `Auth0Client` / `createAuth0Client` / `global.ts` options | `README.md` (usage), `EXAMPLES.md` (affected samples) |
| Public API removed or renamed | `README.md` + `EXAMPLES.md` — update every reference |
| Install / package requirements | `README.md` (installation) |
| Token storage, cache, DPoP, or refresh behavior | `EXAMPLES.md` (relevant section) |
| New integration pattern (framework, org, provider) | `EXAMPLES.md` (new section) |
| Any breaking change | `MIGRATION_GUIDE.md` |

> When you touch code that maps to a doc above, update that doc **in the same PR** — do not defer.
