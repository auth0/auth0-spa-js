# CLAUDE.md

This file provides guidance to Agents when working with code in this repository.

## Project Overview

Auth0 SDK for Single Page Applications using Authorization Code Grant Flow with PKCE. This is a TypeScript library that provides authentication functionality for browser-based applications.

## Common Commands

```bash
# Install dependencies
npm install

# Development (starts dev server at http://localhost:3000 with live reload)
npm start  # or npm run dev

# Build production bundles
npm run build

# Run unit tests
npm run test

# Run a single test file
npx jest __tests__/path/to/test.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="pattern"

# Run tests in watch mode
npm run test:watch

# Run integration tests (Cypress)
npm run test:integration

# Run integration tests in watch mode
npm run test:watch:integration

# Lint
npm run lint

# Generate documentation
npm run docs
```

## Project Structure

```
src/
├── Auth0Client.ts       # Main SDK entry point and public API
├── Auth0Client.utils.ts # Helper functions for Auth0Client
├── api.ts               # Token endpoint API calls
├── cache/               # Token caching implementations (memory, localStorage)
├── dpop/                # DPoP proof-of-possession implementation
├── mfa/                 # Multi-factor authentication client
├── worker/              # Web worker for secure token refresh
├── storage.ts           # Cookie and session storage abstractions
├── errors.ts            # Custom error classes
├── global.ts            # TypeScript interfaces and types
├── utils.ts             # Crypto, encoding, and general utilities
└── index.ts             # Public exports

__tests__/               # Unit tests (Jest)
├── Auth0Client/         # Tests organized by Auth0Client method
├── cache/               # Cache implementation tests
├── dpop/                # DPoP tests
└── mfa/                 # MFA client tests

cypress/                 # Integration tests (Cypress)
├── e2e/                 # End-to-end test specs
└── support/             # Test utilities and commands

scripts/                 # Build and dev scripts
└── oidc-provider.mjs    # Mock OIDC server for integration tests

static/                  # Static files for dev server testing
dist/                    # Build output (generated)
```

## Architecture

### Core Components

- **Auth0Client** (`src/Auth0Client.ts`): Main client class that orchestrates all authentication operations. Uses PKCE for secure authorization code flow.

- **CacheManager** (`src/cache/`): Token caching system with multiple storage backends:
  - `InMemoryCache`: Default, stores tokens in memory
  - `LocalStorageCache`: Persists tokens to localStorage
  - Supports custom cache implementations via `ICache` interface

- **TransactionManager** (`src/transaction-manager.ts`): Manages state during redirect flows, storing PKCE verifiers and app state in session storage or cookies.

- **MfaApiClient** (`src/mfa/`): Multi-factor authentication operations (enroll, challenge, verify). Wraps `@auth0/auth0-auth-js` MFA client.

- **Dpop** (`src/dpop/`): DPoP (Demonstrating Proof of Possession) implementation for cryptographically binding tokens.

- **Fetcher** (`src/fetcher.ts`): HTTP client wrapper with automatic auth header injection and DPoP proof generation.

### Token Refresh Strategy

The SDK supports two token refresh mechanisms:
1. **Refresh Tokens** (`useRefreshTokens: true`): Uses refresh_token grant with optional web worker for secure storage
2. **Silent Authentication**: Uses hidden iframe with `prompt=none` (requires custom domain for third-party cookie issues)

### Web Worker

`src/worker/token.worker.ts`: Handles token refresh in a web worker when using refresh tokens with in-memory cache, preventing token exposure in main thread.

### Build Output

Rollup bundles the SDK into multiple formats:
- UMD (browser): `dist/auth0-spa-js.production.js`
- ESM: `dist/auth0-spa-js.production.esm.js`
- CJS: `dist/lib/auth0-spa-js.cjs.js`
- Worker: `dist/auth0-spa-js.worker.production.js`

## Testing

- **Unit tests**: `__tests__/` directory, using Jest with jsdom environment
- **Integration tests**: `cypress/e2e/` directory, testing against a mock OIDC provider (`scripts/oidc-provider.mjs`)

Test files follow the pattern `__tests__/[module]/[feature].test.ts` or `__tests__/Auth0Client/[method].test.ts`.

## Key Dependencies

- `@auth0/auth0-auth-js`: Foundational OAuth/MFA client
- `browser-tabs-lock`: Cross-tab locking for token refresh
- `dpop`: DPoP proof generation (RFC 9449)
- `es-cookie`: Cookie handling
