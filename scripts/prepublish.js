const fs = require('fs');
const { join } = require('path');
const rimraf = require('rimraf');

const files = fs.readdirSync('./dist/typings/src');

files.forEach(file => {
  const src = join('./dist/typings/src', file);

  fs.copyFileSync(
    join('./dist/typings/src', file),
    join('./dist/typings', file)
  );
});

rimraf.sync('./dist/typings/src');
