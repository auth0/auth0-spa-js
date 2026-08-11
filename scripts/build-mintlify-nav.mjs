// Build the Mintlify SDK Reference sidebar from the TypeDoc artifact.
//
// Why this script exists: Mintlify derives its own sidebar from each symbol's
// TypeScript `kind`, producing "Classes / Interfaces / Enumerations / Functions
// / Type Aliases / Variables" with all 143 exports flat inside. It ignores the
// artifact's `groups` and `categories`, and there is no setting to change that
// (`sdk` accepts only `format`, `source` and `directory`).
//
// The way out is to split the work across two tabs:
//
//   * a `hidden: true` tab that carries the `sdk` block. It still generates
//     every page and route, but contributes no navigation.
//   * the visible tab, whose pages this script writes: the same categories as
//     the local HTML reference, in the same order.
//
// The split is required because a tab declaring `sdk` always appends its kind
// groups after whatever `groups` that tab already has, so a single tab would
// show the curated nav and the 143-entry flat nav together.
//
// Two presets, because the nav has to be written in two different shapes:
//
//   * `local`  -> `mintlify/docs.json`, as `tabs[n].groups`, for `mint dev`.
//   * `docsv2` -> a standalone `{ "pages": [...] }` file matching the existing
//     `main/config/navigation/generated/*.en.json` files in the docs-v2 repo,
//     which are pulled into a tab by `$ref`. Generating it here rather than in
//     docs-v2 keeps that repo's diff down to one hand-edited file.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * URL segment Mintlify assigns to each page-level TypeDoc `ReflectionKind`.
 * Undocumented; read off a generated build. These differ from TypeDoc's own
 * HTML theme, which uses `enumerations/` and `type-aliases/`.
 */
const KIND_SEGMENT = {
  8: 'enums',
  32: 'variables',
  64: 'functions',
  128: 'classes',
  256: 'interfaces',
  2097152: 'types'
};

/** Categories that stay at the top level, un-nested, always visible. */
const TOP_CATEGORIES = ['Getting Started', 'Clients'];

/**
 * Everything else goes inside this one collapsed group. Mintlify only renders a
 * collapsible accordion for a *nested* group, so nesting is the only way to
 * collapse; `expanded: false` on a top-level group does nothing.
 */
const REST_GROUP = 'Reference';

// The local HTML sidebar hangs each client's methods off its class node. That is
// deliberately not mirrored here: Mintlify has no way to label a nav entry
// (there is no `label` or `title` field on a page), so an anchor entry renders
// with its raw slug, giving 24 rows reading "Auth0Client#gettokensilently".
// Mintlify already lists every method in the right-hand table of contents on the
// class page, which is the same one-click access without the sidebar noise.

const PRESETS = {
  local: {
    artifact: 'mintlify/sdk-artifacts/typedoc.json',
    target: 'mintlify/docs.json',
    shape: 'docs-json'
  },
  docsv2: {
    artifact: 'mintlify/docsv2/sdk-artifacts/auth0-spa-js.json',
    target: 'mintlify/docsv2/config/navigation/generated/spa-js-reference.en.json',
    shape: 'pages',
    // Must match `sdk.directory` in the docs-v2 tab. There is no docs.json here
    // to read it from, so it is stated explicitly.
    directory: 'docs/sdk/typescript'
  }
};

const presetName = process.argv[2] ?? 'local';
const preset = PRESETS[presetName];
if (!preset) {
  throw new Error(
    `Unknown preset "${presetName}". Expected one of: ${Object.keys(
      PRESETS
    ).join(', ')}`
  );
}

const artifactPath = join(root, preset.artifact);
const targetPath = join(root, preset.target);
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

if (!artifact.categories?.length) {
  throw new Error(
    `${preset.artifact} has no \`categories\`. Build it with \`typedoc.mintlify.js\`, which loads the category plugin.`
  );
}

// `docs-json` reads the directory off the tab that declares `sdk`, so the nav and
// the generated routes can never drift apart.
let docs;
let visibleTab;
let directory = preset.directory;

if (preset.shape === 'docs-json') {
  docs = JSON.parse(readFileSync(targetPath, 'utf8'));

  const sdkTab = docs.navigation.tabs.find(tab => tab.sdk);
  if (!sdkTab) {
    throw new Error(`${preset.target} has no tab with an \`sdk\` block`);
  }
  directory = sdkTab.sdk.directory ?? 'sdk-reference';

  visibleTab = docs.navigation.tabs.find(tab => !tab.sdk);
  if (!visibleTab) {
    throw new Error(`${preset.target} has no non-\`sdk\` tab to write into`);
  }
}

directory = directory.replace(/^\/|\/$/g, '');

const byId = new Map();
(function index(node) {
  byId.set(node.id, node);
  for (const child of node.children ?? []) index(child);
})(artifact);

/** @returns {string} slug of the generated page for a top-level export */
function slugFor(reflection) {
  const segment = KIND_SEGMENT[reflection.kind];
  if (!segment) {
    throw new Error(
      'No Mintlify URL segment known for ReflectionKind ' +
        reflection.kind +
        ' (' +
        reflection.name +
        '). Add it to KIND_SEGMENT.'
    );
  }
  return `${directory}/${segment}/${reflection.name}`;
}

const top = [];
const rest = [];

for (const category of artifact.categories) {
  const group = {
    group: category.title,
    pages: category.children
      .map(id => byId.get(id))
      .filter(Boolean)
      .map(slugFor)
  };
  if (!group.pages.length) continue;
  (TOP_CATEGORIES.includes(category.title) ? top : rest).push(group);
}

const pages = [...top, { group: REST_GROUP, pages: rest }];

if (preset.shape === 'docs-json') {
  visibleTab.groups = [
    ...(visibleTab.groups ?? []).filter(g => g.group === 'Overview'),
    ...pages
  ];
  writeFileSync(targetPath, `${JSON.stringify(docs, null, 2)}\n`);
} else {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify({ pages }, null, 2)}\n`);
}

const counts = [...top, ...rest]
  .map(g => `${g.group} ${g.pages.length}`)
  .join(', ');
console.log(`wrote ${preset.target}: ${counts}`);
