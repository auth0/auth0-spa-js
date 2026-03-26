const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const source = './dist/typings/src';
const dest = './dist/typings';

if (!fs.existsSync(source)) {
  return;
}

let fileCount = 0;

function moveDir(srcDir, destDir) {
  fs.readdirSync(srcDir, { withFileTypes: true }).forEach((entry) => {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      moveDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      fileCount++;
    }
  });
}

moveDir(source, dest);
rimraf.sync(source);

console.log(`Moved ${fileCount} type definition files`);
