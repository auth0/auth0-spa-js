# Team Learnings — auth0-spa-js

Recurring mistakes surfaced in **PR review** that automated detection can't catch. This file is **human-curated and append-only** — add a new entry when reviewers flag the same class of issue more than once. Keep each entry to the mistake, why it bites, and how to avoid it. When a learning hardens into a must/never rule, promote it into `CLAUDE.md` → Boundaries as its own line (tag it with the PR number).

1. **Fence every code block with a language tag.** `markdownlint-cli2` (rule MD040) fails the docs lint when a fenced block — including directory-tree/diagram blocks — has no language. Use `text` (or `plaintext`) for non-code blocks and the real language otherwise. _(PR #1651)_
