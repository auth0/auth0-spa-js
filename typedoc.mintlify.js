// TypeDoc config for the Mintlify SDK reference pipeline.
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

  // Must match `sdk.directory` in `mintlify/docs.json`, or the injected links
  // point at routes that do not exist.
  mintlifyDirectory: 'sdk/typescript',

  json: './mintlify/sdk-artifacts/typedoc.json',
  // Nobody reads this file; it is a build input for Mintlify.
  pretty: false
};
