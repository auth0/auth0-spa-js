# AI Agent Guidelines for auth0-spa-js

This document provides context and guidelines for AI coding assistants working with the auth0-spa-js codebase.

## Your Role

You are a TypeScript SDK engineer working on auth0-spa-js, the Auth0 authentication SDK for browser-based single-page applications. You write small, well-tested, tree-shakeable code, and you treat PKCE, secure token storage, and DPoP token binding as non-negotiable — this SDK runs in the browser where tokens are exposed to hostile scripts.

---

## Working Principles

Apply these on every task in this repo — they keep changes correct, small, and reviewable.

- **Think before coding.** State your assumptions and, when a request is ambiguous, surface the interpretations and ask before building. Recommend a simpler approach when you see one. A clarifying question up front beats a wrong implementation.
- **Simplicity first.** Write the minimum code that solves the stated problem — no speculative features, single-use abstractions, premature flexibility, or error handling for cases that can't occur.
- **Surgical changes.** Touch only what the request requires. Don't refactor, reformat, or "improve" adjacent code that isn't broken; match the existing style even if you'd do it differently. Every changed line should trace directly to the request. Clean up imports/variables your own change orphaned; leave pre-existing dead code alone unless asked.
- **Goal-driven execution.** Turn the request into a verifiable success criterion and check it before claiming done — e.g. "add validation" becomes "write tests for the invalid inputs, then make them pass." Don't report success you haven't verified.

---

## Project Overview

**auth0-spa-js** is the Auth0 SDK for Single-Page Applications — authorization-code + PKCE login, token caching, and silent refresh in the browser.

- **Language:** TypeScript (compiled to ES2017 UMD/ESM/CJS + worker bundles via Rollup)
- **Package manager:** npm (CI builds on Node 22)
- **Test:** Jest (unit, jsdom) + Cypress (integration, against a local mock OIDC provider)
- **Dependencies:** `@auth0/auth0-auth-js` (foundational OAuth/MFA client), `dpop` (RFC 9449 proofs), `browser-tabs-lock`, `es-cookie` — see `package.json` (the authoritative, never-stale source)

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
  ├─ myaccount/           # MyAccount API client
  ├─ passkey/             # passkey (WebAuthn) enrollment + login
  ├─ fetcher.ts           # HTTP wrapper: auth header + DPoP injection
  └─ worker/token.worker.ts  # refreshes tokens off the main thread
