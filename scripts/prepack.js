const fs = require('fs');
const { join } = require('path');
const rimraf = require('rimraf');

const source = './dist/typings/src';
const dest = './dist/typings';

if (!fs.existsSync(source)) {
  return;
}

const files = fs.readdirSync(source);
let fileCount = 0;

files.forEach(file => {
  const src = join(source, file);

  fs.copyFileSync(join(source, file), join(dest, file));
  fileCount++;
});

rimraf.sync(source);

console.log(`Moved ${fileCount} type definition files`);
