// TypeDoc config for the artifact published to the docs-v2 repo.
//
// Reuses every filtering and categorization decision from `typedoc.js` so the
// Mintlify site documents exactly the same surface as the HTML site, but emits
// only the JSON artifact that Mintlify consumes.
//
// `out`, `cleanOutputDir`, `theme` and `customCss` are dropped deliberately.
// TypeDoc's CLI renders HTML whenever `out` is set, even alongside `--json`
// (`if (!json || app.options.isSet("out"))`), so leaving it in would rebuild
// `docs/` as a side effect of building the Mintlify artifact.
const {
  out,
  cleanOutputDir,
  theme,
  customCss,
  ...shared
} = require('./typedoc.js');

module.exports = {
  ...shared,

  // Mintlify only reads a symbol's comment summary, so cross-type links have to
  // be injected there as markdown. See `scripts/typedoc-plugin-mintlify.js`.
  plugin: [...shared.plugin, './scripts/typedoc-plugin-mintlify.js'],

  // Must match `sdk.directory` in the docs-v2 SDK Reference tab, and the
  // `DIRECTORY` in `scripts/build-mintlify-nav.mjs`. The plugin bakes absolute
  // hrefs into comment summaries, so a mismatch means every type link 404s.
  mintlifyDirectory: 'docs/sdk/typescript',

  // Staging directory whose layout mirrors docs-v2's `main/`, so publishing is a
  // straight copy of two files with no path rewriting.
  json: './mintlify/docsv2/sdk-artifacts/auth0-spa-js.json',

  // This file is committed to docs-v2. Minified, a rebuild turns into a
  // single-line diff of 38k changes; pretty-printed, it diffs as just the
  // symbols that actually changed.
  pretty: true
};
