// @ts-check
/**
 * TypeDoc plugin for the Mintlify SDK reference pipeline.
 *
 * Mintlify renders a type reference as a plain text pill, so `mfa: MfaApiClient`
 * on the `Auth0Client` page is a dead end even though `MfaApiClient` has its own
 * generated page. Mintlify's renderer reads only a symbol's comment summary:
 * `@see` block tags are dropped and `{@link}` inline tags are resolved by
 * TypeDoc before serialization, so the one thing that survives into the page is
 * markdown in the summary itself.
 *
 * This plugin therefore appends a "Type:" line of markdown links to every
 * symbol whose type mentions another documented export. It runs only for the
 * JSON artifact, never for the HTML site, where TypeDoc already links types.
 */
const { Converter, ParameterType, ReflectionKind, Type } = require('typedoc');

/**
 * URL segment Mintlify assigns to each page-level `ReflectionKind`. These are
 * not documented anywhere; they were read off a generated build. Note they
 * differ from TypeDoc's own HTML theme, which uses `enumerations/` and
 * `type-aliases/`.
 */
const KIND_SEGMENT = {
  [ReflectionKind.Enum]: 'enums',
  [ReflectionKind.Variable]: 'variables',
  [ReflectionKind.Function]: 'functions',
  [ReflectionKind.Class]: 'classes',
  [ReflectionKind.Interface]: 'interfaces',
  [ReflectionKind.TypeAlias]: 'types'
};

/** Kinds whose pages carry the type pills worth linking. */
const LINKABLE_KINDS =
  ReflectionKind.Property |
  ReflectionKind.Accessor |
  ReflectionKind.Parameter |
  ReflectionKind.TypeAlias |
  ReflectionKind.Variable;

/**
 * Collect the names of every reference type mentioned anywhere in a type,
 * including inside type arguments, unions, intersections and arrays. A
 * `Promise<GetTokenSilentlyVerboseResponse>` return type should link the
 * response, not be skipped for being wrapped.
 *
 * Recursion is restricted to `Type` instances on purpose. Some types hold a
 * `declaration` pointing back at a reflection, and following that walks into
 * the whole project graph and overflows the stack.
 *
 * @param {import('typedoc').SomeType | undefined} type
 * @param {Set<string>} out
 */
function collectReferenceNames(type, out) {
  if (!(type instanceof Type)) return;

  if (type.type === 'reference' && typeof type.name === 'string') {
    out.add(type.name);
  }

  for (const value of Object.values(type)) {
    if (Array.isArray(value)) {
      value.forEach(entry => collectReferenceNames(entry, out));
    } else {
      collectReferenceNames(/** @type {any} */ (value), out);
    }
  }
}

/** @param {import('typedoc').Application} app */
function load(app) {
  app.options.addDeclaration({
    name: 'mintlifyDirectory',
    help: 'URL prefix Mintlify serves the generated SDK pages under. Must match `sdk.directory` in docs.json.',
    type: ParameterType.String,
    defaultValue: 'sdk/typescript'
  });

  // Priority -1000 so this runs after the category plugin and after TypeDoc's
  // own resolution: by now every type reference has a resolved name.
  app.converter.on(
    Converter.EVENT_RESOLVE_END,
    context => {
      const { project } = context;
      const directory = String(
        app.options.getValue('mintlifyDirectory')
      ).replace(/^\/|\/$/g, '');

      /** Documented top-level exports, by name, that Mintlify gives a page. */
      const pages = new Map();
      for (const child of project.children ?? []) {
        const segment = KIND_SEGMENT[child.kind];
        if (segment) {
          pages.set(child.name, `/${directory}/${segment}/${child.name}`);
        }
      }

      for (const reflection of project.getReflectionsByKind(LINKABLE_KINDS)) {
        const names = new Set();
        collectReferenceNames(/** @type {any} */ (reflection).type, names);

        // A symbol never needs a link to its own page.
        names.delete(reflection.name);
        names.delete(reflection.parent?.name ?? '');

        const links = [...names]
          .filter(name => pages.has(name))
          .sort()
          .map(name => `[${name}](${pages.get(name)})`);

        if (!links.length) continue;

        appendSummary(reflection, `Type: ${links.join(', ')}`);
      }
    },
    undefined,
    -1000
  );
}

/**
 * Append a markdown paragraph to a reflection's comment summary, creating the
 * comment if the symbol is undocumented. Mintlify renders the summary as MDX,
 * so the markdown becomes real anchors.
 *
 * @param {import('typedoc').Reflection} reflection
 * @param {string} markdown
 */
function appendSummary(reflection, markdown) {
  const { Comment } = require('typedoc');
  const target = /** @type {any} */ (reflection);
  const comment = target.comment ?? target.signatures?.[0]?.comment;

  if (comment) {
    comment.summary.push({ kind: 'text', text: `\n\n${markdown}` });
  } else {
    target.comment = new Comment([{ kind: 'text', text: markdown }]);
  }
}

module.exports = { load, KIND_SEGMENT };
