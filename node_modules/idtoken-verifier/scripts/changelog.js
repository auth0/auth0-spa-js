if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

var library = require('../package.json');
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var moment = require('moment');

var tmp = fs.readFileSync('.release', 'utf-8');
var currentVersion = fs.readFileSync(
  path.resolve(tmp, 'current-version'),
  'utf-8'
);
var changelogPath = path.resolve(tmp, 'CHANGELOG.md');
var stream = fs.createWriteStream(changelogPath);

var webtask = `https://webtask.it.auth0.com/api/run/wt-hernan-auth0_com-0/oss-changelog.js?webtask_no_cache=1&repo=idtoken-verifier&milestone=v${
  library.version
}`;
var command = `curl -f -s -H "Accept: text/markdown" "${webtask}"`;
var changes = execSync(command, { encoding: 'utf-8' });
var previous = execSync('sed "s/# Change Log//" CHANGELOG.md | sed \'1,2d\'');
stream.once('open', function(fd) {
  stream.write('# Change Log');
  stream.write('\n');
  stream.write('\n');
  stream.write(
    `## [v${library.version}](https://github.com/auth0/idtoken-verifier/tree/v${
      library.version
    }) (${moment().format('YYYY-MM-DD')})`
  );
  stream.write('\n');
  stream.write(
    `[Full Changelog](https://github.com/auth0/idtoken-verifier/compare/v${currentVersion}...v${
      library.version
    })`
  );
  stream.write('\n');
  stream.write(changes);
  stream.write('\n');
  stream.write(previous);
  stream.end();
});
stream.once('close', function(fd) {
  execSync(`mv ${changelogPath} CHANGELOG.md`, { stdio: 'inherit' });
  execSync('git add CHANGELOG.md', { stdio: 'inherit' });
});
