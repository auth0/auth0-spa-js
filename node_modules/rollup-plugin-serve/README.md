# Rollup plugin to serve the bundle

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="Software License" />
</a>
<a href="https://github.com/thgh/rollup-plugin-serve/issues">
  <img src="https://img.shields.io/github/issues/thgh/rollup-plugin-serve.svg" alt="Issues" />
</a>
<a href="http://standardjs.com/">
  <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" alt="JavaScript Style Guide" />
</a>
<a href="https://npmjs.org/package/rollup-plugin-serve">
  <img src="https://img.shields.io/npm/v/rollup-plugin-serve.svg?style=flat-squar" alt="NPM" />
</a>
<a href="https://github.com/thgh/rollup-plugin-serve/releases">
  <img src="https://img.shields.io/github/release/thgh/rollup-plugin-serve.svg" alt="Latest Version" />
</a>

## Installation
```
# Rollup v0.60+ and v1+
npm install --save-dev rollup-plugin-serve

# Rollup v0.59 and below
npm install --save-dev rollup-plugin-serve@0
```

## Usage
```js
// rollup.config.js
import serve from 'rollup-plugin-serve'

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: ...
  },
  plugins: [
    serve('dist')
  ]
}
```

### Options

By default it serves the current project folder. Change it by passing a string:
```js
serve('public')    // will be used as contentBase

// Default options
serve({
  // Launch in browser (default: false)
  open: true,

  // Page to navigate to when opening the browser.
  // Will not do anything if open=false.
  // Remember to start with a slash.
  openPage: '/different/page',

  // Show server address in console (default: true)
  verbose: false,

  // Folder to serve files from
  contentBase: '',

  // Multiple folders to serve from
  contentBase: ['dist', 'static'],

  // Set to true to return index.html (200) instead of error page (404)
  historyApiFallback: false,

  // Path to fallback page
  historyApiFallback: '/200.html',

  // Options used in setting up server
  host: 'localhost',
  port: 10001,

  // By default server will be served over HTTP (https: false). It can optionally be served over HTTPS
  https: {
    key: fs.readFileSync('/path/to/server.key'),
    cert: fs.readFileSync('/path/to/server.crt'),
    ca: fs.readFileSync('/path/to/ca.pem')
  },

  //set headers
  headers: {
    'Access-Control-Allow-Origin': '*',
    foo: 'bar'
  }
})
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Contributing

Contributions and feedback are very welcome.

This project aims to stay lean and close to standards. New features should encourage to stick to standards. Options that match the behaviour of [webpack-dev-server](https://webpack.js.org/configuration/dev-server/#devserver) are always ok.

To get it running:
  1. Clone the project.
  2. `npm install`
  3. `npm run build`

## Credits

- [Thomas Ghysels](https://github.com/thgh)
- [All Contributors][link-contributors]

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[link-author]: https://github.com/thgh
[link-contributors]: ../../contributors
[rollup-plugin-serve]: https://www.npmjs.com/package/rollup-plugin-serve
