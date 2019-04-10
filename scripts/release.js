const fs = require('fs');
const pkg = require('../package.json');
const newVersion = process.argv[2];
if (!newVersion) {
  throw new Error('usage: `release new_version`');
}

fs.writeFileSync(
  '../package.json',
  JSON.stringify({ ...pkg, version: newVersion }, null, 2)
);
fs.writeFileSync('./version.ts', `export default '${newVersion}';`);
