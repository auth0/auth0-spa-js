# Code Style — auth0-spa-js

Read when writing or reviewing code so it matches the project's conventions.

## Linter & formatter

- **ESLint** over `src/`: `npm run lint`. A separate security config runs via `npm run lint:security` (eslint-plugin-security).
- **Prettier** (`.prettierrc`): single quotes, no trailing commas, arrow-parens avoided, 80-column width.

## Naming

- `PascalCase` for types and classes (`Auth0Client`, `CacheManager`).
- `camelCase` for members and functions.
- Public options are TypeScript interfaces declared in `global.ts`.

## Bundle discipline

- Code must stay **ES2017-clean** — `npm run test:es-check` enforces it against both the classic and module bundles.
- Keep the SDK **tree-shakeable**; avoid pulling heavy dependencies into the browser bundle (they inflate every consumer's build).

## Dominant patterns

- A `createAuth0Client()` async factory wrapping the `Auth0Client` class.
- Pluggable `ICache` storage backends (`InMemoryCache`, `LocalStorageCache`).
- Typed errors extending `GenericError` (`src/errors.ts`).
- `@auth0/auth0-auth-js` wrapped for OAuth/MFA primitives.
