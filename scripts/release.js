const fs = require('fs');
const pkg = require('../package.json');
const exec = require('./exec');
const writeChangelog = require('./changelog');

const newVersion = process.argv[2];
if (!newVersion) {
  throw new Error('usage: `release new_version [branch]`');
}

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

  await writeChangelog();
})();
