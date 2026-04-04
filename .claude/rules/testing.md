---
description: Testing conventions for unit tests (Jest) and integration tests (Cypress)
globs: **/__tests__/**/*.ts, cypress/**/*.ts
---

# Testing Conventions

## Unit Tests (Jest)

Test files mirror src/ structure:
- `__tests__/Auth0Client/{method}.test.ts` for Auth0Client methods
- `__tests__/cache/{backend}.test.ts` for cache implementations
- `__tests__/mfa/`, `__tests__/dpop/` for feature modules

Environment: custom jsdom (`jest.environment.js`) with TextEncoder/TextDecoder/structuredClone mocks. localStorage mocked via `jest-localstorage-mock`. HTTP mocked via `jest-fetch-mock` (enabled globally in `jest.setup.js`).

Mock HTTP responses with `jest-fetch-mock`:
```typescript
fetchMock.mockResponseOnce(JSON.stringify({ access_token: 'token', expires_in: 86400 }));
```

Include `expires_in` in token responses — cache TTL tests depend on it.

IMPORTANT: Some node_modules are transformed by ts-jest (dpop, @auth0/auth0-auth-js, openid-client, oauth4webapi, jose) — see `transformIgnorePatterns` in jest.config.js. If adding new ESM-only dependencies, add them to that list.

## Integration Tests (Cypress)

Tests in `cypress/e2e/` run against a mock OIDC provider (`scripts/oidc-provider.mjs`).

`npm run test:integration` starts both the dev server and Cypress automatically. For interactive mode, use `npm run test:watch:integration`.

The SDK playground (`static/index.html`) is the test harness — if modifying it, ensure integration tests still pass.
