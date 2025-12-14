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
    }]
  ]
};
