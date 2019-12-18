# tslint-config-security
[![Build Status](https://travis-ci.org/webschik/tslint-config-security.svg?branch=master)](https://travis-ci.org/webschik/tslint-config-security)
[![npm](https://img.shields.io/npm/dm/tslint-config-security.svg)](https://www.npmjs.com/package/tslint-config-security)
[![npm](https://img.shields.io/npm/v/tslint-config-security.svg)](https://www.npmjs.com/package/tslint-config-security)
[![npm](https://img.shields.io/npm/l/tslint-config-security.svg)](https://www.npmjs.com/package/tslint-config-security)

> TSLint security rules

Inspired by [eslint-plugin-security](https://github.com/nodesecurity/eslint-plugin-security)

## How to use
* Install package:
```shell
npm i tslint-config-security --save-dev  --production
```

* Update your tslint.json:

```json
{
  "extends": ["tslint-config-security"]
}
```

By default `tslint-config-security` enables [all rules](#rules), but you may disable any of them (not recommended):

```json
{
  "extends": ["tslint-config-security"],
  "rules": {
    "tsr-detect-html-injection": false,
    "tsr-detect-unsafe-regexp": false
  }
}
```


## Rules
All rules start from the prefix `tsr-` (TSLint Security Rule) to prevent name collisions.

#### `tsr-detect-unsafe-regexp`

Locates potentially unsafe regular expressions, which may take a very long time to run, blocking the event loop.

Examples: [test/rules/tsr-detect-unsafe-regexp/default/test.ts.lint](test/rules/tsr-detect-unsafe-regexp/default/test.ts.lint)

More information:
* https://web.archive.org/web/20170131192028/https://blog.liftsecurity.io/2014/11/03/regular-expression-dos-and-node.js#regular-expression-dos-and-nodejs
* https://snyk.io/blog/redos-and-catastrophic-backtracking

#### `tsr-detect-non-literal-buffer`

Detects variable in [`new Buffer`](https://nodejs.org/api/buffer.html) argument

Examples: [test/rules/tsr-detect-non-literal-buffer/default/test.ts.lint](test/rules/tsr-detect-non-literal-buffer/default/test.ts.lint)

#### `tsr-detect-buffer-noassert`

Detects calls to [`Buffer`](https://nodejs.org/api/buffer.html) with `noAssert` flag set

From the Node.js API docs: "Setting `noAssert` to true skips validation of the `offset`. This allows the `offset` to be beyond the end of the `Buffer`."

Examples: [test/rules/tsr-detect-buffer-noassert/default/test.ts.lint](test/rules/tsr-detect-buffer-noassert/default/test.ts.lint)

#### `tsr-detect-child-process`

Detects instances of [`child_process`](https://nodejs.org/api/child_process.html) & non-literal [`exec()`](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)

More information: https://web.archive.org/web/20170129010544/https://blog.liftsecurity.io/2014/08/19/Avoid-Command-Injection-Node.js#avoiding-command-injection-in-nodejs

Examples: [test/rules/tsr-detect-child-process/default/test.ts.lint](test/rules/tsr-detect-child-process/default/test.ts.lint)

#### `tsr-disable-mustache-escape`

Detects `object.escapeMarkup = false`, which can be used with some template engines to disable escaping of HTML entities. This can lead to Cross-Site Scripting (XSS) vulnerabilities.

More information: https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)

Examples: [test/rules/tsr-disable-mustache-escape/default/test.ts.lint](test/rules/tsr-disable-mustache-escape/default/test.ts.lint)

#### `tsr-detect-eval-with-expression`

Detects `eval(variable)` which can allow an attacker to run arbitrary code inside your process.

More information: http://security.stackexchange.com/questions/94017/what-are-the-security-issues-with-eval-in-javascript

Examples: [test/rules/tsr-detect-eval-with-expression/default/test.ts.lint](test/rules/tsr-detect-eval-with-expression/default/test.ts.lint)

#### `tsr-detect-no-csrf-before-method-override`

Detects Express `csrf` middleware setup before `method-override` middleware. This can allow `GET` requests (which are not checked by `csrf`) to turn into `POST` requests later.

More information: http://blog.nibblesec.org/2014/05/nodejs-connect-csrf-bypass-abusing.html

Examples: [test/rules/tsr-detect-no-csrf-before-method-override/default/test.ts.lint](test/rules/tsr-detect-no-csrf-before-method-override/default/test.ts.lint)

#### `tsr-detect-non-literal-fs-filename`

Detects variable in filename argument of `fs` calls, which might allow an attacker to access anything on your system.

More information: https://www.owasp.org/index.php/Path_Traversal

**Known limitations**

Due to the known issues in the typed TSLint rules:

* https://github.com/Microsoft/vscode-tslint/issues/70
* https://github.com/Microsoft/vscode-tslint/blob/master/tslint/README.md#how-can-i-use-tslint-rules-that-require-type-information
* https://github.com/Microsoft/vscode-tslint/issues/70

 `tslint-config-security` module will analyze methods only on **fs** variable or on **'fs' module**. E.g.:

```js
const fs = require('fs');

fs.open(somePath); // triggers the error
require('fs').symlink(path1, path2); // triggers the error
require("fs").symlink(path1, path2); // triggers the error

const myFs = require('fs');

myFs.open(somePath); // no error
```

More examples: [test/rules/tsr-detect-non-literal-fs-filename/default/test.ts.lint](test/rules/tsr-detect-non-literal-fs-filename/default/test.ts.lint)

#### `tsr-detect-non-literal-regexp`

Detects `RegExp(variable)`, which might allow an attacker to DOS your server with a long-running regular expression.

More information: 

* https://web.archive.org/web/20170131192028/https://blog.liftsecurity.io/2014/11/03/regular-expression-dos-and-node.js#regular-expression-dos-and-nodejs

Examples: [test/rules/tsr-detect-non-literal-regexp/default/test.ts.lint](test/rules/tsr-detect-non-literal-regexp/default/test.ts.lint)

#### `tsr-detect-non-literal-require`

Detects `require(variable)`, which might allow an attacker to load and run arbitrary code, or access arbitrary files on disk.

More information:
* http://www.bennadel.com/blog/2169-where-does-node-js-and-require-look-for-modules.htm
* https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md

Examples: [test/rules/tsr-detect-non-literal-require/default/test.ts.lint](test/rules/tsr-detect-non-literal-require/default/test.ts.lint)

#### `tsr-detect-possible-timing-attacks`

Detects insecure comparisons (`==`, `!=`, `!==` and `===`), which check input sequentially.

More information: https://snyk.io/blog/node-js-timing-attack-ccc-ctf/

Examples: [test/rules/tsr-detect-possible-timing-attacks/default/test.ts.lint](test/rules/tsr-detect-possible-timing-attacks/default/test.ts.lint)

#### `tsr-detect-pseudo-random-bytes`

Detects if `pseudoRandomBytes()` is in use, which might not give you the randomness you need and expect.

More information: http://stackoverflow.com/questions/18130254/randombytes-vs-pseudorandombytes

Examples: [test/rules/tsr-detect-pseudo-random-bytes/default/test.ts.lint](test/rules/tsr-detect-pseudo-random-bytes/default/test.ts.lint)

#### `tsr-detect-html-injection`

Detects HTML injections:
- `document.write(variable)`
- `document.writeln(variable)`
- `Element.innerHTML = variable;`
- `Element.outerHTML = variable;`
- `el.insertAdjacentHTML(variable);`

More examples: [test/rules/tsr-detect-html-injection/default/test.ts.lint](test/rules/tsr-detect-html-injection/default/test.ts.lint)

#### `tsr-detect-sql-literal-injection`

Detects possible SQL injections in string literals:
```js
// invalid
const userId = 1;
const query1 = `SELECT * FROM users WHERE id = ${userId}`;
const query2 = `SELECT * FROM users WHERE id = ` + userId;
const query3 = 'SELECT * FROM users WHERE id =' + userId;

const columns = 'id, name';
Users.query(`SELECT ${columns} FROM users`);

// valid
const userId = 1;
const query = sql`SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// See https://github.com/mysqljs/mysql
db.query('SELECT * FROM `books` WHERE `author` = ?', ['David'], function (error, results, fields) {
  //...
});
```

More examples: [test/rules/tsr-detect-sql-literal-injection/default/test.ts.lint](test/rules/tsr-detect-sql-literal-injection/default/test.ts.lint)

#### `tsr-detect-unsafe-cross-origin-communication`

Detects when all windows & frames on your page (including ones that were injected by 3rd-party scripts)
may receive your data.

> Always provide a specific targetOrigin, not *, if you know where the other window's document should be located. Failing to provide a specific target discloses the data you send to any interested malicious site.
> https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage

```js
const myWindow = document.getElementById('myIFrame').contentWindow;

myWindow.postMessage(message, "*"); // Noncompliant
```

#### `tsr-detect-unsafe-properties-access`

Detects a potential unsafe access to the object properties

```js
/* 

It equals to `new Function(prop3)`

const a = {};

a["constructor"]["constructor"]("alert(1)")()
 */
 
// unsafe
obj[prop1][prop2](prop3)

// unsafe
obj[prop1][prop2](prop3)()  
 
```

More information:
* [Web Puzzlers - Securing Dynamic Systems](https://youtu.be/SkNWAjDRLDY)
* [Defensive JavaScript](https://www.javascriptjanuary.com/blog/defensive-javascript)

Solutions:
* use [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
* use `.hasOwnProperty` check
* use `Content-Security-Policy` on your page
