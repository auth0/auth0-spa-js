if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

var execSync = require('child_process').execSync;
var fs = require('fs');

if (fs.existsSync('out')) {
  execSync(`rm -r out`, { stdio: 'inherit' });
}

if (!fs.existsSync('.release')) {
  console.log('No in progress release found');
  process.exit(0);
}
var tmp = fs.readFileSync('.release');
if (fs.existsSync(tmp)) {
  execSync(`rm -r ${tmp}`, { stdio: 'inherit' });
}

execSync(`rm -r .release`, { stdio: 'inherit' });
