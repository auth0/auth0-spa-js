

# OPTS

[![NPM version](https://img.shields.io/npm/v/opts.svg)](https://www.npmjs.com/package/opts)
[![npm](https://img.shields.io/npm/l/express.svg)]()
[![npm](https://img.shields.io/npm/dm/opts.svg)]()
[![npm](https://img.shields.io/npm/dt/opts.svg)]()

## Installation
Simply download and include [src/opts.js](https://raw.githubusercontent.com/khtdr/opts/master/src/opts.js) to your Node.js project and import it with the require function. See included files for an example.

If you use NPM,  you can install it from the registry under the name `opts`
```bash
npm install opts
```

[![NPM](https://nodei.co/npm/opts.png)](https://npmjs.org/package/opts)

## Usage and Docs
```javascript
let opts = require('opts');
opts.parse(options, arguments, help);
```
### opts.parse(options, arguments, help)

`options` is an array of option objects. Each option in the array can have the following fields. None are required, but you should at least provide a short or long name.

#### Options
```javascript
let options = [
  { short       : 'l',
    long        : 'list',
    description : 'Show a list',
    value       : false, // default false
    required    : true, // default false
    callback    : function (value) { ... },
  }, // ... followed by more options
];
```

##### Options vs Arguments

Options are flag arguments. Arguments are everything else. For example, in
```bash
ls -l file
```
the option(s) are `-l` and the argument(s) are `file`. The arguments can be
after, before, or among the options.

#### Arguments

Arguments require less configuration.  This is an optional argument to
`opts.parse`.

```javascript
let arguments = 
  { name     : 'script',
    required : true, // default false
    callback : function (value) { ... },
  };
```

#### Help Generator
Finally, you can add an automatically generated help message by passing
a last parameter of `true`. This is also an optional argument to `opts.parse`.

```javascript
opts.parse(options, true);
// or if you want more control, you can do:
/*
  options.push({
    long        : 'help',
    description : 'Show this help message',
    callback    : require('opts').help,
  }
  opts.parse(options);
*/
```


## Examples

#### Example 1 -- Simple "getting started" example
```javascript
/**
 * Simple example with one optional parameter, including the help option.
 *
 * Examples:
 *   $ node example1.js
 *   
 *   Example 1
 *   $ node example1.js -v
 *   > v1.0
 *
 *   $ node example1.js --version
 *   > v1.0
 *
 *   $ node example1.js -version
 *   > Unknown option: -version
 *
 *   $ node example1.js --help
 *   > Show version and exit
 *         -v, --version
 *     Show this help message
 *         --help
 */

var opts = require('opts');

var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log('v1.0'); process.exit(1); }
  }
];

opts.parse(options, true);
console.log('Example 1');
process.exit(0);
```


#### Example 2 -- Showing more features
```javascript
/**
 * More complex example.
 *
 * Run:
 *   node example2.js --help
 * and play with the options to see the behavior.
 *
 * This example shows different ways of using the library. It is deliberately 
 * inconsistent. Choose the style that suits you best.
 */

var opts = require('opts')
  , host = 'localhost'; // default host value

var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log('v1.0'); process.exit(1); }
  },
  { short       : 'l'
  , long        : 'list'
  , description : 'List all files'
  },
  { short       : 'f'
  , long        : 'file'
  , description : 'Load a file'
  , value       : true
  , required    : true
  },
  { short       : 'd'
  , long        : 'debug'
  , description : 'Set a debug level'
  , value       : true
  },
  { short       : 'h'
  , long        : 'host'
  , description : 'The hostname to connect to'
  , value       : true
  , callback    : function (value) { host = value; } // override host value
  },
  { short       : 'p'
  , long        : 'port'
  , description : 'The port to connect to'
  , value       : true
  },
];

opts.parse(options, true);

var port  = opts.get('port') || 8000 // default port value
  , debug = opts.get('d') || 'info'  // default debug value
  , file  = opts.get('f')
  , list  = opts.get('list');

var arg1 = opts.args()[0]
  , arg2 = opts.args()[1];


if (list) console.log('List arg was set');
if (file) console.log('File arg was set: ' + file);
console.log('Debug level is: ' + debug);
console.log('Host is: ' + host);
console.log('Port is: ' + port);

if (arg1) console.log('Extra arg 1: ' + arg1);
if (arg2) console.log('Extra arg 2: ' + arg2);

process.exit(0);
```

#### Example 3 -- Showing conflict detection

```javascript
/**
 * Simple example that is broken by design (conflicting options)
 *
 * Examples:
 *   $ node example3.js
 *   > Conflicting flags: -v
 */

var opts = require('opts');

var options = [
  { short       : 'v'
  , description : 'Show version and exit'
  },
  { short       : 'v'
  , description : 'Be verbose'
  },
];

opts.parse(options);
console.log('Example 3');
process.exit(0);
```

#### Example 4 -- Shows how to use named arguments and using from within a library

```javascript
/**
 * Advanced example using namespaces for a library and named arguments
 *
 * Run:
 *   node example4.js --help
 * and play with the options to see the behavior.
 */

var opts = require('opts')
  , host = 'localhost'; // default host value

// Example of using some library in the same app
var libOpts = [
  { short       : 'l'
  , long        : 'list'
  , description : 'Show the library list'
  , callback    : function () { console.log('mylib list!'); },
  },
];
opts.add(libOpts, 'mylib');

var options = [
  { short       : 'l' // deliberately conflicting with 'mylib' option
  , long        : 'list'
  , description : 'List all files'
  },
  { short       : 'd'
  , long        : 'debug'
  , description : 'Set a debug level'
  , value       : true
  },
];

var arguments = [ { name : 'script' , required : true }
                , { name : 'timeout' }
                ];

opts.parse(options, arguments, true);

var debug = opts.get('d') || 'info'  // default debug value
  , list  = opts.get('list');

var script  = opts.arg('script')
  , timeout = opts.arg('timeout') || 30;


if (list) console.log('List arg was set');
console.log('Debug level is: ' + debug);
console.log('Script is: ' + script);
console.log('Timeout is: ' + timeout);

process.exit(0);
```

