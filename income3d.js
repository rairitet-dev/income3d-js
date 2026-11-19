/*!
 * income3d.js v1.0.0
 * Interactive 3D "Actual vs Forecast" bar chart.
 * Vanilla JS + Canvas 2D. No dependencies. Works offline.
 * MIT License
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Income3D = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================= static data ================= */

  var THEMES = {
    light: { bg: ['#ffffff', '#d9e2f4'], maj: '98,102,225', majA: .32, fin: '70,90,160', finA: .08, dot: '80,90,225', glow: '72,100,235', glowA: .24, fl: '90,110,235', flA: .08, fog: [217, 226, 244], edge: '255,255,255', pill: 'rgba(255,255,255,.94)', ps: [91, 140, 245], pt: '#14224a', pts: '#00505c', hl: [0, 184, 212], ax: 'rgba(50,62,92,.9)', pn: ['#12874a', '#d33a3f'], dark: 0, tipbg: 'rgba(255,255,255,.96)', tipbd: 'rgba(59,111,245,.45)', tiptx: '#1a2340' },
    dark: { bg: ['#1b1f29', '#080a0f'], maj: '122,118,235', majA: .4, fin: '150,155,225', finA: .06, dot: '190,190,255', glow: '112,100,255', glowA: .4, fl: '110,100,240', flA: .08, fog: [8, 10, 15], edge: '169,200,255', pill: 'rgba(10,14,24,.8)', ps: [140, 170, 255], pt: '#e3ecff', pts: '#d6fbff', hl: [0, 230, 255], ax: 'rgba(190,205,240,.85)', pn: ['#43d17f', '#ff6b72'], dark: 1, tipbg: 'rgba(12,16,26,.94)', tipbd: 'rgba(140,170,255,.4)', tiptx: '#e3ecff' },
    navy: { bg: ['#1b2d66', '#0a1230'], maj: '118,124,255', majA: .46, fin: '140,160,255', finA: .07, dot: '180,190,255', glow: '104,112,255', glowA: .4, fl: '96,110,255', flA: .1, fog: [10, 18, 48], edge: '169,200,255', pill: 'rgba(10,20,52,.78)', ps: [140, 170, 255], pt: '#e3ecff', pts: '#d6fbff', hl: [0, 230, 255], ax: 'rgba(190,205,240,.85)', pn: ['#43d17f', '#ff6b72'], dark: 1, tipbg: 'rgba(12,18,32,.92)', tipbd: 'rgba(140,170,255,.4)', tiptx: '#e3ecff' }
  };

  /* b = base HSL of a bar, s = HSL of the selected bar, c = label colour [light theme, dark themes], w = legend swatch */
  var SKY = { b: [206, 92, 56], s: [184, 100, 52], c: ['#1478cf', '#4aa8f5'], w: '#2c9bf0' };
  var BLUE = { b: [224, 84, 52], s: [200, 100, 54], c: ['#2a4fd6', '#6b8cff'], w: '#2f5be6' };
  var PALETTES = {
    amethyst: { fact: SKY, forecast: { b: [271, 91, 58], s: [270, 95, 68], c: ['#A855F7', '#C084FC'], w: '#A855F7' } },
    coral: { fact: SKY, forecast: { b: [13, 100, 60], s: [20, 100, 68], c: ['#F0502C', '#FF7A59'], w: '#FF7A59' } },
    emerald: { fact: BLUE, forecast: { b: [160, 84, 42], s: [158, 80, 54], c: ['#0C9E6E', '#10B981'], w: '#10B981' } },
    classic: { fact: SKY, forecast: { b: [43, 96, 54], s: [48, 100, 62], c: ['#C98A00', '#FBBF24'], w: '#F5B400' } }
  };

  var STR = {
    en: { fact: 'Actual', forecast: 'Forecast', variance: 'Variance', k: 'k' },
    ru: { fact: 'Факт', forecast: 'Прогноз', variance: 'Отклонение', k: 'тыс.' },
    tk: { fact: 'Fakt', forecast: 'Çaklama', variance: 'Gyşarma', k: 'müň' }
  };
  var NUMLOC = { en: 'en-US', ru: 'ru-RU', tk: 'ru-RU' };
  var SYMBOLS = { RUB: '₽', USD: '$', EUR: '€', TMT: 'TMT', PCT: '%', '%': '%' };
  var RATES = { USD: 1, RUB: 90, EUR: .92, TMT: 19.5 }; /* units of currency per 1 USD */

  /* ================= pure helpers ================= */

  var sm = function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var eO = function (x) { return 1 - Math.pow(1 - x, 3); };
  var eIO = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var nz = function (a) { var l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  var cr = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
  var lp = function (a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); };
  var wr = function (a) { return Math.atan2(Math.sin(a), Math.cos(a)); };
  var hsl2rgb = function (h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  };
  var inPoly = function (x, y, p) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++)
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    return c;
  };
  function hex2hsl(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex)); if (!m) return null;
    var h = m[1]; if (h.length === 3) h = h.replace(/./g, '$&$&');
    var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = 0, hh = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
  }
  function colorSpec(v, fallback) {
    if (v && typeof v === 'object' && v.b && v.s) return v;
    var c = hex2hsl(v); if (!c) return fallback;
    return { b: [c[0], c[1], Math.max(25, c[2] - 6)], s: [c[0], Math.min(100, c[1] + 4), Math.min(78, c[2] + 6)], c: [v, v], w: v };
  }
  function resolvePalette(p) {
    if (typeof p === 'string' && PALETTES[p]) return PALETTES[p];
    if (p && typeof p === 'object') return { fact: colorSpec(p.fact, SKY), forecast: colorSpec(p.forecast, PALETTES.amethyst.forecast) };
    return PALETTES.amethyst;
  }
  function num(v) {
    if (typeof v === 'string') v = parseFloat(v.replace(/\s/g, '').replace(',', '.'));
    return typeof v === 'number' && isFinite(v) ? v : null;
  }
  function pick(v, d) { return v === undefined || v === null ? d : v; }

  /* cube faces: [normal, 4 corners] */
  var FC = [[[0, 0, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, -1], [1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], [[1, 0, 0], [1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], [[-1, 0, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], [[0, 1, 0], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [[0, -1, 0], [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]];
  var GLAY = [[44, .045, 60], [30, .07, 60], [18, .11, 62], [9, .17, 64]]; /* selected-bar glow layers: stroke width, alpha, lightness */
  var GLOW = .65, GB = .5 + .5 * GLOW, OFF = .4, GQ = 12;
  var RC = [], RS = []; for (var j0 = 0; j0 <= 40; j0++) { RC.push(Math.cos(j0 / 40 * 6.2832)); RS.push(Math.sin(j0 / 40 * 6.2832)); }
  var VIEWS = { front: [0, Math.PI / 2], back: [Math.PI, Math.PI / 2], right: [Math.PI / 2, Math.PI / 2], left: [Math.PI * 1.5, Math.PI / 2], top: [0, .0001], bottom: [Math.PI, Math.PI - .0001] };

  /* ================= engine (one closure per chart) ================= */

  function engine(target, O) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host || !host.appendChild) throw new Error('Income3D: container not found');
    var D = Object.assign({
      data: [], theme: 'navy', palette: 'amethyst', currency: 'RUB', dataCurrency: null, rates: null, thousands: true,
      locale: 'en', labels: null, format: null, mode: 'all', pair: true, autoRotate: true, hideFar: true,
      legend: true, tooltip: true, interactive: true, zoomOnWheel: true, animate: true, background: true,
      maxValue: null, maxDPR: 1.5, font: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', ariaLabel: '3D chart', onSelect: null
    }, O);
    var FT = D.font;

    /* ---- DOM ---- */
    var wrap = document.createElement('div'), cv = document.createElement('canvas'), tip = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:100%;height:100%;min-height:240px;overflow:hidden;border-radius:inherit;box-sizing:border-box';
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;' + (D.interactive ? 'touch-action:none;cursor:grab;' : '');
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', D.ariaLabel);
    tip.style.cssText = 'position:absolute;display:none;z-index:2;pointer-events:none;padding:8px 10px;border-radius:10px;border:1px solid;font:12px/1.5 ' + FT + ';white-space:pre';
    wrap.appendChild(cv); wrap.appendChild(tip); host.appendChild(wrap);
    var X = cv.getContext('2d');

    /* ---- state ---- */
    var W = 300, H = 300, DPR = 1, B, K, zones = [], hF = [], hP = [], ds = [], tgF = [], tgP = [], td = [], lf = [], lpr = [], dp = [], dl = [], pt = [], gl = [];
    var th = .75, ph = 1.05, rad = 20, drag = 0, TG = [0, 2.6, 0], ortho = false, named = false, tv = null;
    var rows = [], fi = -1, fd = [], fg = [], hov = -1, auto = !!D.autoRotate, hideFar = !!D.hideFar, mode = D.mode === 'line' || D.mode === 'bars' ? D.mode : 'all', PM = D.pair ? 1 : 0, pf = PM, GAP = 1.55 + .35 * pf;
    var loopOn = false, tLast = 0, EXP = false, FKEY = '', FOK = 0, fcv = null, GC = null, pres = null, presRes = null, rdy = false, dead = false, onScreen = true;
    var T, tName, PAL, PC, CF, CP, lang, loc, cur, dataCode, rates, fx = 1;

    /* ---- theme / palette / currency / locale ---- */
    function applyTheme(n) {
      tName = THEMES[n] ? n : 'navy'; T = THEMES[tName];
      if (D.background) wrap.style.background = 'radial-gradient(120% 90% at 50% 0%,' + T.bg[0] + ',' + T.bg[1] + ' 72%)'; else wrap.style.background = 'transparent';
      tip.style.background = T.tipbg; tip.style.borderColor = T.tipbd; tip.style.color = T.tiptx;
      FOK = 0; applyPalette(PAL || D.palette);
    }
    function applyPalette(p) {
      PAL = p; var P = resolvePalette(p); PC = [P.fact, P.forecast];
      CF = P.fact.c[T.dark]; CP = P.forecast.c[T.dark]; wake();
    }
    function applyLocale(l) {
      D.locale = l || 'en'; var k = String(D.locale).slice(0, 2).toLowerCase();
      lang = Object.assign({}, STR.en, STR[k] || {}, D.labels || {});
      loc = NUMLOC[k] || D.locale;
    }
    function applyCurrency(c) {
      var code = String(c || 'USD').toUpperCase(); if (code === '%') code = 'PCT';
      cur = { code: code, s: SYMBOLS[code] || code, pct: code === 'PCT' };
      rates = Object.assign({}, RATES, D.rates || {});
      var a = rates[code], b = rates[dataCode];
      fx = cur.pct || !a || !b ? 1 : a / b;
    }
    var fmt = function (n) { return n.toLocaleString(loc, { maximumFractionDigits: 1 }); };
    var fmtA = function (n) { var a = Math.abs(n); return n.toLocaleString(loc, { maximumFractionDigits: fx === 1 ? 1 : a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4 }); };
    var uf = function (x) {
      if (D.format) return String(D.format(x, { currency: cur.code, symbol: cur.s, locale: D.locale }));
      return fmtA(x) + (!cur.pct && D.thousands ? ' ' + lang.k + ' ' : ' ') + cur.s;
    };
    var dtxt = function (d) { return (d >= 0 ? '+' : '−') + fmt(Math.abs(d)) + ' %'; };

    /* ---- data ---- */
    function normalize(d) {
      if (!Array.isArray(d)) throw new Error('Income3D: data must be an array');
      return d.map(function (r, i) {
        if (Array.isArray(r)) r = { period: r[0], fact: r[1], forecast: r[2], factor: r[3] };
        var per = pick(pick(r.period, r.label), pick(r.name, i + 1));
        return { a: String(per), f: pick(num(r.fact), 0), p: num(r.forecast), z: pick(num(r.factor), 1) };
      });
    }
    function build(keep, resetRad) {
      var o = { hF: hF, hP: hP, ds: ds };
      if (fi >= rows.length) fi = -1;
      gl = []; fd = rows.map(function (_, i) { return fi >= 0 && i !== fi ? 1 : 0; }); fg = rows.map(function (_, i) { return i === fi ? 1 : 0; });
      hF = rows.map(function (_, i) { return keep && o.hF[i] || 0; });
      hP = rows.map(function (_, i) { return keep && o.hP[i] || 0; });
      ds = rows.map(function (_, i) { return keep && o.ds[i] || 1; });
      if (resetRad && rdy) rad = R0();
    }
    function update(snap) {
      var vF = rows.map(function (r) { return r.f; }), vP = rows.map(function (r) { return r.p == null ? 0 : r.p; });
      var mx = D.maxValue > 0 ? D.maxValue : Math.max.apply(null, [1e-9].concat(vF, vP)), S = 7 / mx;
      tgF = vF.map(function (x) { return Math.max(0, x) * S; }); tgP = vP.map(function (x) { return Math.max(0, x) * S; });
      td = rows.map(function (r) { return .5 + Math.min(3, Math.max(.3, r.z)) * .9; });
      lf = vF.map(function (x) { return uf(x * fx); });
      lpr = rows.map(function (r) { return r.p == null ? '—' : uf(r.p * fx); });
      dp = rows.map(function (r) { return r.p > 0 ? (r.f - r.p) / r.p * 100 : null; });
      dl = dp.map(function (d) { return d === null ? '—' : dtxt(d); });
      pt = rows.map(function (r) { return r.a.slice(0, 10); });
      if (snap) { hF = tgF.slice(); hP = tgP.slice(); ds = td.slice(); }
      wake();
    }
    function setData(d, o) {
      var nr = normalize(d), same = nr.length === rows.length; rows = nr;
      build(true, !same); update(!!(o && o.animate === false)); if (!same) FOK = 0;
    }

    /* ---- render loop: frames are drawn only while something moves ---- */
    function wake() { if (loopOn || dead) return; loopOn = true; tLast = performance.now(); requestAnimationFrame(frame); }
    var xp = function (i) { return (i - (rows.length - 1) / 2) * GAP; }, bxk = function (i, k) { return xp(i) + (k ? 1 : -1) * OFF * pf; };
    function basis() {
      var o = [TG[0] + rad * Math.sin(ph) * Math.sin(th), TG[1] + rad * Math.cos(ph), TG[2] + rad * Math.sin(ph) * Math.cos(th)];
      var f = nz([TG[0] - o[0], TG[1] - o[1], TG[2] - o[2]]), r = nz(cr(f, [0, 1, 0])), u = cr(r, f);
      return { o: o, f: f, r: r, u: u };
    }
    function P(x, y, z) {
      var a = x - B.o[0], b = y - B.o[1], c = z - B.o[2], d = a * B.f[0] + b * B.f[1] + c * B.f[2];
      if (ortho) { var s = K / rad; return [W / 2 + (a * B.r[0] + b * B.r[1] + c * B.r[2]) * s, H / 2 - (a * B.u[0] + b * B.u[1] + c * B.u[2]) * s, d + 1e3, s]; }
      return [W / 2 + (a * B.r[0] + b * B.r[1] + c * B.r[2]) / d * K, H / 2 - (a * B.u[0] + b * B.u[1] + c * B.u[2]) / d * K, d, K / d];
    }
    var dz = function (p) { return (p[0] - B.o[0]) * B.f[0] + (p[1] - B.o[1]) * B.f[1] + (p[2] - B.o[2]) * B.f[2]; };
    function L3(a, b) {
      var nr = ortho ? -1e9 : .3, za = dz(a), zb = dz(b);
      if (za < nr && zb < nr) return null;
      if (za < nr) a = lp(a, b, (nr - za) / (zb - za)); else if (zb < nr) b = lp(b, a, (nr - zb) / (za - zb));
      return [P(a[0], a[1], a[2]), P(b[0], b[1], b[2])];
    }
    var farF = function (d) { return ortho ? 0 : Math.max(0, Math.min(1, (d - rad * 1.05) / (rad * .55))); };
    var fogF = function (d) { if (ortho) return 0; var q = Math.max(0, d - rad * .8) / rad; return 1 - Math.exp(-q * q); };
    var fogc = function (h, s, l, f, al) {
      if (f < .004) return 'hsla(' + h + ',' + s + '%,' + l + '%,' + al + ')';
      var c = hsl2rgb(h, s, l), g = T.fog;
      return 'rgba(' + (c[0] + (g[0] - c[0]) * f | 0) + ',' + (c[1] + (g[1] - c[1]) * f | 0) + ',' + (c[2] + (g[2] - c[2]) * f | 0) + ',' + al + ')';
    };
    var TWC = new Map();
    var tw = function (t) { var v = TWC.get(t); if (v === undefined) { X.font = '600 100px ' + FT; v = X.measureText(t).width / 100; if (TWC.size > 400) TWC.clear(); TWC.set(t, v); } return v; };

    /* ---- floor: radial fade, double grid, nodes, glow, fog ---- */
    var RQ = [new Float64Array(82), new Float64Array(82)];
    function ringPts(ax, az, k, buf) {
      var o = B.o, f = B.f, r = B.r, u = B.u, hw = W / 2, hh = H / 2, sc = K / rad;
      for (var j = 0; j <= 40; j++) {
        var x = ax * k * RC[j] - o[0], y = .01 - o[1], z = az * k * RS[j] - o[2], d = x * f[0] + y * f[1] + z * f[2];
        if (ortho) { buf[2 * j] = hw + (x * r[0] + y * r[1] + z * r[2]) * sc; buf[2 * j + 1] = hh - (x * u[0] + y * u[1] + z * u[2]) * sc; }
        else { if (d < .3) return false; buf[2 * j] = hw + (x * r[0] + y * r[1] + z * r[2]) / d * K; buf[2 * j + 1] = hh - (x * u[0] + y * u[1] + z * u[2]) / d * K; }
      }
      return true;
    }
    /* N stacked discs are replaced by N rings with pre-summed alpha: every pixel is painted once */
    function rings(ax, az, A, col, N) {
      var cur_ = 0, ok = ringPts(ax, az, 1, RQ[0]);
      for (var j = 0; j < N; j++) {
        var nx = 1 - cur_, lst = j === N - 1, ok2 = false;
        if (!lst) ok2 = ringPts(ax, az, 1 - (j + 1) / N, RQ[nx]);
        if (ok) {
          var a = RQ[cur_]; X.beginPath(); X.moveTo(a[0], a[1]); for (var q = 1; q <= 40; q++) X.lineTo(a[2 * q], a[2 * q + 1]); X.closePath();
          if (ok2) { var b = RQ[nx]; X.moveTo(b[0], b[1]); for (var q2 = 1; q2 <= 40; q2++) X.lineTo(b[2 * q2], b[2 * q2 + 1]); X.closePath(); }
          X.fillStyle = 'rgba(' + col + ',' + A * sm((j + 1) / N) + ')'; X.fill('evenodd');
        }
        cur_ = nx; ok = ok2;
      }
    }
    /* grid geometry does not depend on the camera: built once per radius, only projected per frame */
    function gridGeo(RF) {
      if (GC && GC.RF === RF) return GC;
      var E = Math.floor(RF), seg = Math.max(1.5, RF / 16);
      var mk = function (st, sk) {
        var w = [], ia = [], ib = [], vr = [], np = 0;
        for (var i = -E; i <= E; i++) {
          if (i % st || (sk && i % 5 === 0) || Math.abs(i) >= RF) continue;
          var half = Math.sqrt(RF * RF - i * i), n = Math.max(2, Math.ceil(2 * half / seg));
          for (var s = 0; s < 2; s++) {
            var b0 = np;
            for (var k = 0; k <= n; k++) {
              var u = -half + 2 * half * k / n; if (s) w.push(u, 0, i); else w.push(i, 0, u); np++;
              if (k) { ia.push(b0 + k - 1); ib.push(b0 + k); vr.push(1 - sm(Math.hypot(u - half / n, i) / RF)); }
            }
          }
        }
        return { w: new Float64Array(w), ia: Int32Array.from(ia), ib: Int32Array.from(ib), vr: Float64Array.from(vr), ns: ia.length, np: np, px: new Float64Array(np), py: new Float64Array(np), pz: new Float64Array(np), bk: Array.from({ length: GQ }, function () { return []; }) };
      };
      return GC = { RF: RF, fin: mk(1, true), maj: mk(5, false) };
    }
    function gridLayer(g, col, amax, lw) {
      var w = g.w, px = g.px, py = g.py, pz = g.pz, bk = g.bk, o = B.o, f = B.f, r = B.r, u = B.u, hw = W / 2, hh = H / 2, sc = K / rad, nr = ortho ? -1e9 : .3;
      for (var i = 0; i < g.np; i++) {
        var a = w[3 * i] - o[0], b = w[3 * i + 1] - o[1], c = w[3 * i + 2] - o[2], d = a * f[0] + b * f[1] + c * f[2]; pz[i] = d;
        if (ortho) { px[i] = hw + (a * r[0] + b * r[1] + c * r[2]) * sc; py[i] = hh - (a * u[0] + b * u[1] + c * u[2]) * sc; }
        else { px[i] = hw + (a * r[0] + b * r[1] + c * r[2]) / d * K; py[i] = hh - (a * u[0] + b * u[1] + c * u[2]) / d * K; }
      }
      for (var q = 0; q < GQ; q++) bk[q].length = 0;
      for (var s = 0; s < g.ns; s++) {
        var ia = g.ia[s], ib = g.ib[s], x1, y1, x2, y2, d1, d2;
        if (pz[ia] >= nr && pz[ib] >= nr) { x1 = px[ia]; y1 = py[ia]; x2 = px[ib]; y2 = py[ib]; d1 = pz[ia]; d2 = pz[ib]; }
        else { var l = L3([w[3 * ia], w[3 * ia + 1], w[3 * ia + 2]], [w[3 * ib], w[3 * ib + 1], w[3 * ib + 2]]); if (!l) continue; x1 = l[0][0]; y1 = l[0][1]; x2 = l[1][0]; y2 = l[1][1]; d1 = l[0][2]; d2 = l[1][2]; }
        var v = g.vr[s] * (1 - fogF((d1 + d2) / 2)); if (v > .02) bk[Math.min(GQ - 1, Math.floor(v * GQ))].push(x1, y1, x2, y2);
      }
      X.lineWidth = lw;
      for (var q2 = 0; q2 < GQ; q2++) {
        var a2 = bk[q2]; if (!a2.length) continue; X.beginPath();
        for (var k = 0; k < a2.length; k += 4) { X.moveTo(a2[k], a2[k + 1]); X.lineTo(a2[k + 2], a2[k + 3]); }
        X.strokeStyle = 'rgba(' + col + ',' + amax * (q2 + .5) / GQ + ')'; X.stroke();
      }
    }
    function floorGrid() {
      var hw = Math.abs(xp(0)), RF = Math.min(60, Math.max(26, hw + 17)), E = Math.floor(RF);
      rings(RF, RF, T.flA, T.fl, 14);
      var g = gridGeo(RF); gridLayer(g.fin, T.fin, T.finA, 1); gridLayer(g.maj, T.maj, T.majA, 1.2);
      var EM = Math.floor(E / 5) * 5;
      for (var i = -EM; i <= EM; i += 5) for (var j = -EM; j <= EM; j += 5) {
        var r = Math.hypot(i, j); if (r >= RF) continue; var p = P(i, 0, j); if (p[2] < .3) continue;
        var v = (1 - sm(r / RF)) * (1 - fogF(p[2])); if (v < .03) continue; var c = Math.max(1, .045 * p[3]);
        X.fillStyle = 'rgba(' + T.dot + ',' + .14 * v + ')'; X.beginPath(); X.arc(p[0], p[1], c * 3.4, 0, 6.2832); X.fill();
        X.fillStyle = 'rgba(' + T.dot + ',' + .7 * v + ')'; X.beginPath(); X.arc(p[0], p[1], c, 0, 6.2832); X.fill();
      }
      if (mode !== 'line') rings(hw + 2.8, 3.4, T.glowA, T.glow, 16);
    }
    /* floor cache: while the camera stands still the floor is blitted as a ready image instead of being recomputed */
    function floorLayer() {
      if (EXP) { floorGrid(); return; }
      var key = [th.toFixed(5), ph.toFixed(5), rad.toFixed(4), TG[0].toFixed(3), TG[1].toFixed(3), TG[2].toFixed(3), ortho ? 1 : 0, W, H, DPR, tName, mode === 'line' ? 1 : 0, pf.toFixed(4), rows.length].join('|');
      var blit = function () { X.setTransform(1, 0, 0, 1, 0, 0); X.drawImage(fcv, 0, 0); X.setTransform(DPR, 0, 0, DPR, 0, 0); };
      if (key === FKEY && FOK) { blit(); return; }
      if (key === FKEY) {
        if (!fcv) fcv = document.createElement('canvas');
        if (fcv.width !== cv.width || fcv.height !== cv.height) { fcv.width = cv.width; fcv.height = cv.height; }
        var fx_ = fcv.getContext('2d'), sx = X; X = fx_; X.setTransform(DPR, 0, 0, DPR, 0, 0); X.clearRect(0, 0, W, H); floorGrid(); X = sx; FOK = 1; blit(); return;
      }
      FKEY = key; FOK = 0; floorGrid();
    }

    /* ---- bars ---- */
    function bar(i, k, x, h) {
      var w = k ? .92 - .2 * pf : .66 + .06 * pf, d = ds[i] * (k ? 1.12 - .12 * pf : .84 + .16 * pf), fb = fogF(P(x, h / 2, 0)[2]), s = i === fi, hv = i === hov;
      var pc = PC[k ? 1 : 0], cc = s ? pc.s : pc.b, H0 = cc[0], S0 = cc[1], sk = k && pf < .95 && h < Math.max(hF[i], .02);
      var L0 = cc[2]; if (hv && !s) L0 += 10;
      var dm = fd[i] || 0, fo = fg[i] || 0, aB = k ? .34 + .3 * pf : .86, a0 = aB * (1 - .62 * dm), al = a0 + ((k ? Math.min(.92, aB + .22) : 1) - a0) * fo, vis = [];
      FC.forEach(function (f, j) {
        if (j === 4 && sk) return;
        var nm = f[0], q = f.slice(1).map(function (c) { return [x + (c[0] - .5) * w, c[1] * h, (c[2] - .5) * d]; });
        var cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2, cz = (q[0][2] + q[2][2]) / 2;
        if ((ortho ? -(nm[0] * B.f[0] + nm[1] * B.f[1] + nm[2] * B.f[2]) : nm[0] * (B.o[0] - cx) + nm[1] * (B.o[1] - cy) + nm[2] * (B.o[2] - cz)) <= 1e-6) return;
        var pp = q.map(function (v) { return P(v[0], v[1], v[2]); }); if (pp.some(function (p) { return p[2] < .3; })) return;
        var lam = Math.max(0, nm[0] * .4 + nm[1] * .8 + nm[2] * .6), l = Math.min(88, L0 * (.78 + .4 * lam));
        vis.push([pp, l]); zones.push([i, pp]);
      });
      var pth = function (q) { X.beginPath(); q.forEach(function (p, j) { j ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1]); }); X.closePath(); };
      var allp = function () { X.beginPath(); vis.forEach(function (v) { v[0].forEach(function (p, j) { j ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1]); }); X.closePath(); }); };
      if (fo > .01) { /* glow: a few translucent strokes instead of shadowBlur */
        var ga = fo * GLOW; allp(); X.lineJoin = 'round';
        GLAY.forEach(function (g) { X.strokeStyle = 'hsla(' + H0 + ',100%,' + g[2] + '%,' + g[1] * ga + ')'; X.lineWidth = g[0]; X.stroke(); });
        X.lineJoin = 'miter';
        vis.forEach(function (v) { pth(v[0]); X.fillStyle = 'hsl(' + H0 + ',' + S0 + '%,' + v[1] + '%)'; X.fill(); });
      }
      vis.forEach(function (v) {
        pth(v[0]); X.fillStyle = fogc(H0, S0, v[1], fb, al); X.fill();
        X.strokeStyle = 'rgba(' + T.edge + ',' + Math.min(.9, .65 * (k ? Math.max(al, .62) : al) / .78) + ')'; X.lineWidth = 1; X.stroke();
      });
      if (fo > .01) {
        allp(); X.lineJoin = 'round'; X.strokeStyle = 'hsla(' + H0 + ',100%,65%,' + .2 * fo * GLOW + ')'; X.lineWidth = 6; X.stroke();
        X.strokeStyle = 'hsla(' + (H0 + 4) + ',100%,80%,' + .95 * fo * GB + ')'; X.lineWidth = 1.6; X.stroke(); X.lineJoin = 'miter';
      }
    }
    var labF = function (i, z) {
      var fo = fg[i] || 0, ga = 1 - .55 * (fd[i] || 0), kp = Math.max(fo, i === hov ? 1 : 0), fr = farF(z), hd = hideFar ? sm((fr - .3) / .4) : 0;
      return [1 - .45 * fr * (1 - kp), ga * (1 - hd * (1 - kp)) * (1 - .4 * fr * (1 - kp)), kp, fo];
    };
    /* label above a pair: variance; for the selected pair — actual, forecast and variance */
    function pill(i, PN) {
      var top = Math.max(hF[i], hP[i], .02), p = P(xp(i), top + .9, 0), L = labF(i, p[2]), ls = L[0], kp = L[2], fo = L[3], al2 = L[1] * (gl[i] === undefined ? 1 : gl[i]);
      if (!(p[2] > .3 && al2 > .03)) return;
      var ex = sm(kp), k = p[3] * ls, bw = (1.98 + 2.5 * ex) * k, bh = (.51 + .9 * ex) * k, dtx = dl[i] || '—', dd = dp[i], col = dd === null ? T.pt : dd >= 0 ? PN[0] : PN[1], cx = p[0], cy = p[1];
      X.globalAlpha = al2; var rd = Math.min(bh / 2, .3 * k);
      var rp = function (e, r) { X.beginPath(); if (X.roundRect) X.roundRect(cx - bw / 2 - e, cy - bh / 2 - e, bw + 2 * e, bh + 2 * e, r + e); else X.rect(cx - bw / 2 - e, cy - bh / 2 - e, bw + 2 * e, bh + 2 * e); };
      if (fo > .01) [[9, .05], [5.5, .08], [2.5, .13]].forEach(function (g) { rp(g[0], rd); X.fillStyle = 'rgba(' + T.hl + ',' + g[1] * fo * GLOW + ')'; X.fill(); });
      X.fillStyle = T.pill;
      X.strokeStyle = 'rgba(' + (T.ps[0] + (T.hl[0] - T.ps[0]) * fo | 0) + ',' + (T.ps[1] + (T.hl[1] - T.ps[1]) * fo | 0) + ',' + (T.ps[2] + (T.hl[2] - T.ps[2]) * fo | 0) + ',' + (.45 + .5 * fo) + ')'; X.lineWidth = 1.2 + .5 * fo;
      rp(0, rd); X.fill();
      if (fo > .01) { X.fillStyle = 'rgba(' + T.hl + ',' + .18 * fo + ')'; X.fill(); }
      X.stroke(); X.textBaseline = 'middle';
      if (ex < .98) {
        X.globalAlpha = al2 * (1 - ex); X.textAlign = 'center'; var f = Math.max(6, .33 * k), w1 = tw(dtx);
        while (w1 * f > bw * .86 && f > 6) f--;
        X.font = '600 ' + f + 'px ' + FT; X.fillStyle = col; X.fillText(dtx, cx, cy + .5);
      }
      if (ex > .02) {
        X.globalAlpha = al2 * ex; var rowsT = [[lf[i] || '', CF], [lpr[i] || '', CP]], l3 = 'Δ ' + dtx;
        var mw = Math.max(tw(rowsT[0][0]), tw(rowsT[1][0]), tw(l3)), f2 = Math.max(6, .27 * k);
        while (mw * f2 > bw * .74 && f2 > 6) f2--;
        X.font = '600 ' + f2 + 'px ' + FT; X.textAlign = 'left';
        var x0 = cx - bw / 2 + .62 * k, ln = function (j) { return cy - bh / 2 + bh * (j + .5) / 3; };
        rowsT.forEach(function (l, j) { X.fillStyle = l[1]; X.beginPath(); X.arc(cx - bw / 2 + .36 * k, ln(j), Math.max(2, .11 * k), 0, 6.2832); X.fill(); X.fillStyle = fo > .5 ? T.pts : T.pt; X.fillText(l[0], x0, ln(j) + .5); });
        X.textAlign = 'center'; X.fillStyle = col; X.fillText(l3, cx, ln(2) + .5);
      }
      X.globalAlpha = 1;
    }
    function legend() {
      if (!D.legend) return;
      X.globalAlpha = 1; X.font = '600 12px ' + FT; X.textBaseline = 'middle'; X.textAlign = 'left';
      var it = [[PC[0].w, lang.fact], [PC[1].w, lang.forecast]], ws = it.map(function (a) { return tw(a[1]) * 12; });
      var bw = ws[0] + ws[1] + 66, bx = 14, by = H - 14 - 26;
      X.fillStyle = T.pill; X.strokeStyle = 'rgb(' + T.ps + ')'; X.lineWidth = 1; X.beginPath();
      if (X.roundRect) X.roundRect(bx, by, bw, 26, 13); else X.rect(bx, by, bw, 26); X.fill(); X.stroke();
      var x = bx + 12;
      it.forEach(function (a, j) { X.fillStyle = a[0]; X.fillRect(x, by + 8, 10, 10); X.fillStyle = T.pt; X.fillText(a[1], x + 16, by + 13.5); x += 26 + ws[j] + 10; });
    }
    function draw() {
      B = basis(); K = H / 2 / Math.tan(Math.PI / 9); X.setTransform(DPR, 0, 0, DPR, 0, 0); if (!EXP) X.clearRect(0, 0, W, H); X.globalAlpha = 1; zones = [];
      var n = hF.length, PN = T.pn;
      floorLayer();
      if (mode !== 'line') hF.map(function (_, i) { return [i, P(xp(i), Math.max(hF[i], hP[i], .02) / 2, 0)[2]]; }).sort(function (a, b) { return b[1] - a[1]; }).forEach(function (e) {
        var i = e[0], it = [0, 1].map(function (k) { return { k: k, x: bxk(i, k), h: Math.max(k ? hP[i] : hF[i], .02) }; });
        if (pf > .5) it.sort(function (a, b) { return P(b.x, 0, 0)[2] - P(a.x, 0, 0)[2]; });
        it.forEach(function (o) { bar(i, o.k, o.x, o.h); });
      });
      var lo = Math.min.apply(null, tgP), hi = Math.max.apply(null, tgP);
      if (mode !== 'bars') {
        var pp = hP.map(function (h, i) { var q = hi > lo ? Math.min(1, Math.max(0, (h - lo) / (hi - lo))) : .5; return { p: P(bxk(i, 1), h + .18, 0), hu: .33 * q * 360, c: 'hsl(' + .33 * q * 360 + ',85%,55%)' }; });
        var pa = hF.map(function (h, i) { return { p: P(bxk(i, 0), h + .18, 0) }; });
        X.lineWidth = 2.5; X.setLineDash([7, 5]);
        for (var i = 0; i < n - 1; i++) {
          var a = pp[i], b = pp[i + 1]; if (a.p[2] < .3 || b.p[2] < .3) continue;
          var dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], ln = Math.hypot(dx, dy) / 4; /* colour blend in 4 short dashed pieces, no gradients */
          for (var m = 0; m < 4; m++) {
            X.strokeStyle = 'hsl(' + (a.hu + (b.hu - a.hu) * (m + .5) / 4) + ',85%,55%)'; X.lineDashOffset = m * ln; X.beginPath();
            X.moveTo(a.p[0] + dx * m / 4, a.p[1] + dy * m / 4); X.lineTo(a.p[0] + dx * (m + 1) / 4, a.p[1] + dy * (m + 1) / 4); X.stroke();
          }
          X.lineDashOffset = 0;
        }
        X.setLineDash([]);
        pp.forEach(function (o) { if (o.p[2] < .3) return; X.fillStyle = o.c; X.beginPath(); X.arc(o.p[0], o.p[1], Math.max(2, .18 * o.p[3]), 0, 6.2832); X.fill(); });
        X.strokeStyle = 'rgb(' + T.hl + ')'; X.lineWidth = 2.5; X.beginPath(); var st = false;
        pa.forEach(function (o) { if (o.p[2] < .3) { st = false; return; } if (st) X.lineTo(o.p[0], o.p[1]); else X.moveTo(o.p[0], o.p[1]); st = true; }); X.stroke();
        pa.forEach(function (o) { if (o.p[2] < .3) return; X.fillStyle = 'rgb(' + T.hl + ')'; X.beginPath(); X.arc(o.p[0], o.p[1], Math.max(2, .16 * o.p[3]), 0, 6.2832); X.fill(); });
      }
      X.textAlign = 'center'; X.textBaseline = 'middle';
      hF.forEach(function (_, i) {
        var p = P(xp(i), 0, 0), L = labF(i, p[2]), ls = L[0], al2 = L[1];
        if (p[2] > .3 && al2 > .03) { X.globalAlpha = al2; var q = p[3] * ls; X.font = '600 ' + Math.max(6, .3 * q) + 'px ' + FT; X.fillStyle = T.ax; X.fillText(pt[i] || '', p[0], p[1] + Math.max(11 * ls, .62 * q)); }
        X.globalAlpha = 1;
      });
      hF.map(function (_, i) { return [i, P(xp(i), 0, 0)[2] - ((fg[i] || 0) > .05 || i === hov ? 1e6 : 0)]; }).sort(function (a, b) { return b[1] - a[1]; }).forEach(function (e) { pill(e[0], PN); });
      X.globalAlpha = 1; legend();
    }
    function frame(now) {
      if (dead) { loopOn = false; return; }
      now = now || performance.now();
      var dtf = Math.min(3, Math.max(.25, (now - tLast) / 16.667)); tLast = now;
      var k14 = 1 - Math.pow(.86, dtf), k16 = 1 - Math.pow(.84, dtf), k12 = 1 - Math.pow(.88, dtf), k22 = 1 - Math.pow(.78, dtf), mvg = false;
      if (auto && !drag && !pres) th += .0004 * dtf;
      if (tv) { th += (tv.th - th) * k22; ph += (tv.ph - ph) * k22; if (Math.abs(tv.th - th) < .002 && Math.abs(tv.ph - ph) < .002) { th = tv.th; ph = tv.ph; tv = null; } else mvg = true; }
      pf += (PM - pf) * k12; if (Math.abs(PM - pf) < .002) pf = PM; else mvg = true; GAP = 1.55 + .35 * pf;
      if (pres) presStep(now);
      var sn = function (a, b, k) { var d = b - a; if (Math.abs(d) < .002) return b; mvg = true; return a + d * k; };
      hF.forEach(function (_, i) {
        if (!pres) { hF[i] = sn(hF[i], tgF[i] || 0, k14); hP[i] = sn(hP[i], tgP[i] || 0, k14); }
        ds[i] = sn(ds[i], td[i] || 1, k14);
        var f0 = fi < 0 || i === fi ? 0 : 1, g0 = i === fi ? 1 : 0; fd[i] = sn(fd[i] || 0, f0, k16); fg[i] = sn(fg[i] || 0, g0, k16);
        if (!pres && gl[i] !== undefined && gl[i] < 1) { gl[i] = gl[i] > .995 ? 1 : gl[i] + (1 - gl[i]) * k14; mvg = true; }
      });
      draw();
      /* request the next frame only while something is moving; otherwise the loop sleeps until the next event */
      if ((auto || pres || mvg) && onScreen) requestAnimationFrame(frame); else loopOn = false;
    }

    /* ---- presentation: bars grow one by one (actual, then forecast) while the camera sweeps ---- */
    function playPresentation() {
      if (pres) presEnd();
      var n = rows.length; fi = -1; setHov(-1); ortho = false; named = false; tv = null;
      var Z = { t0: performance.now(), T0: hF.slice(), P0: hP.slice(), sh: 420, gap: Math.min(420, 3600 / Math.max(1, n - 1)), gd: 950, fl: 220, hold: 700, sweep: 1.1, e: 0 };
      Z.total = Z.sh + (n - 1) * Z.gap + Z.fl + Z.gd + Z.hold;
      return new Promise(function (res) { presRes = res; pres = Z; wake(); });
    }
    function presEnd() { pres = null; var r = presRes; presRes = null; wake(); if (r) r(); }
    function presStep(now) {
      var Z = pres, t = now - Z.t0, n = hF.length;
      for (var i = 0; i < n; i++) {
        if (t < Z.sh) { var u = eIO(t / Z.sh); hF[i] = (Z.T0[i] || 0) * (1 - u); hP[i] = (Z.P0[i] || 0) * (1 - u); gl[i] = 1 - u; }
        else { var s = t - Z.sh - i * Z.gap, uf_ = clamp01(s / Z.gd), up = clamp01((s - Z.fl) / Z.gd); hF[i] = (tgF[i] || 0) * eO(uf_); hP[i] = (tgP[i] || 0) * eO(up); gl[i] = eO(clamp01((up - .55) / .45)); }
      }
      var e = eIO(clamp01(t / Z.total)); th += Z.sweep * (e - Z.e); Z.e = e;
      if (t >= Z.total) { hF.forEach(function (_, i) { hF[i] = tgF[i] || 0; hP[i] = tgP[i] || 0; gl[i] = 1; }); presEnd(); }
    }

    /* ---- camera ---- */
    var R0 = function () { var r = W / H; return (11 + rows.length * 1.5) * (r > 0 ? Math.max(1, .9 / r) : 1); };
    function setCameraView(v, o) {
      auto = false; if (pres) presEnd(); o = o || {};
      if (typeof v === 'string') {
        var k = v.toLowerCase();
        if (VIEWS[k]) { tv = { th: th + wr(VIEWS[k][0] - th), ph: VIEWS[k][1] }; ortho = true; named = true; }
        else if (k === 'ortho') { ortho = true; named = false; }
        else if (k === 'perspective') { ortho = false; named = false; }
        else { tv = { th: th + wr(.75 - th), ph: 1.05 }; rad = R0(); TG = [0, 2.6, 0]; ortho = false; named = false; } /* reset | home | default */
      } else if (v && typeof v === 'object') {
        if (typeof v.theta === 'number' || typeof v.phi === 'number') tv = { th: typeof v.theta === 'number' ? th + wr(v.theta - th) : th, ph: Math.min(3.1, Math.max(.04, typeof v.phi === 'number' ? v.phi : ph)) };
        if (typeof v.zoom === 'number') rad = Math.min(60, Math.max(5, v.zoom));
        if (typeof v.ortho === 'boolean') ortho = v.ortho;
        named = false;
      }
      wake();
    }

    /* ---- interaction ---- */
    var ptr = new Map(), mvd = 0, pd = 0;
    function hit(e) {
      if (mode === 'line') return -1;
      var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      for (var j = zones.length - 1; j >= 0; j--) if (inPoly(x, y, zones[j][1])) return zones[j][0];
      return -1;
    }
    function setHov(i) { if (hov === i) return; hov = i; wake(); }
    function select(i) {
      var n = i === null || i === undefined || i < 0 || i >= rows.length ? -1 : i; if (n === fi) return;
      fi = n; wake();
      if (typeof D.onSelect === 'function') {
        var r = rows[fi];
        D.onSelect(fi < 0 ? null : { index: fi, period: r.a, fact: r.f, forecast: r.p, variancePct: dp[fi] }, fi);
      }
    }
    function pickBar(e) { var i = hit(e); select(i >= 0 && i !== fi ? i : -1); }
    var onDown = function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) { } ptr.set(e.pointerId, [e.clientX, e.clientY]); drag = 1; mvd = 0; pd = 0; cv.style.cursor = 'grabbing'; };
    var onMove = function (e) {
      if (!ptr.has(e.pointerId)) return; var o = ptr.get(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptr.size === 1) {
        var dx = e.clientX - o[0], dy = e.clientY - o[1]; mvd += Math.abs(dx) + Math.abs(dy);
        if (e.buttons & 6 || e.shiftKey) { var k = rad * .0016, Q = basis(); for (var j = 0; j < 3; j++) TG[j] += -dx * k * Q.r[j] + dy * k * Q.u[j]; }
        else { th -= dx * .01; ph = Math.min(3.1, Math.max(.04, ph - dy * .01)); tv = null; if (named) { named = false; ortho = false; } }
      } else if (ptr.size === 2) {
        var p = Array.from(ptr.values()), d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
        if (pd) rad = Math.min(60, Math.max(5, rad * pd / d)); pd = d; mvd += 9;
      }
      wake();
    };
    var onUp = function (e) {
      if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId); pd = 0;
      if (!ptr.size) { drag = 0; cv.style.cursor = 'grab'; if (mvd < 6 && e.type === 'pointerup') pickBar(e); }
      wake();
    };
    var onWheel = function (e) { e.preventDefault(); rad = Math.min(60, Math.max(5, rad * (1 + e.deltaY * (e.ctrlKey ? .01 : .001)))); wake(); };
    var onHover = function (e) {
      if (e.pointerType !== 'mouse' || ptr.size) { tip.style.display = 'none'; return; }
      var b = cv.getBoundingClientRect(), i = hit(e), h = i >= 0; setHov(h ? i : -1);
      if (h && D.tooltip) {
        var r = rows[i];
        tip.textContent = r.a + '\n' + lang.fact + ': ' + uf(r.f * fx) + '\n' + lang.forecast + ': ' + (r.p == null ? '—' : uf(r.p * fx)) + '\n' + lang.variance + ': ' + (dl[i] || '—');
        tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - b.left + 14, b.width - 190) + 'px'; tip.style.top = (e.clientY - b.top + 14) + 'px';
      } else tip.style.display = 'none';
    };
    var onLeave = function () { tip.style.display = 'none'; setHov(-1); };
    var onDbl = function () { setCameraView('reset'); };
    var onCtx = function (e) { e.preventDefault(); };
    if (D.interactive) {
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
      cv.addEventListener('pointermove', onHover); cv.addEventListener('pointerleave', onLeave); cv.addEventListener('dblclick', onDbl); cv.addEventListener('contextmenu', onCtx);
      if (D.zoomOnWheel) cv.addEventListener('wheel', onWheel, { passive: false });
    }

    /* ---- sizing, visibility ---- */
    function resize() {
      var w = wrap.clientWidth, h = wrap.clientHeight; DPR = Math.min(window.devicePixelRatio || 1, D.maxDPR); FOK = 0;
      cv.width = Math.max(1, Math.round(w * DPR)); cv.height = Math.max(1, Math.round(h * DPR)); W = Math.max(1, w); H = Math.max(1, h);
      if (!rdy && w > 0 && h > 0) { rdy = true; rad = R0(); }
      wake();
    }
    var RO = null, IO = null, onWinResize = null;
    if (typeof ResizeObserver !== 'undefined') { RO = new ResizeObserver(resize); RO.observe(wrap); } else { onWinResize = resize; window.addEventListener('resize', resize); }
    if (typeof IntersectionObserver !== 'undefined') {
      IO = new IntersectionObserver(function (en) { onScreen = en[en.length - 1].isIntersecting; if (onScreen) wake(); });
      IO.observe(wrap);
    }

    /* ---- export ---- */
    function render(scale) {
      var s = scale > 0 ? scale : Math.max(1, Math.min(2, 4096 / Math.max(W, H))), ex = document.createElement('canvas');
      ex.width = Math.round(W * s); ex.height = Math.round(H * s); var g = ex.getContext('2d');
      if (D.background) {
        try { g.save(); g.translate(ex.width / 2, 0); g.scale(1.2 * ex.width, .9 * ex.height); var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, T.bg[0]); gr.addColorStop(.72, T.bg[1]); gr.addColorStop(1, T.bg[1]); g.fillStyle = gr; g.fillRect(-.5 / 1.2, 0, 1 / 1.2, 1 / .9); g.restore(); }
        catch (e) { g.restore(); g.fillStyle = 'rgb(' + T.fog + ')'; g.fillRect(0, 0, ex.width, ex.height); }
      }
      var sX = X, sD = DPR, sH = hov, sZ = zones; X = g; DPR = s; EXP = true; hov = -1;
      try { draw(); } finally { X = sX; DPR = sD; EXP = false; hov = sH; zones = sZ; }
      return ex;
    }
    function exportPNG(o) {
      o = o || {};
      return new Promise(function (res, rej) {
        try {
          render(o.scale).toBlob(function (b) {
            if (!b) { rej(new Error('Income3D: PNG export failed')); return; }
            if (o.download) {
              var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = o.filename || 'income-3d.png'; a.style.display = 'none';
              document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
            }
            res(b);
          }, 'image/png');
        } catch (e) { rej(e); }
      });
    }

    /* ---- public api ---- */
    dataCode = String(D.dataCurrency || D.currency).toUpperCase(); if (dataCode === '%') dataCode = 'PCT';
    applyLocale(D.locale); applyCurrency(D.currency); applyTheme(D.theme);
    rows = normalize(D.data); build(false); resize(); update(D.animate === false);

    return {
      updateData: setData,
      playPresentation: playPresentation,
      stopPresentation: function () { if (pres) presEnd(); },
      exportPNG: exportPNG,
      toDataURL: function (scale) { return render(scale).toDataURL('image/png'); },
      setCameraView: setCameraView,
      setTheme: function (n) { applyTheme(n); },
      setPalette: function (p) { applyPalette(p); },
      setCurrency: function (c) { applyCurrency(c); update(); },
      setLocale: function (l) { applyLocale(l); update(); },
      setMode: function (m) { mode = m === 'line' || m === 'bars' ? m : 'all'; FOK = 0; if (mode === 'line') { fi = -1; setHov(-1); } wake(); },
      setPair: function (on) { PM = on ? 1 : 0; wake(); },
      setAutoRotate: function (on) { auto = !!on; wake(); },
      setHideFar: function (on) { hideFar = !!on; wake(); },
      setLegend: function (on) { D.legend = !!on; wake(); },
      select: select,
      resize: resize,
      destroy: function () {
        dead = true; if (pres) presEnd(); if (RO) RO.disconnect(); if (IO) IO.disconnect(); if (onWinResize) window.removeEventListener('resize', onWinResize);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }
    };
  }

  /* ================= public class ================= */

  function Income3D(container, options) {
    if (!(this instanceof Income3D)) return new Income3D(container, options);
    this._ = engine(container, options || {});
  }
  var proto = Income3D.prototype;
  /* data: array of {period, fact, forecast, factor?} or [period, fact, forecast, factor?]; opts.animate=false snaps bars */
  proto.updateData = function (data, opts) { this._.updateData(data, opts); return this; };
  /* returns a Promise that resolves when the animation ends (or is stopped) */
  proto.playPresentation = function () { return this._.playPresentation(); };
  proto.stopPresentation = function () { this._.stopPresentation(); return this; };
  /* returns Promise<Blob>; {download:true, filename, scale} also saves the file */
  proto.exportPNG = function (opts) { return this._.exportPNG(opts); };
  /* synchronous PNG data URL — handy for <img> / long-press saving in Telegram Mini Apps */
  proto.toDataURL = function (scale) { return this._.toDataURL(scale); };
  /* 'front'|'back'|'right'|'left'|'top'|'bottom'|'perspective'|'ortho'|'reset' or {theta, phi, zoom, ortho} */
  proto.setCameraView = function (view, opts) { this._.setCameraView(view, opts); return this; };
  proto.setTheme = function (name) { this._.setTheme(name); return this; };
  /* 'amethyst'|'coral'|'emerald'|'classic' or {fact:'#hex', forecast:'#hex'} */
  proto.setPalette = function (p) { this._.setPalette(p); return this; };
  proto.setCurrency = function (code) { this._.setCurrency(code); return this; };
  proto.setLocale = function (loc) { this._.setLocale(loc); return this; };
  proto.setMode = function (m) { this._.setMode(m); return this; };
  proto.setPair = function (on) { this._.setPair(on); return this; };
  proto.setAutoRotate = function (on) { this._.setAutoRotate(on); return this; };
  proto.setHideFar = function (on) { this._.setHideFar(on); return this; };
  proto.setLegend = function (on) { this._.setLegend(on); return this; };
  proto.select = function (index) { this._.select(index); return this; };
  proto.resize = function () { this._.resize(); return this; };
  proto.destroy = function () { this._.destroy(); };

  Income3D.version = '1.0.0';
  Income3D.themes = Object.keys(THEMES);
  Income3D.palettes = Object.keys(PALETTES);
  return Income3D;
});
