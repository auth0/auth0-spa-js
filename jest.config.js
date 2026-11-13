module.exports = {
  rootDir: './',
  testEnvironment: './jest.environment',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    './cypress',
    './jest.config.js',
    './__tests__',
    './src/index.ts'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results/jest' }]
  ],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    // From TypeScript 5.6, ts-jest emits ESM-only dependencies
    // (`"type": "module"`) as ESM, which Jest can't load, so plain JS goes
    // through Babel instead.
    '^.+\\.js$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
      }
    ]
  },
  transformIgnorePatterns: ['node_modules\/(?!(dpop|@auth0\/auth0-auth-js|openid-client|oauth4webapi|jose)\/)'],
  setupFiles: ['jest-localstorage-mock', './jest.setup.js'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json'
    }
  }
};
