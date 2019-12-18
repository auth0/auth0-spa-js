'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _path = require('path');

var _ignore = require('ignore');

var _ignore2 = _interopRequireDefault(_ignore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (directory, filename = '.prettierignore') => {
  const file = (0, _path.join)(directory, filename);
  if ((0, _fs.existsSync)(file)) {
    const text = (0, _fs.readFileSync)(file, 'utf8');
    return (0, _ignore2.default)().add(text).createFilter();
  }

  return () => true;
};