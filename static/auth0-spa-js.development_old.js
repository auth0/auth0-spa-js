(function(l, r) {
    if (!l || l.getElementById("livereloadscript")) return;
    r = l.createElement("script");
    r.async = 1;
    r.src = "//" + (self.location.host || "localhost").split(":")[0] + ":35729/livereload.js?snipver=1";
    r.id = "livereloadscript";
    l.getElementsByTagName("head")[0].appendChild(r);
})(self.document);

(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("core-js/es/string/starts-with"), require("core-js/es/symbol"), require("core-js/es/array/from"), require("core-js/es/typed-array/slice"), require("core-js/es/array/includes"), require("core-js/es/string/includes"), require("core-js/es/set"), require("fast-text-encoding"), require("abortcontroller-polyfill/dist/abortcontroller-polyfill-only")) : typeof define === "function" && define.amd ? define([ "exports", "core-js/es/string/starts-with", "core-js/es/symbol", "core-js/es/array/from", "core-js/es/typed-array/slice", "core-js/es/array/includes", "core-js/es/string/includes", "core-js/es/set", "fast-text-encoding", "abortcontroller-polyfill/dist/abortcontroller-polyfill-only" ], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, 
    factory(global.auth0 = {}));
})(this, (function(exports) {
    "use strict";
    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    }
    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
        }
        return t;
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P ? value : new P((function(resolve) {
                resolve(value);
            }));
        }
        return new (P || (P = Promise))((function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        }));
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
        }, f, y, t, g;
        return g = {
            next: verb(0),
            throw: verb(1),
            return: verb(2)
        }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
        }), g;
        function verb(n) {
            return function(v) {
                return step([ n, v ]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
                0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [ op[0] & 2, t.value ];
                switch (op[0]) {
                  case 0:
                  case 1:
                    t = op;
                    break;

                  case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };

                  case 5:
                    _.label++;
                    y = op[1];
                    op = [ 0 ];
                    continue;

                  case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;

                  default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
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
                op = [ 6, e ];
                y = 0;
            } finally {
                f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
                value: op[0] ? op[1] : void 0,
                done: true
            };
        }
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
            e = {
                error: error
            };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            } finally {
                if (e) throw e.error;
            }
        }
        return ar;
    }
    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }
    function finallyConstructor(callback) {
        var constructor = this.constructor;
        return this.then((function(value) {
            return constructor.resolve(callback()).then((function() {
                return value;
            }));
        }), (function(reason) {
            return constructor.resolve(callback()).then((function() {
                return constructor.reject(reason);
            }));
        }));
    }
    function allSettled(arr) {
        var P = this;
        return new P((function(resolve, reject) {
            if (!(arr && typeof arr.length !== "undefined")) {
                return reject(new TypeError(typeof arr + " " + arr + " is not iterable(cannot read property Symbol(Symbol.iterator))"));
            }
            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;
            function res(i, val) {
                if (val && (typeof val === "object" || typeof val === "function")) {
                    var then = val.then;
                    if (typeof then === "function") {
                        then.call(val, (function(val) {
                            res(i, val);
                        }), (function(e) {
                            args[i] = {
                                status: "rejected",
                                reason: e
                            };
                            if (--remaining === 0) {
                                resolve(args);
                            }
                        }));
                        return;
                    }
                }
                args[i] = {
                    status: "fulfilled",
                    value: val
                };
                if (--remaining === 0) {
                    resolve(args);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        }));
    }
    var setTimeoutFunc = setTimeout;
    function isArray(x) {
        return Boolean(x && typeof x.length !== "undefined");
    }
    function noop() {}
    function bind(fn, thisArg) {
        return function() {
            fn.apply(thisArg, arguments);
        };
    }
    function Promise$1(fn) {
        if (!(this instanceof Promise$1)) throw new TypeError("Promises must be constructed via new");
        if (typeof fn !== "function") throw new TypeError("not a function");
        this._state = 0;
        this._handled = false;
        this._value = undefined;
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
        Promise$1._immediateFn((function() {
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
        }));
    }
    function resolve(self, newValue) {
        try {
            if (newValue === self) throw new TypeError("A promise cannot be resolved with itself.");
            if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
                var then = newValue.then;
                if (newValue instanceof Promise$1) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === "function") {
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
            Promise$1._immediateFn((function() {
                if (!self._handled) {
                    Promise$1._unhandledRejectionFn(self._value);
                }
            }));
        }
        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
        this.onRejected = typeof onRejected === "function" ? onRejected : null;
        this.promise = promise;
    }
    function doResolve(fn, self) {
        var done = false;
        try {
            fn((function(value) {
                if (done) return;
                done = true;
                resolve(self, value);
            }), (function(reason) {
                if (done) return;
                done = true;
                reject(self, reason);
            }));
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }
    Promise$1.prototype["catch"] = function(onRejected) {
        return this.then(null, onRejected);
    };
    Promise$1.prototype.then = function(onFulfilled, onRejected) {
        var prom = new this.constructor(noop);
        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };
    Promise$1.prototype["finally"] = finallyConstructor;
    Promise$1.all = function(arr) {
        return new Promise$1((function(resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError("Promise.all accepts an array"));
            }
            var args = Array.prototype.slice.call(arr);
            if (args.length === 0) return resolve([]);
            var remaining = args.length;
            function res(i, val) {
                try {
                    if (val && (typeof val === "object" || typeof val === "function")) {
                        var then = val.then;
                        if (typeof then === "function") {
                            then.call(val, (function(val) {
                                res(i, val);
                            }), reject);
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
        }));
    };
    Promise$1.allSettled = allSettled;
    Promise$1.resolve = function(value) {
        if (value && typeof value === "object" && value.constructor === Promise$1) {
            return value;
        }
        return new Promise$1((function(resolve) {
            resolve(value);
        }));
    };
    Promise$1.reject = function(value) {
        return new Promise$1((function(resolve, reject) {
            reject(value);
        }));
    };
    Promise$1.race = function(arr) {
        return new Promise$1((function(resolve, reject) {
            if (!isArray(arr)) {
                return reject(new TypeError("Promise.race accepts an array"));
            }
            for (var i = 0, len = arr.length; i < len; i++) {
                Promise$1.resolve(arr[i]).then(resolve, reject);
            }
        }));
    };
    Promise$1._immediateFn = typeof setImmediate === "function" && function(fn) {
        setImmediate(fn);
    } || function(fn) {
        setTimeoutFunc(fn, 0);
    };
    Promise$1._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== "undefined" && console) {
            console.warn("Possible Unhandled Promise Rejection:", err);
        }
    };
    var globalNS = function() {
        if (typeof self !== "undefined") {
            return self;
        }
        if (typeof window !== "undefined") {
            return window;
        }
        if (typeof global !== "undefined") {
            return global;
        }
        throw new Error("unable to locate global object");
    }();
    if (typeof globalNS["Promise"] !== "function") {
        globalNS["Promise"] = Promise$1;
    } else {
        if (!globalNS.Promise.prototype["finally"]) {
            globalNS.Promise.prototype["finally"] = finallyConstructor;
        }
        if (!globalNS.Promise.allSettled) {
            globalNS.Promise.allSettled = allSettled;
        }
    }
    var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    function unwrapExports(x) {
        return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
    }
    function createCommonjsModule(fn, module) {
        return module = {
            exports: {}
        }, fn(module, module.exports), module.exports;
    }
    var processLock = createCommonjsModule((function(module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        var ProcessLocking = function() {
            function ProcessLocking() {
                var _this = this;
                this.locked = new Map;
                this.addToLocked = function(key, toAdd) {
                    var callbacks = _this.locked.get(key);
                    if (callbacks === undefined) {
                        if (toAdd === undefined) {
                            _this.locked.set(key, []);
                        } else {
                            _this.locked.set(key, [ toAdd ]);
                        }
                    } else {
                        if (toAdd !== undefined) {
                            callbacks.unshift(toAdd);
                            _this.locked.set(key, callbacks);
                        }
                    }
                };
                this.isLocked = function(key) {
                    return _this.locked.has(key);
                };
                this.lock = function(key) {
                    return new Promise((function(resolve, reject) {
                        if (_this.isLocked(key)) {
                            _this.addToLocked(key, resolve);
                        } else {
                            _this.addToLocked(key);
                            resolve();
                        }
                    }));
                };
                this.unlock = function(key) {
                    var callbacks = _this.locked.get(key);
                    if (callbacks === undefined || callbacks.length === 0) {
                        _this.locked.delete(key);
                        return;
                    }
                    var toCall = callbacks.pop();
                    _this.locked.set(key, callbacks);
                    if (toCall !== undefined) {
                        setTimeout(toCall, 0);
                    }
                };
            }
            ProcessLocking.getInstance = function() {
                if (ProcessLocking.instance === undefined) {
                    ProcessLocking.instance = new ProcessLocking;
                }
                return ProcessLocking.instance;
            };
            return ProcessLocking;
        }();
        function getLock() {
            return ProcessLocking.getInstance();
        }
        exports.default = getLock;
    }));
    unwrapExports(processLock);
    var browserTabsLock = createCommonjsModule((function(module, exports) {
        var __awaiter = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
            return new (P || (P = Promise))((function(resolve, reject) {
                function fulfilled(value) {
                    try {
                        step(generator.next(value));
                    } catch (e) {
                        reject(e);
                    }
                }
                function rejected(value) {
                    try {
                        step(generator["throw"](value));
                    } catch (e) {
                        reject(e);
                    }
                }
                function step(result) {
                    result.done ? resolve(result.value) : new P((function(resolve) {
                        resolve(result.value);
                    })).then(fulfilled, rejected);
                }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
            }));
        };
        var __generator = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body) {
            var _ = {
                label: 0,
                sent: function() {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            }, f, y, t, g;
            return g = {
                next: verb(0),
                throw: verb(1),
                return: verb(2)
            }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
                return this;
            }), g;
            function verb(n) {
                return function(v) {
                    return step([ n, v ]);
                };
            }
            function step(op) {
                if (f) throw new TypeError("Generator is already executing.");
                while (_) try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
                    0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                    if (y = 0, t) op = [ op[0] & 2, t.value ];
                    switch (op[0]) {
                      case 0:
                      case 1:
                        t = op;
                        break;

                      case 4:
                        _.label++;
                        return {
                            value: op[1],
                            done: false
                        };

                      case 5:
                        _.label++;
                        y = op[1];
                        op = [ 0 ];
                        continue;

                      case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;

                      default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
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
                    op = [ 6, e ];
                    y = 0;
                } finally {
                    f = t = 0;
                }
                if (op[0] & 5) throw op[1];
                return {
                    value: op[0] ? op[1] : void 0,
                    done: true
                };
            }
        };
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        var LOCK_STORAGE_KEY = "browser-tabs-lock-key";
        function delay(milliseconds) {
            return new Promise((function(resolve) {
                return setTimeout(resolve, milliseconds);
            }));
        }
        function generateRandomString(length) {
            var CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var randomstring = "";
            for (var i = 0; i < length; i++) {
                var INDEX = Math.floor(Math.random() * CHARS.length);
                randomstring += CHARS[INDEX];
            }
            return randomstring;
        }
        function getLockId() {
            return Date.now().toString() + generateRandomString(15);
        }
        var SuperTokensLock = function() {
            function SuperTokensLock() {
                this.acquiredIatSet = new Set;
                this.id = getLockId();
                this.acquireLock = this.acquireLock.bind(this);
                this.releaseLock = this.releaseLock.bind(this);
                this.releaseLock__private__ = this.releaseLock__private__.bind(this);
                this.waitForSomethingToChange = this.waitForSomethingToChange.bind(this);
                this.refreshLockWhileAcquired = this.refreshLockWhileAcquired.bind(this);
                if (SuperTokensLock.waiters === undefined) {
                    SuperTokensLock.waiters = [];
                }
            }
            SuperTokensLock.prototype.acquireLock = function(lockKey, timeout) {
                if (timeout === void 0) {
                    timeout = 5e3;
                }
                return __awaiter(this, void 0, void 0, (function() {
                    var iat, MAX_TIME, STORAGE_KEY, STORAGE, lockObj, TIMEOUT_KEY, lockObjPostDelay;
                    return __generator(this, (function(_a) {
                        switch (_a.label) {
                          case 0:
                            iat = Date.now() + generateRandomString(4);
                            MAX_TIME = Date.now() + timeout;
                            STORAGE_KEY = LOCK_STORAGE_KEY + "-" + lockKey;
                            STORAGE = window.localStorage;
                            _a.label = 1;

                          case 1:
                            if (!(Date.now() < MAX_TIME)) return [ 3, 8 ];
                            return [ 4, delay(30) ];

                          case 2:
                            _a.sent();
                            lockObj = STORAGE.getItem(STORAGE_KEY);
                            if (!(lockObj === null)) return [ 3, 5 ];
                            TIMEOUT_KEY = this.id + "-" + lockKey + "-" + iat;
                            return [ 4, delay(Math.floor(Math.random() * 25)) ];

                          case 3:
                            _a.sent();
                            STORAGE.setItem(STORAGE_KEY, JSON.stringify({
                                id: this.id,
                                iat: iat,
                                timeoutKey: TIMEOUT_KEY,
                                timeAcquired: Date.now(),
                                timeRefreshed: Date.now()
                            }));
                            return [ 4, delay(30) ];

                          case 4:
                            _a.sent();
                            lockObjPostDelay = STORAGE.getItem(STORAGE_KEY);
                            if (lockObjPostDelay !== null) {
                                lockObjPostDelay = JSON.parse(lockObjPostDelay);
                                if (lockObjPostDelay.id === this.id && lockObjPostDelay.iat === iat) {
                                    this.acquiredIatSet.add(iat);
                                    this.refreshLockWhileAcquired(STORAGE_KEY, iat);
                                    return [ 2, true ];
                                }
                            }
                            return [ 3, 7 ];

                          case 5:
                            SuperTokensLock.lockCorrector();
                            return [ 4, this.waitForSomethingToChange(MAX_TIME) ];

                          case 6:
                            _a.sent();
                            _a.label = 7;

                          case 7:
                            iat = Date.now() + generateRandomString(4);
                            return [ 3, 1 ];

                          case 8:
                            return [ 2, false ];
                        }
                    }));
                }));
            };
            SuperTokensLock.prototype.refreshLockWhileAcquired = function(storageKey, iat) {
                return __awaiter(this, void 0, void 0, (function() {
                    var _this = this;
                    return __generator(this, (function(_a) {
                        setTimeout((function() {
                            return __awaiter(_this, void 0, void 0, (function() {
                                var STORAGE, lockObj;
                                return __generator(this, (function(_a) {
                                    switch (_a.label) {
                                      case 0:
                                        return [ 4, processLock.default().lock(iat) ];

                                      case 1:
                                        _a.sent();
                                        if (!this.acquiredIatSet.has(iat)) {
                                            processLock.default().unlock(iat);
                                            return [ 2 ];
                                        }
                                        STORAGE = window.localStorage;
                                        lockObj = STORAGE.getItem(storageKey);
                                        if (lockObj !== null) {
                                            lockObj = JSON.parse(lockObj);
                                            lockObj.timeRefreshed = Date.now();
                                            STORAGE.setItem(storageKey, JSON.stringify(lockObj));
                                            processLock.default().unlock(iat);
                                        } else {
                                            processLock.default().unlock(iat);
                                            return [ 2 ];
                                        }
                                        this.refreshLockWhileAcquired(storageKey, iat);
                                        return [ 2 ];
                                    }
                                }));
                            }));
                        }), 1e3);
                        return [ 2 ];
                    }));
                }));
            };
            SuperTokensLock.prototype.waitForSomethingToChange = function(MAX_TIME) {
                return __awaiter(this, void 0, void 0, (function() {
                    return __generator(this, (function(_a) {
                        switch (_a.label) {
                          case 0:
                            return [ 4, new Promise((function(resolve) {
                                var resolvedCalled = false;
                                var startedAt = Date.now();
                                var MIN_TIME_TO_WAIT = 50;
                                var removedListeners = false;
                                function stopWaiting() {
                                    if (!removedListeners) {
                                        window.removeEventListener("storage", stopWaiting);
                                        SuperTokensLock.removeFromWaiting(stopWaiting);
                                        clearTimeout(timeOutId);
                                        removedListeners = true;
                                    }
                                    if (!resolvedCalled) {
                                        resolvedCalled = true;
                                        var timeToWait = MIN_TIME_TO_WAIT - (Date.now() - startedAt);
                                        if (timeToWait > 0) {
                                            setTimeout(resolve, timeToWait);
                                        } else {
                                            resolve();
                                        }
                                    }
                                }
                                window.addEventListener("storage", stopWaiting);
                                SuperTokensLock.addToWaiting(stopWaiting);
                                var timeOutId = setTimeout(stopWaiting, Math.max(0, MAX_TIME - Date.now()));
                            })) ];

                          case 1:
                            _a.sent();
                            return [ 2 ];
                        }
                    }));
                }));
            };
            SuperTokensLock.addToWaiting = function(func) {
                this.removeFromWaiting(func);
                if (SuperTokensLock.waiters === undefined) {
                    return;
                }
                SuperTokensLock.waiters.push(func);
            };
            SuperTokensLock.removeFromWaiting = function(func) {
                if (SuperTokensLock.waiters === undefined) {
                    return;
                }
                SuperTokensLock.waiters = SuperTokensLock.waiters.filter((function(i) {
                    return i !== func;
                }));
            };
            SuperTokensLock.notifyWaiters = function() {
                if (SuperTokensLock.waiters === undefined) {
                    return;
                }
                var waiters = SuperTokensLock.waiters.slice();
                waiters.forEach((function(i) {
                    return i();
                }));
            };
            SuperTokensLock.prototype.releaseLock = function(lockKey) {
                return __awaiter(this, void 0, void 0, (function() {
                    return __generator(this, (function(_a) {
                        switch (_a.label) {
                          case 0:
                            return [ 4, this.releaseLock__private__(lockKey) ];

                          case 1:
                            return [ 2, _a.sent() ];
                        }
                    }));
                }));
            };
            SuperTokensLock.prototype.releaseLock__private__ = function(lockKey) {
                return __awaiter(this, void 0, void 0, (function() {
                    var STORAGE, STORAGE_KEY, lockObj;
                    return __generator(this, (function(_a) {
                        switch (_a.label) {
                          case 0:
                            STORAGE = window.localStorage;
                            STORAGE_KEY = LOCK_STORAGE_KEY + "-" + lockKey;
                            lockObj = STORAGE.getItem(STORAGE_KEY);
                            if (lockObj === null) {
                                return [ 2 ];
                            }
                            lockObj = JSON.parse(lockObj);
                            if (!(lockObj.id === this.id)) return [ 3, 2 ];
                            return [ 4, processLock.default().lock(lockObj.iat) ];

                          case 1:
                            _a.sent();
                            this.acquiredIatSet.delete(lockObj.iat);
                            STORAGE.removeItem(STORAGE_KEY);
                            processLock.default().unlock(lockObj.iat);
                            SuperTokensLock.notifyWaiters();
                            _a.label = 2;

                          case 2:
                            return [ 2 ];
                        }
                    }));
                }));
            };
            SuperTokensLock.lockCorrector = function() {
                var MIN_ALLOWED_TIME = Date.now() - 5e3;
                var STORAGE = window.localStorage;
                var KEYS = Object.keys(STORAGE);
                var notifyWaiters = false;
                for (var i = 0; i < KEYS.length; i++) {
                    var LOCK_KEY = KEYS[i];
                    if (LOCK_KEY.includes(LOCK_STORAGE_KEY)) {
                        var lockObj = STORAGE.getItem(LOCK_KEY);
                        if (lockObj !== null) {
                            lockObj = JSON.parse(lockObj);
                            if (lockObj.timeRefreshed === undefined && lockObj.timeAcquired < MIN_ALLOWED_TIME || lockObj.timeRefreshed !== undefined && lockObj.timeRefreshed < MIN_ALLOWED_TIME) {
                                STORAGE.removeItem(LOCK_KEY);
                                notifyWaiters = true;
                            }
                        }
                    }
                }
                if (notifyWaiters) {
                    SuperTokensLock.notifyWaiters();
                }
            };
            SuperTokensLock.waiters = undefined;
            return SuperTokensLock;
        }();
        exports.default = SuperTokensLock;
    }));
    var Lock = unwrapExports(browserTabsLock);
    var version = "1.22.2";
    var DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
    var DEFAULT_POPUP_CONFIG_OPTIONS = {
        timeoutInSeconds: DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
    };
    var DEFAULT_SILENT_TOKEN_RETRY_COUNT = 3;
    var CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = 2;
    var DEFAULT_FETCH_TIMEOUT_MS = 1e4;
    var CACHE_LOCATION_MEMORY = "memory";
    var MISSING_REFRESH_TOKEN_ERROR_MESSAGE = "Missing Refresh Token";
    var INVALID_REFRESH_TOKEN_ERROR_MESSAGE = "invalid refresh token";
    var DEFAULT_SCOPE = "openid profile email";
    var DEFAULT_SESSION_CHECK_EXPIRY_DAYS = 1;
    var DEFAULT_AUTH0_CLIENT = {
        name: "auth0-spa-js",
        version: version
    };
    var DEFAULT_NOW_PROVIDER = function() {
        return Date.now();
    };
    var GenericError = function(_super) {
        __extends(GenericError, _super);
        function GenericError(error, error_description) {
            var _this = _super.call(this, error_description) || this;
            _this.error = error;
            _this.error_description = error_description;
            Object.setPrototypeOf(_this, GenericError.prototype);
            return _this;
        }
        GenericError.fromPayload = function(_a) {
            var error = _a.error, error_description = _a.error_description;
            return new GenericError(error, error_description);
        };
        return GenericError;
    }(Error);
    var AuthenticationError = function(_super) {
        __extends(AuthenticationError, _super);
        function AuthenticationError(error, error_description, state, appState) {
            if (appState === void 0) {
                appState = null;
            }
            var _this = _super.call(this, error, error_description) || this;
            _this.state = state;
            _this.appState = appState;
            Object.setPrototypeOf(_this, AuthenticationError.prototype);
            return _this;
        }
        return AuthenticationError;
    }(GenericError);
    var TimeoutError = function(_super) {
        __extends(TimeoutError, _super);
        function TimeoutError() {
            var _this = _super.call(this, "timeout", "Timeout") || this;
            Object.setPrototypeOf(_this, TimeoutError.prototype);
            return _this;
        }
        return TimeoutError;
    }(GenericError);
    var PopupTimeoutError = function(_super) {
        __extends(PopupTimeoutError, _super);
        function PopupTimeoutError(popup) {
            var _this = _super.call(this) || this;
            _this.popup = popup;
            Object.setPrototypeOf(_this, PopupTimeoutError.prototype);
            return _this;
        }
        return PopupTimeoutError;
    }(TimeoutError);
    var PopupCancelledError = function(_super) {
        __extends(PopupCancelledError, _super);
        function PopupCancelledError(popup) {
            var _this = _super.call(this, "cancelled", "Popup closed") || this;
            _this.popup = popup;
            Object.setPrototypeOf(_this, PopupCancelledError.prototype);
            return _this;
        }
        return PopupCancelledError;
    }(GenericError);
    var MfaRequiredError = function(_super) {
        __extends(MfaRequiredError, _super);
        function MfaRequiredError(error, error_description, mfa_token) {
            var _this = _super.call(this, error, error_description) || this;
            _this.mfa_token = mfa_token;
            Object.setPrototypeOf(_this, MfaRequiredError.prototype);
            return _this;
        }
        return MfaRequiredError;
    }(GenericError);
    var MissingRefreshTokenError = function(_super) {
        __extends(MissingRefreshTokenError, _super);
        function MissingRefreshTokenError(audience, scope) {
            var _this = _super.call(this, "missing_refresh_token", "Missing Refresh Token (audience: '".concat(valueOrEmptyString(audience, [ "default" ]), "', scope: '").concat(valueOrEmptyString(scope), "')")) || this;
            _this.audience = audience;
            _this.scope = scope;
            Object.setPrototypeOf(_this, MissingRefreshTokenError.prototype);
            return _this;
        }
        return MissingRefreshTokenError;
    }(GenericError);
    function valueOrEmptyString(value, exclude) {
        if (exclude === void 0) {
            exclude = [];
        }
        return value && !exclude.includes(value) ? value : "";
    }
    var parseQueryResult = function(queryString) {
        if (queryString.indexOf("#") > -1) {
            queryString = queryString.substr(0, queryString.indexOf("#"));
        }
        var queryParams = queryString.split("&");
        var parsedQuery = {};
        queryParams.forEach((function(qp) {
            var _a = __read(qp.split("="), 2), key = _a[0], val = _a[1];
            parsedQuery[key] = decodeURIComponent(val);
        }));
        if (parsedQuery.expires_in) {
            parsedQuery.expires_in = parseInt(parsedQuery.expires_in);
        }
        return parsedQuery;
    };
    var runIframe = function(authorizeUrl, eventOrigin, timeoutInSeconds) {
        if (timeoutInSeconds === void 0) {
            timeoutInSeconds = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS;
        }
        return new Promise((function(res, rej) {
            var iframe = window.document.createElement("iframe");
            iframe.setAttribute("width", "0");
            iframe.setAttribute("height", "0");
            iframe.style.display = "none";
            var removeIframe = function() {
                if (window.document.body.contains(iframe)) {
                    window.document.body.removeChild(iframe);
                    window.removeEventListener("message", iframeEventHandler, false);
                }
            };
            var iframeEventHandler;
            var timeoutSetTimeoutId = setTimeout((function() {
                rej(new TimeoutError);
                removeIframe();
            }), timeoutInSeconds * 1e3);
            iframeEventHandler = function(e) {
                if (e.origin != eventOrigin) return;
                if (!e.data || e.data.type !== "authorization_response") return;
                var eventSource = e.source;
                if (eventSource) {
                    eventSource.close();
                }
                e.data.response.error ? rej(GenericError.fromPayload(e.data.response)) : res(e.data.response);
                clearTimeout(timeoutSetTimeoutId);
                window.removeEventListener("message", iframeEventHandler, false);
                setTimeout(removeIframe, CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1e3);
            };
            window.addEventListener("message", iframeEventHandler, false);
            window.document.body.appendChild(iframe);
            iframe.setAttribute("src", authorizeUrl);
        }));
    };
    var openPopup = function(url) {
        var width = 400;
        var height = 600;
        var left = window.screenX + (window.innerWidth - width) / 2;
        var top = window.screenY + (window.innerHeight - height) / 2;
        return window.open(url, "auth0:authorize:popup", "left=".concat(left, ",top=").concat(top, ",width=").concat(width, ",height=").concat(height, ",resizable,scrollbars=yes,status=1"));
    };
    var runPopup = function(config) {
        return new Promise((function(resolve, reject) {
            var popupEventListener;
            var popupTimer = setInterval((function() {
                if (config.popup && config.popup.closed) {
                    clearInterval(popupTimer);
                    clearTimeout(timeoutId);
                    window.removeEventListener("message", popupEventListener, false);
                    reject(new PopupCancelledError(config.popup));
                }
            }), 1e3);
            var timeoutId = setTimeout((function() {
                clearInterval(popupTimer);
                reject(new PopupTimeoutError(config.popup));
                window.removeEventListener("message", popupEventListener, false);
            }), (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1e3);
            popupEventListener = function(e) {
                if (!e.data || e.data.type !== "authorization_response") {
                    return;
                }
                clearTimeout(timeoutId);
                clearInterval(popupTimer);
                window.removeEventListener("message", popupEventListener, false);
                config.popup.close();
                if (e.data.response.error) {
                    return reject(GenericError.fromPayload(e.data.response));
                }
                resolve(e.data.response);
            };
            window.addEventListener("message", popupEventListener);
        }));
    };
    var getCrypto = function() {
        return window.crypto;
    };
    var createRandomString = function() {
        var charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.";
        var random = "";
        var randomValues = Array.from(getCrypto().getRandomValues(new Uint8Array(43)));
        randomValues.forEach((function(v) {
            return random += charset[v % charset.length];
        }));
        return random;
    };
    var encode = function(value) {
        return btoa(value);
    };
    var stripUndefined = function(params) {
        return Object.keys(params).filter((function(k) {
            return typeof params[k] !== "undefined";
        })).reduce((function(acc, key) {
            var _a;
            return __assign(__assign({}, acc), (_a = {}, _a[key] = params[key], _a));
        }), {});
    };
    var createQueryParams = function(_a) {
        var client_id = _a.clientId, params = __rest(_a, [ "clientId" ]);
        return new URLSearchParams(stripUndefined(__assign({
            client_id: client_id
        }, params))).toString();
    };
    var sha256 = function(s) {
        return __awaiter(void 0, void 0, void 0, (function() {
            var digestOp;
            return __generator(this, (function(_a) {
                switch (_a.label) {
                  case 0:
                    digestOp = getCrypto().subtle.digest({
                        name: "SHA-256"
                    }, (new TextEncoder).encode(s));
                    return [ 4, digestOp ];

                  case 1:
                    return [ 2, _a.sent() ];
                }
            }));
        }));
    };
    var urlEncodeB64 = function(input) {
        var b64Chars = {
            "+": "-",
            "/": "_",
            "=": ""
        };
        return input.replace(/[+/=]/g, (function(m) {
            return b64Chars[m];
        }));
    };
    var decodeB64 = function(input) {
        return decodeURIComponent(atob(input).split("").map((function(c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })).join(""));
    };
    var urlDecodeB64 = function(input) {
        return decodeB64(input.replace(/_/g, "/").replace(/-/g, "+"));
    };
    var bufferToBase64UrlEncoded = function(input) {
        var ie11SafeInput = new Uint8Array(input);
        return urlEncodeB64(window.btoa(String.fromCharCode.apply(String, __spreadArray([], __read(Array.from(ie11SafeInput)), false))));
    };
    var validateCrypto = function() {
        if (!getCrypto()) {
            throw new Error("For security reasons, `window.crypto` is required to run `auth0-spa-js`.");
        }
        if (typeof getCrypto().subtle === "undefined") {
            throw new Error("\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    ");
        }
    };
    function fetch$1(e, n) {
        return n = n || {}, new Promise((function(t, r) {
            var s = new XMLHttpRequest, o = [], u = [], i = {}, a = function() {
                return {
                    ok: 2 == (s.status / 100 | 0),
                    statusText: s.statusText,
                    status: s.status,
                    url: s.responseURL,
                    text: function() {
                        return Promise.resolve(s.responseText);
                    },
                    json: function() {
                        return Promise.resolve(s.responseText).then(JSON.parse);
                    },
                    blob: function() {
                        return Promise.resolve(new Blob([ s.response ]));
                    },
                    clone: a,
                    headers: {
                        keys: function() {
                            return o;
                        },
                        entries: function() {
                            return u;
                        },
                        get: function(e) {
                            return i[e.toLowerCase()];
                        },
                        has: function(e) {
                            return e.toLowerCase() in i;
                        }
                    }
                };
            };
            for (var l in s.open(n.method || "get", e, !0), s.onload = function() {
                s.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, (function(e, n, t) {
                    o.push(n = n.toLowerCase()), u.push([ n, t ]), i[n] = i[n] ? i[n] + "," + t : t;
                })), t(a());
            }, s.onerror = r, s.withCredentials = "include" == n.credentials, n.headers) s.setRequestHeader(l, n.headers[l]);
            s.send(n.body || null);
        }));
    }
    var sendMessage = function(message, to) {
        return new Promise((function(resolve, reject) {
            var messageChannel = new MessageChannel;
            messageChannel.port1.onmessage = function(event) {
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data);
                }
            };
            to.postMessage(message, [ messageChannel.port2 ]);
        }));
    };
    var createAbortController = function() {
        return new AbortController;
    };
    var dofetch = function(fetchUrl, fetchOptions) {
        return __awaiter(void 0, void 0, void 0, (function() {
            var response;
            var _a;
            return __generator(this, (function(_b) {
                switch (_b.label) {
                  case 0:
                    return [ 4, fetch$1(fetchUrl, fetchOptions) ];

                  case 1:
                    response = _b.sent();
                    _a = {
                        ok: response.ok
                    };
                    return [ 4, response.json() ];

                  case 2:
                    return [ 2, (_a.json = _b.sent(), _a) ];
                }
            }));
        }));
    };
    var fetchWithoutWorker = function(fetchUrl, fetchOptions, timeout) {
        return __awaiter(void 0, void 0, void 0, (function() {
            var controller, timeoutId;
            return __generator(this, (function(_a) {
                controller = createAbortController();
                fetchOptions.signal = controller.signal;
                return [ 2, Promise.race([ dofetch(fetchUrl, fetchOptions), new Promise((function(_, reject) {
                    timeoutId = setTimeout((function() {
                        controller.abort();
                        reject(new Error("Timeout when executing 'fetch'"));
                    }), timeout);
                })) ]).finally((function() {
                    clearTimeout(timeoutId);
                })) ];
            }));
        }));
    };
    var fetchWithWorker = function(fetchUrl, audience, scope, fetchOptions, timeout, worker, useFormData) {
        return __awaiter(void 0, void 0, void 0, (function() {
            return __generator(this, (function(_a) {
                return [ 2, sendMessage({
                    auth: {
                        audience: audience,
                        scope: scope
                    },
                    timeout: timeout,
                    fetchUrl: fetchUrl,
                    fetchOptions: fetchOptions,
                    useFormData: useFormData
                }, worker) ];
            }));
        }));
    };
    var switchFetch = function(fetchUrl, audience, scope, fetchOptions, worker, useFormData, timeout) {
        if (timeout === void 0) {
            timeout = DEFAULT_FETCH_TIMEOUT_MS;
        }
        return __awaiter(void 0, void 0, void 0, (function() {
            return __generator(this, (function(_a) {
                if (worker) {
                    return [ 2, fetchWithWorker(fetchUrl, audience, scope, fetchOptions, timeout, worker, useFormData) ];
                } else {
                    return [ 2, fetchWithoutWorker(fetchUrl, fetchOptions, timeout) ];
                }
            }));
        }));
    };
    function getJSON(url, timeout, audience, scope, options, worker, useFormData) {
        return __awaiter(this, void 0, void 0, (function() {
            var fetchError, response, i, e_1, _a, error, error_description, data, ok, errorMessage;
            return __generator(this, (function(_b) {
                switch (_b.label) {
                  case 0:
                    fetchError = null;
                    i = 0;
                    _b.label = 1;

                  case 1:
                    if (!(i < DEFAULT_SILENT_TOKEN_RETRY_COUNT)) return [ 3, 6 ];
                    _b.label = 2;

                  case 2:
                    _b.trys.push([ 2, 4, , 5 ]);
                    return [ 4, switchFetch(url, audience, scope, options, worker, useFormData, timeout) ];

                  case 3:
                    response = _b.sent();
                    fetchError = null;
                    return [ 3, 6 ];

                  case 4:
                    e_1 = _b.sent();
                    fetchError = e_1;
                    return [ 3, 5 ];

                  case 5:
                    i++;
                    return [ 3, 1 ];

                  case 6:
                    if (fetchError) {
                        fetchError.message = fetchError.message || "Failed to fetch";
                        throw fetchError;
                    }
                    _a = response.json, error = _a.error, error_description = _a.error_description, 
                    data = __rest(_a, [ "error", "error_description" ]), ok = response.ok;
                    if (!ok) {
                        errorMessage = error_description || "HTTP error. Unable to fetch ".concat(url);
                        if (error === "mfa_required") {
                            throw new MfaRequiredError(error, errorMessage, data.mfa_token);
                        }
                        throw new GenericError(error || "request_error", errorMessage);
                    }
                    return [ 2, data ];
                }
            }));
        }));
    }
    function oauthToken(_a, worker) {
        var baseUrl = _a.baseUrl, timeout = _a.timeout, audience = _a.audience, scope = _a.scope, auth0Client = _a.auth0Client, useFormData = _a.useFormData, options = __rest(_a, [ "baseUrl", "timeout", "audience", "scope", "auth0Client", "useFormData" ]);
        return __awaiter(this, void 0, void 0, (function() {
            var body;
            return __generator(this, (function(_b) {
                switch (_b.label) {
                  case 0:
                    body = useFormData ? createQueryParams(options) : JSON.stringify(options);
                    return [ 4, getJSON("".concat(baseUrl, "/oauth/token"), timeout, audience || "default", scope, {
                        method: "POST",
                        body: body,
                        headers: {
                            "Content-Type": useFormData ? "application/x-www-form-urlencoded" : "application/json",
                            "Auth0-Client": btoa(JSON.stringify(auth0Client || DEFAULT_AUTH0_CLIENT))
                        }
                    }, worker, useFormData) ];

                  case 1:
                    return [ 2, _b.sent() ];
                }
            }));
        }));
    }
    var dedupe = function(arr) {
        return Array.from(new Set(arr));
    };
    var getUniqueScopes = function() {
        var scopes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            scopes[_i] = arguments[_i];
        }
        return dedupe(scopes.join(" ").trim().split(/\s+/)).join(" ");
    };
    var CACHE_KEY_PREFIX = "@@auth0spajs@@";
    var CacheKey = function() {
        function CacheKey(data, prefix) {
            if (prefix === void 0) {
                prefix = CACHE_KEY_PREFIX;
            }
            this.prefix = prefix;
            this.clientId = data.clientId;
            this.scope = data.scope;
            this.audience = data.audience;
        }
        CacheKey.prototype.toKey = function() {
            return [ this.prefix, this.clientId, this.audience, this.scope ].filter(Boolean).join("::");
        };
        CacheKey.fromKey = function(key) {
            var _a = __read(key.split("::"), 4), prefix = _a[0], clientId = _a[1], audience = _a[2], scope = _a[3];
            return new CacheKey({
                clientId: clientId,
                scope: scope,
                audience: audience
            }, prefix);
        };
        CacheKey.fromCacheEntry = function(entry) {
            var scope = entry.scope, audience = entry.audience, clientId = entry.client_id;
            return new CacheKey({
                scope: scope,
                audience: audience,
                clientId: clientId
            });
        };
        return CacheKey;
    }();
    var LocalStorageCache = function() {
        function LocalStorageCache() {}
        LocalStorageCache.prototype.set = function(key, entry) {
            localStorage.setItem(key, JSON.stringify(entry));
        };
        LocalStorageCache.prototype.get = function(key) {
            var json = window.localStorage.getItem(key);
            if (!json) return;
            try {
                var payload = JSON.parse(json);
                return payload;
            } catch (e) {
                return;
            }
        };
        LocalStorageCache.prototype.remove = function(key) {
            localStorage.removeItem(key);
        };
        LocalStorageCache.prototype.allKeys = function() {
            return Object.keys(window.localStorage).filter((function(key) {
                return key.startsWith(CACHE_KEY_PREFIX);
            }));
        };
        return LocalStorageCache;
    }();
    var InMemoryCache = function() {
        function InMemoryCache() {
            this.enclosedCache = function() {
                var cache = {};
                return {
                    set: function(key, entry) {
                        cache[key] = entry;
                    },
                    get: function(key) {
                        var cacheEntry = cache[key];
                        if (!cacheEntry) {
                            return;
                        }
                        return cacheEntry;
                    },
                    remove: function(key) {
                        delete cache[key];
                    },
                    allKeys: function() {
                        return Object.keys(cache);
                    }
                };
            }();
        }
        return InMemoryCache;
    }();
    var DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;
    var CacheManager = function() {
        function CacheManager(cache, keyManifest, nowProvider) {
            this.cache = cache;
            this.keyManifest = keyManifest;
            this.nowProvider = nowProvider;
            this.nowProvider = this.nowProvider || DEFAULT_NOW_PROVIDER;
        }
        CacheManager.prototype.get = function(cacheKey, expiryAdjustmentSeconds) {
            var _a;
            if (expiryAdjustmentSeconds === void 0) {
                expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS;
            }
            return __awaiter(this, void 0, void 0, (function() {
                var wrappedEntry, keys, matchedKey, now, nowSeconds;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        return [ 4, this.cache.get(cacheKey.toKey()) ];

                      case 1:
                        wrappedEntry = _b.sent();
                        if (!!wrappedEntry) return [ 3, 4 ];
                        return [ 4, this.getCacheKeys() ];

                      case 2:
                        keys = _b.sent();
                        if (!keys) return [ 2 ];
                        matchedKey = this.matchExistingCacheKey(cacheKey, keys);
                        if (!matchedKey) return [ 3, 4 ];
                        return [ 4, this.cache.get(matchedKey) ];

                      case 3:
                        wrappedEntry = _b.sent();
                        _b.label = 4;

                      case 4:
                        if (!wrappedEntry) {
                            return [ 2 ];
                        }
                        return [ 4, this.nowProvider() ];

                      case 5:
                        now = _b.sent();
                        nowSeconds = Math.floor(now / 1e3);
                        if (!(wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds)) return [ 3, 10 ];
                        if (!wrappedEntry.body.refresh_token) return [ 3, 7 ];
                        wrappedEntry.body = {
                            refresh_token: wrappedEntry.body.refresh_token
                        };
                        return [ 4, this.cache.set(cacheKey.toKey(), wrappedEntry) ];

                      case 6:
                        _b.sent();
                        return [ 2, wrappedEntry.body ];

                      case 7:
                        return [ 4, this.cache.remove(cacheKey.toKey()) ];

                      case 8:
                        _b.sent();
                        return [ 4, (_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.remove(cacheKey.toKey()) ];

                      case 9:
                        _b.sent();
                        return [ 2 ];

                      case 10:
                        return [ 2, wrappedEntry.body ];
                    }
                }));
            }));
        };
        CacheManager.prototype.set = function(entry) {
            var _a;
            return __awaiter(this, void 0, void 0, (function() {
                var cacheKey, wrappedEntry;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        cacheKey = new CacheKey({
                            clientId: entry.client_id,
                            scope: entry.scope,
                            audience: entry.audience
                        });
                        return [ 4, this.wrapCacheEntry(entry) ];

                      case 1:
                        wrappedEntry = _b.sent();
                        return [ 4, this.cache.set(cacheKey.toKey(), wrappedEntry) ];

                      case 2:
                        _b.sent();
                        return [ 4, (_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.add(cacheKey.toKey()) ];

                      case 3:
                        _b.sent();
                        return [ 2 ];
                    }
                }));
            }));
        };
        CacheManager.prototype.clear = function(clientId) {
            var _a;
            return __awaiter(this, void 0, void 0, (function() {
                var keys;
                var _this = this;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        return [ 4, this.getCacheKeys() ];

                      case 1:
                        keys = _b.sent();
                        if (!keys) return [ 2 ];
                        return [ 4, keys.filter((function(key) {
                            return clientId ? key.includes(clientId) : true;
                        })).reduce((function(memo, key) {
                            return __awaiter(_this, void 0, void 0, (function() {
                                return __generator(this, (function(_a) {
                                    switch (_a.label) {
                                      case 0:
                                        return [ 4, memo ];

                                      case 1:
                                        _a.sent();
                                        return [ 4, this.cache.remove(key) ];

                                      case 2:
                                        _a.sent();
                                        return [ 2 ];
                                    }
                                }));
                            }));
                        }), Promise.resolve()) ];

                      case 2:
                        _b.sent();
                        return [ 4, (_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.clear() ];

                      case 3:
                        _b.sent();
                        return [ 2 ];
                    }
                }));
            }));
        };
        CacheManager.prototype.clearSync = function(clientId) {
            var _this = this;
            var keys = this.cache.allKeys();
            if (!keys) return;
            keys.filter((function(key) {
                return clientId ? key.includes(clientId) : true;
            })).forEach((function(key) {
                _this.cache.remove(key);
            }));
        };
        CacheManager.prototype.wrapCacheEntry = function(entry) {
            return __awaiter(this, void 0, void 0, (function() {
                var now, expiresInTime;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.nowProvider() ];

                      case 1:
                        now = _a.sent();
                        expiresInTime = Math.floor(now / 1e3) + entry.expires_in;
                        return [ 2, {
                            body: entry,
                            expiresAt: expiresInTime
                        } ];
                    }
                }));
            }));
        };
        CacheManager.prototype.getCacheKeys = function() {
            var _a;
            return __awaiter(this, void 0, void 0, (function() {
                var _b;
                return __generator(this, (function(_c) {
                    switch (_c.label) {
                      case 0:
                        if (!this.keyManifest) return [ 3, 2 ];
                        return [ 4, this.keyManifest.get() ];

                      case 1:
                        _b = (_a = _c.sent()) === null || _a === void 0 ? void 0 : _a.keys;
                        return [ 3, 4 ];

                      case 2:
                        return [ 4, this.cache.allKeys() ];

                      case 3:
                        _b = _c.sent();
                        _c.label = 4;

                      case 4:
                        return [ 2, _b ];
                    }
                }));
            }));
        };
        CacheManager.prototype.matchExistingCacheKey = function(keyToMatch, allKeys) {
            return allKeys.filter((function(key) {
                var _a;
                var cacheKey = CacheKey.fromKey(key);
                var scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(" "));
                var scopesToMatch = ((_a = keyToMatch.scope) === null || _a === void 0 ? void 0 : _a.split(" ")) || [];
                var hasAllScopes = cacheKey.scope && scopesToMatch.reduce((function(acc, current) {
                    return acc && scopeSet.has(current);
                }), true);
                return cacheKey.prefix === CACHE_KEY_PREFIX && cacheKey.clientId === keyToMatch.clientId && cacheKey.audience === keyToMatch.audience && hasAllScopes;
            }))[0];
        };
        return CacheManager;
    }();
    var TRANSACTION_STORAGE_KEY_PREFIX = "a0.spajs.txs";
    var TransactionManager = function() {
        function TransactionManager(storage, clientId) {
            this.storage = storage;
            this.clientId = clientId;
            this.storageKey = "".concat(TRANSACTION_STORAGE_KEY_PREFIX, ".").concat(this.clientId);
            this.transaction = this.storage.get(this.storageKey);
        }
        TransactionManager.prototype.create = function(transaction) {
            this.transaction = transaction;
            this.storage.save(this.storageKey, transaction, {
                daysUntilExpire: 1
            });
        };
        TransactionManager.prototype.get = function() {
            return this.transaction;
        };
        TransactionManager.prototype.remove = function() {
            delete this.transaction;
            this.storage.remove(this.storageKey);
        };
        return TransactionManager;
    }();
    var isNumber = function(n) {
        return typeof n === "number";
    };
    var idTokendecoded = [ "iss", "aud", "exp", "nbf", "iat", "jti", "azp", "nonce", "auth_time", "at_hash", "c_hash", "acr", "amr", "sub_jwk", "cnf", "sip_from_tag", "sip_date", "sip_callid", "sip_cseq_num", "sip_via_branch", "orig", "dest", "mky", "events", "toe", "txn", "rph", "sid", "vot", "vtm" ];
    var decode = function(token) {
        var parts = token.split(".");
        var _a = __read(parts, 3), header = _a[0], payload = _a[1], signature = _a[2];
        if (parts.length !== 3 || !header || !payload || !signature) {
            throw new Error("ID token could not be decoded");
        }
        var payloadJSON = JSON.parse(urlDecodeB64(payload));
        var claims = {
            __raw: token
        };
        var user = {};
        Object.keys(payloadJSON).forEach((function(k) {
            claims[k] = payloadJSON[k];
            if (!idTokendecoded.includes(k)) {
                user[k] = payloadJSON[k];
            }
        }));
        return {
            encoded: {
                header: header,
                payload: payload,
                signature: signature
            },
            header: JSON.parse(urlDecodeB64(header)),
            claims: claims,
            user: user
        };
    };
    var verify = function(options) {
        if (!options.id_token) {
            throw new Error("ID token is required but missing");
        }
        var decoded = decode(options.id_token);
        if (!decoded.claims.iss) {
            throw new Error("Issuer (iss) claim must be a string present in the ID token");
        }
        if (decoded.claims.iss !== options.iss) {
            throw new Error('Issuer (iss) claim mismatch in the ID token; expected "'.concat(options.iss, '", found "').concat(decoded.claims.iss, '"'));
        }
        if (!decoded.user.sub) {
            throw new Error("Subject (sub) claim must be a string present in the ID token");
        }
        if (decoded.header.alg !== "RS256") {
            throw new Error('Signature algorithm of "'.concat(decoded.header.alg, '" is not supported. Expected the ID token to be signed with "RS256".'));
        }
        if (!decoded.claims.aud || !(typeof decoded.claims.aud === "string" || Array.isArray(decoded.claims.aud))) {
            throw new Error("Audience (aud) claim must be a string or array of strings present in the ID token");
        }
        if (Array.isArray(decoded.claims.aud)) {
            if (!decoded.claims.aud.includes(options.aud)) {
                throw new Error('Audience (aud) claim mismatch in the ID token; expected "'.concat(options.aud, '" but was not one of "').concat(decoded.claims.aud.join(", "), '"'));
            }
            if (decoded.claims.aud.length > 1) {
                if (!decoded.claims.azp) {
                    throw new Error("Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values");
                }
                if (decoded.claims.azp !== options.aud) {
                    throw new Error('Authorized Party (azp) claim mismatch in the ID token; expected "'.concat(options.aud, '", found "').concat(decoded.claims.azp, '"'));
                }
            }
        } else if (decoded.claims.aud !== options.aud) {
            throw new Error('Audience (aud) claim mismatch in the ID token; expected "'.concat(options.aud, '" but found "').concat(decoded.claims.aud, '"'));
        }
        if (options.nonce) {
            if (!decoded.claims.nonce) {
                throw new Error("Nonce (nonce) claim must be a string present in the ID token");
            }
            if (decoded.claims.nonce !== options.nonce) {
                throw new Error('Nonce (nonce) claim mismatch in the ID token; expected "'.concat(options.nonce, '", found "').concat(decoded.claims.nonce, '"'));
            }
        }
        if (options.max_age && !isNumber(decoded.claims.auth_time)) {
            throw new Error("Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified");
        }
        if (!isNumber(decoded.claims.exp)) {
            throw new Error("Expiration Time (exp) claim must be a number present in the ID token");
        }
        if (!isNumber(decoded.claims.iat)) {
            throw new Error("Issued At (iat) claim must be a number present in the ID token");
        }
        var leeway = options.leeway || 60;
        var now = new Date(options.now || Date.now());
        var expDate = new Date(0);
        var nbfDate = new Date(0);
        var authTimeDate = new Date(0);
        authTimeDate.setUTCSeconds(parseInt(decoded.claims.auth_time) + options.max_age + leeway);
        expDate.setUTCSeconds(decoded.claims.exp + leeway);
        nbfDate.setUTCSeconds(decoded.claims.nbf - leeway);
        if (now > expDate) {
            throw new Error("Expiration Time (exp) claim error in the ID token; current time (".concat(now, ") is after expiration time (").concat(expDate, ")"));
        }
        if (isNumber(decoded.claims.nbf) && now < nbfDate) {
            throw new Error("Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Current time (".concat(now, ") is before ").concat(nbfDate));
        }
        if (isNumber(decoded.claims.auth_time) && now > authTimeDate) {
            throw new Error("Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Current time (".concat(now, ") is after last auth at ").concat(authTimeDate));
        }
        if (options.organizationId) {
            if (!decoded.claims.org_id) {
                throw new Error("Organization ID (org_id) claim must be a string present in the ID token");
            } else if (options.organizationId !== decoded.claims.org_id) {
                throw new Error('Organization ID (org_id) claim mismatch in the ID token; expected "'.concat(options.organizationId, '", found "').concat(decoded.claims.org_id, '"'));
            }
        }
        return decoded;
    };
    var esCookie = createCommonjsModule((function(module, exports) {
        var __assign = commonjsGlobal && commonjsGlobal.__assign || function() {
            __assign = Object.assign || function(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
            return __assign.apply(this, arguments);
        };
        exports.__esModule = true;
        function stringifyAttribute(name, value) {
            if (!value) {
                return "";
            }
            var stringified = "; " + name;
            if (value === true) {
                return stringified;
            }
            return stringified + "=" + value;
        }
        function stringifyAttributes(attributes) {
            if (typeof attributes.expires === "number") {
                var expires = new Date;
                expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e5);
                attributes.expires = expires;
            }
            return stringifyAttribute("Expires", attributes.expires ? attributes.expires.toUTCString() : "") + stringifyAttribute("Domain", attributes.domain) + stringifyAttribute("Path", attributes.path) + stringifyAttribute("Secure", attributes.secure) + stringifyAttribute("SameSite", attributes.sameSite);
        }
        function encode(name, value, attributes) {
            return encodeURIComponent(name).replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent).replace(/\(/g, "%28").replace(/\)/g, "%29") + "=" + encodeURIComponent(value).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent) + stringifyAttributes(attributes);
        }
        exports.encode = encode;
        function parse(cookieString) {
            var result = {};
            var cookies = cookieString ? cookieString.split("; ") : [];
            var rdecode = /(%[\dA-F]{2})+/gi;
            for (var i = 0; i < cookies.length; i++) {
                var parts = cookies[i].split("=");
                var cookie = parts.slice(1).join("=");
                if (cookie.charAt(0) === '"') {
                    cookie = cookie.slice(1, -1);
                }
                try {
                    var name_1 = parts[0].replace(rdecode, decodeURIComponent);
                    result[name_1] = cookie.replace(rdecode, decodeURIComponent);
                } catch (e) {}
            }
            return result;
        }
        exports.parse = parse;
        function getAll() {
            return parse(document.cookie);
        }
        exports.getAll = getAll;
        function get(name) {
            return getAll()[name];
        }
        exports.get = get;
        function set(name, value, attributes) {
            document.cookie = encode(name, value, __assign({
                path: "/"
            }, attributes));
        }
        exports.set = set;
        function remove(name, attributes) {
            set(name, "", __assign(__assign({}, attributes), {
                expires: -1
            }));
        }
        exports.remove = remove;
    }));
    unwrapExports(esCookie);
    esCookie.encode;
    esCookie.parse;
    esCookie.getAll;
    var esCookie_4 = esCookie.get;
    var esCookie_5 = esCookie.set;
    var esCookie_6 = esCookie.remove;
    var CookieStorage = {
        get: function(key) {
            var value = esCookie_4(key);
            if (typeof value === "undefined") {
                return;
            }
            return JSON.parse(value);
        },
        save: function(key, value, options) {
            var cookieAttributes = {};
            if ("https:" === window.location.protocol) {
                cookieAttributes = {
                    secure: true,
                    sameSite: "none"
                };
            }
            if (options === null || options === void 0 ? void 0 : options.daysUntilExpire) {
                cookieAttributes.expires = options.daysUntilExpire;
            }
            if (options === null || options === void 0 ? void 0 : options.cookieDomain) {
                cookieAttributes.domain = options.cookieDomain;
            }
            esCookie_5(key, JSON.stringify(value), cookieAttributes);
        },
        remove: function(key) {
            esCookie_6(key);
        }
    };
    var LEGACY_PREFIX = "_legacy_";
    var CookieStorageWithLegacySameSite = {
        get: function(key) {
            var value = CookieStorage.get(key);
            if (value) {
                return value;
            }
            return CookieStorage.get("".concat(LEGACY_PREFIX).concat(key));
        },
        save: function(key, value, options) {
            var cookieAttributes = {};
            if ("https:" === window.location.protocol) {
                cookieAttributes = {
                    secure: true
                };
            }
            if (options === null || options === void 0 ? void 0 : options.daysUntilExpire) {
                cookieAttributes.expires = options.daysUntilExpire;
            }
            esCookie_5("".concat(LEGACY_PREFIX).concat(key), JSON.stringify(value), cookieAttributes);
            CookieStorage.save(key, value, options);
        },
        remove: function(key) {
            CookieStorage.remove(key);
            CookieStorage.remove("".concat(LEGACY_PREFIX).concat(key));
        }
    };
    var SessionStorage = {
        get: function(key) {
            if (typeof sessionStorage === "undefined") {
                return;
            }
            var value = sessionStorage.getItem(key);
            if (typeof value === "undefined") {
                return;
            }
            return JSON.parse(value);
        },
        save: function(key, value) {
            sessionStorage.setItem(key, JSON.stringify(value));
        },
        remove: function(key) {
            sessionStorage.removeItem(key);
        }
    };
    function funcToSource(fn, sourcemapArg) {
        var sourcemap = sourcemapArg === undefined ? null : sourcemapArg;
        var source = fn.toString();
        var lines = source.split("\n");
        lines.pop();
        lines.shift();
        var blankPrefixLength = lines[0].search(/\S/);
        var regex = /(['"])__worker_loader_strict__(['"])/g;
        for (var i = 0, n = lines.length; i < n; ++i) {
            lines[i] = lines[i].substring(blankPrefixLength).replace(regex, "$1use strict$2") + "\n";
        }
        if (sourcemap) {
            lines.push("//# sourceMappingURL=" + sourcemap + "\n");
        }
        return lines;
    }
    function createURL(fn, sourcemapArg) {
        var lines = funcToSource(fn, sourcemapArg);
        var blob = new Blob(lines, {
            type: "application/javascript"
        });
        return URL.createObjectURL(blob);
    }
    function createInlineWorkerFactory(fn, sourcemapArg) {
        var url;
        return function WorkerFactory(options) {
            url = url || createURL(fn, sourcemapArg);
            return new Worker(url, options);
        };
    }
    var WorkerFactory = createInlineWorkerFactory((function() {
        (function() {
            "__worker_loader_strict__";
            var extendStatics = function(d, b) {
                extendStatics = Object.setPrototypeOf || {
                    __proto__: []
                } instanceof Array && function(d, b) {
                    d.__proto__ = b;
                } || function(d, b) {
                    for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
                };
                return extendStatics(d, b);
            };
            function __extends(d, b) {
                if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
                extendStatics(d, b);
                function __() {
                    this.constructor = d;
                }
                d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
            }
            var __assign = function() {
                __assign = Object.assign || function __assign(t) {
                    for (var s, i = 1, n = arguments.length; i < n; i++) {
                        s = arguments[i];
                        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                    }
                    return t;
                };
                return __assign.apply(this, arguments);
            };
            function __rest(s, e) {
                var t = {};
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
                if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
                }
                return t;
            }
            function __awaiter(thisArg, _arguments, P, generator) {
                function adopt(value) {
                    return value instanceof P ? value : new P((function(resolve) {
                        resolve(value);
                    }));
                }
                return new (P || (P = Promise))((function(resolve, reject) {
                    function fulfilled(value) {
                        try {
                            step(generator.next(value));
                        } catch (e) {
                            reject(e);
                        }
                    }
                    function rejected(value) {
                        try {
                            step(generator["throw"](value));
                        } catch (e) {
                            reject(e);
                        }
                    }
                    function step(result) {
                        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
                    }
                    step((generator = generator.apply(thisArg, _arguments || [])).next());
                }));
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
                }, f, y, t, g;
                return g = {
                    next: verb(0),
                    throw: verb(1),
                    return: verb(2)
                }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
                    return this;
                }), g;
                function verb(n) {
                    return function(v) {
                        return step([ n, v ]);
                    };
                }
                function step(op) {
                    if (f) throw new TypeError("Generator is already executing.");
                    while (_) try {
                        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
                        0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                        if (y = 0, t) op = [ op[0] & 2, t.value ];
                        switch (op[0]) {
                          case 0:
                          case 1:
                            t = op;
                            break;

                          case 4:
                            _.label++;
                            return {
                                value: op[1],
                                done: false
                            };

                          case 5:
                            _.label++;
                            y = op[1];
                            op = [ 0 ];
                            continue;

                          case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;

                          default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
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
                        op = [ 6, e ];
                        y = 0;
                    } finally {
                        f = t = 0;
                    }
                    if (op[0] & 5) throw op[1];
                    return {
                        value: op[0] ? op[1] : void 0,
                        done: true
                    };
                }
            }
            function __read(o, n) {
                var m = typeof Symbol === "function" && o[Symbol.iterator];
                if (!m) return o;
                var i = m.call(o), r, ar = [], e;
                try {
                    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
                } catch (error) {
                    e = {
                        error: error
                    };
                } finally {
                    try {
                        if (r && !r.done && (m = i["return"])) m.call(i);
                    } finally {
                        if (e) throw e.error;
                    }
                }
                return ar;
            }
            var GenericError = function(_super) {
                __extends(GenericError, _super);
                function GenericError(error, error_description) {
                    var _this = _super.call(this, error_description) || this;
                    _this.error = error;
                    _this.error_description = error_description;
                    Object.setPrototypeOf(_this, GenericError.prototype);
                    return _this;
                }
                GenericError.fromPayload = function(_a) {
                    var error = _a.error, error_description = _a.error_description;
                    return new GenericError(error, error_description);
                };
                return GenericError;
            }(Error);
            (function(_super) {
                __extends(AuthenticationError, _super);
                function AuthenticationError(error, error_description, state, appState) {
                    if (appState === void 0) {
                        appState = null;
                    }
                    var _this = _super.call(this, error, error_description) || this;
                    _this.state = state;
                    _this.appState = appState;
                    Object.setPrototypeOf(_this, AuthenticationError.prototype);
                    return _this;
                }
                return AuthenticationError;
            })(GenericError);
            var TimeoutError = function(_super) {
                __extends(TimeoutError, _super);
                function TimeoutError() {
                    var _this = _super.call(this, "timeout", "Timeout") || this;
                    Object.setPrototypeOf(_this, TimeoutError.prototype);
                    return _this;
                }
                return TimeoutError;
            }(GenericError);
            (function(_super) {
                __extends(PopupTimeoutError, _super);
                function PopupTimeoutError(popup) {
                    var _this = _super.call(this) || this;
                    _this.popup = popup;
                    Object.setPrototypeOf(_this, PopupTimeoutError.prototype);
                    return _this;
                }
                return PopupTimeoutError;
            })(TimeoutError);
            (function(_super) {
                __extends(PopupCancelledError, _super);
                function PopupCancelledError(popup) {
                    var _this = _super.call(this, "cancelled", "Popup closed") || this;
                    _this.popup = popup;
                    Object.setPrototypeOf(_this, PopupCancelledError.prototype);
                    return _this;
                }
                return PopupCancelledError;
            })(GenericError);
            (function(_super) {
                __extends(MfaRequiredError, _super);
                function MfaRequiredError(error, error_description, mfa_token) {
                    var _this = _super.call(this, error, error_description) || this;
                    _this.mfa_token = mfa_token;
                    Object.setPrototypeOf(_this, MfaRequiredError.prototype);
                    return _this;
                }
                return MfaRequiredError;
            })(GenericError);
            var MissingRefreshTokenError = function(_super) {
                __extends(MissingRefreshTokenError, _super);
                function MissingRefreshTokenError(audience, scope) {
                    var _this = _super.call(this, "missing_refresh_token", "Missing Refresh Token (audience: '".concat(valueOrEmptyString(audience, [ "default" ]), "', scope: '").concat(valueOrEmptyString(scope), "')")) || this;
                    _this.audience = audience;
                    _this.scope = scope;
                    Object.setPrototypeOf(_this, MissingRefreshTokenError.prototype);
                    return _this;
                }
                return MissingRefreshTokenError;
            }(GenericError);
            function valueOrEmptyString(value, exclude) {
                if (exclude === void 0) {
                    exclude = [];
                }
                return value && !exclude.includes(value) ? value : "";
            }
            var stripUndefined = function(params) {
                return Object.keys(params).filter((function(k) {
                    return typeof params[k] !== "undefined";
                })).reduce((function(acc, key) {
                    var _a;
                    return __assign(__assign({}, acc), (_a = {}, _a[key] = params[key], _a));
                }), {});
            };
            var createQueryParams = function(_a) {
                var client_id = _a.clientId, params = __rest(_a, [ "clientId" ]);
                return new URLSearchParams(stripUndefined(__assign({
                    client_id: client_id
                }, params))).toString();
            };
            var refreshTokens = {};
            var cacheKey = function(audience, scope) {
                return "".concat(audience, "|").concat(scope);
            };
            var getRefreshToken = function(audience, scope) {
                return refreshTokens[cacheKey(audience, scope)];
            };
            var setRefreshToken = function(refreshToken, audience, scope) {
                return refreshTokens[cacheKey(audience, scope)] = refreshToken;
            };
            var deleteRefreshToken = function(audience, scope) {
                return delete refreshTokens[cacheKey(audience, scope)];
            };
            var wait = function(time) {
                return new Promise((function(resolve) {
                    return setTimeout(resolve, time);
                }));
            };
            var formDataToObject = function(formData) {
                var queryParams = new URLSearchParams(formData);
                var parsedQuery = {};
                queryParams.forEach((function(val, key) {
                    parsedQuery[key] = val;
                }));
                return parsedQuery;
            };
            var messageHandler = function(_a) {
                var _b = _a.data, timeout = _b.timeout, auth = _b.auth, fetchUrl = _b.fetchUrl, fetchOptions = _b.fetchOptions, useFormData = _b.useFormData, _c = __read(_a.ports, 1), port = _c[0];
                return __awaiter(void 0, void 0, void 0, (function() {
                    var json, _d, audience, scope, body, refreshToken, abortController, response, error_1, error_2;
                    return __generator(this, (function(_e) {
                        switch (_e.label) {
                          case 0:
                            _d = auth || {}, audience = _d.audience, scope = _d.scope;
                            _e.label = 1;

                          case 1:
                            _e.trys.push([ 1, 7, , 8 ]);
                            body = useFormData ? formDataToObject(fetchOptions.body) : JSON.parse(fetchOptions.body);
                            if (!body.refresh_token && body.grant_type === "refresh_token") {
                                refreshToken = getRefreshToken(audience, scope);
                                if (!refreshToken) {
                                    throw new MissingRefreshTokenError(audience, scope);
                                }
                                fetchOptions.body = useFormData ? createQueryParams(__assign(__assign({}, body), {
                                    refresh_token: refreshToken
                                })) : JSON.stringify(__assign(__assign({}, body), {
                                    refresh_token: refreshToken
                                }));
                            }
                            abortController = void 0;
                            if (typeof AbortController === "function") {
                                abortController = new AbortController;
                                fetchOptions.signal = abortController.signal;
                            }
                            response = void 0;
                            _e.label = 2;

                          case 2:
                            _e.trys.push([ 2, 4, , 5 ]);
                            return [ 4, Promise.race([ wait(timeout), fetch(fetchUrl, __assign({}, fetchOptions)) ]) ];

                          case 3:
                            response = _e.sent();
                            return [ 3, 5 ];

                          case 4:
                            error_1 = _e.sent();
                            port.postMessage({
                                error: error_1.message
                            });
                            return [ 2 ];

                          case 5:
                            if (!response) {
                                if (abortController) abortController.abort();
                                port.postMessage({
                                    error: "Timeout when executing 'fetch'"
                                });
                                return [ 2 ];
                            }
                            return [ 4, response.json() ];

                          case 6:
                            json = _e.sent();
                            if (json.refresh_token) {
                                setRefreshToken(json.refresh_token, audience, scope);
                                delete json.refresh_token;
                            } else {
                                deleteRefreshToken(audience, scope);
                            }
                            port.postMessage({
                                ok: response.ok,
                                json: json
                            });
                            return [ 3, 8 ];

                          case 7:
                            error_2 = _e.sent();
                            port.postMessage({
                                ok: false,
                                json: {
                                    error_description: error_2.message
                                }
                            });
                            return [ 3, 8 ];

                          case 8:
                            return [ 2 ];
                        }
                    }));
                }));
            };
            {
                addEventListener("message", messageHandler);
            }
        })();
    }), null);
    var singlePromiseMap = {};
    var singlePromise = function(cb, key) {
        var promise = singlePromiseMap[key];
        if (!promise) {
            promise = cb().finally((function() {
                delete singlePromiseMap[key];
                promise = null;
            }));
            singlePromiseMap[key] = promise;
        }
        return promise;
    };
    var retryPromise = function(cb, maxNumberOfRetries) {
        if (maxNumberOfRetries === void 0) {
            maxNumberOfRetries = 3;
        }
        return __awaiter(void 0, void 0, void 0, (function() {
            var i;
            return __generator(this, (function(_a) {
                switch (_a.label) {
                  case 0:
                    i = 0;
                    _a.label = 1;

                  case 1:
                    if (!(i < maxNumberOfRetries)) return [ 3, 4 ];
                    return [ 4, cb() ];

                  case 2:
                    if (_a.sent()) {
                        return [ 2, true ];
                    }
                    _a.label = 3;

                  case 3:
                    i++;
                    return [ 3, 1 ];

                  case 4:
                    return [ 2, false ];
                }
            }));
        }));
    };
    var CacheKeyManifest = function() {
        function CacheKeyManifest(cache, clientId) {
            this.cache = cache;
            this.clientId = clientId;
            this.manifestKey = this.createManifestKeyFrom(this.clientId);
        }
        CacheKeyManifest.prototype.add = function(key) {
            var _a;
            return __awaiter(this, void 0, void 0, (function() {
                var keys, _b;
                return __generator(this, (function(_c) {
                    switch (_c.label) {
                      case 0:
                        _b = Set.bind;
                        return [ 4, this.cache.get(this.manifestKey) ];

                      case 1:
                        keys = new (_b.apply(Set, [ void 0, ((_a = _c.sent()) === null || _a === void 0 ? void 0 : _a.keys) || [] ]));
                        keys.add(key);
                        return [ 4, this.cache.set(this.manifestKey, {
                            keys: __spreadArray([], __read(keys), false)
                        }) ];

                      case 2:
                        _c.sent();
                        return [ 2 ];
                    }
                }));
            }));
        };
        CacheKeyManifest.prototype.remove = function(key) {
            return __awaiter(this, void 0, void 0, (function() {
                var entry, keys;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.cache.get(this.manifestKey) ];

                      case 1:
                        entry = _a.sent();
                        if (!entry) return [ 3, 5 ];
                        keys = new Set(entry.keys);
                        keys.delete(key);
                        if (!(keys.size > 0)) return [ 3, 3 ];
                        return [ 4, this.cache.set(this.manifestKey, {
                            keys: __spreadArray([], __read(keys), false)
                        }) ];

                      case 2:
                        return [ 2, _a.sent() ];

                      case 3:
                        return [ 4, this.cache.remove(this.manifestKey) ];

                      case 4:
                        return [ 2, _a.sent() ];

                      case 5:
                        return [ 2 ];
                    }
                }));
            }));
        };
        CacheKeyManifest.prototype.get = function() {
            return this.cache.get(this.manifestKey);
        };
        CacheKeyManifest.prototype.clear = function() {
            return this.cache.remove(this.manifestKey);
        };
        CacheKeyManifest.prototype.createManifestKeyFrom = function(clientId) {
            return "".concat(CACHE_KEY_PREFIX, "::").concat(clientId);
        };
        return CacheKeyManifest;
    }();
    var lock = new Lock;
    var GET_TOKEN_SILENTLY_LOCK_KEY = "auth0.lock.getTokenSilently";
    var buildOrganizationHintCookieName = function(clientId) {
        return "auth0.".concat(clientId, ".organization_hint");
    };
    var OLD_IS_AUTHENTICATED_COOKIE_NAME = "auth0.is.authenticated";
    var buildIsAuthenticatedCookieName = function(clientId) {
        return "auth0.".concat(clientId, ".is.authenticated");
    };
    var cacheLocationBuilders = {
        memory: function() {
            return (new InMemoryCache).enclosedCache;
        },
        localstorage: function() {
            return new LocalStorageCache;
        }
    };
    var cacheFactory = function(location) {
        return cacheLocationBuilders[location];
    };
    var getTokenIssuer = function(issuer, domainUrl) {
        if (issuer) {
            return issuer.startsWith("https://") ? issuer : "https://".concat(issuer, "/");
        }
        return "".concat(domainUrl, "/");
    };
    var getDomain = function(domainUrl) {
        if (!/^https?:\/\//.test(domainUrl)) {
            return "https://".concat(domainUrl);
        }
        return domainUrl;
    };
    var getCustomInitialOptions = function(options) {
        options.advancedOptions;
        options.audience;
        options.auth0Client;
        options.authorizeTimeoutInSeconds;
        options.cacheLocation;
        options.cache;
        options.clientId;
        options.domain;
        options.issuer;
        options.leeway;
        options.max_age;
        options.nowProvider;
        options.redirect_uri;
        options.scope;
        options.useRefreshTokens;
        options.useRefreshTokensFallback;
        options.useCookiesForTransactions;
        options.useFormData;
        var customParams = __rest(options, [ "advancedOptions", "audience", "auth0Client", "authorizeTimeoutInSeconds", "cacheLocation", "cache", "clientId", "domain", "issuer", "leeway", "max_age", "nowProvider", "redirect_uri", "scope", "useRefreshTokens", "useRefreshTokensFallback", "useCookiesForTransactions", "useFormData" ]);
        return customParams;
    };
    var Auth0Client = function() {
        function Auth0Client(options) {
            var _a, _b;
            this.defaultOptions = {
                useRefreshTokensFallback: false,
                useFormData: true
            };
            this.options = __assign(__assign({}, this.defaultOptions), options);
            typeof window !== "undefined" && validateCrypto();
            if (options.cache && options.cacheLocation) {
                console.warn("Both `cache` and `cacheLocation` options have been specified in the Auth0Client configuration; ignoring `cacheLocation` and using `cache`.");
            }
            var cache;
            if (options.cache) {
                cache = options.cache;
            } else {
                this.cacheLocation = options.cacheLocation || CACHE_LOCATION_MEMORY;
                if (!cacheFactory(this.cacheLocation)) {
                    throw new Error('Invalid cache location "'.concat(this.cacheLocation, '"'));
                }
                cache = cacheFactory(this.cacheLocation)();
            }
            this.httpTimeoutMs = options.httpTimeoutInSeconds ? options.httpTimeoutInSeconds * 1e3 : DEFAULT_FETCH_TIMEOUT_MS;
            this.cookieStorage = options.legacySameSiteCookie === false ? CookieStorage : CookieStorageWithLegacySameSite;
            this.orgHintCookieName = buildOrganizationHintCookieName(this.options.clientId);
            this.isAuthenticatedCookieName = buildIsAuthenticatedCookieName(this.options.clientId);
            this.sessionCheckExpiryDays = options.sessionCheckExpiryDays || DEFAULT_SESSION_CHECK_EXPIRY_DAYS;
            var transactionStorage = options.useCookiesForTransactions ? this.cookieStorage : SessionStorage;
            this.scope = this.options.scope;
            this.transactionManager = new TransactionManager(transactionStorage, this.options.clientId);
            this.nowProvider = this.options.nowProvider || DEFAULT_NOW_PROVIDER;
            this.cacheManager = new CacheManager(cache, !cache.allKeys ? new CacheKeyManifest(cache, this.options.clientId) : null, this.nowProvider);
            this.domainUrl = getDomain(this.options.domain);
            this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);
            this.defaultScope = getUniqueScopes("openid", ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.advancedOptions) === null || _b === void 0 ? void 0 : _b.defaultScope) !== undefined ? this.options.advancedOptions.defaultScope : DEFAULT_SCOPE);
            if (this.options.useRefreshTokens) {
                this.scope = getUniqueScopes(this.scope, "offline_access");
            }
            if (typeof window !== "undefined" && window.Worker && this.options.useRefreshTokens && this.cacheLocation === CACHE_LOCATION_MEMORY) {
                this.worker = new WorkerFactory;
            }
            this.customOptions = getCustomInitialOptions(options);
        }
        Auth0Client.prototype._url = function(path) {
            var auth0Client = encodeURIComponent(btoa(JSON.stringify(this.options.auth0Client || DEFAULT_AUTH0_CLIENT)));
            return "".concat(this.domainUrl).concat(path, "&auth0Client=").concat(auth0Client);
        };
        Auth0Client.prototype._getParams = function(authorizeOptions, state, nonce, code_challenge, redirect_uri) {
            var _a = this.options;
            _a.useRefreshTokens;
            _a.useCookiesForTransactions;
            _a.useFormData;
            _a.auth0Client;
            _a.cacheLocation;
            _a.advancedOptions;
            _a.detailedResponse;
            _a.nowProvider;
            _a.authorizeTimeoutInSeconds;
            _a.legacySameSiteCookie;
            _a.sessionCheckExpiryDays;
            _a.domain;
            _a.leeway;
            _a.httpTimeoutInSeconds;
            _a.useRefreshTokensFallback;
            var loginOptions = __rest(_a, [ "useRefreshTokens", "useCookiesForTransactions", "useFormData", "auth0Client", "cacheLocation", "advancedOptions", "detailedResponse", "nowProvider", "authorizeTimeoutInSeconds", "legacySameSiteCookie", "sessionCheckExpiryDays", "domain", "leeway", "httpTimeoutInSeconds", "useRefreshTokensFallback" ]);
            return __assign(__assign(__assign({}, loginOptions), authorizeOptions), {
                scope: getUniqueScopes(this.defaultScope, this.scope, authorizeOptions.scope),
                response_type: "code",
                response_mode: "query",
                state: state,
                nonce: nonce,
                redirect_uri: redirect_uri || this.options.redirect_uri,
                code_challenge: code_challenge,
                code_challenge_method: "S256"
            });
        };
        Auth0Client.prototype._authorizeUrl = function(authorizeOptions) {
            return this._url("/authorize?".concat(createQueryParams(authorizeOptions)));
        };
        Auth0Client.prototype._verifyIdToken = function(id_token, nonce, organizationId) {
            return __awaiter(this, void 0, void 0, (function() {
                var now;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.nowProvider() ];

                      case 1:
                        now = _a.sent();
                        return [ 2, verify({
                            iss: this.tokenIssuer,
                            aud: this.options.clientId,
                            id_token: id_token,
                            nonce: nonce,
                            organizationId: organizationId,
                            leeway: this.options.leeway,
                            max_age: this._parseNumber(this.options.max_age),
                            now: now
                        }) ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._parseNumber = function(value) {
            if (typeof value !== "string") {
                return value;
            }
            return parseInt(value, 10) || undefined;
        };
        Auth0Client.prototype._processOrgIdHint = function(organizationId) {
            if (organizationId) {
                this.cookieStorage.save(this.orgHintCookieName, organizationId, {
                    daysUntilExpire: this.sessionCheckExpiryDays,
                    cookieDomain: this.options.cookieDomain
                });
            } else {
                this.cookieStorage.remove(this.orgHintCookieName);
            }
        };
        Auth0Client.prototype.buildAuthorizeUrl = function(options) {
            if (options === void 0) {
                options = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var url;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this._prepareAuthorizeUrl(options) ];

                      case 1:
                        url = _a.sent().url;
                        return [ 2, url ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._prepareAuthorizeUrl = function(options) {
            if (options === void 0) {
                options = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var redirect_uri, appState, authorizeOptions, state, nonce, code_verifier, code_challengeBuffer, code_challenge, fragment, params, url;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        redirect_uri = options.redirect_uri, appState = options.appState, authorizeOptions = __rest(options, [ "redirect_uri", "appState" ]);
                        state = encode(createRandomString());
                        nonce = encode(createRandomString());
                        code_verifier = createRandomString();
                        return [ 4, sha256(code_verifier) ];

                      case 1:
                        code_challengeBuffer = _a.sent();
                        code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
                        fragment = options.fragment ? "#".concat(options.fragment) : "";
                        params = this._getParams(authorizeOptions, state, nonce, code_challenge, redirect_uri);
                        url = this._authorizeUrl(params);
                        return [ 2, {
                            nonce: nonce,
                            code_verifier: code_verifier,
                            appState: appState,
                            scope: params.scope,
                            audience: params.audience || "default",
                            redirect_uri: params.redirect_uri,
                            state: state,
                            url: url + fragment
                        } ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.loginWithPopup = function(options, config) {
            return __awaiter(this, void 0, void 0, (function() {
                var authorizeOptions, stateIn, nonceIn, code_verifier, code_challengeBuffer, code_challenge, params, url, codeResult, authResult, organizationId, decodedToken, cacheEntry;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        options = options || {};
                        config = config || {};
                        if (!config.popup) {
                            config.popup = openPopup("");
                            if (!config.popup) {
                                throw new Error("Unable to open a popup for loginWithPopup - window.open returned `null`");
                            }
                        }
                        authorizeOptions = __rest(options, []);
                        stateIn = encode(createRandomString());
                        nonceIn = encode(createRandomString());
                        code_verifier = createRandomString();
                        return [ 4, sha256(code_verifier) ];

                      case 1:
                        code_challengeBuffer = _a.sent();
                        code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
                        params = this._getParams(authorizeOptions, stateIn, nonceIn, code_challenge, this.options.redirect_uri || window.location.origin);
                        url = this._authorizeUrl(__assign(__assign({}, params), {
                            response_mode: "web_message"
                        }));
                        config.popup.location.href = url;
                        return [ 4, runPopup(__assign(__assign({}, config), {
                            timeoutInSeconds: config.timeoutInSeconds || this.options.authorizeTimeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
                        })) ];

                      case 2:
                        codeResult = _a.sent();
                        if (stateIn !== codeResult.state) {
                            throw new Error("Invalid state");
                        }
                        return [ 4, oauthToken({
                            audience: params.audience,
                            scope: params.scope,
                            baseUrl: this.domainUrl,
                            client_id: this.options.clientId,
                            code_verifier: code_verifier,
                            code: codeResult.code,
                            grant_type: "authorization_code",
                            redirect_uri: params.redirect_uri,
                            auth0Client: this.options.auth0Client,
                            useFormData: this.options.useFormData,
                            timeout: this.httpTimeoutMs
                        }, this.worker) ];

                      case 3:
                        authResult = _a.sent();
                        organizationId = options.organization || this.options.organization;
                        return [ 4, this._verifyIdToken(authResult.id_token, nonceIn, organizationId) ];

                      case 4:
                        decodedToken = _a.sent();
                        cacheEntry = __assign(__assign({}, authResult), {
                            decodedToken: decodedToken,
                            scope: params.scope,
                            audience: params.audience || "default",
                            client_id: this.options.clientId
                        });
                        return [ 4, this._saveEntryInCache(cacheEntry) ];

                      case 5:
                        _a.sent();
                        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                            daysUntilExpire: this.sessionCheckExpiryDays,
                            cookieDomain: this.options.cookieDomain
                        });
                        this._processOrgIdHint(decodedToken.claims.org_id);
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.getUser = function() {
            return __awaiter(this, void 0, void 0, (function() {
                var audience, scope, cache;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        audience = this.options.audience || "default";
                        scope = getUniqueScopes(this.defaultScope, this.scope);
                        return [ 4, this.cacheManager.get(new CacheKey({
                            clientId: this.options.clientId,
                            audience: audience,
                            scope: scope
                        })) ];

                      case 1:
                        cache = _a.sent();
                        return [ 2, cache && cache.decodedToken && cache.decodedToken.user ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.getIdTokenClaims = function() {
            return __awaiter(this, void 0, void 0, (function() {
                var audience, scope, cache;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        audience = this.options.audience || "default";
                        scope = getUniqueScopes(this.defaultScope, this.scope);
                        return [ 4, this.cacheManager.get(new CacheKey({
                            clientId: this.options.clientId,
                            audience: audience,
                            scope: scope
                        })) ];

                      case 1:
                        cache = _a.sent();
                        return [ 2, cache && cache.decodedToken && cache.decodedToken.claims ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.loginWithRedirect = function(options) {
            if (options === void 0) {
                options = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var onRedirect, urlOptions, organizationId, _a, url, transaction;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        onRedirect = options.onRedirect, urlOptions = __rest(options, [ "onRedirect" ]);
                        organizationId = urlOptions.organization || this.options.organization;
                        return [ 4, this._prepareAuthorizeUrl(urlOptions) ];

                      case 1:
                        _a = _b.sent(), url = _a.url, transaction = __rest(_a, [ "url" ]);
                        this.transactionManager.create(__assign(__assign({}, transaction), organizationId && {
                            organizationId: organizationId
                        }));
                        if (!onRedirect) return [ 3, 3 ];
                        return [ 4, onRedirect(url) ];

                      case 2:
                        _b.sent();
                        return [ 3, 4 ];

                      case 3:
                        window.location.assign(url);
                        _b.label = 4;

                      case 4:
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.handleRedirectCallback = function(url) {
            if (url === void 0) {
                url = window.location.href;
            }
            return __awaiter(this, void 0, void 0, (function() {
                var queryStringFragments, _a, state, code, error, error_description, transaction, tokenOptions, authResult, decodedToken;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        queryStringFragments = url.split("?").slice(1);
                        if (queryStringFragments.length === 0) {
                            throw new Error("There are no query params available for parsing.");
                        }
                        _a = parseQueryResult(queryStringFragments.join("")), state = _a.state, code = _a.code, 
                        error = _a.error, error_description = _a.error_description;
                        transaction = this.transactionManager.get();
                        if (!transaction) {
                            throw new Error("Invalid state");
                        }
                        this.transactionManager.remove();
                        if (error) {
                            throw new AuthenticationError(error, error_description, state, transaction.appState);
                        }
                        if (!transaction.code_verifier || transaction.state && transaction.state !== state) {
                            throw new Error("Invalid state");
                        }
                        tokenOptions = {
                            audience: transaction.audience,
                            scope: transaction.scope,
                            baseUrl: this.domainUrl,
                            client_id: this.options.clientId,
                            code_verifier: transaction.code_verifier,
                            grant_type: "authorization_code",
                            code: code,
                            auth0Client: this.options.auth0Client,
                            useFormData: this.options.useFormData,
                            timeout: this.httpTimeoutMs
                        };
                        if (undefined !== transaction.redirect_uri) {
                            tokenOptions.redirect_uri = transaction.redirect_uri;
                        }
                        return [ 4, oauthToken(tokenOptions, this.worker) ];

                      case 1:
                        authResult = _b.sent();
                        return [ 4, this._verifyIdToken(authResult.id_token, transaction.nonce, transaction.organizationId) ];

                      case 2:
                        decodedToken = _b.sent();
                        return [ 4, this._saveEntryInCache(__assign(__assign(__assign(__assign({}, authResult), {
                            decodedToken: decodedToken,
                            audience: transaction.audience,
                            scope: transaction.scope
                        }), authResult.scope ? {
                            oauthTokenScope: authResult.scope
                        } : null), {
                            client_id: this.options.clientId
                        })) ];

                      case 3:
                        _b.sent();
                        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                            daysUntilExpire: this.sessionCheckExpiryDays,
                            cookieDomain: this.options.cookieDomain
                        });
                        this._processOrgIdHint(decodedToken.claims.org_id);
                        return [ 2, {
                            appState: transaction.appState
                        } ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.checkSession = function(options) {
            return __awaiter(this, void 0, void 0, (function() {
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        if (!this.cookieStorage.get(this.isAuthenticatedCookieName)) {
                            if (!this.cookieStorage.get(OLD_IS_AUTHENTICATED_COOKIE_NAME)) {
                                return [ 2 ];
                            } else {
                                this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                                    daysUntilExpire: this.sessionCheckExpiryDays,
                                    cookieDomain: this.options.cookieDomain
                                });
                                this.cookieStorage.remove(OLD_IS_AUTHENTICATED_COOKIE_NAME);
                            }
                        }
                        _a.label = 1;

                      case 1:
                        _a.trys.push([ 1, 3, , 4 ]);
                        return [ 4, this.getTokenSilently(options) ];

                      case 2:
                        _a.sent();
                        return [ 3, 4 ];

                      case 3:
                        _a.sent();
                        return [ 3, 4 ];

                      case 4:
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.getTokenSilently = function(options) {
            if (options === void 0) {
                options = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var _a, cacheMode, getTokenOptions;
                var _this = this;
                return __generator(this, (function(_b) {
                    _a = __assign(__assign({
                        audience: this.options.audience,
                        cacheMode: "on"
                    }, options), {
                        scope: getUniqueScopes(this.defaultScope, this.scope, options.scope)
                    }), cacheMode = _a.cacheMode, getTokenOptions = __rest(_a, [ "cacheMode" ]);
                    return [ 2, singlePromise((function() {
                        return _this._getTokenSilently(__assign({
                            cacheMode: cacheMode
                        }, getTokenOptions));
                    }), "".concat(this.options.clientId, "::").concat(getTokenOptions.audience, "::").concat(getTokenOptions.scope)) ];
                }));
            }));
        };
        Auth0Client.prototype._getTokenSilently = function(options) {
            if (options === void 0) {
                options = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var cacheMode, getTokenOptions, entry, entry, authResult, _a, id_token, access_token, oauthTokenScope, expires_in;
                return __generator(this, (function(_b) {
                    switch (_b.label) {
                      case 0:
                        cacheMode = options.cacheMode, getTokenOptions = __rest(options, [ "cacheMode" ]);
                        if (!(cacheMode !== "off")) return [ 3, 2 ];
                        return [ 4, this._getEntryFromCache({
                            scope: getTokenOptions.scope,
                            audience: getTokenOptions.audience || "default",
                            clientId: this.options.clientId,
                            getDetailedEntry: options.detailedResponse
                        }) ];

                      case 1:
                        entry = _b.sent();
                        if (entry) {
                            return [ 2, entry ];
                        }
                        _b.label = 2;

                      case 2:
                        if (cacheMode === "cache-only") {
                            return [ 2 ];
                        }
                        return [ 4, retryPromise((function() {
                            return lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5e3);
                        }), 10) ];

                      case 3:
                        if (!_b.sent()) return [ 3, 15 ];
                        _b.label = 4;

                      case 4:
                        _b.trys.push([ 4, , 12, 14 ]);
                        if (!(cacheMode !== "off")) return [ 3, 6 ];
                        return [ 4, this._getEntryFromCache({
                            scope: getTokenOptions.scope,
                            audience: getTokenOptions.audience || "default",
                            clientId: this.options.clientId,
                            getDetailedEntry: options.detailedResponse
                        }) ];

                      case 5:
                        entry = _b.sent();
                        if (entry) {
                            return [ 2, entry ];
                        }
                        _b.label = 6;

                      case 6:
                        if (!this.options.useRefreshTokens) return [ 3, 8 ];
                        return [ 4, this._getTokenUsingRefreshToken(getTokenOptions) ];

                      case 7:
                        _a = _b.sent();
                        return [ 3, 10 ];

                      case 8:
                        return [ 4, this._getTokenFromIFrame(getTokenOptions) ];

                      case 9:
                        _a = _b.sent();
                        _b.label = 10;

                      case 10:
                        authResult = _a;
                        return [ 4, this._saveEntryInCache(__assign({
                            client_id: this.options.clientId
                        }, authResult)) ];

                      case 11:
                        _b.sent();
                        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                            daysUntilExpire: this.sessionCheckExpiryDays,
                            cookieDomain: this.options.cookieDomain
                        });
                        if (options.detailedResponse) {
                            id_token = authResult.id_token, access_token = authResult.access_token, oauthTokenScope = authResult.oauthTokenScope, 
                            expires_in = authResult.expires_in;
                            return [ 2, __assign(__assign({
                                id_token: id_token,
                                access_token: access_token
                            }, oauthTokenScope ? {
                                scope: oauthTokenScope
                            } : null), {
                                expires_in: expires_in
                            }) ];
                        }
                        return [ 2, authResult.access_token ];

                      case 12:
                        return [ 4, lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY) ];

                      case 13:
                        _b.sent();
                        return [ 7 ];

                      case 14:
                        return [ 3, 16 ];

                      case 15:
                        throw new TimeoutError;

                      case 16:
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.getTokenWithPopup = function(options, config) {
            if (options === void 0) {
                options = {};
            }
            if (config === void 0) {
                config = {};
            }
            return __awaiter(this, void 0, void 0, (function() {
                var cache;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        options.audience = options.audience || this.options.audience;
                        options.scope = getUniqueScopes(this.defaultScope, this.scope, options.scope);
                        config = __assign(__assign({}, DEFAULT_POPUP_CONFIG_OPTIONS), config);
                        return [ 4, this.loginWithPopup(options, config) ];

                      case 1:
                        _a.sent();
                        return [ 4, this.cacheManager.get(new CacheKey({
                            scope: options.scope,
                            audience: options.audience || "default",
                            clientId: this.options.clientId
                        })) ];

                      case 2:
                        cache = _a.sent();
                        return [ 2, cache.access_token ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.isAuthenticated = function() {
            return __awaiter(this, void 0, void 0, (function() {
                var user;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.getUser() ];

                      case 1:
                        user = _a.sent();
                        return [ 2, !!user ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.buildLogoutUrl = function(options) {
            if (options === void 0) {
                options = {};
            }
            if (options.clientId !== null) {
                options.clientId = options.clientId || this.options.clientId;
            } else {
                delete options.clientId;
            }
            var federated = options.federated, logoutOptions = __rest(options, [ "federated" ]);
            var federatedQuery = federated ? "&federated" : "";
            var url = this._url("/v2/logout?".concat(createQueryParams(logoutOptions)));
            return url + federatedQuery;
        };
        Auth0Client.prototype.logout = function(options) {
            var _this = this;
            if (options === void 0) {
                options = {};
            }
            var localOnly = options.localOnly, logoutOptions = __rest(options, [ "localOnly" ]);
            if (localOnly && logoutOptions.federated) {
                throw new Error("It is invalid to set both the `federated` and `localOnly` options to `true`");
            }
            var postCacheClear = function() {
                _this.cookieStorage.remove(_this.orgHintCookieName);
                _this.cookieStorage.remove(_this.isAuthenticatedCookieName);
                if (localOnly) {
                    return;
                }
                var url = _this.buildLogoutUrl(logoutOptions);
                window.location.assign(url);
            };
            if (this.options.cache) {
                return this.cacheManager.clear().then((function() {
                    return postCacheClear();
                }));
            } else {
                this.cacheManager.clearSync();
                postCacheClear();
            }
        };
        Auth0Client.prototype._getTokenFromIFrame = function(options) {
            return __awaiter(this, void 0, void 0, (function() {
                var stateIn, nonceIn, code_verifier, code_challengeBuffer, code_challenge, withoutClientOptions, params, orgIdHint, url, authorizeTimeout, codeResult, scope, audience, customOptions, tokenResult, decodedToken, e_1;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        stateIn = encode(createRandomString());
                        nonceIn = encode(createRandomString());
                        code_verifier = createRandomString();
                        return [ 4, sha256(code_verifier) ];

                      case 1:
                        code_challengeBuffer = _a.sent();
                        code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
                        options.detailedResponse, withoutClientOptions = __rest(options, [ "detailedResponse" ]);
                        params = this._getParams(withoutClientOptions, stateIn, nonceIn, code_challenge, options.redirect_uri || this.options.redirect_uri || window.location.origin);
                        orgIdHint = this.cookieStorage.get(this.orgHintCookieName);
                        if (orgIdHint && !params.organization) {
                            params.organization = orgIdHint;
                        }
                        url = this._authorizeUrl(__assign(__assign({}, params), {
                            prompt: "none",
                            response_mode: "web_message"
                        }));
                        _a.label = 2;

                      case 2:
                        _a.trys.push([ 2, 6, , 7 ]);
                        if (window.crossOriginIsolated) {
                            throw new GenericError("login_required", "The application is running in a Cross-Origin Isolated context, silently retrieving a token without refresh token is not possible.");
                        }
                        authorizeTimeout = options.timeoutInSeconds || this.options.authorizeTimeoutInSeconds;
                        return [ 4, runIframe(url, this.domainUrl, authorizeTimeout) ];

                      case 3:
                        codeResult = _a.sent();
                        if (stateIn !== codeResult.state) {
                            throw new Error("Invalid state");
                        }
                        scope = options.scope, audience = options.audience, options.redirect_uri, options.cacheMode, 
                        options.timeoutInSeconds, options.detailedResponse, customOptions = __rest(options, [ "scope", "audience", "redirect_uri", "cacheMode", "timeoutInSeconds", "detailedResponse" ]);
                        return [ 4, oauthToken(__assign(__assign(__assign({}, this.customOptions), customOptions), {
                            scope: scope,
                            audience: audience,
                            baseUrl: this.domainUrl,
                            client_id: this.options.clientId,
                            code_verifier: code_verifier,
                            code: codeResult.code,
                            grant_type: "authorization_code",
                            redirect_uri: params.redirect_uri,
                            auth0Client: this.options.auth0Client,
                            useFormData: this.options.useFormData,
                            timeout: customOptions.timeout || this.httpTimeoutMs
                        }), this.worker) ];

                      case 4:
                        tokenResult = _a.sent();
                        return [ 4, this._verifyIdToken(tokenResult.id_token, nonceIn) ];

                      case 5:
                        decodedToken = _a.sent();
                        this._processOrgIdHint(decodedToken.claims.org_id);
                        return [ 2, __assign(__assign({}, tokenResult), {
                            decodedToken: decodedToken,
                            scope: params.scope,
                            oauthTokenScope: tokenResult.scope,
                            audience: params.audience || "default"
                        }) ];

                      case 6:
                        e_1 = _a.sent();
                        if (e_1.error === "login_required") {
                            this.logout({
                                localOnly: true
                            });
                        }
                        throw e_1;

                      case 7:
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._getTokenUsingRefreshToken = function(options) {
            return __awaiter(this, void 0, void 0, (function() {
                var cache, redirect_uri, tokenResult, scope, audience, customOptions, timeout, e_2, decodedToken;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        options.scope = getUniqueScopes(this.defaultScope, this.options.scope, options.scope);
                        return [ 4, this.cacheManager.get(new CacheKey({
                            scope: options.scope,
                            audience: options.audience || "default",
                            clientId: this.options.clientId
                        })) ];

                      case 1:
                        cache = _a.sent();
                        if (!((!cache || !cache.refresh_token) && !this.worker)) return [ 3, 4 ];
                        if (!this.options.useRefreshTokensFallback) return [ 3, 3 ];
                        return [ 4, this._getTokenFromIFrame(options) ];

                      case 2:
                        return [ 2, _a.sent() ];

                      case 3:
                        throw new MissingRefreshTokenError(options.audience || "default", options.scope);

                      case 4:
                        redirect_uri = options.redirect_uri || this.options.redirect_uri || window.location.origin;
                        scope = options.scope, audience = options.audience, options.cacheMode, options.timeoutInSeconds, 
                        options.detailedResponse, customOptions = __rest(options, [ "scope", "audience", "cacheMode", "timeoutInSeconds", "detailedResponse" ]);
                        timeout = typeof options.timeoutInSeconds === "number" ? options.timeoutInSeconds * 1e3 : null;
                        _a.label = 5;

                      case 5:
                        _a.trys.push([ 5, 7, , 10 ]);
                        return [ 4, oauthToken(__assign(__assign(__assign(__assign(__assign({}, this.customOptions), customOptions), {
                            audience: audience,
                            scope: scope,
                            baseUrl: this.domainUrl,
                            client_id: this.options.clientId,
                            grant_type: "refresh_token",
                            refresh_token: cache && cache.refresh_token,
                            redirect_uri: redirect_uri
                        }), timeout && {
                            timeout: timeout
                        }), {
                            auth0Client: this.options.auth0Client,
                            useFormData: this.options.useFormData,
                            timeout: this.httpTimeoutMs
                        }), this.worker) ];

                      case 6:
                        tokenResult = _a.sent();
                        return [ 3, 10 ];

                      case 7:
                        e_2 = _a.sent();
                        if (!((e_2.message.indexOf(MISSING_REFRESH_TOKEN_ERROR_MESSAGE) > -1 || e_2.message && e_2.message.indexOf(INVALID_REFRESH_TOKEN_ERROR_MESSAGE) > -1) && this.options.useRefreshTokensFallback)) return [ 3, 9 ];
                        return [ 4, this._getTokenFromIFrame(options) ];

                      case 8:
                        return [ 2, _a.sent() ];

                      case 9:
                        throw e_2;

                      case 10:
                        return [ 4, this._verifyIdToken(tokenResult.id_token) ];

                      case 11:
                        decodedToken = _a.sent();
                        return [ 2, __assign(__assign({}, tokenResult), {
                            decodedToken: decodedToken,
                            scope: options.scope,
                            oauthTokenScope: tokenResult.scope,
                            audience: options.audience || "default"
                        }) ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._saveEntryInCache = function(entry) {
            return __awaiter(this, void 0, void 0, (function() {
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.cacheManager.set(entry) ];

                      case 1:
                        _a.sent();
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._updateIdTokenInCache = function(entry) {
            return __awaiter(this, void 0, void 0, (function() {
                var audience, scope, idTokenEntry;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        audience = this.options.audience || "default";
                        scope = getUniqueScopes(this.defaultScope, this.scope);
                        return [ 4, this.cacheManager.get(new CacheKey({
                            clientId: this.options.clientId,
                            audience: audience,
                            scope: scope
                        })) ];

                      case 1:
                        idTokenEntry = _a.sent();
                        return [ 4, this.cacheManager.set(__assign(__assign({}, idTokenEntry), {
                            client_id: this.options.clientId,
                            id_token: entry.id_token,
                            decodedToken: entry.decodedToken
                        })) ];

                      case 2:
                        _a.sent();
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype._getEntryFromCache = function(_a) {
            var scope = _a.scope, audience = _a.audience, clientId = _a.clientId, _b = _a.getDetailedEntry, getDetailedEntry = _b === void 0 ? false : _b;
            return __awaiter(this, void 0, void 0, (function() {
                var entry, id_token, access_token, oauthTokenScope, expires_in;
                return __generator(this, (function(_c) {
                    switch (_c.label) {
                      case 0:
                        return [ 4, this.cacheManager.get(new CacheKey({
                            scope: scope,
                            audience: audience,
                            clientId: clientId
                        }), 60) ];

                      case 1:
                        entry = _c.sent();
                        if (entry && entry.access_token) {
                            if (getDetailedEntry) {
                                id_token = entry.id_token, access_token = entry.access_token, oauthTokenScope = entry.oauthTokenScope, 
                                expires_in = entry.expires_in;
                                return [ 2, __assign(__assign({
                                    id_token: id_token,
                                    access_token: access_token
                                }, oauthTokenScope ? {
                                    scope: oauthTokenScope
                                } : null), {
                                    expires_in: expires_in
                                }) ];
                            }
                            return [ 2, entry.access_token ];
                        }
                        return [ 2 ];
                    }
                }));
            }));
        };
        Auth0Client.prototype.migrateToV2 = function() {
            return __awaiter(this, void 0, void 0, (function() {
                var idTokenEntry, audience, scope, entryToMigrate;
                return __generator(this, (function(_a) {
                    switch (_a.label) {
                      case 0:
                        return [ 4, this.cacheManager.get(new CacheKey({
                            clientId: this.options.clientId
                        })) ];

                      case 1:
                        idTokenEntry = _a.sent();
                        if (idTokenEntry) {
                            return [ 2 ];
                        }
                        audience = this.options.audience || "default";
                        scope = getUniqueScopes(this.defaultScope, this.scope);
                        return [ 4, this.cacheManager.get(new CacheKey({
                            clientId: this.options.clientId,
                            scope: scope,
                            audience: audience
                        })) ];

                      case 2:
                        entryToMigrate = _a.sent();
                        if (!entryToMigrate) return [ 3, 4 ];
                        return [ 4, this.cacheManager.set({
                            client_id: this.options.clientId,
                            id_token: entryToMigrate.id_token,
                            decodedToken: entryToMigrate.decodedToken
                        }) ];

                      case 3:
                        _a.sent();
                        _a.label = 4;

                      case 4:
                        return [ 2 ];
                    }
                }));
            }));
        };
        return Auth0Client;
    }();
    var User = function() {
        function User() {}
        return User;
    }();
    function createAuth0Client(options) {
        return __awaiter(this, void 0, void 0, (function() {
            var auth0;
            return __generator(this, (function(_a) {
                switch (_a.label) {
                  case 0:
                    auth0 = new Auth0Client(options);
                    return [ 4, auth0.checkSession() ];

                  case 1:
                    _a.sent();
                    return [ 2, auth0 ];
                }
            }));
        }));
    }
    exports.Auth0Client = Auth0Client;
    exports.AuthenticationError = AuthenticationError;
    exports.CacheKey = CacheKey;
    exports.GenericError = GenericError;
    exports.InMemoryCache = InMemoryCache;
    exports.LocalStorageCache = LocalStorageCache;
    exports.MfaRequiredError = MfaRequiredError;
    exports.PopupCancelledError = PopupCancelledError;
    exports.PopupTimeoutError = PopupTimeoutError;
    exports.TimeoutError = TimeoutError;
    exports.User = User;
    exports.createAuth0Client = createAuth0Client;
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
}));
//# sourceMappingURL=auth0-spa-js.development.js.map
