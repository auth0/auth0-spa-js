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
***************************************************************************** */
var e = function (t, n) {
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
    function c(e) {
      try {
        a(r.next(e));
      } catch (e) {
        i(e);
      }
    }
    function s(e) {
      try {
        a(r.throw(e));
      } catch (e) {
        i(e);
      }
    }
    function a(e) {
      var t;
      e.done
        ? o(e.value)
        : ((t = e.value),
          t instanceof n
            ? t
            : new n(function (e) {
                e(t);
              })).then(c, s);
    }
    a((r = r.apply(e, t || [])).next());
  });
}
function i(e, t) {
  var n,
    r,
    o,
    i,
    c = {
      label: 0,
      sent: function () {
        if (1 & o[0]) throw o[1];
        return o[1];
      },
      trys: [],
      ops: []
    };
  return (
    (i = { next: s(0), throw: s(1), return: s(2) }),
    'function' == typeof Symbol &&
      (i[Symbol.iterator] = function () {
        return this;
      }),
    i
  );
  function s(i) {
    return function (s) {
      return (function (i) {
        if (n) throw new TypeError('Generator is already executing.');
        for (; c; )
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
                return c.label++, { value: i[1], done: !1 };
              case 5:
                c.label++, (r = i[1]), (i = [0]);
                continue;
              case 7:
                (i = c.ops.pop()), c.trys.pop();
                continue;
              default:
                if (
                  !((o = c.trys),
                  (o = o.length > 0 && o[o.length - 1]) ||
                    (6 !== i[0] && 2 !== i[0]))
                ) {
                  c = 0;
                  continue;
                }
                if (3 === i[0] && (!o || (i[1] > o[0] && i[1] < o[3]))) {
                  c.label = i[1];
                  break;
                }
                if (6 === i[0] && c.label < o[1]) {
                  (c.label = o[1]), (o = i);
                  break;
                }
                if (o && c.label < o[2]) {
                  (c.label = o[2]), c.ops.push(i);
                  break;
                }
                o[2] && c.ops.pop(), c.trys.pop();
                continue;
            }
            i = t.call(e, c);
          } catch (e) {
            (i = [6, e]), (r = 0);
          } finally {
            n = o = 0;
          }
        if (5 & i[0]) throw i[1];
        return { value: i[0] ? i[1] : void 0, done: !0 };
      })([i, s]);
    };
  }
}
var c =
  'undefined' != typeof globalThis
    ? globalThis
    : 'undefined' != typeof window
    ? window
    : 'undefined' != typeof global
    ? global
    : 'undefined' != typeof self
    ? self
    : {};
function s(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default')
    ? e.default
    : e;
}
function a(e, t) {
  return e((t = { exports: {} }), t.exports), t.exports;
}
var u = function (e) {
    return e && e.Math == Math && e;
  },
  l =
    u('object' == typeof globalThis && globalThis) ||
    u('object' == typeof window && window) ||
    u('object' == typeof self && self) ||
    u('object' == typeof c && c) ||
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
  b = {}.toString,
  g = function (e) {
    return b.call(e).slice(8, -1);
  },
  m = ''.split,
  w = f(function () {
    return !Object('z').propertyIsEnumerable(0);
  })
    ? function (e) {
        return 'String' == g(e) ? m.call(e, '') : Object(e);
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
  E = function (e, t) {
    if (!k(e)) return e;
    var n, r;
    if (t && 'function' == typeof (n = e.toString) && !k((r = n.call(e))))
      return r;
    if ('function' == typeof (n = e.valueOf) && !k((r = n.call(e)))) return r;
    if (!t && 'function' == typeof (n = e.toString) && !k((r = n.call(e))))
      return r;
    throw TypeError("Can't convert object to primitive value");
  },
  I = function (e) {
    return Object(S(e));
  },
  O = {}.hasOwnProperty,
  T = function (e, t) {
    return O.call(I(e), t);
  },
  x = l.document,
  R = k(x) && k(x.createElement),
  L = function (e) {
    return R ? x.createElement(e) : {};
  },
  P =
    !d &&
    !f(function () {
      return (
        7 !=
        Object.defineProperty(L('div'), 'a', {
          get: function () {
            return 7;
          }
        }).a
      );
    }),
  j = Object.getOwnPropertyDescriptor,
  C = {
    f: d
      ? j
      : function (e, t) {
          if (((e = _(e)), (t = E(t, !0)), P))
            try {
              return j(e, t);
            } catch (e) {}
          if (T(e, t)) return v(!y.f.call(e, t), e[t]);
        }
  },
  A = function (e) {
    if (!k(e)) throw TypeError(String(e) + ' is not an object');
    return e;
  },
  U = Object.defineProperty,
  F = {
    f: d
      ? U
      : function (e, t, n) {
          if ((A(e), (t = E(t, !0)), A(n), P))
            try {
              return U(e, t, n);
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
  N = l['__core-js_shared__'] || W('__core-js_shared__', {}),
  z = Function.toString;
'function' != typeof N.inspectSource &&
  (N.inspectSource = function (e) {
    return z.call(e);
  });
var V,
  Z,
  X,
  D = N.inspectSource,
  G = l.WeakMap,
  J = 'function' == typeof G && /native code/.test(D(G)),
  Y = a(function (e) {
    (e.exports = function (e, t) {
      return N[e] || (N[e] = void 0 !== t ? t : {});
    })('versions', []).push({
      version: '3.12.0',
      mode: 'global',
      copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
    });
  }),
  B = 0,
  M = Math.random(),
  H = function (e) {
    return (
      'Symbol(' + String(void 0 === e ? '' : e) + ')_' + (++B + M).toString(36)
    );
  },
  q = Y('keys'),
  Q = function (e) {
    return q[e] || (q[e] = H(e));
  },
  $ = {},
  ee = l.WeakMap;
if (J) {
  var te = N.state || (N.state = new ee()),
    ne = te.get,
    re = te.has,
    oe = te.set;
  (V = function (e, t) {
    if (re.call(te, e)) throw new TypeError('Object already initialized');
    return (t.facade = e), oe.call(te, e, t), t;
  }),
    (Z = function (e) {
      return ne.call(te, e) || {};
    }),
    (X = function (e) {
      return re.call(te, e);
    });
} else {
  var ie = Q('state');
  ($[ie] = !0),
    (V = function (e, t) {
      if (T(e, ie)) throw new TypeError('Object already initialized');
      return (t.facade = e), K(e, ie, t), t;
    }),
    (Z = function (e) {
      return T(e, ie) ? e[ie] : {};
    }),
    (X = function (e) {
      return T(e, ie);
    });
}
var ce,
  se,
  ae = {
    set: V,
    get: Z,
    has: X,
    enforce: function (e) {
      return X(e) ? Z(e) : V(e, {});
    },
    getterFor: function (e) {
      return function (t) {
        var n;
        if (!k(t) || (n = Z(t)).type !== e)
          throw TypeError('Incompatible receiver, ' + e + ' required');
        return n;
      };
    }
  },
  ue = a(function (e) {
    var t = ae.get,
      n = ae.enforce,
      r = String(String).split('String');
    (e.exports = function (e, t, o, i) {
      var c,
        s = !!i && !!i.unsafe,
        a = !!i && !!i.enumerable,
        u = !!i && !!i.noTargetGet;
      'function' == typeof o &&
        ('string' != typeof t || T(o, 'name') || K(o, 'name', t),
        (c = n(o)).source ||
          (c.source = r.join('string' == typeof t ? t : ''))),
        e !== l
          ? (s ? !u && e[t] && (a = !0) : delete e[t],
            a ? (e[t] = o) : K(e, t, o))
          : a
          ? (e[t] = o)
          : W(t, o);
    })(Function.prototype, 'toString', function () {
      return ('function' == typeof this && t(this).source) || D(this);
    });
  }),
  le = l,
  fe = function (e) {
    return 'function' == typeof e ? e : void 0;
  },
  de = function (e, t) {
    return arguments.length < 2
      ? fe(le[e]) || fe(l[e])
      : (le[e] && le[e][t]) || (l[e] && l[e][t]);
  },
  pe = Math.ceil,
  he = Math.floor,
  ye = function (e) {
    return isNaN((e = +e)) ? 0 : (e > 0 ? he : pe)(e);
  },
  ve = Math.min,
  be = function (e) {
    return e > 0 ? ve(ye(e), 9007199254740991) : 0;
  },
  ge = Math.max,
  me = Math.min,
  we = function (e) {
    return function (t, n, r) {
      var o,
        i = _(t),
        c = be(i.length),
        s = (function (e, t) {
          var n = ye(e);
          return n < 0 ? ge(n + t, 0) : me(n, t);
        })(r, c);
      if (e && n != n) {
        for (; c > s; ) if ((o = i[s++]) != o) return !0;
      } else
        for (; c > s; s++) if ((e || s in i) && i[s] === n) return e || s || 0;
      return !e && -1;
    };
  },
  Se = { includes: we(!0), indexOf: we(!1) },
  _e = Se.indexOf,
  ke = function (e, t) {
    var n,
      r = _(e),
      o = 0,
      i = [];
    for (n in r) !T($, n) && T(r, n) && i.push(n);
    for (; t.length > o; ) T(r, (n = t[o++])) && (~_e(i, n) || i.push(n));
    return i;
  },
  Ee = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ],
  Ie = Ee.concat('length', 'prototype'),
  Oe = {
    f:
      Object.getOwnPropertyNames ||
      function (e) {
        return ke(e, Ie);
      }
  },
  Te = { f: Object.getOwnPropertySymbols },
  xe =
    de('Reflect', 'ownKeys') ||
    function (e) {
      var t = Oe.f(A(e)),
        n = Te.f;
      return n ? t.concat(n(e)) : t;
    },
  Re = function (e, t) {
    for (var n = xe(t), r = F.f, o = C.f, i = 0; i < n.length; i++) {
      var c = n[i];
      T(e, c) || r(e, c, o(t, c));
    }
  },
  Le = /#|\.prototype\./,
  Pe = function (e, t) {
    var n = Ce[je(e)];
    return n == Ue || (n != Ae && ('function' == typeof t ? f(t) : !!t));
  },
  je = (Pe.normalize = function (e) {
    return String(e).replace(Le, '.').toLowerCase();
  }),
  Ce = (Pe.data = {}),
  Ae = (Pe.NATIVE = 'N'),
  Ue = (Pe.POLYFILL = 'P'),
  Fe = Pe,
  Ke = C.f,
  We = function (e, t) {
    var n,
      r,
      o,
      i,
      c,
      s = e.target,
      a = e.global,
      u = e.stat;
    if ((n = a ? l : u ? l[s] || W(s, {}) : (l[s] || {}).prototype))
      for (r in t) {
        if (
          ((i = t[r]),
          (o = e.noTargetGet ? (c = Ke(n, r)) && c.value : n[r]),
          !Fe(a ? r : s + (u ? '.' : '#') + r, e.forced) && void 0 !== o)
        ) {
          if (typeof i == typeof o) continue;
          Re(i, o);
        }
        (e.sham || (o && o.sham)) && K(i, 'sham', !0), ue(n, r, i, e);
      }
  },
  Ne = de('navigator', 'userAgent') || '',
  ze = l.process,
  Ve = ze && ze.versions,
  Ze = Ve && Ve.v8;
Ze
  ? (se = (ce = Ze.split('.'))[0] < 4 ? 1 : ce[0] + ce[1])
  : Ne &&
    (!(ce = Ne.match(/Edge\/(\d+)/)) || ce[1] >= 74) &&
    (ce = Ne.match(/Chrome\/(\d+)/)) &&
    (se = ce[1]);
var Xe,
  De = se && +se,
  Ge =
    !!Object.getOwnPropertySymbols &&
    !f(function () {
      return !String(Symbol()) || (!Symbol.sham && De && De < 41);
    }),
  Je = Ge && !Symbol.sham && 'symbol' == typeof Symbol.iterator,
  Ye = Y('wks'),
  Be = l.Symbol,
  Me = Je ? Be : (Be && Be.withoutSetter) || H,
  He = function (e) {
    return (
      (T(Ye, e) && (Ge || 'string' == typeof Ye[e])) ||
        (Ge && T(Be, e) ? (Ye[e] = Be[e]) : (Ye[e] = Me('Symbol.' + e))),
      Ye[e]
    );
  },
  qe = He('match'),
  Qe = function (e) {
    if (
      (function (e) {
        var t;
        return k(e) && (void 0 !== (t = e[qe]) ? !!t : 'RegExp' == g(e));
      })(e)
    )
      throw TypeError("The method doesn't accept regular expressions");
    return e;
  },
  $e = He('match'),
  et = function (e) {
    var t = /./;
    try {
      '/./'[e](t);
    } catch (n) {
      try {
        return (t[$e] = !1), '/./'[e](t);
      } catch (e) {}
    }
    return !1;
  },
  tt = C.f,
  nt = ''.startsWith,
  rt = Math.min,
  ot = et('startsWith'),
  it = !(ot || ((Xe = tt(String.prototype, 'startsWith')), !Xe || Xe.writable));
We(
  { target: 'String', proto: !0, forced: !it && !ot },
  {
    startsWith: function (e) {
      var t = String(S(this));
      Qe(e);
      var n = be(rt(arguments.length > 1 ? arguments[1] : void 0, t.length)),
        r = String(e);
      return nt ? nt.call(t, r, n) : t.slice(n, n + r.length) === r;
    }
  }
);
var ct = function (e) {
    if ('function' != typeof e)
      throw TypeError(String(e) + ' is not a function');
    return e;
  },
  st = function (e, t, n) {
    if ((ct(e), void 0 === t)) return e;
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
  at = Function.call,
  ut = function (e, t, n) {
    return st(at, l[e].prototype[t], n);
  };
ut('String', 'startsWith');
var lt =
    Array.isArray ||
    function (e) {
      return 'Array' == g(e);
    },
  ft = function (e, t, n) {
    var r = E(t);
    r in e ? F.f(e, r, v(0, n)) : (e[r] = n);
  },
  dt = He('species'),
  pt = function (e, t) {
    var n;
    return (
      lt(e) &&
        ('function' != typeof (n = e.constructor) ||
        (n !== Array && !lt(n.prototype))
          ? k(n) && null === (n = n[dt]) && (n = void 0)
          : (n = void 0)),
      new (void 0 === n ? Array : n)(0 === t ? 0 : t)
    );
  },
  ht = He('species'),
  yt = He('isConcatSpreadable'),
  vt =
    De >= 51 ||
    !f(function () {
      var e = [];
      return (e[yt] = !1), e.concat()[0] !== e;
    }),
  bt = (function (e) {
    return (
      De >= 51 ||
      !f(function () {
        var t = [];
        return (
          ((t.constructor = {})[ht] = function () {
            return { foo: 1 };
          }),
          1 !== t[e](Boolean).foo
        );
      })
    );
  })('concat'),
  gt = function (e) {
    if (!k(e)) return !1;
    var t = e[yt];
    return void 0 !== t ? !!t : lt(e);
  };
We(
  { target: 'Array', proto: !0, forced: !vt || !bt },
  {
    concat: function (e) {
      var t,
        n,
        r,
        o,
        i,
        c = I(this),
        s = pt(c, 0),
        a = 0;
      for (t = -1, r = arguments.length; t < r; t++)
        if (gt((i = -1 === t ? c : arguments[t]))) {
          if (a + (o = be(i.length)) > 9007199254740991)
            throw TypeError('Maximum allowed index exceeded');
          for (n = 0; n < o; n++, a++) n in i && ft(s, a, i[n]);
        } else {
          if (a >= 9007199254740991)
            throw TypeError('Maximum allowed index exceeded');
          ft(s, a++, i);
        }
      return (s.length = a), s;
    }
  }
);
var mt = {};
mt[He('toStringTag')] = 'z';
var wt = '[object z]' === String(mt),
  St = He('toStringTag'),
  _t =
    'Arguments' ==
    g(
      (function () {
        return arguments;
      })()
    ),
  kt = wt
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
            })((t = Object(e)), St))
          ? n
          : _t
          ? g(t)
          : 'Object' == (r = g(t)) && 'function' == typeof t.callee
          ? 'Arguments'
          : r;
      },
  Et = wt
    ? {}.toString
    : function () {
        return '[object ' + kt(this) + ']';
      };
