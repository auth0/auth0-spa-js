const fs = require('fs');
const { join } = require('path');
const rimraf = require('rimraf');

const source = './dist/typings/src';
const dest = './dist/typings';

if (!fs.existsSync(source)) {
  return;
}

const files = fs.readdirSync(source, {
  withFileTypes: true,
});

let fileCount = 0;

files.forEach((file) => {
  if (file.isFile()) {
    fs.copyFileSync(join(source, file.name), join(dest, file.name));
    fileCount++;
  }
});

rimraf.sync(source);

console.log(`Moved ${fileCount} type definition files`);