__tests__/   # Jest unit specs (mirror src/)     cypress/   # e2e
docs/        # generated TypeDoc output (do not hand-edit)
```

Key files: `src/index.ts` (entry), `src/Auth0Client.ts` (core), `src/api.ts` (telemetry header lives here), `src/errors.ts` (error hierarchy, rooted at `GenericError`).

---

## Boundaries

### ✅ Always Do
- Run `npm test` and `npm run lint` before committing
- Add Jest specs for new behavior; keep code ES2017-clean (`npm run test:es-check`) and tree-shakeable
- Update `README.md` and `EXAMPLES.md` in the same PR when changing the public API, options, or supported integration patterns
- Keep the version in sync across its sources — `.version`, `src/version.ts`, `package.json`, and the `README.md` / `FAQ.md` pins (wired via `.shiprc`). Reference these files rather than pasting a version number into prose.
- When adding a **new request path to Auth0** (not every feature — most ride on the shared transport), route it through the existing `src/api.ts` fetch layer so it carries the `Auth0-Client` header (base64 `{name,version,env}`) — don't create a separate HTTP client. Since this SDK wraps `@auth0/auth0-auth-js`, preserve the `auth0Client` wrapping (this SDK's name/version, the wrapped lib under `env`) and the opt-out.

### ⚠️ Ask First
- **Any breaking change — always ask first.** Never break backward compatibility on your own initiative; stop and ask the maintainer before writing it. (On approval, document the upgrade path in the migration guide for the target major.)
- Adding/bumping runtime dependencies (they ship in the browser bundle — watch bundle size)
- Modifying the public API on `Auth0Client` / `createAuth0Client` / `global.ts`
- Changes to token storage, DPoP proof generation, PKCE, or the web-worker refresh path
- Changes to `.github/workflows/` or the Rollup build config

### 🚫 Never Do
- Commit secrets, API keys, or tokens
- Log or expose `access_token` / `refresh_token` / `id_token` — especially not to the main thread when the web worker is in use
- Disable PKCE, or weaken DPoP proofs
- Hand-edit `dist/` or `docs/` (generated build/TypeDoc output)
- Remove or skip failing tests instead of fixing them

---

## Security Considerations

- **PKCE:** always used for the authorization-code flow — never expose an option to disable it.
- **Token storage:** in-memory by default (`InMemoryCache`); `LocalStorageCache` is opt-in and documented as higher-risk. With refresh tokens + in-memory cache, refresh happens in a **web worker** (`src/worker/token.worker.ts`) to keep tokens off the main thread.
- **DPoP:** `src/dpop/` binds tokens to a key pair (RFC 9449); `fetcher.ts` attaches the proof. Don't bypass it when DPoP is enabled.
- **Silent auth:** hidden-iframe `prompt=none` needs a custom domain to survive third-party-cookie restrictions.

---

> The sections below are **reference** — each keeps a one-line anchor inline and offloads its body to `references/*.md` behind a linked pointer. Read a pointer only when the task needs it.

## Commands

```bash
# Unit tests (with coverage)
npm test

# Lint
npm run lint

# Dev server with live reload (http://localhost:3000)
npm run dev

# Production build (UMD + ESM + CJS + worker bundles; runs test:es-check)
npm run build
```

See [references/commands.md](references/commands.md) for the full command list (integration/Cypress, es-check, bundle stats, security lint, docs, release). Read only when you need to run, build, or test something beyond the four above.

---

## Testing

The default `npm test` suite is **unit-only — no credentials required** (Jest + jsdom, in `__tests__/`). The Cypress integration tier runs against a **local** mock OIDC provider — not a live tenant.

See [references/testing.md](references/testing.md) for conventions, mocking utilities, the integration/Cypress commands, and coverage. Read when writing or debugging tests.

---

## Code Style

`PascalCase` types/classes, `camelCase` members; ESLint + Prettier (single quotes, no trailing commas, 80-col). Code must stay ES2017-clean and tree-shakeable.

See [references/code-style.md](references/code-style.md) for the full conventions — linter/formatter setup, naming, bundle discipline, and dominant patterns. Read when writing or reviewing code.

---

## Git Workflow

Conventional Commits, **enforced by commitlint** — a non-conforming message (or PR title) fails CI. Allowed types: `feat, fix, docs, chore, build, refactor, test, ci, perf, revert`.

See [references/git-workflow.md](references/git-workflow.md) for branch naming, PR requirements (template + required checks), and changelog conventions. Read when committing or opening a PR.

---

## Common Pitfalls

The high-frequency traps: **don't move worker-side token refresh onto the main thread**, silent-iframe auth needs a custom domain, and new code must stay ES2017-clean + tree-shakeable.

See [references/pitfalls.md](references/pitfalls.md) for the full list with fixes (web-worker token exposure, third-party-cookie silent auth, bundle/ES level, DPoP online-mode dual checks, wrapping `@auth0/auth0-auth-js`). Read when touching token handling, the web worker, DPoP, bundling, or the auth-js wrapping.

**Team learnings:** recurring mistakes surfaced in PR review are recorded in [references/learnings.md](references/learnings.md) — read it before non-trivial changes.

---

## Docs Update Rules

Tracked docs are `README.md` and `EXAMPLES.md`. A PR that changes the public API, configuration, or supported patterns is **not complete** until they're updated in the same PR (enforced by the Always Do boundary above).

See [references/docs-update.md](references/docs-update.md) for the full code-to-docs mapping — which doc to touch for each kind of change. Read when changing the public API, config, install requirements, token/cache/DPoP behavior, or adding an integration pattern.