wt || ue(Object.prototype, 'toString', Et, { unsafe: !0 });
var It,
  Ot =
    Object.keys ||
    function (e) {
      return ke(e, Ee);
    },
  Tt = d
    ? Object.defineProperties
    : function (e, t) {
        A(e);
        for (var n, r = Ot(t), o = r.length, i = 0; o > i; )
          F.f(e, (n = r[i++]), t[n]);
        return e;
      },
  xt = de('document', 'documentElement'),
  Rt = Q('IE_PROTO'),
  Lt = function () {},
  Pt = function (e) {
    return '<script>' + e + '</script>';
  },
  jt = function () {
    try {
      It = document.domain && new ActiveXObject('htmlfile');
    } catch (e) {}
    var e, t;
    jt = It
      ? (function (e) {
          e.write(Pt('')), e.close();
          var t = e.parentWindow.Object;
          return (e = null), t;
        })(It)
      : (((t = L('iframe')).style.display = 'none'),
        xt.appendChild(t),
        (t.src = String('javascript:')),
        (e = t.contentWindow.document).open(),
        e.write(Pt('document.F=Object')),
        e.close(),
        e.F);
    for (var n = Ee.length; n--; ) delete jt.prototype[Ee[n]];
    return jt();
  };
$[Rt] = !0;
var Ct =
    Object.create ||
    function (e, t) {
      var n;
      return (
        null !== e
          ? ((Lt.prototype = A(e)),
            (n = new Lt()),
            (Lt.prototype = null),
            (n[Rt] = e))
          : (n = jt()),
        void 0 === t ? n : Tt(n, t)
      );
    },
  At = Oe.f,
  Ut = {}.toString,
  Ft =
    'object' == typeof window && window && Object.getOwnPropertyNames
      ? Object.getOwnPropertyNames(window)
      : [],
  Kt = {
    f: function (e) {
      return Ft && '[object Window]' == Ut.call(e)
        ? (function (e) {
            try {
              return At(e);
            } catch (e) {
              return Ft.slice();
            }
          })(e)
        : At(_(e));
    }
  },
  Wt = { f: He },
  Nt = F.f,
  zt = function (e) {
    var t = le.Symbol || (le.Symbol = {});
    T(t, e) || Nt(t, e, { value: Wt.f(e) });
  },
  Vt = F.f,
  Zt = He('toStringTag'),
  Xt = function (e, t, n) {
    e &&
      !T((e = n ? e : e.prototype), Zt) &&
      Vt(e, Zt, { configurable: !0, value: t });
  },
  Dt = [].push,
  Gt = function (e) {
    var t = 1 == e,
      n = 2 == e,
      r = 3 == e,
      o = 4 == e,
      i = 6 == e,
      c = 7 == e,
      s = 5 == e || i;
    return function (a, u, l, f) {
      for (
        var d,
          p,
          h = I(a),
          y = w(h),
          v = st(u, l, 3),
          b = be(y.length),
          g = 0,
          m = f || pt,
          S = t ? m(a, b) : n || c ? m(a, 0) : void 0;
        b > g;
        g++
      )
        if ((s || g in y) && ((p = v((d = y[g]), g, h)), e))
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
                Dt.call(S, d);
            }
          else
            switch (e) {
              case 4:
                return !1;
              case 7:
                Dt.call(S, d);
            }
      return i ? -1 : r || o ? o : S;
    };
  },
  Jt = {
    forEach: Gt(0),
    map: Gt(1),
    filter: Gt(2),
    some: Gt(3),
    every: Gt(4),
    find: Gt(5),
    findIndex: Gt(6),
    filterOut: Gt(7)
  }.forEach,
  Yt = Q('hidden'),
  Bt = He('toPrimitive'),
  Mt = ae.set,
  Ht = ae.getterFor('Symbol'),
  qt = Object.prototype,
  Qt = l.Symbol,
  $t = de('JSON', 'stringify'),
  en = C.f,
  tn = F.f,
  nn = Kt.f,
  rn = y.f,
  on = Y('symbols'),
  cn = Y('op-symbols'),
  sn = Y('string-to-symbol-registry'),
  an = Y('symbol-to-string-registry'),
  un = Y('wks'),
  ln = l.QObject,
  fn = !ln || !ln.prototype || !ln.prototype.findChild,
  dn =
    d &&
    f(function () {
      return (
        7 !=
        Ct(
          tn({}, 'a', {
            get: function () {
              return tn(this, 'a', { value: 7 }).a;
            }
          })
        ).a
      );
    })
      ? function (e, t, n) {
          var r = en(qt, t);
          r && delete qt[t], tn(e, t, n), r && e !== qt && tn(qt, t, r);
        }
      : tn,
  pn = function (e, t) {
    var n = (on[e] = Ct(Qt.prototype));
    return (
      Mt(n, { type: 'Symbol', tag: e, description: t }),
      d || (n.description = t),
      n
    );
  },
  hn = Je
    ? function (e) {
        return 'symbol' == typeof e;
      }
    : function (e) {
        return Object(e) instanceof Qt;
      },
  yn = function (e, t, n) {
    e === qt && yn(cn, t, n), A(e);
    var r = E(t, !0);
    return (
      A(n),
      T(on, r)
        ? (n.enumerable
            ? (T(e, Yt) && e[Yt][r] && (e[Yt][r] = !1),
              (n = Ct(n, { enumerable: v(0, !1) })))
            : (T(e, Yt) || tn(e, Yt, v(1, {})), (e[Yt][r] = !0)),
          dn(e, r, n))
        : tn(e, r, n)
    );
  },
  vn = function (e, t) {
    A(e);
    var n = _(t),
      r = Ot(n).concat(wn(n));
    return (
      Jt(r, function (t) {
        (d && !bn.call(n, t)) || yn(e, t, n[t]);
      }),
      e
    );
  },
  bn = function (e) {
    var t = E(e, !0),
      n = rn.call(this, t);
    return (
      !(this === qt && T(on, t) && !T(cn, t)) &&
      (!(n || !T(this, t) || !T(on, t) || (T(this, Yt) && this[Yt][t])) || n)
    );
  },
  gn = function (e, t) {
    var n = _(e),
      r = E(t, !0);
    if (n !== qt || !T(on, r) || T(cn, r)) {
      var o = en(n, r);
      return (
        !o || !T(on, r) || (T(n, Yt) && n[Yt][r]) || (o.enumerable = !0), o
      );
    }
  },
  mn = function (e) {
    var t = nn(_(e)),
      n = [];
    return (
      Jt(t, function (e) {
        T(on, e) || T($, e) || n.push(e);
      }),
      n
    );
  },
  wn = function (e) {
    var t = e === qt,
      n = nn(t ? cn : _(e)),
      r = [];
    return (
      Jt(n, function (e) {
        !T(on, e) || (t && !T(qt, e)) || r.push(on[e]);
      }),
      r
    );
  };
if (
  (Ge ||
    (ue(
      (Qt = function () {
        if (this instanceof Qt) throw TypeError('Symbol is not a constructor');
        var e =
            arguments.length && void 0 !== arguments[0]
              ? String(arguments[0])
              : void 0,
          t = H(e),
          n = function (e) {
            this === qt && n.call(cn, e),
              T(this, Yt) && T(this[Yt], t) && (this[Yt][t] = !1),
              dn(this, t, v(1, e));
          };
        return d && fn && dn(qt, t, { configurable: !0, set: n }), pn(t, e);
      }).prototype,
      'toString',
      function () {
        return Ht(this).tag;
      }
    ),
    ue(Qt, 'withoutSetter', function (e) {
      return pn(H(e), e);
    }),
    (y.f = bn),
    (F.f = yn),
    (C.f = gn),
    (Oe.f = Kt.f = mn),
    (Te.f = wn),
    (Wt.f = function (e) {
      return pn(He(e), e);
    }),
    d &&
      (tn(Qt.prototype, 'description', {
        configurable: !0,
        get: function () {
          return Ht(this).description;
        }
      }),
      ue(qt, 'propertyIsEnumerable', bn, { unsafe: !0 }))),
  We({ global: !0, wrap: !0, forced: !Ge, sham: !Ge }, { Symbol: Qt }),
  Jt(Ot(un), function (e) {
    zt(e);
  }),
  We(
    { target: 'Symbol', stat: !0, forced: !Ge },
    {
      for: function (e) {
        var t = String(e);
        if (T(sn, t)) return sn[t];
        var n = Qt(t);
        return (sn[t] = n), (an[n] = t), n;
      },
      keyFor: function (e) {
        if (!hn(e)) throw TypeError(e + ' is not a symbol');
        if (T(an, e)) return an[e];
      },
      useSetter: function () {
        fn = !0;
      },
      useSimple: function () {
        fn = !1;
      }
    }
  ),
  We(
    { target: 'Object', stat: !0, forced: !Ge, sham: !d },
    {
      create: function (e, t) {
        return void 0 === t ? Ct(e) : vn(Ct(e), t);
      },
      defineProperty: yn,
      defineProperties: vn,
      getOwnPropertyDescriptor: gn
    }
  ),
  We(
    { target: 'Object', stat: !0, forced: !Ge },
    { getOwnPropertyNames: mn, getOwnPropertySymbols: wn }
  ),
  We(
    {
      target: 'Object',
      stat: !0,
      forced: f(function () {
        Te.f(1);
      })
    },
    {
      getOwnPropertySymbols: function (e) {
        return Te.f(I(e));
      }
    }
  ),
  $t)
) {
  var Sn =
    !Ge ||
    f(function () {
      var e = Qt();
      return (
        '[null]' != $t([e]) || '{}' != $t({ a: e }) || '{}' != $t(Object(e))
      );
    });
  We(
    { target: 'JSON', stat: !0, forced: Sn },
    {
      stringify: function (e, t, n) {
        for (var r, o = [e], i = 1; arguments.length > i; )
          o.push(arguments[i++]);
        if (((r = t), (k(t) || void 0 !== e) && !hn(e)))
          return (
            lt(t) ||
              (t = function (e, t) {
                if (
                  ('function' == typeof r && (t = r.call(this, e, t)), !hn(t))
                )
                  return t;
              }),
            (o[1] = t),
            $t.apply(null, o)
          );
      }
    }
  );
}
Qt.prototype[Bt] || K(Qt.prototype, Bt, Qt.prototype.valueOf),
  Xt(Qt, 'Symbol'),
  ($[Yt] = !0),
  zt('asyncIterator');
var _n = F.f,
  kn = l.Symbol;
if (
  d &&
  'function' == typeof kn &&
  (!('description' in kn.prototype) || void 0 !== kn().description)
) {
  var En = {},
    In = function () {
      var e =
          arguments.length < 1 || void 0 === arguments[0]
            ? void 0
            : String(arguments[0]),
        t = this instanceof In ? new kn(e) : void 0 === e ? kn() : kn(e);
      return '' === e && (En[t] = !0), t;
    };
  Re(In, kn);
  var On = (In.prototype = kn.prototype);
  On.constructor = In;
  var Tn = On.toString,
    xn = 'Symbol(test)' == String(kn('test')),
    Rn = /^Symbol\((.*)\)[^)]+$/;
  _n(On, 'description', {
    configurable: !0,
    get: function () {
      var e = k(this) ? this.valueOf() : this,
        t = Tn.call(e);
      if (T(En, e)) return '';
      var n = xn ? t.slice(7, -1) : t.replace(Rn, '$1');
      return '' === n ? void 0 : n;
    }
  }),
    We({ global: !0, forced: !0 }, { Symbol: In });
}
zt('hasInstance'),
  zt('isConcatSpreadable'),
  zt('iterator'),
  zt('match'),
  zt('matchAll'),
  zt('replace'),
  zt('search'),
  zt('species'),
  zt('split'),
  zt('toPrimitive'),
  zt('toStringTag'),
  zt('unscopables'),
  Xt(l.JSON, 'JSON', !0),
  Xt(Math, 'Math', !0),
  We({ global: !0 }, { Reflect: {} }),
  Xt(l.Reflect, 'Reflect', !0),
  le.Symbol;
var Ln,
  Pn,
  jn,
  Cn = function (e) {
    return function (t, n) {
      var r,
        o,
        i = String(S(t)),
        c = ye(n),
        s = i.length;
      return c < 0 || c >= s
        ? e
          ? ''
          : void 0
        : (r = i.charCodeAt(c)) < 55296 ||
          r > 56319 ||
          c + 1 === s ||
          (o = i.charCodeAt(c + 1)) < 56320 ||
          o > 57343
        ? e
          ? i.charAt(c)
          : r
        : e
        ? i.slice(c, c + 2)
        : o - 56320 + ((r - 55296) << 10) + 65536;
    };
  },
  An = { codeAt: Cn(!1), charAt: Cn(!0) },
  Un = !f(function () {
    function e() {}
    return (
      (e.prototype.constructor = null),
      Object.getPrototypeOf(new e()) !== e.prototype
    );
  }),
  Fn = Q('IE_PROTO'),
  Kn = Object.prototype,
  Wn = Un
    ? Object.getPrototypeOf
    : function (e) {
        return (
          (e = I(e)),
          T(e, Fn)
            ? e[Fn]
            : 'function' == typeof e.constructor && e instanceof e.constructor
            ? e.constructor.prototype
            : e instanceof Object
            ? Kn
            : null
        );
      },
  Nn = He('iterator'),
  zn = !1;
[].keys &&
  ('next' in (jn = [].keys())
    ? (Pn = Wn(Wn(jn))) !== Object.prototype && (Ln = Pn)
    : (zn = !0)),
  (null == Ln ||
    f(function () {
      var e = {};
      return Ln[Nn].call(e) !== e;
    })) &&
    (Ln = {}),
  T(Ln, Nn) ||
    K(Ln, Nn, function () {
      return this;
    });
