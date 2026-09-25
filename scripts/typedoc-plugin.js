// @ts-check
/**
 * Orders the reference by category and warns when an export lands in "Other".
 *
 * Every export is `@category`-tagged at its declaration in `src/`. TypeDoc's
 * `defaultCategory` catches anything untagged (including types re-exported from
 * `@auth0/auth0-auth-js`, whose declarations live in `node_modules`), so this
 * plugin only orders the categories and flags stragglers.
 */
const { Converter } = require('typedoc');

const SETUP = 'Getting Started';
const CLIENTS = 'Clients';
const CONFIGURATION = 'Configuration';
const AUTHENTICATION = 'Login & Logout';
const TOKENS = 'Tokens & Users';
const ERRORS = 'Errors';

/** Where an untagged export lands. */
const UNCATEGORIZED = 'Other';

/** Category order on the landing page and sidebar; `*` catches the rest. */
const CATEGORY_ORDER = [
  SETUP,
  CLIENTS,
  CONFIGURATION,
  AUTHENTICATION,
  TOKENS,
  ERRORS,
  '*',
  UNCATEGORIZED
];

/**
 * Order of member categories on client class pages. Only applies to classes
 * whose members are `@category`-tagged; untagged ones keep TypeDoc's grouping.
 */
const MEMBER_CATEGORY_ORDER = [
  'Constructor',
  'Sub-clients',
  'Authentication',
  'Tokens',
  'User Profile',
  'Connected Accounts',
  'Advanced'
];

/**
 * Read a reflection's `@category` tag, if any.
 *
 * @param {import('typedoc').DeclarationReflection} reflection
 * @returns {string | undefined}
 */
function categoryOf(reflection) {
  const comment = reflection.comment ?? reflection.signatures?.[0]?.comment;
  return comment?.getTag('@category')?.content[0]?.text.trim();
}

/** @param {import('typedoc').Application} app */
function load(app) {
  // Priority 1000: run before the built-in CategoryPlugin, which reads and
  // strips `@category` tags on the same RESOLVE_END event.
  app.converter.on(
    Converter.EVENT_RESOLVE_END,
    context => {
      // An untagged export lands in "Other" (TypeDoc's `defaultCategory`).
      // That's a valid home, but a new one usually means a forgotten
      // `@category` tag, so name the stragglers rather than let them rot.
      const untagged = (context.project.children ?? [])
        .filter(child => !categoryOf(child))
        .map(child => child.name);

      if (untagged.length) {
        app.logger.warn(
          `No @category tag, so these landed in "${UNCATEGORIZED}": ${untagged.join(', ')}`
        );
      }
    },
    undefined,
    1000
  );
}

/**
 * `categoryOrder` is one global setting covering both top-level and member
 * categories. The two sets are disjoint, so concatenating orders each correctly.
 */
const ALL_CATEGORY_ORDER = [...MEMBER_CATEGORY_ORDER, ...CATEGORY_ORDER];

module.exports = {
  load,
  CATEGORY_ORDER: ALL_CATEGORY_ORDER,
  DEFAULT_CATEGORY: UNCATEGORIZED
};
