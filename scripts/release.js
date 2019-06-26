const fs = require('fs');
const pkg = require('../package.json');
const newVersion = process.argv[2];
if (!newVersion) {
  throw new Error('usage: `release new_version`');
}

const newReadme = fs
  .readFileSync('./README.md')
  .toString()
  .replace(pkg.version, newVersion);

fs.writeFileSync('./README.md', newReadme);

fs.writeFileSync(
  './package.json',
  JSON.stringify({ ...pkg, version: newVersion }, null, 2)
);
fs.writeFileSync('./src/version.ts', `export default '${newVersion}';`);
