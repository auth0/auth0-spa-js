module.exports = {
  presets: [
    ['@babel/preset-env', {
      // Target browsers that support ES2017 features (async/await, object spread, etc.)
      targets: {
        browsers: [
          'chrome >= 60',
          'safari >= 11',
          'firefox >= 55',
          'edge >= 15',
          'ios >= 11',
          'android >= 67'
        ]
      },
      useBuiltIns: false,
      modules: false
    }],
    // Allow Babel to parse and strip TypeScript when processing .ts files.
    // rollup-plugin-typescript2 handles type-checking; this preset ensures
    // Babel can compile .ts source if it receives it before rpt2 transforms it.
    '@babel/preset-typescript'
  ]
};
