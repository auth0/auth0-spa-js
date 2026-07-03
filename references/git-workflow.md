# Git Workflow — auth0-spa-js

Read when committing, naming a branch, or opening a PR.

## Commits

Conventional Commits, **enforced by commitlint** (`commitlint.config.mjs`) and a PR-title lint check. Allowed types:

```
feat, fix, docs, chore, build, refactor, test, ci, perf, revert
```

## Pull requests

- Satisfy the PR template.
- Required checks must pass: unit tests, lint, CodeQL, and the cross-browser checks.

## Changelog

- `CHANGELOG.md` is maintained for user-facing changes.
