'use strict';

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

require('fast-text-encoding');
var Lock = _interopDefault(require('browser-tabs-lock'));
var fetch = _interopDefault(require('unfetch'));
var Cookies = require('es-cookie');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
  extendStatics =
    Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array &&
      function(d, b) {
        d.__proto__ = b;
      }) ||
    function(d, b) {
      for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    };
  return extendStatics(d, b);
};

function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype =
    b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
}

var __assign = function() {
  __assign =
    Object.assign ||
    function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
  return __assign.apply(this, arguments);
};

function __rest(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === 'function')
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (
        e.indexOf(p[i]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(s, p[i])
      )
        t[p[i]] = s[p[i]];
    }
  return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator['throw'](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done
        ? resolve(result.value)
        : new P(function(resolve) {
            resolve(result.value);
          }).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return (
    (g = { next: verb(0), throw: verb(1), return: verb(2) }),
    typeof Symbol === 'function' &&
      (g[Symbol.iterator] = function() {
        return this;
      }),
    g
  );
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError('Generator is already executing.');
    while (_)
      try {
        if (
          ((f = 1),
          y &&
            (t =
              op[0] & 2
                ? y['return']
                : op[0]
                ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                : y.next) &&
            !(t = t.call(y, op[1])).done)
        )
          return t;
        if (((y = 0), t)) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (
              !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
              (op[0] === 6 || op[0] === 2)
            ) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var commonjsGlobal =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : {};

function createCommonjsModule(fn, module) {
  return (module = { exports: {} }), fn(module, module.exports), module.exports;
}

var O = 'object';
var check = function(it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1 =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == O && globalThis) ||
  check(typeof window == O && window) ||
  check(typeof self == O && self) ||
  check(typeof commonjsGlobal == O && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails = function(exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors = !fails(function() {
  return (
    Object.defineProperty({}, 'a', {
      get: function() {
        return 7;
      }
    }).a != 7
  );
});

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG =
  getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f = NASHORN_BUG
  ? function propertyIsEnumerable(V) {
      var descriptor = getOwnPropertyDescriptor(this, V);
      return !!descriptor && descriptor.enumerable;
    }
  : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
  f: f
};

var createPropertyDescriptor = function(bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString = {}.toString;

var classofRaw = function(it) {
  return toString.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function() {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
})
  ? function(it) {
      return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
    }
  : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function(it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings

var toIndexedObject = function(it) {
  return indexedObject(requireObjectCoercible(it));
};

var isObject = function(it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function(input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (
    PREFERRED_STRING &&
    typeof (fn = input.toString) == 'function' &&
    !isObject((val = fn.call(input)))
  )
    return val;
  if (
    typeof (fn = input.valueOf) == 'function' &&
    !isObject((val = fn.call(input)))
  )
    return val;
  if (
    !PREFERRED_STRING &&
    typeof (fn = input.toString) == 'function' &&
    !isObject((val = fn.call(input)))
  )
    return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty = {}.hasOwnProperty;

var has = function(it, key) {
  return hasOwnProperty.call(it, key);
};

var document = global_1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

var documentCreateElement = function(it) {
  return EXISTS ? document.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine =
  !descriptors &&
  !fails(function() {
    return (
      Object.defineProperty(documentCreateElement('div'), 'a', {
        get: function() {
          return 7;
        }
      }).a != 7
    );
  });

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$1 = descriptors
  ? nativeGetOwnPropertyDescriptor
  : function getOwnPropertyDescriptor(O, P) {
      O = toIndexedObject(O);
      P = toPrimitive(P, true);
      if (ie8DomDefine)
        try {
          return nativeGetOwnPropertyDescriptor(O, P);
        } catch (error) {
          /* empty */
        }
      if (has(O, P))
        return createPropertyDescriptor(
          !objectPropertyIsEnumerable.f.call(O, P),
          O[P]
        );
    };

var objectGetOwnPropertyDescriptor = {
  f: f$1
};

var anObject = function(it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  }
  return it;
};

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f$2 = descriptors
  ? nativeDefineProperty
  : function defineProperty(O, P, Attributes) {
      anObject(O);
      P = toPrimitive(P, true);
      anObject(Attributes);
      if (ie8DomDefine)
        try {
          return nativeDefineProperty(O, P, Attributes);
        } catch (error) {
          /* empty */
        }
      if ('get' in Attributes || 'set' in Attributes)
        throw TypeError('Accessors not supported');
      if ('value' in Attributes) O[P] = Attributes.value;
      return O;
    };

var objectDefineProperty = {
  f: f$2
};

var hide = descriptors
  ? function(object, key, value) {
      return objectDefineProperty.f(
        object,
        key,
        createPropertyDescriptor(1, value)
      );
    }
  : function(object, key, value) {
      object[key] = value;
      return object;
    };

var setGlobal = function(key, value) {
  try {
    hide(global_1, key, value);
  } catch (error) {
    global_1[key] = value;
  }
  return value;
};

var shared = createCommonjsModule(function(module) {
  var SHARED = '__core-js_shared__';
  var store = global_1[SHARED] || setGlobal(SHARED, {});

  (module.exports = function(key, value) {
    return store[key] || (store[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.2.1',
    mode: 'global',
    copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
  });
});

var functionToString = shared('native-function-to-string', Function.toString);

var WeakMap = global_1.WeakMap;

var nativeWeakMap =
  typeof WeakMap === 'function' &&
  /native code/.test(functionToString.call(WeakMap));

var id = 0;
var postfix = Math.random();

var uid = function(key) {
  return (
    'Symbol(' +
    String(key === undefined ? '' : key) +
    ')_' +
    (++id + postfix).toString(36)
  );
};

var keys = shared('keys');

var sharedKey = function(key) {
  return keys[key] || (keys[key] = uid(key));
};

var hiddenKeys = {};

var WeakMap$1 = global_1.WeakMap;
var set, get, has$1;

var enforce = function(it) {
  return has$1(it) ? get(it) : set(it, {});
};

var getterFor = function(TYPE) {
  return function(it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    }
    return state;
  };
};

if (nativeWeakMap) {
  var store = new WeakMap$1();
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;
  set = function(it, metadata) {
    wmset.call(store, it, metadata);
    return metadata;
  };
  get = function(it) {
    return wmget.call(store, it) || {};
  };
  has$1 = function(it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function(it, metadata) {
    hide(it, STATE, metadata);
    return metadata;
  };
  get = function(it) {
    return has(it, STATE) ? it[STATE] : {};
  };
  has$1 = function(it) {
    return has(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has$1,
  enforce: enforce,
  getterFor: getterFor
};

var redefine = createCommonjsModule(function(module) {
  var getInternalState = internalState.get;
  var enforceInternalState = internalState.enforce;
  var TEMPLATE = String(functionToString).split('toString');

  shared('inspectSource', function(it) {
    return functionToString.call(it);
  });

  (module.exports = function(O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    if (typeof value == 'function') {
      if (typeof key == 'string' && !has(value, 'name'))
        hide(value, 'name', key);
      enforceInternalState(value).source = TEMPLATE.join(
        typeof key == 'string' ? key : ''
      );
    }
    if (O === global_1) {
      if (simple) O[key] = value;
      else setGlobal(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else hide(O, key, value);
    // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return (
      (typeof this == 'function' && getInternalState(this).source) ||
      functionToString.call(this)
    );
  });
});

var path = global_1;

var aFunction = function(variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function(namespace, method) {
  return arguments.length < 2
    ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : (path[namespace] && path[namespace][method]) ||
        (global_1[namespace] && global_1[namespace][method]);
};

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger = function(argument) {
  return isNaN((argument = +argument))
    ? 0
    : (argument > 0 ? floor : ceil)(argument);
};

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength = function(argument) {
  return argument > 0 ? min(toInteger(argument), 0x1fffffffffffff) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
var toAbsoluteIndex = function(index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function(IS_INCLUDES) {
  return function($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el)
      while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
        // Array#indexOf ignores holes, Array#includes - not
      }
    else
      for (; length > index; index++) {
        if ((IS_INCLUDES || index in O) && O[index] === el)
          return IS_INCLUDES || index || 0;
      }
    return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

var indexOf = arrayIncludes.indexOf;

var objectKeysInternal = function(object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i)
    if (has(O, (key = names[i++]))) {
      ~indexOf(result, key) || result.push(key);
    }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3 =
  Object.getOwnPropertyNames ||
  function getOwnPropertyNames(O) {
    return objectKeysInternal(O, hiddenKeys$1);
  };

var objectGetOwnPropertyNames = {
  f: f$3
};

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
  f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys =
  getBuiltIn('Reflect', 'ownKeys') ||
  function ownKeys(it) {
    var keys = objectGetOwnPropertyNames.f(anObject(it));
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    return getOwnPropertySymbols
      ? keys.concat(getOwnPropertySymbols(it))
      : keys;
  };

var copyConstructorProperties = function(target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key))
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function(feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL
    ? true
    : value == NATIVE
    ? false
    : typeof detection == 'function'
    ? fails(detection)
    : !!detection;
};

var normalize = (isForced.normalize = function(string) {
  return String(string)
    .replace(replacement, '.')
    .toLowerCase();
});

var data = (isForced.data = {});
var NATIVE = (isForced.NATIVE = 'N');
var POLYFILL = (isForced.POLYFILL = 'P');

var isForced_1 = isForced;

var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function(options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1;
  } else if (STATIC) {
    target = global_1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global_1[TARGET] || {}).prototype;
  }
  if (target)
    for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor$1(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced_1(
        GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key,
        options.forced
      );
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        hide(sourceProperty, 'sham', true);
      }
      // extend global
      redefine(target, key, sourceProperty, options);
    }
};

var nativeSymbol =
  !!Object.getOwnPropertySymbols &&
  !fails(function() {
    // Chrome 38 Symbol has incorrect toString conversion
    // eslint-disable-next-line no-undef
    return !String(Symbol());
  });

var Symbol$1 = global_1.Symbol;
var store$1 = shared('wks');

var wellKnownSymbol = function(name) {
  return (
    store$1[name] ||
    (store$1[name] =
      (nativeSymbol && Symbol$1[name]) ||
      (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name))
  );
};

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp
var isRegexp = function(it) {
  var isRegExp;
  return (
    isObject(it) &&
    ((isRegExp = it[MATCH]) !== undefined
      ? !!isRegExp
      : classofRaw(it) == 'RegExp')
  );
};

var notARegexp = function(it) {
  if (isRegexp(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  }
  return it;
};

var MATCH$1 = wellKnownSymbol('match');

var correctIsRegexpLogic = function(METHOD_NAME) {
  var regexp = /./;
  try {
    '/./'[METHOD_NAME](regexp);
  } catch (e) {
    try {
      regexp[MATCH$1] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (f) {
      /* empty */
    }
  }
  return false;
};

var nativeStartsWith = ''.startsWith;
var min$2 = Math.min;

// `String.prototype.startsWith` method
// https://tc39.github.io/ecma262/#sec-string.prototype.startswith
_export(
  {
    target: 'String',
    proto: true,
    forced: !correctIsRegexpLogic('startsWith')
  },
  {
    startsWith: function startsWith(searchString /* , position = 0 */) {
      var that = String(requireObjectCoercible(this));
      notARegexp(searchString);
      var index = toLength(
        min$2(arguments.length > 1 ? arguments[1] : undefined, that.length)
      );
      var search = String(searchString);
      return nativeStartsWith
        ? nativeStartsWith.call(that, search, index)
        : that.slice(index, index + search.length) === search;
    }
  }
);

var aFunction$1 = function(it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  }
  return it;
};

// optional / simple context binding
var bindContext = function(fn, that, length) {
  aFunction$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0:
      return function() {
        return fn.call(that);
      };
    case 1:
      return function(a) {
        return fn.call(that, a);
      };
    case 2:
      return function(a, b) {
        return fn.call(that, a, b);
      };
    case 3:
      return function(a, b, c) {
        return fn.call(that, a, b, c);
      };
  }
  return function(/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var call = Function.call;

var entryUnbind = function(CONSTRUCTOR, METHOD, length) {
  return bindContext(call, global_1[CONSTRUCTOR].prototype[METHOD], length);
};

var startsWith = entryUnbind('String', 'startsWith');

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$1 = function(CONVERT_TO_STRING) {
  return function($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size)
      return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xd800 ||
      first > 0xdbff ||
      position + 1 === size ||
      (second = S.charCodeAt(position + 1)) < 0xdc00 ||
      second > 0xdfff
      ? CONVERT_TO_STRING
        ? S.charAt(position)
        : first
      : CONVERT_TO_STRING
      ? S.slice(position, position + 2)
      : ((first - 0xd800) << 10) + (second - 0xdc00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$1(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$1(true)
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function(argument) {
  return Object(requireObjectCoercible(argument));
};

var correctPrototypeGetter = !fails(function() {
  function F() {
    /* empty */
  }
  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf = correctPrototypeGetter
  ? Object.getPrototypeOf
  : function(O) {
      O = toObject(O);
      if (has(O, IE_PROTO)) return O[IE_PROTO];
      if (typeof O.constructor == 'function' && O instanceof O.constructor) {
        return O.constructor.prototype;
      }
      return O instanceof Object ? ObjectPrototype : null;
    };

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function() {
  return this;
};

// `%IteratorPrototype%` object
// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(
      objectGetPrototypeOf(arrayIterator)
    );
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype)
      IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

if (IteratorPrototype == undefined) IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
if (!has(IteratorPrototype, ITERATOR))
  hide(IteratorPrototype, ITERATOR, returnThis);

var iteratorsCore = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys =
  Object.keys ||
  function keys(O) {
    return objectKeysInternal(O, enumBugKeys);
  };

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties = descriptors
  ? Object.defineProperties
  : function defineProperties(O, Properties) {
      anObject(O);
      var keys = objectKeys(Properties);
      var length = keys.length;
      var index = 0;
      var key;
      while (length > index)
        objectDefineProperty.f(O, (key = keys[index++]), Properties[key]);
      return O;
    };

var html = getBuiltIn('document', 'documentElement');

var IE_PROTO$1 = sharedKey('IE_PROTO');

var PROTOTYPE = 'prototype';
var Empty = function() {
  /* empty */
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function() {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var length = enumBugKeys.length;
  var lt = '<';
  var script = 'script';
  var gt = '>';
  var js = 'java' + script + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = String(js);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(
    lt + script + gt + 'document.F=Object' + lt + '/' + script + gt
  );
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
  return createDict();
};

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate =
  Object.create ||
  function create(O, Properties) {
    var result;
    if (O !== null) {
      Empty[PROTOTYPE] = anObject(O);
      result = new Empty();
      Empty[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO$1] = O;
    } else result = createDict();
    return Properties === undefined
      ? result
      : objectDefineProperties(result, Properties);
  };

hiddenKeys[IE_PROTO$1] = true;

var defineProperty = objectDefineProperty.f;

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

var setToStringTag = function(it, TAG, STATIC) {
  if (it && !has((it = STATIC ? it : it.prototype), TO_STRING_TAG)) {
    defineProperty(it, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

var iterators = {};

var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;

var returnThis$1 = function() {
  return this;
};

var createIteratorConstructor = function(IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, {
    next: createPropertyDescriptor(1, next)
  });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
  iterators[TO_STRING_TAG] = returnThis$1;
  return IteratorConstructor;
};

var aPossiblePrototype = function(it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  }
  return it;
};

// `Object.setPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var objectSetPrototypeOf =
  Object.setPrototypeOf ||
  ('__proto__' in {}
    ? (function() {
        var CORRECT_SETTER = false;
        var test = {};
        var setter;
        try {
          setter = Object.getOwnPropertyDescriptor(
            Object.prototype,
            '__proto__'
          ).set;
          setter.call(test, []);
          CORRECT_SETTER = test instanceof Array;
        } catch (error) {
          /* empty */
        }
        return function setPrototypeOf(O, proto) {
          anObject(O);
          aPossiblePrototype(proto);
          if (CORRECT_SETTER) setter.call(O, proto);
          else O.__proto__ = proto;
          return O;
        };
      })()
    : undefined);

var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR$1 = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis$2 = function() {
  return this;
};

var defineIterator = function(
  Iterable,
  NAME,
  IteratorConstructor,
  next,
  DEFAULT,
  IS_SET,
  FORCED
) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function(KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype)
      return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS:
        return function keys() {
          return new IteratorConstructor(this, KIND);
        };
      case VALUES:
        return function values() {
          return new IteratorConstructor(this, KIND);
        };
      case ENTRIES:
        return function entries() {
          return new IteratorConstructor(this, KIND);
        };
    }
    return function() {
      return new IteratorConstructor(this);
    };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator =
    IterablePrototype[ITERATOR$1] ||
    IterablePrototype['@@iterator'] ||
    (DEFAULT && IterablePrototype[DEFAULT]);
  var defaultIterator =
    (!BUGGY_SAFARI_ITERATORS$1 && nativeIterator) ||
    getIterationMethod(DEFAULT);
  var anyNativeIterator =
    NAME == 'Array'
      ? IterablePrototype.entries || nativeIterator
      : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = objectGetPrototypeOf(
      anyNativeIterator.call(new Iterable())
    );
    if (
      IteratorPrototype$2 !== Object.prototype &&
      CurrentIteratorPrototype.next
    ) {
      if (
        objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2
      ) {
        if (objectSetPrototypeOf) {
          objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
        } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
          hide(CurrentIteratorPrototype, ITERATOR$1, returnThis$2);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
    }
  }

  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() {
      return nativeIterator.call(this);
    };
  }

  // define iterator
  if (IterablePrototype[ITERATOR$1] !== defaultIterator) {
    hide(IterablePrototype, ITERATOR$1, defaultIterator);
  }
  iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED)
      for (KEY in methods) {
        if (
          BUGGY_SAFARI_ITERATORS$1 ||
          INCORRECT_VALUES_NAME ||
          !(KEY in IterablePrototype)
        ) {
          redefine(IterablePrototype, KEY, methods[KEY]);
        }
      }
    else
      _export(
        {
          target: NAME,
          proto: true,
          forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME
        },
        methods
      );
  }

  return methods;
};

var charAt = stringMultibyte.charAt;

var STRING_ITERATOR = 'String Iterator';
var setInternalState = internalState.set;
var getInternalState = internalState.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
defineIterator(
  String,
  'String',
  function(iterated) {
    setInternalState(this, {
      type: STRING_ITERATOR,
      string: String(iterated),
      index: 0
    });
    // `%StringIteratorPrototype%.next` method
    // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
  },
  function next() {
    var state = getInternalState(this);
    var string = state.string;
    var index = state.index;
    var point;
    if (index >= string.length) return { value: undefined, done: true };
    point = charAt(string, index);
    state.index += point.length;
    return { value: point, done: false };
  }
);

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing = function(iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
    // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
    throw error;
  }
};

var ITERATOR$2 = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function(it) {
  return (
    it !== undefined &&
    (iterators.Array === it || ArrayPrototype[ITERATOR$2] === it)
  );
};

var createProperty = function(object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object)
    objectDefineProperty.f(
      object,
      propertyKey,
      createPropertyDescriptor(0, value)
    );
  else object[propertyKey] = value;
};

var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS =
  classofRaw(
    (function() {
      return arguments;
    })()
  ) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key) {
  try {
    return it[key];
  } catch (error) {
    /* empty */
  }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = function(it) {
  var O, tag, result;
  return it === undefined
    ? 'Undefined'
    : it === null
    ? 'Null'
    : // @@toStringTag case
    typeof (tag = tryGet((O = Object(it)), TO_STRING_TAG$1)) == 'string'
    ? tag
    : // builtinTag case
    CORRECT_ARGUMENTS
    ? classofRaw(O)
    : // ES3 arguments fallback
    (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function'
    ? 'Arguments'
    : result;
};

var ITERATOR$3 = wellKnownSymbol('iterator');

var getIteratorMethod = function(it) {
  if (it != undefined)
    return it[ITERATOR$3] || it['@@iterator'] || iterators[classof(it)];
};

// `Array.from` method implementation
// https://tc39.github.io/ecma262/#sec-array.from
var arrayFrom = function from(
  arrayLike /* , mapfn = undefined, thisArg = undefined */
) {
  var O = toObject(arrayLike);
  var C = typeof this == 'function' ? this : Array;
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  var index = 0;
  var iteratorMethod = getIteratorMethod(O);
  var length, result, step, iterator;
  if (mapping)
    mapfn = bindContext(
      mapfn,
      argumentsLength > 2 ? arguments[2] : undefined,
      2
    );
  // if the target is not iterable or it's an array with the default iterator - use a simple case
  if (
    iteratorMethod != undefined &&
    !(C == Array && isArrayIteratorMethod(iteratorMethod))
  ) {
    iterator = iteratorMethod.call(O);
    result = new C();
    for (; !(step = iterator.next()).done; index++) {
      createProperty(
        result,
        index,
        mapping
          ? callWithSafeIterationClosing(
              iterator,
              mapfn,
              [step.value, index],
              true
            )
          : step.value
      );
    }
  } else {
    length = toLength(O.length);
    result = new C(length);
    for (; length > index; index++) {
      createProperty(
        result,
        index,
        mapping ? mapfn(O[index], index) : O[index]
      );
    }
  }
  result.length = index;
  return result;
};

var ITERATOR$4 = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function() {
      return { done: !!called++ };
    },
    return: function() {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR$4] = function() {
    return this;
  };
  // eslint-disable-next-line no-throw-literal
  Array.from(iteratorWithReturn, function() {
    throw 2;
  });
} catch (error) {
  /* empty */
}

var checkCorrectnessOfIteration = function(exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR$4] = function() {
      return {
        next: function() {
          return { done: (ITERATION_SUPPORT = true) };
        }
      };
    };
    exec(object);
  } catch (error) {
    /* empty */
  }
  return ITERATION_SUPPORT;
};

var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function(iterable) {
  Array.from(iterable);
});

// `Array.from` method
// https://tc39.github.io/ecma262/#sec-array.from
_export(
  { target: 'Array', stat: true, forced: INCORRECT_ITERATION },
  {
    from: arrayFrom
  }
);

var from_1 = path.Array.from;

var defineProperty$1 = objectDefineProperty.f;

var DataView = global_1.DataView;
var DataViewPrototype = DataView && DataView.prototype;
var Int8Array$1 = global_1.Int8Array;
var Int8ArrayPrototype = Int8Array$1 && Int8Array$1.prototype;
var Uint8ClampedArray = global_1.Uint8ClampedArray;
var Uint8ClampedArrayPrototype =
  Uint8ClampedArray && Uint8ClampedArray.prototype;
var TypedArray = Int8Array$1 && objectGetPrototypeOf(Int8Array$1);
var TypedArrayPrototype =
  Int8ArrayPrototype && objectGetPrototypeOf(Int8ArrayPrototype);
var ObjectPrototype$1 = Object.prototype;
var isPrototypeOf = ObjectPrototype$1.isPrototypeOf;

var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
var TYPED_ARRAY_TAG = uid('TYPED_ARRAY_TAG');
var NATIVE_ARRAY_BUFFER = !!(global_1.ArrayBuffer && DataView);
// Fixing native typed arrays in Opera Presto crashes the browser, see #595
var NATIVE_ARRAY_BUFFER_VIEWS =
  NATIVE_ARRAY_BUFFER &&
  !!objectSetPrototypeOf &&
  classof(global_1.opera) !== 'Opera';
var TYPED_ARRAY_TAG_REQIRED = false;
var NAME;

var TypedArrayConstructorsList = {
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8
};

var isView = function isView(it) {
  var klass = classof(it);
  return klass === 'DataView' || has(TypedArrayConstructorsList, klass);
};

var isTypedArray = function(it) {
  return isObject(it) && has(TypedArrayConstructorsList, classof(it));
};

var aTypedArray = function(it) {
  if (isTypedArray(it)) return it;
  throw TypeError('Target is not a typed array');
};

var aTypedArrayConstructor = function(C) {
  if (objectSetPrototypeOf) {
    if (isPrototypeOf.call(TypedArray, C)) return C;
  } else
    for (var ARRAY in TypedArrayConstructorsList)
      if (has(TypedArrayConstructorsList, NAME)) {
        var TypedArrayConstructor = global_1[ARRAY];
        if (
          TypedArrayConstructor &&
          (C === TypedArrayConstructor ||
            isPrototypeOf.call(TypedArrayConstructor, C))
        ) {
          return C;
        }
      }
  throw TypeError('Target is not a typed array constructor');
};

var exportProto = function(KEY, property, forced) {
  if (!descriptors) return;
  if (forced)
    for (var ARRAY in TypedArrayConstructorsList) {
      var TypedArrayConstructor = global_1[ARRAY];
      if (TypedArrayConstructor && has(TypedArrayConstructor.prototype, KEY)) {
        delete TypedArrayConstructor.prototype[KEY];
      }
    }
  if (!TypedArrayPrototype[KEY] || forced) {
    redefine(
      TypedArrayPrototype,
      KEY,
      forced
        ? property
        : (NATIVE_ARRAY_BUFFER_VIEWS && Int8ArrayPrototype[KEY]) || property
    );
  }
};

var exportStatic = function(KEY, property, forced) {
  var ARRAY, TypedArrayConstructor;
  if (!descriptors) return;
  if (objectSetPrototypeOf) {
    if (forced)
      for (ARRAY in TypedArrayConstructorsList) {
        TypedArrayConstructor = global_1[ARRAY];
        if (TypedArrayConstructor && has(TypedArrayConstructor, KEY)) {
          delete TypedArrayConstructor[KEY];
        }
      }
    if (!TypedArray[KEY] || forced) {
      // V8 ~ Chrome 49-50 `%TypedArray%` methods are non-writable non-configurable
      try {
        return redefine(
          TypedArray,
          KEY,
          forced
            ? property
            : (NATIVE_ARRAY_BUFFER_VIEWS && Int8Array$1[KEY]) || property
        );
      } catch (error) {
        /* empty */
      }
    } else return;
  }
  for (ARRAY in TypedArrayConstructorsList) {
    TypedArrayConstructor = global_1[ARRAY];
    if (TypedArrayConstructor && (!TypedArrayConstructor[KEY] || forced)) {
      redefine(TypedArrayConstructor, KEY, property);
    }
  }
};

for (NAME in TypedArrayConstructorsList) {
  if (!global_1[NAME]) NATIVE_ARRAY_BUFFER_VIEWS = false;
}

// WebKit bug - typed arrays constructors prototype is Object.prototype
if (
  !NATIVE_ARRAY_BUFFER_VIEWS ||
  typeof TypedArray != 'function' ||
  TypedArray === Function.prototype
) {
  // eslint-disable-next-line no-shadow
  TypedArray = function TypedArray() {
    throw TypeError('Incorrect invocation');
  };
  if (NATIVE_ARRAY_BUFFER_VIEWS)
    for (NAME in TypedArrayConstructorsList) {
      if (global_1[NAME]) objectSetPrototypeOf(global_1[NAME], TypedArray);
    }
}

if (
  !NATIVE_ARRAY_BUFFER_VIEWS ||
  !TypedArrayPrototype ||
  TypedArrayPrototype === ObjectPrototype$1
) {
  TypedArrayPrototype = TypedArray.prototype;
  if (NATIVE_ARRAY_BUFFER_VIEWS)
    for (NAME in TypedArrayConstructorsList) {
      if (global_1[NAME])
        objectSetPrototypeOf(global_1[NAME].prototype, TypedArrayPrototype);
    }
}

// WebKit bug - one more object in Uint8ClampedArray prototype chain
if (
  NATIVE_ARRAY_BUFFER_VIEWS &&
  objectGetPrototypeOf(Uint8ClampedArrayPrototype) !== TypedArrayPrototype
) {
  objectSetPrototypeOf(Uint8ClampedArrayPrototype, TypedArrayPrototype);
}

if (descriptors && !has(TypedArrayPrototype, TO_STRING_TAG$2)) {
  TYPED_ARRAY_TAG_REQIRED = true;
  defineProperty$1(TypedArrayPrototype, TO_STRING_TAG$2, {
    get: function() {
      return isObject(this) ? this[TYPED_ARRAY_TAG] : undefined;
    }
  });
  for (NAME in TypedArrayConstructorsList)
    if (global_1[NAME]) {
      hide(global_1[NAME], TYPED_ARRAY_TAG, NAME);
    }
}

// WebKit bug - the same parent prototype for typed arrays and data view
if (
  NATIVE_ARRAY_BUFFER &&
  objectSetPrototypeOf &&
  objectGetPrototypeOf(DataViewPrototype) !== ObjectPrototype$1
) {
  objectSetPrototypeOf(DataViewPrototype, ObjectPrototype$1);
}

var arrayBufferViewCore = {
  NATIVE_ARRAY_BUFFER: NATIVE_ARRAY_BUFFER,
  NATIVE_ARRAY_BUFFER_VIEWS: NATIVE_ARRAY_BUFFER_VIEWS,
  TYPED_ARRAY_TAG: TYPED_ARRAY_TAG_REQIRED && TYPED_ARRAY_TAG,
  aTypedArray: aTypedArray,
  aTypedArrayConstructor: aTypedArrayConstructor,
  exportProto: exportProto,
  exportStatic: exportStatic,
  isView: isView,
  isTypedArray: isTypedArray,
  TypedArray: TypedArray,
  TypedArrayPrototype: TypedArrayPrototype
};

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor = function(O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined
    ? defaultConstructor
    : aFunction$1(S);
};

var aTypedArray$1 = arrayBufferViewCore.aTypedArray;
var aTypedArrayConstructor$1 = arrayBufferViewCore.aTypedArrayConstructor;
var $slice = [].slice;

var FORCED = fails(function() {
  // eslint-disable-next-line no-undef
  new Int8Array(1).slice();
});

// `%TypedArray%.prototype.slice` method
// https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
arrayBufferViewCore.exportProto(
  'slice',
  function slice(start, end) {
    var list = $slice.call(aTypedArray$1(this), start, end);
    var C = speciesConstructor(this, this.constructor);
    var index = 0;
    var length = list.length;
    var result = new (aTypedArrayConstructor$1(C))(length);
    while (length > index) result[index] = list[index++];
    return result;
  },
  FORCED
);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype$1 = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype$1[UNSCOPABLES] == undefined) {
  hide(ArrayPrototype$1, UNSCOPABLES, objectCreate(null));
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function(key) {
  ArrayPrototype$1[UNSCOPABLES][key] = true;
};

var $includes = arrayIncludes.includes;

// `Array.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
_export(
  { target: 'Array', proto: true },
  {
    includes: function includes(el /* , fromIndex = 0 */) {
      return $includes(
        this,
        el,
        arguments.length > 1 ? arguments[1] : undefined
      );
    }
  }
);

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');

var includes = entryUnbind('Array', 'includes');

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise$1(fn) {
  if (!(this instanceof Promise$1))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise$1._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise$1) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise$1._immediateFn(function() {
      if (!self._handled) {
        Promise$1._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise$1.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise$1.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise$1.prototype['finally'] = finallyConstructor;

Promise$1.all = function(arr) {
  return new Promise$1(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise$1.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise$1) {
    return value;
  }

  return new Promise$1(function(resolve) {
    resolve(value);
  });
};

Promise$1.reject = function(value) {
  return new Promise$1(function(resolve, reject) {
    reject(value);
  });
};

Promise$1.race = function(arr) {
  return new Promise$1(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise$1.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise$1._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise$1._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise$1;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

/**
 * @ignore
 */
var DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
/**
 * @ignore
 */
var DEFAULT_POPUP_CONFIG_OPTIONS = {
  timeoutInSeconds: DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
};

var dedupe = function(arr) {
  return arr.filter(function(x, i) {
    return arr.indexOf(x) === i;
  });
};
var TIMEOUT_ERROR = { error: 'timeout', error_description: 'Timeout' };
var getUniqueScopes = function() {
  var scopes = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    scopes[_i] = arguments[_i];
  }
  var scopeString = scopes.filter(Boolean).join();
  return dedupe(scopeString.replace(/\s/g, ',').split(','))
    .join(' ')
    .trim();
};
var parseQueryResult = function(queryString) {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substr(0, queryString.indexOf('#'));
  }
  var queryParams = queryString.split('&');
  var parsedQuery = {};
  queryParams.forEach(function(qp) {
    var _a = qp.split('='),
      key = _a[0],
      val = _a[1];
    parsedQuery[key] = decodeURIComponent(val);
  });
  return __assign(__assign({}, parsedQuery), {
    expires_in: parseInt(parsedQuery.expires_in)
  });
};
var runIframe = function(authorizeUrl, eventOrigin) {
  return new Promise(function(res, rej) {
    var iframe = window.document.createElement('iframe');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';
    var timeoutSetTimeoutId = setTimeout(function() {
      rej(TIMEOUT_ERROR);
      window.document.body.removeChild(iframe);
    }, 60 * 1000);
    var iframeEventHandler = function(e) {
      if (e.origin != eventOrigin) return;
      if (!e.data || e.data.type !== 'authorization_response') return;
      e.source.close();
      e.data.response.error ? rej(e.data.response) : res(e.data.response);
      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', iframeEventHandler, false);
      window.document.body.removeChild(iframe);
    };
    window.addEventListener('message', iframeEventHandler, false);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizeUrl);
  });
};
var openPopup = function() {
  var popup = window.open(
    '',
    'auth0:authorize:popup',
    'left=100,top=100,width=400,height=600,resizable,scrollbars=yes,status=1'
  );
  if (!popup) {
    throw new Error('Could not open popup');
  }
  return popup;
};
var runPopup = function(popup, authorizeUrl, config) {
  popup.location.href = authorizeUrl;
  return new Promise(function(resolve, reject) {
    var timeoutId = setTimeout(function() {
      reject(__assign(__assign({}, TIMEOUT_ERROR), { popup: popup }));
    }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) *
      1000);
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'authorization_response') {
        return;
      }
      clearTimeout(timeoutId);
      popup.close();
      if (e.data.response.error) {
        return reject(e.data.response);
      }
      resolve(e.data.response);
    });
  });
};
var createRandomString = function() {
  var charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  var random = '';
  var randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach(function(v) {
    return (random += charset[v % charset.length]);
  });
  return random;
};
var encodeState = function(state) {
  return btoa(state);
};
var createQueryParams = function(params) {
  return Object.keys(params)
    .filter(function(k) {
      return typeof params[k] !== 'undefined';
    })
    .map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    })
    .join('&');
};
var sha256 = function(s) {
  return __awaiter(void 0, void 0, void 0, function() {
    var digestOp;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          digestOp = getCryptoSubtle().digest(
            { name: 'SHA-256' },
            new TextEncoder().encode(s)
          );
          // msCrypto (IE11) uses the old spec, which is not Promise based
          // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
          // Instead of returning a promise, it returns a CryptoOperation
          // with a result property in it.
          // As a result, the various events need to be handled in the event that we're
          // working in IE11 (hence the msCrypto check). These events just call resolve
          // or reject depending on their intention.
          if (window.msCrypto) {
            return [
              2 /*return*/,
              new Promise(function(res, rej) {
                digestOp.oncomplete = function(e) {
                  res(e.target.result);
                };
                digestOp.onerror = function(e) {
                  rej(e.error);
                };
                digestOp.onabort = function() {
                  rej('The digest operation was aborted');
                };
              })
            ];
          }
          return [4 /*yield*/, digestOp];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
};
var urlEncodeB64 = function(input) {
  var b64Chars = { '+': '-', '/': '_', '=': '' };
  return input.replace(/[\+\/=]/g, function(m) {
    return b64Chars[m];
  });
};
// https://stackoverflow.com/questions/30106476/
var decodeB64 = function(input) {
  return decodeURIComponent(
    atob(input)
      .split('')
      .map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
};
var urlDecodeB64 = function(input) {
  return decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));
};
var bufferToBase64UrlEncoded = function(input) {
  var ie11SafeInput = new Uint8Array(input);
  return urlEncodeB64(
    window.btoa(String.fromCharCode.apply(String, Array.from(ie11SafeInput)))
  );
};
var getJSON = function(url, options) {
  return __awaiter(void 0, void 0, void 0, function() {
    var response, _a, error, error_description, success, errorMessage, e;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          return [4 /*yield*/, fetch(url, options)];
        case 1:
          response = _b.sent();
          return [4 /*yield*/, response.json()];
        case 2:
          (_a = _b.sent()),
            (error = _a.error),
            (error_description = _a.error_description),
            (success = __rest(_a, ['error', 'error_description']));
          if (!response.ok) {
            errorMessage =
              error_description || 'HTTP error. Unable to fetch ' + url;
            e = new Error(errorMessage);
            e.error = error || 'request_error';
            e.error_description = errorMessage;
            throw e;
          }
          return [2 /*return*/, success];
      }
    });
  });
};
var oauthToken = function(_a) {
  return __awaiter(void 0, void 0, void 0, function() {
    var baseUrl = _a.baseUrl,
      options = __rest(_a, ['baseUrl']);
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          return [
            4 /*yield*/,
            getJSON(baseUrl + '/oauth/token', {
              method: 'POST',
              body: JSON.stringify(
                __assign(
                  {
                    grant_type: 'authorization_code',
                    redirect_uri: window.location.origin
                  },
                  options
                )
              ),
              headers: {
                'Content-type': 'application/json'
              }
            })
          ];
        case 1:
          return [2 /*return*/, _b.sent()];
      }
    });
  });
};
var getCrypto = function() {
  //ie 11.x uses msCrypto
  return window.crypto || window.msCrypto;
};
var getCryptoSubtle = function() {
  var crypto = getCrypto();
  //safari 10.x uses webkitSubtle
  return crypto.subtle || crypto.webkitSubtle;
};
var validateCrypto = function() {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
    );
  }
  if (typeof getCryptoSubtle() === 'undefined') {
    throw new Error(
      '\n      auth0-spa-js must run on a secure origin.\n      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin \n      for more information.\n    '
    );
  }
};

