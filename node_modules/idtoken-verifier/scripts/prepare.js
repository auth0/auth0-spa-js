if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

var library = require('../package.json');
var fs = require('fs');
var path = require('path');

if (!fs.existsSync('.release')) {
  var tmp = fs.mkdtempSync(`.release-tmp-`);
  fs.writeFileSync('.release', tmp);
} else {
  console.error('Found a pending release. Please run npm run release:clean');
  process.exit(1);
}

var lastVersionFile = path.resolve(tmp, 'current-version');
fs.writeFileSync(lastVersionFile, library.version);
