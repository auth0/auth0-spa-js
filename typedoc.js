const { CATEGORY_ORDER } = require('./scripts/typedoc-plugin.js');

module.exports = {
  // Document what the package actually exports. Pointing TypeDoc at `src/`
  // instead made it expand every file in the tree, which pulled internal
  // modules (transaction manager, storage, worker, http) into the reference.
  entryPoints: ['./src/index.ts'],
  entryPointStrategy: 'resolve',

  out: './docs/',
  readme: './README.MD',
  name: 'Auth0 SPA SDK',
  cleanOutputDir: true,

  plugin: ['./scripts/typedoc-plugin.js'],
  theme: 'auth0',
  customCss: './scripts/typedoc.css',

  // Keep the reference to the public surface.
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  // Without this, every error class inherits Error's `stack`, `captureStackTrace`
  // and `prepareStackTrace` from TypeScript's own lib types. Errors and clients
  // re-exported from `@auth0/auth0-auth-js` are part of our public surface, so
  // only the TypeScript lib and other third-party packages count as external.
  excludeExternals: true,
  externalPattern: [
    '**/node_modules/typescript/**',
    '**/node_modules/@types/**'
  ],
  // Note: no blanket `node_modules` exclusion here. `exclude` is matched against
  // a symbol's declaration file, so excluding node_modules would also drop the
  // error classes we deliberately re-export from `@auth0/auth0-auth-js`.
  exclude: [
    '**/__tests__/**/*',
    '**/__mocks__/**/*',
    '**/cypress/**/*',
    'src/worker/**/*'
  ],

  // Group the landing page and sidebar by category rather than by TypeScript
  // kind, so readers see "Clients" before a wall of interfaces.
  categorizeByGroup: false,
  categoryOrder: CATEGORY_ORDER,
  defaultCategory: 'Other Types',
  navigation: {
    includeCategories: true,
    includeGroups: false
  },
  sort: ['kind', 'alphabetical'],
  kindSortOrder: [
    'Function',
    'Class',
    'Interface',
    'TypeAlias',
    'Enum',
    'Variable'
  ],

  hideGenerator: true,
  // Types are self-describing in signatures; repeating them in every heading
  // makes long method titles hard to scan.
  hideParameterTypesInTitle: true,
  searchInComments: true,

  compilerOptions: {
    skipLibCheck: true
  }
};
