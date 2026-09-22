// @ts-check
/**
 * TypeDoc plugin that shapes the generated API reference for readability.
 *
 * Two jobs:
 *
 * 1. Categorize every top-level export so the landing page and sidebar read as
 *    "Getting Started / Clients / Configuration / Errors / ..." instead of one
 *    flat alphabetical list of ~140 symbols. Categories are derived from the
 *    export's name and source path, so new exports get sorted automatically
 *    without anyone having to add an `@category` tag by hand. A tag written in
 *    the source always wins.
 *
 * 2. Put the client classes' methods directly in the sidebar, so `getTokenSilently`
 *    or `mfa.enroll` is one click from anywhere rather than "click the class, then
 *    scan an index, then click again". TypeDoc 0.25's default theme stops the
 *    navigation tree at module level, so we extend DefaultTheme to add class
 *    members for the entry-point clients only.
 */
const {
  Comment,
  CommentTag,
  Converter,
  DefaultTheme,
  JSX,
  ReflectionKind
} = require('typedoc');

/** Classes that are the SDK's real entry points. Their methods go in the sidebar. */
const CLIENT_CLASSES = [
  'Auth0Client',
  'MfaApiClient',
  'PasskeyApiClient',
  'MyAccountApiClient',
  'Fetcher'
];

const SETUP = 'Getting Started';
const CLIENTS = 'Clients';
const CONFIGURATION = 'Configuration';
const AUTHENTICATION = 'Login & Logout';
const TOKENS = 'Tokens & Users';
const MFA = 'Multi-Factor Authentication';
const PASSKEYS = 'Passkeys';
const MY_ACCOUNT = 'My Account';
const ERRORS = 'Errors';
const CACHING = 'Caching';
const OTHER = 'Other Types';

/**
 * Category order on the landing page and in the sidebar. `*` is where any
 * category not listed here lands.
 */
const CATEGORY_ORDER = [
  SETUP,
  CLIENTS,
  CONFIGURATION,
  AUTHENTICATION,
  TOKENS,
  MFA,
  PASSKEYS,
  MY_ACCOUNT,
  ERRORS,
  CACHING,
  '*',
  OTHER
];

/** Exports that belong in "Getting Started" regardless of kind. */
const SETUP_EXPORTS = new Set(['createAuth0Client']);

/** Exports that belong in "Configuration" regardless of kind. */
const CONFIGURATION_EXPORTS = new Set([
  'Auth0ClientOptions',
  'AuthorizationParams',
  'ClientAuthorizationParams',
  'ClientConfiguration',
  'CacheLocation',
  'RefreshTokenMode',
  'InteractiveErrorHandler'
]);

/** Options and results for the login, logout and connect-account flows. */
const AUTHENTICATION_EXPORTS = new Set([
  'RedirectLoginOptions',
  'RedirectLoginResult',
  'PopupLoginOptions',
  'PopupConfigOptions',
  'LogoutOptions',
  'LogoutUrlOptions',
  'RedirectConnectAccountOptions',
  'ConnectAccountRedirectResult'
]);

/** Everything about acquiring tokens and reading the resulting identity. */
const TOKEN_EXPORTS = new Set([
  'GetTokenSilentlyOptions',
  'GetTokenSilentlyVerboseResponse',
  'GetTokenWithPopupOptions',
  'TokenEndpointResponse',
  'RevokeRefreshTokenOptions',
  'CustomTokenExchangeOptions',
  'User',
  'IdToken',
  'ActClaim',
  'FetcherConfig',
  'CustomFetchMinimalOutput'
]);

/**
 * Decide which category a top-level export belongs to. Driven by name and
 * source path so that new exports land somewhere sensible on their own.
 *
 * @param {import('typedoc').DeclarationReflection} reflection
 * @returns {string}
 */
