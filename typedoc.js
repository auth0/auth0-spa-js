const excludeFiles = [
  'cache',
  'jwt',
  'storage',
  'transaction-manager',
  'utils',
  'promise-utils',
  'user-agent',
  'api',
  'http'
];

module.exports = {
  out: './docs/',
  readme: './README.MD',
  includes: './src',
  exclude: [
    '**/__tests__/**/*',
    '**/cypress/**/*',
    '**/node_modules/**/*',
    '**/__mocks__/**/*',
    'src/worker/**/*',
    ...excludeFiles.map(f => `./src/${f}.ts`)
  ],
  mode: 'file',
  excludeExternals: true,
  excludePrivate: true,
  includeDeclarations: true,
  stripInternal: true,
  hideGenerator: true,
  theme: 'minimal'
};
