'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var https = require('https');
var http = require('http');
var path = require('path');
var mime = _interopDefault(require('mime'));
var opener = _interopDefault(require('opener'));

var server;

/**
 * Serve your rolled up bundle like webpack-dev-server
 * @param {ServeOptions|string|string[]} options
 */
function serve (options) {
  if ( options === void 0 ) options = { contentBase: '' };

  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options };
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase];
  options.host = options.host || 'localhost';
  options.port = options.port || 10001;
  options.headers = options.headers || {};
  options.https = options.https || false;
  options.openPage = options.openPage || '';
  mime.default_type = 'text/plain';

  var requestListener = function (request, response) {
    // Remove querystring
    var urlPath = decodeURI(request.url.split('?')[0]);

    Object.keys(options.headers).forEach(function (key) {
      response.setHeader(key, options.headers[key]);
    });

    readFileFromContentBase(options.contentBase, urlPath, function (error, content, filePath) {
      if (!error) {
        return found(response, filePath, content)
      }
      if (error.code !== 'ENOENT') {
        response.writeHead(500);
        response.end('500 Internal Server Error' +
          '\n\n' + filePath +
          '\n\n' + Object.values(error).join('\n') +
          '\n\n(rollup-plugin-serve)', 'utf-8');
        return
      }
      if (options.historyApiFallback) {
        var fallbackPath = typeof options.historyApiFallback === 'string' ? options.historyApiFallback : '/index.html';
        readFileFromContentBase(options.contentBase, fallbackPath, function (error, content, filePath) {
          if (error) {
            notFound(response, filePath);
          } else {
            found(response, filePath, content);
          }
        });
      } else {
        notFound(response, filePath);
      }
    });
  };

  // release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.close();
  }

  // If HTTPS options are available, create an HTTPS server
  if (options.https) {
    server = https.createServer(options.https, requestListener).listen(options.port, options.host);
  } else {
    server = http.createServer(requestListener).listen(options.port, options.host);
  }

  closeServerOnTermination(server);

  var running = options.verbose === false;

  return {
    name: 'serve',
    generateBundle: function generateBundle () {
      if (!running) {
        running = true;

        // Log which url to visit
        var url = (options.https ? 'https' : 'http') + '://' + options.host + ':' + options.port;
        options.contentBase.forEach(function (base) {
          console.log(green(url) + ' -> ' + path.resolve(base));
        });

        // Open browser
        if (options.open) {
          opener(url + options.openPage);
        }
      }
    }
  }
}

function readFileFromContentBase (contentBase, urlPath, callback) {
  var filePath = path.resolve(contentBase[0] || '.', '.' + urlPath);

  // Load index.html in directories
  if (urlPath.endsWith('/')) {
    filePath = path.resolve(filePath, 'index.html');
  }

  fs.readFile(filePath, function (error, content) {
    if (error && contentBase.length > 1) {
      // Try to read from next contentBase
      readFileFromContentBase(contentBase.slice(1), urlPath, callback);
    } else {
      // We know enough
      callback(error, content, filePath);
    }
  });
}

function notFound (response, filePath) {
  response.writeHead(404);
  response.end('404 Not Found' +
    '\n\n' + filePath +
    '\n\n(rollup-plugin-serve)', 'utf-8');
}

function found (response, filePath, content) {
  response.writeHead(200, { 'Content-Type': mime.getType(filePath) });
  response.end(content, 'utf-8');
}

function green (text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination (server) {
  var terminationSignals = ['SIGINT', 'SIGTERM'];
  terminationSignals.forEach(function (signal) {
    process.on(signal, function () {
      server.close();
      process.exit();
    });
  });
}

/**
 * @typedef {Object} ServeOptions
 * @property {boolean} [open=false] Launch in browser (default: `false`)
 * @property {string} [openPage=''] Page to navigate to when opening the browser. Will not do anything if `open` is `false`. Remember to start with a slash e.g. `'/different/page'`
 * @property {boolean} [verbose=true] Show server address in console (default: `true`)
 * @property {string|string[]} [contentBase=''] Folder(s) to serve files from
 * @property {string|boolean} [historyApiFallback] Path to fallback page. Set to `true` to return index.html (200) instead of error page (404)
 * @property {string} [host='localhost'] Server host (default: `'localhost'`)
 * @property {number} [port=10001] Server port (default: `10001`)
 * @property {ServeOptionsHttps} [https=false] By default server will be served over HTTP (https: `false`). It can optionally be served over HTTPS
 * @property {{[header:string]: string}} [headers] Set headers
 */

/**
 * @typedef {Object} ServeOptionsHttps
 * @property {string|Buffer|Buffer[]|Object[]} key
 * @property {string|Buffer|Array<string|Buffer>} cert
 * @property {string|Buffer|Array<string|Buffer>} ca
 * @see https.ServerOptions
 */

module.exports = serve;
