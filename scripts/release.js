const fs = require('fs');
const pkg = require('../package.json');
const exec = require('./exec');
const writeChangelog = require('./changelog');
const path = require('path');
const tmp = fs.mkdtempSync(`.release-tmp-`);

if (!fs.existsSync('.release')) {
  fs.writeFileSync('.release', tmp);
} else {
  console.error('Found a pending release. Please run `npm run release:clean`');
  process.exit(1);
}

const newVersion = process.argv[2];
if (!newVersion) {
  throw new Error('usage: `release new_version [branch]`');
}

var lastVersionFile = path.resolve(tmp, 'current-version');
fs.writeFileSync(lastVersionFile, pkg.version);

const branch = process.argv[3];

(async () => {
  if (branch) {
    await exec(`git checkout ${branch}`);
  }

  await exec('git pull');
  await exec(`git checkout -b prepare/${newVersion}`);

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

  await exec('npm run docs');

  await writeChangelog(newVersion);

  await exec('npm run release:clean');
})();
