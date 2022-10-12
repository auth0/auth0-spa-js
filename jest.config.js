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
  preset: 'ts-jest',
  setupFiles: ['jest-localstorage-mock', './jest.setup.js'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json'
    }
  }
};
