if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  exit(1);
}

var library = require('../package.json');
var execSync = require('child_process').execSync;
execSync(
  `echo "export default { version: '${
    library.version
  }', name: 'idtoken-verifier' };" > src/telemetry.js`
);
execSync('git add src/telemetry.js');