var createKey = function(e) {
  return e.audience + '::' + e.scope;
};
var getExpirationTimeoutInMilliseconds = function(expiresIn, exp) {
  var expTime = (new Date(exp * 1000).getTime() - new Date().getTime()) / 1000;
  return Math.min(expiresIn, expTime) * 1000 * 0.8;
};
var Cache = /** @class */ (function() {
  function Cache() {
    this.cache = {};
  }
  Cache.prototype.save = function(entry) {
    var _this = this;
    var key = createKey(entry);
    this.cache[key] = entry;
    var timeout = getExpirationTimeoutInMilliseconds(
      entry.expires_in,
      entry.decodedToken.claims.exp
    );
    setTimeout(function() {
      delete _this.cache[key];
    }, timeout);
  };
  Cache.prototype.get = function(key) {
    return this.cache[createKey(key)];
  };
  return Cache;
})();

var getAllKeys = function() {
  return Object.keys(Cookies.getAll() || {});
};
var get$1 = function(key) {
  var value = Cookies.get(key);
  if (typeof value === 'undefined') {
    return;
  }
  return JSON.parse(value);
};
var save = function(key, value, options) {
  Cookies.set(key, JSON.stringify(value), {
    expires: options.daysUntilExpire
  });
};
var remove = function(key) {
  Cookies.remove(key);
};

