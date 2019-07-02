const fs = require('fs');
const pkg = require('../package.json');
const exec = require('./exec');

const newVersion = process.argv[2];
if (!newVersion) {
  throw new Error('usage: `release new_version`');
}

(async () => {
  await exec('git checkout master');
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
})();
