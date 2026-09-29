// @ts-check
/**
 * Orders the reference by category and errors on a misspelt `@category` tag.
 *
 * Untagged exports land in "Other" deliberately. A misspelt tag is the hazard:
 * TypeDoc treats the typo as a new category and files it under the `*` slot.
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
 * `categoryOrder` is one global setting covering both top-level and member
 * categories. The two sets are disjoint, so concatenating orders each correctly.
 */
const ALL_CATEGORY_ORDER = [...MEMBER_CATEGORY_ORDER, ...CATEGORY_ORDER];

/** Valid on a top-level export. `*` is a sort placeholder, not a tag value. */
const TOP_LEVEL_CATEGORIES = CATEGORY_ORDER.filter(name => name !== '*');

/** Valid on a class member. */
const MEMBER_CATEGORIES = [...MEMBER_CATEGORY_ORDER, UNCATEGORIZED];

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

/**
 * Every declaration in the project, including class members.
 */
function declarations(parent) {
  const found = [];

  for (const child of parent.children ?? []) {
    found.push(child, ...declarations(child));
  }

  return found;
}

/** @param {import('typedoc').Application} app */
function load(app) {
  // Priority 1000: run before the built-in CategoryPlugin, which reads and
  // strips `@category` tags on the same RESOLVE_END event.
  app.converter.on(
    Converter.EVENT_RESOLVE_END,
    context => {
      for (const reflection of declarations(context.project)) {
        const category = categoryOf(reflection);

        if (!category) {
          continue;
        }

        const isTopLevel = reflection.parent === context.project;
        const allowed = isTopLevel ? TOP_LEVEL_CATEGORIES : MEMBER_CATEGORIES;

        if (!allowed.includes(category)) {
          // `error` not `warn`: TypeDoc then exits non-zero, so CI catches it.
          app.logger.error(
            `Unknown @category "${category}" on ${reflection.getFullName()}. ` +
              `${isTopLevel ? 'Top-level exports' : 'Class members'} take one ` +
              `of: ${allowed.join(', ')}.`
          );
        }
      }
    },
    undefined,
    1000
  );
}

module.exports = {
  load,
  CATEGORY_ORDER: ALL_CATEGORY_ORDER,
  DEFAULT_CATEGORY: UNCATEGORIZED
};