function categoryFor(reflection) {
  const { name } = reflection;

  if (SETUP_EXPORTS.has(name)) return SETUP;
  if (CLIENT_CLASSES.includes(name)) return CLIENTS;

  // Errors first: an error's home is the Errors section even when it comes from
  // a feature directory that would otherwise claim it.
  if (/Error$/.test(name) || name === 'MfaRequirements') return ERRORS;

  if (CONFIGURATION_EXPORTS.has(name)) return CONFIGURATION;
  if (AUTHENTICATION_EXPORTS.has(name)) return AUTHENTICATION;
  if (TOKEN_EXPORTS.has(name)) return TOKENS;

  // Source paths are relative to TypeDoc's computed base path, which shifts
  // depending on which files end up in the program, so match on the directory
  // segment rather than a prefix.
  const fileName = reflection.sources?.[0]?.fileName ?? '';
  const inDir = dir => fileName.includes(`${dir}/`);

  if (inDir('mfa')) return MFA;
  if (inDir('passkey')) return PASSKEYS;
  if (inDir('myaccount')) return MY_ACCOUNT;
  if (inDir('cache') || name === 'ICache') return CACHING;

  // Types re-exported from `@auth0/auth0-auth-js` have no path under `src/`,
  // so fall back to the name.
  if (name.startsWith('Passkey')) return PASSKEYS;
  if (name.startsWith('Mfa')) return MFA;

  return OTHER;
}

/**
 * Categories for `Auth0Client`'s own members, so its class page groups 20+
 * methods by task instead of listing them all under one "Methods" heading.
 * Anything not listed here falls into "Advanced".
 */
const AUTH0CLIENT_MEMBER_CATEGORIES = {
  Authentication: [
    'loginWithRedirect',
    'handleRedirectCallback',
    'loginWithPopup',
    'logout',
    'isAuthenticated',
    'checkSession'
  ],
  Tokens: [
    'getTokenSilently',
    'getTokenWithPopup',
    'revokeRefreshToken',
    'loginWithCustomTokenExchange',
    'customTokenExchange',
    'exchangeToken'
  ],
  'User Profile': ['getUser', 'getIdTokenClaims'],
  'Sub-clients': ['mfa', 'passkey', 'myAccount'],
  'Connected Accounts': ['connectAccountWithRedirect']
};

/** Reverse lookup: member name -> category title. */
const AUTH0CLIENT_MEMBER_CATEGORY = new Map(
  Object.entries(AUTH0CLIENT_MEMBER_CATEGORIES).flatMap(([title, names]) =>
    names.map(name => [name, title])
  )
);

/** Order of the member categories on the `Auth0Client` page. */
const MEMBER_CATEGORY_ORDER = [
  'Sub-clients',
  'Authentication',
  'Tokens',
  'User Profile',
  'Connected Accounts',
  'Advanced'
];

/**
 * Sidebar position for an `Auth0Client` member: category order first, then the
 * order the names are declared within that category. Uncategorized members
 * ("Advanced") sort last, among themselves alphabetically.
 */
const MEMBER_RANK = new Map(
  MEMBER_CATEGORY_ORDER.flatMap((title, categoryIndex) =>
    (AUTH0CLIENT_MEMBER_CATEGORIES[title] ?? []).map((name, index) => [
      name,
      categoryIndex * 100 + index
    ])
  )
);

