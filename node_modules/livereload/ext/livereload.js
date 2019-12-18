(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],2:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"./_hide":17,"./_wks":45}],3:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":21}],4:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":38,"./_to-iobject":40,"./_to-length":41}],5:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],6:[function(require,module,exports){
var core = module.exports = { version: '2.6.5' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],7:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":1}],8:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],9:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":13}],10:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":15,"./_is-object":21}],11:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],12:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var hide = require('./_hide');
var redefine = require('./_redefine');
var ctx = require('./_ctx');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":6,"./_ctx":7,"./_global":15,"./_hide":17,"./_redefine":34}],13:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],14:[function(require,module,exports){
module.exports = require('./_shared')('native-function-to-string', Function.toString);

},{"./_shared":37}],15:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],16:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],17:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":9,"./_object-dp":28,"./_property-desc":33}],18:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":15}],19:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":9,"./_dom-create":10,"./_fails":13}],20:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":5}],21:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],22:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":17,"./_object-create":27,"./_property-desc":33,"./_set-to-string-tag":35,"./_wks":45}],23:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":12,"./_hide":17,"./_iter-create":22,"./_iterators":25,"./_library":26,"./_object-gpo":30,"./_redefine":34,"./_set-to-string-tag":35,"./_wks":45}],24:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],25:[function(require,module,exports){
module.exports = {};

},{}],26:[function(require,module,exports){
module.exports = false;

},{}],27:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":3,"./_dom-create":10,"./_enum-bug-keys":11,"./_html":18,"./_object-dps":29,"./_shared-key":36}],28:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":3,"./_descriptors":9,"./_ie8-dom-define":19,"./_to-primitive":43}],29:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":3,"./_descriptors":9,"./_object-dp":28,"./_object-keys":32}],30:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":16,"./_shared-key":36,"./_to-object":42}],31:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":4,"./_has":16,"./_shared-key":36,"./_to-iobject":40}],32:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":11,"./_object-keys-internal":31}],33:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],34:[function(require,module,exports){
var global = require('./_global');
var hide = require('./_hide');
var has = require('./_has');
var SRC = require('./_uid')('src');
var $toString = require('./_function-to-string');
var TO_STRING = 'toString';
var TPL = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"./_core":6,"./_function-to-string":14,"./_global":15,"./_has":16,"./_hide":17,"./_uid":44}],35:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":16,"./_object-dp":28,"./_wks":45}],36:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":37,"./_uid":44}],37:[function(require,module,exports){
var core = require('./_core');
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: require('./_library') ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});

},{"./_core":6,"./_global":15,"./_library":26}],38:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":39}],39:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],40:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":8,"./_iobject":20}],41:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":39}],42:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":8}],43:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":21}],44:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],45:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":15,"./_shared":37,"./_uid":44}],46:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":2,"./_iter-define":23,"./_iter-step":24,"./_iterators":25,"./_to-iobject":40}],47:[function(require,module,exports){
var $iterators = require('./es6.array.iterator');
var getKeys = require('./_object-keys');
var redefine = require('./_redefine');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var wks = require('./_wks');
var ITERATOR = wks('iterator');
var TO_STRING_TAG = wks('toStringTag');
var ArrayValues = Iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
  var NAME = collections[i];
  var explicit = DOMIterables[NAME];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  var key;
  if (proto) {
    if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
    if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
  }
}

},{"./_global":15,"./_hide":17,"./_iterators":25,"./_object-keys":32,"./_redefine":34,"./_wks":45,"./es6.array.iterator":46}],48:[function(require,module,exports){
"use strict";

const {
  Parser,
  PROTOCOL_6,
  PROTOCOL_7
} = require('./protocol');

const VERSION = "3.0.0";

class Connector {
  constructor(options, WebSocket, Timer, handlers) {
    this.options = options;
    this.WebSocket = WebSocket;
    this.Timer = Timer;
    this.handlers = handlers;
    const path = this.options.path ? "".concat(this.options.path) : 'livereload';
    this._uri = "ws".concat(this.options.https ? 's' : '', "://").concat(this.options.host, ":").concat(this.options.port, "/").concat(path);
    this._nextDelay = this.options.mindelay;
    this._connectionDesired = false;
    this.protocol = 0;
    this.protocolParser = new Parser({
      connected: protocol => {
        this.protocol = protocol;

        this._handshakeTimeout.stop();

        this._nextDelay = this.options.mindelay;
        this._disconnectionReason = 'broken';
        return this.handlers.connected(this.protocol);
      },
      error: e => {
        this.handlers.error(e);
        return this._closeOnError();
      },
      message: message => {
        return this.handlers.message(message);
      }
    });
    this._handshakeTimeout = new this.Timer(() => {
      if (!this._isSocketConnected()) {
        return;
      }

      this._disconnectionReason = 'handshake-timeout';
      return this.socket.close();
    });
    this._reconnectTimer = new this.Timer(() => {
      if (!this._connectionDesired) {
        // shouldn't hit this, but just in case
        return;
      }

      return this.connect();
    });
    this.connect();
  }

  _isSocketConnected() {
    return this.socket && this.socket.readyState === this.WebSocket.OPEN;
  }

  connect() {
    this._connectionDesired = true;

    if (this._isSocketConnected()) {
      return;
    } // prepare for a new connection


    this._reconnectTimer.stop();

    this._disconnectionReason = 'cannot-connect';
    this.protocolParser.reset();
    this.handlers.connecting();
    this.socket = new this.WebSocket(this._uri);

    this.socket.onopen = e => this._onopen(e);

    this.socket.onclose = e => this._onclose(e);

    this.socket.onmessage = e => this._onmessage(e);

    this.socket.onerror = e => this._onerror(e);
  }

  disconnect() {
    this._connectionDesired = false;

    this._reconnectTimer.stop(); // in case it was running


    if (!this._isSocketConnected()) {
      return;
    }

    this._disconnectionReason = 'manual';
    return this.socket.close();
  }

  _scheduleReconnection() {
    if (!this._connectionDesired) {
      // don't reconnect after manual disconnection
      return;
    }

    if (!this._reconnectTimer.running) {
      this._reconnectTimer.start(this._nextDelay);

      this._nextDelay = Math.min(this.options.maxdelay, this._nextDelay * 2);
    }
  }

  sendCommand(command) {
    if (!this.protocol) {
      return;
    }

    return this._sendCommand(command);
  }

  _sendCommand(command) {
    return this.socket.send(JSON.stringify(command));
  }

  _closeOnError() {
    this._handshakeTimeout.stop();

    this._disconnectionReason = 'error';
    return this.socket.close();
  }

  _onopen(e) {
    this.handlers.socketConnected();
    this._disconnectionReason = 'handshake-failed'; // start handshake

    const hello = {
      command: 'hello',
      protocols: [PROTOCOL_6, PROTOCOL_7]
    };
    hello.ver = VERSION;

    if (this.options.ext) {
      hello.ext = this.options.ext;
    }

    if (this.options.extver) {
      hello.extver = this.options.extver;
    }

    if (this.options.snipver) {
      hello.snipver = this.options.snipver;
    }

    this._sendCommand(hello);

    return this._handshakeTimeout.start(this.options.handshake_timeout);
  }

  _onclose(e) {
    this.protocol = 0;
    this.handlers.disconnected(this._disconnectionReason, this._nextDelay);
    return this._scheduleReconnection();
  }

  _onerror(e) {}

  _onmessage(e) {
    return this.protocolParser.process(e.data);
  }

}

;
exports.Connector = Connector;

},{"./protocol":53}],49:[function(require,module,exports){
"use strict";

const CustomEvents = {
  bind(element, eventName, handler) {
    if (element.addEventListener) {
      return element.addEventListener(eventName, handler, false);
    } else if (element.attachEvent) {
      element[eventName] = 1;
      return element.attachEvent('onpropertychange', function (event) {
        if (event.propertyName === eventName) {
          return handler();
        }
      });
    } else {
      throw new Error("Attempt to attach custom event ".concat(eventName, " to something which isn't a DOMElement"));
    }
  },

  fire(element, eventName) {
    if (element.addEventListener) {
      const event = document.createEvent('HTMLEvents');
      event.initEvent(eventName, true, true);
      return document.dispatchEvent(event);
    } else if (element.attachEvent) {
      if (element[eventName]) {
        return element[eventName]++;
      }
    } else {
      throw new Error("Attempt to fire custom event ".concat(eventName, " on something which isn't a DOMElement"));
    }
  }

};
exports.bind = CustomEvents.bind;
exports.fire = CustomEvents.fire;

},{}],50:[function(require,module,exports){
"use strict";

class LessPlugin {
  constructor(window, host) {
    this.window = window;
    this.host = host;
  }

  reload(path, options) {
    if (this.window.less && this.window.less.refresh) {
      if (path.match(/\.less$/i)) {
        return this.reloadLess(path);
      }

      if (options.originalPath.match(/\.less$/i)) {
        return this.reloadLess(options.originalPath);
      }
    }

    return false;
  }

  reloadLess(path) {
    let link;

    const links = (() => {
      const result = [];

      for (link of Array.from(document.getElementsByTagName('link'))) {
        if (link.href && link.rel.match(/^stylesheet\/less$/i) || link.rel.match(/stylesheet/i) && link.type.match(/^text\/(x-)?less$/i)) {
          result.push(link);
        }
      }

      return result;
    })();

    if (links.length === 0) {
      return false;
    }

    for (link of Array.from(links)) {
      link.href = this.host.generateCacheBustUrl(link.href);
    }

    this.host.console.log('LiveReload is asking LESS to recompile all stylesheets');
    this.window.less.refresh(true);
    return true;
  }

  analyze() {
    return {
      disable: !!(this.window.less && this.window.less.refresh)
    };
  }

}

;
LessPlugin.identifier = 'less';
LessPlugin.version = '1.0';
module.exports = LessPlugin;

},{}],51:[function(require,module,exports){
"use strict";

require("core-js/modules/web.dom.iterable");

/* global alert */
const {
  Connector
} = require('./connector');

const {
  Timer
} = require('./timer');

const {
  Options
} = require('./options');

const {
  Reloader
} = require('./reloader');

const {
  ProtocolError
} = require('./protocol');

class LiveReload {
  constructor(window) {
    this.window = window;
    this.listeners = {};
    this.plugins = [];
    this.pluginIdentifiers = {}; // i can haz console?

    this.console = this.window.console && this.window.console.log && this.window.console.error ? this.window.location.href.match(/LR-verbose/) ? this.window.console : {
      log() {},

      error: this.window.console.error.bind(this.window.console)
    } : {
      log() {},

      error() {}

    }; // i can haz sockets?

    if (!(this.WebSocket = this.window.WebSocket || this.window.MozWebSocket)) {
      this.console.error('LiveReload disabled because the browser does not seem to support web sockets');
      return;
    } // i can haz options?


    if ('LiveReloadOptions' in window) {
      this.options = new Options();

      for (let k of Object.keys(window['LiveReloadOptions'] || {})) {
        const v = window['LiveReloadOptions'][k];
        this.options.set(k, v);
      }
    } else {
      this.options = Options.extract(this.window.document);

      if (!this.options) {
        this.console.error('LiveReload disabled because it could not find its own <SCRIPT> tag');
        return;
      }
    } // i can haz reloader?


    this.reloader = new Reloader(this.window, this.console, Timer); // i can haz connection?

    this.connector = new Connector(this.options, this.WebSocket, Timer, {
      connecting: () => {},
      socketConnected: () => {},
      connected: protocol => {
        if (typeof this.listeners.connect === 'function') {
          this.listeners.connect();
        }

        this.log("LiveReload is connected to ".concat(this.options.host, ":").concat(this.options.port, " (protocol v").concat(protocol, ")."));
        return this.analyze();
      },
      error: e => {
        if (e instanceof ProtocolError) {
          if (typeof console !== 'undefined' && console !== null) {
            return console.log("".concat(e.message, "."));
          }
        } else {
          if (typeof console !== 'undefined' && console !== null) {
            return console.log("LiveReload internal error: ".concat(e.message));
          }
        }
      },
      disconnected: (reason, nextDelay) => {
        if (typeof this.listeners.disconnect === 'function') {
          this.listeners.disconnect();
        }

        switch (reason) {
          case 'cannot-connect':
            return this.log("LiveReload cannot connect to ".concat(this.options.host, ":").concat(this.options.port, ", will retry in ").concat(nextDelay, " sec."));

          case 'broken':
            return this.log("LiveReload disconnected from ".concat(this.options.host, ":").concat(this.options.port, ", reconnecting in ").concat(nextDelay, " sec."));

          case 'handshake-timeout':
            return this.log("LiveReload cannot connect to ".concat(this.options.host, ":").concat(this.options.port, " (handshake timeout), will retry in ").concat(nextDelay, " sec."));

          case 'handshake-failed':
            return this.log("LiveReload cannot connect to ".concat(this.options.host, ":").concat(this.options.port, " (handshake failed), will retry in ").concat(nextDelay, " sec."));

          case 'manual': // nop

          case 'error': // nop

          default:
            return this.log("LiveReload disconnected from ".concat(this.options.host, ":").concat(this.options.port, " (").concat(reason, "), reconnecting in ").concat(nextDelay, " sec."));
        }
      },
      message: message => {
        switch (message.command) {
          case 'reload':
            return this.performReload(message);

          case 'alert':
            return this.performAlert(message);
        }
      }
    });
    this.initialized = true;
  }

  on(eventName, handler) {
    this.listeners[eventName] = handler;
  }

  log(message) {
    return this.console.log("".concat(message));
  }

  performReload(message) {
    this.log("LiveReload received reload request: ".concat(JSON.stringify(message, null, 2)));
    return this.reloader.reload(message.path, {
      liveCSS: message.liveCSS != null ? message.liveCSS : true,
      liveImg: message.liveImg != null ? message.liveImg : true,
      reloadMissingCSS: message.reloadMissingCSS != null ? message.reloadMissingCSS : true,
      originalPath: message.originalPath || '',
      overrideURL: message.overrideURL || '',
      serverURL: "http://".concat(this.options.host, ":").concat(this.options.port)
    });
  }

  performAlert(message) {
    return alert(message.message);
  }

  shutDown() {
    if (!this.initialized) {
      return;
    }

    this.connector.disconnect();
    this.log('LiveReload disconnected.');
    return typeof this.listeners.shutdown === 'function' ? this.listeners.shutdown() : undefined;
  }

  hasPlugin(identifier) {
    return !!this.pluginIdentifiers[identifier];
  }

  addPlugin(PluginClass) {
    if (!this.initialized) {
      return;
    }

    if (this.hasPlugin(PluginClass.identifier)) {
      return;
    }

    this.pluginIdentifiers[PluginClass.identifier] = true;
    const plugin = new PluginClass(this.window, {
      // expose internal objects for those who know what they're doing
      // (note that these are private APIs and subject to change at any time!)
      _livereload: this,
      _reloader: this.reloader,
      _connector: this.connector,
      // official API
      console: this.console,
      Timer,
      generateCacheBustUrl: url => this.reloader.generateCacheBustUrl(url)
    }); // API that PluginClass can/must provide:
    //
    // string PluginClass.identifier
    //   -- required, globally-unique name of this plugin
    //
    // string PluginClass.version
    //   -- required, plugin version number (format %d.%d or %d.%d.%d)
    //
    // plugin = new PluginClass(window, officialLiveReloadAPI)
    //   -- required, plugin constructor
    //
    // bool plugin.reload(string path, { bool liveCSS, bool liveImg })
    //   -- optional, attemp to reload the given path, return true if handled
    //
    // object plugin.analyze()
    //   -- optional, returns plugin-specific information about the current document (to send to the connected server)
    //      (LiveReload 2 server currently only defines 'disable' key in this object; return {disable:true} to disable server-side
    //       compilation of a matching plugin's files)

    this.plugins.push(plugin);
    this.reloader.addPlugin(plugin);
  }

  analyze() {
    if (!this.initialized) {
      return;
    }

    if (!(this.connector.protocol >= 7)) {
      return;
    }

    const pluginsData = {};

    for (let plugin of this.plugins) {
      var pluginData = (typeof plugin.analyze === 'function' ? plugin.analyze() : undefined) || {};
      pluginsData[plugin.constructor.identifier] = pluginData;
      pluginData.version = plugin.constructor.version;
    }

    this.connector.sendCommand({
      command: 'info',
      plugins: pluginsData,
      url: this.window.location.href
    });
  }

}

;
exports.LiveReload = LiveReload;

},{"./connector":48,"./options":52,"./protocol":53,"./reloader":54,"./timer":56,"core-js/modules/web.dom.iterable":47}],52:[function(require,module,exports){
"use strict";

class Options {
  constructor() {
    this.https = false;
    this.host = null;
    this.port = 35729;
    this.snipver = null;
    this.ext = null;
    this.extver = null;
    this.mindelay = 1000;
    this.maxdelay = 60000;
    this.handshake_timeout = 5000;
  }

  set(name, value) {
    if (typeof value === 'undefined') {
      return;
    }

    if (!isNaN(+value)) {
      value = +value;
    }

    this[name] = value;
  }

}

Options.extract = function (document) {
  for (let element of Array.from(document.getElementsByTagName('script'))) {
    var m, src;

    if ((src = element.src) && (m = src.match(new RegExp("^[^:]+://(.*)/z?livereload\\.js(?:\\?(.*))?$")))) {
      var mm;
      const options = new Options();
      options.https = src.indexOf('https') === 0;

      if (mm = m[1].match(new RegExp("^([^/:]+)(?::(\\d+))?(\\/+.*)?$"))) {
        options.host = mm[1];

        if (mm[2]) {
          options.port = parseInt(mm[2], 10);
        }
      }

      if (m[2]) {
        for (let pair of m[2].split('&')) {
          var keyAndValue;

          if ((keyAndValue = pair.split('=')).length > 1) {
            options.set(keyAndValue[0].replace(/-/g, '_'), keyAndValue.slice(1).join('='));
          }
        }
      }

      return options;
    }
  }

  return null;
};

exports.Options = Options;

},{}],53:[function(require,module,exports){
"use strict";

let PROTOCOL_6, PROTOCOL_7;
exports.PROTOCOL_6 = PROTOCOL_6 = 'http://livereload.com/protocols/official-6';
exports.PROTOCOL_7 = PROTOCOL_7 = 'http://livereload.com/protocols/official-7';

class ProtocolError {
  constructor(reason, data) {
    this.message = "LiveReload protocol error (".concat(reason, ") after receiving data: \"").concat(data, "\".");
  }

}

;

class Parser {
  constructor(handlers) {
    this.handlers = handlers;
    this.reset();
  }

  reset() {
    this.protocol = null;
  }

  process(data) {
    try {
      let message;

      if (!this.protocol) {
        if (data.match(new RegExp("^!!ver:([\\d.]+)$"))) {
          this.protocol = 6;
        } else if (message = this._parseMessage(data, ['hello'])) {
          if (!message.protocols.length) {
            throw new ProtocolError('no protocols specified in handshake message');
          } else if (Array.from(message.protocols).includes(PROTOCOL_7)) {
            this.protocol = 7;
          } else if (Array.from(message.protocols).includes(PROTOCOL_6)) {
            this.protocol = 6;
          } else {
            throw new ProtocolError('no supported protocols found');
          }
        }

        return this.handlers.connected(this.protocol);
      } else if (this.protocol === 6) {
        message = JSON.parse(data);

        if (!message.length) {
          throw new ProtocolError('protocol 6 messages must be arrays');
        }

        const [command, options] = Array.from(message);

        if (command !== 'refresh') {
          throw new ProtocolError('unknown protocol 6 command');
        }

        return this.handlers.message({
          command: 'reload',
          path: options.path,
          liveCSS: options.apply_css_live != null ? options.apply_css_live : true
        });
      } else {
        message = this._parseMessage(data, ['reload', 'alert']);
        return this.handlers.message(message);
      }
    } catch (e) {
      if (e instanceof ProtocolError) {
        return this.handlers.error(e);
      } else {
        throw e;
      }
    }
  }

  _parseMessage(data, validCommands) {
    let message;

    try {
      message = JSON.parse(data);
    } catch (e) {
      throw new ProtocolError('unparsable JSON', data);
    }

    if (!message.command) {
      throw new ProtocolError('missing "command" key', data);
    }

    if (!validCommands.includes(message.command)) {
      throw new ProtocolError("invalid command '".concat(message.command, "', only valid commands are: ").concat(validCommands.join(', '), ")"), data);
    }

    return message;
  }

}

;
exports.ProtocolError = ProtocolError;
exports.Parser = Parser;

},{}],54:[function(require,module,exports){
"use strict";

/* global CSSRule */
const splitUrl = function (url) {
  let hash, index, params;

  if ((index = url.indexOf('#')) >= 0) {
    hash = url.slice(index);
    url = url.slice(0, index);
  } else {
    hash = '';
  } // http://your.domain.com/path/to/combo/??file1.css,file2,css


  const comboSign = url.indexOf('??');

  if (comboSign >= 0) {
    if (comboSign + 1 !== url.lastIndexOf('?')) {
      index = url.lastIndexOf('?');
    }
  } else {
    index = url.indexOf('?');
  }

  if (index >= 0) {
    params = url.slice(index);
    url = url.slice(0, index);
  } else {
    params = '';
  }

  return {
    url,
    params,
    hash
  };
};

const pathFromUrl = function (url) {
  let path;
  ({
    url
  } = splitUrl(url));

  if (url.indexOf('file://') === 0) {
    path = url.replace(new RegExp("^file://(localhost)?"), '');
  } else {
    //                        http  :   // hostname  :8080  /
    path = url.replace(new RegExp("^([^:]+:)?//([^:/]+)(:\\d*)?/"), '/');
  } // decodeURI has special handling of stuff like semicolons, so use decodeURIComponent


  return decodeURIComponent(path);
};

const pickBestMatch = function (path, objects, pathFunc) {
  let score;
  let bestMatch = {
    score: 0
  };

  for (let object of objects) {
    score = numberOfMatchingSegments(path, pathFunc(object));

    if (score > bestMatch.score) {
      bestMatch = {
        object,
        score
      };
    }
  }

  if (bestMatch.score === 0) {
    return null;
  }

  return bestMatch;
};

var numberOfMatchingSegments = function (path1, path2) {
  // get rid of leading slashes and normalize to lower case
  path1 = path1.replace(/^\/+/, '').toLowerCase();
  path2 = path2.replace(/^\/+/, '').toLowerCase();

  if (path1 === path2) {
    return 10000;
  }

  const comps1 = path1.split('/').reverse();
  const comps2 = path2.split('/').reverse();
  const len = Math.min(comps1.length, comps2.length);
  let eqCount = 0;

  while (eqCount < len && comps1[eqCount] === comps2[eqCount]) {
    ++eqCount;
  }

  return eqCount;
};

const pathsMatch = (path1, path2) => numberOfMatchingSegments(path1, path2) > 0;

const IMAGE_STYLES = [{
  selector: 'background',
  styleNames: ['backgroundImage']
}, {
  selector: 'border',
  styleNames: ['borderImage', 'webkitBorderImage', 'MozBorderImage']
}];

class Reloader {
  constructor(window, console, Timer) {
    this.window = window;
    this.console = console;
    this.Timer = Timer;
    this.document = this.window.document;
    this.importCacheWaitPeriod = 200;
    this.plugins = [];
  }

  addPlugin(plugin) {
    return this.plugins.push(plugin);
  }

  analyze(callback) {}

  reload(path, options) {
    this.options = options; // avoid passing it through all the funcs

    if (!this.options.stylesheetReloadTimeout) {
      this.options.stylesheetReloadTimeout = 15000;
    }

    for (let plugin of Array.from(this.plugins)) {
      if (plugin.reload && plugin.reload(path, options)) {
        return;
      }
    }

    if (options.liveCSS && path.match(/\.css(?:\.map)?$/i)) {
      if (this.reloadStylesheet(path)) {
        return;
      }
    }

    if (options.liveImg && path.match(/\.(jpe?g|png|gif)$/i)) {
      this.reloadImages(path);
      return;
    }

    if (options.isChromeExtension) {
      this.reloadChromeExtension();
      return;
    }

    return this.reloadPage();
  }

  reloadPage() {
    return this.window.document.location.reload();
  }

  reloadChromeExtension() {
    return this.window.chrome.runtime.reload();
  }

  reloadImages(path) {
    let img;
    const expando = this.generateUniqueString();

    for (img of Array.from(this.document.images)) {
      if (pathsMatch(path, pathFromUrl(img.src))) {
        img.src = this.generateCacheBustUrl(img.src, expando);
      }
    }

    if (this.document.querySelectorAll) {
      for (let {
        selector,
        styleNames
      } of IMAGE_STYLES) {
        for (img of Array.from(this.document.querySelectorAll("[style*=".concat(selector, "]")))) {
          this.reloadStyleImages(img.style, styleNames, path, expando);
        }
      }
    }

    if (this.document.styleSheets) {
      return Array.from(this.document.styleSheets).map(styleSheet => this.reloadStylesheetImages(styleSheet, path, expando));
    }
  }

  reloadStylesheetImages(styleSheet, path, expando) {
    let rules;

    try {
      rules = (styleSheet || {}).cssRules;
    } catch (e) {}

    if (!rules) {
      return;
    }

    for (let rule of Array.from(rules)) {
      switch (rule.type) {
        case CSSRule.IMPORT_RULE:
          this.reloadStylesheetImages(rule.styleSheet, path, expando);
          break;

        case CSSRule.STYLE_RULE:
          for (let {
            styleNames
          } of IMAGE_STYLES) {
            this.reloadStyleImages(rule.style, styleNames, path, expando);
          }

          break;

        case CSSRule.MEDIA_RULE:
          this.reloadStylesheetImages(rule, path, expando);
          break;
      }
    }
  }

  reloadStyleImages(style, styleNames, path, expando) {
    for (let styleName of styleNames) {
      const value = style[styleName];

      if (typeof value === 'string') {
        const newValue = value.replace(new RegExp("\\burl\\s*\\(([^)]*)\\)"), (match, src) => {
          if (pathsMatch(path, pathFromUrl(src))) {
            return "url(".concat(this.generateCacheBustUrl(src, expando), ")");
          } else {
            return match;
          }
        });

        if (newValue !== value) {
          style[styleName] = newValue;
        }
      }
    }
  }

  reloadStylesheet(path) {
    // has to be a real array, because DOMNodeList will be modified
    let style;
    let link;

    const links = (() => {
      const result = [];

      for (link of Array.from(this.document.getElementsByTagName('link'))) {
        if (link.rel.match(/^stylesheet$/i) && !link.__LiveReload_pendingRemoval) {
          result.push(link);
        }
      }

      return result;
    })(); // find all imported stylesheets


    const imported = [];

    for (style of Array.from(this.document.getElementsByTagName('style'))) {
      if (style.sheet) {
        this.collectImportedStylesheets(style, style.sheet, imported);
      }
    }

    for (link of Array.from(links)) {
      this.collectImportedStylesheets(link, link.sheet, imported);
    } // handle prefixfree


    if (this.window.StyleFix && this.document.querySelectorAll) {
      for (style of Array.from(this.document.querySelectorAll('style[data-href]'))) {
        links.push(style);
      }
    }

    this.console.log("LiveReload found ".concat(links.length, " LINKed stylesheets, ").concat(imported.length, " @imported stylesheets"));
    const match = pickBestMatch(path, links.concat(imported), l => pathFromUrl(this.linkHref(l)));

    if (match) {
      if (match.object.rule) {
        this.console.log("LiveReload is reloading imported stylesheet: ".concat(match.object.href));
        this.reattachImportedRule(match.object);
      } else {
        this.console.log("LiveReload is reloading stylesheet: ".concat(this.linkHref(match.object)));
        this.reattachStylesheetLink(match.object);
      }
    } else {
      if (this.options.reloadMissingCSS) {
        this.console.log("LiveReload will reload all stylesheets because path '".concat(path, "' did not match any specific one. To disable this behavior, set 'options.reloadMissingCSS' to 'false'."));

        for (link of Array.from(links)) {
          this.reattachStylesheetLink(link);
        }
      } else {
        this.console.log("LiveReload will not reload path '".concat(path, "' because the stylesheet was not found on the page and 'options.reloadMissingCSS' was set to 'false'."));
      }
    }

    return true;
  }

  collectImportedStylesheets(link, styleSheet, result) {
    // in WebKit, styleSheet.cssRules is null for inaccessible stylesheets;
    // Firefox/Opera may throw exceptions
    let rules;

    try {
      rules = (styleSheet || {}).cssRules;
    } catch (e) {}

    if (rules && rules.length) {
      for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];

        switch (rule.type) {
          case CSSRule.CHARSET_RULE:
            continue;
          // do nothing

          case CSSRule.IMPORT_RULE:
            result.push({
              link,
              rule,
              index,
              href: rule.href
            });
            this.collectImportedStylesheets(link, rule.styleSheet, result);
            break;

          default:
            break;
          // import rules can only be preceded by charset rules
        }
      }
    }
  }

  waitUntilCssLoads(clone, func) {
    let callbackExecuted = false;

    const executeCallback = () => {
      if (callbackExecuted) {
        return;
      }

      callbackExecuted = true;
      return func();
    }; // supported by Chrome 19+, Safari 5.2+, Firefox 9+, Opera 9+, IE6+
    // http://www.zachleat.com/web/load-css-dynamically/
    // http://pieisgood.org/test/script-link-events/


    clone.onload = () => {
      this.console.log('LiveReload: the new stylesheet has finished loading');
      this.knownToSupportCssOnLoad = true;
      return executeCallback();
    };

    if (!this.knownToSupportCssOnLoad) {
      // polling
      let poll;
      (poll = () => {
        if (clone.sheet) {
          this.console.log('LiveReload is polling until the new CSS finishes loading...');
          return executeCallback();
        } else {
          return this.Timer.start(50, poll);
        }
      })();
    } // fail safe


    return this.Timer.start(this.options.stylesheetReloadTimeout, executeCallback);
  }

  linkHref(link) {
    // prefixfree uses data-href when it turns LINK into STYLE
    return link.href || link.getAttribute('data-href');
  }

  reattachStylesheetLink(link) {
    // ignore LINKs that will be removed by LR soon
    let clone;

    if (link.__LiveReload_pendingRemoval) {
      return;
    }

    link.__LiveReload_pendingRemoval = true;

    if (link.tagName === 'STYLE') {
      // prefixfree
      clone = this.document.createElement('link');
      clone.rel = 'stylesheet';
      clone.media = link.media;
      clone.disabled = link.disabled;
    } else {
      clone = link.cloneNode(false);
    }

    clone.href = this.generateCacheBustUrl(this.linkHref(link)); // insert the new LINK before the old one

    const parent = link.parentNode;

    if (parent.lastChild === link) {
      parent.appendChild(clone);
    } else {
      parent.insertBefore(clone, link.nextSibling);
    }

    return this.waitUntilCssLoads(clone, () => {
      let additionalWaitingTime;

      if (/AppleWebKit/.test(navigator.userAgent)) {
        additionalWaitingTime = 5;
      } else {
        additionalWaitingTime = 200;
      }

      return this.Timer.start(additionalWaitingTime, () => {
        if (!link.parentNode) {
          return;
        }

        link.parentNode.removeChild(link);
        clone.onreadystatechange = null;
        return this.window.StyleFix ? this.window.StyleFix.link(clone) : undefined;
      });
    }); // prefixfree
  }

  reattachImportedRule({
    rule,
    index,
    link
  }) {
    const parent = rule.parentStyleSheet;
    const href = this.generateCacheBustUrl(rule.href);
    const media = rule.media.length ? [].join.call(rule.media, ', ') : '';
    const newRule = "@import url(\"".concat(href, "\") ").concat(media, ";"); // used to detect if reattachImportedRule has been called again on the same rule

    rule.__LiveReload_newHref = href; // WORKAROUND FOR WEBKIT BUG: WebKit resets all styles if we add @import'ed
    // stylesheet that hasn't been cached yet. Workaround is to pre-cache the
    // stylesheet by temporarily adding it as a LINK tag.

    const tempLink = this.document.createElement('link');
    tempLink.rel = 'stylesheet';
    tempLink.href = href;
    tempLink.__LiveReload_pendingRemoval = true; // exclude from path matching

    if (link.parentNode) {
      link.parentNode.insertBefore(tempLink, link);
    } // wait for it to load


    return this.Timer.start(this.importCacheWaitPeriod, () => {
      if (tempLink.parentNode) {
        tempLink.parentNode.removeChild(tempLink);
      } // if another reattachImportedRule call is in progress, abandon this one


      if (rule.__LiveReload_newHref !== href) {
        return;
      }

      parent.insertRule(newRule, index);
      parent.deleteRule(index + 1); // save the new rule, so that we can detect another reattachImportedRule call

      rule = parent.cssRules[index];
      rule.__LiveReload_newHref = href; // repeat again for good measure

      return this.Timer.start(this.importCacheWaitPeriod, () => {
        // if another reattachImportedRule call is in progress, abandon this one
        if (rule.__LiveReload_newHref !== href) {
          return;
        }

        parent.insertRule(newRule, index);
        return parent.deleteRule(index + 1);
      });
    });
  }

  generateUniqueString() {
    return "livereload=".concat(Date.now());
  }

  generateCacheBustUrl(url, expando) {
    let hash, oldParams;

    if (!expando) {
      expando = this.generateUniqueString();
    }

    ({
      url,
      hash,
      params: oldParams
    } = splitUrl(url));

    if (this.options.overrideURL) {
      if (url.indexOf(this.options.serverURL) < 0) {
        const originalUrl = url;
        url = this.options.serverURL + this.options.overrideURL + '?url=' + encodeURIComponent(url);
        this.console.log("LiveReload is overriding source URL ".concat(originalUrl, " with ").concat(url));
      }
    }

    let params = oldParams.replace(/(\?|&)livereload=(\d+)/, (match, sep) => "".concat(sep).concat(expando));

    if (params === oldParams) {
      if (oldParams.length === 0) {
        params = "?".concat(expando);
      } else {
        params = "".concat(oldParams, "&").concat(expando);
      }
    }

    return url + params + hash;
  }

}

