'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _git = require('./git');

var gitScm = _interopRequireWildcard(_git);

var _hg = require('./hg');

var hgScm = _interopRequireWildcard(_hg);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const scms = [gitScm, hgScm];

exports.default = directory => {
  for (const scm of scms) {
    const rootDirectory = scm.detect(directory);
    if (rootDirectory) {
      return Object.assign({ rootDirectory }, scm);
    }
  }
};