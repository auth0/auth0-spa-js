if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

const repo = 'auth0-spa-js';
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const moment = require('moment');

module.exports = function (newVersion) {
  return new Promise((resolve, reject) => {
    const tmp = fs.readFileSync('.release', 'utf-8');

    const currentVersion = fs.readFileSync(
      path.resolve(tmp, 'current-version'),
      'utf-8'
    );

    const changelogPath = path.resolve(tmp, 'CHANGELOG.md');
    const stream = fs.createWriteStream(changelogPath);
    const webtask = `https://webtask.it.auth0.com/api/run/wt-hernan-auth0_com-0/oss-changelog.js?webtask_no_cache=1&repo=${repo}&milestone=v${newVersion}`;
    const command = `curl -f -s -H "Accept: text/markdown" "${webtask}"`;
    const changes = execSync(command, { encoding: 'utf-8' });

    const previous = execSync(
      'sed "s/# Change Log//" CHANGELOG.md | sed \'1,2d\''
    );

    stream.once('open', function (fd) {
      stream.write('# Change Log');
      stream.write('\n');
      stream.write('\n');

      stream.write(
        `## [v${newVersion}](https://github.com/auth0/${repo}/tree/v${newVersion}) (${moment().format(
          'YYYY-MM-DD'
        )})`
      );

      stream.write('\n');

      stream.write(
        `[Full Changelog](https://github.com/auth0/${repo}/compare/v${currentVersion}...v${newVersion})`
      );

      stream.write('\n');
      stream.write(changes);
      stream.write('\n');
      stream.write(previous);
      stream.end();
    });

    stream.once('close', function (fd) {
      execSync(`mv ${changelogPath} CHANGELOG.md`, { stdio: 'inherit' });
      execSync('git add CHANGELOG.md', { stdio: 'inherit' });
      resolve();
    });
  });
};
