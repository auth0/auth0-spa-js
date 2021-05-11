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
    return e &&
      e.__esModule &&
      Object.prototype.hasOwnProperty.call(e, 'default')
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
    E = function (e) {
      return 'object' == typeof e ? null !== e : 'function' == typeof e;
    },
    k = function (e, t) {
      if (!E(e)) return e;
      var n, r;
      if (t && 'function' == typeof (n = e.toString) && !E((r = n.call(e))))
        return r;
      if ('function' == typeof (n = e.valueOf) && !E((r = n.call(e)))) return r;
      if (!t && 'function' == typeof (n = e.toString) && !E((r = n.call(e))))
        return r;
      throw TypeError("Can't convert object to primitive value");
    },
    I = function (e) {
      return Object(S(e));
    },
    T = {}.hasOwnProperty,
    O = function (e, t) {
      return T.call(I(e), t);
    },
    x = l.document,
    R = E(x) && E(x.createElement),
    C = function (e) {
      return R ? x.createElement(e) : {};
    },
    L =
      !d &&
      !f(function () {
        return (
          7 !=
          Object.defineProperty(C('div'), 'a', {
            get: function () {
              return 7;
            }
          }).a
        );
      }),
    P = Object.getOwnPropertyDescriptor,
    A = {
      f: d
        ? P
        : function (e, t) {
            if (((e = _(e)), (t = k(t, !0)), L))
              try {
                return P(e, t);
              } catch (e) {}
            if (O(e, t)) return v(!y.f.call(e, t), e[t]);
          }
    },
    j = function (e) {
      if (!E(e)) throw TypeError(String(e) + ' is not an object');
      return e;
    },
    U = Object.defineProperty,
    F = {
      f: d
        ? U
        : function (e, t, n) {
            if ((j(e), (t = k(t, !0)), j(n), L))
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
    N = '__core-js_shared__',
    z = l[N] || W(N, {}),
    V = Function.toString;
  'function' != typeof z.inspectSource &&
    (z.inspectSource = function (e) {
      return V.call(e);
    });
  var Z,
    X,
    D,
    G = z.inspectSource,
    J = l.WeakMap,
    Y = 'function' == typeof J && /native code/.test(G(J)),
    B = a(function (e) {
      (e.exports = function (e, t) {
        return z[e] || (z[e] = void 0 !== t ? t : {});
      })('versions', []).push({
        version: '3.12.0',
        mode: 'global',
        copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
      });
    }),
    M = 0,
    H = Math.random(),
    q = function (e) {
      return (
        'Symbol(' +
        String(void 0 === e ? '' : e) +
        ')_' +
        (++M + H).toString(36)
      );
    },
    Q = B('keys'),
    $ = function (e) {
      return Q[e] || (Q[e] = q(e));
    },
    ee = {},
    te = 'Object already initialized',
    ne = l.WeakMap;
  if (Y) {
    var re = z.state || (z.state = new ne()),
      oe = re.get,
      ie = re.has,
      ce = re.set;
    (Z = function (e, t) {
      if (ie.call(re, e)) throw new TypeError(te);
      return (t.facade = e), ce.call(re, e, t), t;
    }),
      (X = function (e) {
        return oe.call(re, e) || {};
      }),
      (D = function (e) {
        return ie.call(re, e);
      });
  } else {
    var se = $('state');
    (ee[se] = !0),
      (Z = function (e, t) {
        if (O(e, se)) throw new TypeError(te);
        return (t.facade = e), K(e, se, t), t;
      }),
      (X = function (e) {
        return O(e, se) ? e[se] : {};
      }),
      (D = function (e) {
        return O(e, se);
      });
  }
  var ae,
    ue,
    le = {
      set: Z,
      get: X,
      has: D,
      enforce: function (e) {
        return D(e) ? X(e) : Z(e, {});
      },
      getterFor: function (e) {
        return function (t) {
          var n;
          if (!E(t) || (n = X(t)).type !== e)
            throw TypeError('Incompatible receiver, ' + e + ' required');
          return n;
        };
      }
    },
    fe = a(function (e) {
      var t = le.get,
        n = le.enforce,
        r = String(String).split('String');
      (e.exports = function (e, t, o, i) {
        var c,
          s = !!i && !!i.unsafe,
          a = !!i && !!i.enumerable,
          u = !!i && !!i.noTargetGet;
        'function' == typeof o &&
          ('string' != typeof t || O(o, 'name') || K(o, 'name', t),
          (c = n(o)).source ||
            (c.source = r.join('string' == typeof t ? t : ''))),
          e !== l
            ? (s ? !u && e[t] && (a = !0) : delete e[t],
              a ? (e[t] = o) : K(e, t, o))
            : a
            ? (e[t] = o)
            : W(t, o);
      })(Function.prototype, 'toString', function () {
        return ('function' == typeof this && t(this).source) || G(this);
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
    be = function (e) {
      return isNaN((e = +e)) ? 0 : (e > 0 ? ve : ye)(e);
    },
    ge = Math.min,
    me = function (e) {
      return e > 0 ? ge(be(e), 9007199254740991) : 0;
    },
    we = Math.max,
    Se = Math.min,
    _e = function (e) {
      return function (t, n, r) {
        var o,
          i = _(t),
          c = me(i.length),
          s = (function (e, t) {
            var n = be(e);
            return n < 0 ? we(n + t, 0) : Se(n, t);
          })(r, c);
        if (e && n != n) {
          for (; c > s; ) if ((o = i[s++]) != o) return !0;
        } else
          for (; c > s; s++)
            if ((e || s in i) && i[s] === n) return e || s || 0;
        return !e && -1;
      };
    },
    Ee = { includes: _e(!0), indexOf: _e(!1) },
    ke = Ee.indexOf,
    Ie = function (e, t) {
      var n,
        r = _(e),
        o = 0,
        i = [];
      for (n in r) !O(ee, n) && O(r, n) && i.push(n);
      for (; t.length > o; ) O(r, (n = t[o++])) && (~ke(i, n) || i.push(n));
      return i;
    },
    Te = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf'
    ],
    Oe = Te.concat('length', 'prototype'),
    xe = {
      f:
        Object.getOwnPropertyNames ||
        function (e) {
          return Ie(e, Oe);
        }
    },
    Re = { f: Object.getOwnPropertySymbols },
    Ce =
      he('Reflect', 'ownKeys') ||
      function (e) {
        var t = xe.f(j(e)),
          n = Re.f;
        return n ? t.concat(n(e)) : t;
      },
    Le = function (e, t) {
      for (var n = Ce(t), r = F.f, o = A.f, i = 0; i < n.length; i++) {
        var c = n[i];
        O(e, c) || r(e, c, o(t, c));
      }
    },
    Pe = /#|\.prototype\./,
    Ae = function (e, t) {
      var n = Ue[je(e)];
      return n == Ke || (n != Fe && ('function' == typeof t ? f(t) : !!t));
    },
    je = (Ae.normalize = function (e) {
      return String(e).replace(Pe, '.').toLowerCase();
    }),
    Ue = (Ae.data = {}),
    Fe = (Ae.NATIVE = 'N'),
    Ke = (Ae.POLYFILL = 'P'),
    We = Ae,
    Ne = A.f,
    ze = function (e, t) {
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
            (o = e.noTargetGet ? (c = Ne(n, r)) && c.value : n[r]),
            !We(a ? r : s + (u ? '.' : '#') + r, e.forced) && void 0 !== o)
          ) {
            if (typeof i == typeof o) continue;
            Le(i, o);
          }
          (e.sham || (o && o.sham)) && K(i, 'sham', !0), fe(n, r, i, e);
        }
    },
    Ve = he('navigator', 'userAgent') || '',
    Ze = l.process,
    Xe = Ze && Ze.versions,
    De = Xe && Xe.v8;
  De
    ? (ue = (ae = De.split('.'))[0] < 4 ? 1 : ae[0] + ae[1])
    : Ve &&
      (!(ae = Ve.match(/Edge\/(\d+)/)) || ae[1] >= 74) &&
      (ae = Ve.match(/Chrome\/(\d+)/)) &&
      (ue = ae[1]);
  var Ge,
    Je = ue && +ue,
    Ye =
      !!Object.getOwnPropertySymbols &&
      !f(function () {
        return !String(Symbol()) || (!Symbol.sham && Je && Je < 41);
      }),
    Be = Ye && !Symbol.sham && 'symbol' == typeof Symbol.iterator,
    Me = B('wks'),
    He = l.Symbol,
    qe = Be ? He : (He && He.withoutSetter) || q,
    Qe = function (e) {
      return (
        (O(Me, e) && (Ye || 'string' == typeof Me[e])) ||
          (Ye && O(He, e) ? (Me[e] = He[e]) : (Me[e] = qe('Symbol.' + e))),
        Me[e]
      );
    },
    $e = Qe('match'),
    et = function (e) {
      if (
        (function (e) {
          var t;
          return E(e) && (void 0 !== (t = e[$e]) ? !!t : 'RegExp' == g(e));
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
    rt = A.f,
    ot = ''.startsWith,
    it = Math.min,
    ct = nt('startsWith'),
    st = !(
      ct || ((Ge = rt(String.prototype, 'startsWith')), !Ge || Ge.writable)
    );
  ze(
    { target: 'String', proto: !0, forced: !st && !ct },
    {
      startsWith: function (e) {
        var t = String(S(this));
        et(e);
        var n = me(it(arguments.length > 1 ? arguments[1] : void 0, t.length)),
          r = String(e);
        return ot ? ot.call(t, r, n) : t.slice(n, n + r.length) === r;
      }
    }
  );
  var at = function (e) {
      if ('function' != typeof e)
        throw TypeError(String(e) + ' is not a function');
      return e;
    },
    ut = function (e, t, n) {
      if ((at(e), void 0 === t)) return e;
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
      var r = k(t);
      r in e ? F.f(e, r, v(0, n)) : (e[r] = n);
    },
    ht = Qe('species'),
    yt = function (e, t) {
      var n;
      return (
        dt(e) &&
          ('function' != typeof (n = e.constructor) ||
          (n !== Array && !dt(n.prototype))
            ? E(n) && null === (n = n[ht]) && (n = void 0)
            : (n = void 0)),
        new (void 0 === n ? Array : n)(0 === t ? 0 : t)
      );
    },
    vt = Qe('species'),
    bt = Qe('isConcatSpreadable'),
    gt = 9007199254740991,
    mt = 'Maximum allowed index exceeded',
    wt =
      Je >= 51 ||
      !f(function () {
        var e = [];
        return (e[bt] = !1), e.concat()[0] !== e;
      }),
    St = (function (e) {
      return (
        Je >= 51 ||
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
      if (!E(e)) return !1;
      var t = e[bt];
      return void 0 !== t ? !!t : dt(e);
    };
  ze(
    { target: 'Array', proto: !0, forced: !wt || !St },
    {
      concat: function (e) {
        var t,
          n,
          r,
          o,
          i,
          c = I(this),
          s = yt(c, 0),
          a = 0;
        for (t = -1, r = arguments.length; t < r; t++)
          if (_t((i = -1 === t ? c : arguments[t]))) {
            if (a + (o = me(i.length)) > gt) throw TypeError(mt);
            for (n = 0; n < o; n++, a++) n in i && pt(s, a, i[n]);
          } else {
            if (a >= gt) throw TypeError(mt);
            pt(s, a++, i);
          }
        return (s.length = a), s;
      }
    }
  );
  var Et = {};
  Et[Qe('toStringTag')] = 'z';
  var kt = '[object z]' === String(Et),
    It = Qe('toStringTag'),
    Tt =
      'Arguments' ==
      g(
        (function () {
          return arguments;
        })()
      ),
    Ot = kt
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
              })((t = Object(e)), It))
            ? n
            : Tt
            ? g(t)
            : 'Object' == (r = g(t)) && 'function' == typeof t.callee
            ? 'Arguments'
            : r;
        },
    xt = kt
      ? {}.toString
      : function () {
          return '[object ' + Ot(this) + ']';
        };
  kt || fe(Object.prototype, 'toString', xt, { unsafe: !0 });
  var Rt,
    Ct =
      Object.keys ||
      function (e) {
        return Ie(e, Te);
      },
    Lt = d
      ? Object.defineProperties
      : function (e, t) {
          j(e);
          for (var n, r = Ct(t), o = r.length, i = 0; o > i; )
            F.f(e, (n = r[i++]), t[n]);
          return e;
        },
    Pt = he('document', 'documentElement'),
    At = $('IE_PROTO'),
    jt = function () {},
    Ut = function (e) {
      return '<script>' + e + '</' + 'script>';
    },
    Ft = function () {
      try {
        Rt = document.domain && new ActiveXObject('htmlfile');
      } catch (e) {}
      var e, t;
      Ft = Rt
        ? (function (e) {
            e.write(Ut('')), e.close();
            var t = e.parentWindow.Object;
            return (e = null), t;
          })(Rt)
        : (((t = C('iframe')).style.display = 'none'),
          Pt.appendChild(t),
          (t.src = String('javascript:')),
          (e = t.contentWindow.document).open(),
          e.write(Ut('document.F=Object')),
          e.close(),
          e.F);
      for (var n = Te.length; n--; ) delete Ft.prototype[Te[n]];
      return Ft();
    };
  ee[At] = !0;
  var Kt =
      Object.create ||
      function (e, t) {
        var n;
        return (
          null !== e
            ? ((jt.prototype = j(e)),
              (n = new jt()),
              (jt.prototype = null),
              (n[At] = e))
            : (n = Ft()),
          void 0 === t ? n : Lt(n, t)
        );
      },
    Wt = xe.f,
    Nt = {}.toString,
    zt =
      'object' == typeof window && window && Object.getOwnPropertyNames
        ? Object.getOwnPropertyNames(window)
        : [],
    Vt = {
      f: function (e) {
        return zt && '[object Window]' == Nt.call(e)
          ? (function (e) {
              try {
                return Wt(e);
              } catch (e) {
                return zt.slice();
              }
            })(e)
          : Wt(_(e));
      }
    },
    Zt = { f: Qe },
    Xt = F.f,
    Dt = function (e) {
      var t = de.Symbol || (de.Symbol = {});
      O(t, e) || Xt(t, e, { value: Zt.f(e) });
    },
    Gt = F.f,
    Jt = Qe('toStringTag'),
    Yt = function (e, t, n) {
      e &&
        !O((e = n ? e : e.prototype), Jt) &&
        Gt(e, Jt, { configurable: !0, value: t });
    },
    Bt = [].push,
    Mt = function (e) {
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
            v = ut(u, l, 3),
            b = me(y.length),
            g = 0,
            m = f || yt,
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
    Ht = {
      forEach: Mt(0),
      map: Mt(1),
      filter: Mt(2),
      some: Mt(3),
      every: Mt(4),
      find: Mt(5),
      findIndex: Mt(6),
      filterOut: Mt(7)
    }.forEach,
    qt = $('hidden'),
    Qt = 'Symbol',
    $t = Qe('toPrimitive'),
    en = le.set,
    tn = le.getterFor(Qt),
    nn = Object.prototype,
    rn = l.Symbol,
    on = he('JSON', 'stringify'),
    cn = A.f,
    sn = F.f,
    an = Vt.f,
    un = y.f,
    ln = B('symbols'),
    fn = B('op-symbols'),
    dn = B('string-to-symbol-registry'),
    pn = B('symbol-to-string-registry'),
    hn = B('wks'),
    yn = l.QObject,
    vn = !yn || !yn.prototype || !yn.prototype.findChild,
    bn =
      d &&
      f(function () {
        return (
          7 !=
          Kt(
            sn({}, 'a', {
              get: function () {
                return sn(this, 'a', { value: 7 }).a;
              }
            })
          ).a
        );
      })
        ? function (e, t, n) {
            var r = cn(nn, t);
            r && delete nn[t], sn(e, t, n), r && e !== nn && sn(nn, t, r);
          }
        : sn,
    gn = function (e, t) {
      var n = (ln[e] = Kt(rn.prototype));
      return (
        en(n, { type: Qt, tag: e, description: t }), d || (n.description = t), n
      );
    },
    mn = Be
      ? function (e) {
          return 'symbol' == typeof e;
        }
      : function (e) {
          return Object(e) instanceof rn;
        },
    wn = function (e, t, n) {
      e === nn && wn(fn, t, n), j(e);
      var r = k(t, !0);
      return (
        j(n),
        O(ln, r)
          ? (n.enumerable
              ? (O(e, qt) && e[qt][r] && (e[qt][r] = !1),
                (n = Kt(n, { enumerable: v(0, !1) })))
              : (O(e, qt) || sn(e, qt, v(1, {})), (e[qt][r] = !0)),
            bn(e, r, n))
          : sn(e, r, n)
      );
    },
    Sn = function (e, t) {
      j(e);
      var n = _(t),
        r = Ct(n).concat(In(n));
      return (
        Ht(r, function (t) {
          (d && !_n.call(n, t)) || wn(e, t, n[t]);
        }),
        e
      );
    },
    _n = function (e) {
      var t = k(e, !0),
        n = un.call(this, t);
      return (
        !(this === nn && O(ln, t) && !O(fn, t)) &&
        (!(n || !O(this, t) || !O(ln, t) || (O(this, qt) && this[qt][t])) || n)
      );
    },
    En = function (e, t) {
      var n = _(e),
        r = k(t, !0);
      if (n !== nn || !O(ln, r) || O(fn, r)) {
        var o = cn(n, r);
        return (
          !o || !O(ln, r) || (O(n, qt) && n[qt][r]) || (o.enumerable = !0), o
        );
      }
    },
    kn = function (e) {
      var t = an(_(e)),
        n = [];
      return (
        Ht(t, function (e) {
          O(ln, e) || O(ee, e) || n.push(e);
        }),
        n
      );
    },
    In = function (e) {
      var t = e === nn,
        n = an(t ? fn : _(e)),
        r = [];
      return (
        Ht(n, function (e) {
          !O(ln, e) || (t && !O(nn, e)) || r.push(ln[e]);
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
            t = q(e),
            n = function (e) {
              this === nn && n.call(fn, e),
                O(this, qt) && O(this[qt], t) && (this[qt][t] = !1),
                bn(this, t, v(1, e));
            };
          return d && vn && bn(nn, t, { configurable: !0, set: n }), gn(t, e);
        }).prototype,
        'toString',
        function () {
          return tn(this).tag;
        }
      ),
      fe(rn, 'withoutSetter', function (e) {
        return gn(q(e), e);
      }),
      (y.f = _n),
      (F.f = wn),
      (A.f = En),
      (xe.f = Vt.f = kn),
      (Re.f = In),
      (Zt.f = function (e) {
        return gn(Qe(e), e);
      }),
      d &&
        (sn(rn.prototype, 'description', {
          configurable: !0,
          get: function () {
            return tn(this).description;
          }
        }),
        fe(nn, 'propertyIsEnumerable', _n, { unsafe: !0 }))),
    ze({ global: !0, wrap: !0, forced: !Ye, sham: !Ye }, { Symbol: rn }),
    Ht(Ct(hn), function (e) {
      Dt(e);
    }),
    ze(
      { target: Qt, stat: !0, forced: !Ye },
      {
        for: function (e) {
          var t = String(e);
          if (O(dn, t)) return dn[t];
          var n = rn(t);
          return (dn[t] = n), (pn[n] = t), n;
        },
        keyFor: function (e) {
          if (!mn(e)) throw TypeError(e + ' is not a symbol');
          if (O(pn, e)) return pn[e];
        },
        useSetter: function () {
          vn = !0;
        },
        useSimple: function () {
          vn = !1;
        }
      }
    ),
    ze(
      { target: 'Object', stat: !0, forced: !Ye, sham: !d },
      {
        create: function (e, t) {
          return void 0 === t ? Kt(e) : Sn(Kt(e), t);
        },
        defineProperty: wn,
        defineProperties: Sn,
        getOwnPropertyDescriptor: En
      }
    ),
    ze(
      { target: 'Object', stat: !0, forced: !Ye },
      { getOwnPropertyNames: kn, getOwnPropertySymbols: In }
    ),
    ze(
      {
        target: 'Object',
        stat: !0,
        forced: f(function () {
          Re.f(1);
        })
      },
      {
        getOwnPropertySymbols: function (e) {
          return Re.f(I(e));
        }
      }
    ),
    on)
  ) {
    var Tn =
      !Ye ||
      f(function () {
        var e = rn();
        return (
          '[null]' != on([e]) || '{}' != on({ a: e }) || '{}' != on(Object(e))
        );
      });
    ze(
      { target: 'JSON', stat: !0, forced: Tn },
      {
        stringify: function (e, t, n) {
          for (var r, o = [e], i = 1; arguments.length > i; )
            o.push(arguments[i++]);
          if (((r = t), (E(t) || void 0 !== e) && !mn(e)))
            return (
              dt(t) ||
                (t = function (e, t) {
                  if (
                    ('function' == typeof r && (t = r.call(this, e, t)), !mn(t))
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
    (ee[qt] = !0),
    Dt('asyncIterator');
  var On = F.f,
    xn = l.Symbol;
  if (
    d &&
    'function' == typeof xn &&
    (!('description' in xn.prototype) || void 0 !== xn().description)
  ) {
    var Rn = {},
      Cn = function () {
        var e =
            arguments.length < 1 || void 0 === arguments[0]
              ? void 0
              : String(arguments[0]),
          t = this instanceof Cn ? new xn(e) : void 0 === e ? xn() : xn(e);
        return '' === e && (Rn[t] = !0), t;
      };
    Le(Cn, xn);
    var Ln = (Cn.prototype = xn.prototype);
    Ln.constructor = Cn;
    var Pn = Ln.toString,
      An = 'Symbol(test)' == String(xn('test')),
      jn = /^Symbol\((.*)\)[^)]+$/;
    On(Ln, 'description', {
      configurable: !0,
      get: function () {
        var e = E(this) ? this.valueOf() : this,
          t = Pn.call(e);
        if (O(Rn, e)) return '';
        var n = An ? t.slice(7, -1) : t.replace(jn, '$1');
        return '' === n ? void 0 : n;
      }
    }),
      ze({ global: !0, forced: !0 }, { Symbol: Cn });
  }
  Dt('hasInstance'),
    Dt('isConcatSpreadable'),
    Dt('iterator'),
    Dt('match'),
    Dt('matchAll'),
    Dt('replace'),
    Dt('search'),
    Dt('species'),
    Dt('split'),
    Dt('toPrimitive'),
    Dt('toStringTag'),
    Dt('unscopables'),
    Yt(l.JSON, 'JSON', !0),
    Yt(Math, 'Math', !0),
    ze({ global: !0 }, { Reflect: {} }),
    Yt(l.Reflect, 'Reflect', !0),
    de.Symbol;
  var Un,
    Fn,
    Kn,
    Wn = function (e) {
      return function (t, n) {
        var r,
          o,
          i = String(S(t)),
          c = be(n),
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
    Nn = { codeAt: Wn(!1), charAt: Wn(!0) },
    zn = !f(function () {
      function e() {}
      return (
        (e.prototype.constructor = null),
        Object.getPrototypeOf(new e()) !== e.prototype
      );
    }),
    Vn = $('IE_PROTO'),
    Zn = Object.prototype,
    Xn = zn
      ? Object.getPrototypeOf
      : function (e) {
          return (
            (e = I(e)),
            O(e, Vn)
              ? e[Vn]
              : 'function' == typeof e.constructor && e instanceof e.constructor
              ? e.constructor.prototype
              : e instanceof Object
              ? Zn
              : null
          );
        },
    Dn = Qe('iterator'),
    Gn = !1;
  [].keys &&
    ('next' in (Kn = [].keys())
      ? (Fn = Xn(Xn(Kn))) !== Object.prototype && (Un = Fn)
      : (Gn = !0)),
    (null == Un ||
      f(function () {
        var e = {};
        return Un[Dn].call(e) !== e;
      })) &&
      (Un = {}),
    O(Un, Dn) ||
      K(Un, Dn, function () {
        return this;
      });
  var Jn = { IteratorPrototype: Un, BUGGY_SAFARI_ITERATORS: Gn },
    Yn = {},
    Bn = Jn.IteratorPrototype,
    Mn = function () {
      return this;
    },
    Hn =
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
                  if (!E(e) && null !== e)
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
    qn = Jn.IteratorPrototype,
    Qn = Jn.BUGGY_SAFARI_ITERATORS,
    $n = Qe('iterator'),
    er = 'keys',
    tr = 'values',
    nr = 'entries',
    rr = function () {
      return this;
    },
    or = function (e, t, n, r, o, i, c) {
      !(function (e, t, n) {
        var r = t + ' Iterator';
        (e.prototype = Kt(Bn, { next: v(1, n) })), Yt(e, r, !1), (Yn[r] = Mn);
      })(n, t, r);
      var s,
        a,
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
        b = ('Array' == t && p.entries) || h;
      if (
        (b &&
          ((s = Xn(b.call(new e()))),
          qn !== Object.prototype &&
            s.next &&
            (Xn(s) !== qn &&
              (Hn ? Hn(s, qn) : 'function' != typeof s[$n] && K(s, $n, rr)),
            Yt(s, f, !0))),
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
        if (((a = { values: l(tr), keys: i ? y : l(er), entries: l(nr) }), c))
          for (u in a) (Qn || d || !(u in p)) && fe(p, u, a[u]);
        else ze({ target: t, proto: !0, forced: Qn || d }, a);
      return a;
    },
    ir = Nn.charAt,
    cr = 'String Iterator',
    sr = le.set,
    ar = le.getterFor(cr);
  or(
    String,
    'String',
    function (e) {
      sr(this, { type: cr, string: String(e), index: 0 });
    },
    function () {
      var e,
        t = ar(this),
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
      if (null != e) return e[hr] || e['@@iterator'] || Yn[Ot(e)];
    },
    vr = Qe('iterator'),
    br = !1;
  try {
    var gr = 0,
      mr = {
        next: function () {
          return { done: !!gr++ };
        },
        return: function () {
          br = !0;
        }
      };
    (mr[vr] = function () {
      return this;
    }),
      Array.from(mr, function () {
        throw 2;
      });
  } catch (e) {}
  var wr = function (e, t) {
      if (!t && !br) return !1;
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
  ze(
    { target: 'Array', stat: !0, forced: Sr },
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
          d = yr(s),
          p = 0;
        if (
          (f && (l = ut(l, u > 2 ? arguments[2] : void 0, 2)),
          null == d || (a == Array && pr(d)))
        )
          for (n = new a((t = me(s.length))); t > p; p++)
            (c = f ? l(s[p], p) : s[p]), pt(n, p, c);
        else
          for (
            i = (o = d.call(s)).next, n = new a();
            !(r = i.call(o)).done;
            p++
          )
            (c = f ? lr(o, l, [r.value, p], !0) : r.value), pt(n, p, c);
        return (n.length = p), n;
      }
    }
  ),
    de.Array.from;
  var _r,
    Er = 'undefined' != typeof ArrayBuffer && 'undefined' != typeof DataView,
    kr = F.f,
    Ir = l.Int8Array,
    Tr = Ir && Ir.prototype,
    Or = l.Uint8ClampedArray,
    xr = Or && Or.prototype,
    Rr = Ir && Xn(Ir),
    Cr = Tr && Xn(Tr),
    Lr = Object.prototype,
    Pr = Lr.isPrototypeOf,
    Ar = Qe('toStringTag'),
    jr = q('TYPED_ARRAY_TAG'),
    Ur = Er && !!Hn && 'Opera' !== Ot(l.opera),
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
      if (!E(e)) return !1;
      var t = Ot(e);
      return O(Fr, t) || O(Kr, t);
    };
  for (_r in Fr) l[_r] || (Ur = !1);
  if (
    (!Ur || 'function' != typeof Rr || Rr === Function.prototype) &&
    ((Rr = function () {
      throw TypeError('Incorrect invocation');
    }),
    Ur)
  )
    for (_r in Fr) l[_r] && Hn(l[_r], Rr);
  if ((!Ur || !Cr || Cr === Lr) && ((Cr = Rr.prototype), Ur))
    for (_r in Fr) l[_r] && Hn(l[_r].prototype, Cr);
  if ((Ur && Xn(xr) !== Cr && Hn(xr, Cr), d && !O(Cr, Ar)))
    for (_r in (!0,
    kr(Cr, Ar, {
      get: function () {
        return E(this) ? this[jr] : void 0;
      }
    }),
    Fr))
      l[_r] && K(l[_r], jr, _r);
  var Nr = function (e) {
      if (Wr(e)) return e;
      throw TypeError('Target is not a typed array');
    },
    zr = function (e) {
      if (Hn) {
        if (Pr.call(Rr, e)) return e;
      } else
        for (var t in Fr)
          if (O(Fr, _r)) {
            var n = l[t];
            if (n && (e === n || Pr.call(n, e))) return e;
          }
      throw TypeError('Target is not a typed array constructor');
    },
    Vr = function (e, t, n) {
      if (d) {
        if (n)
          for (var r in Fr) {
            var o = l[r];
            if (o && O(o.prototype, e))
              try {
                delete o.prototype[e];
              } catch (e) {}
          }
        (Cr[e] && !n) || fe(Cr, e, n ? t : (Ur && Tr[e]) || t);
      }
    },
    Zr = Qe('species'),
    Xr = Nr,
    Dr = zr,
    Gr = [].slice;
  Vr(
    'slice',
    function (e, t) {
      for (
        var n = Gr.call(Xr(this), e, t),
          r = (function (e, t) {
            var n,
              r = j(e).constructor;
            return void 0 === r || null == (n = j(r)[Zr]) ? t : at(n);
          })(this, this.constructor),
          o = 0,
          i = n.length,
          c = new (Dr(r))(i);
        i > o;

      )
        c[o] = n[o++];
      return c;
    },
    f(function () {
      new Int8Array(1).slice();
    })
  );
  var Jr = Qe('unscopables'),
    Yr = Array.prototype;
  null == Yr[Jr] && F.f(Yr, Jr, { configurable: !0, value: Kt(null) });
  var Br = function (e) {
      Yr[Jr][e] = !0;
    },
    Mr = Ee.includes;
  ze(
    { target: 'Array', proto: !0 },
    {
      includes: function (e) {
        return Mr(this, e, arguments.length > 1 ? arguments[1] : void 0);
      }
    }
  ),
    Br('includes'),
    ft('Array', 'includes'),
    ze(
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
  var Hr = !f(function () {
      return Object.isExtensible(Object.preventExtensions({}));
    }),
    qr = a(function (e) {
      var t = F.f,
        n = q('meta'),
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
            if (!E(e))
              return 'symbol' == typeof e
                ? e
                : ('string' == typeof e ? 'S' : 'P') + e;
            if (!O(e, n)) {
              if (!o(e)) return 'F';
              if (!t) return 'E';
              i(e);
            }
            return e[n].objectID;
          },
          getWeakData: function (e, t) {
            if (!O(e, n)) {
              if (!o(e)) return !0;
              if (!t) return !1;
              i(e);
            }
            return e[n].weakData;
          },
          onFreeze: function (e) {
            return Hr && c.REQUIRED && o(e) && !O(e, n) && i(e), e;
          }
        });
      ee[n] = !0;
    });
  qr.REQUIRED, qr.fastKey, qr.getWeakData, qr.onFreeze;
  var Qr = function (e, t) {
      (this.stopped = e), (this.result = t);
    },
    $r = function (e, t, n) {
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
          for (i = 0, c = me(e.length); c > i; i++)
            if ((s = v(e[i])) && s instanceof Qr) return s;
          return new Qr(!1);
        }
        r = o.call(e);
      }
      for (a = r.next; !(u = a.call(r)).done; ) {
        try {
          s = v(u.value);
        } catch (e) {
          throw (ur(r), e);
        }
        if ('object' == typeof s && s && s instanceof Qr) return s;
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
    oo = qr.fastKey,
    io = le.set,
    co = le.getterFor;
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
        fe(
          s,
          e,
          'add' == e
            ? function (e) {
                return t.call(this, 0 === e ? 0 : e), this;
              }
            : 'delete' == e
            ? function (e) {
                return !(o && !E(e)) && t.call(this, 0 === e ? 0 : e);
              }
            : 'get' == e
            ? function (e) {
                return o && !E(e) ? void 0 : t.call(this, 0 === e ? 0 : e);
              }
            : 'has' == e
            ? function (e) {
                return !(o && !E(e)) && t.call(this, 0 === e ? 0 : e);
              }
            : function (e, n) {
                return t.call(this, 0 === e ? 0 : e, n), this;
              }
        );
      };
    if (
      We(
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
      (a = n.getConstructor(t, e, r, i)), (qr.REQUIRED = !0);
    else if (We(e, !0)) {
      var p = new a(),
        h = p[i](o ? {} : -0, 1) != p,
        y = f(function () {
          p.has(1);
        }),
        v = wr(function (e) {
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
          eo(t, a, e);
          var o = (function (e, t, n) {
            var r, o;
            return (
              Hn &&
                'function' == typeof (r = t.constructor) &&
                r !== n &&
                E((o = r.prototype)) &&
                o !== n.prototype &&
                Hn(e, o),
              e
            );
          })(new c(), t, a);
          return null != n && $r(n, o[i], { that: o, AS_ENTRIES: r }), o;
        })).prototype = s),
        (s.constructor = a)),
        (y || b) && (d('delete'), d('has'), r && d('get')),
        (b || h) && d(i),
        o && s.clear && delete s.clear;
    }
    (u[e] = a),
      ze({ global: !0, forced: a != c }, u),
      Yt(a, e),
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
          i = co(t),
          c = function (e, t, n) {
            var r,
              o,
              c = i(e),
              a = s(e, t);
            return (
              a
                ? (a.value = n)
                : ((c.last = a = {
                    index: (o = oo(t, !0)),
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
                  r = ut(e, arguments.length > 1 ? arguments[1] : void 0, 3);
                (t = t ? t.next : n.first);

              )
                for (r(t.value, t.key, this); t && t.removed; ) t = t.previous;
            },
            has: function (e) {
              return !!s(this, e);
            }
          }),
          to(
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
          o = co(t),
          i = co(r);
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
  var so = {
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
    ao = 'Array Iterator',
    uo = le.set,
    lo = le.getterFor(ao),
    fo = or(
      Array,
      'Array',
      function (e, t) {
        uo(this, { type: ao, target: _(e), index: 0, kind: t });
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
  for (var vo in so) {
    var bo = l[vo],
      go = bo && bo.prototype;
    if (go) {
      if (go[po] !== yo)
        try {
          K(go, po, yo);
        } catch (e) {
          go[po] = yo;
        }
      if ((go[ho] || K(go, ho, vo), so[vo]))
        for (var mo in fo)
          if (go[mo] !== fo[mo])
            try {
              K(go, mo, fo[mo]);
            } catch (e) {
              go[mo] = fo[mo];
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
  de.Set;
  var _o = setTimeout;
  function Eo(e) {
    return Boolean(e && void 0 !== e.length);
  }
  function ko() {}
  function Io(e) {
    if (!(this instanceof Io))
      throw new TypeError('Promises must be constructed via new');
    if ('function' != typeof e) throw new TypeError('not a function');
    (this._state = 0),
      (this._handled = !1),
      (this._value = void 0),
      (this._deferreds = []),
      Lo(e, this);
  }
  function To(e, t) {
    for (; 3 === e._state; ) e = e._value;
    0 !== e._state
      ? ((e._handled = !0),
        Io._immediateFn(function () {
          var n = 1 === e._state ? t.onFulfilled : t.onRejected;
          if (null !== n) {
            var r;
            try {
              r = n(e._value);
            } catch (e) {
              return void xo(t.promise, e);
            }
            Oo(t.promise, r);
          } else (1 === e._state ? Oo : xo)(t.promise, e._value);
        }))
      : e._deferreds.push(t);
  }
  function Oo(e, t) {
    try {
      if (t === e)
        throw new TypeError('A promise cannot be resolved with itself.');
      if (t && ('object' == typeof t || 'function' == typeof t)) {
        var n = t.then;
        if (t instanceof Io) return (e._state = 3), (e._value = t), void Ro(e);
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
      (e._state = 1), (e._value = t), Ro(e);
    } catch (t) {
      xo(e, t);
    }
    var r, o;
  }
  function xo(e, t) {
    (e._state = 2), (e._value = t), Ro(e);
  }
  function Ro(e) {
    2 === e._state &&
      0 === e._deferreds.length &&
      Io._immediateFn(function () {
        e._handled || Io._unhandledRejectionFn(e._value);
      });
    for (var t = 0, n = e._deferreds.length; t < n; t++) To(e, e._deferreds[t]);
    e._deferreds = null;
  }
  function Co(e, t, n) {
    (this.onFulfilled = 'function' == typeof e ? e : null),
      (this.onRejected = 'function' == typeof t ? t : null),
      (this.promise = n);
  }
  function Lo(e, t) {
    var n = !1;
    try {
      e(
        function (e) {
          n || ((n = !0), Oo(t, e));
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
  (Io.prototype.catch = function (e) {
    return this.then(null, e);
  }),
    (Io.prototype.then = function (e, t) {
      var n = new this.constructor(ko);
      return To(this, new Co(e, t, n)), n;
    }),
    (Io.prototype.finally = wo),
    (Io.all = function (e) {
      return new Io(function (t, n) {
        if (!Eo(e)) return n(new TypeError('Promise.all accepts an array'));
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
    (Io.allSettled = So),
    (Io.resolve = function (e) {
      return e && 'object' == typeof e && e.constructor === Io
        ? e
        : new Io(function (t) {
            t(e);
          });
    }),
    (Io.reject = function (e) {
      return new Io(function (t, n) {
        n(e);
      });
    }),
    (Io.race = function (e) {
      return new Io(function (t, n) {
        if (!Eo(e)) return n(new TypeError('Promise.race accepts an array'));
        for (var r = 0, o = e.length; r < o; r++) Io.resolve(e[r]).then(t, n);
      });
    }),
    (Io._immediateFn =
      ('function' == typeof setImmediate &&
        function (e) {
          setImmediate(e);
        }) ||
      function (e) {
        _o(e, 0);
      }),
    (Io._unhandledRejectionFn = function (e) {
      'undefined' != typeof console &&
        console &&
        console.warn('Possible Unhandled Promise Rejection:', e);
    });
  var Po = (function () {
    if ('undefined' != typeof self) return self;
    if ('undefined' != typeof window) return window;
    if ('undefined' != typeof global) return global;
    throw new Error('unable to locate global object');
  })();
  'function' != typeof Po.Promise
    ? (Po.Promise = Io)
    : Po.Promise.prototype.finally
    ? Po.Promise.allSettled || (Po.Promise.allSettled = So)
    : (Po.Promise.prototype.finally = wo),
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
        return !t || ('object' != typeof t && 'function' != typeof t)
          ? a(e)
          : t;
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
  var Ao = a(function (e, t) {
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
  s(Ao);
  var jo = s(
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
                    if (n)
                      throw new TypeError('Generator is already executing.');
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
                        switch (
                          ((r = 0), o && (i = [2 & i[0], o.value]), i[0])
                        ) {
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
                          e.lockCorrector(),
                          [4, this.waitForSomethingToChange(a)]
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
                              return [4, Ao.default().lock(t)];
                            case 1:
                              return (
                                r.sent(),
                                this.acquiredIatSet.has(t)
                                  ? ((n = window.localStorage),
                                    null === (o = n.getItem(e))
                                      ? (Ao.default().unlock(t), [2])
                                      : (((o = JSON.parse(
                                          o
                                        )).timeRefreshed = Date.now()),
                                        n.setItem(e, JSON.stringify(o)),
                                        Ao.default().unlock(t),
                                        this.refreshLockWhileAcquired(e, t),
                                        [2]))
                                  : (Ao.default().unlock(t), [2])
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
                          : [4, Ao.default().lock(c.iat)]
                      );
                    case 1:
                      r.sent(),
                        this.acquiredIatSet.delete(c.iat),
                        n.removeItem(i),
                        Ao.default().unlock(c.iat),
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
    Uo = { timeoutInSeconds: 60 },
    Fo = 'memory',
    Ko = [
      'login_required',
      'consent_required',
      'interaction_required',
      'account_selection_required',
      'access_denied'
    ],
    Wo = { name: 'auth0-spa-js', version: '1.15.0' },
    No = (function (e) {
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
    zo = (function (e) {
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
    })(No),
    Vo = (function (e) {
      function n() {
        var t = e.call(this, 'timeout', 'Timeout') || this;
        return Object.setPrototypeOf(t, n.prototype), t;
      }
      return t(n, e), n;
    })(No),
    Zo = (function (e) {
      function n(t) {
        var r = e.call(this) || this;
        return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
      }
      return t(n, e), n;
    })(Vo),
    Xo = (function (e) {
      function n(t) {
        var r = e.call(this, 'cancelled', 'Popup closed') || this;
        return (r.popup = t), Object.setPrototypeOf(r, n.prototype), r;
      }
      return t(n, e), n;
    })(No),
    Do = function (e) {
      return new Promise(function (t, n) {
        var r,
          o = setInterval(function () {
            e.popup &&
              e.popup.closed &&
              (clearInterval(o),
              clearTimeout(i),
              window.removeEventListener('message', r, !1),
              n(new Xo(e.popup)));
          }, 1e3),
          i = setTimeout(function () {
            clearInterval(o),
              n(new Zo(e.popup)),
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
              return n(No.fromPayload(c.data.response));
            t(c.data.response);
          }
        }),
          window.addEventListener('message', r);
      });
    },
    Go = function () {
      return window.crypto || window.msCrypto;
    },
    Jo = function () {
      var e = Go();
      return e.subtle || e.webkitSubtle;
    },
    Yo = function () {
      var e =
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.',
        t = '';
      return (
        Array.from(Go().getRandomValues(new Uint8Array(43))).forEach(function (
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
    Ho = function (e) {
      return o(void 0, void 0, void 0, function () {
        var t;
        return i(this, function (n) {
          switch (n.label) {
            case 0:
              return (
                (t = Jo().digest(
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
    qo = function (e) {
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
                          return Promise.resolve(n.responseText).then(
                            JSON.parse
                          );
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
    ti = function (e, t, n, r, c, s) {
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
    ni = function (e, t, n, r, c, s) {
      return (
        void 0 === s && (s = 1e4),
        o(void 0, void 0, void 0, function () {
          return i(this, function (o) {
            return c ? [2, ti(e, t, n, r, s, c)] : [2, ei(e, r, s)];
          });
        })
      );
    };
  function ri(e, t, n, c, s, a) {
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
            return i.trys.push([2, 4, , 5]), [4, ni(e, n, c, s, a, t)];
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
              throw new No(
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
              ri(
                n + '/oauth/token',
                c,
                s || 'default',
                a,
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
    ci = function () {
      for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
      return ii(e.join(' ').trim().split(/\s+/)).join(' ');
    },
    si = (function () {
      function e(e, t) {
        void 0 === t && (t = ai),
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
    ai = '@@auth0spajs@@',
    ui = function (e) {
      var t = Math.floor(Date.now() / 1e3) + e.expires_in;
      return { body: e, expiresAt: Math.min(t, e.decodedToken.claims.exp) };
    },
    li = function (e, t) {
      var n = e.client_id,
        r = e.audience,
        o = e.scope;
      return t.filter(function (e) {
        var t = si.fromKey(e),
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
        return i === ai && c === n && s === r && l;
      })[0];
    },
    fi = (function () {
      function e() {}
      return (
        (e.prototype.save = function (e) {
          var t = new si({
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
            localStorage.key(e).startsWith(ai) &&
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
            var n = new si({
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
    bi = function (e) {
      if (!e.id_token) throw new Error('ID token is required but missing');
      var t = (function (e) {
        var t = e.split('.'),
          n = t[0],
          r = t[1],
          o = t[2];
        if (3 !== t.length || !n || !r || !o)
          throw new Error('ID token could not be decoded');
        var i = JSON.parse(qo(r)),
          c = { __raw: e },
          s = {};
        return (
          Object.keys(i).forEach(function (e) {
            (c[e] = i[e]), vi.includes(e) || (s[e] = i[e]);
          }),
          {
            encoded: { header: n, payload: r, signature: o },
            header: JSON.parse(qo(n)),
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
      if (yi(t.claims.nbf) && r < i)
        throw new Error(
          "Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time (" +
            r +
            ') is before ' +
            i
        );
      if (yi(t.claims.auth_time) && r > c)
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
    gi = a(function (e, t) {
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
  s(gi), gi.encode, gi.parse, gi.getAll;
  var mi = gi.get,
    wi = gi.set,
    Si = gi.remove,
    _i = {
      get: function (e) {
        var t = mi(e);
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
    Ei = {
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
    ki = {
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
  var Ii = function (e, t) {
    return (Ii =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (e, t) {
          e.__proto__ = t;
        }) ||
      function (e, t) {
        for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
      })(e, t);
  };
  function Ti(e, t) {
    function n() {
      this.constructor = e;
    }
    Ii(e, t),
      (e.prototype =
        null === t ? Object.create(t) : ((n.prototype = t.prototype), new n()));
  }
  function Oi(e) {
    return 'function' == typeof e;
  }
  var xi = !1,
    Ri = {
      Promise: void 0,
      set useDeprecatedSynchronousErrorHandling(e) {
        e && new Error().stack;
        xi = e;
      },
      get useDeprecatedSynchronousErrorHandling() {
        return xi;
      }
    };
  function Ci(e) {
    setTimeout(function () {
      throw e;
    }, 0);
  }
  var Li = {
      closed: !0,
      next: function (e) {},
      error: function (e) {
        if (Ri.useDeprecatedSynchronousErrorHandling) throw e;
        Ci(e);
      },
      complete: function () {}
    },
    Pi = (function () {
      return (
        Array.isArray ||
        function (e) {
          return e && 'number' == typeof e.length;
        }
      );
    })();
  var Ai = (function () {
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
    ji = (function () {
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
            if (Oi(c)) {
              i && (this._unsubscribe = void 0);
              try {
                c.call(this);
              } catch (e) {
                t = e instanceof Ai ? Ui(e.errors) : [e];
              }
            }
            if (Pi(s)) {
              a = -1;
              for (var u = s.length; ++a < u; ) {
                var l = s[a];
                if (null !== (n = l) && 'object' == typeof n)
                  try {
                    l.unsubscribe();
                  } catch (e) {
                    (t = t || []),
                      e instanceof Ai
                        ? (t = t.concat(Ui(e.errors)))
                        : t.push(e);
                  }
              }
            }
            if (t) throw new Ai(t);
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
  function Ui(e) {
    return e.reduce(function (e, t) {
      return e.concat(t instanceof Ai ? t.errors : t);
    }, []);
  }
  var Fi = (function () {
      return 'function' == typeof Symbol
        ? Symbol('rxSubscriber')
        : '@@rxSubscriber_' + Math.random();
    })(),
    Ki = (function (e) {
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
            i.destination = Li;
            break;
          case 1:
            if (!n) {
              i.destination = Li;
              break;
            }
            if ('object' == typeof n) {
              n instanceof t
                ? ((i.syncErrorThrowable = n.syncErrorThrowable),
                  (i.destination = n),
                  n.add(i))
                : ((i.syncErrorThrowable = !0), (i.destination = new Wi(i, n)));
              break;
            }
          default:
            (i.syncErrorThrowable = !0), (i.destination = new Wi(i, n, r, o));
        }
        return i;
      }
      return (
        Ti(t, e),
        (t.prototype[Fi] = function () {
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
    })(ji),
    Wi = (function (e) {
      function t(t, n, r, o) {
        var i,
          c = e.call(this) || this;
        c._parentSubscriber = t;
        var s = c;
        return (
          Oi(n)
            ? (i = n)
            : n &&
              ((i = n.next),
              (r = n.error),
              (o = n.complete),
              n !== Li &&
                (Oi((s = Object.create(n)).unsubscribe) &&
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
        Ti(t, e),
        (t.prototype.next = function (e) {
          if (!this.isStopped && this._next) {
            var t = this._parentSubscriber;
            Ri.useDeprecatedSynchronousErrorHandling && t.syncErrorThrowable
              ? this.__tryOrSetError(t, this._next, e) && this.unsubscribe()
              : this.__tryOrUnsub(this._next, e);
          }
        }),
        (t.prototype.error = function (e) {
          if (!this.isStopped) {
            var t = this._parentSubscriber,
              n = Ri.useDeprecatedSynchronousErrorHandling;
            if (this._error)
              n && t.syncErrorThrowable
                ? (this.__tryOrSetError(t, this._error, e), this.unsubscribe())
                : (this.__tryOrUnsub(this._error, e), this.unsubscribe());
            else if (t.syncErrorThrowable)
              n ? ((t.syncErrorValue = e), (t.syncErrorThrown = !0)) : Ci(e),
                this.unsubscribe();
            else {
              if ((this.unsubscribe(), n)) throw e;
              Ci(e);
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
              Ri.useDeprecatedSynchronousErrorHandling && t.syncErrorThrowable
                ? (this.__tryOrSetError(t, n), this.unsubscribe())
                : (this.__tryOrUnsub(n), this.unsubscribe());
            } else this.unsubscribe();
          }
        }),
        (t.prototype.__tryOrUnsub = function (e, t) {
          try {
            e.call(this._context, t);
          } catch (e) {
            if ((this.unsubscribe(), Ri.useDeprecatedSynchronousErrorHandling))
              throw e;
            Ci(e);
          }
        }),
        (t.prototype.__tryOrSetError = function (e, t, n) {
          if (!Ri.useDeprecatedSynchronousErrorHandling)
            throw new Error('bad call');
          try {
            t.call(this._context, n);
          } catch (t) {
            return Ri.useDeprecatedSynchronousErrorHandling
              ? ((e.syncErrorValue = t), (e.syncErrorThrown = !0), !0)
              : (Ci(t), !0);
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
    })(Ki);
  var Ni = (function () {
    return ('function' == typeof Symbol && Symbol.observable) || '@@observable';
  })();
  function zi(e) {
    return e;
  }
  function Vi(e) {
    return 0 === e.length
      ? zi
      : 1 === e.length
      ? e[0]
      : function (t) {
          return e.reduce(function (e, t) {
            return t(e);
          }, t);
        };
  }
  var Zi = (function () {
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
              if (e instanceof Ki) return e;
              if (e[Fi]) return e[Fi]();
            }
            return e || t || n ? new Ki(e, t, n) : new Ki(Li);
          })(e, t, n);
        if (
          (r
            ? o.add(r.call(o, this.source))
            : o.add(
                this.source ||
                  (Ri.useDeprecatedSynchronousErrorHandling &&
                    !o.syncErrorThrowable)
                  ? this._subscribe(o)
                  : this._trySubscribe(o)
              ),
          Ri.useDeprecatedSynchronousErrorHandling &&
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
          Ri.useDeprecatedSynchronousErrorHandling &&
            ((e.syncErrorThrown = !0), (e.syncErrorValue = t)),
            !(function (e) {
              for (; e; ) {
                var t = e,
                  n = t.closed,
                  r = t.destination,
                  o = t.isStopped;
                if (n || o) return !1;
                e = r && r instanceof Ki ? r : null;
              }
              return !0;
            })(e)
              ? console.warn(t)
              : e.error(t);
        }
      }),
      (e.prototype.forEach = function (e, t) {
        var n = this;
        return new (t = Xi(t))(function (t, r) {
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
      (e.prototype[Ni] = function () {
        return this;
      }),
      (e.prototype.pipe = function () {
        for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
        return 0 === e.length ? this : Vi(e)(this);
      }),
      (e.prototype.toPromise = function (e) {
        var t = this;
        return new (e = Xi(e))(function (e, n) {
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
  function Xi(e) {
    if ((e || (e = Promise), !e)) throw new Error('no Promise impl found');
    return e;
  }
  var Di = (function () {
      function e(e, t) {
        (this.project = e), (this.thisArg = t);
      }
      return (
        (e.prototype.call = function (e, t) {
          return t.subscribe(new Gi(e, this.project, this.thisArg));
        }),
        e
      );
    })(),
    Gi = (function (e) {
      function t(t, n, r) {
        var o = e.call(this, t) || this;
        return (o.project = n), (o.count = 0), (o.thisArg = r || o), o;
      }
      return (
        Ti(t, e),
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
    })(Ki);
  function Ji(e, t, n, r) {
    return (
      Oi(n) && ((r = n), (n = void 0)),
      r
        ? Ji(e, t, n).pipe(
            ((o = function (e) {
              return Pi(e) ? r.apply(void 0, e) : r(e);
            }),
            function (e) {
              if ('function' != typeof o)
                throw new TypeError(
                  'argument is not a function. Are you looking for `mapTo()`?'
                );
              return e.lift(new Di(o, i));
            })
          )
        : new Zi(function (r) {
            Yi(
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
  function Yi(e, t, n, r, o) {
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
      for (var u = 0, l = e.length; u < l; u++) Yi(e[u], t, n, r, o);
    }
    r.add(i);
  }
  var Bi = { error: 'cordova_not_available' },
    Mi = { error: 'plugin_not_installed' };
  function Hi(e) {
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
  function qi(e, t, n, r) {
    var o, i;
    void 0 === r && (r = {});
    var c = Hi(function (c, s) {
      (o = r.destruct
        ? nc(
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
        : nc(e, t, n, r, c, s)),
        (i = s);
    });
    return (
      o &&
        o.error &&
        (c.catch(function () {}), 'function' == typeof i && i(o.error)),
      c
    );
  }
  function Qi(e, t, n, r) {
    return (
      void 0 === r && (r = {}),
      Hi(function (o, i) {
        var c = nc(e, t, n, r);
        c
          ? c.error
            ? i(c.error)
            : c.then && c.then(o).catch(i)
          : i({ error: 'unexpected_error' });
      })
    );
  }
  function $i(e, t, n, r) {
    return (
      void 0 === r && (r = {}),
      new Zi(function (o) {
        var i;
        return (
          (i = r.destruct
            ? nc(
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
            : nc(e, t, n, r, o.next.bind(o), o.error.bind(o))) &&
            i.error &&
            (o.error(i.error), o.complete()),
          function () {
            try {
              if (r.clearFunction)
                return r.clearWithArgs
                  ? nc(
                      e,
                      r.clearFunction,
                      n,
                      r,
                      o.next.bind(o),
                      o.error.bind(o)
                    )
                  : nc(e, r.clearFunction, []);
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
  function ec(e, t) {
    return Ji(
      (t =
        'undefined' != typeof window && t
          ? oc(window, t)
          : t || ('undefined' != typeof window ? window : {})),
      e
    );
  }
  function tc(e, t, n) {
    var r, o, i;
    return (
      'string' == typeof e
        ? (r = e)
        : ((r = e.constructor.getPluginRef()),
          (n = e.constructor.getPluginName()),
          (i = e.constructor.getPluginInstallName())),
      !(!(o = rc(r)) || (t && void 0 === o[t])) ||
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
            Mi)
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
            Bi))
    );
  }
  function nc(e, t, n, r, o, i) {
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
    var c = tc(e, t);
    if (!0 === c) {
      var s = rc(e.constructor.getPluginRef());
      return s[t].apply(s, n);
    }
    return c;
  }
  function rc(e) {
    return 'undefined' != typeof window ? oc(window, e) : null;
  }
  function oc(e, t) {
    for (var n = t.split('.'), r = e, o = 0; o < n.length; o++) {
      if (!r) return null;
      r = r[n[o]];
    }
    return r;
  }
  var ic = (function () {
    function e() {}
    return (
      (e.installed = function () {
        return !0 === tc(this.pluginRef);
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
  function cc(e, t, n, r) {
    return (function (e, t, n) {
      return (
        void 0 === n && (n = {}),
        function () {
          for (var r = [], o = 0; o < arguments.length; o++)
            r[o] = arguments[o];
          return n.sync
            ? nc(e, t, r, n)
            : n.observable
            ? $i(e, t, r, n)
            : n.eventObservable && n.event
            ? ec(n.event, n.element)
            : n.otherPromise
            ? Qi(e, t, r, n)
            : qi(e, t, r, n);
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
  var sc = (function () {
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
    ac = new ((function (e) {
      function t() {
        return (null !== e && e.apply(this, arguments)) || this;
      }
      return (
        sc(t, e),
        (t.prototype.start = function (e, t) {
          return cc(this, 'start', {}, arguments);
        }),
        (t.pluginName = 'IosASWebauthenticationSession'),
        (t.plugin = 'cordova-plugin-ios-aswebauthenticationsession-api'),
        (t.pluginRef = 'plugins.ASWebAuthSession'),
        (t.repo =
          'https://github.com/jwelker110/cordova-plugin-ios-aswebauthenticationsession-api'),
        (t.platforms = ['iOS']),
        t
      );
    })(ic))();
  function uc(e, t, n) {
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
      c = o.substring(i) + (r ? '//# sourceMappingURL=' + r : ''),
      s = new Blob([c], { type: 'application/javascript' });
    return URL.createObjectURL(s);
  }
  var lc,
    fc,
    dc,
    pc,
    hc =
      ((lc =
        'Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7Ci8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgogICAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uCgogICAgUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55CiAgICBwdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuCgogICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICJBUyBJUyIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEgKICAgIFJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULAogICAgSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NCiAgICBMT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUgogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUgogICAgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS4KICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovdmFyIGU9ZnVuY3Rpb24oKXtyZXR1cm4oZT1PYmplY3QuYXNzaWdufHxmdW5jdGlvbihlKXtmb3IodmFyIHQscj0xLG49YXJndW1lbnRzLmxlbmd0aDtyPG47cisrKWZvcih2YXIgbyBpbiB0PWFyZ3VtZW50c1tyXSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodCxvKSYmKGVbb109dFtvXSk7cmV0dXJuIGV9KS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9O2Z1bmN0aW9uIHQoZSx0LHIsbil7cmV0dXJuIG5ldyhyfHwocj1Qcm9taXNlKSkoKGZ1bmN0aW9uKG8scyl7ZnVuY3Rpb24gYShlKXt0cnl7dShuLm5leHQoZSkpfWNhdGNoKGUpe3MoZSl9fWZ1bmN0aW9uIGkoZSl7dHJ5e3Uobi50aHJvdyhlKSl9Y2F0Y2goZSl7cyhlKX19ZnVuY3Rpb24gdShlKXt2YXIgdDtlLmRvbmU/byhlLnZhbHVlKToodD1lLnZhbHVlLHQgaW5zdGFuY2VvZiByP3Q6bmV3IHIoKGZ1bmN0aW9uKGUpe2UodCl9KSkpLnRoZW4oYSxpKX11KChuPW4uYXBwbHkoZSx0fHxbXSkpLm5leHQoKSl9KSl9ZnVuY3Rpb24gcihlLHQpe3ZhciByLG4sbyxzLGE9e2xhYmVsOjAsc2VudDpmdW5jdGlvbigpe2lmKDEmb1swXSl0aHJvdyBvWzFdO3JldHVybiBvWzFdfSx0cnlzOltdLG9wczpbXX07cmV0dXJuIHM9e25leHQ6aSgwKSx0aHJvdzppKDEpLHJldHVybjppKDIpfSwiZnVuY3Rpb24iPT10eXBlb2YgU3ltYm9sJiYoc1tTeW1ib2wuaXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9KSxzO2Z1bmN0aW9uIGkocyl7cmV0dXJuIGZ1bmN0aW9uKGkpe3JldHVybiBmdW5jdGlvbihzKXtpZihyKXRocm93IG5ldyBUeXBlRXJyb3IoIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy4iKTtmb3IoO2E7KXRyeXtpZihyPTEsbiYmKG89MiZzWzBdP24ucmV0dXJuOnNbMF0/bi50aHJvd3x8KChvPW4ucmV0dXJuKSYmby5jYWxsKG4pLDApOm4ubmV4dCkmJiEobz1vLmNhbGwobixzWzFdKSkuZG9uZSlyZXR1cm4gbztzd2l0Y2gobj0wLG8mJihzPVsyJnNbMF0sby52YWx1ZV0pLHNbMF0pe2Nhc2UgMDpjYXNlIDE6bz1zO2JyZWFrO2Nhc2UgNDpyZXR1cm4gYS5sYWJlbCsrLHt2YWx1ZTpzWzFdLGRvbmU6ITF9O2Nhc2UgNTphLmxhYmVsKyssbj1zWzFdLHM9WzBdO2NvbnRpbnVlO2Nhc2UgNzpzPWEub3BzLnBvcCgpLGEudHJ5cy5wb3AoKTtjb250aW51ZTtkZWZhdWx0OmlmKCEobz1hLnRyeXMsKG89by5sZW5ndGg+MCYmb1tvLmxlbmd0aC0xXSl8fDYhPT1zWzBdJiYyIT09c1swXSkpe2E9MDtjb250aW51ZX1pZigzPT09c1swXSYmKCFvfHxzWzFdPm9bMF0mJnNbMV08b1szXSkpe2EubGFiZWw9c1sxXTticmVha31pZig2PT09c1swXSYmYS5sYWJlbDxvWzFdKXthLmxhYmVsPW9bMV0sbz1zO2JyZWFrfWlmKG8mJmEubGFiZWw8b1syXSl7YS5sYWJlbD1vWzJdLGEub3BzLnB1c2gocyk7YnJlYWt9b1syXSYmYS5vcHMucG9wKCksYS50cnlzLnBvcCgpO2NvbnRpbnVlfXM9dC5jYWxsKGUsYSl9Y2F0Y2goZSl7cz1bNixlXSxuPTB9ZmluYWxseXtyPW89MH1pZig1JnNbMF0pdGhyb3cgc1sxXTtyZXR1cm57dmFsdWU6c1swXT9zWzFdOnZvaWQgMCxkb25lOiEwfX0oW3MsaV0pfX19dmFyIG49e30sbz1mdW5jdGlvbihlLHQpe3JldHVybiBlKyJ8Iit0fTthZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwoZnVuY3Rpb24ocyl7dmFyIGE9cy5kYXRhLGk9YS50aW1lb3V0LHU9YS5hdXRoLGM9YS5mZXRjaFVybCxmPWEuZmV0Y2hPcHRpb25zLGw9cy5wb3J0c1swXTtyZXR1cm4gdCh2b2lkIDAsdm9pZCAwLHZvaWQgMCwoZnVuY3Rpb24oKXt2YXIgdCxzLGEsaCxwLGIseSxkLHYsdztyZXR1cm4gcih0aGlzLChmdW5jdGlvbihyKXtzd2l0Y2goci5sYWJlbCl7Y2FzZSAwOmE9KHM9dXx8e30pLmF1ZGllbmNlLGg9cy5zY29wZSxyLmxhYmVsPTE7Y2FzZSAxOmlmKHIudHJ5cy5wdXNoKFsxLDcsLDhdKSwhKHA9SlNPTi5wYXJzZShmLmJvZHkpKS5yZWZyZXNoX3Rva2VuJiYicmVmcmVzaF90b2tlbiI9PT1wLmdyYW50X3R5cGUpe2lmKCEoYj1mdW5jdGlvbihlLHQpe3JldHVybiBuW28oZSx0KV19KGEsaCkpKXRocm93IG5ldyBFcnJvcigiVGhlIHdlYiB3b3JrZXIgaXMgbWlzc2luZyB0aGUgcmVmcmVzaCB0b2tlbiIpO2YuYm9keT1KU09OLnN0cmluZ2lmeShlKGUoe30scCkse3JlZnJlc2hfdG9rZW46Yn0pKX15PXZvaWQgMCwiZnVuY3Rpb24iPT10eXBlb2YgQWJvcnRDb250cm9sbGVyJiYoeT1uZXcgQWJvcnRDb250cm9sbGVyLGYuc2lnbmFsPXkuc2lnbmFsKSxkPXZvaWQgMCxyLmxhYmVsPTI7Y2FzZSAyOnJldHVybiByLnRyeXMucHVzaChbMiw0LCw1XSksWzQsUHJvbWlzZS5yYWNlKFsoZz1pLG5ldyBQcm9taXNlKChmdW5jdGlvbihlKXtyZXR1cm4gc2V0VGltZW91dChlLGcpfSkpKSxmZXRjaChjLGUoe30sZikpXSldO2Nhc2UgMzpyZXR1cm4gZD1yLnNlbnQoKSxbMyw1XTtjYXNlIDQ6cmV0dXJuIHY9ci5zZW50KCksbC5wb3N0TWVzc2FnZSh7ZXJyb3I6di5tZXNzYWdlfSksWzJdO2Nhc2UgNTpyZXR1cm4gZD9bNCxkLmpzb24oKV06KHkmJnkuYWJvcnQoKSxsLnBvc3RNZXNzYWdlKHtlcnJvcjoiVGltZW91dCB3aGVuIGV4ZWN1dGluZyAnZmV0Y2gnIn0pLFsyXSk7Y2FzZSA2OnJldHVybih0PXIuc2VudCgpKS5yZWZyZXNoX3Rva2VuPyhmdW5jdGlvbihlLHQscil7bltvKHQscildPWV9KHQucmVmcmVzaF90b2tlbixhLGgpLGRlbGV0ZSB0LnJlZnJlc2hfdG9rZW4pOmZ1bmN0aW9uKGUsdCl7ZGVsZXRlIG5bbyhlLHQpXX0oYSxoKSxsLnBvc3RNZXNzYWdlKHtvazpkLm9rLGpzb246dH0pLFszLDhdO2Nhc2UgNzpyZXR1cm4gdz1yLnNlbnQoKSxsLnBvc3RNZXNzYWdlKHtvazohMSxqc29uOntlcnJvcl9kZXNjcmlwdGlvbjp3Lm1lc3NhZ2V9fSksWzMsOF07Y2FzZSA4OnJldHVyblsyXX12YXIgZ30pKX0pKX0pKX0oKTsKCg=='),
      (fc = null),
      (dc = !1),
      function (e) {
        return (pc = pc || uc(lc, fc, dc)), new Worker(pc, e);
      }),
    yc = {},
    vc = new jo(),
    bc = 'auth0.lock.getTokenSilently',
    gc = {
      memory: function () {
        return new di().enclosedCache;
      },
      localstorage: function () {
        return new fi();
      }
    },
    mc = function (e) {
      return gc[e];
    },
    wc = function () {
      return !/Trident.*rv:11\.0/.test(navigator.userAgent);
    },
    Sc = (function () {
      function e(e) {
        var t, n;
        if (
          ((this.options = e),
          'undefined' != typeof window &&
            (function () {
              if (!Go())
                throw new Error(
                  'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
                );
              if (void 0 === Jo())
                throw new Error(
                  '\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    '
                );
            })(),
          (this.cacheLocation = e.cacheLocation || Fo),
          (this.cookieStorage = !1 === e.legacySameSiteCookie ? _i : Ei),
          (this.sessionCheckExpiryDays = e.sessionCheckExpiryDays || 1),
          !mc(this.cacheLocation))
        )
          throw new Error(
            'Invalid cache location "' + this.cacheLocation + '"'
          );
        var o,
          i,
          c = e.useCookiesForTransactions ? this.cookieStorage : ki;
        (this.cache = mc(this.cacheLocation)()),
          (this.scope = this.options.scope),
          (this.transactionManager = new hi(c)),
          (this.domainUrl = 'https://' + this.options.domain),
          (this.tokenIssuer =
            ((o = this.options.issuer),
            (i = this.domainUrl),
            o
              ? o.startsWith('https://')
                ? o
                : 'https://' + o + '/'
              : i + '/')),
          (this.defaultScope = ci(
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
            (this.scope = ci(this.scope, 'offline_access')),
          'undefined' != typeof window &&
            window.Worker &&
            this.options.useRefreshTokens &&
            this.cacheLocation === Fo &&
            wc() &&
            (this.worker = new hc()),
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
            scope: ci(this.defaultScope, this.scope, e.scope),
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
          return this._url('/authorize?' + Mo(e));
        }),
        (e.prototype._verifyIdToken = function (e, t, n) {
          return bi({
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
                      (s = Bo(Yo())),
                      (a = Bo(Yo())),
                      (u = Yo()),
                      [4, Ho(u)]
                    );
                  case 1:
                    return (
                      (l = i.sent()),
                      (f = Qo(l)),
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
                    (c = Bo(Yo())),
                    (s = Bo(Yo())),
                    (a = Yo()),
                    [4, Ho(a)]
                  );
                case 1:
                  return (
                    (u = i.sent()),
                    (l = Qo(u)),
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
                      Do(
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
                    oi(
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
                  (n = ci(this.defaultScope, this.scope, e.scope)),
                  [
                    2,
                    (r = this.cache.get(
                      new si({
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
                  (n = ci(this.defaultScope, this.scope, e.scope)),
                  [
                    2,
                    (r = this.cache.get(
                      new si({
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
                      (o = void 0 === n ? this.options.platform || 'web' : n),
                      (c = r(e, ['redirectMethod', 'platform'])),
                      [4, this.buildAuthorizeUrl(c)]
                    );
                  case 1:
                    return (
                      (s = i.sent()),
                      (a =
                        c.redirect_uri ||
                        this.options.redirect_uri ||
                        window.location.origin),
                      'web' === o
                        ? (window.location[t || 'assign'](s), [2])
                        : 'ios' === o
                        ? [2, ac.start(a.split('://')[0], s)]
                        : [2]
                    );
                }
              });
            })
          );
        }),
        (e.prototype.logout = function (e) {
          void 0 === e && (e = {});
          var t = e.localOnly,
            n = e.platform,
            o = void 0 === n ? this.options.platform || 'web' : n,
            i = r(e, ['localOnly', 'platform']);
          if (t && i.federated)
            throw new Error(
              'It is invalid to set both the `federated` and `localOnly` options to `true`'
            );
          if (
            (this.cache.clear(),
            this.cookieStorage.remove('auth0.is.authenticated'),
            !t)
          ) {
            var c = this.buildLogoutUrl(i),
              s = i.returnTo;
            if ('web' !== o)
              return 'ios' === o ? ac.start(s.split('://')[0], c) : void 0;
            window.location.assign(c);
          }
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
                      (c = r.code),
                      (s = r.error),
                      (a = r.error_description),
                      !(u = this.transactionManager.get()) || !u.code_verifier)
                    )
                      throw new Error('Invalid state');
                    if ((this.transactionManager.remove(), s))
                      throw new zo(s, a, o, u.appState);
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
                c,
                s = this;
              return i(this, function (i) {
                return (
                  (t = n(
                    n({ audience: this.options.audience, ignoreCache: !1 }, e),
                    { scope: ci(this.defaultScope, this.scope, e.scope) }
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
                    (l = yc[u]),
                    l ||
                      ((l = a().finally(function () {
                        delete yc[u], (l = null);
                      })),
                      (yc[u] = l)),
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
                          new si({
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
                              return vc.acquireLock(bc, 5e3);
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
                    return [4, vc.releaseLock(bc)];
                  case 8:
                    return d.sent(), [7];
                  case 9:
                    return [3, 11];
                  case 10:
                    throw new Vo();
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
                      (e.scope = ci(this.defaultScope, this.scope, e.scope)),
                      (t = n(n({}, Uo), t)),
                      [4, this.loginWithPopup(e, t)]
                    );
                  case 1:
                    return (
                      r.sent(),
                      [
                        2,
                        this.cache.get(
                          new si({
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
        (e.prototype._getTokenFromIFrame = function (e) {
          return o(this, void 0, void 0, function () {
            var t, o, c, s, a, u, l, f, d, p, h, y, v, b, g;
            return i(this, function (i) {
              switch (i.label) {
                case 0:
                  return (t = Bo(Yo())), (o = Bo(Yo())), (c = Yo()), [4, Ho(c)];
                case 1:
                  (s = i.sent()),
                    (a = Qo(s)),
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
                            t(new Vo()), o();
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
                                ? t(No.fromPayload(n.data.response))
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
                      oi(
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
                    (e.scope = ci(
                      this.defaultScope,
                      this.options.scope,
                      e.scope
                    )),
                    ((t = this.cache.get(
                      new si({
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
                      oi(
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
    })();
  function _c(e) {
    return o(this, void 0, void 0, function () {
      var t;
      return i(this, function (n) {
        switch (n.label) {
          case 0:
            return [4, (t = new Sc(e)).checkSession()];
          case 1:
            return n.sent(), [2, t];
        }
      });
    });
  }
  var Ec = _c;
  return (
    (Ec.Auth0Client = Sc),
    (Ec.createAuth0Client = _c),
    (Ec.GenericError = No),
    (Ec.AuthenticationError = zo),
    (Ec.TimeoutError = Vo),
    (Ec.PopupTimeoutError = Zo),
    Ec
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
