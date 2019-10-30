const fs = require('fs');
const { join } = require('path');
const rimraf = require('rimraf');

const source = './dist/typings/src';
const dest = './dist/typings';

const files = fs.readdirSync(source);

files.forEach(file => {
  const src = join(source, file);

  fs.copyFileSync(join(source, file), join(dest, file));
});

rimraf.sync(source);