;
exports.Reloader = Reloader;

},{}],55:[function(require,module,exports){
"use strict";

const CustomEvents = require('./customevents');

const LiveReload = window.LiveReload = new (require('./livereload').LiveReload)(window);

for (let k in window) {
  if (k.match(/^LiveReloadPlugin/)) {
    LiveReload.addPlugin(window[k]);
  }
}

LiveReload.addPlugin(require('./less'));
LiveReload.on('shutdown', () => delete window.LiveReload);
LiveReload.on('connect', () => CustomEvents.fire(document, 'LiveReloadConnect'));
LiveReload.on('disconnect', () => CustomEvents.fire(document, 'LiveReloadDisconnect'));
CustomEvents.bind(document, 'LiveReloadShutDown', () => LiveReload.shutDown());

},{"./customevents":49,"./less":50,"./livereload":51}],56:[function(require,module,exports){
"use strict";

class Timer {
  constructor(func) {
    this.func = func;
    this.running = false;
    this.id = null;

    this._handler = () => {
      this.running = false;
      this.id = null;
      return this.func();
    };
  }

  start(timeout) {
    if (this.running) {
      clearTimeout(this.id);
    }

    this.id = setTimeout(this._handler, timeout);
    this.running = true;
  }

  stop() {
    if (this.running) {
      clearTimeout(this.id);
      this.running = false;
      this.id = null;
    }
  }

}

;

Timer.start = (timeout, func) => setTimeout(func, timeout);

exports.Timer = Timer;

},{}]},{},[55]);
