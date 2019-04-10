module.exports = {
  rootDir: './',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/__tests__/*.(ts)'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    './cypress',
    './jest.config.js'
  ],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  preset: 'ts-jest'
};