var COOKIE_KEY = 'a0.spajs.txs.';
var getTransactionKey = function(state) {
  return '' + COOKIE_KEY + state;
};
var TransactionManager = /** @class */ (function() {
  function TransactionManager() {
    var _this = this;
    this.transactions = {};
    getAllKeys()
      .filter(function(k) {
        return k.startsWith(COOKIE_KEY);
      })
      .forEach(function(k) {
        var state = k.replace(COOKIE_KEY, '');
        _this.transactions[state] = get$1(k);
      });
  }
  TransactionManager.prototype.create = function(state, transaction) {
    this.transactions[state] = transaction;
    save(getTransactionKey(state), transaction, {
      daysUntilExpire: 1
    });
  };
  TransactionManager.prototype.get = function(state) {
    return this.transactions[state];
  };
  TransactionManager.prototype.remove = function(state) {
    delete this.transactions[state];
    remove(getTransactionKey(state));
  };
  return TransactionManager;
})();

var isNumber = function(n) {
  return typeof n === 'number';
};
var idTokendecoded = [
  'iss',
  'aud',
  'exp',
  'nbf',
  'iat',
  'jti',
  'azp',
  'nonce',
  'auth_time',
  'at_hash',
  'c_hash',
  'acr',
  'amr',
  'sub_jwk',
  'cnf',
  'sip_from_tag',
  'sip_date',
  'sip_callid',
  'sip_cseq_num',
  'sip_via_branch',
  'orig',
  'dest',
  'mky',
  'events',
  'toe',
  'txn',
  'rph',
  'sid',
  'vot',
  'vtm'
];
var decode = function(token) {
  var parts = token.split('.');
  var header = parts[0],
    payload = parts[1],
    signature = parts[2];
  if (parts.length !== 3 || !header || !payload || !signature) {
    throw new Error('ID token could not be decoded');
  }
  var payloadJSON = JSON.parse(urlDecodeB64(payload));
  var claims = { __raw: token };
  var user = {};
  Object.keys(payloadJSON).forEach(function(k) {
    claims[k] = payloadJSON[k];
    if (!idTokendecoded.includes(k)) {
      user[k] = payloadJSON[k];
    }
  });
  return {
    encoded: { header: header, payload: payload, signature: signature },
    header: JSON.parse(urlDecodeB64(header)),
    claims: claims,
    user: user
  };
};
var verify = function(options) {
  if (!options.id_token) {
    throw new Error('ID token is required but missing');
  }
  var decoded = decode(options.id_token);
  if (!decoded.claims.iss) {
    throw new Error(
      'Issuer (iss) claim must be a string present in the ID token'
    );
  }
  if (decoded.claims.iss !== options.iss) {
    throw new Error(
      'Issuer (iss) claim mismatch in the ID token; expected "' +
        options.iss +
        '", found "' +
        decoded.claims.iss +
        '"'
    );
  }
  if (!decoded.user.sub) {
    throw new Error(
      'Subject (sub) claim must be a string present in the ID token'
    );
  }
  if (decoded.header.alg !== 'RS256') {
    throw new Error(
      'Signature algorithm of "' +
        decoded.header.alg +
        '" is not supported. Expected the ID token to be signed with "RS256".'
    );
  }
  if (
    !decoded.claims.aud ||
    !(
      typeof decoded.claims.aud === 'string' ||
      Array.isArray(decoded.claims.aud)
    )
  ) {
    throw new Error(
      'Audience (aud) claim must be a string or array of strings present in the ID token'
    );
  }
  if (Array.isArray(decoded.claims.aud)) {
    if (!decoded.claims.aud.includes(options.aud)) {
      throw new Error(
        'Audience (aud) claim mismatch in the ID token; expected "' +
          options.aud +
          '" but was not one of "' +
          decoded.claims.aud.join(', ') +
          '"'
      );
    }
    if (decoded.claims.aud.length > 1) {
      if (!decoded.claims.azp) {
        throw new Error(
          'Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values'
        );
      }
      if (decoded.claims.azp !== options.aud) {
        throw new Error(
          'Authorized Party (azp) claim mismatch in the ID token; expected "' +
            options.aud +
            '", found "' +
            decoded.claims.azp +
            '"'
        );
      }
    }
  } else if (decoded.claims.aud !== options.aud) {
    throw new Error(
      'Audience (aud) claim mismatch in the ID token; expected "' +
        options.aud +
        '" but found "' +
        decoded.claims.aud +
        '"'
    );
  }
  if (options.nonce) {
    if (!decoded.claims.nonce) {
      throw new Error(
        'Nonce (nonce) claim must be a string present in the ID token'
      );
    }
    if (decoded.claims.nonce !== options.nonce) {
      throw new Error(
        'Nonce (nonce) claim mismatch in the ID token; expected "' +
          options.nonce +
          '", found "' +
          decoded.claims.nonce +
          '"'
      );
    }
  }
  if (options.max_age && !isNumber(decoded.claims.auth_time)) {
    throw new Error(
      'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
    );
  }
  /* istanbul ignore next */
  if (!isNumber(decoded.claims.exp)) {
    throw new Error(
      'Expiration Time (exp) claim must be a number present in the ID token'
    );
  }
  if (!isNumber(decoded.claims.iat)) {
    throw new Error(
      'Issued At (iat) claim must be a number present in the ID token'
    );
  }
  var leeway = options.leeway || 60;
  var now = new Date();
  var expDate = new Date(0);
  var iatDate = new Date(0);
  var nbfDate = new Date(0);
  var authTimeDate = new Date(0);
  authTimeDate.setUTCSeconds(
    (parseInt(decoded.claims.auth_time) + options.max_age) / 1000 + leeway
  );
  expDate.setUTCSeconds(decoded.claims.exp + leeway);
  iatDate.setUTCSeconds(decoded.claims.iat - leeway);
  nbfDate.setUTCSeconds(decoded.claims.nbf - leeway);
  if (now > expDate) {
    throw new Error(
      'Expiration Time (exp) claim error in the ID token; current time (' +
        now +
        ') is after expiration time (' +
        expDate +
        ')'
    );
  }
  if (now < iatDate) {
    throw new Error(
      'Issued At (iat) claim error in the ID token; current time (' +
        now +
        ') is before issued at time (' +
        iatDate +
        ')'
    );
  }
  if (isNumber(decoded.claims.nbf) && now < nbfDate) {
    throw new Error(
      "Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (" +
        now +
        ') is before ' +
        nbfDate
    );
  }
  if (isNumber(decoded.claims.auth_time) && now > authTimeDate) {
    throw new Error(
      'Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Currrent time (' +
        now +
        ') is after last auth at ' +
        authTimeDate
    );
  }
  return decoded;
};

