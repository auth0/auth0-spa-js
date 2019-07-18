const fs = require('fs');
const Table = require('cli-table');
const gzipSize = require('gzip-size');

const toKb = b => `${(b / Math.pow(1024, 1)).toFixed(2)} kb`;

const table = new Table({
  head: ['File', 'Size', 'GZIP size']
});

if (!fs.existsSync('./dist')) {
  console.log(`Can't print bundle size because ./dist doesn't exist.`);
  return;
}

fs.readdirSync('./dist')
  .filter(f => f.endsWith('.js'))
  .forEach(f => {
    const path = `./dist/${f}`;
    table.push([
      f,
      toKb(fs.statSync(path).size),
      toKb(gzipSize.fileSync(path))
    ]);
  });

console.log(table.toString());