/** @param {string} name */
function memberRank(name) {
  return MEMBER_RANK.get(name) ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Stamp an `@category` tag on a reflection, unless the source already declares
 * one — a hand-written tag always wins.
 *
 * @param {import('typedoc').DeclarationReflection} reflection
 * @param {string} category
 */
function setCategory(reflection, category) {
  const comment = reflection.comment ?? reflection.signatures?.[0]?.comment;

  if (comment?.getTag('@category')) return;

  const tag = new CommentTag('@category', [{ kind: 'text', text: category }]);

  if (comment) {
    comment.blockTags.push(tag);
  } else {
    // Undocumented symbol: give it a comment so it can still be grouped.
    reflection.comment = new Comment([], [tag]);
  }
}

/** @param {import('typedoc').Application} app */
function load(app) {
  // Priority 1000 so this runs before the built-in CategoryPlugin, which also
  // listens on RESOLVE_END and reads (then strips) `@category` tags.
  app.converter.on(
    Converter.EVENT_RESOLVE_END,
    context => {
      const { project } = context;

      for (const child of project.children ?? []) {
        setCategory(child, categoryFor(child));
      }

      const auth0Client = project.getChildByName('Auth0Client');
      for (const member of auth0Client?.children ?? []) {
        setCategory(
          member,
          AUTH0CLIENT_MEMBER_CATEGORY.get(member.name) ?? 'Advanced'
        );
      }
    },
    undefined,
    1000
  );

  app.renderer.defineTheme(
    'auth0',
    class extends DefaultTheme {
      buildNavigation(project) {
        const navigation = super.buildNavigation(project);
        addClientMembers(navigation, project);
        return navigation;
      }
    }
  );

  // The sidebar is built client-side and every group starts collapsed, so a
  // first-time reader lands on a list of category names with no classes in
  // sight. Seed "Clients" as expanded before the nav script runs. Reading the
  // key first means a reader who collapses it keeps that choice.
  app.renderer.hooks.on('body.begin', () =>
    JSX.createElement(
      'script',
      null,
      JSX.createElement(JSX.Raw, {
        html: `try{var k='tsd-accordion-${CLIENTS.toLowerCase()}';if(localStorage.getItem(k)===null)localStorage.setItem(k,'true')}catch(e){}`
      })
    )
  );
}

/**
 * Walk the navigation tree and hang each client class's methods off its node.
 *
 * @param {any[]} nodes
 * @param {import('typedoc').ProjectReflection} project
 */
function addClientMembers(nodes, project) {
  for (const node of nodes) {
    if (node.children?.length) {
      addClientMembers(node.children, project);
      continue;
    }

    if (!CLIENT_CLASSES.includes(node.text)) continue;

    const cls = project.getChildByName(node.text);
    if (!cls?.children) continue;

    // Properties matter here: `auth0.mfa`, `auth0.passkey` and `auth0.myAccount`
    // are the sub-clients, and they are the entry points most people are looking
    // for. Internal state is already gone via `excludePrivate`/`excludeProtected`.
    const members = cls.children.filter(
      member =>
        member.kindOf(
          ReflectionKind.Method |
            ReflectionKind.Accessor |
            ReflectionKind.Property
        ) &&
        !member.flags.isPrivate &&
        !member.flags.isProtected &&
        !member.flags.isExternal &&
        member.name !== 'constructor'
    );

    // `Auth0Client` has 20+ methods, so list them in the same task order as its
    // page index: `mfa` and `getTokenSilently` first, `generateDpopProof` last.
    // Alphabetical would bury the methods most people came for. Every other
    // client is small enough that TypeDoc's own ordering reads fine.
    if (cls.name === 'Auth0Client') {
      members.sort((a, b) => memberRank(a.name) - memberRank(b.name));
    }

    const links = members.map(member => ({
      text: member.name,
      path: `${cls.url}#${member.anchor ?? member.name}`,
      kind: member.kind,
      class: member.isDeprecated() ? 'deprecated' : undefined
    }));

    if (links.length) {
      node.children = links;
    }
  }
}

/**
 * `categoryOrder` is a single global setting, so it has to cover both the
 * top-level export categories and `Auth0Client`'s member categories. The two
 * sets are disjoint, so concatenating them orders each page correctly.
 */
const ALL_CATEGORY_ORDER = [...MEMBER_CATEGORY_ORDER, ...CATEGORY_ORDER];

module.exports = { load, CATEGORY_ORDER: ALL_CATEGORY_ORDER };
