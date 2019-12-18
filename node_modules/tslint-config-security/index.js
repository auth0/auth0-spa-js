module.exports = {
    rulesDirectory: ['./dist/rules'],
    rules: {
        'tsr-detect-buffer-noassert': [true],
        'tsr-detect-child-process': [true],
        'tsr-detect-eval-with-expression': [true],
        'tsr-detect-no-csrf-before-method-override': [true],
        'tsr-detect-non-literal-buffer': [true],
        'tsr-detect-non-literal-fs-filename': [true],
        'tsr-detect-non-literal-regexp': [true],
        'tsr-detect-non-literal-require': [true],
        'tsr-detect-possible-timing-attacks': [true],
        'tsr-detect-pseudo-random-bytes': [true],
        'tsr-detect-unsafe-regexp': [true],
        'tsr-disable-mustache-escape': [true],
        'tsr-detect-html-injection': [true],
        'tsr-detect-sql-literal-injection': [true],
        'tsr-detect-unsafe-cross-origin-communication': [true],
        'tsr-detect-unsafe-properties-access': [true]
    }
};
