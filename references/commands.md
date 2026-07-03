# Command Reference — auth0-spa-js

Full command list, extracted from `package.json` scripts and `.github/workflows/`. Read when you need to run, build, test, or lint something not covered by the core commands in `CLAUDE.md`.

## Build

```bash
# Production build — UMD + ESM + CJS + worker bundles, then ES2017 check
npm run build

# Same build plus a bundle-size stats report (opens bundle-stats/index.html)
npm run build:stats

# Dev server with live reload at http://localhost:3000 (alias: npm start)
npm run dev

# Generate TypeDoc API docs into docs/ (generated output — do not hand-edit)
npm run docs
```

## Test

```bash
# Unit tests with coverage (the default, safe, no-credentials suite)
npm test                 # jest --coverage --silent

# Watch mode
npm run test:watch

# Debug a run under the Node inspector, serially
npm run test:debug

# A single unit test file
npx jest __tests__/Auth0Client/getTokenSilently.test.ts

# CI invokes the unit suite with bounded workers
npm run test -- --maxWorkers=2
```

### Integration (Cypress)

Runs against a **local** mock OIDC provider (`scripts/oidc-provider.mjs`) via the dev server — **no live tenant or credentials required**.

```bash
# Headless: starts the dev server + waits on :3000, then runs Cypress
npm run test:integration

# Interactive Cypress runner
npm run test:open:integration

# Watch mode (dev server + interactive runner concurrently)
npm run test:watch:integration
```

## Lint

```bash
# ESLint over src/
npm run lint

# Security lint (eslint-plugin-security, separate config)
npm run lint:security
```

## Bundle / ES-level checks

```bash
# Enforce ES2017-clean output (both the classic and module bundles)
npm run test:es-check

# Print the current bundle size
npm run print-bundle-size

# Serve the coverage report / bundle stats locally
npm run serve:coverage
npm run serve:stats
```

## Release / publish

> Releases are cut via the dedicated release tooling (`.shiprc`), not by hand-editing. These are listed for reference only.

```bash
npm run prepack          # runs the production build before packing
npm run publish:cdn      # ccu --trace — CDN publish
```
