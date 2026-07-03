# Testing — auth0-spa-js

Read when writing or debugging tests, wiring mocks, or running the integration tier.

## Unit tests (Jest + jsdom)

- Location: `__tests__/`, mirroring `src/`. Files follow `__tests__/[module]/[feature].test.ts` or `__tests__/Auth0Client/[method].test.ts`.
- The default `npm test` suite is **unit-only — no credentials required**.
- Run a single file: `npx jest __tests__/Auth0Client/getTokenSilently.test.ts`
- Watch mode: `npm run test:watch`; debug serially under the inspector: `npm run test:debug`.

## Integration tests (Cypress)

- Location: `cypress/e2e/`.
- Run against a **local** mock OIDC provider (`scripts/oidc-provider.mjs`) via the dev server — **not a live tenant, no credentials**.
- Headless: `npm run test:integration` (starts the dev server, waits on `:3000`, runs Cypress). Interactive: `npm run test:open:integration`.

## Coverage

- Jest coverage (`jest --coverage`) is uploaded to Codecov in CI.
- View locally: `npm run serve:coverage`.

## Mocking & test utilities

- Network: `jest-fetch-mock` — **don't hit real endpoints in unit tests.**
- Storage: `jest-localstorage-mock` and `fake-indexeddb` for cache backends.
- Keep tests deterministic; the web-worker refresh path is tested without a real worker thread where possible.
