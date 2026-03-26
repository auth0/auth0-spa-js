const fs = require('fs');

if (!fs.existsSync('./dist/typings/index.d.ts')) {
  console.error('ERROR: dist/typings/index.d.ts is missing — aborting publish');
  process.exit(1);
}
