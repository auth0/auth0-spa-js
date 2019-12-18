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

const name = exports.name = 'git';

const detect = exports.detect = directory => {
  const gitDirectory = _findUp2.default.sync('.git', { cwd: directory });
  if (gitDirectory) {
    return (0, _path.dirname)(gitDirectory);
  }
};

const runGit = (directory, args) => _execa2.default.sync('git', args, {
  cwd: directory
});

const getLines = execaResult => execaResult.stdout.split('\n');

const getSinceRevision = exports.getSinceRevision = (directory, { staged, branch }) => {
  try {
    const revision = staged ? 'HEAD' : runGit(directory, ['merge-base', 'HEAD', branch || 'master']).stdout.trim();
    return runGit(directory, ['rev-parse', '--short', revision]).stdout.trim();
  } catch (error) {
    if (/HEAD/.test(error.message) || staged && /Needed a single revision/.test(error.message)) {
      return null;
    }
    throw error;
  }
};

const getChangedFiles = exports.getChangedFiles = (directory, revision, staged) => {
  return [...getLines(runGit(directory, ['diff', '--name-only', staged ? '--cached' : null, '--diff-filter=ACMRTUB', revision].filter(Boolean))), ...(staged ? [] : getLines(runGit(directory, ['ls-files', '--others', '--exclude-standard'])))].filter(Boolean);
};

const getUnstagedChangedFiles = exports.getUnstagedChangedFiles = directory => {
  return getChangedFiles(directory, null, false);
};

const stageFile = exports.stageFile = (directory, file) => {
  runGit(directory, ['add', file]);
};