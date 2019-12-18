const fs = require('fs');
const Table = require('cli-table');
const gzipSize = require('gzip-size');

const toKb = b => `${(b / Math.pow(1024, 1)).toFixed(2)} kb`;

const table = new Table({
  head: ['File', 'Size', 'GZIP size']
});

fs.readdirSync('./build')
  .filter(f => f.endsWith('.js'))
  .forEach(f => {
    const path = `./build/${f}`;
    table.push([
      f,
      toKb(fs.statSync(path).size),
      toKb(gzipSize.fileSync(path))
    ]);
  });

console.log(table.toString());
