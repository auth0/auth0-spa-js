!(function (e, t) {
  'object' == typeof exports && 'undefined' != typeof module
    ? (module.exports = t())
    : 'function' == typeof define && define.amd
    ? define(t)
    : ((e =
        'undefined' != typeof globalThis
          ? globalThis
          : e || self).createAuth0Client = t());
})(this, function () {
  'use strict';
  /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */ var e = function (
    t,
    n
  ) {
    return (e =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (e, t) {
          e.__proto__ = t;
        }) ||
      function (e, t) {
        for (var n in t)
          Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
      })(t, n);
  };
  function t(t, n) {
    if ('function' != typeof n && null !== n)
      throw new TypeError(
        'Class extends value ' + String(n) + ' is not a constructor or null'
      );
    function r() {
      this.constructor = t;
    }
    e(t, n),
      (t.prototype =
        null === n ? Object.create(n) : ((r.prototype = n.prototype), new r()));
  }
  var n = function () {
    return (n =
      Object.assign ||
      function (e) {
        for (var t, n = 1, r = arguments.length; n < r; n++)
          for (var o in (t = arguments[n]))
            Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
        return e;
      }).apply(this, arguments);
  };
  function r(e, t) {
    var n = {};
    for (var r in e)
      Object.prototype.hasOwnProperty.call(e, r) &&
        t.indexOf(r) < 0 &&
        (n[r] = e[r]);
    if (null != e && 'function' == typeof Object.getOwnPropertySymbols) {
      var o = 0;
      for (r = Object.getOwnPropertySymbols(e); o < r.length; o++)
        t.indexOf(r[o]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
          (n[r[o]] = e[r[o]]);
    }
    return n;
  }
  function o(e, t, n, r) {
    return new (n || (n = Promise))(function (o, i) {
      function a(e) {
        try {
          s(r.next(e));
        } catch (e) {
          i(e);
        }
      }
      function c(e) {
        try {
          s(r.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function s(e) {
        var t;
        e.done
          ? o(e.value)
          : ((t = e.value),
            t instanceof n
              ? t
              : new n(function (e) {
                  e(t);
                })).then(a, c);
      }
      s((r = r.apply(e, t || [])).next());
    });
  }
  function i(e, t) {
    var n,
      r,
      o,
      i,
      a = {
        label: 0,
        sent: function () {
          if (1 & o[0]) throw o[1];
          return o[1];
        },
        trys: [],
        ops: []
      };
    return (
      (i = { next: c(0), throw: c(1), return: c(2) }),
      'function' == typeof Symbol &&
        (i[Symbol.iterator] = function () {
          return this;
        }),
      i
    );
    function c(i) {
      return function (c) {
        return (function (i) {
          if (n) throw new TypeError('Generator is already executing.');
          for (; a; )
            try {
              if (
                ((n = 1),
                r &&
                  (o =
                    2 & i[0]
                      ? r.return
                      : i[0]
                      ? r.throw || ((o = r.return) && o.call(r), 0)
                      : r.next) &&
                  !(o = o.call(r, i[1])).done)
              )
                return o;
              switch (((r = 0), o && (i = [2 & i[0], o.value]), i[0])) {
                case 0:
                case 1:
                  o = i;
                  break;
                case 4:
                  return a.label++, { value: i[1], done: !1 };
                case 5:
                  a.label++, (r = i[1]), (i = [0]);
                  continue;
                case 7:
                  (i = a.ops.pop()), a.trys.pop();
                  continue;
                default:
                  if (
                    !((o = a.trys),
                    (o = o.length > 0 && o[o.length - 1]) ||
                      (6 !== i[0] && 2 !== i[0]))
                  ) {
                    a = 0;
                    continue;
                  }
                  if (3 === i[0] && (!o || (i[1] > o[0] && i[1] < o[3]))) {
                    a.label = i[1];
                    break;
                  }
                  if (6 === i[0] && a.label < o[1]) {
                    (a.label = o[1]), (o = i);
                    break;
                  }
                  if (o && a.label < o[2]) {
                    (a.label = o[2]), a.ops.push(i);
                    break;
                  }
                  o[2] && a.ops.pop(), a.trys.pop();
                  continue;
              }
              i = t.call(e, a);
            } catch (e) {
              (i = [6, e]), (r = 0);
            } finally {
              n = o = 0;
            }
          if (5 & i[0]) throw i[1];
          return { value: i[0] ? i[1] : void 0, done: !0 };
        })([i, c]);
      };
    }
  }
  var a =
    'undefined' != typeof globalThis
      ? globalThis
      : 'undefined' != typeof window
      ? window
      : 'undefined' != typeof global
      ? global
      : 'undefined' != typeof self
      ? self
      : {};
  function c(e) {
    return e &&
      e.__esModule &&
      Object.prototype.hasOwnProperty.call(e, 'default')
      ? e.default
      : e;
  }
  function s(e, t) {
    return e((t = { exports: {} }), t.exports), t.exports;
  }
  var u = function (e) {
      return e && e.Math == Math && e;
    },
    l =
      u('object' == typeof globalThis && globalThis) ||
      u('object' == typeof window && window) ||
      u('object' == typeof self && self) ||
      u('object' == typeof a && a) ||
      (function () {
        return this;
      })() ||
      Function('return this')(),
    f = function (e) {
      try {
        return !!e();
      } catch (e) {
        return !0;
      }
    },
    d = !f(function () {
      return (
        7 !=
        Object.defineProperty({}, 1, {
          get: function () {
            return 7;
          }
        })[1]
      );
    }),
    p = {}.propertyIsEnumerable,
    h = Object.getOwnPropertyDescriptor,
    y = {
      f:
        h && !p.call({ 1: 2 }, 1)
          ? function (e) {
              var t = h(this, e);
              return !!t && t.enumerable;
            }
          : p
    },
    v = function (e, t) {
      return {
        enumerable: !(1 & e),
        configurable: !(2 & e),
        writable: !(4 & e),
        value: t
      };
    },
    m = {}.toString,
    g = function (e) {
      return m.call(e).slice(8, -1);
    },
    b = ''.split,
    w = f(function () {
      return !Object('z').propertyIsEnumerable(0);
    })
      ? function (e) {
          return 'String' == g(e) ? b.call(e, '') : Object(e);
        }
      : Object,
    S = function (e) {
      if (null == e) throw TypeError("Can't call method on " + e);
      return e;
    },
    _ = function (e) {
      return w(S(e));
    },
    k = function (e) {
      return 'object' == typeof e ? null !== e : 'function' == typeof e;
    },
    I = function (e, t) {
      if (!k(e)) return e;
      var n, r;
      if (t && 'function' == typeof (n = e.toString) && !k((r = n.call(e))))
        return r;
      if ('function' == typeof (n = e.valueOf) && !k((r = n.call(e)))) return r;
      if (!t && 'function' == typeof (n = e.toString) && !k((r = n.call(e))))
        return r;
      throw TypeError("Can't convert object to primitive value");
    },
    T = function (e) {
      return Object(S(e));
    },
    O = {}.hasOwnProperty,
    E = function (e, t) {
      return O.call(T(e), t);
    },
    x = l.document,
    C = k(x) && k(x.createElement),
    R = function (e) {
      return C ? x.createElement(e) : {};
    },
    L =
      !d &&
      !f(function () {
        return (
          7 !=
          Object.defineProperty(R('div'), 'a', {
            get: function () {
              return 7;
            }
          }).a
        );
      }),
    A = Object.getOwnPropertyDescriptor,
    U = {
      f: d
        ? A
        : function (e, t) {
            if (((e = _(e)), (t = I(t, !0)), L))
              try {
                return A(e, t);
              } catch (e) {}
            if (E(e, t)) return v(!y.f.call(e, t), e[t]);
          }
    },
    j = function (e) {
      if (!k(e)) throw TypeError(String(e) + ' is not an object');
      return e;
    },
    P = Object.defineProperty,
    F = {
      f: d
        ? P
        : function (e, t, n) {
            if ((j(e), (t = I(t, !0)), j(n), L))
              try {
                return P(e, t, n);
              } catch (e) {}
            if ('get' in n || 'set' in n)
              throw TypeError('Accessors not supported');
            return 'value' in n && (e[t] = n.value), e;
          }
    },
    K = d
      ? function (e, t, n) {
          return F.f(e, t, v(1, n));
        }
      : function (e, t, n) {
          return (e[t] = n), e;
        },
    W = function (e, t) {
      try {
        K(l, e, t);
      } catch (n) {
        l[e] = t;
      }
      return t;
    },
    z = '__core-js_shared__',
    V = l[z] || W(z, {}),
    Z = Function.toString;
  'function' != typeof V.inspectSource &&
    (V.inspectSource = function (e) {
      return Z.call(e);
    });
  var X,
    N,
    G,
    J = V.inspectSource,
    D = l.WeakMap,
    Y = 'function' == typeof D && /native code/.test(J(D)),
    B = s(function (e) {
      (e.exports = function (e, t) {
        return V[e] || (V[e] = void 0 !== t ? t : {});
      })('versions', []).push({
        version: '3.12.0',
        mode: 'global',
        copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
      });
    }),
    M = 0,
    q = Math.random(),
    H = function (e) {
      return (
        'Symbol(' +
        String(void 0 === e ? '' : e) +
        ')_' +
        (++M + q).toString(36)
      );
    },
    Q = B('keys'),
    $ = function (e) {
      return Q[e] || (Q[e] = H(e));
    },
    ee = {},
    te = 'Object already initialized',
    ne = l.WeakMap;
  if (Y) {
    var re = V.state || (V.state = new ne()),
      oe = re.get,
      ie = re.has,
      ae = re.set;
    (X = function (e, t) {
      if (ie.call(re, e)) throw new TypeError(te);
      return (t.facade = e), ae.call(re, e, t), t;
    }),
      (N = function (e) {
        return oe.call(re, e) || {};
      }),
      (G = function (e) {
        return ie.call(re, e);
      });
  } else {
    var ce = $('state');
    (ee[ce] = !0),
      (X = function (e, t) {
        if (E(e, ce)) throw new TypeError(te);
        return (t.facade = e), K(e, ce, t), t;
      }),
      (N = function (e) {
        return E(e, ce) ? e[ce] : {};
      }),
      (G = function (e) {
        return E(e, ce);
      });
  }
  var se,
    ue,
    le = {
      set: X,
      get: N,
      has: G,
      enforce: function (e) {
        return G(e) ? N(e) : X(e, {});
      },
      getterFor: function (e) {
        return function (t) {
          var n;
          if (!k(t) || (n = N(t)).type !== e)
            throw TypeError('Incompatible receiver, ' + e + ' required');
          return n;
        };
      }
    },
    fe = s(function (e) {
      var t = le.get,
        n = le.enforce,
        r = String(String).split('String');
      (e.exports = function (e, t, o, i) {
        var a,
          c = !!i && !!i.unsafe,
          s = !!i && !!i.enumerable,
          u = !!i && !!i.noTargetGet;
        'function' == typeof o &&
          ('string' != typeof t || E(o, 'name') || K(o, 'name', t),
          (a = n(o)).source ||
            (a.source = r.join('string' == typeof t ? t : ''))),
          e !== l
            ? (c ? !u && e[t] && (s = !0) : delete e[t],
              s ? (e[t] = o) : K(e, t, o))
            : s
            ? (e[t] = o)
            : W(t, o);
      })(Function.prototype, 'toString', function () {
        return ('function' == typeof this && t(this).source) || J(this);
      });
    }),
    de = l,
    pe = function (e) {
      return 'function' == typeof e ? e : void 0;
    },
    he = function (e, t) {
      return arguments.length < 2
        ? pe(de[e]) || pe(l[e])
        : (de[e] && de[e][t]) || (l[e] && l[e][t]);
    },
    ye = Math.ceil,
    ve = Math.floor,
    me = function (e) {
      return isNaN((e = +e)) ? 0 : (e > 0 ? ve : ye)(e);
    },
    ge = Math.min,
    be = function (e) {
      return e > 0 ? ge(me(e), 9007199254740991) : 0;
    },
    we = Math.max,
    Se = Math.min,
    _e = function (e) {
      return function (t, n, r) {
        var o,
          i = _(t),
          a = be(i.length),
          c = (function (e, t) {
            var n = me(e);
            return n < 0 ? we(n + t, 0) : Se(n, t);
          })(r, a);
        if (e && n != n) {
          for (; a > c; ) if ((o = i[c++]) != o) return !0;
        } else
          for (; a > c; c++)
            if ((e || c in i) && i[c] === n) return e || c || 0;
        return !e && -1;
      };
    },
    ke = { includes: _e(!0), indexOf: _e(!1) },
    Ie = ke.indexOf,
    Te = function (e, t) {
      var n,
        r = _(e),
        o = 0,
        i = [];
      for (n in r) !E(ee, n) && E(r, n) && i.push(n);
      for (; t.length > o; ) E(r, (n = t[o++])) && (~Ie(i, n) || i.push(n));
      return i;
    },
    Oe = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf'
    ],
    Ee = Oe.concat('length', 'prototype'),
    xe = {
      f:
        Object.getOwnPropertyNames ||
        function (e) {
          return Te(e, Ee);
        }
    },
    Ce = { f: Object.getOwnPropertySymbols },
    Re =
      he('Reflect', 'ownKeys') ||
      function (e) {
        var t = xe.f(j(e)),
          n = Ce.f;
        return n ? t.concat(n(e)) : t;
      },
    Le = function (e, t) {
      for (var n = Re(t), r = F.f, o = U.f, i = 0; i < n.length; i++) {
        var a = n[i];
        E(e, a) || r(e, a, o(t, a));
      }
    },
    Ae = /#|\.prototype\./,
    Ue = function (e, t) {
      var n = Pe[je(e)];
      return n == Ke || (n != Fe && ('function' == typeof t ? f(t) : !!t));
    },
    je = (Ue.normalize = function (e) {
      return String(e).replace(Ae, '.').toLowerCase();
    }),
    Pe = (Ue.data = {}),
    Fe = (Ue.NATIVE = 'N'),
    Ke = (Ue.POLYFILL = 'P'),
    We = Ue,
    ze = U.f,
    Ve = function (e, t) {
      var n,
        r,
        o,
        i,
        a,
        c = e.target,
        s = e.global,
        u = e.stat;
      if ((n = s ? l : u ? l[c] || W(c, {}) : (l[c] || {}).prototype))
        for (r in t) {
          if (
            ((i = t[r]),
            (o = e.noTargetGet ? (a = ze(n, r)) && a.value : n[r]),
            !We(s ? r : c + (u ? '.' : '#') + r, e.forced) && void 0 !== o)
          ) {
            if (typeof i == typeof o) continue;
            Le(i, o);
          }
          (e.sham || (o && o.sham)) && K(i, 'sham', !0), fe(n, r, i, e);
        }
    },
    Ze = he('navigator', 'userAgent') || '',
    Xe = l.process,
    Ne = Xe && Xe.versions,
    Ge = Ne && Ne.v8;
  Ge
    ? (ue = (se = Ge.split('.'))[0] < 4 ? 1 : se[0] + se[1])
    : Ze &&
      (!(se = Ze.match(/Edge\/(\d+)/)) || se[1] >= 74) &&
      (se = Ze.match(/Chrome\/(\d+)/)) &&
      (ue = se[1]);
  var Je,
    De = ue && +ue,
    Ye =
      !!Object.getOwnPropertySymbols &&
      !f(function () {
        return !String(Symbol()) || (!Symbol.sham && De && De < 41);
      }),
    Be = Ye && !Symbol.sham && 'symbol' == typeof Symbol.iterator,
    Me = B('wks'),
    qe = l.Symbol,
    He = Be ? qe : (qe && qe.withoutSetter) || H,
    Qe = function (e) {
      return (
        (E(Me, e) && (Ye || 'string' == typeof Me[e])) ||
          (Ye && E(qe, e) ? (Me[e] = qe[e]) : (Me[e] = He('Symbol.' + e))),
        Me[e]
      );
    },
    $e = Qe('match'),
    et = function (e) {
      if (
        (function (e) {
          var t;
          return k(e) && (void 0 !== (t = e[$e]) ? !!t : 'RegExp' == g(e));
        })(e)
      )
        throw TypeError("The method doesn't accept regular expressions");
      return e;
    },
    tt = Qe('match'),
    nt = function (e) {
      var t = /./;
      try {
        '/./'[e](t);
      } catch (n) {
        try {
          return (t[tt] = !1), '/./'[e](t);
        } catch (e) {}
      }
      return !1;
    },
    rt = U.f,
    ot = ''.startsWith,
    it = Math.min,
    at = nt('startsWith'),
    ct = !(
      at || ((Je = rt(String.prototype, 'startsWith')), !Je || Je.writable)
    );
  Ve(
    { target: 'String', proto: !0, forced: !ct && !at },
    {
      startsWith: function (e) {
        var t = String(S(this));
        et(e);
        var n = be(it(arguments.length > 1 ? arguments[1] : void 0, t.length)),
          r = String(e);
        return ot ? ot.call(t, r, n) : t.slice(n, n + r.length) === r;
      }
    }
  );
  var st = function (e) {
      if ('function' != typeof e)
        throw TypeError(String(e) + ' is not a function');
      return e;
    },
    ut = function (e, t, n) {
      if ((st(e), void 0 === t)) return e;
      switch (n) {
        case 0:
          return function () {
            return e.call(t);
          };
        case 1:
          return function (n) {
            return e.call(t, n);
          };
        case 2:
          return function (n, r) {
            return e.call(t, n, r);
          };
        case 3:
          return function (n, r, o) {
            return e.call(t, n, r, o);
          };
      }
      return function () {
        return e.apply(t, arguments);
      };
    },
    lt = Function.call,
    ft = function (e, t, n) {
      return ut(lt, l[e].prototype[t], n);
    };
  ft('String', 'startsWith');
  var dt =
      Array.isArray ||
      function (e) {
        return 'Array' == g(e);
      },
    pt = function (e, t, n) {
      var r = I(t);
      r in e ? F.f(e, r, v(0, n)) : (e[r] = n);
    },
    ht = Qe('species'),
    yt = function (e, t) {
      var n;
      return (
        dt(e) &&
          ('function' != typeof (n = e.constructor) ||
          (n !== Array && !dt(n.prototype))
            ? k(n) && null === (n = n[ht]) && (n = void 0)
            : (n = void 0)),
        new (void 0 === n ? Array : n)(0 === t ? 0 : t)
      );
    },
    vt = Qe('species'),
    mt = Qe('isConcatSpreadable'),
    gt = 9007199254740991,
    bt = 'Maximum allowed index exceeded',
    wt =
      De >= 51 ||
      !f(function () {
        var e = [];
        return (e[mt] = !1), e.concat()[0] !== e;
      }),
    St = (function (e) {
      return (
        De >= 51 ||
        !f(function () {
          var t = [];
          return (
            ((t.constructor = {})[vt] = function () {
              return { foo: 1 };
            }),
            1 !== t[e](Boolean).foo
          );
        })
      );
    })('concat'),
    _t = function (e) {
      if (!k(e)) return !1;
      var t = e[mt];
      return void 0 !== t ? !!t : dt(e);
    };
  Ve(
    { target: 'Array', proto: !0, forced: !wt || !St },
    {
      concat: function (e) {
        var t,
          n,
          r,
          o,
          i,
          a = T(this),
          c = yt(a, 0),
          s = 0;
        for (t = -1, r = arguments.length; t < r; t++)
          if (_t((i = -1 === t ? a : arguments[t]))) {
            if (s + (o = be(i.length)) > gt) throw TypeError(bt);
            for (n = 0; n < o; n++, s++) n in i && pt(c, s, i[n]);
          } else {
            if (s >= gt) throw TypeError(bt);
            pt(c, s++, i);
          }
        return (c.length = s), c;
      }
    }
  );
  var kt = {};
  kt[Qe('toStringTag')] = 'z';
  var It = '[object z]' === String(kt),
    Tt = Qe('toStringTag'),
    Ot =
      'Arguments' ==
      g(
        (function () {
          return arguments;
        })()
      ),
    Et = It
      ? g
      : function (e) {
          var t, n, r;
          return void 0 === e
            ? 'Undefined'
            : null === e
            ? 'Null'
            : 'string' ==
              typeof (n = (function (e, t) {
                try {
                  return e[t];
                } catch (e) {}
              })((t = Object(e)), Tt))
            ? n
            : Ot
            ? g(t)
            : 'Object' == (r = g(t)) && 'function' == typeof t.callee
            ? 'Arguments'
            : r;
        },
    xt = It
      ? {}.toString
      : function () {
          return '[object ' + Et(this) + ']';
        };
  It || fe(Object.prototype, 'toString', xt, { unsafe: !0 });
  var Ct,
    Rt =
      Object.keys ||
      function (e) {
        return Te(e, Oe);
      },
    Lt = d
      ? Object.defineProperties
      : function (e, t) {
          j(e);
          for (var n, r = Rt(t), o = r.length, i = 0; o > i; )
            F.f(e, (n = r[i++]), t[n]);
          return e;
        },
    At = he('document', 'documentElement'),
    Ut = $('IE_PROTO'),
    jt = function () {},
    Pt = function (e) {
      return '<script>' + e + '</' + 'script>';
    },
    Ft = function () {
      try {
        Ct = document.domain && new ActiveXObject('htmlfile');
      } catch (e) {}
      var e, t;
      Ft = Ct
        ? (function (e) {
            e.write(Pt('')), e.close();
            var t = e.parentWindow.Object;
            return (e = null), t;
          })(Ct)
        : (((t = R('iframe')).style.display = 'none'),
          At.appendChild(t),
          (t.src = String('javascript:')),
          (e = t.contentWindow.document).open(),
          e.write(Pt('document.F=Object')),
          e.close(),
          e.F);
      for (var n = Oe.length; n--; ) delete Ft.prototype[Oe[n]];
      return Ft();
    };
  ee[Ut] = !0;
  var Kt =
      Object.create ||
      function (e, t) {
        var n;
        return (
          null !== e
            ? ((jt.prototype = j(e)),
              (n = new jt()),
              (jt.prototype = null),
              (n[Ut] = e))
            : (n = Ft()),
          void 0 === t ? n : Lt(n, t)
        );
      },
    Wt = xe.f,
    zt = {}.toString,
    Vt =
      'object' == typeof window && window && Object.getOwnPropertyNames
        ? Object.getOwnPropertyNames(window)
        : [],
    Zt = {
      f: function (e) {
        return Vt && '[object Window]' == zt.call(e)
          ? (function (e) {
              try {
                return Wt(e);
              } catch (e) {
                return Vt.slice();
              }
            })(e)
          : Wt(_(e));
      }
    },
    Xt = { f: Qe },
    Nt = F.f,
    Gt = function (e) {
      var t = de.Symbol || (de.Symbol = {});
      E(t, e) || Nt(t, e, { value: Xt.f(e) });
    },
    Jt = F.f,
    Dt = Qe('toStringTag'),
    Yt = function (e, t, n) {
      e &&
        !E((e = n ? e : e.prototype), Dt) &&
        Jt(e, Dt, { configurable: !0, value: t });
    },
    Bt = [].push,
    Mt = function (e) {
      var t = 1 == e,
        n = 2 == e,
        r = 3 == e,
        o = 4 == e,
        i = 6 == e,
        a = 7 == e,
        c = 5 == e || i;
      return function (s, u, l, f) {
        for (
          var d,
            p,
            h = T(s),
            y = w(h),
            v = ut(u, l, 3),
            m = be(y.length),
            g = 0,
            b = f || yt,
            S = t ? b(s, m) : n || a ? b(s, 0) : void 0;
          m > g;
          g++
        )
          if ((c || g in y) && ((p = v((d = y[g]), g, h)), e))
            if (t) S[g] = p;
            else if (p)
              switch (e) {
                case 3:
                  return !0;
                case 5:
                  return d;
                case 6:
                  return g;
                case 2:
                  Bt.call(S, d);
              }
            else
              switch (e) {
                case 4:
                  return !1;
                case 7:
                  Bt.call(S, d);
              }
        return i ? -1 : r || o ? o : S;
      };
    },
    qt = {
      forEach: Mt(0),
      map: Mt(1),
      filter: Mt(2),
      some: Mt(3),
      every: Mt(4),
      find: Mt(5),
      findIndex: Mt(6),
      filterOut: Mt(7)
    }.forEach,
    Ht = $('hidden'),
    Qt = 'Symbol',
    $t = Qe('toPrimitive'),
    en = le.set,
    tn = le.getterFor(Qt),
    nn = Object.prototype,
    rn = l.Symbol,
    on = he('JSON', 'stringify'),
    an = U.f,
    cn = F.f,
    sn = Zt.f,
    un = y.f,
    ln = B('symbols'),
    fn = B('op-symbols'),
    dn = B('string-to-symbol-registry'),
    pn = B('symbol-to-string-registry'),
    hn = B('wks'),
    yn = l.QObject,
    vn = !yn || !yn.prototype || !yn.prototype.findChild,
    mn =
      d &&
      f(function () {
        return (
          7 !=
          Kt(
            cn({}, 'a', {
              get: function () {
                return cn(this, 'a', { value: 7 }).a;
              }
            })
          ).a
        );
      })
        ? function (e, t, n) {
            var r = an(nn, t);
            r && delete nn[t], cn(e, t, n), r && e !== nn && cn(nn, t, r);
          }
        : cn,
    gn = function (e, t) {
      var n = (ln[e] = Kt(rn.prototype));
      return (
        en(n, { type: Qt, tag: e, description: t }), d || (n.description = t), n
      );
    },
    bn = Be
      ? function (e) {
          return 'symbol' == typeof e;
        }
      : function (e) {
          return Object(e) instanceof rn;
        },
    wn = function (e, t, n) {
      e === nn && wn(fn, t, n), j(e);
      var r = I(t, !0);
      return (
        j(n),
        E(ln, r)
          ? (n.enumerable
              ? (E(e, Ht) && e[Ht][r] && (e[Ht][r] = !1),
                (n = Kt(n, { enumerable: v(0, !1) })))
              : (E(e, Ht) || cn(e, Ht, v(1, {})), (e[Ht][r] = !0)),
            mn(e, r, n))
          : cn(e, r, n)
      );
    },
    Sn = function (e, t) {
      j(e);
      var n = _(t),
        r = Rt(n).concat(Tn(n));
      return (
        qt(r, function (t) {
          (d && !_n.call(n, t)) || wn(e, t, n[t]);
        }),
        e
      );
    },
    _n = function (e) {
      var t = I(e, !0),
        n = un.call(this, t);
      return (
        !(this === nn && E(ln, t) && !E(fn, t)) &&
        (!(n || !E(this, t) || !E(ln, t) || (E(this, Ht) && this[Ht][t])) || n)
      );
    },
    kn = function (e, t) {
      var n = _(e),
        r = I(t, !0);
      if (n !== nn || !E(ln, r) || E(fn, r)) {
        var o = an(n, r);
        return (
          !o || !E(ln, r) || (E(n, Ht) && n[Ht][r]) || (o.enumerable = !0), o
        );
      }
    },
    In = function (e) {
      var t = sn(_(e)),
        n = [];
      return (
        qt(t, function (e) {
          E(ln, e) || E(ee, e) || n.push(e);
        }),
        n
      );
    },
    Tn = function (e) {
      var t = e === nn,
        n = sn(t ? fn : _(e)),
        r = [];
      return (
        qt(n, function (e) {
          !E(ln, e) || (t && !E(nn, e)) || r.push(ln[e]);
        }),
        r
      );
    };
  if (
    (Ye ||
      (fe(
        (rn = function () {
          if (this instanceof rn)
            throw TypeError('Symbol is not a constructor');
          var e =
              arguments.length && void 0 !== arguments[0]
                ? String(arguments[0])
                : void 0,
            t = H(e),
            n = function (e) {
              this === nn && n.call(fn, e),
                E(this, Ht) && E(this[Ht], t) && (this[Ht][t] = !1),
                mn(this, t, v(1, e));
            };
          return d && vn && mn(nn, t, { configurable: !0, set: n }), gn(t, e);
        }).prototype,
        'toString',
        function () {
          return tn(this).tag;
        }
      ),
      fe(rn, 'withoutSetter', function (e) {
        return gn(H(e), e);
      }),
      (y.f = _n),
      (F.f = wn),
      (U.f = kn),
      (xe.f = Zt.f = In),
      (Ce.f = Tn),
      (Xt.f = function (e) {
        return gn(Qe(e), e);
      }),
      d &&
        (cn(rn.prototype, 'description', {
          configurable: !0,
          get: function () {
            return tn(this).description;
          }
        }),
        fe(nn, 'propertyIsEnumerable', _n, { unsafe: !0 }))),
    Ve({ global: !0, wrap: !0, forced: !Ye, sham: !Ye }, { Symbol: rn }),
    qt(Rt(hn), function (e) {
      Gt(e);
    }),
    Ve(
      { target: Qt, stat: !0, forced: !Ye },
      {
        for: function (e) {
          var t = String(e);
          if (E(dn, t)) return dn[t];
          var n = rn(t);
          return (dn[t] = n), (pn[n] = t), n;
        },
        keyFor: function (e) {
          if (!bn(e)) throw TypeError(e + ' is not a symbol');
          if (E(pn, e)) return pn[e];
        },
        useSetter: function () {
          vn = !0;
        },
        useSimple: function () {
          vn = !1;
        }
      }
    ),
    Ve(
      { target: 'Object', stat: !0, forced: !Ye, sham: !d },
      {
        create: function (e, t) {
          return void 0 === t ? Kt(e) : Sn(Kt(e), t);
        },
        defineProperty: wn,
        defineProperties: Sn,
        getOwnPropertyDescriptor: kn
      }
    ),
    Ve(
      { target: 'Object', stat: !0, forced: !Ye },
      { getOwnPropertyNames: In, getOwnPropertySymbols: Tn }
    ),
    Ve(
      {
        target: 'Object',
        stat: !0,
        forced: f(function () {
          Ce.f(1);
        })
      },
      {
        getOwnPropertySymbols: function (e) {
          return Ce.f(T(e));
        }
      }
    ),
    on)
  ) {
    var On =
      !Ye ||
      f(function () {
        var e = rn();
        return (
          '[null]' != on([e]) || '{}' != on({ a: e }) || '{}' != on(Object(e))
        );
      });
    Ve(
      { target: 'JSON', stat: !0, forced: On },
      {
        stringify: function (e, t, n) {
          for (var r, o = [e], i = 1; arguments.length > i; )
            o.push(arguments[i++]);
          if (((r = t), (k(t) || void 0 !== e) && !bn(e)))
            return (
              dt(t) ||
                (t = function (e, t) {
                  if (
                    ('function' == typeof r && (t = r.call(this, e, t)), !bn(t))
                  )
                    return t;
                }),
              (o[1] = t),
              on.apply(null, o)
            );
        }
      }
    );
  }
  rn.prototype[$t] || K(rn.prototype, $t, rn.prototype.valueOf),
    Yt(rn, Qt),
    (ee[Ht] = !0),
    Gt('asyncIterator');
  var En = F.f,
    xn = l.Symbol;
  if (
    d &&
    'function' == typeof xn &&
    (!('description' in xn.prototype) || void 0 !== xn().description)
  ) {
    var Cn = {},
      Rn = function () {
        var e =
            arguments.length < 1 || void 0 === arguments[0]
              ? void 0
              : String(arguments[0]),
          t = this instanceof Rn ? new xn(e) : void 0 === e ? xn() : xn(e);
        return '' === e && (Cn[t] = !0), t;
      };
    Le(Rn, xn);
    var Ln = (Rn.prototype = xn.prototype);
    Ln.constructor = Rn;
    var An = Ln.toString,
      Un = 'Symbol(test)' == String(xn('test')),
      jn = /^Symbol\((.*)\)[^)]+$/;
    En(Ln, 'description', {
      configurable: !0,
      get: function () {
        var e = k(this) ? this.valueOf() : this,
          t = An.call(e);
        if (E(Cn, e)) return '';
        var n = Un ? t.slice(7, -1) : t.replace(jn, '$1');
        return '' === n ? void 0 : n;
      }
    }),
      Ve({ global: !0, forced: !0 }, { Symbol: Rn });
  }
  Gt('hasInstance'),
    Gt('isConcatSpreadable'),
    Gt('iterator'),
    Gt('match'),
    Gt('matchAll'),
    Gt('replace'),
    Gt('search'),
    Gt('species'),
    Gt('split'),
    Gt('toPrimitive'),
    Gt('toStringTag'),
    Gt('unscopables'),
    Yt(l.JSON, 'JSON', !0),
    Yt(Math, 'Math', !0),
    Ve({ global: !0 }, { Reflect: {} }),
    Yt(l.Reflect, 'Reflect', !0),
    de.Symbol;
  var Pn,
    Fn,
    Kn,
    Wn = function (e) {
      return function (t, n) {
        var r,
          o,
          i = String(S(t)),
          a = me(n),
          c = i.length;
        return a < 0 || a >= c
          ? e
            ? ''
            : void 0
          : (r = i.charCodeAt(a)) < 55296 ||
            r > 56319 ||
            a + 1 === c ||
            (o = i.charCodeAt(a + 1)) < 56320 ||
            o > 57343
          ? e
            ? i.charAt(a)
            : r
          : e
          ? i.slice(a, a + 2)
          : o - 56320 + ((r - 55296) << 10) + 65536;
      };
    },
    zn = { codeAt: Wn(!1), charAt: Wn(!0) },
    Vn = !f(function () {
      function e() {}
      return (
        (e.prototype.constructor = null),
        Object.getPrototypeOf(new e()) !== e.prototype
      );
    }),
    Zn = $('IE_PROTO'),
    Xn = Object.prototype,
    Nn = Vn
      ? Object.getPrototypeOf
      : function (e) {
          return (
            (e = T(e)),
            E(e, Zn)
              ? e[Zn]
              : 'function' == typeof e.constructor && e instanceof e.constructor
              ? e.constructor.prototype
              : e instanceof Object
              ? Xn
              : null
          );
        },
    Gn = Qe('iterator'),
    Jn = !1;
  [].keys &&
    ('next' in (Kn = [].keys())
      ? (Fn = Nn(Nn(Kn))) !== Object.prototype && (Pn = Fn)
      : (Jn = !0)),
    (null == Pn ||
      f(function () {
        var e = {};
        return Pn[Gn].call(e) !== e;
      })) &&
      (Pn = {}),
    E(Pn, Gn) ||
      K(Pn, Gn, function () {
        return this;
      });
  var Dn = { IteratorPrototype: Pn, BUGGY_SAFARI_ITERATORS: Jn },
    Yn = {},
    Bn = Dn.IteratorPrototype,
    Mn = function () {
      return this;
    },
    qn =
      Object.setPrototypeOf ||
      ('__proto__' in {}
        ? (function () {
            var e,
              t = !1,
              n = {};
            try {
              (e = Object.getOwnPropertyDescriptor(
                Object.prototype,
                '__proto__'
              ).set).call(n, []),
                (t = n instanceof Array);
            } catch (e) {}
            return function (n, r) {
              return (
                j(n),
                (function (e) {
                  if (!k(e) && null !== e)
                    throw TypeError(
                      "Can't set " + String(e) + ' as a prototype'
                    );
                })(r),
                t ? e.call(n, r) : (n.__proto__ = r),
                n
              );
            };
          })()
        : void 0),
    Hn = Dn.IteratorPrototype,
    Qn = Dn.BUGGY_SAFARI_ITERATORS,
    $n = Qe('iterator'),
    er = 'keys',
    tr = 'values',
    nr = 'entries',
    rr = function () {
      return this;
    },
    or = function (e, t, n, r, o, i, a) {
      !(function (e, t, n) {
        var r = t + ' Iterator';
        (e.prototype = Kt(Bn, { next: v(1, n) })), Yt(e, r, !1), (Yn[r] = Mn);
      })(n, t, r);
      var c,
        s,
        u,
        l = function (e) {
          if (e === o && y) return y;
          if (!Qn && e in p) return p[e];
          switch (e) {
            case er:
            case tr:
            case nr:
              return function () {
                return new n(this, e);
              };
          }
          return function () {
            return new n(this);
          };
        },
        f = t + ' Iterator',
        d = !1,
        p = e.prototype,
        h = p[$n] || p['@@iterator'] || (o && p[o]),
        y = (!Qn && h) || l(o),
        m = ('Array' == t && p.entries) || h;
      if (
        (m &&
          ((c = Nn(m.call(new e()))),
          Hn !== Object.prototype &&
            c.next &&
            (Nn(c) !== Hn &&
              (qn ? qn(c, Hn) : 'function' != typeof c[$n] && K(c, $n, rr)),
            Yt(c, f, !0))),
        o == tr &&
          h &&
          h.name !== tr &&
          ((d = !0),
          (y = function () {
            return h.call(this);
          })),
        p[$n] !== y && K(p, $n, y),
        (Yn[t] = y),
        o)
      )
        if (((s = { values: l(tr), keys: i ? y : l(er), entries: l(nr) }), a))
          for (u in s) (Qn || d || !(u in p)) && fe(p, u, s[u]);
        else Ve({ target: t, proto: !0, forced: Qn || d }, s);
      return s;
    },
    ir = zn.charAt,
    ar = 'String Iterator',
    cr = le.set,
    sr = le.getterFor(ar);
  or(
    String,
    'String',
    function (e) {
      cr(this, { type: ar, string: String(e), index: 0 });
    },
    function () {
      var e,
        t = sr(this),
        n = t.string,
        r = t.index;
      return r >= n.length
        ? { value: void 0, done: !0 }
        : ((e = ir(n, r)), (t.index += e.length), { value: e, done: !1 });
    }
  );
  var ur = function (e) {
      var t = e.return;
      if (void 0 !== t) return j(t.call(e)).value;
    },
    lr = function (e, t, n, r) {
      try {
        return r ? t(j(n)[0], n[1]) : t(n);
      } catch (t) {
        throw (ur(e), t);
      }
    },
    fr = Qe('iterator'),
    dr = Array.prototype,
    pr = function (e) {
      return void 0 !== e && (Yn.Array === e || dr[fr] === e);
    },
    hr = Qe('iterator'),
    yr = function (e) {
      if (null != e) return e[hr] || e['@@iterator'] || Yn[Et(e)];
    },
    vr = Qe('iterator'),
    mr = !1;
  try {
    var gr = 0,
      br = {
        next: function () {
          return { done: !!gr++ };
        },
        return: function () {
          mr = !0;
        }
      };
    (br[vr] = function () {
      return this;
    }),
      Array.from(br, function () {
        throw 2;
      });
  } catch (e) {}
  var wr = function (e, t) {
      if (!t && !mr) return !1;
      var n = !1;
      try {
        var r = {};
        (r[vr] = function () {
          return {
            next: function () {
              return { done: (n = !0) };
            }
          };
        }),
          e(r);
      } catch (e) {}
      return n;
    },
    Sr = !wr(function (e) {
      Array.from(e);
    });
  Ve(
    { target: 'Array', stat: !0, forced: Sr },
    {
      from: function (e) {
        var t,
          n,
          r,
          o,
          i,
          a,
          c = T(e),
          s = 'function' == typeof this ? this : Array,
          u = arguments.length,
          l = u > 1 ? arguments[1] : void 0,
          f = void 0 !== l,
          d = yr(c),
          p = 0;
        if (
          (f && (l = ut(l, u > 2 ? arguments[2] : void 0, 2)),
          null == d || (s == Array && pr(d)))
        )
          for (n = new s((t = be(c.length))); t > p; p++)
            (a = f ? l(c[p], p) : c[p]), pt(n, p, a);
        else
          for (
            i = (o = d.call(c)).next, n = new s();
            !(r = i.call(o)).done;
            p++
          )
            (a = f ? lr(o, l, [r.value, p], !0) : r.value), pt(n, p, a);
        return (n.length = p), n;
      }
    }
  ),
    de.Array.from;
  var _r,
    kr = 'undefined' != typeof ArrayBuffer && 'undefined' != typeof DataView,
    Ir = F.f,
    Tr = l.Int8Array,
    Or = Tr && Tr.prototype,
    Er = l.Uint8ClampedArray,
    xr = Er && Er.prototype,
    Cr = Tr && Nn(Tr),
    Rr = Or && Nn(Or),
    Lr = Object.prototype,
    Ar = Lr.isPrototypeOf,
    Ur = Qe('toStringTag'),
    jr = H('TYPED_ARRAY_TAG'),
    Pr = kr && !!qn && 'Opera' !== Et(l.opera),
    Fr = {
      Int8Array: 1,
      Uint8Array: 1,
      Uint8ClampedArray: 1,
      Int16Array: 2,
      Uint16Array: 2,
      Int32Array: 4,
      Uint32Array: 4,
      Float32Array: 4,
      Float64Array: 8
    },
    Kr = { BigInt64Array: 8, BigUint64Array: 8 },
    Wr = function (e) {
      if (!k(e)) return !1;
      var t = Et(e);
      return E(Fr, t) || E(Kr, t);
    };
  for (_r in Fr) l[_r] || (Pr = !1);
  if (
    (!Pr || 'function' != typeof Cr || Cr === Function.prototype) &&
    ((Cr = function () {
      throw TypeError('Incorrect invocation');
    }),
    Pr)
  )
    for (_r in Fr) l[_r] && qn(l[_r], Cr);
  if ((!Pr || !Rr || Rr === Lr) && ((Rr = Cr.prototype), Pr))
    for (_r in Fr) l[_r] && qn(l[_r].prototype, Rr);
  if ((Pr && Nn(xr) !== Rr && qn(xr, Rr), d && !E(Rr, Ur)))
    for (_r in (!0,
    Ir(Rr, Ur, {
      get: function () {
        return k(this) ? this[jr] : void 0;
      }
    }),
    Fr))
      l[_r] && K(l[_r], jr, _r);
  var zr = function (e) {
      if (Wr(e)) return e;
      throw TypeError('Target is not a typed array');
    },
    Vr = function (e) {
      if (qn) {
        if (Ar.call(Cr, e)) return e;
      } else
        for (var t in Fr)
          if (E(Fr, _r)) {
            var n = l[t];
            if (n && (e === n || Ar.call(n, e))) return e;
          }
      throw TypeError('Target is not a typed array constructor');
    },
    Zr = function (e, t, n) {
      if (d) {
        if (n)
          for (var r in Fr) {
            var o = l[r];
            if (o && E(o.prototype, e))
              try {
                delete o.prototype[e];
              } catch (e) {}
          }
        (Rr[e] && !n) || fe(Rr, e, n ? t : (Pr && Or[e]) || t);
      }
    },
    Xr = Qe('species'),
    Nr = zr,
    Gr = Vr,
    Jr = [].slice;
  Zr(
    'slice',
    function (e, t) {
      for (
        var n = Jr.call(Nr(this), e, t),
          r = (function (e, t) {
            var n,
              r = j(e).constructor;
            return void 0 === r || null == (n = j(r)[Xr]) ? t : st(n);
          })(this, this.constructor),
          o = 0,
          i = n.length,
          a = new (Gr(r))(i);
        i > o;

      )
        a[o] = n[o++];
      return a;
    },
    f(function () {
      new Int8Array(1).slice();
    })
  );
  var Dr = Qe('unscopables'),
    Yr = Array.prototype;
  null == Yr[Dr] && F.f(Yr, Dr, { configurable: !0, value: Kt(null) });
  var Br = function (e) {
      Yr[Dr][e] = !0;
    },
    Mr = ke.includes;
  Ve(
    { target: 'Array', proto: !0 },
    {
      includes: function (e) {
        return Mr(this, e, arguments.length > 1 ? arguments[1] : void 0);
      }
    }
  ),
    Br('includes'),
    ft('Array', 'includes'),
    Ve(
      { target: 'String', proto: !0, forced: !nt('includes') },
      {
        includes: function (e) {
          return !!~String(S(this)).indexOf(
            et(e),
            arguments.length > 1 ? arguments[1] : void 0
          );
        }
      }
    ),
    ft('String', 'includes');
  var qr = !f(function () {
      return Object.isExtensible(Object.preventExtensions({}));
    }),
    Hr = s(function (e) {
      var t = F.f,
        n = H('meta'),
        r = 0,
        o =
          Object.isExtensible ||
          function () {
            return !0;
          },
        i = function (e) {
          t(e, n, { value: { objectID: 'O' + ++r, weakData: {} } });
        },
        a = (e.exports = {
          REQUIRED: !1,
          fastKey: function (e, t) {
            if (!k(e))
              return 'symbol' == typeof e
                ? e
                : ('string' == typeof e ? 'S' : 'P') + e;
            if (!E(e, n)) {
              if (!o(e)) return 'F';
              if (!t) return 'E';
              i(e);
            }
            return e[n].objectID;
          },
          getWeakData: function (e, t) {
            if (!E(e, n)) {
              if (!o(e)) return !0;
              if (!t) return !1;
              i(e);
            }
            return e[n].weakData;
          },
          onFreeze: function (e) {
            return qr && a.REQUIRED && o(e) && !E(e, n) && i(e), e;
          }
        });
      ee[n] = !0;
    });
  Hr.REQUIRED, Hr.fastKey, Hr.getWeakData, Hr.onFreeze;
  var Qr = function (e, t) {
      (this.stopped = e), (this.result = t);
    },
    $r = function (e, t, n) {
      var r,
        o,
        i,
        a,
        c,
        s,
        u,
        l = n && n.that,
        f = !(!n || !n.AS_ENTRIES),
        d = !(!n || !n.IS_ITERATOR),
        p = !(!n || !n.INTERRUPTED),
        h = ut(t, l, 1 + f + p),
        y = function (e) {
          return r && ur(r), new Qr(!0, e);
        },
        v = function (e) {
          return f
            ? (j(e), p ? h(e[0], e[1], y) : h(e[0], e[1]))
            : p
            ? h(e, y)
            : h(e);
        };
      if (d) r = e;
      else {
        if ('function' != typeof (o = yr(e)))
          throw TypeError('Target is not iterable');
        if (pr(o)) {
          for (i = 0, a = be(e.length); a > i; i++)
            if ((c = v(e[i])) && c instanceof Qr) return c;
          return new Qr(!1);
        }
        r = o.call(e);
      }
      for (s = r.next; !(u = s.call(r)).done; ) {
        try {
          c = v(u.value);
        } catch (e) {
          throw (ur(r), e);
        }
        if ('object' == typeof c && c && c instanceof Qr) return c;
      }
      return new Qr(!1);
    },
    eo = function (e, t, n) {
      if (!(e instanceof t))
        throw TypeError('Incorrect ' + (n ? n + ' ' : '') + 'invocation');
      return e;
    },
    to = function (e, t, n) {
      for (var r in t) fe(e, r, t[r], n);
      return e;
    },
    no = Qe('species'),
    ro = F.f,
    oo = Hr.fastKey,
    io = le.set,
    ao = le.getterFor;
  !(function (e, t, n) {
    var r = -1 !== e.indexOf('Map'),
      o = -1 !== e.indexOf('Weak'),
      i = r ? 'set' : 'add',
      a = l[e],
      c = a && a.prototype,
      s = a,
      u = {},
      d = function (e) {
        var t = c[e];
        fe(
          c,
          e,
          'add' == e
            ? function (e) {
                return t.call(this, 0 === e ? 0 : e), this;
              }
            : 'delete' == e
            ? function (e) {
                return !(o && !k(e)) && t.call(this, 0 === e ? 0 : e);
              }
            : 'get' == e
            ? function (e) {
                return o && !k(e) ? void 0 : t.call(this, 0 === e ? 0 : e);
              }
            : 'has' == e
            ? function (e) {
                return !(o && !k(e)) && t.call(this, 0 === e ? 0 : e);
              }
            : function (e, n) {
                return t.call(this, 0 === e ? 0 : e, n), this;
              }
        );
      };
    if (
      We(
        e,
        'function' != typeof a ||
          !(
            o ||
            (c.forEach &&
              !f(function () {
                new a().entries().next();
              }))
          )
      )
    )
      (s = n.getConstructor(t, e, r, i)), (Hr.REQUIRED = !0);
    else if (We(e, !0)) {
      var p = new s(),
        h = p[i](o ? {} : -0, 1) != p,
        y = f(function () {
          p.has(1);
        }),
        v = wr(function (e) {
          new a(e);
        }),
        m =
          !o &&
          f(function () {
            for (var e = new a(), t = 5; t--; ) e[i](t, t);
            return !e.has(-0);
          });
      v ||
        (((s = t(function (t, n) {
          eo(t, s, e);
          var o = (function (e, t, n) {
            var r, o;
            return (
              qn &&
                'function' == typeof (r = t.constructor) &&
                r !== n &&
                k((o = r.prototype)) &&
                o !== n.prototype &&
                qn(e, o),
              e
            );
          })(new a(), t, s);
          return null != n && $r(n, o[i], { that: o, AS_ENTRIES: r }), o;
        })).prototype = c),
        (c.constructor = s)),
        (y || m) && (d('delete'), d('has'), r && d('get')),
        (m || h) && d(i),
        o && c.clear && delete c.clear;
    }
    (u[e] = s),
      Ve({ global: !0, forced: s != a }, u),
      Yt(s, e),
      o || n.setStrong(s, e, r);
  })(
    'Set',
    function (e) {
      return function () {
        return e(this, arguments.length ? arguments[0] : void 0);
      };
    },
    {
      getConstructor: function (e, t, n, r) {
        var o = e(function (e, i) {
            eo(e, o, t),
              io(e, {
                type: t,
                index: Kt(null),
                first: void 0,
                last: void 0,
                size: 0
              }),
              d || (e.size = 0),
              null != i && $r(i, e[r], { that: e, AS_ENTRIES: n });
          }),
          i = ao(t),
          a = function (e, t, n) {
            var r,
              o,
              a = i(e),
              s = c(e, t);
            return (
              s
                ? (s.value = n)
                : ((a.last = s = {
                    index: (o = oo(t, !0)),
                    key: t,
                    value: n,
                    previous: (r = a.last),
                    next: void 0,
                    removed: !1
                  }),
                  a.first || (a.first = s),
                  r && (r.next = s),
                  d ? a.size++ : e.size++,
                  'F' !== o && (a.index[o] = s)),
              e
            );
          },
          c = function (e, t) {
            var n,
              r = i(e),
              o = oo(t);
            if ('F' !== o) return r.index[o];
            for (n = r.first; n; n = n.next) if (n.key == t) return n;
          };
        return (
          to(o.prototype, {
            clear: function () {
              for (var e = i(this), t = e.index, n = e.first; n; )
                (n.removed = !0),
                  n.previous && (n.previous = n.previous.next = void 0),
                  delete t[n.index],
                  (n = n.next);
              (e.first = e.last = void 0), d ? (e.size = 0) : (this.size = 0);
            },
            delete: function (e) {
              var t = this,
                n = i(t),
                r = c(t, e);
              if (r) {
                var o = r.next,
                  a = r.previous;
                delete n.index[r.index],
                  (r.removed = !0),
                  a && (a.next = o),
                  o && (o.previous = a),
                  n.first == r && (n.first = o),
                  n.last == r && (n.last = a),
                  d ? n.size-- : t.size--;
              }
              return !!r;
            },
            forEach: function (e) {
              for (
                var t,
                  n = i(this),
                  r = ut(e, arguments.length > 1 ? arguments[1] : void 0, 3);
                (t = t ? t.next : n.first);

              )
                for (r(t.value, t.key, this); t && t.removed; ) t = t.previous;
            },
            has: function (e) {
              return !!c(this, e);
            }
          }),
          to(
            o.prototype,
            n
              ? {
                  get: function (e) {
                    var t = c(this, e);
                    return t && t.value;
                  },
                  set: function (e, t) {
                    return a(this, 0 === e ? 0 : e, t);
                  }
                }
              : {
                  add: function (e) {
                    return a(this, (e = 0 === e ? 0 : e), e);
                  }
                }
          ),
          d &&
            ro(o.prototype, 'size', {
              get: function () {
                return i(this).size;
              }
            }),
          o
        );
      },
      setStrong: function (e, t, n) {
        var r = t + ' Iterator',
          o = ao(t),
          i = ao(r);
        or(
          e,
          t,
          function (e, t) {
            io(this, {
              type: r,
              target: e,
              state: o(e),
              kind: t,
              last: void 0
            });
          },
          function () {
            for (var e = i(this), t = e.kind, n = e.last; n && n.removed; )
              n = n.previous;
            return e.target && (e.last = n = n ? n.next : e.state.first)
              ? 'keys' == t
                ? { value: n.key, done: !1 }
                : 'values' == t
                ? { value: n.value, done: !1 }
                : { value: [n.key, n.value], done: !1 }
              : ((e.target = void 0), { value: void 0, done: !0 });
          },
          n ? 'entries' : 'values',
          !n,
          !0
        ),
          (function (e) {
            var t = he(e),
              n = F.f;
            d &&
              t &&
              !t[no] &&
              n(t, no, {
                configurable: !0,
                get: function () {
                  return this;
                }
              });
          })(t);
      }
    }
  );
  var co = {
      CSSRuleList: 0,
      CSSStyleDeclaration: 0,
      CSSValueList: 0,
      ClientRectList: 0,
      DOMRectList: 0,
      DOMStringList: 0,
      DOMTokenList: 1,
      DataTransferItemList: 0,
      FileList: 0,
      HTMLAllCollection: 0,
      HTMLCollection: 0,
      HTMLFormElement: 0,
      HTMLSelectElement: 0,
      MediaList: 0,
      MimeTypeArray: 0,
      NamedNodeMap: 0,
      NodeList: 1,
      PaintRequestList: 0,
      Plugin: 0,
      PluginArray: 0,
      SVGLengthList: 0,
      SVGNumberList: 0,
      SVGPathSegList: 0,
      SVGPointList: 0,
      SVGStringList: 0,
      SVGTransformList: 0,
      SourceBufferList: 0,
      StyleSheetList: 0,
      TextTrackCueList: 0,
      TextTrackList: 0,
      TouchList: 0
    },
    so = 'Array Iterator',
    uo = le.set,
    lo = le.getterFor(so),
    fo = or(
      Array,
      'Array',
      function (e, t) {
        uo(this, { type: so, target: _(e), index: 0, kind: t });
      },
      function () {
        var e = lo(this),
          t = e.target,
          n = e.kind,
          r = e.index++;
        return !t || r >= t.length
          ? ((e.target = void 0), { value: void 0, done: !0 })
          : 'keys' == n
          ? { value: r, done: !1 }
          : 'values' == n
          ? { value: t[r], done: !1 }
          : { value: [r, t[r]], done: !1 };
      },
      'values'
    );
  (Yn.Arguments = Yn.Array), Br('keys'), Br('values'), Br('entries');
  var po = Qe('iterator'),
    ho = Qe('toStringTag'),
    yo = fo.values;
  for (var vo in co) {
    var mo = l[vo],
      go = mo && mo.prototype;
    if (go) {
      if (go[po] !== yo)
        try {
          K(go, po, yo);
        } catch (e) {
          go[po] = yo;
        }
      if ((go[ho] || K(go, ho, vo), co[vo]))
        for (var bo in fo)
          if (go[bo] !== fo[bo])
            try {
              K(go, bo, fo[bo]);
            } catch (e) {
              go[bo] = fo[bo];
            }
    }
  }
  function wo(e) {
    var t = this.constructor;
    return this.then(
      function (n) {
        return t.resolve(e()).then(function () {
          return n;
        });
      },
      function (n) {
        return t.resolve(e()).then(function () {
          return t.reject(n);
        });
      }
    );
  }
  function So(e) {
    return new this(function (t, n) {
      if (!e || void 0 === e.length)
        return n(
          new TypeError(
            typeof e +
              ' ' +
              e +
              ' is not iterable(cannot read property Symbol(Symbol.iterator))'
          )
        );
      var r = Array.prototype.slice.call(e);
      if (0 === r.length) return t([]);
      var o = r.length;
      function i(e, n) {
        if (n && ('object' == typeof n || 'function' == typeof n)) {
          var a = n.then;
          if ('function' == typeof a)
            return void a.call(
              n,
              function (t) {
                i(e, t);
              },
              function (n) {
                (r[e] = { status: 'rejected', reason: n }), 0 == --o && t(r);
              }
            );
        }
        (r[e] = { status: 'fulfilled', value: n }), 0 == --o && t(r);
      }
      for (var a = 0; a < r.length; a++) i(a, r[a]);
    });
  }
  de.Set;
  var _o = setTimeout;
  function ko(e) {
    return Boolean(e && void 0 !== e.length);
  }
  function Io() {}
  function To(e) {
    if (!(this instanceof To))
      throw new TypeError('Promises must be constructed via new');
    if ('function' != typeof e) throw new TypeError('not a function');
    (this._state = 0),
      (this._handled = !1),
      (this._value = void 0),
      (this._deferreds = []),
      Lo(e, this);
  }
  function Oo(e, t) {
    for (; 3 === e._state; ) e = e._value;
    0 !== e._state
      ? ((e._handled = !0),
        To._immediateFn(function () {
          var n = 1 === e._state ? t.onFulfilled : t.onRejected;
          if (null !== n) {
            var r;
            try {
              r = n(e._value);
            } catch (e) {
              return void xo(t.promise, e);
            }
            Eo(t.promise, r);
          } else (1 === e._state ? Eo : xo)(t.promise, e._value);
        }))
      : e._deferreds.push(t);
  }
  function Eo(e, t) {
    try {
      if (t === e)
        throw new TypeError('A promise cannot be resolved with itself.');
      if (t && ('object' == typeof t || 'function' == typeof t)) {
        var n = t.then;
        if (t instanceof To) return (e._state = 3), (e._value = t), void Co(e);
        if ('function' == typeof n)
          return void Lo(
            ((r = n),
            (o = t),
            function () {
              r.apply(o, arguments);
            }),
            e
          );
      }
      (e._state = 1), (e._value = t), Co(e);
    } catch (t) {
      xo(e, t);
    }
    var r, o;
  }
  function xo(e, t) {
    (e._state = 2), (e._value = t), Co(e);
  }
  function Co(e) {
    2 === e._state &&
      0 === e._deferreds.length &&
      To._immediateFn(function () {
        e._handled || To._unhandledRejectionFn(e._value);
      });
    for (var t = 0, n = e._deferreds.length; t < n; t++) Oo(e, e._deferreds[t]);
    e._deferreds = null;
  }
  function Ro(e, t, n) {
    (this.onFulfilled = 'function' == typeof e ? e : null),
      (this.onRejected = 'function' == typeof t ? t : null),
      (this.promise = n);
  }
  function Lo(e, t) {
    var n = !1;
    try {
      e(
        function (e) {
          n || ((n = !0), Eo(t, e));
        },
        function (e) {
          n || ((n = !0), xo(t, e));
        }
      );
    } catch (e) {
      if (n) return;
      (n = !0), xo(t, e);
    }
  }
  (To.prototype.catch = function (e) {
    return this.then(null, e);
  }),
    (To.prototype.then = function (e, t) {
      var n = new this.constructor(Io);
      return Oo(this, new Ro(e, t, n)), n;
    }),
    (To.prototype.finally = wo),
    (To.all = function (e) {
      return new To(function (t, n) {
        if (!ko(e)) return n(new TypeError('Promise.all accepts an array'));
        var r = Array.prototype.slice.call(e);
        if (0 === r.length) return t([]);
        var o = r.length;
        function i(e, a) {
          try {
            if (a && ('object' == typeof a || 'function' == typeof a)) {
              var c = a.then;
              if ('function' == typeof c)
                return void c.call(
                  a,
                  function (t) {
                    i(e, t);
                  },
                  n
                );
            }
            (r[e] = a), 0 == --o && t(r);
          } catch (e) {
            n(e);
          }
        }
        for (var a = 0; a < r.length; a++) i(a, r[a]);
      });
    }),
    (To.allSettled = So),
    (To.resolve = function (e) {
      return e && 'object' == typeof e && e.constructor === To
        ? e
        : new To(function (t) {
            t(e);
          });
    }),
    (To.reject = function (e) {
      return new To(function (t, n) {
        n(e);
      });
    }),
    (To.race = function (e) {
      return new To(function (t, n) {
        if (!ko(e)) return n(new TypeError('Promise.race accepts an array'));
        for (var r = 0, o = e.length; r < o; r++) To.resolve(e[r]).then(t, n);
      });
    }),
    (To._immediateFn =
      ('function' == typeof setImmediate &&
        function (e) {
          setImmediate(e);
        }) ||
      function (e) {
        _o(e, 0);
      }),
    (To._unhandledRejectionFn = function (e) {
      'undefined' != typeof console &&
        console &&
        console.warn('Possible Unhandled Promise Rejection:', e);
    });
  var Ao = (function () {
    if ('undefined' != typeof self) return self;
    if ('undefined' != typeof window) return window;
    if ('undefined' != typeof global) return global;
    throw new Error('unable to locate global object');
  })();
  'function' != typeof Ao.Promise
    ? (Ao.Promise = To)
    : Ao.Promise.prototype.finally
    ? Ao.Promise.allSettled || (Ao.Promise.allSettled = So)
    : (Ao.Promise.prototype.finally = wo),
    (function (e) {
      function t() {}
      function n(e, t) {
        if (
          ((e = void 0 === e ? 'utf-8' : e),
          (t = void 0 === t ? { fatal: !1 } : t),
          -1 === o.indexOf(e.toLowerCase()))
        )
          throw new RangeError(
            "Failed to construct 'TextDecoder': The encoding label provided ('" +
              e +
              "') is invalid."
          );
        if (t.fatal)
          throw Error(
            "Failed to construct 'TextDecoder': the 'fatal' option is unsupported."
          );
      }
      function r(e) {
        for (
          var t = 0,
            n = Math.min(65536, e.length + 1),
            r = new Uint16Array(n),
            o = [],
            i = 0;
          ;

        ) {
          var a = t < e.length;
          if (!a || i >= n - 1) {
            if ((o.push(String.fromCharCode.apply(null, r.subarray(0, i))), !a))
              return o.join('');
            (e = e.subarray(t)), (i = t = 0);
          }
          if (0 == (128 & (a = e[t++]))) r[i++] = a;
          else if (192 == (224 & a)) {
            var c = 63 & e[t++];
            r[i++] = ((31 & a) << 6) | c;
          } else if (224 == (240 & a)) {
            c = 63 & e[t++];
            var s = 63 & e[t++];
            r[i++] = ((31 & a) << 12) | (c << 6) | s;
          } else if (240 == (248 & a)) {
            65535 <
              (a =
                ((7 & a) << 18) |
                ((c = 63 & e[t++]) << 12) |
                ((s = 63 & e[t++]) << 6) |
                (63 & e[t++])) &&
              ((a -= 65536),
              (r[i++] = ((a >>> 10) & 1023) | 55296),
              (a = 56320 | (1023 & a))),
              (r[i++] = a);
          }
        }
      }
      if (e.TextEncoder && e.TextDecoder) return !1;
      var o = ['utf-8', 'utf8', 'unicode-1-1-utf-8'];
      Object.defineProperty(t.prototype, 'encoding', { value: 'utf-8' }),
        (t.prototype.encode = function (e, t) {
          if ((t = void 0 === t ? { stream: !1 } : t).stream)
            throw Error(
              "Failed to encode: the 'stream' option is unsupported."
            );
          t = 0;
          for (
            var n = e.length,
              r = 0,
              o = Math.max(32, n + (n >>> 1) + 7),
              i = new Uint8Array((o >>> 3) << 3);
            t < n;

          ) {
            var a = e.charCodeAt(t++);
            if (55296 <= a && 56319 >= a) {
              if (t < n) {
                var c = e.charCodeAt(t);
                56320 == (64512 & c) &&
                  (++t, (a = ((1023 & a) << 10) + (1023 & c) + 65536));
              }
              if (55296 <= a && 56319 >= a) continue;
            }
            if (
              (r + 4 > i.length &&
                ((o += 8),
                (o = ((o *= 1 + (t / e.length) * 2) >>> 3) << 3),
                (c = new Uint8Array(o)).set(i),
                (i = c)),
              0 == (4294967168 & a))
            )
              i[r++] = a;
            else {
              if (0 == (4294965248 & a)) i[r++] = ((a >>> 6) & 31) | 192;
              else if (0 == (4294901760 & a))
                (i[r++] = ((a >>> 12) & 15) | 224),
                  (i[r++] = ((a >>> 6) & 63) | 128);
              else {
                if (0 != (4292870144 & a)) continue;
                (i[r++] = ((a >>> 18) & 7) | 240),
                  (i[r++] = ((a >>> 12) & 63) | 128),
                  (i[r++] = ((a >>> 6) & 63) | 128);
              }
              i[r++] = (63 & a) | 128;
            }
          }
          return i.slice ? i.slice(0, r) : i.subarray(0, r);
        }),
        Object.defineProperty(n.prototype, 'encoding', { value: 'utf-8' }),
        Object.defineProperty(n.prototype, 'fatal', { value: !1 }),
        Object.defineProperty(n.prototype, 'ignoreBOM', { value: !1 });
      var i = r;
      'function' == typeof Buffer && Buffer.from
        ? (i = function (e) {
            return Buffer.from(e.buffer, e.byteOffset, e.byteLength).toString(
              'utf-8'
            );
          })
        : 'function' == typeof Blob &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          (i = function (e) {
            var t = URL.createObjectURL(
              new Blob([e], { type: 'text/plain;charset=UTF-8' })
            );
            try {
              var n = new XMLHttpRequest();
              return n.open('GET', t, !1), n.send(), n.responseText;
            } catch (t) {
              return r(e);
            } finally {
              URL.revokeObjectURL(t);
            }
          }),
        (n.prototype.decode = function (e, t) {
          if ((t = void 0 === t ? { stream: !1 } : t).stream)
            throw Error(
              "Failed to decode: the 'stream' option is unsupported."
            );
          return (
            (e =
              e instanceof Uint8Array
                ? e
                : e.buffer instanceof ArrayBuffer
                ? new Uint8Array(e.buffer)
                : new Uint8Array(e)),
            i(e)
          );
        }),
        (e.TextEncoder = t),
        (e.TextDecoder = n);
    })('undefined' != typeof window ? window : a),
    (function () {
      function e(e, t) {
        if (!(e instanceof t))
          throw new TypeError('Cannot call a class as a function');
      }
      function t(e, t) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n];
          (r.enumerable = r.enumerable || !1),
            (r.configurable = !0),
            'value' in r && (r.writable = !0),
            Object.defineProperty(e, r.key, r);
        }
      }
      function n(e, n, r) {
        return n && t(e.prototype, n), r && t(e, r), e;
      }
      function r(e, t) {
        if ('function' != typeof t && null !== t)
          throw new TypeError(
            'Super expression must either be null or a function'
          );
        (e.prototype = Object.create(t && t.prototype, {
          constructor: { value: e, writable: !0, configurable: !0 }
        })),
          t && i(e, t);
      }
      function o(e) {
        return (o = Object.setPrototypeOf
          ? Object.getPrototypeOf
          : function (e) {
              return e.__proto__ || Object.getPrototypeOf(e);
            })(e);
      }
      function i(e, t) {
        return (i =
          Object.setPrototypeOf ||
          function (e, t) {
            return (e.__proto__ = t), e;
          })(e, t);
      }
      function c() {
        if ('undefined' == typeof Reflect || !Reflect.construct) return !1;
        if (Reflect.construct.sham) return !1;
        if ('function' == typeof Proxy) return !0;
        try {
          return (
            Date.prototype.toString.call(
              Reflect.construct(Date, [], function () {})
            ),
            !0
          );
        } catch (e) {
          return !1;
        }
      }
      function s(e) {
        if (void 0 === e)
          throw new ReferenceError(
            "this hasn't been initialised - super() hasn't been called"
          );
        return e;
      }
      function u(e, t) {
        return !t || ('object' != typeof t && 'function' != typeof t)
          ? s(e)
          : t;
      }
      function l(e) {
        var t = c();
        return function () {
          var n,
            r = o(e);
          if (t) {
            var i = o(this).constructor;
            n = Reflect.construct(r, arguments, i);
          } else n = r.apply(this, arguments);
          return u(this, n);
        };
      }
      function f(e, t) {
        for (
          ;
          !Object.prototype.hasOwnProperty.call(e, t) && null !== (e = o(e));

        );
        return e;
      }
      function d(e, t, n) {
        return (d =
          'undefined' != typeof Reflect && Reflect.get
            ? Reflect.get
            : function (e, t, n) {
                var r = f(e, t);
                if (r) {
                  var o = Object.getOwnPropertyDescriptor(r, t);
                  return o.get ? o.get.call(n) : o.value;
                }
              })(e, t, n || e);
      }
      var p = (function () {
          function t() {
            e(this, t),
              Object.defineProperty(this, 'listeners', {
                value: {},
                writable: !0,
                configurable: !0
              });
          }
          return (
            n(t, [
              {
                key: 'addEventListener',
                value: function (e, t, n) {
                  e in this.listeners || (this.listeners[e] = []),
                    this.listeners[e].push({ callback: t, options: n });
                }
              },
              {
                key: 'removeEventListener',
                value: function (e, t) {
                  if (e in this.listeners)
                    for (
                      var n = this.listeners[e], r = 0, o = n.length;
                      r < o;
                      r++
                    )
                      if (n[r].callback === t) return void n.splice(r, 1);
                }
              },
              {
                key: 'dispatchEvent',
                value: function (e) {
                  if (e.type in this.listeners) {
                    for (
                      var t = this.listeners[e.type].slice(),
                        n = 0,
                        r = t.length;
                      n < r;
                      n++
                    ) {
                      var o = t[n];
                      try {
                        o.callback.call(this, e);
                      } catch (e) {
                        Promise.resolve().then(function () {
                          throw e;
                        });
                      }
                      o.options &&
                        o.options.once &&
                        this.removeEventListener(e.type, o.callback);
                    }
                    return !e.defaultPrevented;
                  }
                }
              }
            ]),
            t
          );
        })(),
        h = (function (t) {
          r(a, t);
          var i = l(a);
          function a() {
            var t;
            return (
              e(this, a),
              (t = i.call(this)).listeners || p.call(s(t)),
              Object.defineProperty(s(t), 'aborted', {
                value: !1,
                writable: !0,
                configurable: !0
              }),
              Object.defineProperty(s(t), 'onabort', {
                value: null,
                writable: !0,
                configurable: !0
              }),
              t
            );
          }
          return (
            n(a, [
              {
                key: 'toString',
                value: function () {
                  return '[object AbortSignal]';
                }
              },
              {
                key: 'dispatchEvent',
                value: function (e) {
                  'abort' === e.type &&
                    ((this.aborted = !0),
                    'function' == typeof this.onabort &&
                      this.onabort.call(this, e)),
                    d(o(a.prototype), 'dispatchEvent', this).call(this, e);
                }
              }
            ]),
            a
          );
        })(p),
        y = (function () {
          function t() {
            e(this, t),
              Object.defineProperty(this, 'signal', {
                value: new h(),
                writable: !0,
                configurable: !0
              });
          }
          return (
            n(t, [
              {
                key: 'abort',
                value: function () {
                  var e;
                  try {
                    e = new Event('abort');
                  } catch (t) {
                    'undefined' != typeof document
                      ? document.createEvent
                        ? (e = document.createEvent('Event')).initEvent(
                            'abort',
                            !1,
                            !1
                          )
                        : ((e = document.createEventObject()).type = 'abort')
                      : (e = { type: 'abort', bubbles: !1, cancelable: !1 });
                  }
                  this.signal.dispatchEvent(e);
                }
              },
              {
                key: 'toString',
                value: function () {
                  return '[object AbortController]';
                }
              }
            ]),
            t
          );
        })();
      function v(e) {
        return e.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL
          ? (console.log(
              '__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill'
            ),
            !0)
          : ('function' == typeof e.Request &&
              !e.Request.prototype.hasOwnProperty('signal')) ||
              !e.AbortController;
      }
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        ((y.prototype[Symbol.toStringTag] = 'AbortController'),
        (h.prototype[Symbol.toStringTag] = 'AbortSignal')),
        (function (e) {
          v(e) && ((e.AbortController = y), (e.AbortSignal = h));
        })('undefined' != typeof self ? self : a);
    })();
  var Uo = s(function (e, t) {
    Object.defineProperty(t, '__esModule', { value: !0 });
    var n = (function () {
      function e() {
        var e = this;
        (this.locked = new Map()),
          (this.addToLocked = function (t, n) {
            var r = e.locked.get(t);
            void 0 === r
              ? void 0 === n
                ? e.locked.set(t, [])
                : e.locked.set(t, [n])
              : void 0 !== n && (r.unshift(n), e.locked.set(t, r));
          }),
          (this.isLocked = function (t) {
            return e.locked.has(t);
          }),
          (this.lock = function (t) {
            return new Promise(function (n, r) {
              e.isLocked(t) ? e.addToLocked(t, n) : (e.addToLocked(t), n());
            });
          }),
          (this.unlock = function (t) {
            var n = e.locked.get(t);
            if (void 0 !== n && 0 !== n.length) {
              var r = n.pop();
              e.locked.set(t, n), void 0 !== r && setTimeout(r, 0);
            } else e.locked.delete(t);
          });
      }
      return (
        (e.getInstance = function () {
          return void 0 === e.instance && (e.instance = new e()), e.instance;
        }),
        e
      );
    })();
    t.default = function () {
      return n.getInstance();
    };
  });
  c(Uo);
  var jo = c(
      s(function (e, t) {
        var n =
            (a && a.__awaiter) ||
            function (e, t, n, r) {
              return new (n || (n = Promise))(function (o, i) {
                function a(e) {
                  try {
                    s(r.next(e));
                  } catch (e) {
                    i(e);
                  }
                }
                function c(e) {
                  try {
                    s(r.throw(e));
                  } catch (e) {
                    i(e);
                  }
                }
                function s(e) {
                  e.done
                    ? o(e.value)
                    : new n(function (t) {
                        t(e.value);
                      }).then(a, c);
                }
                s((r = r.apply(e, t || [])).next());
              });
            },
          r =
            (a && a.__generator) ||
            function (e, t) {
              var n,
                r,
                o,
                i,
                a = {
                  label: 0,
                  sent: function () {
                    if (1 & o[0]) throw o[1];
                    return o[1];
                  },
                  trys: [],
                  ops: []
                };
              return (
                (i = { next: c(0), throw: c(1), return: c(2) }),
                'function' == typeof Symbol &&
                  (i[Symbol.iterator] = function () {
                    return this;
                  }),
                i
              );
              function c(i) {
                return function (c) {
                  return (function (i) {
                    if (n)
                      throw new TypeError('Generator is already executing.');
                    for (; a; )
                      try {
                        if (
                          ((n = 1),
                          r &&
                            (o =
                              2 & i[0]
                                ? r.return
                                : i[0]
                                ? r.throw || ((o = r.return) && o.call(r), 0)
                                : r.next) &&
                            !(o = o.call(r, i[1])).done)
                        )
                          return o;
                        switch (
                          ((r = 0), o && (i = [2 & i[0], o.value]), i[0])
                        ) {
                          case 0:
                          case 1:
                            o = i;
                            break;
                          case 4:
                            return a.label++, { value: i[1], done: !1 };
                          case 5:
                            a.label++, (r = i[1]), (i = [0]);
                            continue;
                          case 7:
                            (i = a.ops.pop()), a.trys.pop();
                            continue;
                          default:
                            if (
                              !((o = a.trys),
                              (o = o.length > 0 && o[o.length - 1]) ||
                                (6 !== i[0] && 2 !== i[0]))
                            ) {
                              a = 0;
                              continue;
                            }
                            if (
                              3 === i[0] &&
                              (!o || (i[1] > o[0] && i[1] < o[3]))
                            ) {
                              a.label = i[1];
                              break;
                            }
                            if (6 === i[0] && a.label < o[1]) {
                              (a.label = o[1]), (o = i);
                              break;
                            }
                            if (o && a.label < o[2]) {
                              (a.label = o[2]), a.ops.push(i);
                              break;
                            }
                            o[2] && a.ops.pop(), a.trys.pop();
                            continue;
                        }
                        i = t.call(e, a);
                      } catch (e) {
                        (i = [6, e]), (r = 0);
                      } finally {
                        n = o = 0;
                      }
                    if (5 & i[0]) throw i[1];
                    return { value: i[0] ? i[1] : void 0, done: !0 };
                  })([i, c]);
                };
              }
            };
        Object.defineProperty(t, '__esModule', { value: !0 });
        var o = 'browser-tabs-lock-key';
        function i(e) {
          return new Promise(function (t) {
            return setTimeout(t, e);
          });
        }
        function c(e) {
          for (
            var t =
                '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
              n = '',
              r = 0;
            r < e;
            r++
          ) {
            n += t[Math.floor(Math.random() * t.length)];
          }
          return n;
        }
        var s = (function () {
          function e() {
            (this.acquiredIatSet = new Set()),
              (this.id = Date.now().toString() + c(15)),
              (this.acquireLock = this.acquireLock.bind(this)),
              (this.releaseLock = this.releaseLock.bind(this)),
              (this.releaseLock__private__ = this.releaseLock__private__.bind(
                this
              )),
              (this.waitForSomethingToChange = this.waitForSomethingToChange.bind(
                this
              )),
              (this.refreshLockWhileAcquired = this.refreshLockWhileAcquired.bind(
                this
              )),
              void 0 === e.waiters && (e.waiters = []);
          }
          return (
            (e.prototype.acquireLock = function (t, a) {
              return (
                void 0 === a && (a = 5e3),
                n(this, void 0, void 0, function () {
                  var n, s, u, l, f, d;
                  return r(this, function (r) {
                    switch (r.label) {
                      case 0:
                        (n = Date.now() + c(4)),
                          (s = Date.now() + a),
                          (u = o + '-' + t),
                          (l = window.localStorage),
                          (r.label = 1);
                      case 1:
                        return Date.now() < s ? [4, i(30)] : [3, 8];
                      case 2:
                        return (
                          r.sent(),
                          null !== l.getItem(u)
                            ? [3, 5]
                            : ((f = this.id + '-' + t + '-' + n),
                              [4, i(Math.floor(25 * Math.random()))])
                        );
                      case 3:
                        return (
                          r.sent(),
                          l.setItem(
                            u,
                            JSON.stringify({
                              id: this.id,
                              iat: n,
                              timeoutKey: f,
                              timeAcquired: Date.now(),
                              timeRefreshed: Date.now()
                            })
                          ),
                          [4, i(30)]
                        );
                      case 4:
                        return (
                          r.sent(),
                          null !== (d = l.getItem(u)) &&
                          (d = JSON.parse(d)).id === this.id &&
                          d.iat === n
                            ? (this.acquiredIatSet.add(n),
                              this.refreshLockWhileAcquired(u, n),
                              [2, !0])
                            : [3, 7]
                        );
                      case 5:
                        return (
                          e.lockCorrector(),
                          [4, this.waitForSomethingToChange(s)]
                        );
                      case 6:
                        r.sent(), (r.label = 7);
                      case 7:
                        return (n = Date.now() + c(4)), [3, 1];
                      case 8:
                        return [2, !1];
                    }
                  });
                })
              );
            }),
            (e.prototype.refreshLockWhileAcquired = function (e, t) {
              return n(this, void 0, void 0, function () {
                var o = this;
                return r(this, function (i) {
                  return (
                    setTimeout(function () {
                      return n(o, void 0, void 0, function () {
                        var n, o;
                        return r(this, function (r) {
                          switch (r.label) {
                            case 0:
                              return [4, Uo.default().lock(t)];
                            case 1:
                              return (
                                r.sent(),
                                this.acquiredIatSet.has(t)
                                  ? ((n = window.localStorage),
                                    null === (o = n.getItem(e))
                                      ? (Uo.default().unlock(t), [2])
                                      : (((o = JSON.parse(
                                          o
                                        )).timeRefreshed = Date.now()),
                                        n.setItem(e, JSON.stringify(o)),
                                        Uo.default().unlock(t),
                                        this.refreshLockWhileAcquired(e, t),
                                        [2]))
                                  : (Uo.default().unlock(t), [2])
                              );
                          }
                        });
                      });
                    }, 1e3),
                    [2]
                  );
                });
              });
            }),
            (e.prototype.waitForSomethingToChange = function (t) {
              return n(this, void 0, void 0, function () {
                return r(this, function (n) {
                  switch (n.label) {
                    case 0:
                      return [
                        4,
                        new Promise(function (n) {
                          var r = !1,
                            o = Date.now(),
                            i = !1;
                          function a() {
                            if (
                              (i ||
                                (window.removeEventListener('storage', a),
                                e.removeFromWaiting(a),
                                clearTimeout(c),
                                (i = !0)),
                              !r)
                            ) {
                              r = !0;
                              var t = 50 - (Date.now() - o);
                              t > 0 ? setTimeout(n, t) : n();
                            }
                          }
                          window.addEventListener('storage', a),
                            e.addToWaiting(a);
                          var c = setTimeout(a, Math.max(0, t - Date.now()));
                        })
                      ];
                    case 1:
                      return n.sent(), [2];
                  }
                });
              });
            }),
            (e.addToWaiting = function (t) {
              this.removeFromWaiting(t),
                void 0 !== e.waiters && e.waiters.push(t);
            }),
            (e.removeFromWaiting = function (t) {
              void 0 !== e.waiters &&
                (e.waiters = e.waiters.filter(function (e) {
                  return e !== t;
                }));
            }),
            (e.notifyWaiters = function () {
              void 0 !== e.waiters &&
                e.waiters.slice().forEach(function (e) {
                  return e();
                });
            }),
            (e.prototype.releaseLock = function (e) {
              return n(this, void 0, void 0, function () {
                return r(this, function (t) {
                  switch (t.label) {
                    case 0:
                      return [4, this.releaseLock__private__(e)];
                    case 1:
                      return [2, t.sent()];
                  }
                });
              });
            }),
            (e.prototype.releaseLock__private__ = function (t) {
              return n(this, void 0, void 0, function () {
                var n, i, a;
                return r(this, function (r) {
                  switch (r.label) {
                    case 0:
                      return (
                        (n = window.localStorage),
                        (i = o + '-' + t),
                        null === (a = n.getItem(i))
                          ? [2]
                          : (a = JSON.parse(a)).id !== this.id
                          ? [3, 2]
                          : [4, Uo.default().lock(a.iat)]
                      );
                    case 1:
                      r.sent(),
                        this.acquiredIatSet.delete(a.iat),
                        n.removeItem(i),
                        Uo.default().unlock(a.iat),
                        e.notifyWaiters(),
                        (r.label = 2);
                    case 2:
                      return [2];
                  }
                });
              });
            }),
            (e.lockCorrector = function () {
              for (
                var t = Date.now() - 5e3,
                  n = window.localStorage,
                  r = Object.keys(n),
                  i = !1,
                  a = 0;
                a < r.length;
                a++
              ) {
                var c = r[a];
                if (c.includes(o)) {
                  var s = n.getItem(c);
                  null !== s &&
                    ((void 0 === (s = JSON.parse(s)).timeRefreshed &&
                      s.timeAcquired < t) ||
                      (void 0 !== s.timeRefreshed && s.timeRefreshed < t)) &&
                    (n.removeItem(c), (i = !0));
                }
              }
              i && e.notifyWaiters();
            }),
            (e.waiters = void 0),
            e
          );
        })();
        t.default = s;
      })
    ),
    Po = { timeoutInSeconds: 60 },
    Fo = 'memory',
    Ko = [
      'login_required',
      'consent_required',
      'interaction_required',
      'account_selection_required',
      'access_denied'
    ],
    Wo = { name: 'auth0-spa-js', version: '1.15.0' },
    zo = (function (e) {
      function n(t, r) {
        var o = e.call(this, r) || this;
        return (
          (o.error = t),
          (o.error_description = r),
          Object.setPrototypeOf(o, n.prototype),
          o
        );
      }
      return (
        t(n, e),
        (n.fromPayload = function (e) {
          return new n(e.error, e.error_description);
        }),
        n
      );
    })(Error),
    Vo = (function (e) {
      function n(t, r, o, i) {
        void 0 === i && (i = null);
        var a = e.call(this, t, r) || this;
        return (
          (a.state = o),
          (a.appState = i),
          Object.setPrototypeOf(a, n.prototype),
          a
        );
      }
      return t(n, e), n;
    })(zo),
    Zo = (function (e) {
      function n() {
        var t = e.call(this, 'timeout', 'Timeout') || this;
        return Object.setPrototypeOf(t, n.prototype), t;
      }
      return t(n, e), n;
    })(zo),
    Xo = (function (e) {
      function n(t) {
        var r = e.call(this) || this;
        return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
      }
      return t(n, e), n;
    })(Zo),
    No = (function (e) {
      function n(t) {
        var r = e.call(this, 'cancelled', 'Popup closed') || this;
        return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
      }
      return t(n, e), n;
    })(zo),
    Go = function (e) {
      return new Promise(function (t, n) {
        var r,
          o = setInterval(function () {
            e.popup &&
              e.popup.closed &&
              (clearInterval(o),
              clearTimeout(i),
              window.removeEventListener('message', r, !1),
              n(new No(e.popup)));
          }, 1e3),
          i = setTimeout(function () {
            clearInterval(o),
              n(new Xo(e.popup)),
              window.removeEventListener('message', r, !1);
          }, 1e3 * (e.timeoutInSeconds || 60));
        (r = function (a) {
          if (a.data && 'authorization_response' === a.data.type) {
            if (
              (clearTimeout(i),
              clearInterval(o),
              window.removeEventListener('message', r, !1),
              e.popup.close(),
              a.data.response.error)
            )
              return n(zo.fromPayload(a.data.response));
            t(a.data.response);
          }
        }),
          window.addEventListener('message', r);
      });
    },
    Jo = function () {
      return window.crypto || window.msCrypto;
    },
    Do = function () {
      var e = Jo();
      return e.subtle || e.webkitSubtle;
    },
    Yo = function () {
      var e =
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.',
        t = '';
      return (
        Array.from(Jo().getRandomValues(new Uint8Array(43))).forEach(function (
          n
        ) {
          return (t += e[n % e.length]);
        }),
        t
      );
    },
    Bo = function (e) {
      return btoa(e);
    },
    Mo = function (e) {
      return Object.keys(e)
        .filter(function (t) {
          return void 0 !== e[t];
        })
        .map(function (t) {
          return encodeURIComponent(t) + '=' + encodeURIComponent(e[t]);
        })
        .join('&');
    },
    qo = function (e) {
      return o(void 0, void 0, void 0, function () {
        var t;
        return i(this, function (n) {
          switch (n.label) {
            case 0:
              return (
                (t = Do().digest(
                  { name: 'SHA-256' },
                  new TextEncoder().encode(e)
                )),
                window.msCrypto
                  ? [
                      2,
                      new Promise(function (e, n) {
                        (t.oncomplete = function (t) {
                          e(t.target.result);
                        }),
                          (t.onerror = function (e) {
                            n(e.error);
                          }),
                          (t.onabort = function () {
                            n('The digest operation was aborted');
                          });
                      })
                    ]
                  : [4, t]
              );
            case 1:
              return [2, n.sent()];
          }
        });
      });
    },
    Ho = function (e) {
      return (function (e) {
        return decodeURIComponent(
          atob(e)
            .split('')
            .map(function (e) {
              return '%' + ('00' + e.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
      })(e.replace(/_/g, '/').replace(/-/g, '+'));
    },
    Qo = function (e) {
      var t = new Uint8Array(e);
      return (function (e) {
        var t = { '+': '-', '/': '_', '=': '' };
        return e.replace(/[+/=]/g, function (e) {
          return t[e];
        });
      })(window.btoa(String.fromCharCode.apply(String, Array.from(t))));
    };
  var $o = function (e, t) {
      return o(void 0, void 0, void 0, function () {
        var n, r;
        return i(this, function (o) {
          switch (o.label) {
            case 0:
              return [
                4,
                ((i = e),
                (a = t),
                (a = a || {}),
                new Promise(function (e, t) {
                  var n = new XMLHttpRequest(),
                    r = [],
                    o = [],
                    c = {},
                    s = function () {
                      return {
                        ok: 2 == ((n.status / 100) | 0),
                        statusText: n.statusText,
                        status: n.status,
                        url: n.responseURL,
                        text: function () {
                          return Promise.resolve(n.responseText);
                        },
                        json: function () {
                          return Promise.resolve(n.responseText).then(
                            JSON.parse
                          );
                        },
                        blob: function () {
                          return Promise.resolve(new Blob([n.response]));
                        },
                        clone: s,
                        headers: {
                          keys: function () {
                            return r;
                          },
                          entries: function () {
                            return o;
                          },
                          get: function (e) {
                            return c[e.toLowerCase()];
                          },
                          has: function (e) {
                            return e.toLowerCase() in c;
                          }
                        }
                      };
                    };
                  for (var u in (n.open(a.method || 'get', i, !0),
                  (n.onload = function () {
                    n
                      .getAllResponseHeaders()
                      .replace(
                        /^(.*?):[^\S\n]*([\s\S]*?)$/gm,
                        function (e, t, n) {
                          r.push((t = t.toLowerCase())),
                            o.push([t, n]),
                            (c[t] = c[t] ? c[t] + ',' + n : n);
                        }
                      ),
                      e(s());
                  }),
                  (n.onerror = t),
                  (n.withCredentials = 'include' == a.credentials),
                  a.headers))
                    n.setRequestHeader(u, a.headers[u]);
                  n.send(a.body || null);
                }))
              ];
            case 1:
              return (n = o.sent()), (r = { ok: n.ok }), [4, n.json()];
            case 2:
              return [2, ((r.json = o.sent()), r)];
          }
          var i, a;
        });
      });
    },
    ei = function (e, t, n) {
      return o(void 0, void 0, void 0, function () {
        var r, o;
        return i(this, function (i) {
          return (
            (r = new AbortController()),
            (t.signal = r.signal),
            [
              2,
              Promise.race([
                $o(e, t),
                new Promise(function (e, t) {
                  o = setTimeout(function () {
                    r.abort(), t(new Error("Timeout when executing 'fetch'"));
                  }, n);
                })
              ]).finally(function () {
                clearTimeout(o);
              })
            ]
          );
        });
      });
    },
    ti = function (e, t, n, r, a, c) {
      return o(void 0, void 0, void 0, function () {
        return i(this, function (o) {
          return [
            2,
            ((i = {
              auth: { audience: t, scope: n },
              timeout: a,
              fetchUrl: e,
              fetchOptions: r
            }),
            (s = c),
            new Promise(function (e, t) {
              var n = new MessageChannel();
              (n.port1.onmessage = function (n) {
                n.data.error ? t(new Error(n.data.error)) : e(n.data);
              }),
                s.postMessage(i, [n.port2]);
            }))
          ];
          var i, s;
        });
      });
    },
    ni = function (e, t, n, r, a, c) {
      return (
        void 0 === c && (c = 1e4),
        o(void 0, void 0, void 0, function () {
          return i(this, function (o) {
            return a ? [2, ti(e, t, n, r, c, a)] : [2, ei(e, r, c)];
          });
        })
      );
    };
  function ri(e, t, n, a, c, s) {
    return o(this, void 0, void 0, function () {
      var o, u, l, f, d, p, h, y;
      return i(this, function (i) {
        switch (i.label) {
          case 0:
            (o = null), (l = 0), (i.label = 1);
          case 1:
            if (!(l < 3)) return [3, 6];
            i.label = 2;
          case 2:
            return i.trys.push([2, 4, , 5]), [4, ni(e, n, a, c, s, t)];
          case 3:
            return (u = i.sent()), (o = null), [3, 6];
          case 4:
            return (f = i.sent()), (o = f), [3, 5];
          case 5:
            return l++, [3, 1];
          case 6:
            if (o) throw ((o.message = o.message || 'Failed to fetch'), o);
            if (
              ((d = u.json),
              (p = d.error),
              (h = d.error_description),
              (y = r(d, ['error', 'error_description'])),
              !u.ok)
            )
              throw new zo(
                p || 'request_error',
                h || 'HTTP error. Unable to fetch ' + e
              );
            return [2, y];
        }
      });
    });
  }
  function oi(e, t) {
    var n = e.baseUrl,
      a = e.timeout,
      c = e.audience,
      s = e.scope,
      u = e.auth0Client,
      l = r(e, ['baseUrl', 'timeout', 'audience', 'scope', 'auth0Client']);
    return o(this, void 0, void 0, function () {
      return i(this, function (e) {
        switch (e.label) {
          case 0:
            return [
              4,
              ri(
                n + '/oauth/token',
                a,
                c || 'default',
                s,
                {
                  method: 'POST',
                  body: JSON.stringify(l),
                  headers: {
                    'Content-type': 'application/json',
                    'Auth0-Client': btoa(JSON.stringify(u || Wo))
                  }
                },
                t
              )
            ];
          case 1:
            return [2, e.sent()];
        }
      });
    });
  }
  var ii = function (e) {
      return Array.from(new Set(e));
    },
    ai = function () {
      for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
      return ii(e.join(' ').trim().split(/\s+/)).join(' ');
    },
    ci = (function () {
      function e(e, t) {
        void 0 === t && (t = si),
          (this.prefix = t),
          (this.client_id = e.client_id),
          (this.scope = e.scope),
          (this.audience = e.audience);
      }
      return (
        (e.prototype.toKey = function () {
          return (
            this.prefix +
            '::' +
            this.client_id +
            '::' +
            this.audience +
            '::' +
            this.scope
          );
        }),
        (e.fromKey = function (t) {
          var n = t.split('::'),
            r = n[0],
            o = n[1],
            i = n[2];
          return new e({ client_id: o, scope: n[3], audience: i }, r);
        }),
        e
      );
    })(),
    si = '@@auth0spajs@@',
    ui = function (e) {
      var t = Math.floor(Date.now() / 1e3) + e.expires_in;
      return { body: e, expiresAt: Math.min(t, e.decodedToken.claims.exp) };
    },
    li = function (e, t) {
      var n = e.client_id,
        r = e.audience,
        o = e.scope;
      return t.filter(function (e) {
        var t = ci.fromKey(e),
          i = t.prefix,
          a = t.client_id,
          c = t.audience,
          s = t.scope,
          u = s && s.split(' '),
          l =
            s &&
            o.split(' ').reduce(function (e, t) {
              return e && u.includes(t);
            }, !0);
        return i === si && a === n && c === r && l;
      })[0];
    },
    fi = (function () {
      function e() {}
      return (
        (e.prototype.save = function (e) {
          var t = new ci({
              client_id: e.client_id,
              scope: e.scope,
              audience: e.audience
            }),
            n = ui(e);
          window.localStorage.setItem(t.toKey(), JSON.stringify(n));
        }),
        (e.prototype.get = function (e, t) {
          void 0 === t && (t = 0);
          var n = this.readJson(e),
            r = Math.floor(Date.now() / 1e3);
          if (n) {
            if (!(n.expiresAt - t < r)) return n.body;
            if (n.body.refresh_token) {
              var o = this.stripData(n);
              return this.writeJson(e.toKey(), o), o.body;
            }
            localStorage.removeItem(e.toKey());
          }
        }),
        (e.prototype.clear = function () {
          for (var e = localStorage.length - 1; e >= 0; e--)
            localStorage.key(e).startsWith(si) &&
              localStorage.removeItem(localStorage.key(e));
        }),
        (e.prototype.readJson = function (e) {
          var t,
            n = li(e, Object.keys(window.localStorage)),
            r = n && window.localStorage.getItem(n);
          if (r && (t = JSON.parse(r))) return t;
        }),
        (e.prototype.writeJson = function (e, t) {
          localStorage.setItem(e, JSON.stringify(t));
        }),
        (e.prototype.stripData = function (e) {
          return {
            body: { refresh_token: e.body.refresh_token },
            expiresAt: e.expiresAt
          };
        }),
        e
      );
    })(),
    di = function () {
      var e;
      this.enclosedCache =
        ((e = {}),
        {
          save: function (t) {
            var n = new ci({
                client_id: t.client_id,
                scope: t.scope,
                audience: t.audience
              }),
              r = ui(t);
            e[n.toKey()] = r;
          },
          get: function (t, n) {
            void 0 === n && (n = 0);
            var r = li(t, Object.keys(e)),
              o = e[r],
              i = Math.floor(Date.now() / 1e3);
            if (o)
              return o.expiresAt - n < i
                ? o.body.refresh_token
                  ? ((o.body = { refresh_token: o.body.refresh_token }), o.body)
                  : void delete e[t.toKey()]
                : o.body;
          },
          clear: function () {
            e = {};
          }
        });
    },
    pi = 'a0.spajs.txs',
    hi = (function () {
      function e(e) {
        (this.storage = e), (this.transaction = this.storage.get(pi));
      }
      return (
        (e.prototype.create = function (e) {
          (this.transaction = e),
            this.storage.save(pi, e, { daysUntilExpire: 1 });
        }),
        (e.prototype.get = function () {
          return this.transaction;
        }),
        (e.prototype.remove = function () {
          delete this.transaction, this.storage.remove(pi);
        }),
        e
      );
    })(),
    yi = function (e) {
      return 'number' == typeof e;
    },
    vi = [
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
    ],
    mi = function (e) {
      if (!e.id_token) throw new Error('ID token is required but missing');
      var t = (function (e) {
        var t = e.split('.'),
          n = t[0],
          r = t[1],
          o = t[2];
        if (3 !== t.length || !n || !r || !o)
          throw new Error('ID token could not be decoded');
        var i = JSON.parse(Ho(r)),
          a = { __raw: e },
          c = {};
        return (
          Object.keys(i).forEach(function (e) {
            (a[e] = i[e]), vi.includes(e) || (c[e] = i[e]);
          }),
          {
            encoded: { header: n, payload: r, signature: o },
            header: JSON.parse(Ho(n)),
            claims: a,
            user: c
          }
        );
      })(e.id_token);
      if (!t.claims.iss)
        throw new Error(
          'Issuer (iss) claim must be a string present in the ID token'
        );
      if (t.claims.iss !== e.iss)
        throw new Error(
          'Issuer (iss) claim mismatch in the ID token; expected "' +
            e.iss +
            '", found "' +
            t.claims.iss +
            '"'
        );
      if (!t.user.sub)
        throw new Error(
          'Subject (sub) claim must be a string present in the ID token'
        );
      if ('RS256' !== t.header.alg)
        throw new Error(
          'Signature algorithm of "' +
            t.header.alg +
            '" is not supported. Expected the ID token to be signed with "RS256".'
        );
      if (
        !t.claims.aud ||
        ('string' != typeof t.claims.aud && !Array.isArray(t.claims.aud))
      )
        throw new Error(
          'Audience (aud) claim must be a string or array of strings present in the ID token'
        );
      if (Array.isArray(t.claims.aud)) {
        if (!t.claims.aud.includes(e.aud))
          throw new Error(
            'Audience (aud) claim mismatch in the ID token; expected "' +
              e.aud +
              '" but was not one of "' +
              t.claims.aud.join(', ') +
              '"'
          );
        if (t.claims.aud.length > 1) {
          if (!t.claims.azp)
            throw new Error(
              'Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values'
            );
          if (t.claims.azp !== e.aud)
            throw new Error(
              'Authorized Party (azp) claim mismatch in the ID token; expected "' +
                e.aud +
                '", found "' +
                t.claims.azp +
                '"'
            );
        }
      } else if (t.claims.aud !== e.aud)
        throw new Error(
          'Audience (aud) claim mismatch in the ID token; expected "' +
            e.aud +
            '" but found "' +
            t.claims.aud +
            '"'
        );
      if (e.nonce) {
        if (!t.claims.nonce)
          throw new Error(
            'Nonce (nonce) claim must be a string present in the ID token'
          );
        if (t.claims.nonce !== e.nonce)
          throw new Error(
            'Nonce (nonce) claim mismatch in the ID token; expected "' +
              e.nonce +
              '", found "' +
              t.claims.nonce +
              '"'
          );
      }
      if (e.max_age && !yi(t.claims.auth_time))
        throw new Error(
          'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
        );
      if (!yi(t.claims.exp))
        throw new Error(
          'Expiration Time (exp) claim must be a number present in the ID token'
        );
      if (!yi(t.claims.iat))
        throw new Error(
          'Issued At (iat) claim must be a number present in the ID token'
        );
      var n = e.leeway || 60,
        r = new Date(Date.now()),
        o = new Date(0),
        i = new Date(0),
        a = new Date(0);
      if (
        (a.setUTCSeconds(parseInt(t.claims.auth_time) + e.max_age + n),
        o.setUTCSeconds(t.claims.exp + n),
        i.setUTCSeconds(t.claims.nbf - n),
        r > o)
      )
        throw new Error(
          'Expiration Time (exp) claim error in the ID token; current time (' +
            r +
            ') is after expiration time (' +
            o +
            ')'
        );
      if (yi(t.claims.nbf) && r < i)
        throw new Error(
          "Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (" +
            r +
            ') is before ' +
            i
        );
      if (yi(t.claims.auth_time) && r > a)
        throw new Error(
          'Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Currrent time (' +
            r +
            ') is after last auth at ' +
            a
        );
      if (e.organizationId) {
        if (!t.claims.org_id)
          throw new Error(
            'Organization ID (org_id) claim must be a string present in the ID token'
          );
        if (e.organizationId !== t.claims.org_id)
          throw new Error(
            'Organization ID (org_id) claim mismatch in the ID token; expected "' +
              e.organizationId +
              '", found "' +
              t.claims.org_id +
              '"'
          );
      }
      return t;
    },
    gi = s(function (e, t) {
      var n =
        (a && a.__assign) ||
        function () {
          return (n =
            Object.assign ||
            function (e) {
              for (var t, n = 1, r = arguments.length; n < r; n++)
                for (var o in (t = arguments[n]))
                  Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
              return e;
            }).apply(this, arguments);
        };
      function r(e, t) {
        if (!t) return '';
        var n = '; ' + e;
        return !0 === t ? n : n + '=' + t;
      }
      function o(e, t, n) {
        return (
          encodeURIComponent(e)
            .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29') +
          '=' +
          encodeURIComponent(t).replace(
            /%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
            decodeURIComponent
          ) +
          (function (e) {
            if ('number' == typeof e.expires) {
              var t = new Date();
              t.setMilliseconds(t.getMilliseconds() + 864e5 * e.expires),
                (e.expires = t);
            }
            return (
              r('Expires', e.expires ? e.expires.toUTCString() : '') +
              r('Domain', e.domain) +
              r('Path', e.path) +
              r('Secure', e.secure) +
              r('SameSite', e.sameSite)
            );
          })(n)
        );
      }
      function i(e) {
        for (
          var t = {}, n = e ? e.split('; ') : [], r = /(%[\dA-F]{2})+/gi, o = 0;
          o < n.length;
          o++
        ) {
          var i = n[o].split('='),
            a = i.slice(1).join('=');
          '"' === a.charAt(0) && (a = a.slice(1, -1));
          try {
            t[i[0].replace(r, decodeURIComponent)] = a.replace(
              r,
              decodeURIComponent
            );
          } catch (e) {}
        }
        return t;
      }
      function c() {
        return i(document.cookie);
      }
      function s(e, t, r) {
        document.cookie = o(e, t, n({ path: '/' }, r));
      }
      (t.__esModule = !0),
        (t.encode = o),
        (t.parse = i),
        (t.getAll = c),
        (t.get = function (e) {
          return c()[e];
        }),
        (t.set = s),
        (t.remove = function (e, t) {
          s(e, '', n(n({}, t), { expires: -1 }));
        });
    });
  c(gi), gi.encode, gi.parse, gi.getAll;
  var bi = gi.get,
    wi = gi.set,
    Si = gi.remove,
    _i = {
      get: function (e) {
        var t = bi(e);
        if (void 0 !== t) return JSON.parse(t);
      },
      save: function (e, t, n) {
        var r = {};
        'https:' === window.location.protocol &&
          (r = { secure: !0, sameSite: 'none' }),
          (r.expires = n.daysUntilExpire),
          wi(e, JSON.stringify(t), r);
      },
      remove: function (e) {
        Si(e);
      }
    },
    ki = {
      get: function (e) {
        var t = _i.get(e);
        return t || _i.get('_legacy_' + e);
      },
      save: function (e, t, n) {
        var r = {};
        'https:' === window.location.protocol && (r = { secure: !0 }),
          (r.expires = n.daysUntilExpire),
          wi('_legacy_' + e, JSON.stringify(t), r),
          _i.save(e, t, n);
      },
      remove: function (e) {
        _i.remove(e), _i.remove('_legacy_' + e);
      }
    },
    Ii = {
      get: function (e) {
        if ('undefined' != typeof sessionStorage) {
          var t = sessionStorage.getItem(e);
          if (void 0 !== t) return JSON.parse(t);
        }
      },
      save: function (e, t) {
        sessionStorage.setItem(e, JSON.stringify(t));
      },
      remove: function (e) {
        sessionStorage.removeItem(e);
      }
    };
  function Ti(e, t, n) {
    var r = void 0 === t ? null : t,
      o = (function (e, t) {
        var n = atob(e);
        if (t) {
          for (
            var r = new Uint8Array(n.length), o = 0, i = n.length;
            o < i;
            ++o
          )
            r[o] = n.charCodeAt(o);
          return String.fromCharCode.apply(null, new Uint16Array(r.buffer));
        }
        return n;
      })(e, void 0 !== n && n),
      i = o.indexOf('\n', 10) + 1,
      a = o.substring(i) + (r ? '//# sourceMappingURL=' + r : ''),
      c = new Blob([a], { type: 'application/javascript' });
    return URL.createObjectURL(c);
  }
  var Oi,
    Ei,
    xi,
    Ci,
    Ri =
      ((Oi =
        'Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7Ci8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgogICAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uCgogICAgUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55CiAgICBwdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuCgogICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICJBUyBJUyIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEgKICAgIFJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULAogICAgSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NCiAgICBMT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUgogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUgogICAgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS4KICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovdmFyIGU9ZnVuY3Rpb24oKXtyZXR1cm4oZT1PYmplY3QuYXNzaWdufHxmdW5jdGlvbihlKXtmb3IodmFyIHQscj0xLG49YXJndW1lbnRzLmxlbmd0aDtyPG47cisrKWZvcih2YXIgbyBpbiB0PWFyZ3VtZW50c1tyXSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodCxvKSYmKGVbb109dFtvXSk7cmV0dXJuIGV9KS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9O2Z1bmN0aW9uIHQoZSx0LHIsbil7cmV0dXJuIG5ldyhyfHwocj1Qcm9taXNlKSkoKGZ1bmN0aW9uKG8scyl7ZnVuY3Rpb24gYShlKXt0cnl7dShuLm5leHQoZSkpfWNhdGNoKGUpe3MoZSl9fWZ1bmN0aW9uIGkoZSl7dHJ5e3Uobi50aHJvdyhlKSl9Y2F0Y2goZSl7cyhlKX19ZnVuY3Rpb24gdShlKXt2YXIgdDtlLmRvbmU/byhlLnZhbHVlKToodD1lLnZhbHVlLHQgaW5zdGFuY2VvZiByP3Q6bmV3IHIoKGZ1bmN0aW9uKGUpe2UodCl9KSkpLnRoZW4oYSxpKX11KChuPW4uYXBwbHkoZSx0fHxbXSkpLm5leHQoKSl9KSl9ZnVuY3Rpb24gcihlLHQpe3ZhciByLG4sbyxzLGE9e2xhYmVsOjAsc2VudDpmdW5jdGlvbigpe2lmKDEmb1swXSl0aHJvdyBvWzFdO3JldHVybiBvWzFdfSx0cnlzOltdLG9wczpbXX07cmV0dXJuIHM9e25leHQ6aSgwKSx0aHJvdzppKDEpLHJldHVybjppKDIpfSwiZnVuY3Rpb24iPT10eXBlb2YgU3ltYm9sJiYoc1tTeW1ib2wuaXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9KSxzO2Z1bmN0aW9uIGkocyl7cmV0dXJuIGZ1bmN0aW9uKGkpe3JldHVybiBmdW5jdGlvbihzKXtpZihyKXRocm93IG5ldyBUeXBlRXJyb3IoIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy4iKTtmb3IoO2E7KXRyeXtpZihyPTEsbiYmKG89MiZzWzBdP24ucmV0dXJuOnNbMF0/bi50aHJvd3x8KChvPW4ucmV0dXJuKSYmby5jYWxsKG4pLDApOm4ubmV4dCkmJiEobz1vLmNhbGwobixzWzFdKSkuZG9uZSlyZXR1cm4gbztzd2l0Y2gobj0wLG8mJihzPVsyJnNbMF0sby52YWx1ZV0pLHNbMF0pe2Nhc2UgMDpjYXNlIDE6bz1zO2JyZWFrO2Nhc2UgNDpyZXR1cm4gYS5sYWJlbCsrLHt2YWx1ZTpzWzFdLGRvbmU6ITF9O2Nhc2UgNTphLmxhYmVsKyssbj1zWzFdLHM9WzBdO2NvbnRpbnVlO2Nhc2UgNzpzPWEub3BzLnBvcCgpLGEudHJ5cy5wb3AoKTtjb250aW51ZTtkZWZhdWx0OmlmKCEobz1hLnRyeXMsKG89by5sZW5ndGg+MCYmb1tvLmxlbmd0aC0xXSl8fDYhPT1zWzBdJiYyIT09c1swXSkpe2E9MDtjb250aW51ZX1pZigzPT09c1swXSYmKCFvfHxzWzFdPm9bMF0mJnNbMV08b1szXSkpe2EubGFiZWw9c1sxXTticmVha31pZig2PT09c1swXSYmYS5sYWJlbDxvWzFdKXthLmxhYmVsPW9bMV0sbz1zO2JyZWFrfWlmKG8mJmEubGFiZWw8b1syXSl7YS5sYWJlbD1vWzJdLGEub3BzLnB1c2gocyk7YnJlYWt9b1syXSYmYS5vcHMucG9wKCksYS50cnlzLnBvcCgpO2NvbnRpbnVlfXM9dC5jYWxsKGUsYSl9Y2F0Y2goZSl7cz1bNixlXSxuPTB9ZmluYWxseXtyPW89MH1pZig1JnNbMF0pdGhyb3cgc1sxXTtyZXR1cm57dmFsdWU6c1swXT9zWzFdOnZvaWQgMCxkb25lOiEwfX0oW3MsaV0pfX19dmFyIG49e30sbz1mdW5jdGlvbihlLHQpe3JldHVybiBlKyJ8Iit0fTthZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwoZnVuY3Rpb24ocyl7dmFyIGE9cy5kYXRhLGk9YS50aW1lb3V0LHU9YS5hdXRoLGM9YS5mZXRjaFVybCxmPWEuZmV0Y2hPcHRpb25zLGw9cy5wb3J0c1swXTtyZXR1cm4gdCh2b2lkIDAsdm9pZCAwLHZvaWQgMCwoZnVuY3Rpb24oKXt2YXIgdCxzLGEsaCxwLGIseSxkLHYsdztyZXR1cm4gcih0aGlzLChmdW5jdGlvbihyKXtzd2l0Y2goci5sYWJlbCl7Y2FzZSAwOmE9KHM9dXx8e30pLmF1ZGllbmNlLGg9cy5zY29wZSxyLmxhYmVsPTE7Y2FzZSAxOmlmKHIudHJ5cy5wdXNoKFsxLDcsLDhdKSwhKHA9SlNPTi5wYXJzZShmLmJvZHkpKS5yZWZyZXNoX3Rva2VuJiYicmVmcmVzaF90b2tlbiI9PT1wLmdyYW50X3R5cGUpe2lmKCEoYj1mdW5jdGlvbihlLHQpe3JldHVybiBuW28oZSx0KV19KGEsaCkpKXRocm93IG5ldyBFcnJvcigiVGhlIHdlYiB3b3JrZXIgaXMgbWlzc2luZyB0aGUgcmVmcmVzaCB0b2tlbiIpO2YuYm9keT1KU09OLnN0cmluZ2lmeShlKGUoe30scCkse3JlZnJlc2hfdG9rZW46Yn0pKX15PXZvaWQgMCwiZnVuY3Rpb24iPT10eXBlb2YgQWJvcnRDb250cm9sbGVyJiYoeT1uZXcgQWJvcnRDb250cm9sbGVyLGYuc2lnbmFsPXkuc2lnbmFsKSxkPXZvaWQgMCxyLmxhYmVsPTI7Y2FzZSAyOnJldHVybiByLnRyeXMucHVzaChbMiw0LCw1XSksWzQsUHJvbWlzZS5yYWNlKFsoZz1pLG5ldyBQcm9taXNlKChmdW5jdGlvbihlKXtyZXR1cm4gc2V0VGltZW91dChlLGcpfSkpKSxmZXRjaChjLGUoe30sZikpXSldO2Nhc2UgMzpyZXR1cm4gZD1yLnNlbnQoKSxbMyw1XTtjYXNlIDQ6cmV0dXJuIHY9ci5zZW50KCksbC5wb3N0TWVzc2FnZSh7ZXJyb3I6di5tZXNzYWdlfSksWzJdO2Nhc2UgNTpyZXR1cm4gZD9bNCxkLmpzb24oKV06KHkmJnkuYWJvcnQoKSxsLnBvc3RNZXNzYWdlKHtlcnJvcjoiVGltZW91dCB3aGVuIGV4ZWN1dGluZyAnZmV0Y2gnIn0pLFsyXSk7Y2FzZSA2OnJldHVybih0PXIuc2VudCgpKS5yZWZyZXNoX3Rva2VuPyhmdW5jdGlvbihlLHQscil7bltvKHQscildPWV9KHQucmVmcmVzaF90b2tlbixhLGgpLGRlbGV0ZSB0LnJlZnJlc2hfdG9rZW4pOmZ1bmN0aW9uKGUsdCl7ZGVsZXRlIG5bbyhlLHQpXX0oYSxoKSxsLnBvc3RNZXNzYWdlKHtvazpkLm9rLGpzb246dH0pLFszLDhdO2Nhc2UgNzpyZXR1cm4gdz1yLnNlbnQoKSxsLnBvc3RNZXNzYWdlKHtvazohMSxqc29uOntlcnJvcl9kZXNjcmlwdGlvbjp3Lm1lc3NhZ2V9fSksWzMsOF07Y2FzZSA4OnJldHVyblsyXX12YXIgZ30pKX0pKX0pKX0oKTsKCg=='),
      (Ei = null),
      (xi = !1),
      function (e) {
        return (Ci = Ci || Ti(Oi, Ei, xi)), new Worker(Ci, e);
      }),
    Li = {},
    Ai = new jo(),
    Ui = 'auth0.lock.getTokenSilently',
    ji = {
      memory: function () {
        return new di().enclosedCache;
      },
      localstorage: function () {
        return new fi();
      }
    },
    Pi = function (e) {
      return ji[e];
    },
    Fi = function () {
      return !/Trident.*rv:11\.0/.test(navigator.userAgent);
    },
    Ki = (function () {
      function e(e) {
        var t, n;
        if (
          ((this.options = e),
          'undefined' != typeof window &&
            (function () {
              if (!Jo())
                throw new Error(
                  'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
                );
              if (void 0 === Do())
                throw new Error(
                  '\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    '
                );
            })(),
          (this.cacheLocation = e.cacheLocation || Fo),
          (this.cookieStorage = !1 === e.legacySameSiteCookie ? _i : ki),
          (this.sessionCheckExpiryDays = e.sessionCheckExpiryDays || 1),
          !Pi(this.cacheLocation))
        )
          throw new Error(
            'Invalid cache location "' + this.cacheLocation + '"'
          );
        var o,
          i,
          a = e.useCookiesForTransactions ? this.cookieStorage : Ii;
        (this.cache = Pi(this.cacheLocation)()),
          (this.scope = this.options.scope),
          (this.transactionManager = new hi(a)),
          (this.domainUrl = 'https://' + this.options.domain),
          (this.tokenIssuer =
            ((o = this.options.issuer),
            (i = this.domainUrl),
            o
              ? o.startsWith('https://')
                ? o
                : 'https://' + o + '/'
              : i + '/')),
          (this.defaultScope = ai(
            'openid',
            void 0 !==
              (null ===
                (n =
                  null === (t = this.options) || void 0 === t
                    ? void 0
                    : t.advancedOptions) || void 0 === n
                ? void 0
                : n.defaultScope)
              ? this.options.advancedOptions.defaultScope
              : 'openid profile email'
          )),
          this.options.useRefreshTokens &&
            (this.scope = ai(this.scope, 'offline_access')),
          'undefined' != typeof window &&
            window.Worker &&
            this.options.useRefreshTokens &&
            this.cacheLocation === Fo &&
            Fi() &&
            (this.worker = new Ri()),
          (this.customOptions = (function (e) {
            return (
              e.advancedOptions,
              e.audience,
              e.auth0Client,
              e.authorizeTimeoutInSeconds,
              e.cacheLocation,
              e.client_id,
              e.domain,
              e.issuer,
              e.leeway,
              e.max_age,
              e.redirect_uri,
              e.scope,
              e.useRefreshTokens,
              r(e, [
                'advancedOptions',
                'audience',
                'auth0Client',
                'authorizeTimeoutInSeconds',
                'cacheLocation',
                'client_id',
                'domain',
                'issuer',
                'leeway',
                'max_age',
                'redirect_uri',
                'scope',
                'useRefreshTokens'
              ])
            );
          })(e));
      }
      return (
        (e.prototype._url = function (e) {
          var t = encodeURIComponent(
            btoa(JSON.stringify(this.options.auth0Client || Wo))
          );
          return '' + this.domainUrl + e + '&auth0Client=' + t;
        }),
        (e.prototype._getParams = function (e, t, o, i, a) {
          var c = this.options;
          c.domain,
            c.leeway,
            c.useRefreshTokens,
            c.useCookiesForTransactions,
            c.auth0Client,
            c.cacheLocation,
            c.advancedOptions;
          var s = r(c, [
            'domain',
            'leeway',
            'useRefreshTokens',
            'useCookiesForTransactions',
            'auth0Client',
            'cacheLocation',
            'advancedOptions'
          ]);
          return n(n(n({}, s), e), {
            scope: ai(this.defaultScope, this.scope, e.scope),
            response_type: 'code',
            response_mode: 'query',
            state: t,
            nonce: o,
            redirect_uri: a || this.options.redirect_uri,
            code_challenge: i,
            code_challenge_method: 'S256'
          });
        }),
        (e.prototype._authorizeUrl = function (e) {
          return this._url('/authorize?' + Mo(e));
        }),
        (e.prototype._verifyIdToken = function (e, t, n) {
          return mi({
            iss: this.tokenIssuer,
            aud: this.options.client_id,
            id_token: e,
            nonce: t,
            organizationId: n,
            leeway: this.options.leeway,
            max_age: this._parseNumber(this.options.max_age)
          });
        }),
        (e.prototype._parseNumber = function (e) {
          return 'string' != typeof e ? e : parseInt(e, 10) || void 0;
        }),
        (e.prototype.buildAuthorizeUrl = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t, o, a, c, s, u, l, f, d, p, h, y;
              return i(this, function (i) {
                switch (i.label) {
                  case 0:
                    return (
                      (t = e.redirect_uri),
                      (o = e.appState),
                      (a = r(e, ['redirect_uri', 'appState'])),
                      (c = Bo(Yo())),
                      (s = Bo(Yo())),
                      (u = Yo()),
                      [4, qo(u)]
                    );
                  case 1:
                    return (
                      (l = i.sent()),
                      (f = Qo(l)),
                      (d = e.fragment ? '#' + e.fragment : ''),
                      (p = this._getParams(a, c, s, f, t)),
                      (h = this._authorizeUrl(p)),
                      (y = e.organization || this.options.organization),
                      this.transactionManager.create(
                        n(
                          {
                            nonce: s,
                            code_verifier: u,
                            appState: o,
                            scope: p.scope,
                            audience: p.audience || 'default',
                            redirect_uri: p.redirect_uri
                          },
                          y && { organizationId: y }
                        )
                      ),
                      [2, h + d]
                    );
                }
              });
            })
          );
        }),
        (e.prototype.loginWithPopup = function (e, t) {
          return o(this, void 0, void 0, function () {
            var o, a, c, s, u, l, f, d, p, h, y, v, m;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (
                    (e = e || {}),
                    (t = t || {}).popup ||
                      (t.popup = (function (e) {
                        var t = window.screenX + (window.innerWidth - 400) / 2,
                          n = window.screenY + (window.innerHeight - 600) / 2;
                        return window.open(
                          e,
                          'auth0:authorize:popup',
                          'left=' +
                            t +
                            ',top=' +
                            n +
                            ',width=400,height=600,resizable,scrollbars=yes,status=1'
                        );
                      })('')),
                    (o = r(e, [])),
                    (a = Bo(Yo())),
                    (c = Bo(Yo())),
                    (s = Yo()),
                    [4, qo(s)]
                  );
                case 1:
                  return (
                    (u = i.sent()),
                    (l = Qo(u)),
                    (f = this._getParams(
                      o,
                      a,
                      c,
                      l,
                      this.options.redirect_uri || window.location.origin
                    )),
                    (d = this._authorizeUrl(
                      n(n({}, f), { response_mode: 'web_message' })
                    )),
                    (t.popup.location.href = d),
                    [
                      4,
                      Go(
                        n(n({}, t), {
                          timeoutInSeconds:
                            t.timeoutInSeconds ||
                            this.options.authorizeTimeoutInSeconds ||
                            60
                        })
                      )
                    ]
                  );
                case 2:
                  if (((p = i.sent()), a !== p.state))
                    throw new Error('Invalid state');
                  return [
                    4,
                    oi(
                      {
                        audience: f.audience,
                        scope: f.scope,
                        baseUrl: this.domainUrl,
                        client_id: this.options.client_id,
                        code_verifier: s,
                        code: p.code,
                        grant_type: 'authorization_code',
                        redirect_uri: f.redirect_uri,
                        auth0Client: this.options.auth0Client
                      },
                      this.worker
                    )
                  ];
                case 3:
                  return (
                    (h = i.sent()),
                    (y = e.organization || this.options.organization),
                    (v = this._verifyIdToken(h.id_token, c, y)),
                    (m = n(n({}, h), {
                      decodedToken: v,
                      scope: f.scope,
                      audience: f.audience || 'default',
                      client_id: this.options.client_id
                    })),
                    this.cache.save(m),
                    this.cookieStorage.save('auth0.is.authenticated', !0, {
                      daysUntilExpire: this.sessionCheckExpiryDays
                    }),
                    [2]
                  );
              }
            });
          });
        }),
        (e.prototype.getUser = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t, n, r;
              return i(this, function (o) {
                return (
                  (t = e.audience || this.options.audience || 'default'),
                  (n = ai(this.defaultScope, this.scope, e.scope)),
                  [
                    2,
                    (r = this.cache.get(
                      new ci({
                        client_id: this.options.client_id,
                        audience: t,
                        scope: n
                      })
                    )) &&
                      r.decodedToken &&
                      r.decodedToken.user
                  ]
                );
              });
            })
          );
        }),
        (e.prototype.getIdTokenClaims = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t, n, r;
              return i(this, function (o) {
                return (
                  (t = e.audience || this.options.audience || 'default'),
                  (n = ai(this.defaultScope, this.scope, e.scope)),
                  [
                    2,
                    (r = this.cache.get(
                      new ci({
                        client_id: this.options.client_id,
                        audience: t,
                        scope: n
                      })
                    )) &&
                      r.decodedToken &&
                      r.decodedToken.claims
                  ]
                );
              });
            })
          );
        }),
        (e.prototype.loginWithRedirect = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t, n, o, a, c;
              return i(this, function (i) {
                switch (i.label) {
                  case 0:
                    return (
                      (t = e.redirectMethod),
                      (n = e.platform),
                      (o = void 0 === n ? 'web' : n),
                      (a = r(e, ['redirectMethod', 'platform'])),
                      [4, this.buildAuthorizeUrl(a)]
                    );
                  case 1:
                    return (
                      (c = i.sent()),
                      console.log({
                        platform: o,
                        redirect_uri: a.redirect_uri,
                        url: c
                      }),
                      'web' === o
                        ? (window.location[t || 'assign'](c), [2])
                        : [2]
                    );
                }
              });
            })
          );
        }),
        (e.prototype.handleRedirectCallback = function (e) {
          return (
            void 0 === e && (e = window.location.href),
            o(this, void 0, void 0, function () {
              var t, r, o, a, c, s, u, l, f, d, p;
              return i(this, function (i) {
                switch (i.label) {
                  case 0:
                    if (0 === (t = e.split('?').slice(1)).length)
                      throw new Error(
                        'There are no query params available for parsing.'
                      );
                    if (
                      ((r = (function (e) {
                        e.indexOf('#') > -1 &&
                          (e = e.substr(0, e.indexOf('#')));
                        var t = e.split('&'),
                          r = {};
                        return (
                          t.forEach(function (e) {
                            var t = e.split('='),
                              n = t[0],
                              o = t[1];
                            r[n] = decodeURIComponent(o);
                          }),
                          n(n({}, r), { expires_in: parseInt(r.expires_in) })
                        );
                      })(t.join(''))),
                      (o = r.state),
                      (a = r.code),
                      (c = r.error),
                      (s = r.error_description),
                      !(u = this.transactionManager.get()) || !u.code_verifier)
                    )
                      throw new Error('Invalid state');
                    if ((this.transactionManager.remove(), c))
                      throw new Vo(c, s, o, u.appState);
                    return (
                      (l = {
                        audience: u.audience,
                        scope: u.scope,
                        baseUrl: this.domainUrl,
                        client_id: this.options.client_id,
                        code_verifier: u.code_verifier,
                        grant_type: 'authorization_code',
                        code: a,
                        auth0Client: this.options.auth0Client
                      }),
                      void 0 !== u.redirect_uri &&
                        (l.redirect_uri = u.redirect_uri),
                      [4, oi(l, this.worker)]
                    );
                  case 1:
                    return (
                      (f = i.sent()),
                      (d = this._verifyIdToken(
                        f.id_token,
                        u.nonce,
                        u.organizationId
                      )),
                      (p = n(n({}, f), {
                        decodedToken: d,
                        audience: u.audience,
                        scope: u.scope,
                        client_id: this.options.client_id
                      })),
                      this.cache.save(p),
                      this.cookieStorage.save('auth0.is.authenticated', !0, {
                        daysUntilExpire: this.sessionCheckExpiryDays
                      }),
                      [2, { appState: u.appState }]
                    );
                }
              });
            })
          );
        }),
        (e.prototype.checkSession = function (e) {
          return o(this, void 0, void 0, function () {
            var t;
            return i(this, function (n) {
              switch (n.label) {
                case 0:
                  if (!this.cookieStorage.get('auth0.is.authenticated'))
                    return [2];
                  n.label = 1;
                case 1:
                  return (
                    n.trys.push([1, 3, , 4]), [4, this.getTokenSilently(e)]
                  );
                case 2:
                  return n.sent(), [3, 4];
                case 3:
                  if (((t = n.sent()), !Ko.includes(t.error))) throw t;
                  return [3, 4];
                case 4:
                  return [2];
              }
            });
          });
        }),
        (e.prototype.getTokenSilently = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t,
                o,
                a,
                c = this;
              return i(this, function (i) {
                return (
                  (t = n(
                    n({ audience: this.options.audience, ignoreCache: !1 }, e),
                    { scope: ai(this.defaultScope, this.scope, e.scope) }
                  )),
                  (o = t.ignoreCache),
                  (a = r(t, ['ignoreCache'])),
                  [
                    2,
                    ((s = function () {
                      return c._getTokenSilently(n({ ignoreCache: o }, a));
                    }),
                    (u =
                      this.options.client_id +
                      '::' +
                      a.audience +
                      '::' +
                      a.scope),
                    (l = Li[u]),
                    l ||
                      ((l = s().finally(function () {
                        delete Li[u], (l = null);
                      })),
                      (Li[u] = l)),
                    l)
                  ]
                );
                var s, u, l;
              });
            })
          );
        }),
        (e.prototype._getTokenSilently = function (e) {
          return (
            void 0 === e && (e = {}),
            o(this, void 0, void 0, function () {
              var t,
                a,
                c,
                s,
                u,
                l,
                f = this;
              return i(this, function (d) {
                switch (d.label) {
                  case 0:
                    return (
                      (t = e.ignoreCache),
                      (a = r(e, ['ignoreCache'])),
                      (c = function () {
                        var e = f.cache.get(
                          new ci({
                            scope: a.scope,
                            audience: a.audience || 'default',
                            client_id: f.options.client_id
                          }),
                          60
                        );
                        return e && e.access_token;
                      }),
                      !t && (s = c())
                        ? [2, s]
                        : [
                            4,
                            ((p = function () {
                              return Ai.acquireLock(Ui, 5e3);
                            }),
                            (h = 10),
                            void 0 === h && (h = 3),
                            o(void 0, void 0, void 0, function () {
                              var e;
                              return i(this, function (t) {
                                switch (t.label) {
                                  case 0:
                                    (e = 0), (t.label = 1);
                                  case 1:
                                    return e < h ? [4, p()] : [3, 4];
                                  case 2:
                                    if (t.sent()) return [2, !0];
                                    t.label = 3;
                                  case 3:
                                    return e++, [3, 1];
                                  case 4:
                                    return [2, !1];
                                }
                              });
                            }))
                          ]
                    );
                  case 1:
                    if (!d.sent()) return [3, 10];
                    d.label = 2;
                  case 2:
                    return (
                      d.trys.push([2, , 7, 9]),
                      !t && (s = c())
                        ? [2, s]
                        : this.options.useRefreshTokens
                        ? [4, this._getTokenUsingRefreshToken(a)]
                        : [3, 4]
                    );
                  case 3:
                    return (l = d.sent()), [3, 6];
                  case 4:
                    return [4, this._getTokenFromIFrame(a)];
                  case 5:
                    (l = d.sent()), (d.label = 6);
                  case 6:
                    return (
                      (u = l),
                      this.cache.save(
                        n({ client_id: this.options.client_id }, u)
                      ),
                      this.cookieStorage.save('auth0.is.authenticated', !0, {
                        daysUntilExpire: this.sessionCheckExpiryDays
                      }),
                      [2, u.access_token]
                    );
                  case 7:
                    return [4, Ai.releaseLock(Ui)];
                  case 8:
                    return d.sent(), [7];
                  case 9:
                    return [3, 11];
                  case 10:
                    throw new Zo();
                  case 11:
                    return [2];
                }
                var p, h;
              });
            })
          );
        }),
        (e.prototype.getTokenWithPopup = function (e, t) {
          return (
            void 0 === e && (e = {}),
            void 0 === t && (t = {}),
            o(this, void 0, void 0, function () {
              return i(this, function (r) {
                switch (r.label) {
                  case 0:
                    return (
                      (e.audience = e.audience || this.options.audience),
                      (e.scope = ai(this.defaultScope, this.scope, e.scope)),
                      (t = n(n({}, Po), t)),
                      [4, this.loginWithPopup(e, t)]
                    );
                  case 1:
                    return (
                      r.sent(),
                      [
                        2,
                        this.cache.get(
                          new ci({
                            scope: e.scope,
                            audience: e.audience || 'default',
                            client_id: this.options.client_id
                          })
                        ).access_token
                      ]
                    );
                }
              });
            })
          );
        }),
        (e.prototype.isAuthenticated = function () {
          return o(this, void 0, void 0, function () {
            return i(this, function (e) {
              switch (e.label) {
                case 0:
                  return [4, this.getUser()];
                case 1:
                  return [2, !!e.sent()];
              }
            });
          });
        }),
        (e.prototype.buildLogoutUrl = function (e) {
          void 0 === e && (e = {}),
            null !== e.client_id
              ? (e.client_id = e.client_id || this.options.client_id)
              : delete e.client_id;
          var t = e.federated,
            n = r(e, ['federated']),
            o = t ? '&federated' : '';
          return this._url('/v2/logout?' + Mo(n)) + o;
        }),
        (e.prototype.logout = function (e) {
          void 0 === e && (e = {});
          var t = e.localOnly,
            n = r(e, ['localOnly']);
          if (t && n.federated)
            throw new Error(
              'It is invalid to set both the `federated` and `localOnly` options to `true`'
            );
          if (
            (this.cache.clear(),
            this.cookieStorage.remove('auth0.is.authenticated'),
            !t)
          ) {
            var o = this.buildLogoutUrl(n);
            window.location.assign(o);
          }
        }),
        (e.prototype._getTokenFromIFrame = function (e) {
          return o(this, void 0, void 0, function () {
            var t, o, a, c, s, u, l, f, d, p, h, y, v, m, g;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (t = Bo(Yo())), (o = Bo(Yo())), (a = Yo()), [4, qo(a)];
                case 1:
                  (c = i.sent()),
                    (s = Qo(c)),
                    (u = this._getParams(
                      e,
                      t,
                      o,
                      s,
                      e.redirect_uri ||
                        this.options.redirect_uri ||
                        window.location.origin
                    )),
                    (l = this._authorizeUrl(
                      n(n({}, u), {
                        prompt: 'none',
                        response_mode: 'web_message'
                      })
                    )),
                    (f =
                      e.timeoutInSeconds ||
                      this.options.authorizeTimeoutInSeconds),
                    (i.label = 2);
                case 2:
                  return (
                    i.trys.push([2, 5, , 6]),
                    [
                      4,
                      ((b = l),
                      (w = this.domainUrl),
                      (S = f),
                      void 0 === S && (S = 60),
                      new Promise(function (e, t) {
                        var n = window.document.createElement('iframe');
                        n.setAttribute('width', '0'),
                          n.setAttribute('height', '0'),
                          (n.style.display = 'none');
                        var r,
                          o = function () {
                            window.document.body.contains(n) &&
                              (window.document.body.removeChild(n),
                              window.removeEventListener('message', r, !1));
                          },
                          i = setTimeout(function () {
                            t(new Zo()), o();
                          }, 1e3 * S);
                        (r = function (n) {
                          if (
                            n.origin == w &&
                            n.data &&
                            'authorization_response' === n.data.type
                          ) {
                            var a = n.source;
                            a && a.close(),
                              n.data.response.error
                                ? t(zo.fromPayload(n.data.response))
                                : e(n.data.response),
                              clearTimeout(i),
                              window.removeEventListener('message', r, !1),
                              setTimeout(o, 2e3);
                          }
                        }),
                          window.addEventListener('message', r, !1),
                          window.document.body.appendChild(n),
                          n.setAttribute('src', b);
                      }))
                    ]
                  );
                case 3:
                  if (((d = i.sent()), t !== d.state))
                    throw new Error('Invalid state');
                  return (
                    (p = e.scope),
                    (h = e.audience),
                    e.redirect_uri,
                    e.ignoreCache,
                    e.timeoutInSeconds,
                    (y = r(e, [
                      'scope',
                      'audience',
                      'redirect_uri',
                      'ignoreCache',
                      'timeoutInSeconds'
                    ])),
                    [
                      4,
                      oi(
                        n(n(n({}, this.customOptions), y), {
                          scope: p,
                          audience: h,
                          baseUrl: this.domainUrl,
                          client_id: this.options.client_id,
                          code_verifier: a,
                          code: d.code,
                          grant_type: 'authorization_code',
                          redirect_uri: u.redirect_uri,
                          auth0Client: this.options.auth0Client
                        }),
                        this.worker
                      )
                    ]
                  );
                case 4:
                  return (
                    (v = i.sent()),
                    (m = this._verifyIdToken(v.id_token, o)),
                    [
                      2,
                      n(n({}, v), {
                        decodedToken: m,
                        scope: u.scope,
                        audience: u.audience || 'default'
                      })
                    ]
                  );
                case 5:
                  throw (
                    ('login_required' === (g = i.sent()).error &&
                      this.logout({ localOnly: !0 }),
                    g)
                  );
                case 6:
                  return [2];
              }
              var b, w, S;
            });
          });
        }),
        (e.prototype._getTokenUsingRefreshToken = function (e) {
          return o(this, void 0, void 0, function () {
            var t, o, a, c, s, u, l, f, d;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (
                    (e.scope = ai(
                      this.defaultScope,
                      this.options.scope,
                      e.scope
                    )),
                    ((t = this.cache.get(
                      new ci({
                        scope: e.scope,
                        audience: e.audience || 'default',
                        client_id: this.options.client_id
                      })
                    )) &&
                      t.refresh_token) ||
                    this.worker
                      ? [3, 2]
                      : [4, this._getTokenFromIFrame(e)]
                  );
                case 1:
                  return [2, i.sent()];
                case 2:
                  (o =
                    e.redirect_uri ||
                    this.options.redirect_uri ||
                    window.location.origin),
                    (c = e.scope),
                    (s = e.audience),
                    e.ignoreCache,
                    e.timeoutInSeconds,
                    (u = r(e, [
                      'scope',
                      'audience',
                      'ignoreCache',
                      'timeoutInSeconds'
                    ])),
                    (l =
                      'number' == typeof e.timeoutInSeconds
                        ? 1e3 * e.timeoutInSeconds
                        : null),
                    (i.label = 3);
                case 3:
                  return (
                    i.trys.push([3, 5, , 8]),
                    [
                      4,
                      oi(
                        n(
                          n(
                            n(n(n({}, this.customOptions), u), {
                              audience: s,
                              scope: c,
                              baseUrl: this.domainUrl,
                              client_id: this.options.client_id,
                              grant_type: 'refresh_token',
                              refresh_token: t && t.refresh_token,
                              redirect_uri: o
                            }),
                            l && { timeout: l }
                          ),
                          { auth0Client: this.options.auth0Client }
                        ),
                        this.worker
                      )
                    ]
                  );
                case 4:
                  return (a = i.sent()), [3, 8];
                case 5:
                  return 'The web worker is missing the refresh token' ===
                    (f = i.sent()).message ||
                    (f.message &&
                      f.message.indexOf('invalid refresh token') > -1)
                    ? [4, this._getTokenFromIFrame(e)]
                    : [3, 7];
                case 6:
                  return [2, i.sent()];
                case 7:
                  throw f;
                case 8:
                  return (
                    (d = this._verifyIdToken(a.id_token)),
                    [
                      2,
                      n(n({}, a), {
                        decodedToken: d,
                        scope: e.scope,
                        audience: e.audience || 'default'
                      })
                    ]
                  );
              }
            });
          });
        }),
        e
      );
    })();
  function Wi(e) {
    return o(this, void 0, void 0, function () {
      var t;
      return i(this, function (n) {
        switch (n.label) {
          case 0:
            return [4, (t = new Ki(e)).checkSession()];
          case 1:
            return n.sent(), [2, t];
        }
      });
    });
  }
  var zi = Wi;
  return (
    (zi.Auth0Client = Ki),
    (zi.createAuth0Client = Wi),
    (zi.GenericError = zo),
    (zi.AuthenticationError = Vo),
    (zi.TimeoutError = Zo),
    (zi.PopupTimeoutError = Xo),
    zi
  );
}),
  'Auth0Client' in this &&
    this.console &&
    this.console.warn &&
    this.console.warn('Auth0Client already declared on the global namespace'),
  this &&
    this.createAuth0Client &&
    (this.Auth0Client = this.Auth0Client || this.createAuth0Client.Auth0Client);
//# sourceMappingURL=auth0-spa-js.production.js.map
