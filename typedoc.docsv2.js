// TypeDoc config for the artifact published to the docs-v2 repo.
//
// Identical to `typedoc.mintlify.js` except for the two values that are tied to
// where the pages are served from. docs-v2 mounts the SDK reference under
// `docs/sdk/typescript`, not the bare `sdk/typescript` used by the local
// `mint dev` preview, and the plugin bakes absolute hrefs into comment
// summaries. A mismatch here means every injected type link 404s.
const mintlify = require('./typedoc.mintlify.js');

module.exports = {
  ...mintlify,

  // Must match `sdk.directory` in the docs-v2 SDK Reference tab.
  mintlifyDirectory: 'docs/sdk/typescript',

  // Staging directory whose layout mirrors docs-v2's `main/`, so publishing is a
  // straight copy of two files with no path rewriting.
  json: './mintlify/docsv2/sdk-artifacts/auth0-spa-js.json',

  // Overrides the `pretty: false` used for the local preview. This file is
  // committed to docs-v2, where a minified artifact turns every rebuild into a
  // single-line diff of 38k changes. Pretty-printed, a rebuild diffs as just the
  // symbols that actually changed.
  pretty: true
};
