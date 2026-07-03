# Common Pitfalls — auth0-spa-js

Browser-SDK gotchas that cause real bugs. Read when touching token handling, the web worker, DPoP, bundling, or the `@auth0/auth0-auth-js` wrapping.

1. **Web-worker token exposure.** Refresh-token + in-memory-cache mode refreshes tokens in a web worker (`src/worker/token.worker.ts`) *specifically* so tokens never touch the main thread. Don't "simplify" this back onto the main thread — it re-exposes `refresh_token` to hostile page scripts. If you change the refresh path, keep it worker-side when the worker is in use.

2. **Silent auth vs. third-party cookies.** Hidden-iframe `prompt=none` silently fails without a custom domain in browsers that block third-party cookies (Safari ITP, Chrome's phase-out). Refresh tokens are the robust path. Don't present silent-iframe auth as a general solution without the custom-domain caveat.

3. **Bundle size / ES level.** New code must pass `test:es-check` (ES2017) and stay tree-shakeable. A heavy runtime dependency bloats every consumer's browser bundle — this is why adding/bumping runtime deps is Ask-First. Prefer standard browser APIs over polyfills.

4. **DPoP online-mode constraints.** `createAuth0Client` enforces `useRefreshTokens: true` + `useDpop: true` for online mode in two places: at compile time via overloads in `index.ts`, and again at runtime in the `Auth0Client` constructor. Keep both checks in sync — changing one without the other lets an invalid config through one gate.

5. **Wrapping `@auth0/auth0-auth-js`.** OAuth/MFA primitives come from that foundational lib. Telemetry must nest *its* version under `env` in the `Auth0-Client` header rather than reporting only this SDK's version — otherwise the wrapped-library identification is lost. See `src/api.ts`.
