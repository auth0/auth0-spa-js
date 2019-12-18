'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stageFile = exports.getUnstagedChangedFiles = exports.getChangedFiles = exports.getSinceRevision = exports.detect = exports.name = undefined;

var _findUp = require('find-up');

var _findUp2 = _interopRequireDefault(_findUp);

var _execa = require('execa');

var _execa2 = _interopRequireDefault(_execa);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const name = exports.name = 'hg';

const detect = exports.detect = directory => {
  const hgDirectory = _findUp2.default.sync('.hg', { cwd: directory });
  if (hgDirectory) {
    return (0, _path.dirname)(hgDirectory);
  }
};

const runHg = (directory, args) => _execa2.default.sync('hg', args, {
  cwd: directory
});

const getLines = execaResult => execaResult.stdout.split('\n');

const getSinceRevision = exports.getSinceRevision = (directory, { branch }) => {
  const revision = runHg(directory, ['debugancestor', 'tip', branch || 'default']).stdout.trim();
  return runHg(directory, ['id', '-i', '-r', revision]).stdout.trim();
};

const getChangedFiles = exports.getChangedFiles = (directory, revision) => {
  return [...getLines(runHg(directory, ['status', '-n', '-a', '-m', '--rev', revision]))].filter(Boolean);
};

const getUnstagedChangedFiles = exports.getUnstagedChangedFiles = () => {
  return [];
};

const stageFile = exports.stageFile = (directory, file) => {
  runHg(directory, ['add', file]);
};