var Vn = { IteratorPrototype: Ln, BUGGY_SAFARI_ITERATORS: zn },
  Zn = {},
  Xn = Vn.IteratorPrototype,
  Dn = function () {
    return this;
  },
  Gn =
    Object.setPrototypeOf ||
    ('__proto__' in {}
      ? (function () {
          var e,
            t = !1,
            n = {};
          try {
            (e = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__')
              .set).call(n, []),
              (t = n instanceof Array);
          } catch (e) {}
          return function (n, r) {
            return (
              A(n),
              (function (e) {
                if (!k(e) && null !== e)
                  throw TypeError("Can't set " + String(e) + ' as a prototype');
              })(r),
              t ? e.call(n, r) : (n.__proto__ = r),
              n
            );
          };
        })()
      : void 0),
  Jn = Vn.IteratorPrototype,
  Yn = Vn.BUGGY_SAFARI_ITERATORS,
  Bn = He('iterator'),
  Mn = function () {
    return this;
  },
  Hn = function (e, t, n, r, o, i, c) {
    !(function (e, t, n) {
      var r = t + ' Iterator';
      (e.prototype = Ct(Xn, { next: v(1, n) })), Xt(e, r, !1), (Zn[r] = Dn);
    })(n, t, r);
    var s,
      a,
      u,
      l = function (e) {
        if (e === o && y) return y;
        if (!Yn && e in p) return p[e];
        switch (e) {
          case 'keys':
          case 'values':
          case 'entries':
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
      h = p[Bn] || p['@@iterator'] || (o && p[o]),
      y = (!Yn && h) || l(o),
      b = ('Array' == t && p.entries) || h;
    if (
      (b &&
        ((s = Wn(b.call(new e()))),
        Jn !== Object.prototype &&
          s.next &&
          (Wn(s) !== Jn &&
            (Gn ? Gn(s, Jn) : 'function' != typeof s[Bn] && K(s, Bn, Mn)),
          Xt(s, f, !0))),
      'values' == o &&
        h &&
        'values' !== h.name &&
        ((d = !0),
        (y = function () {
          return h.call(this);
        })),
      p[Bn] !== y && K(p, Bn, y),
      (Zn[t] = y),
      o)
    )
      if (
        ((a = {
          values: l('values'),
          keys: i ? y : l('keys'),
          entries: l('entries')
        }),
        c)
      )
        for (u in a) (Yn || d || !(u in p)) && ue(p, u, a[u]);
      else We({ target: t, proto: !0, forced: Yn || d }, a);
    return a;
  },
  qn = An.charAt,
  Qn = ae.set,
  $n = ae.getterFor('String Iterator');
Hn(
  String,
  'String',
  function (e) {
    Qn(this, { type: 'String Iterator', string: String(e), index: 0 });
  },
  function () {
    var e,
      t = $n(this),
      n = t.string,
      r = t.index;
    return r >= n.length
      ? { value: void 0, done: !0 }
      : ((e = qn(n, r)), (t.index += e.length), { value: e, done: !1 });
  }
);
var er = function (e) {
    var t = e.return;
    if (void 0 !== t) return A(t.call(e)).value;
  },
  tr = function (e, t, n, r) {
    try {
      return r ? t(A(n)[0], n[1]) : t(n);
    } catch (t) {
      throw (er(e), t);
    }
  },
  nr = He('iterator'),
  rr = Array.prototype,
  or = function (e) {
    return void 0 !== e && (Zn.Array === e || rr[nr] === e);
  },
  ir = He('iterator'),
  cr = function (e) {
    if (null != e) return e[ir] || e['@@iterator'] || Zn[kt(e)];
  },
  sr = He('iterator'),
  ar = !1;
try {
  var ur = 0,
    lr = {
      next: function () {
        return { done: !!ur++ };
      },
      return: function () {
        ar = !0;
      }
    };
  (lr[sr] = function () {
    return this;
  }),
    Array.from(lr, function () {
      throw 2;
    });
} catch (e) {}
var fr = function (e, t) {
    if (!t && !ar) return !1;
    var n = !1;
    try {
      var r = {};
      (r[sr] = function () {
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
  dr = !fr(function (e) {
    Array.from(e);
  });
We(
  { target: 'Array', stat: !0, forced: dr },
  {
    from: function (e) {
      var t,
        n,
        r,
        o,
        i,
        c,
        s = I(e),
        a = 'function' == typeof this ? this : Array,
        u = arguments.length,
        l = u > 1 ? arguments[1] : void 0,
        f = void 0 !== l,
        d = cr(s),
        p = 0;
      if (
        (f && (l = st(l, u > 2 ? arguments[2] : void 0, 2)),
        null == d || (a == Array && or(d)))
      )
        for (n = new a((t = be(s.length))); t > p; p++)
          (c = f ? l(s[p], p) : s[p]), ft(n, p, c);
      else
        for (i = (o = d.call(s)).next, n = new a(); !(r = i.call(o)).done; p++)
          (c = f ? tr(o, l, [r.value, p], !0) : r.value), ft(n, p, c);
      return (n.length = p), n;
    }
  }
),
  le.Array.from;
var pr,
  hr = 'undefined' != typeof ArrayBuffer && 'undefined' != typeof DataView,
  yr = F.f,
  vr = l.Int8Array,
  br = vr && vr.prototype,
  gr = l.Uint8ClampedArray,
  mr = gr && gr.prototype,
  wr = vr && Wn(vr),
  Sr = br && Wn(br),
  _r = Object.prototype,
  kr = _r.isPrototypeOf,
  Er = He('toStringTag'),
  Ir = H('TYPED_ARRAY_TAG'),
  Or = hr && !!Gn && 'Opera' !== kt(l.opera),
  Tr = {
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
  xr = { BigInt64Array: 8, BigUint64Array: 8 },
  Rr = function (e) {
    if (!k(e)) return !1;
    var t = kt(e);
    return T(Tr, t) || T(xr, t);
  };
for (pr in Tr) l[pr] || (Or = !1);
if (
  (!Or || 'function' != typeof wr || wr === Function.prototype) &&
  ((wr = function () {
    throw TypeError('Incorrect invocation');
  }),
  Or)
)
  for (pr in Tr) l[pr] && Gn(l[pr], wr);
if ((!Or || !Sr || Sr === _r) && ((Sr = wr.prototype), Or))
  for (pr in Tr) l[pr] && Gn(l[pr].prototype, Sr);
if ((Or && Wn(mr) !== Sr && Gn(mr, Sr), d && !T(Sr, Er)))
  for (pr in (!0,
  yr(Sr, Er, {
    get: function () {
      return k(this) ? this[Ir] : void 0;
    }
  }),
  Tr))
    l[pr] && K(l[pr], Ir, pr);
var Lr = function (e) {
    if (Rr(e)) return e;
    throw TypeError('Target is not a typed array');
  },
  Pr = function (e) {
    if (Gn) {
      if (kr.call(wr, e)) return e;
    } else
      for (var t in Tr)
        if (T(Tr, pr)) {
          var n = l[t];
          if (n && (e === n || kr.call(n, e))) return e;
        }
    throw TypeError('Target is not a typed array constructor');
  },
  jr = function (e, t, n) {
    if (d) {
      if (n)
        for (var r in Tr) {
          var o = l[r];
          if (o && T(o.prototype, e))
            try {
              delete o.prototype[e];
            } catch (e) {}
        }
      (Sr[e] && !n) || ue(Sr, e, n ? t : (Or && br[e]) || t);
    }
  },
  Cr = He('species'),
  Ar = Lr,
  Ur = Pr,
  Fr = [].slice;
jr(
  'slice',
  function (e, t) {
    for (
      var n = Fr.call(Ar(this), e, t),
        r = (function (e, t) {
          var n,
            r = A(e).constructor;
          return void 0 === r || null == (n = A(r)[Cr]) ? t : ct(n);
        })(this, this.constructor),
        o = 0,
        i = n.length,
        c = new (Ur(r))(i);
      i > o;

    )
      c[o] = n[o++];
    return c;
  },
  f(function () {
    new Int8Array(1).slice();
  })
);
var Kr = He('unscopables'),
  Wr = Array.prototype;
null == Wr[Kr] && F.f(Wr, Kr, { configurable: !0, value: Ct(null) });
var Nr = function (e) {
    Wr[Kr][e] = !0;
  },
  zr = Se.includes;
We(
  { target: 'Array', proto: !0 },
  {
    includes: function (e) {
      return zr(this, e, arguments.length > 1 ? arguments[1] : void 0);
    }
  }
),
  Nr('includes'),
  ut('Array', 'includes'),
  We(
    { target: 'String', proto: !0, forced: !et('includes') },
    {
      includes: function (e) {
        return !!~String(S(this)).indexOf(
          Qe(e),
          arguments.length > 1 ? arguments[1] : void 0
        );
      }
    }
  ),
  ut('String', 'includes');
var Vr = !f(function () {
    return Object.isExtensible(Object.preventExtensions({}));
  }),
  Zr = a(function (e) {
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
      c = (e.exports = {
        REQUIRED: !1,
        fastKey: function (e, t) {
          if (!k(e))
            return 'symbol' == typeof e
              ? e
              : ('string' == typeof e ? 'S' : 'P') + e;
          if (!T(e, n)) {
            if (!o(e)) return 'F';
            if (!t) return 'E';
            i(e);
          }
          return e[n].objectID;
        },
        getWeakData: function (e, t) {
          if (!T(e, n)) {
            if (!o(e)) return !0;
            if (!t) return !1;
            i(e);
          }
          return e[n].weakData;
        },
        onFreeze: function (e) {
          return Vr && c.REQUIRED && o(e) && !T(e, n) && i(e), e;
        }
      });
    $[n] = !0;
  });
Zr.REQUIRED, Zr.fastKey, Zr.getWeakData, Zr.onFreeze;
var Xr = function (e, t) {
    (this.stopped = e), (this.result = t);
  },
  Dr = function (e, t, n) {
    var r,
      o,
      i,
      c,
      s,
      a,
      u,
      l = n && n.that,
      f = !(!n || !n.AS_ENTRIES),
      d = !(!n || !n.IS_ITERATOR),
      p = !(!n || !n.INTERRUPTED),
      h = st(t, l, 1 + f + p),
      y = function (e) {
        return r && er(r), new Xr(!0, e);
      },
      v = function (e) {
        return f
          ? (A(e), p ? h(e[0], e[1], y) : h(e[0], e[1]))
          : p
          ? h(e, y)
          : h(e);
      };
    if (d) r = e;
    else {
      if ('function' != typeof (o = cr(e)))
        throw TypeError('Target is not iterable');
      if (or(o)) {
        for (i = 0, c = be(e.length); c > i; i++)
          if ((s = v(e[i])) && s instanceof Xr) return s;
        return new Xr(!1);
      }
      r = o.call(e);
    }
    for (a = r.next; !(u = a.call(r)).done; ) {
      try {
        s = v(u.value);
      } catch (e) {
        throw (er(r), e);
      }
      if ('object' == typeof s && s && s instanceof Xr) return s;
    }
    return new Xr(!1);
  },
  Gr = function (e, t, n) {
    if (!(e instanceof t))
      throw TypeError('Incorrect ' + (n ? n + ' ' : '') + 'invocation');
    return e;
  },
  Jr = function (e, t, n) {
    for (var r in t) ue(e, r, t[r], n);
    return e;
  },
  Yr = He('species'),
  Br = F.f,
  Mr = Zr.fastKey,
  Hr = ae.set,
  qr = ae.getterFor;
!(function (e, t, n) {
  var r = -1 !== e.indexOf('Map'),
    o = -1 !== e.indexOf('Weak'),
    i = r ? 'set' : 'add',
    c = l[e],
    s = c && c.prototype,
    a = c,
    u = {},
    d = function (e) {
      var t = s[e];
      ue(
        s,
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
    Fe(
      e,
      'function' != typeof c ||
        !(
          o ||
          (s.forEach &&
            !f(function () {
              new c().entries().next();
            }))
        )
    )
  )
    (a = n.getConstructor(t, e, r, i)), (Zr.REQUIRED = !0);
  else if (Fe(e, !0)) {
    var p = new a(),
      h = p[i](o ? {} : -0, 1) != p,
      y = f(function () {
        p.has(1);
      }),
      v = fr(function (e) {
        new c(e);
      }),
      b =
        !o &&
        f(function () {
          for (var e = new c(), t = 5; t--; ) e[i](t, t);
          return !e.has(-0);
        });
    v ||
      (((a = t(function (t, n) {
        Gr(t, a, e);
        var o = (function (e, t, n) {
          var r, o;
          return (
            Gn &&
              'function' == typeof (r = t.constructor) &&
              r !== n &&
              k((o = r.prototype)) &&
              o !== n.prototype &&
              Gn(e, o),
            e
          );
        })(new c(), t, a);
        return null != n && Dr(n, o[i], { that: o, AS_ENTRIES: r }), o;
      })).prototype = s),
      (s.constructor = a)),
      (y || b) && (d('delete'), d('has'), r && d('get')),
      (b || h) && d(i),
      o && s.clear && delete s.clear;
  }
  (u[e] = a),
    We({ global: !0, forced: a != c }, u),
    Xt(a, e),
    o || n.setStrong(a, e, r);
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
          Gr(e, o, t),
            Hr(e, {
              type: t,
              index: Ct(null),
              first: void 0,
              last: void 0,
              size: 0
            }),
            d || (e.size = 0),
            null != i && Dr(i, e[r], { that: e, AS_ENTRIES: n });
        }),
        i = qr(t),
        c = function (e, t, n) {
          var r,
            o,
            c = i(e),
            a = s(e, t);
          return (
            a
              ? (a.value = n)
              : ((c.last = a = {
                  index: (o = Mr(t, !0)),
                  key: t,
                  value: n,
                  previous: (r = c.last),
                  next: void 0,
                  removed: !1
                }),
                c.first || (c.first = a),
                r && (r.next = a),
                d ? c.size++ : e.size++,
                'F' !== o && (c.index[o] = a)),
            e
          );
        },
        s = function (e, t) {
          var n,
            r = i(e),
            o = Mr(t);
          if ('F' !== o) return r.index[o];
          for (n = r.first; n; n = n.next) if (n.key == t) return n;
        };
      return (
        Jr(o.prototype, {
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
              r = s(t, e);
            if (r) {
              var o = r.next,
                c = r.previous;
              delete n.index[r.index],
                (r.removed = !0),
                c && (c.next = o),
                o && (o.previous = c),
                n.first == r && (n.first = o),
                n.last == r && (n.last = c),
                d ? n.size-- : t.size--;
            }
            return !!r;
          },
          forEach: function (e) {
            for (
              var t,
                n = i(this),
                r = st(e, arguments.length > 1 ? arguments[1] : void 0, 3);
              (t = t ? t.next : n.first);

            )
              for (r(t.value, t.key, this); t && t.removed; ) t = t.previous;
          },
          has: function (e) {
            return !!s(this, e);
          }
        }),
        Jr(
          o.prototype,
          n
            ? {
                get: function (e) {
                  var t = s(this, e);
                  return t && t.value;
                },
                set: function (e, t) {
                  return c(this, 0 === e ? 0 : e, t);
                }
              }
            : {
                add: function (e) {
                  return c(this, (e = 0 === e ? 0 : e), e);
                }
              }
        ),
        d &&
          Br(o.prototype, 'size', {
            get: function () {
              return i(this).size;
            }
          }),
        o
      );
    },
    setStrong: function (e, t, n) {
      var r = t + ' Iterator',
        o = qr(t),
        i = qr(r);
      Hn(
        e,
        t,
        function (e, t) {
          Hr(this, { type: r, target: e, state: o(e), kind: t, last: void 0 });
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
          var t = de(e),
            n = F.f;
          d &&
            t &&
            !t[Yr] &&
            n(t, Yr, {
              configurable: !0,
              get: function () {
                return this;
              }
            });
        })(t);
    }
  }
);
var Qr = {
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
  $r = ae.set,
  eo = ae.getterFor('Array Iterator'),
  to = Hn(
    Array,
    'Array',
    function (e, t) {
      $r(this, { type: 'Array Iterator', target: _(e), index: 0, kind: t });
    },
    function () {
      var e = eo(this),
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
(Zn.Arguments = Zn.Array), Nr('keys'), Nr('values'), Nr('entries');
var no = He('iterator'),
  ro = He('toStringTag'),
  oo = to.values;
for (var io in Qr) {
  var co = l[io],
    so = co && co.prototype;
  if (so) {
    if (so[no] !== oo)
      try {
        K(so, no, oo);
      } catch (e) {
        so[no] = oo;
      }
    if ((so[ro] || K(so, ro, io), Qr[io]))
      for (var ao in to)
        if (so[ao] !== to[ao])
          try {
            K(so, ao, to[ao]);
          } catch (e) {
            so[ao] = to[ao];
          }
  }
}
function uo(e) {
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
function lo(e) {
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
        var c = n.then;
        if ('function' == typeof c)
          return void c.call(
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
    for (var c = 0; c < r.length; c++) i(c, r[c]);
  });
}
le.Set;
var fo = setTimeout;
function po(e) {
  return Boolean(e && void 0 !== e.length);
}
function ho() {}
function yo(e) {
  if (!(this instanceof yo))
    throw new TypeError('Promises must be constructed via new');
  if ('function' != typeof e) throw new TypeError('not a function');
  (this._state = 0),
    (this._handled = !1),
    (this._value = void 0),
    (this._deferreds = []),
    So(e, this);
}
function vo(e, t) {
  for (; 3 === e._state; ) e = e._value;
  0 !== e._state
    ? ((e._handled = !0),
      yo._immediateFn(function () {
        var n = 1 === e._state ? t.onFulfilled : t.onRejected;
        if (null !== n) {
          var r;
          try {
            r = n(e._value);
          } catch (e) {
            return void go(t.promise, e);
          }
          bo(t.promise, r);
        } else (1 === e._state ? bo : go)(t.promise, e._value);
      }))
    : e._deferreds.push(t);
}
function bo(e, t) {
  try {
    if (t === e)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (t && ('object' == typeof t || 'function' == typeof t)) {
      var n = t.then;
      if (t instanceof yo) return (e._state = 3), (e._value = t), void mo(e);
      if ('function' == typeof n)
        return void So(
          ((r = n),
          (o = t),
          function () {
            r.apply(o, arguments);
          }),
          e
        );
    }
    (e._state = 1), (e._value = t), mo(e);
  } catch (t) {
    go(e, t);
  }
  var r, o;
}
function go(e, t) {
  (e._state = 2), (e._value = t), mo(e);
}
function mo(e) {
  2 === e._state &&
    0 === e._deferreds.length &&
    yo._immediateFn(function () {
      e._handled || yo._unhandledRejectionFn(e._value);
    });
  for (var t = 0, n = e._deferreds.length; t < n; t++) vo(e, e._deferreds[t]);
  e._deferreds = null;
}
function wo(e, t, n) {
  (this.onFulfilled = 'function' == typeof e ? e : null),
    (this.onRejected = 'function' == typeof t ? t : null),
    (this.promise = n);
}
function So(e, t) {
  var n = !1;
  try {
    e(
      function (e) {
        n || ((n = !0), bo(t, e));
      },
      function (e) {
        n || ((n = !0), go(t, e));
      }
    );
  } catch (e) {
    if (n) return;
    (n = !0), go(t, e);
  }
}
(yo.prototype.catch = function (e) {
  return this.then(null, e);
}),
  (yo.prototype.then = function (e, t) {
    var n = new this.constructor(ho);
    return vo(this, new wo(e, t, n)), n;
  }),
  (yo.prototype.finally = uo),
  (yo.all = function (e) {
    return new yo(function (t, n) {
      if (!po(e)) return n(new TypeError('Promise.all accepts an array'));
      var r = Array.prototype.slice.call(e);
      if (0 === r.length) return t([]);
      var o = r.length;
      function i(e, c) {
        try {
          if (c && ('object' == typeof c || 'function' == typeof c)) {
            var s = c.then;
            if ('function' == typeof s)
              return void s.call(
                c,
                function (t) {
                  i(e, t);
                },
                n
              );
          }
          (r[e] = c), 0 == --o && t(r);
        } catch (e) {
          n(e);
        }
      }
      for (var c = 0; c < r.length; c++) i(c, r[c]);
    });
  }),
  (yo.allSettled = lo),
  (yo.resolve = function (e) {
    return e && 'object' == typeof e && e.constructor === yo
      ? e
      : new yo(function (t) {
          t(e);
        });
  }),
  (yo.reject = function (e) {
    return new yo(function (t, n) {
      n(e);
    });
  }),
  (yo.race = function (e) {
    return new yo(function (t, n) {
      if (!po(e)) return n(new TypeError('Promise.race accepts an array'));
      for (var r = 0, o = e.length; r < o; r++) yo.resolve(e[r]).then(t, n);
    });
  }),
  (yo._immediateFn =
    ('function' == typeof setImmediate &&
      function (e) {
        setImmediate(e);
      }) ||
    function (e) {
      fo(e, 0);
    }),
  (yo._unhandledRejectionFn = function (e) {
    'undefined' != typeof console &&
      console &&
      console.warn('Possible Unhandled Promise Rejection:', e);
  });
var _o = (function () {
  if ('undefined' != typeof self) return self;
  if ('undefined' != typeof window) return window;
  if ('undefined' != typeof global) return global;
  throw new Error('unable to locate global object');
})();
'function' != typeof _o.Promise
  ? (_o.Promise = yo)
  : _o.Promise.prototype.finally
  ? _o.Promise.allSettled || (_o.Promise.allSettled = lo)
  : (_o.Promise.prototype.finally = uo),
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
        var c = t < e.length;
        if (!c || i >= n - 1) {
          if ((o.push(String.fromCharCode.apply(null, r.subarray(0, i))), !c))
            return o.join('');
          (e = e.subarray(t)), (i = t = 0);
        }
        if (0 == (128 & (c = e[t++]))) r[i++] = c;
        else if (192 == (224 & c)) {
          var s = 63 & e[t++];
          r[i++] = ((31 & c) << 6) | s;
        } else if (224 == (240 & c)) {
          s = 63 & e[t++];
          var a = 63 & e[t++];
          r[i++] = ((31 & c) << 12) | (s << 6) | a;
        } else if (240 == (248 & c)) {
          65535 <
            (c =
              ((7 & c) << 18) |
              ((s = 63 & e[t++]) << 12) |
              ((a = 63 & e[t++]) << 6) |
              (63 & e[t++])) &&
            ((c -= 65536),
            (r[i++] = ((c >>> 10) & 1023) | 55296),
            (c = 56320 | (1023 & c))),
            (r[i++] = c);
        }
      }
    }
    if (e.TextEncoder && e.TextDecoder) return !1;
    var o = ['utf-8', 'utf8', 'unicode-1-1-utf-8'];
    Object.defineProperty(t.prototype, 'encoding', { value: 'utf-8' }),
      (t.prototype.encode = function (e, t) {
        if ((t = void 0 === t ? { stream: !1 } : t).stream)
          throw Error("Failed to encode: the 'stream' option is unsupported.");
        t = 0;
        for (
          var n = e.length,
            r = 0,
            o = Math.max(32, n + (n >>> 1) + 7),
            i = new Uint8Array((o >>> 3) << 3);
          t < n;

        ) {
          var c = e.charCodeAt(t++);
          if (55296 <= c && 56319 >= c) {
            if (t < n) {
              var s = e.charCodeAt(t);
              56320 == (64512 & s) &&
                (++t, (c = ((1023 & c) << 10) + (1023 & s) + 65536));
            }
            if (55296 <= c && 56319 >= c) continue;
          }
          if (
            (r + 4 > i.length &&
              ((o += 8),
              (o = ((o *= 1 + (t / e.length) * 2) >>> 3) << 3),
              (s = new Uint8Array(o)).set(i),
              (i = s)),
            0 == (4294967168 & c))
          )
            i[r++] = c;
          else {
            if (0 == (4294965248 & c)) i[r++] = ((c >>> 6) & 31) | 192;
            else if (0 == (4294901760 & c))
              (i[r++] = ((c >>> 12) & 15) | 224),
                (i[r++] = ((c >>> 6) & 63) | 128);
            else {
              if (0 != (4292870144 & c)) continue;
              (i[r++] = ((c >>> 18) & 7) | 240),
                (i[r++] = ((c >>> 12) & 63) | 128),
                (i[r++] = ((c >>> 6) & 63) | 128);
            }
            i[r++] = (63 & c) | 128;
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
          throw Error("Failed to decode: the 'stream' option is unsupported.");
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
  })('undefined' != typeof window ? window : c),
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
    function s() {
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
    function a(e) {
      if (void 0 === e)
        throw new ReferenceError(
          "this hasn't been initialised - super() hasn't been called"
        );
      return e;
    }
    function u(e, t) {
      return !t || ('object' != typeof t && 'function' != typeof t) ? a(e) : t;
    }
    function l(e) {
      var t = s();
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
                    var t = this.listeners[e.type].slice(), n = 0, r = t.length;
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
        r(c, t);
        var i = l(c);
        function c() {
          var t;
          return (
            e(this, c),
            (t = i.call(this)).listeners || p.call(a(t)),
            Object.defineProperty(a(t), 'aborted', {
              value: !1,
              writable: !0,
              configurable: !0
            }),
            Object.defineProperty(a(t), 'onabort', {
              value: null,
              writable: !0,
              configurable: !0
            }),
            t
          );
        }
        return (
          n(c, [
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
                  d(o(c.prototype), 'dispatchEvent', this).call(this, e);
              }
            }
          ]),
          c
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
      })('undefined' != typeof self ? self : c);
  })();
var ko = a(function (e, t) {
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
s(ko);
var Eo = s(
    a(function (e, t) {
      var n =
          (c && c.__awaiter) ||
          function (e, t, n, r) {
            return new (n || (n = Promise))(function (o, i) {
              function c(e) {
                try {
                  a(r.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function s(e) {
                try {
                  a(r.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                e.done
                  ? o(e.value)
                  : new n(function (t) {
                      t(e.value);
                    }).then(c, s);
              }
              a((r = r.apply(e, t || [])).next());
            });
          },
        r =
          (c && c.__generator) ||
          function (e, t) {
            var n,
              r,
              o,
              i,
              c = {
                label: 0,
                sent: function () {
                  if (1 & o[0]) throw o[1];
                  return o[1];
                },
                trys: [],
                ops: []
              };
            return (
              (i = { next: s(0), throw: s(1), return: s(2) }),
              'function' == typeof Symbol &&
                (i[Symbol.iterator] = function () {
                  return this;
                }),
              i
            );
            function s(i) {
              return function (s) {
                return (function (i) {
                  if (n) throw new TypeError('Generator is already executing.');
                  for (; c; )
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
                          return c.label++, { value: i[1], done: !1 };
                        case 5:
                          c.label++, (r = i[1]), (i = [0]);
                          continue;
                        case 7:
                          (i = c.ops.pop()), c.trys.pop();
                          continue;
                        default:
                          if (
                            !((o = c.trys),
                            (o = o.length > 0 && o[o.length - 1]) ||
                              (6 !== i[0] && 2 !== i[0]))
                          ) {
                            c = 0;
                            continue;
                          }
                          if (
                            3 === i[0] &&
                            (!o || (i[1] > o[0] && i[1] < o[3]))
                          ) {
                            c.label = i[1];
                            break;
                          }
                          if (6 === i[0] && c.label < o[1]) {
                            (c.label = o[1]), (o = i);
                            break;
                          }
                          if (o && c.label < o[2]) {
                            (c.label = o[2]), c.ops.push(i);
                            break;
                          }
                          o[2] && c.ops.pop(), c.trys.pop();
                          continue;
                      }
                      i = t.call(e, c);
                    } catch (e) {
                      (i = [6, e]), (r = 0);
                    } finally {
                      n = o = 0;
                    }
                  if (5 & i[0]) throw i[1];
                  return { value: i[0] ? i[1] : void 0, done: !0 };
                })([i, s]);
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
      function s(e) {
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
      var a = (function () {
        function e() {
          (this.acquiredIatSet = new Set()),
            (this.id = Date.now().toString() + s(15)),
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
          (e.prototype.acquireLock = function (t, c) {
            return (
              void 0 === c && (c = 5e3),
              n(this, void 0, void 0, function () {
                var n, a, u, l, f, d;
                return r(this, function (r) {
                  switch (r.label) {
                    case 0:
                      (n = Date.now() + s(4)),
                        (a = Date.now() + c),
                        (u = o + '-' + t),
                        (l = window.localStorage),
                        (r.label = 1);
                    case 1:
                      return Date.now() < a ? [4, i(30)] : [3, 8];
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
                        e.lockCorrector(), [4, this.waitForSomethingToChange(a)]
                      );
                    case 6:
                      r.sent(), (r.label = 7);
                    case 7:
                      return (n = Date.now() + s(4)), [3, 1];
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
                            return [4, ko.default().lock(t)];
                          case 1:
                            return (
                              r.sent(),
                              this.acquiredIatSet.has(t)
                                ? ((n = window.localStorage),
                                  null === (o = n.getItem(e))
                                    ? (ko.default().unlock(t), [2])
                                    : (((o = JSON.parse(
                                        o
                                      )).timeRefreshed = Date.now()),
                                      n.setItem(e, JSON.stringify(o)),
                                      ko.default().unlock(t),
                                      this.refreshLockWhileAcquired(e, t),
                                      [2]))
                                : (ko.default().unlock(t), [2])
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
                        function c() {
                          if (
                            (i ||
                              (window.removeEventListener('storage', c),
                              e.removeFromWaiting(c),
                              clearTimeout(s),
                              (i = !0)),
                            !r)
                          ) {
                            r = !0;
                            var t = 50 - (Date.now() - o);
                            t > 0 ? setTimeout(n, t) : n();
                          }
                        }
                        window.addEventListener('storage', c),
                          e.addToWaiting(c);
                        var s = setTimeout(c, Math.max(0, t - Date.now()));
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
              var n, i, c;
              return r(this, function (r) {
                switch (r.label) {
                  case 0:
                    return (
                      (n = window.localStorage),
                      (i = o + '-' + t),
                      null === (c = n.getItem(i))
                        ? [2]
                        : (c = JSON.parse(c)).id !== this.id
                        ? [3, 2]
                        : [4, ko.default().lock(c.iat)]
                    );
                  case 1:
                    r.sent(),
                      this.acquiredIatSet.delete(c.iat),
                      n.removeItem(i),
                      ko.default().unlock(c.iat),
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
                c = 0;
              c < r.length;
              c++
            ) {
              var s = r[c];
              if (s.includes(o)) {
                var a = n.getItem(s);
                null !== a &&
                  ((void 0 === (a = JSON.parse(a)).timeRefreshed &&
                    a.timeAcquired < t) ||
                    (void 0 !== a.timeRefreshed && a.timeRefreshed < t)) &&
                  (n.removeItem(s), (i = !0));
              }
            }
            i && e.notifyWaiters();
          }),
          (e.waiters = void 0),
          e
        );
      })();
      t.default = a;
    })
  ),
  Io = { timeoutInSeconds: 60 },
  Oo = [
    'login_required',
    'consent_required',
    'interaction_required',
    'account_selection_required',
    'access_denied'
  ],
  To = { name: 'auth0-spa-js', version: '1.15.0' },
  xo = (function (e) {
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
  Ro = (function (e) {
    function n(t, r, o, i) {
      void 0 === i && (i = null);
      var c = e.call(this, t, r) || this;
      return (
        (c.state = o),
        (c.appState = i),
        Object.setPrototypeOf(c, n.prototype),
        c
      );
    }
    return t(n, e), n;
  })(xo),
  Lo = (function (e) {
    function n() {
      var t = e.call(this, 'timeout', 'Timeout') || this;
      return Object.setPrototypeOf(t, n.prototype), t;
    }
    return t(n, e), n;
  })(xo),
  Po = (function (e) {
    function n(t) {
      var r = e.call(this) || this;
      return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
    }
    return t(n, e), n;
  })(Lo),
  jo = (function (e) {
    function n(t) {
      var r = e.call(this, 'cancelled', 'Popup closed') || this;
      return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
    }
    return t(n, e), n;
  })(xo),
  Co = function (e) {
    return new Promise(function (t, n) {
      var r,
        o = setInterval(function () {
          e.popup &&
            e.popup.closed &&
            (clearInterval(o),
            clearTimeout(i),
            window.removeEventListener('message', r, !1),
            n(new jo(e.popup)));
        }, 1e3),
        i = setTimeout(function () {
          clearInterval(o),
            n(new Po(e.popup)),
            window.removeEventListener('message', r, !1);
        }, 1e3 * (e.timeoutInSeconds || 60));
      (r = function (c) {
        if (c.data && 'authorization_response' === c.data.type) {
          if (
            (clearTimeout(i),
            clearInterval(o),
            window.removeEventListener('message', r, !1),
            e.popup.close(),
            c.data.response.error)
          )
            return n(xo.fromPayload(c.data.response));
          t(c.data.response);
        }
      }),
        window.addEventListener('message', r);
    });
  },
  Ao = function () {
    return window.crypto || window.msCrypto;
  },
  Uo = function () {
    var e = Ao();
    return e.subtle || e.webkitSubtle;
  },
  Fo = function () {
    var e =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.',
      t = '';
    return (
      Array.from(Ao().getRandomValues(new Uint8Array(43))).forEach(function (
        n
      ) {
        return (t += e[n % e.length]);
      }),
      t
    );
  },
  Ko = function (e) {
    return btoa(e);
  },
  Wo = function (e) {
    return Object.keys(e)
      .filter(function (t) {
        return void 0 !== e[t];
      })
      .map(function (t) {
        return encodeURIComponent(t) + '=' + encodeURIComponent(e[t]);
      })
      .join('&');
  },
  No = function (e) {
    return o(void 0, void 0, void 0, function () {
      var t;
      return i(this, function (n) {
        switch (n.label) {
          case 0:
            return (
              (t = Uo().digest(
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
  zo = function (e) {
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
  Vo = function (e) {
    var t = new Uint8Array(e);
    return (function (e) {
      var t = { '+': '-', '/': '_', '=': '' };
      return e.replace(/[+/=]/g, function (e) {
        return t[e];
      });
    })(window.btoa(String.fromCharCode.apply(String, Array.from(t))));
  };
var Zo = function (e, t) {
    return o(void 0, void 0, void 0, function () {
      var n, r;
      return i(this, function (o) {
        switch (o.label) {
          case 0:
            return [
              4,
              ((i = e),
              (c = t),
              (c = c || {}),
              new Promise(function (e, t) {
                var n = new XMLHttpRequest(),
                  r = [],
                  o = [],
                  s = {},
                  a = function () {
                    return {
                      ok: 2 == ((n.status / 100) | 0),
                      statusText: n.statusText,
                      status: n.status,
                      url: n.responseURL,
                      text: function () {
                        return Promise.resolve(n.responseText);
                      },
                      json: function () {
                        return Promise.resolve(n.responseText).then(JSON.parse);
                      },
                      blob: function () {
                        return Promise.resolve(new Blob([n.response]));
                      },
                      clone: a,
                      headers: {
                        keys: function () {
                          return r;
                        },
                        entries: function () {
                          return o;
                        },
                        get: function (e) {
                          return s[e.toLowerCase()];
                        },
                        has: function (e) {
                          return e.toLowerCase() in s;
                        }
                      }
                    };
                  };
                for (var u in (n.open(c.method || 'get', i, !0),
                (n.onload = function () {
                  n
                    .getAllResponseHeaders()
                    .replace(
                      /^(.*?):[^\S\n]*([\s\S]*?)$/gm,
                      function (e, t, n) {
                        r.push((t = t.toLowerCase())),
                          o.push([t, n]),
                          (s[t] = s[t] ? s[t] + ',' + n : n);
                      }
                    ),
                    e(a());
                }),
                (n.onerror = t),
                (n.withCredentials = 'include' == c.credentials),
                c.headers))
                  n.setRequestHeader(u, c.headers[u]);
                n.send(c.body || null);
              }))
            ];
          case 1:
            return (n = o.sent()), (r = { ok: n.ok }), [4, n.json()];
          case 2:
            return [2, ((r.json = o.sent()), r)];
        }
        var i, c;
      });
    });
  },
  Xo = function (e, t, n) {
    return o(void 0, void 0, void 0, function () {
      var r, o;
      return i(this, function (i) {
        return (
          (r = new AbortController()),
          (t.signal = r.signal),
          [
            2,
            Promise.race([
              Zo(e, t),
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
  Do = function (e, t, n, r, c, s) {
    return o(void 0, void 0, void 0, function () {
      return i(this, function (o) {
        return [
          2,
          ((i = {
            auth: { audience: t, scope: n },
            timeout: c,
            fetchUrl: e,
            fetchOptions: r
          }),
          (a = s),
          new Promise(function (e, t) {
            var n = new MessageChannel();
            (n.port1.onmessage = function (n) {
              n.data.error ? t(new Error(n.data.error)) : e(n.data);
            }),
              a.postMessage(i, [n.port2]);
          }))
        ];
        var i, a;
      });
    });
  },
  Go = function (e, t, n, r, c, s) {
    return (
      void 0 === s && (s = 1e4),
      o(void 0, void 0, void 0, function () {
        return i(this, function (o) {
          return c ? [2, Do(e, t, n, r, s, c)] : [2, Xo(e, r, s)];
        });
      })
    );
  };
function Jo(e, t, n, c, s, a) {
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
          return i.trys.push([2, 4, , 5]), [4, Go(e, n, c, s, a, t)];
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
            throw new xo(
              p || 'request_error',
              h || 'HTTP error. Unable to fetch ' + e
            );
          return [2, y];
      }
    });
  });
}
function Yo(e, t) {
  var n = e.baseUrl,
    c = e.timeout,
    s = e.audience,
    a = e.scope,
    u = e.auth0Client,
    l = r(e, ['baseUrl', 'timeout', 'audience', 'scope', 'auth0Client']);
  return o(this, void 0, void 0, function () {
    return i(this, function (e) {
      switch (e.label) {
        case 0:
          return [
            4,
            Jo(
              n + '/oauth/token',
              c,
              s || 'default',
              a,
              {
                method: 'POST',
                body: JSON.stringify(l),
                headers: {
                  'Content-type': 'application/json',
                  'Auth0-Client': btoa(JSON.stringify(u || To))
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
var Bo = function (e) {
    return Array.from(new Set(e));
  },
  Mo = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
    return Bo(e.join(' ').trim().split(/\s+/)).join(' ');
  },
  Ho = (function () {
    function e(e, t) {
      void 0 === t && (t = qo),
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
  qo = '@@auth0spajs@@',
  Qo = function (e) {
    var t = Math.floor(Date.now() / 1e3) + e.expires_in;
    return { body: e, expiresAt: Math.min(t, e.decodedToken.claims.exp) };
  },
  $o = function (e, t) {
    var n = e.client_id,
      r = e.audience,
      o = e.scope;
    return t.filter(function (e) {
      var t = Ho.fromKey(e),
        i = t.prefix,
        c = t.client_id,
        s = t.audience,
        a = t.scope,
        u = a && a.split(' '),
        l =
          a &&
          o.split(' ').reduce(function (e, t) {
            return e && u.includes(t);
          }, !0);
      return i === qo && c === n && s === r && l;
    })[0];
  },
  ei = (function () {
    function e() {}
    return (
      (e.prototype.save = function (e) {
        var t = new Ho({
            client_id: e.client_id,
            scope: e.scope,
            audience: e.audience
          }),
          n = Qo(e);
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
          localStorage.key(e).startsWith(qo) &&
            localStorage.removeItem(localStorage.key(e));
      }),
      (e.prototype.readJson = function (e) {
        var t,
          n = $o(e, Object.keys(window.localStorage)),
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
  ti = function () {
    var e;
    this.enclosedCache =
      ((e = {}),
      {
        save: function (t) {
          var n = new Ho({
              client_id: t.client_id,
              scope: t.scope,
              audience: t.audience
            }),
            r = Qo(t);
          e[n.toKey()] = r;
        },
        get: function (t, n) {
          void 0 === n && (n = 0);
          var r = $o(t, Object.keys(e)),
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
  ni = (function () {
    function e(e) {
      (this.storage = e), (this.transaction = this.storage.get('a0.spajs.txs'));
    }
    return (
      (e.prototype.create = function (e) {
        (this.transaction = e),
          this.storage.save('a0.spajs.txs', e, { daysUntilExpire: 1 });
      }),
      (e.prototype.get = function () {
        return this.transaction;
      }),
      (e.prototype.remove = function () {
        delete this.transaction, this.storage.remove('a0.spajs.txs');
      }),
      e
    );
  })(),
  ri = function (e) {
    return 'number' == typeof e;
  },
  oi = [
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
  ii = function (e) {
    if (!e.id_token) throw new Error('ID token is required but missing');
    var t = (function (e) {
      var t = e.split('.'),
        n = t[0],
        r = t[1],
        o = t[2];
      if (3 !== t.length || !n || !r || !o)
        throw new Error('ID token could not be decoded');
      var i = JSON.parse(zo(r)),
        c = { __raw: e },
        s = {};
      return (
        Object.keys(i).forEach(function (e) {
          (c[e] = i[e]), oi.includes(e) || (s[e] = i[e]);
        }),
        {
          encoded: { header: n, payload: r, signature: o },
          header: JSON.parse(zo(n)),
          claims: c,
          user: s
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
    if (e.max_age && !ri(t.claims.auth_time))
      throw new Error(
        'Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified'
      );
    if (!ri(t.claims.exp))
      throw new Error(
        'Expiration Time (exp) claim must be a number present in the ID token'
      );
    if (!ri(t.claims.iat))
      throw new Error(
        'Issued At (iat) claim must be a number present in the ID token'
      );
    var n = e.leeway || 60,
      r = new Date(Date.now()),
      o = new Date(0),
      i = new Date(0),
      c = new Date(0);
    if (
      (c.setUTCSeconds(parseInt(t.claims.auth_time) + e.max_age + n),
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
    if (ri(t.claims.nbf) && r < i)
      throw new Error(
        "Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (" +
          r +
          ') is before ' +
          i
      );
    if (ri(t.claims.auth_time) && r > c)
      throw new Error(
        'Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Currrent time (' +
          r +
          ') is after last auth at ' +
          c
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
  ci = a(function (e, t) {
    var n =
      (c && c.__assign) ||
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
          c = i.slice(1).join('=');
        '"' === c.charAt(0) && (c = c.slice(1, -1));
        try {
          t[i[0].replace(r, decodeURIComponent)] = c.replace(
            r,
            decodeURIComponent
          );
        } catch (e) {}
      }
      return t;
    }
    function s() {
      return i(document.cookie);
    }
    function a(e, t, r) {
      document.cookie = o(e, t, n({ path: '/' }, r));
    }
    (t.__esModule = !0),
      (t.encode = o),
      (t.parse = i),
      (t.getAll = s),
      (t.get = function (e) {
        return s()[e];
      }),
      (t.set = a),
      (t.remove = function (e, t) {
        a(e, '', n(n({}, t), { expires: -1 }));
      });
  });
s(ci), ci.encode, ci.parse, ci.getAll;
var si = ci.get,
  ai = ci.set,
  ui = ci.remove,
  li = {
    get: function (e) {
      var t = si(e);
      if (void 0 !== t) return JSON.parse(t);
    },
    save: function (e, t, n) {
      var r = {};
      'https:' === window.location.protocol &&
        (r = { secure: !0, sameSite: 'none' }),
        (r.expires = n.daysUntilExpire),
        ai(e, JSON.stringify(t), r);
    },
    remove: function (e) {
      ui(e);
    }
  },
  fi = {
    get: function (e) {
      var t = li.get(e);
      return t || li.get('_legacy_' + e);
    },
    save: function (e, t, n) {
      var r = {};
      'https:' === window.location.protocol && (r = { secure: !0 }),
        (r.expires = n.daysUntilExpire),
        ai('_legacy_' + e, JSON.stringify(t), r),
        li.save(e, t, n);
    },
    remove: function (e) {
      li.remove(e), li.remove('_legacy_' + e);
    }
  },
  di = {
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
***************************************************************************** */
var pi = function (e, t) {
  return (pi =
    Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array &&
      function (e, t) {
        e.__proto__ = t;
      }) ||
    function (e, t) {
      for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
    })(e, t);
};
function hi(e, t) {
  function n() {
    this.constructor = e;
  }
  pi(e, t),
    (e.prototype =
      null === t ? Object.create(t) : ((n.prototype = t.prototype), new n()));
}
function yi(e) {
  return 'function' == typeof e;
}
var vi = !1,
  bi = {
    Promise: void 0,
    set useDeprecatedSynchronousErrorHandling(e) {
      e && new Error().stack;
      vi = e;
    },
    get useDeprecatedSynchronousErrorHandling() {
      return vi;
    }
  };
function gi(e) {
  setTimeout(function () {
    throw e;
  }, 0);
}
var mi = {
    closed: !0,
    next: function (e) {},
    error: function (e) {
      if (bi.useDeprecatedSynchronousErrorHandling) throw e;
      gi(e);
    },
    complete: function () {}
  },
  wi = (function () {
    return (
      Array.isArray ||
      function (e) {
        return e && 'number' == typeof e.length;
      }
    );
  })();
var Si = (function () {
    function e(e) {
      return (
        Error.call(this),
        (this.message = e
          ? e.length +
            ' errors occurred during unsubscription:\n' +
            e
              .map(function (e, t) {
                return t + 1 + ') ' + e.toString();
              })
              .join('\n  ')
          : ''),
        (this.name = 'UnsubscriptionError'),
        (this.errors = e),
        this
      );
    }
    return (e.prototype = Object.create(Error.prototype)), e;
  })(),
  _i = (function () {
    function e(e) {
      (this.closed = !1),
        (this._parentOrParents = null),
        (this._subscriptions = null),
        e && ((this._ctorUnsubscribe = !0), (this._unsubscribe = e));
    }
    return (
      (e.prototype.unsubscribe = function () {
        var t;
        if (!this.closed) {
          var n,
            r = this,
            o = r._parentOrParents,
            i = r._ctorUnsubscribe,
            c = r._unsubscribe,
            s = r._subscriptions;
          if (
            ((this.closed = !0),
            (this._parentOrParents = null),
            (this._subscriptions = null),
            o instanceof e)
          )
            o.remove(this);
          else if (null !== o)
            for (var a = 0; a < o.length; ++a) {
              o[a].remove(this);
            }
          if (yi(c)) {
            i && (this._unsubscribe = void 0);
            try {
              c.call(this);
            } catch (e) {
              t = e instanceof Si ? ki(e.errors) : [e];
            }
          }
          if (wi(s)) {
            a = -1;
            for (var u = s.length; ++a < u; ) {
              var l = s[a];
              if (null !== (n = l) && 'object' == typeof n)
                try {
                  l.unsubscribe();
                } catch (e) {
                  (t = t || []),
                    e instanceof Si ? (t = t.concat(ki(e.errors))) : t.push(e);
                }
            }
          }
          if (t) throw new Si(t);
        }
      }),
      (e.prototype.add = function (t) {
        var n = t;
        if (!t) return e.EMPTY;
        switch (typeof t) {
          case 'function':
            n = new e(t);
          case 'object':
            if (n === this || n.closed || 'function' != typeof n.unsubscribe)
              return n;
            if (this.closed) return n.unsubscribe(), n;
            if (!(n instanceof e)) {
              var r = n;
              (n = new e())._subscriptions = [r];
            }
            break;
          default:
            throw new Error(
              'unrecognized teardown ' + t + ' added to Subscription.'
            );
        }
        var o = n._parentOrParents;
        if (null === o) n._parentOrParents = this;
        else if (o instanceof e) {
          if (o === this) return n;
          n._parentOrParents = [o, this];
        } else {
          if (-1 !== o.indexOf(this)) return n;
          o.push(this);
        }
        var i = this._subscriptions;
        return null === i ? (this._subscriptions = [n]) : i.push(n), n;
      }),
      (e.prototype.remove = function (e) {
        var t = this._subscriptions;
        if (t) {
          var n = t.indexOf(e);
          -1 !== n && t.splice(n, 1);
        }
      }),
      (e.EMPTY = (function (e) {
        return (e.closed = !0), e;
      })(new e())),
      e
    );
  })();
function ki(e) {
  return e.reduce(function (e, t) {
    return e.concat(t instanceof Si ? t.errors : t);
  }, []);
}
var Ei = (function () {
    return 'function' == typeof Symbol
      ? Symbol('rxSubscriber')
      : '@@rxSubscriber_' + Math.random();
  })(),
  Ii = (function (e) {
    function t(n, r, o) {
      var i = e.call(this) || this;
      switch (
        ((i.syncErrorValue = null),
        (i.syncErrorThrown = !1),
        (i.syncErrorThrowable = !1),
        (i.isStopped = !1),
        arguments.length)
      ) {
        case 0:
          i.destination = mi;
          break;
        case 1:
          if (!n) {
            i.destination = mi;
            break;
          }
          if ('object' == typeof n) {
            n instanceof t
              ? ((i.syncErrorThrowable = n.syncErrorThrowable),
                (i.destination = n),
                n.add(i))
              : ((i.syncErrorThrowable = !0), (i.destination = new Oi(i, n)));
            break;
          }
        default:
          (i.syncErrorThrowable = !0), (i.destination = new Oi(i, n, r, o));
      }
      return i;
    }
    return (
      hi(t, e),
      (t.prototype[Ei] = function () {
        return this;
      }),
      (t.create = function (e, n, r) {
        var o = new t(e, n, r);
        return (o.syncErrorThrowable = !1), o;
      }),
      (t.prototype.next = function (e) {
        this.isStopped || this._next(e);
      }),
      (t.prototype.error = function (e) {
        this.isStopped || ((this.isStopped = !0), this._error(e));
      }),
      (t.prototype.complete = function () {
        this.isStopped || ((this.isStopped = !0), this._complete());
      }),
      (t.prototype.unsubscribe = function () {
        this.closed ||
          ((this.isStopped = !0), e.prototype.unsubscribe.call(this));
      }),
      (t.prototype._next = function (e) {
        this.destination.next(e);
      }),
      (t.prototype._error = function (e) {
        this.destination.error(e), this.unsubscribe();
      }),
      (t.prototype._complete = function () {
        this.destination.complete(), this.unsubscribe();
      }),
      (t.prototype._unsubscribeAndRecycle = function () {
        var e = this._parentOrParents;
        return (
          (this._parentOrParents = null),
          this.unsubscribe(),
          (this.closed = !1),
          (this.isStopped = !1),
          (this._parentOrParents = e),
          this
        );
      }),
      t
    );
  })(_i),
  Oi = (function (e) {
    function t(t, n, r, o) {
      var i,
        c = e.call(this) || this;
      c._parentSubscriber = t;
      var s = c;
      return (
        yi(n)
          ? (i = n)
          : n &&
            ((i = n.next),
            (r = n.error),
            (o = n.complete),
            n !== mi &&
              (yi((s = Object.create(n)).unsubscribe) &&
                c.add(s.unsubscribe.bind(s)),
              (s.unsubscribe = c.unsubscribe.bind(c)))),
        (c._context = s),
        (c._next = i),
        (c._error = r),
        (c._complete = o),
        c
      );
    }
    return (
      hi(t, e),
      (t.prototype.next = function (e) {
        if (!this.isStopped && this._next) {
          var t = this._parentSubscriber;
          bi.useDeprecatedSynchronousErrorHandling && t.syncErrorThrowable
            ? this.__tryOrSetError(t, this._next, e) && this.unsubscribe()
            : this.__tryOrUnsub(this._next, e);
        }
      }),
      (t.prototype.error = function (e) {
        if (!this.isStopped) {
          var t = this._parentSubscriber,
            n = bi.useDeprecatedSynchronousErrorHandling;
          if (this._error)
            n && t.syncErrorThrowable
              ? (this.__tryOrSetError(t, this._error, e), this.unsubscribe())
              : (this.__tryOrUnsub(this._error, e), this.unsubscribe());
          else if (t.syncErrorThrowable)
            n ? ((t.syncErrorValue = e), (t.syncErrorThrown = !0)) : gi(e),
              this.unsubscribe();
          else {
            if ((this.unsubscribe(), n)) throw e;
            gi(e);
          }
        }
      }),
      (t.prototype.complete = function () {
        var e = this;
        if (!this.isStopped) {
          var t = this._parentSubscriber;
          if (this._complete) {
            var n = function () {
              return e._complete.call(e._context);
            };
            bi.useDeprecatedSynchronousErrorHandling && t.syncErrorThrowable
              ? (this.__tryOrSetError(t, n), this.unsubscribe())
              : (this.__tryOrUnsub(n), this.unsubscribe());
          } else this.unsubscribe();
        }
      }),
      (t.prototype.__tryOrUnsub = function (e, t) {
        try {
          e.call(this._context, t);
        } catch (e) {
          if ((this.unsubscribe(), bi.useDeprecatedSynchronousErrorHandling))
            throw e;
          gi(e);
        }
      }),
      (t.prototype.__tryOrSetError = function (e, t, n) {
        if (!bi.useDeprecatedSynchronousErrorHandling)
          throw new Error('bad call');
        try {
          t.call(this._context, n);
        } catch (t) {
          return bi.useDeprecatedSynchronousErrorHandling
            ? ((e.syncErrorValue = t), (e.syncErrorThrown = !0), !0)
            : (gi(t), !0);
        }
        return !1;
      }),
      (t.prototype._unsubscribe = function () {
        var e = this._parentSubscriber;
        (this._context = null),
          (this._parentSubscriber = null),
          e.unsubscribe();
      }),
      t
    );
  })(Ii);
var Ti = (function () {
  return ('function' == typeof Symbol && Symbol.observable) || '@@observable';
})();
function xi(e) {
  return e;
}
function Ri(e) {
  return 0 === e.length
    ? xi
    : 1 === e.length
    ? e[0]
    : function (t) {
        return e.reduce(function (e, t) {
          return t(e);
        }, t);
      };
}
var Li = (function () {
  function e(e) {
    (this._isScalar = !1), e && (this._subscribe = e);
  }
  return (
    (e.prototype.lift = function (t) {
      var n = new e();
      return (n.source = this), (n.operator = t), n;
    }),
    (e.prototype.subscribe = function (e, t, n) {
      var r = this.operator,
        o = (function (e, t, n) {
          if (e) {
            if (e instanceof Ii) return e;
            if (e[Ei]) return e[Ei]();
          }
          return e || t || n ? new Ii(e, t, n) : new Ii(mi);
        })(e, t, n);
      if (
        (r
          ? o.add(r.call(o, this.source))
          : o.add(
              this.source ||
                (bi.useDeprecatedSynchronousErrorHandling &&
                  !o.syncErrorThrowable)
                ? this._subscribe(o)
                : this._trySubscribe(o)
            ),
        bi.useDeprecatedSynchronousErrorHandling &&
          o.syncErrorThrowable &&
          ((o.syncErrorThrowable = !1), o.syncErrorThrown))
      )
        throw o.syncErrorValue;
      return o;
    }),
    (e.prototype._trySubscribe = function (e) {
      try {
        return this._subscribe(e);
      } catch (t) {
        bi.useDeprecatedSynchronousErrorHandling &&
          ((e.syncErrorThrown = !0), (e.syncErrorValue = t)),
          !(function (e) {
            for (; e; ) {
              var t = e,
                n = t.closed,
                r = t.destination,
                o = t.isStopped;
              if (n || o) return !1;
              e = r && r instanceof Ii ? r : null;
            }
            return !0;
          })(e)
            ? console.warn(t)
            : e.error(t);
      }
    }),
    (e.prototype.forEach = function (e, t) {
      var n = this;
      return new (t = Pi(t))(function (t, r) {
        var o;
        o = n.subscribe(
          function (t) {
            try {
              e(t);
            } catch (e) {
              r(e), o && o.unsubscribe();
            }
          },
          r,
          t
        );
      });
    }),
    (e.prototype._subscribe = function (e) {
      var t = this.source;
      return t && t.subscribe(e);
    }),
    (e.prototype[Ti] = function () {
      return this;
    }),
    (e.prototype.pipe = function () {
      for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
      return 0 === e.length ? this : Ri(e)(this);
    }),
    (e.prototype.toPromise = function (e) {
      var t = this;
      return new (e = Pi(e))(function (e, n) {
        var r;
        t.subscribe(
          function (e) {
            return (r = e);
          },
          function (e) {
            return n(e);
          },
          function () {
            return e(r);
          }
        );
      });
    }),
    (e.create = function (t) {
      return new e(t);
    }),
    e
  );
})();
function Pi(e) {
  if ((e || (e = Promise), !e)) throw new Error('no Promise impl found');
  return e;
}
var ji = (function () {
    function e(e, t) {
      (this.project = e), (this.thisArg = t);
    }
    return (
      (e.prototype.call = function (e, t) {
        return t.subscribe(new Ci(e, this.project, this.thisArg));
      }),
      e
    );
  })(),
  Ci = (function (e) {
    function t(t, n, r) {
      var o = e.call(this, t) || this;
      return (o.project = n), (o.count = 0), (o.thisArg = r || o), o;
    }
    return (
      hi(t, e),
      (t.prototype._next = function (e) {
        var t;
        try {
          t = this.project.call(this.thisArg, e, this.count++);
        } catch (e) {
          return void this.destination.error(e);
        }
        this.destination.next(t);
      }),
      t
    );
  })(Ii);
function Ai(e, t, n, r) {
  return (
    yi(n) && ((r = n), (n = void 0)),
    r
      ? Ai(e, t, n).pipe(
          ((o = function (e) {
            return wi(e) ? r.apply(void 0, e) : r(e);
          }),
          function (e) {
            if ('function' != typeof o)
              throw new TypeError(
                'argument is not a function. Are you looking for `mapTo()`?'
              );
            return e.lift(new ji(o, i));
          })
        )
      : new Li(function (r) {
          Ui(
            e,
            t,
            function (e) {
              arguments.length > 1
                ? r.next(Array.prototype.slice.call(arguments))
                : r.next(e);
            },
            r,
            n
          );
        })
  );
  var o, i;
}
function Ui(e, t, n, r, o) {
  var i;
  if (
    (function (e) {
      return (
        e &&
        'function' == typeof e.addEventListener &&
        'function' == typeof e.removeEventListener
      );
    })(e)
  ) {
    var c = e;
    e.addEventListener(t, n, o),
      (i = function () {
        return c.removeEventListener(t, n, o);
      });
  } else if (
    (function (e) {
      return e && 'function' == typeof e.on && 'function' == typeof e.off;
    })(e)
  ) {
    var s = e;
    e.on(t, n),
      (i = function () {
        return s.off(t, n);
      });
  } else if (
    (function (e) {
      return (
        e &&
        'function' == typeof e.addListener &&
        'function' == typeof e.removeListener
      );
    })(e)
  ) {
    var a = e;
    e.addListener(t, n),
      (i = function () {
        return a.removeListener(t, n);
      });
  } else {
    if (!e || !e.length) throw new TypeError('Invalid event target');
    for (var u = 0, l = e.length; u < l; u++) Ui(e[u], t, n, r, o);
  }
  r.add(i);
}
var Fi = { error: 'cordova_not_available' },
  Ki = { error: 'plugin_not_installed' };
function Wi(e) {
  if ('undefined' != typeof window && window.angular) {
    var t = window.document,
      n = window.angular
        .element(t.querySelector('[ng-app]') || t.body)
        .injector();
    if (n)
      return n.get('$q')(function (t, n) {
        e(t, n);
      });
    console.warn(
      "Angular 1 was detected but $q couldn't be retrieved. This is usually when the app is not bootstrapped on the html or body tag. Falling back to native promises which won't trigger an automatic digest when promises resolve."
    );
  }
  return (function () {
    if (Promise)
      return new Promise(function (t, n) {
        e(t, n);
      });
    console.error(
      'No Promise support or polyfill found. To enable Ionic Native support, please add the es6-promise polyfill before this script, or run with a library like Angular or on a recent browser.'
    );
  })();
}
function Ni(e, t, n, r) {
  var o, i;
  void 0 === r && (r = {});
  var c = Wi(function (c, s) {
    (o = r.destruct
      ? Di(
          e,
          t,
          n,
          r,
          function () {
            for (var e = [], t = 0; t < arguments.length; t++)
              e[t] = arguments[t];
            return c(e);
          },
          function () {
            for (var e = [], t = 0; t < arguments.length; t++)
              e[t] = arguments[t];
            return s(e);
          }
        )
      : Di(e, t, n, r, c, s)),
      (i = s);
  });
  return (
    o &&
      o.error &&
      (c.catch(function () {}), 'function' == typeof i && i(o.error)),
    c
  );
}
function zi(e, t, n, r) {
  return (
    void 0 === r && (r = {}),
    Wi(function (o, i) {
      var c = Di(e, t, n, r);
      c
        ? c.error
          ? i(c.error)
          : c.then && c.then(o).catch(i)
        : i({ error: 'unexpected_error' });
    })
  );
}
function Vi(e, t, n, r) {
  return (
    void 0 === r && (r = {}),
    new Li(function (o) {
      var i;
      return (
        (i = r.destruct
          ? Di(
              e,
              t,
              n,
              r,
              function () {
                for (var e = [], t = 0; t < arguments.length; t++)
                  e[t] = arguments[t];
                return o.next(e);
              },
              function () {
                for (var e = [], t = 0; t < arguments.length; t++)
                  e[t] = arguments[t];
                return o.error(e);
              }
            )
          : Di(e, t, n, r, o.next.bind(o), o.error.bind(o))) &&
          i.error &&
          (o.error(i.error), o.complete()),
        function () {
          try {
            if (r.clearFunction)
              return r.clearWithArgs
                ? Di(e, r.clearFunction, n, r, o.next.bind(o), o.error.bind(o))
                : Di(e, r.clearFunction, []);
          } catch (n) {
            console.warn(
              'Unable to clear the previous observable watch for',
              e.constructor.getPluginName(),
              t
            ),
              console.warn(n);
          }
        }
      );
    })
  );
}
function Zi(e, t) {
  return Ai(
    (t =
      'undefined' != typeof window && t
        ? Ji(window, t)
        : t || ('undefined' != typeof window ? window : {})),
    e
  );
}
function Xi(e, t, n) {
  var r, o, i;
  return (
    'string' == typeof e
      ? (r = e)
      : ((r = e.constructor.getPluginRef()),
        (n = e.constructor.getPluginName()),
        (i = e.constructor.getPluginInstallName())),
    !(!(o = Gi(r)) || (t && void 0 === o[t])) ||
      ('undefined' != typeof window && window.cordova
        ? ((function (e, t, n) {
            n
              ? console.warn(
                  'Native: tried calling ' +
                    e +
                    '.' +
                    n +
                    ', but the ' +
                    e +
                    ' plugin is not installed.'
                )
              : console.warn(
                  'Native: tried accessing the ' +
                    e +
                    " plugin but it's not installed."
                );
            t &&
              console.warn(
                'Install the ' +
                  e +
                  " plugin: 'ionic cordova plugin add " +
                  t +
                  "'"
              );
          })(n, i, t),
          Ki)
        : ((function (e, t) {
            'undefined' == typeof process &&
              (t
                ? console.warn(
                    'Native: tried calling ' +
                      e +
                      '.' +
                      t +
                      ', but Cordova is not available. Make sure to include cordova.js or run in a device/simulator'
                  )
                : console.warn(
                    'Native: tried accessing the ' +
                      e +
                      ' plugin but Cordova is not available. Make sure to include cordova.js or run in a device/simulator'
                  ));
          })(n, t),
          Fi))
  );
}
function Di(e, t, n, r, o, i) {
  void 0 === r && (r = {}),
    (n = (function (e, t, n, r) {
      if ((void 0 === t && (t = {}), t.sync)) return e;
      if ('reverse' === t.callbackOrder) e.unshift(r), e.unshift(n);
      else if ('node' === t.callbackStyle)
        e.push(function (e, t) {
          e ? r(e) : n(t);
        });
      else if ('object' === t.callbackStyle && t.successName && t.errorName) {
        var o = {};
        (o[t.successName] = n), (o[t.errorName] = r), e.push(o);
      } else if (void 0 !== t.successIndex || void 0 !== t.errorIndex) {
        var i = function () {
            t.successIndex > e.length
              ? (e[t.successIndex] = n)
              : e.splice(t.successIndex, 0, n);
          },
          c = function () {
            t.errorIndex > e.length
              ? (e[t.errorIndex] = r)
              : e.splice(t.errorIndex, 0, r);
          };
        t.successIndex > t.errorIndex ? (c(), i()) : (i(), c());
      } else e.push(n), e.push(r);
      return e;
    })(n, r, o, i));
  var c = Xi(e, t);
  if (!0 === c) {
    var s = Gi(e.constructor.getPluginRef());
    return s[t].apply(s, n);
  }
  return c;
}
function Gi(e) {
  return 'undefined' != typeof window ? Ji(window, e) : null;
}
function Ji(e, t) {
  for (var n = t.split('.'), r = e, o = 0; o < n.length; o++) {
    if (!r) return null;
    r = r[n[o]];
  }
  return r;
}
var Yi = (function () {
  function e() {}
  return (
    (e.installed = function () {
      return !0 === Xi(this.pluginRef);
    }),
    (e.getPlugin = function () {
      return 'undefined' != typeof window
        ? (function (e, t) {
            for (var n = t.split('.'), r = e, o = 0; o < n.length; o++) {
              if (!r) return null;
              r = r[n[o]];
            }
            return r;
          })(window, this.pluginRef)
        : null;
    }),
    (e.getPluginName = function () {
      return this.pluginName;
    }),
    (e.getPluginRef = function () {
      return this.pluginRef;
    }),
    (e.getPluginInstallName = function () {
      return this.plugin;
    }),
    (e.getSupportedPlatforms = function () {
      return this.platforms;
    }),
    (e.pluginName = ''),
    (e.pluginRef = ''),
    (e.plugin = ''),
    (e.repo = ''),
    (e.platforms = []),
    (e.install = ''),
    e
  );
})();
function Bi(e, t, n, r) {
  return (function (e, t, n) {
    return (
      void 0 === n && (n = {}),
      function () {
        for (var r = [], o = 0; o < arguments.length; o++) r[o] = arguments[o];
        return n.sync
          ? Di(e, t, r, n)
          : n.observable
          ? Vi(e, t, r, n)
          : n.eventObservable && n.event
          ? Zi(n.event, n.element)
          : n.otherPromise
          ? zi(e, t, r, n)
          : Ni(e, t, r, n);
      }
    );
  })(e, t, n).apply(this, r);
}
!(function () {
  if ('undefined' == typeof process) {
    var e = 'undefined' != typeof window ? window : {},
      t = Date.now(),
      n = !1;
    e.document.addEventListener('deviceready', function () {
      console.log(
        'Ionic Native: deviceready event fired after ' +
          (Date.now() - t) +
          ' ms'
      ),
        (n = !0);
    }),
      setTimeout(function () {
        !n &&
          e.cordova &&
          console.warn(
            'Ionic Native: deviceready did not fire within 5000ms. This can happen when plugins are in an inconsistent state. Try removing plugins from plugins/ and reinstalling them.'
          );
      }, 5e3);
  }
})();
var Mi = (function () {
    var e = function (t, n) {
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
    return function (t, n) {
      function r() {
        this.constructor = t;
      }
      e(t, n),
        (t.prototype =
          null === n
            ? Object.create(n)
            : ((r.prototype = n.prototype), new r()));
    };
  })(),
  Hi = new ((function (e) {
    function t() {
      return (null !== e && e.apply(this, arguments)) || this;
    }
    return (
      Mi(t, e),
      (t.prototype.start = function (e, t) {
        return Bi(this, 'start', {}, arguments);
      }),
      (t.pluginName = 'IosASWebauthenticationSession'),
      (t.plugin = 'cordova-plugin-ios-aswebauthenticationsession-api'),
      (t.pluginRef = 'plugins.ASWebAuthSession'),
      (t.repo =
        'https://github.com/jwelker110/cordova-plugin-ios-aswebauthenticationsession-api'),
      (t.platforms = ['iOS']),
      t
    );
  })(Yi))();
function qi(e, t, n) {
  var r = void 0 === t ? null : t,
    o = (function (e, t) {
      var n = atob(e);
      if (t) {
        for (var r = new Uint8Array(n.length), o = 0, i = n.length; o < i; ++o)
          r[o] = n.charCodeAt(o);
        return String.fromCharCode.apply(null, new Uint16Array(r.buffer));
      }
      return n;
    })(e, void 0 !== n && n),
    i = o.indexOf('\n', 10) + 1,
    c = o.substring(i) + (r ? '//# sourceMappingURL=' + r : ''),
    s = new Blob([c], { type: 'application/javascript' });
  return URL.createObjectURL(s);
}
var Qi,
  $i,
  ec,
  tc,
  nc =
    ((Qi =
      'Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7Ci8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgogICAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uCgogICAgUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55CiAgICBwdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuCgogICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICJBUyBJUyIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEgKICAgIFJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULAogICAgSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NCiAgICBMT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUgogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUgogICAgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS4KICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovdmFyIGU9ZnVuY3Rpb24oKXtyZXR1cm4oZT1PYmplY3QuYXNzaWdufHxmdW5jdGlvbihlKXtmb3IodmFyIHQscj0xLG49YXJndW1lbnRzLmxlbmd0aDtyPG47cisrKWZvcih2YXIgbyBpbiB0PWFyZ3VtZW50c1tyXSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodCxvKSYmKGVbb109dFtvXSk7cmV0dXJuIGV9KS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9O2Z1bmN0aW9uIHQoZSx0LHIsbil7cmV0dXJuIG5ldyhyfHwocj1Qcm9taXNlKSkoKGZ1bmN0aW9uKG8scyl7ZnVuY3Rpb24gYShlKXt0cnl7dShuLm5leHQoZSkpfWNhdGNoKGUpe3MoZSl9fWZ1bmN0aW9uIGkoZSl7dHJ5e3Uobi50aHJvdyhlKSl9Y2F0Y2goZSl7cyhlKX19ZnVuY3Rpb24gdShlKXt2YXIgdDtlLmRvbmU/byhlLnZhbHVlKToodD1lLnZhbHVlLHQgaW5zdGFuY2VvZiByP3Q6bmV3IHIoKGZ1bmN0aW9uKGUpe2UodCl9KSkpLnRoZW4oYSxpKX11KChuPW4uYXBwbHkoZSx0fHxbXSkpLm5leHQoKSl9KSl9ZnVuY3Rpb24gcihlLHQpe3ZhciByLG4sbyxzLGE9e2xhYmVsOjAsc2VudDpmdW5jdGlvbigpe2lmKDEmb1swXSl0aHJvdyBvWzFdO3JldHVybiBvWzFdfSx0cnlzOltdLG9wczpbXX07cmV0dXJuIHM9e25leHQ6aSgwKSx0aHJvdzppKDEpLHJldHVybjppKDIpfSwiZnVuY3Rpb24iPT10eXBlb2YgU3ltYm9sJiYoc1tTeW1ib2wuaXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9KSxzO2Z1bmN0aW9uIGkocyl7cmV0dXJuIGZ1bmN0aW9uKGkpe3JldHVybiBmdW5jdGlvbihzKXtpZihyKXRocm93IG5ldyBUeXBlRXJyb3IoIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy4iKTtmb3IoO2E7KXRyeXtpZihyPTEsbiYmKG89MiZzWzBdP24ucmV0dXJuOnNbMF0/bi50aHJvd3x8KChvPW4ucmV0dXJuKSYmby5jYWxsKG4pLDApOm4ubmV4dCkmJiEobz1vLmNhbGwobixzWzFdKSkuZG9uZSlyZXR1cm4gbztzd2l0Y2gobj0wLG8mJihzPVsyJnNbMF0sby52YWx1ZV0pLHNbMF0pe2Nhc2UgMDpjYXNlIDE6bz1zO2JyZWFrO2Nhc2UgNDpyZXR1cm4gYS5sYWJlbCsrLHt2YWx1ZTpzWzFdLGRvbmU6ITF9O2Nhc2UgNTphLmxhYmVsKyssbj1zWzFdLHM9WzBdO2NvbnRpbnVlO2Nhc2UgNzpzPWEub3BzLnBvcCgpLGEudHJ5cy5wb3AoKTtjb250aW51ZTtkZWZhdWx0OmlmKCEobz1hLnRyeXMsKG89by5sZW5ndGg+MCYmb1tvLmxlbmd0aC0xXSl8fDYhPT1zWzBdJiYyIT09c1swXSkpe2E9MDtjb250aW51ZX1pZigzPT09c1swXSYmKCFvfHxzWzFdPm9bMF0mJnNbMV08b1szXSkpe2EubGFiZWw9c1sxXTticmVha31pZig2PT09c1swXSYmYS5sYWJlbDxvWzFdKXthLmxhYmVsPW9bMV0sbz1zO2JyZWFrfWlmKG8mJmEubGFiZWw8b1syXSl7YS5sYWJlbD1vWzJdLGEub3BzLnB1c2gocyk7YnJlYWt9b1syXSYmYS5vcHMucG9wKCksYS50cnlzLnBvcCgpO2NvbnRpbnVlfXM9dC5jYWxsKGUsYSl9Y2F0Y2goZSl7cz1bNixlXSxuPTB9ZmluYWxseXtyPW89MH1pZig1JnNbMF0pdGhyb3cgc1sxXTtyZXR1cm57dmFsdWU6c1swXT9zWzFdOnZvaWQgMCxkb25lOiEwfX0oW3MsaV0pfX19dmFyIG49e30sbz1mdW5jdGlvbihlLHQpe3JldHVybiBlKyJ8Iit0fTthZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwoZnVuY3Rpb24ocyl7dmFyIGE9cy5kYXRhLGk9YS50aW1lb3V0LHU9YS5hdXRoLGM9YS5mZXRjaFVybCxmPWEuZmV0Y2hPcHRpb25zLGw9cy5wb3J0c1swXTtyZXR1cm4gdCh2b2lkIDAsdm9pZCAwLHZvaWQgMCwoZnVuY3Rpb24oKXt2YXIgdCxzLGEsaCxwLGIseSxkLHYsdztyZXR1cm4gcih0aGlzLChmdW5jdGlvbihyKXtzd2l0Y2goci5sYWJlbCl7Y2FzZSAwOmE9KHM9dXx8e30pLmF1ZGllbmNlLGg9cy5zY29wZSxyLmxhYmVsPTE7Y2FzZSAxOmlmKHIudHJ5cy5wdXNoKFsxLDcsLDhdKSwhKHA9SlNPTi5wYXJzZShmLmJvZHkpKS5yZWZyZXNoX3Rva2VuJiYicmVmcmVzaF90b2tlbiI9PT1wLmdyYW50X3R5cGUpe2lmKCEoYj1mdW5jdGlvbihlLHQpe3JldHVybiBuW28oZSx0KV19KGEsaCkpKXRocm93IG5ldyBFcnJvcigiVGhlIHdlYiB3b3JrZXIgaXMgbWlzc2luZyB0aGUgcmVmcmVzaCB0b2tlbiIpO2YuYm9keT1KU09OLnN0cmluZ2lmeShlKGUoe30scCkse3JlZnJlc2hfdG9rZW46Yn0pKX15PXZvaWQgMCwiZnVuY3Rpb24iPT10eXBlb2YgQWJvcnRDb250cm9sbGVyJiYoeT1uZXcgQWJvcnRDb250cm9sbGVyLGYuc2lnbmFsPXkuc2lnbmFsKSxkPXZvaWQgMCxyLmxhYmVsPTI7Y2FzZSAyOnJldHVybiByLnRyeXMucHVzaChbMiw0LCw1XSksWzQsUHJvbWlzZS5yYWNlKFsoZz1pLG5ldyBQcm9taXNlKChmdW5jdGlvbihlKXtyZXR1cm4gc2V0VGltZW91dChlLGcpfSkpKSxmZXRjaChjLGUoe30sZikpXSldO2Nhc2UgMzpyZXR1cm4gZD1yLnNlbnQoKSxbMyw1XTtjYXNlIDQ6cmV0dXJuIHY9ci5zZW50KCksbC5wb3N0TWVzc2FnZSh7ZXJyb3I6di5tZXNzYWdlfSksWzJdO2Nhc2UgNTpyZXR1cm4gZD9bNCxkLmpzb24oKV06KHkmJnkuYWJvcnQoKSxsLnBvc3RNZXNzYWdlKHtlcnJvcjoiVGltZW91dCB3aGVuIGV4ZWN1dGluZyAnZmV0Y2gnIn0pLFsyXSk7Y2FzZSA2OnJldHVybih0PXIuc2VudCgpKS5yZWZyZXNoX3Rva2VuPyhmdW5jdGlvbihlLHQscil7bltvKHQscildPWV9KHQucmVmcmVzaF90b2tlbixhLGgpLGRlbGV0ZSB0LnJlZnJlc2hfdG9rZW4pOmZ1bmN0aW9uKGUsdCl7ZGVsZXRlIG5bbyhlLHQpXX0oYSxoKSxsLnBvc3RNZXNzYWdlKHtvazpkLm9rLGpzb246dH0pLFszLDhdO2Nhc2UgNzpyZXR1cm4gdz1yLnNlbnQoKSxsLnBvc3RNZXNzYWdlKHtvazohMSxqc29uOntlcnJvcl9kZXNjcmlwdGlvbjp3Lm1lc3NhZ2V9fSksWzMsOF07Y2FzZSA4OnJldHVyblsyXX12YXIgZ30pKX0pKX0pKX0oKTsKCg=='),
    ($i = null),
    (ec = !1),
    function (e) {
      return (tc = tc || qi(Qi, $i, ec)), new Worker(tc, e);
    }),
  rc = {},
  oc = new Eo(),
  ic = {
    memory: function () {
      return new ti().enclosedCache;
    },
    localstorage: function () {
      return new ei();
    }
  },
  cc = function (e) {
    return ic[e];
  },
  sc = function () {
    return !/Trident.*rv:11\.0/.test(navigator.userAgent);
  },
  ac = (function () {
    function e(e) {
      var t, n;
      if (
        ((this.options = e),
        'undefined' != typeof window &&
          (function () {
            if (!Ao())
              throw new Error(
                'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
              );
            if (void 0 === Uo())
              throw new Error(
                '\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    '
              );
          })(),
        (this.cacheLocation = e.cacheLocation || 'memory'),
        (this.cookieStorage = !1 === e.legacySameSiteCookie ? li : fi),
        (this.sessionCheckExpiryDays = e.sessionCheckExpiryDays || 1),
        !cc(this.cacheLocation))
      )
        throw new Error('Invalid cache location "' + this.cacheLocation + '"');
      var o,
        i,
        c = e.useCookiesForTransactions ? this.cookieStorage : di;
      (this.cache = cc(this.cacheLocation)()),
        (this.scope = this.options.scope),
        (this.transactionManager = new ni(c)),
        (this.domainUrl = 'https://' + this.options.domain),
        (this.tokenIssuer =
          ((o = this.options.issuer),
          (i = this.domainUrl),
          o ? (o.startsWith('https://') ? o : 'https://' + o + '/') : i + '/')),
        (this.defaultScope = Mo(
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
          (this.scope = Mo(this.scope, 'offline_access')),
        'undefined' != typeof window &&
          window.Worker &&
          this.options.useRefreshTokens &&
          'memory' === this.cacheLocation &&
          sc() &&
          (this.worker = new nc()),
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
          btoa(JSON.stringify(this.options.auth0Client || To))
        );
        return '' + this.domainUrl + e + '&auth0Client=' + t;
      }),
      (e.prototype._getParams = function (e, t, o, i, c) {
        var s = this.options;
        s.domain,
          s.leeway,
          s.useRefreshTokens,
          s.useCookiesForTransactions,
          s.auth0Client,
          s.cacheLocation,
          s.advancedOptions;
        var a = r(s, [
          'domain',
          'leeway',
          'useRefreshTokens',
          'useCookiesForTransactions',
          'auth0Client',
          'cacheLocation',
          'advancedOptions'
        ]);
        return n(n(n({}, a), e), {
          scope: Mo(this.defaultScope, this.scope, e.scope),
          response_type: 'code',
          response_mode: 'query',
          state: t,
          nonce: o,
          redirect_uri: c || this.options.redirect_uri,
          code_challenge: i,
          code_challenge_method: 'S256'
        });
      }),
      (e.prototype._authorizeUrl = function (e) {
        return this._url('/authorize?' + Wo(e));
      }),
      (e.prototype._verifyIdToken = function (e, t, n) {
        return ii({
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
            var t, o, c, s, a, u, l, f, d, p, h, y;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (
                    (t = e.redirect_uri),
                    (o = e.appState),
                    (c = r(e, ['redirect_uri', 'appState'])),
                    (s = Ko(Fo())),
                    (a = Ko(Fo())),
                    (u = Fo()),
                    [4, No(u)]
                  );
                case 1:
                  return (
                    (l = i.sent()),
                    (f = Vo(l)),
                    (d = e.fragment ? '#' + e.fragment : ''),
                    (p = this._getParams(c, s, a, f, t)),
                    (h = this._authorizeUrl(p)),
                    (y = e.organization || this.options.organization),
                    this.transactionManager.create(
                      n(
                        {
                          nonce: a,
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
          var o, c, s, a, u, l, f, d, p, h, y, v, b;
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
                  (c = Ko(Fo())),
                  (s = Ko(Fo())),
                  (a = Fo()),
                  [4, No(a)]
                );
              case 1:
                return (
                  (u = i.sent()),
                  (l = Vo(u)),
                  (f = this._getParams(
                    o,
                    c,
                    s,
                    l,
                    this.options.redirect_uri || window.location.origin
                  )),
                  (d = this._authorizeUrl(
                    n(n({}, f), { response_mode: 'web_message' })
                  )),
                  (t.popup.location.href = d),
                  [
                    4,
                    Co(
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
                if (((p = i.sent()), c !== p.state))
                  throw new Error('Invalid state');
                return [
                  4,
                  Yo(
                    {
                      audience: f.audience,
                      scope: f.scope,
                      baseUrl: this.domainUrl,
                      client_id: this.options.client_id,
                      code_verifier: a,
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
                  (v = this._verifyIdToken(h.id_token, s, y)),
                  (b = n(n({}, h), {
                    decodedToken: v,
                    scope: f.scope,
                    audience: f.audience || 'default',
                    client_id: this.options.client_id
                  })),
                  this.cache.save(b),
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
                (n = Mo(this.defaultScope, this.scope, e.scope)),
                [
                  2,
                  (r = this.cache.get(
                    new Ho({
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
                (n = Mo(this.defaultScope, this.scope, e.scope)),
                [
                  2,
                  (r = this.cache.get(
                    new Ho({
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
            var t, n, o, c, s, a;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (
                    (t = e.redirectMethod),
                    (n = e.platform),
                    (o = void 0 === n ? 'web' : n),
                    (c = r(e, ['redirectMethod', 'platform'])),
                    [4, this.buildAuthorizeUrl(c)]
                  );
                case 1:
                  return (
                    (s = i.sent()),
                    (a = c.redirect_uri || this.options.redirect_uri),
                    console.log({
                      platform: o,
                      redirect_uri: a,
                      urlOptions: c,
                      url: s.replace(/^https?:\/\//, '')
                    }),
                    'web' === o
                      ? (window.location[t || 'assign'](s), [2])
                      : 'ios' === o
                      ? [2, Hi.start(a.split('://')[0], s)]
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
            var t, r, o, c, s, a, u, l, f, d, p;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  if (0 === (t = e.split('?').slice(1)).length)
                    throw new Error(
                      'There are no query params available for parsing.'
                    );
                  if (
                    ((r = (function (e) {
                      e.indexOf('#') > -1 && (e = e.substr(0, e.indexOf('#')));
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
                    (c = r.code),
                    (s = r.error),
                    (a = r.error_description),
                    !(u = this.transactionManager.get()) || !u.code_verifier)
                  )
                    throw new Error('Invalid state');
                  if ((this.transactionManager.remove(), s))
                    throw new Ro(s, a, o, u.appState);
                  return (
                    (l = {
                      audience: u.audience,
                      scope: u.scope,
                      baseUrl: this.domainUrl,
                      client_id: this.options.client_id,
                      code_verifier: u.code_verifier,
                      grant_type: 'authorization_code',
                      code: c,
                      auth0Client: this.options.auth0Client
                    }),
                    void 0 !== u.redirect_uri &&
                      (l.redirect_uri = u.redirect_uri),
                    [4, Yo(l, this.worker)]
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
                return n.trys.push([1, 3, , 4]), [4, this.getTokenSilently(e)];
              case 2:
                return n.sent(), [3, 4];
              case 3:
                if (((t = n.sent()), !Oo.includes(t.error))) throw t;
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
              c,
              s = this;
            return i(this, function (i) {
              return (
                (t = n(
                  n({ audience: this.options.audience, ignoreCache: !1 }, e),
                  { scope: Mo(this.defaultScope, this.scope, e.scope) }
                )),
                (o = t.ignoreCache),
                (c = r(t, ['ignoreCache'])),
                [
                  2,
                  ((a = function () {
                    return s._getTokenSilently(n({ ignoreCache: o }, c));
                  }),
                  (u =
                    this.options.client_id +
                    '::' +
                    c.audience +
                    '::' +
                    c.scope),
                  (l = rc[u]),
                  l ||
                    ((l = a().finally(function () {
                      delete rc[u], (l = null);
                    })),
                    (rc[u] = l)),
                  l)
                ]
              );
              var a, u, l;
            });
          })
        );
      }),
      (e.prototype._getTokenSilently = function (e) {
        return (
          void 0 === e && (e = {}),
          o(this, void 0, void 0, function () {
            var t,
              c,
              s,
              a,
              u,
              l,
              f = this;
            return i(this, function (d) {
              switch (d.label) {
                case 0:
                  return (
                    (t = e.ignoreCache),
                    (c = r(e, ['ignoreCache'])),
                    (s = function () {
                      var e = f.cache.get(
                        new Ho({
                          scope: c.scope,
                          audience: c.audience || 'default',
                          client_id: f.options.client_id
                        }),
                        60
                      );
                      return e && e.access_token;
                    }),
                    !t && (a = s())
                      ? [2, a]
                      : [
                          4,
                          ((p = function () {
                            return oc.acquireLock(
                              'auth0.lock.getTokenSilently',
                              5e3
                            );
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
                    !t && (a = s())
                      ? [2, a]
                      : this.options.useRefreshTokens
                      ? [4, this._getTokenUsingRefreshToken(c)]
                      : [3, 4]
                  );
                case 3:
                  return (l = d.sent()), [3, 6];
                case 4:
                  return [4, this._getTokenFromIFrame(c)];
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
                  return [4, oc.releaseLock('auth0.lock.getTokenSilently')];
                case 8:
                  return d.sent(), [7];
                case 9:
                  return [3, 11];
                case 10:
                  throw new Lo();
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
                    (e.scope = Mo(this.defaultScope, this.scope, e.scope)),
                    (t = n(n({}, Io), t)),
                    [4, this.loginWithPopup(e, t)]
                  );
                case 1:
                  return (
                    r.sent(),
                    [
                      2,
                      this.cache.get(
                        new Ho({
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
        return this._url('/v2/logout?' + Wo(n)) + o;
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
          var t, o, c, s, a, u, l, f, d, p, h, y, v, b, g;
          return i(this, function (i) {
            switch (i.label) {
              case 0:
                return (t = Ko(Fo())), (o = Ko(Fo())), (c = Fo()), [4, No(c)];
              case 1:
                (s = i.sent()),
                  (a = Vo(s)),
                  (u = this._getParams(
                    e,
                    t,
                    o,
                    a,
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
                    ((m = l),
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
                          t(new Lo()), o();
                        }, 1e3 * S);
                      (r = function (n) {
                        if (
                          n.origin == w &&
                          n.data &&
                          'authorization_response' === n.data.type
                        ) {
                          var c = n.source;
                          c && c.close(),
                            n.data.response.error
                              ? t(xo.fromPayload(n.data.response))
                              : e(n.data.response),
                            clearTimeout(i),
                            window.removeEventListener('message', r, !1),
                            setTimeout(o, 2e3);
                        }
                      }),
                        window.addEventListener('message', r, !1),
                        window.document.body.appendChild(n),
                        n.setAttribute('src', m);
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
                    Yo(
                      n(n(n({}, this.customOptions), y), {
                        scope: p,
                        audience: h,
                        baseUrl: this.domainUrl,
                        client_id: this.options.client_id,
                        code_verifier: c,
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
                  (b = this._verifyIdToken(v.id_token, o)),
                  [
                    2,
                    n(n({}, v), {
                      decodedToken: b,
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
            var m, w, S;
          });
        });
      }),
      (e.prototype._getTokenUsingRefreshToken = function (e) {
        return o(this, void 0, void 0, function () {
          var t, o, c, s, a, u, l, f, d;
          return i(this, function (i) {
            switch (i.label) {
              case 0:
                return (
                  (e.scope = Mo(
                    this.defaultScope,
                    this.options.scope,
                    e.scope
                  )),
                  ((t = this.cache.get(
                    new Ho({
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
                  (s = e.scope),
                  (a = e.audience),
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
                    Yo(
                      n(
                        n(
                          n(n(n({}, this.customOptions), u), {
                            audience: a,
                            scope: s,
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
                return (c = i.sent()), [3, 8];
              case 5:
                return 'The web worker is missing the refresh token' ===
                  (f = i.sent()).message ||
                  (f.message && f.message.indexOf('invalid refresh token') > -1)
                  ? [4, this._getTokenFromIFrame(e)]
                  : [3, 7];
              case 6:
                return [2, i.sent()];
              case 7:
                throw f;
              case 8:
                return (
                  (d = this._verifyIdToken(c.id_token)),
                  [
                    2,
                    n(n({}, c), {
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
  })(),
  uc = function () {};
function lc(e) {
  return o(this, void 0, void 0, function () {
    var t;
    return i(this, function (n) {
      switch (n.label) {
        case 0:
          return [4, (t = new ac(e)).checkSession()];
        case 1:
          return n.sent(), [2, t];
      }
    });
  });
}
export default lc;
export {
  ac as Auth0Client,
  Ro as AuthenticationError,
  xo as GenericError,
  jo as PopupCancelledError,
  Po as PopupTimeoutError,
  Lo as TimeoutError,
  uc as User
};
//# sourceMappingURL=auth0-spa-js.production.esm.js.map