var AuthenticationError = /** @class */ (function(_super) {
  __extends(AuthenticationError, _super);
  function AuthenticationError(error, error_description, state) {
    var _this = _super.call(this, error_description) || this;
    _this.error = error;
    _this.error_description = error_description;
    _this.state = state;
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(_this, AuthenticationError.prototype);
    return _this;
  }
  return AuthenticationError;
})(Error);

var version = '1.6.0';

var lock = new Lock();
var GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';
/**
 * Auth0 SDK for Single Page Applications using [Authorization Code Grant Flow with PKCE](https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce).
 */
var Auth0Client = /** @class */ (function() {
  function Auth0Client(options) {
    this.options = options;
    this.DEFAULT_SCOPE = 'openid profile email';
    this.cache = new Cache();
    this.transactionManager = new TransactionManager();
    this.domainUrl = 'https://' + this.options.domain;
    this.tokenIssuer = this.options.issuer
      ? 'https://' + this.options.issuer + '/'
      : this.domainUrl + '/';
  }
  Auth0Client.prototype._url = function(path) {
    var telemetry = encodeURIComponent(
      btoa(
        JSON.stringify({
          name: 'auth0-spa-js',
          version: version
        })
      )
    );
    return '' + this.domainUrl + path + '&auth0Client=' + telemetry;
  };
  Auth0Client.prototype._getParams = function(
    authorizeOptions,
    state,
    nonce,
    code_challenge,
    redirect_uri
  ) {
    var _a = this.options,
      domain = _a.domain,
      leeway = _a.leeway,
      withoutDomain = __rest(_a, ['domain', 'leeway']);
    return __assign(__assign(__assign({}, withoutDomain), authorizeOptions), {
      scope: getUniqueScopes(
        this.DEFAULT_SCOPE,
        this.options.scope,
        authorizeOptions.scope
      ),
      response_type: 'code',
      response_mode: 'query',
      state: state,
      nonce: nonce,
      redirect_uri: redirect_uri || this.options.redirect_uri,
      code_challenge: code_challenge,
      code_challenge_method: 'S256'
    });
  };
  Auth0Client.prototype._authorizeUrl = function(authorizeOptions) {
    return this._url('/authorize?' + createQueryParams(authorizeOptions));
  };
  Auth0Client.prototype._verifyIdToken = function(id_token, nonce) {
    return verify({
      iss: this.tokenIssuer,
      aud: this.options.client_id,
      id_token: id_token,
      nonce: nonce,
      leeway: this.options.leeway,
      max_age: this._parseNumber(this.options.max_age)
    });
  };
  Auth0Client.prototype._parseNumber = function(value) {
    if (typeof value !== 'string') {
      return value;
    }
    return parseInt(value, 10) || undefined;
  };
  /**
   * ```js
   * await auth0.buildAuthorizeUrl(options);
   * ```
   *
   * Builds an `/authorize` URL for loginWithRedirect using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options
   */
  Auth0Client.prototype.buildAuthorizeUrl = function(options) {
    if (options === void 0) {
      options = {};
    }
    return __awaiter(this, void 0, void 0, function() {
      var redirect_uri,
        appState,
        authorizeOptions,
        stateIn,
        nonceIn,
        code_verifier,
        code_challengeBuffer,
        code_challenge,
        fragment,
        params,
        url;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            (redirect_uri = options.redirect_uri),
              (appState = options.appState),
              (authorizeOptions = __rest(options, [
                'redirect_uri',
                'appState'
              ]));
            stateIn = encodeState(createRandomString());
            nonceIn = createRandomString();
            code_verifier = createRandomString();
            return [4 /*yield*/, sha256(code_verifier)];
          case 1:
            code_challengeBuffer = _a.sent();
            code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
            fragment = options.fragment ? '#' + options.fragment : '';
            params = this._getParams(
              authorizeOptions,
              stateIn,
              nonceIn,
              code_challenge,
              redirect_uri
            );
            url = this._authorizeUrl(params);
            this.transactionManager.create(stateIn, {
              nonce: nonceIn,
              code_verifier: code_verifier,
              appState: appState,
              scope: params.scope,
              audience: params.audience || 'default'
            });
            return [2 /*return*/, url + fragment];
        }
      });
    });
  };
  /**
   * ```js
   * await auth0.loginWithPopup(options);
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   *
   * @param options
   */
  Auth0Client.prototype.loginWithPopup = function(options, config) {
    if (options === void 0) {
      options = {};
    }
    if (config === void 0) {
      config = DEFAULT_POPUP_CONFIG_OPTIONS;
    }
    return __awaiter(this, void 0, void 0, function() {
      var popup,
        authorizeOptions,
        stateIn,
        nonceIn,
        code_verifier,
        code_challengeBuffer,
        code_challenge,
        params,
        url,
        codeResult,
        authResult,
        decodedToken,
        cacheEntry;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, openPopup()];
          case 1:
            popup = _a.sent();
            authorizeOptions = __rest(options, []);
            stateIn = encodeState(createRandomString());
            nonceIn = createRandomString();
            code_verifier = createRandomString();
            return [4 /*yield*/, sha256(code_verifier)];
          case 2:
            code_challengeBuffer = _a.sent();
            code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
            params = this._getParams(
              authorizeOptions,
              stateIn,
              nonceIn,
              code_challenge,
              this.options.redirect_uri || window.location.origin
            );
            url = this._authorizeUrl(
              __assign(__assign({}, params), { response_mode: 'web_message' })
            );
            return [4 /*yield*/, runPopup(popup, url, config)];
          case 3:
            codeResult = _a.sent();
            if (stateIn !== codeResult.state) {
              throw new Error('Invalid state');
            }
            return [
              4 /*yield*/,
              oauthToken({
                baseUrl: this.domainUrl,
                audience: options.audience || this.options.audience,
                client_id: this.options.client_id,
                code_verifier: code_verifier,
                code: codeResult.code
              })
            ];
          case 4:
            authResult = _a.sent();
            decodedToken = this._verifyIdToken(authResult.id_token, nonceIn);
            cacheEntry = __assign(__assign({}, authResult), {
              decodedToken: decodedToken,
              scope: params.scope,
              audience: params.audience || 'default'
            });
            this.cache.save(cacheEntry);
            save('auth0.is.authenticated', true, { daysUntilExpire: 1 });
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * ```js
   * const user = await auth0.getIdToken();
   * ```
   *
   * Returns the id_token if available.
   *
   * @param options
   */
  Auth0Client.prototype.getIdToken = function(options) {
    if (options === void 0) {
      options = {
        audience: this.options.audience || 'default',
        scope: this.options.scope || this.DEFAULT_SCOPE
      };
    }
    return __awaiter(this, void 0, void 0, function() {
      var cache;
      return __generator(this, function(_a) {
        options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);
        cache = this.cache.get(options);
        return [2 /*return*/, cache && cache.id_token];
      });
    });
  };
  /**
   * ```js
   * const user = await auth0.getUser();
   * ```
   *
   * Returns the user information if available (decoded
   * from the `id_token`).
   *
   * @param options
   */
  Auth0Client.prototype.getUser = function(options) {
    if (options === void 0) {
      options = {
        audience: this.options.audience || 'default',
        scope: this.options.scope || this.DEFAULT_SCOPE
      };
    }
    return __awaiter(this, void 0, void 0, function() {
      var cache;
      return __generator(this, function(_a) {
        options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);
        cache = this.cache.get(options);
        return [2 /*return*/, cache && cache.decodedToken.user];
      });
    });
  };
  /**
   * ```js
   * const claims = await auth0.getIdTokenClaims();
   * ```
   *
   * Returns all claims from the id_token if available.
   *
   * @param options
   */
  Auth0Client.prototype.getIdTokenClaims = function(options) {
    if (options === void 0) {
      options = {
        audience: this.options.audience || 'default',
        scope: this.options.scope || this.DEFAULT_SCOPE
      };
    }
    return __awaiter(this, void 0, void 0, function() {
      var cache;
      return __generator(this, function(_a) {
        options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);
        cache = this.cache.get(options);
        return [2 /*return*/, cache && cache.decodedToken.claims];
      });
    });
  };
  /**
   * ```js
   * await auth0.loginWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options
   */
  Auth0Client.prototype.loginWithRedirect = function(options) {
    if (options === void 0) {
      options = {};
    }
    return __awaiter(this, void 0, void 0, function() {
      var url;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.buildAuthorizeUrl(options)];
          case 1:
            url = _a.sent();
            window.location.assign(url);
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Auth0. If the response is successful, results
   * will be valid according to their expiration times.
   */
  Auth0Client.prototype.handleRedirectCallback = function(url) {
    if (url === void 0) {
      url = window.location.href;
    }
    return __awaiter(this, void 0, void 0, function() {
      var queryStringFragments,
        _a,
        state,
        code,
        error,
        error_description,
        transaction,
        authResult,
        decodedToken,
        cacheEntry;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            queryStringFragments = url.split('?').slice(1);
            if (queryStringFragments.length === 0) {
              throw new Error(
                'There are no query params available for parsing.'
              );
            }
            (_a = parseQueryResult(queryStringFragments.join(''))),
              (state = _a.state),
              (code = _a.code),
              (error = _a.error),
              (error_description = _a.error_description);
            if (error) {
              this.transactionManager.remove(state);
              throw new AuthenticationError(error, error_description, state);
            }
            transaction = this.transactionManager.get(state);
            if (!transaction) {
              throw new Error('Invalid state');
            }
            this.transactionManager.remove(state);
            return [
              4 /*yield*/,
              oauthToken({
                baseUrl: this.domainUrl,
                audience: this.options.audience,
                client_id: this.options.client_id,
                code_verifier: transaction.code_verifier,
                code: code
              })
            ];
          case 1:
            authResult = _b.sent();
            decodedToken = this._verifyIdToken(
              authResult.id_token,
              transaction.nonce
            );
            cacheEntry = __assign(__assign({}, authResult), {
              decodedToken: decodedToken,
              audience: transaction.audience,
              scope: transaction.scope
            });
            this.cache.save(cacheEntry);
            save('auth0.is.authenticated', true, { daysUntilExpire: 1 });
            return [
              2 /*return*/,
              {
                appState: transaction.appState
              }
            ];
        }
      });
    });
  };
  /**
   * ```js
   * const token = await auth0.getTokenSilently(options);
   * ```
   *
   * If there's a valid token stored, return it. Otherwise, opens an
   * iframe with the `/authorize` URL using the parameters provided
   * as arguments. Random and secure `state` and `nonce` parameters
   * will be auto-generated. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * @param options
   */
  Auth0Client.prototype.getTokenSilently = function(options) {
    if (options === void 0) {
      options = {
        audience: this.options.audience,
        scope: this.options.scope || this.DEFAULT_SCOPE,
        ignoreCache: false
      };
    }
    return __awaiter(this, void 0, void 0, function() {
      var cache,
        stateIn,
        nonceIn,
        code_verifier,
        code_challengeBuffer,
        code_challenge,
        authorizeOptions,
        params,
        url,
        codeResult,
        authResult,
        decodedToken,
        cacheEntry,
        e_1;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            options.scope = getUniqueScopes(this.DEFAULT_SCOPE, options.scope);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 8, 9, 11]);
            return [
              4 /*yield*/,
              lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000)
            ];
          case 2:
            _a.sent();
            if (!!options.ignoreCache) return [3 /*break*/, 4];
            cache = this.cache.get({
              scope: options.scope,
              audience: options.audience || 'default'
            });
            if (!cache) return [3 /*break*/, 4];
            return [4 /*yield*/, lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY)];
          case 3:
            _a.sent();
            return [2 /*return*/, cache.access_token];
          case 4:
            stateIn = encodeState(createRandomString());
            nonceIn = createRandomString();
            code_verifier = createRandomString();
            return [4 /*yield*/, sha256(code_verifier)];
          case 5:
            code_challengeBuffer = _a.sent();
            code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
            authorizeOptions = {
              audience: options.audience,
              scope: options.scope
            };
            params = this._getParams(
              authorizeOptions,
              stateIn,
              nonceIn,
              code_challenge,
              this.options.redirect_uri || window.location.origin
            );
            url = this._authorizeUrl(
              __assign(__assign({}, params), {
                prompt: 'none',
                response_mode: 'web_message'
              })
            );
            return [4 /*yield*/, runIframe(url, this.domainUrl)];
          case 6:
            codeResult = _a.sent();
            if (stateIn !== codeResult.state) {
              throw new Error('Invalid state');
            }
            return [
              4 /*yield*/,
              oauthToken({
                baseUrl: this.domainUrl,
                audience: options.audience || this.options.audience,
                client_id: this.options.client_id,
                code_verifier: code_verifier,
                code: codeResult.code
              })
            ];
          case 7:
            authResult = _a.sent();
            decodedToken = this._verifyIdToken(authResult.id_token, nonceIn);
            cacheEntry = __assign(__assign({}, authResult), {
              decodedToken: decodedToken,
              scope: params.scope,
              audience: params.audience || 'default'
            });
            this.cache.save(cacheEntry);
            save('auth0.is.authenticated', true, {
              daysUntilExpire: 1
            });
            return [2 /*return*/, authResult.access_token];
          case 8:
            e_1 = _a.sent();
            throw e_1;
          case 9:
            return [4 /*yield*/, lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY)];
          case 10:
            _a.sent();
            return [7 /*endfinally*/];
          case 11:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * ```js
   * const token = await auth0.getTokenWithPopup(options);
   * ```
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * @param options
   */
  Auth0Client.prototype.getTokenWithPopup = function(options, config) {
    if (options === void 0) {
      options = {
        audience: this.options.audience,
        scope: this.options.scope || this.DEFAULT_SCOPE
      };
    }
    if (config === void 0) {
      config = DEFAULT_POPUP_CONFIG_OPTIONS;
    }
    return __awaiter(this, void 0, void 0, function() {
      var cache;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            options.scope = getUniqueScopes(
              this.DEFAULT_SCOPE,
              this.options.scope,
              options.scope
            );
            return [4 /*yield*/, this.loginWithPopup(options, config)];
          case 1:
            _a.sent();
            cache = this.cache.get({
              scope: options.scope,
              audience: options.audience || 'default'
            });
            return [2 /*return*/, cache.access_token];
        }
      });
    });
  };
  /**
   * ```js
   * const isAuthenticated = await auth0.isAuthenticated();
   * ```
   *
   * Returns `true` if there's valid information stored,
   * otherwise returns `false`.
   *
   */
  Auth0Client.prototype.isAuthenticated = function() {
    return __awaiter(this, void 0, void 0, function() {
      var user;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.getUser()];
          case 1:
            user = _a.sent();
            return [2 /*return*/, !!user];
        }
      });
    });
  };
  /**
   * ```js
   * auth0.logout();
   * ```
   *
   * Performs a redirect to `/v2/logout` using the parameters provided
   * as arguments. [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
   *
   * @param options
   */
  Auth0Client.prototype.logout = function(options) {
    if (options === void 0) {
      options = {};
    }
    if (options.client_id !== null) {
      options.client_id = options.client_id || this.options.client_id;
    } else {
      delete options.client_id;
    }
    remove('auth0.is.authenticated');
    var federated = options.federated,
      logoutOptions = __rest(options, ['federated']);
    var federatedQuery = federated ? '&federated' : '';
    var url = this._url('/v2/logout?' + createQueryParams(logoutOptions));
    window.location.assign('' + url + federatedQuery);
  };
  return Auth0Client;
})();

function createAuth0Client(options) {
  return __awaiter(this, void 0, void 0, function() {
    var auth0, error_1;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          validateCrypto();
          auth0 = new Auth0Client(options);
          if (!get$1('auth0.is.authenticated')) {
            return [2 /*return*/, auth0];
          }
          _a.label = 1;
        case 1:
          _a.trys.push([1, 3, , 4]);
          return [
            4 /*yield*/,
            auth0.getTokenSilently({
              audience: options.audience,
              scope: options.scope,
              ignoreCache: true
            })
          ];
        case 2:
          _a.sent();
          return [3 /*break*/, 4];
        case 3:
          error_1 = _a.sent();
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/, auth0];
      }
    });
  });
}

module.exports = createAuth0Client;
//# sourceMappingURL=auth0-spa-js.cjs.js.map
