# Git Workflow — auth0-spa-js

Read when committing, naming a branch, or opening a PR.

## Commits

Conventional Commits. Enforcement is on the **PR title** via the `lint-pr-title` workflow — there is no local `commit-msg` hook, so individual commit messages are not validated locally. Allowed types:

```
feat, fix, docs, chore, build, refactor, test, ci, perf, revert
```

## Pull requests

- Satisfy the PR template.
- Required checks must pass: unit tests, lint, CodeQL, and the cross-browser checks.
