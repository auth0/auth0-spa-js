const excludeFiles = [
  'cache',
  'jwt',
  'storage',
  'transaction-manager',
  'utils'
];

module.exports = {
  out: './docs/',
  readme: './README.MD',
  includes: './src',
  exclude: [
    '**/__tests__/**/*',
    '**/cypress/**/*',
    '**/node_modules/**/*',
    ...excludeFiles.map(f => `./src/${f}.ts`)
  ],
  mode: 'file',
  excludeExternals: true,
  excludePrivate: true,
  includeDeclarations: true,
  hideGenerator: true,
  theme: 'minimal'
};
