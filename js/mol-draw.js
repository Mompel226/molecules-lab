/* ============================================================
   mol-draw.js — one drawing vocabulary for the whole Molecules Lab (memory: "do not confuse students with different
   animations"). Every atom, glucose ring, fatty acid, amino acid, base pair and test tube of this lab is drawn here, on a
   canvas, so that a glucose molecule looks the same in every station and the same as in the Membrane Lab.

   TRUE SHAPES. The ball-and-stick models are built from real bond lengths and angles (in ångströms): glucose is a chair
   of five carbons and one oxygen (alpha-D-glucose, the form in starch and glycogen), palmitic acid is a zigzag of 16 carbons,
   glycerol has three carbons, alanine is a central carbon with its four groups. tools/mol-check.mjs counts their atoms
   against their formulas: C6H12O6, C16H32O2, C3H8O3, C3H7NO2.

   The atoms keep the colours of the Y7 cell game and the Membrane Lab (oxygen coral, hydrogen white, carbon slate,
   nitrogen blue). The bases keep the Inheritance Lab's colours (A blue, T red, G green, C yellow). The colours of the food
   tests are the Digestion Lab's. These pictures are a dark "screen" in the bright and the dark version alike.
   ============================================================ */
(function (global) {
  'use strict';
  var TAU = Math.PI * 2;
  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function ease(k) { k = clamp(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function hex3(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mixHex(a, b, k) {
    var A = hex3(a), B = hex3(b), f = function (i) { var v = Math.round(lerp(A[i], B[i], k)).toString(16); return v.length < 2 ? '0' + v : v; };
    return '#' + f(0) + f(1) + f(2);
  }
  function rgba(h, a) { var p = hex3(h); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  var C = {
    /* the screens */
    air0: '#0E1D2E', air1: '#142A40', edge: 'rgba(176,212,240,.28)', soft: 'rgba(214,232,247,.72)',
    /* atoms */
    O: ['#FFD9D2', '#FF7468', '#B83A34'], H: ['#FFFFFF', '#E6EEF5', '#94A6B6'], C: ['#C7D0DF', '#76839C', '#3E4A61'], N: ['#D7E7FF', '#6FA5FF', '#2D5FB8'],
    /* the building blocks */
    sugar: '#FFC95C', sugarLo: '#B9831C', sugarHi: '#FFE9B3',
    glycerol: ['#FFE7BD', '#F2A65A', '#A8622A'], tail: '#F7E7C4', tailLo: '#B79A62',
    /* bases: the Inheritance Lab's four colours on a dark ground */
    A: '#6FA8EC', T: '#F06A5E', G: '#6EDB9A', Cy: '#FDE047', strand: '#C9D6E4', strandLo: '#6C7E92', bond: '#FFFFFF',
    /* glass and the bench */
    glass: 'rgba(214,236,250,.62)', glassHi: 'rgba(255,255,255,.65)', bench0: '#1B3147', bench1: '#12222F', wood: '#4A3A2B',
    /* the food tests: the same colours as the Digestion Lab's bench */
    water: '#E6F2F8', clear: '#1C3349', iodine: '#C77B34', blueBlack: '#21203A', ben: ['#3E6FA8', '#4E9A6A', '#C9B23A', '#D98F2E', '#B6412A'], biuret: '#4F86C6', purple: '#7A3FA8',
    dcpip: '#2F6FD0', ethanol: '#E8F1F7', cloud: '#F4F6F8', oil: '#E6C25A'
  };
  /* twenty kinds of amino acid, each one colour, kept clear of the extension violet */
  var AA = ['#6FA8EC', '#2DD4BF', '#6EDB9A', '#BEF264', '#FDE047', '#FBBF24', '#FB923C', '#F87171', '#F472B6', '#FDA4AF',
            '#38BDF8', '#5EEAD4', '#86EFAC', '#D9F99D', '#FEF08A', '#FCD34D', '#FDBA74', '#FCA5A5', '#F9A8D4', '#CBD5E1'];

  /* ---------- the plain shapes ---------- */
  function ball(g, x, y, r, c3) {
    var rg = g.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r);
    rg.addColorStop(0, c3[0]); rg.addColorStop(.48, c3[1]); rg.addColorStop(1, c3[2]);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  }
  function ground(c, x, y, w, h, top, bottom) {
    var lg = c.createLinearGradient(0, y, 0, y + h);
    lg.addColorStop(0, top || C.air1); lg.addColorStop(1, bottom || C.air0);
    c.fillStyle = lg; c.fillRect(x, y, w, h);
  }
  function frame(c, x, y, w, h, r, paint) {
    c.save(); rr(c, x, y, w, h, r); c.clip(); paint(); c.restore();
    c.save(); rr(c, x, y, w, h, r); c.strokeStyle = C.edge; c.lineWidth = 1.2; c.stroke(); c.restore();
  }
  /* a movement arrow: one filled shape with a fixed head (memory concentration-pictures-equal-volumes) */
  function arrow(c, x0, y0, x1, y1, w, fill, o) {
    o = o || {};
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy); if (L < 1) return;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hL = o.head || Math.max(13, w * 1.5), hW = o.headW || Math.max(10, w * 1.25);
    if (hL > L * .7) { var q = L * .7 / hL; hL *= q; hW *= q; }
    var bx = x1 - ux * hL, by = y1 - uy * hL, s = w / 2;
    c.beginPath();
    c.moveTo(x0 + nx * s, y0 + ny * s); c.lineTo(bx + nx * s, by + ny * s); c.lineTo(bx + nx * hW, by + ny * hW);
    c.lineTo(x1, y1); c.lineTo(bx - nx * hW, by - ny * hW); c.lineTo(bx - nx * s, by - ny * s); c.lineTo(x0 - nx * s, y0 - ny * s);
    c.closePath();
    if (o.halo !== false) { c.strokeStyle = o.halo || 'rgba(9,18,28,.75)'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); }
    c.fillStyle = fill; c.fill();
  }

  /* ======================================================================= the ball-and-stick models */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function unit(a) { var L = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; }
  var TET = 109.47 * Math.PI / 180;
  /* the three other corners of a tetrahedron, given the direction `u` of the bond it already has */
  function around(u, phase) {
    u = unit(u);
    var ref = Math.abs(u[2]) < .9 ? [0, 0, 1] : [1, 0, 0], p = unit(cross(u, ref)), q = cross(u, p), out = [];
    for (var k = 0; k < 3; k++) {
      var f = (phase || 0) + k * TAU / 3;
      out.push(unit(add(mul(u, Math.cos(TET)), mul(add(mul(p, Math.cos(f)), mul(q, Math.sin(f))), Math.sin(TET)))));
    }
    return out;
  }
  function Builder() {
    var atoms = [], bonds = [];
    return {
      atoms: atoms, bonds: bonds,
      at: function (e, p) { atoms.push({ e: e, p: p }); return atoms.length - 1; },
      bond: function (a, b, n) { bonds.push([a, b, n || 1]); },
      /* an −OH on atom i, in direction d */
      oh: function (i, d) {
        var o = this.at('O', add(atoms[i].p, mul(unit(d), 1.43))); this.bond(i, o);
        var h = this.at('H', add(atoms[o].p, mul(around(sub(atoms[i].p, atoms[o].p), .6)[0], .96))); this.bond(o, h);
        return o;
      },
      h: function (i, d) { var x = this.at('H', add(atoms[i].p, mul(unit(d), 1.09))); this.bond(i, x); return x; },
      done: function (name) {
        var n = atoms.length, m = [0, 0, 0];
        atoms.forEach(function (a) { m = add(m, a.p); });
        m = mul(m, 1 / n);
        atoms.forEach(function (a) { a.p = sub(a.p, m); });
        var R = 0; atoms.forEach(function (a) { R = Math.max(R, Math.sqrt(a.p[0] * a.p[0] + a.p[1] * a.p[1] + a.p[2] * a.p[2])); });
        return { name: name, atoms: atoms, bonds: bonds, R: R };
      }
    };
  }
  function glucoseModel() {
    var B = Builder(), ring = [];
    for (var k = 0; k < 6; k++) {
      var a = k * TAU / 6, s = k % 2 ? -1 : 1;
      ring.push(B.at(k === 5 ? 'O' : 'C', [1.43 * Math.cos(a), 1.43 * Math.sin(a), s * .25]));
    }
    for (var j = 0; j < 6; j++) B.bond(ring[j], ring[(j + 1) % 6]);
    for (var i = 0; i < 5; i++) {
      var an = i * TAU / 6, sg = i % 2 ? -1 : 1, eq = unit([Math.cos(an), Math.sin(an), -sg * .33]), ax = [0, 0, sg];
      if (i === 0) { B.h(ring[i], eq); B.oh(ring[i], ax); }       /* alpha-glucose, the form in starch and glycogen */
      else B.h(ring[i], ax);
      if (i > 0 && i < 4) B.oh(ring[i], eq);
      else if (i === 0) { /* done above */ }
      else {
        var c6 = B.at('C', add(B.atoms[ring[i]].p, mul(eq, 1.52))); B.bond(ring[i], c6);
        var d = around(sub(B.atoms[ring[i]].p, B.atoms[c6].p), .4);
        B.oh(c6, d[0]); B.h(c6, d[1]); B.h(c6, d[2]);
      }
    }
    return B.done('glucose');
  }
  function fattyModel() {
    var B = Builder(), N = 16, cs = [], STEP = 1.27, Y = .42;
    for (var i = 0; i < N; i++) cs.push(B.at('C', [i * STEP, i % 2 ? Y : -Y, 0]));
    for (var j = 0; j < N - 1; j++) B.bond(cs[j], cs[j + 1]);
    /* the acid end: C=O and −OH */
    var o1 = B.at('O', add(B.atoms[cs[0]].p, [-.62, -1.05, 0])); B.bond(cs[0], o1, 2);
    var o2 = B.at('O', add(B.atoms[cs[0]].p, [-1.15, .68, 0])); B.bond(cs[0], o2);
    var h0 = B.at('H', add(B.atoms[o2].p, [-.72, -.62, 0])); B.bond(o2, h0);
    for (var k = 1; k < N - 1; k++) { var s = k % 2 ? 1 : -1; B.h(cs[k], [0, s * .58, .82]); B.h(cs[k], [0, s * .58, -.82]); }
    var e = around(sub(B.atoms[cs[N - 2]].p, B.atoms[cs[N - 1]].p), .5);
    e.forEach(function (d) { B.h(cs[N - 1], d); });
    return B.done('fatty acid');
  }
  function glycerolModel() {
    var B = Builder(), c = [B.at('C', [-1.27, -.42, 0]), B.at('C', [0, .42, 0]), B.at('C', [1.27, -.42, 0])];
    B.bond(c[0], c[1]); B.bond(c[1], c[2]);
    B.oh(c[0], [-.6, -.8, .1]); B.h(c[0], [-.5, .35, .85]); B.h(c[0], [-.5, .35, -.85]);
    B.oh(c[1], [0, .95, .3]); B.h(c[1], [0, .3, -.95]);
    B.oh(c[2], [.6, -.8, .1]); B.h(c[2], [.5, .35, .85]); B.h(c[2], [.5, .35, -.85]);
    return B.done('glycerol');
  }
  function aminoModel() {
    var B = Builder(), ca = B.at('C', [0, 0, 0]);
    var dirs = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(unit);
    var n = B.at('N', mul(dirs[0], 1.47)); B.bond(ca, n);
    var nb = around(sub(B.atoms[ca].p, B.atoms[n].p), .3);
    var h1 = B.at('H', add(B.atoms[n].p, mul(nb[0], 1.01))); B.bond(n, h1);
    var h2 = B.at('H', add(B.atoms[n].p, mul(nb[1], 1.01))); B.bond(n, h2);
    var cc = B.at('C', mul(dirs[1], 1.53)); B.bond(ca, cc);
    var cb = around(sub(B.atoms[ca].p, B.atoms[cc].p), .2);
    var o1 = B.at('O', add(B.atoms[cc].p, mul(cb[0], 1.22))); B.bond(cc, o1, 2);
    B.oh(cc, cb[1]);
    var r = B.at('C', mul(dirs[2], 1.53)); B.bond(ca, r);
    around(sub(B.atoms[ca].p, B.atoms[r].p), .1).forEach(function (d) { B.h(r, d); });
    B.h(ca, dirs[3]);
    return B.done('amino acid');
  }
  var MODELS = { glucose: glucoseModel(), fatty: fattyModel(), glycerol: glycerolModel(), amino: aminoModel() };
  function formula(m) { var n = {}; m.atoms.forEach(function (a) { n[a.e] = (n[a.e] || 0) + 1; }); return n; }

  var RAD = { C: .42, H: .25, O: .40, N: .40 };
  function turn(p, yaw, pitch, roll) {
    var cr = Math.cos(roll || 0), sr = Math.sin(roll || 0), x0 = p[0] * cr - p[1] * sr, y0 = p[0] * sr + p[1] * cr;
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x = x0 * cy + p[2] * sy, z = -x0 * sy + p[2] * cy, y = y0 * cp - z * sp, zz = y0 * sp + z * cp;
    return [x, y, zz];
  }
  /* draw a model at (cx, cy), s px to the ångström. o: { yaw, pitch, only: 'C'|'H'|'O'|'N' lights one element, alpha } */
  function model(c, m, cx, cy, s, o) {
    o = o || {};
    var P = m.atoms.map(function (a) { return turn(a.p, o.yaw || 0, o.pitch || 0, o.roll || 0); }), items = [], al = o.alpha == null ? 1 : o.alpha;
    m.bonds.forEach(function (b) { items.push({ z: (P[b[0]][2] + P[b[1]][2]) / 2 - .01, b: b }); });
    m.atoms.forEach(function (a, i) { items.push({ z: P[i][2], a: a, p: P[i] }); });
    items.sort(function (x, y) { return x.z - y.z; });
    items.forEach(function (it) {
      if (it.b) {
        var p = P[it.b[0]], q = P[it.b[1]], lit = !o.only || m.atoms[it.b[0]].e === o.only || m.atoms[it.b[1]].e === o.only;
        c.globalAlpha = al * (lit ? 1 : .22);
        var dbl = it.b[2] === 2, dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * .1 * s, ny = dx / L * .1 * s;
        c.lineCap = 'round';
        (dbl ? [-1, 1] : [0]).forEach(function (k) {
          c.strokeStyle = '#5F6E82'; c.lineWidth = s * (dbl ? .13 : .2);
          c.beginPath(); c.moveTo(cx + p[0] * s + k * nx, cy + p[1] * s + k * ny); c.lineTo(cx + q[0] * s + k * nx, cy + q[1] * s + k * ny); c.stroke();
          c.strokeStyle = '#AEBBCB'; c.lineWidth = s * (dbl ? .05 : .08);
          c.beginPath(); c.moveTo(cx + p[0] * s + k * nx, cy + p[1] * s + k * ny); c.lineTo(cx + q[0] * s + k * nx, cy + q[1] * s + k * ny); c.stroke();
        });
      } else {
        var on = !o.only || it.a.e === o.only;
        c.globalAlpha = al * (on ? 1 : .22);
        ball(c, cx + it.p[0] * s, cy + it.p[1] * s, RAD[it.a.e] * s, C[it.a.e]);
        if (o.only && on) { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx + it.p[0] * s, cy + it.p[1] * s, RAD[it.a.e] * s + 1.5, 0, TAU); c.stroke(); }
      }
    });
    c.globalAlpha = 1;
    return P;
  }

  /* ======================================================================= the building blocks, drawn flat */
  /* one glucose, as its ring. The corners are the real atoms, in their real order: carbon 1 at the angle `rot`, then the
     ring's oxygen, carbon 5, carbon 4 (opposite carbon 1), carbon 3 and carbon 2. `flip` shows the ring from its other face. */
  function ringAt(q, r, atom) {
    var sg = q.flip ? 1 : -1, off = { C1: 0, O: 1, C5: 2, C4: 3 }[atom], a = q.rot + sg * off * TAU / 6;
    return [q.x + r * Math.cos(a), q.y + r * Math.sin(a), a];
  }
  function glc(c, x, y, r, rot, alpha, hi, flip) {
    if (alpha != null) c.globalAlpha = alpha;
    c.beginPath();
    for (var i = 0; i < 6; i++) { var a = rot + i * TAU / 6; c[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); }
    c.closePath();
    var rg = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r * 1.15);
    rg.addColorStop(0, hi ? 'rgba(255,233,179,.85)' : 'rgba(255,233,179,.52)'); rg.addColorStop(1, hi ? 'rgba(255,201,92,.45)' : 'rgba(255,201,92,.18)');
    c.fillStyle = rg; c.fill();
    c.lineJoin = 'round'; c.strokeStyle = C.sugarLo; c.lineWidth = r * .36; c.stroke();
    c.strokeStyle = C.sugar; c.lineWidth = r * .22; c.stroke();
    var o = ringAt({ x: x, y: y, rot: rot, flip: flip }, r, 'O');
    ball(c, o[0], o[1], r * .2, C.O);
    if (alpha != null) c.globalAlpha = 1;
  }
  /* the link between two glucose molecules, where it really is: from carbon 4 of one (`kind` 'c'), or at a branch from the
     carbon 6 that stands out from its carbon 5 (`kind` 'b'), through one oxygen atom, to carbon 1 of the next. Never through a ring. */
  function joinPoints(a, b, r, kind) {
    var end = ringAt(b, r, 'C1'), from, stub = null;
    if (kind === 'b') { var c5 = ringAt(a, r, 'C5'); stub = [c5[0], c5[1]]; from = [c5[0] + r * .8 * Math.cos(c5[2]), c5[1] + r * .8 * Math.sin(c5[2])]; }
    else { var c4 = ringAt(a, r, 'C4'); from = [c4[0], c4[1]]; }
    return { stub: stub, from: from, to: [end[0], end[1]], o: [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2] };
  }
  function joinLink(c, a, b, r, kind, w, alpha) {
    var q = joinPoints(a, b, r, kind);
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.lineCap = 'round';
    [[C.sugarLo, w + 1.2], [C.sugar, w]].forEach(function (t) {
      c.strokeStyle = t[0]; c.lineWidth = t[1]; c.beginPath();
      if (q.stub) { c.moveTo(q.stub[0], q.stub[1]); c.lineTo(q.from[0], q.from[1]); } else c.moveTo(q.from[0], q.from[1]);
      c.lineTo(q.to[0], q.to[1]); c.stroke();
    });
    ball(c, q.o[0], q.o[1], Math.max(1.5, r * .24), C.O);
    c.globalAlpha = 1;
  }
  /* a fatty acid: a zigzag tail from (x, y) along angle `ang`; `kink` bends it after the middle (a C=C, in an oil) */
  function tailPts(x, y, ang, n, step, kink) {
    var pts = [[x, y]], a = ang, px = x, py = y;
    for (var i = 1; i <= n; i++) {
      if (kink && i === Math.round(n * .5)) a += kink;
      var zig = (i % 2 ? 1 : -1) * .52, d = a + zig;
      px += step * Math.cos(d); py += step * Math.sin(d);
      pts.push([px, py]);
    }
    return pts;
  }
  function tail(c, pts, w, alpha) {
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.lineJoin = 'round'; c.lineCap = 'round';
    [[C.tailLo, w + 1.5], [C.tail, w]].forEach(function (q) {
      c.strokeStyle = q[0]; c.lineWidth = q[1];
      c.beginPath(); pts.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.stroke();
    });
    c.globalAlpha = 1;
  }
  /* glycerol: an upright bar with its three joining places, at (x, y), height h */
  function glycerolBar(c, x, y, h, w, alpha, places) {
    c.globalAlpha = alpha == null ? 1 : alpha;
    rr(c, x - w / 2, y - h / 2, w, h, w / 2.2);
    var lg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    lg.addColorStop(0, C.glycerol[0]); lg.addColorStop(.45, C.glycerol[1]); lg.addColorStop(1, C.glycerol[2]);
    c.fillStyle = lg; c.fill(); c.strokeStyle = 'rgba(70,38,12,.8)'; c.lineWidth = 1; c.stroke();
    /* the three places on glycerol where a fatty acid joins */
    (places || []).forEach(function (py) {
      c.beginPath(); c.arc(x + w / 2, py, Math.max(3, w * .16), 0, TAU); c.fillStyle = '#FFF3D6'; c.fill(); c.strokeStyle = '#7A4720'; c.lineWidth = 1.2; c.stroke();
    });
    c.globalAlpha = 1;
  }
  /* one amino acid: a bead in the colour of its kind */
  function bead(c, x, y, r, kind, alpha) {
    if (alpha != null) c.globalAlpha = alpha;
    var col = AA[kind % AA.length];
    ball(c, x, y, r, [mixHex(col, '#FFFFFF', .62), col, mixHex(col, '#0B1420', .5)]);
    if (alpha != null) c.globalAlpha = 1;
  }

  /* ======================================================================= DNA
     `n` base pairs along the x axis, 0.34 nm apart, ten to a turn, the two strands at opposite sides of the axis.
     o: { x0, y, dx, R, twist (0 flat ladder … 1 full helix), turn (the drag), seq, show: bases, bonds, letters, second (0…1
     how far the second strand has come in), secondOff }. */
  var PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' };
  function baseCol(b) { return b === 'A' ? C.A : b === 'T' ? C.T : b === 'G' ? C.G : C.Cy; }
  function helix(c, o) {
    var seq = o.seq, n = seq.length, tw = o.twist == null ? 1 : o.twist, R = o.R, dx = o.dx, x0 = o.x0, y0 = o.y, base = o.turn || 0;
    var sec = o.second == null ? 1 : o.second, pts = [], items = [], GAP = o.gap == null ? 5 : o.gap;
    for (var i = 0; i < n; i++) {
      var a = base + tw * i * TAU / 10, cs = Math.cos(a), sn = Math.sin(a);
      var off = (1 - ease(clamp(sec * 1.4 - i * .4 / n))) * (o.secondOff || 0);
      pts.push({ i: i, x: x0 + i * dx, y1: y0 - R * cs, z1: sn, y2: y0 + R * cs + off, z2: -sn, b: seq[i], p: PAIR[seq[i]], off: off, s: cs >= 0 ? 1 : -1 });
    }
    function strandPath(key, keyZ) {
      /* a strand is a smooth curve: each stretch between two bases is drawn in short pieces, each at its own depth */
      var sg = key === 'y1' ? -1 : 1, SUB = 6;
      function at(j, u) {
        var f = j + u, a = base + tw * f * TAU / 10, cs = Math.cos(a), sn = Math.sin(a), off = sg > 0 ? lerp(pts[j].off, pts[j + 1].off, u) : 0;
        return { x: x0 + f * dx, y: y0 + sg * R * cs + off, z: sg < 0 ? sn : -sn };
      }
      for (var j = 0; j < n - 1; j++) for (var m = 0; m < SUB; m++) {
        var P0 = at(j, m / SUB), Q0 = at(j, (m + 1) / SUB);
        items.push({ z: (P0.z + Q0.z) / 2, f: function (P, Q, zz) { return function () {
          var w = o.w * (.72 + .28 * (zz + 1) / 2);
          c.lineCap = 'round'; c.strokeStyle = C.strandLo; c.lineWidth = w + 1.6 / (o.cam || 1);
          c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(Q.x, Q.y); c.stroke();
          c.strokeStyle = mixHex(C.strandLo, C.strand, .35 + .65 * (zz + 1) / 2); c.lineWidth = w;
          c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(Q.x, Q.y); c.stroke();
        }; }(P0, Q0, (P0.z + Q0.z) / 2) });
      }
    }
    strandPath('y1', 'z1');
    if (sec > 0) strandPath('y2', 'z2');
    pts.forEach(function (p) {
      var z = (p.z1 + p.z2) / 2 + .001 * p.i;
      items.push({ z: z, f: function () {
        var w = Math.max(2.4, dx * .68), near = .8 + .2 * Math.abs(Math.cos(base + tw * p.i * TAU / 10));
        var e1 = y0 - p.s * GAP, s2 = y0 + p.s * GAP + p.off;
        c.lineCap = 'butt';
        c.globalAlpha = o.dimBases ? .35 : 1;
        if (Math.abs(p.y1 - e1) > 1 && (p.y1 - y0) * p.s < 0) { c.strokeStyle = mixHex('#0B1420', baseCol(p.b), near); c.lineWidth = w; c.beginPath(); c.moveTo(p.x, p.y1); c.lineTo(p.x, e1); c.stroke(); }
        if (sec > 0 && Math.abs(p.y2 - s2) > 1 && (p.y2 - s2) * p.s > 0) { c.strokeStyle = mixHex('#0B1420', baseCol(p.p), near); c.lineWidth = w; c.beginPath(); c.moveTo(p.x, s2); c.lineTo(p.x, p.y2); c.stroke(); }
        c.globalAlpha = 1;
        /* the bonds between a pair: two between A and T, three between C and G */
        if (o.show && o.show.bonds && sec >= 1 && p.off < .5 && Math.abs(p.y2 - p.y1) > GAP * 3) {
          var nb = p.b === 'A' || p.b === 'T' ? 2 : 3;
          c.strokeStyle = 'rgba(255,255,255,' + (o.bondAlpha == null ? .95 : o.bondAlpha) + ')'; c.lineWidth = 1.4 / (o.cam || 1); c.setLineDash([2 / (o.cam || 1), 1.6 / (o.cam || 1)]);
          c.beginPath();
          for (var q = 0; q < nb; q++) { var bx = p.x + (nb === 2 ? (q ? .2 : -.2) : (q - 1) * .3) * w; c.moveTo(bx, y0 - GAP); c.lineTo(bx, y0 + GAP); }
          c.stroke(); c.setLineDash([]);
        }
        if (o.show && o.show.letters && Math.abs(p.y2 - p.y1) > 30) {
          c.font = '700 ' + Math.min(13, dx * .92) + 'px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = '#0B1420';
          c.fillText(p.b, p.x, (p.y1 + e1) / 2);
          if (sec > 0) c.fillText(p.p, p.x, (s2 + p.y2) / 2);
        }
      } });
    });
    items.sort(function (a, b) { return a.z - b.z; });
    items.forEach(function (it) { it.f(); });
    return pts;
  }
  /* the true shape of DNA, whatever the twist: each strand keeps its length as it coils. A base pair is 2 nm wide and
     0.34 nm from the next; between neighbours a strand runs 0.71 nm. So when the flat ladder (30 px between pairs) coils,
     the pairs move to 14.4 px apart and the half-width stays 42 px, and the camera moves in to fill the picture. */
  /* every length is multiplied by the same 8/7, so the picture has the column and the proportions stay true */
  function dnaGeom(tw) { var Z = 8 / 7; return { dx: lerp(30, 14.4, tw) * Z, R: 42 * Z, cam: lerp(1, 2.02, tw) }; }

  /* ======================================================================= the bench
     A test tube at (x, y) = the middle of its mouth, w wide, h long. liq: { col, level 0…1, cloud 0…1, ppt 0…1 (a
     settled solid), oil 0…1 (a layer floating on top), bits (a suspension) }. */
  var LIGHT = false;
  function setLight(v) { LIGHT = !!v; }
  /* the white tile a test is read against: blue-black on the dark ground of a screen could not be seen */
  function tile(c, x, y, w, h) {
    rr(c, x, y, w, h, 12);
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#FBFCFD'); g.addColorStop(1, '#E4EAEF');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#AEBBC7'; c.lineWidth = 1; c.stroke();
  }
  function tubePath(c, x, y, w, h) {
    var r = w / 2;
    c.beginPath(); c.moveTo(x - r, y); c.lineTo(x - r, y + h - r); c.arc(x, y + h - r, r, Math.PI, 0, true); c.lineTo(x + r, y);
  }
  function tube(c, x, y, w, h, liq, tilt) {
    c.save();
    if (tilt) { c.translate(x, y + h * .5); c.rotate(tilt); c.translate(-x, -(y + h * .5)); }
    var r = w / 2;
    c.save(); tubePath(c, x, y, w, h); c.closePath(); c.fillStyle = 'rgba(190,220,240,.07)'; c.fill(); c.clip();
    if (liq && liq.level > 0) {
      var top = y + h * lerp(1 - liq.level, liq.level, liq.anchor || 0);   /* anchor 1: a tube tipped past level holds its liquid at the mouth */
      /* the surface stays level when the tube tilts */
      c.save();
      if (tilt) { c.translate(x, top); c.rotate(-tilt); c.translate(-x, -top); }
      c.fillStyle = liq.col; c.fillRect(x - w * 2, top, w * 4, h * 2);
      if (liq.cloud) {
        var g = c.createLinearGradient(0, top, 0, y + h);
        g.addColorStop(0, rgba(C.cloud, Math.min(1, liq.cloud))); g.addColorStop(1, rgba(C.cloud, Math.min(1, liq.cloud)));
        c.fillStyle = g; c.fillRect(x - w * 2, top, w * 4, h * 2);
      }
      /* a reagent just added lies on the surface until it has mixed in */
      if (liq.top && liq.top.f > 0) { c.fillStyle = liq.top.col; c.fillRect(x - w * 2, top, w * 4, (y + h - top) * liq.top.f); }
      if (liq.oil) { c.fillStyle = rgba(C.oil, .9); c.fillRect(x - w * 2, top, w * 4, h * .1 * liq.oil); }
      c.fillStyle = LIGHT ? 'rgba(70,96,120,.5)' : 'rgba(255,255,255,.5)'; c.fillRect(x - w * 2, top, w * 4, 1.6);
      c.restore();
      if (liq.ppt) {
        var pH = h * .16 * liq.ppt;
        var pg = c.createLinearGradient(0, y + h - pH, 0, y + h);
        pg.addColorStop(0, rgba(C.ben[4], .2)); pg.addColorStop(.4, rgba(C.ben[4], .95)); pg.addColorStop(1, '#8E2E1D');
        c.fillStyle = pg; c.fillRect(x - r, y + h - pH, w, pH);
      }
      if (liq.bits) {
        var R = rng(7); c.fillStyle = liq.bitsCol || 'rgba(255,255,255,.5)';
        for (var i = 0; i < liq.bits; i++) { var bx = x - r + 2 + R() * (w - 4), by = top + 3 + R() * (y + h - top - 8); c.beginPath(); c.arc(bx, by, .8 + R() * 1, 0, TAU); c.fill(); }
      }
    }
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x - r + w * .14, y, w * .13, h);
    c.restore();
    tubePath(c, x, y, w, h);
    c.strokeStyle = LIGHT ? 'rgba(62,86,110,.8)' : C.glass; c.lineWidth = 1.7; c.stroke();
    c.strokeStyle = LIGHT ? 'rgba(62,86,110,.95)' : 'rgba(230,244,252,.85)'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - r - 2.5, y); c.lineTo(x + r + 2.5, y); c.stroke();
    c.restore();
  }
  /* a test-tube rack, holding tubes along x0 … x1 at the height y */
  function rack(c, x0, x1, y, h) {
    rr(c, x0, y, x1 - x0, 9, 3); c.fillStyle = '#7A5C3F'; c.fill();
    rr(c, x0, y + h, x1 - x0, 10, 3); c.fillStyle = '#6A4E35'; c.fill();
    c.fillStyle = '#5A412C';
    c.fillRect(x0 + 5, y + 9, 5, h - 9); c.fillRect(x1 - 10, y + 9, 5, h - 9);
  }
  /* a dropping pipette, the tip at (x, y); `sq` 0…1 squeezes its bulb; col is what it holds */
  function dropper(c, x, y, col, sq, tilt) {
    c.save(); c.translate(x, y); if (tilt) c.rotate(tilt);
    var L = 34;
    c.fillStyle = 'rgba(214,236,250,.32)'; c.strokeStyle = LIGHT ? 'rgba(62,86,110,.85)' : C.glass; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-1.6, 0); c.lineTo(-5, -12); c.lineTo(-5, -L); c.lineTo(5, -L); c.lineTo(5, -12); c.lineTo(1.6, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-1, -2); c.lineTo(-4, -12); c.lineTo(-4, -24); c.lineTo(4, -24); c.lineTo(4, -12); c.lineTo(1, -2); c.closePath(); c.fill();
    var bw = 8.5 - 2.6 * (sq || 0);
    c.fillStyle = '#C94F44'; c.strokeStyle = '#7E2B23'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, -L - 10, bw, 11, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-bw * .35, -L - 14, bw * .22, 4, 0, 0, TAU); c.fill();
    c.restore();
  }
  function drop(c, x, y, col, r) {
    r = r || 3.6;
    c.fillStyle = col; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = .7;
    c.beginPath(); c.moveTo(x, y - r * 1.9); c.bezierCurveTo(x + r * .3, y - r, x + r, y - r * .4, x + r, y + r * .2);
    c.arc(x, y + r * .2, r, 0, Math.PI); c.bezierCurveTo(x - r, y - r * .4, x - r * .3, y - r, x, y - r * 1.9); c.closePath(); c.fill(); c.stroke();
  }
  /* a hot water bath: a beaker of hot water on a hot plate; `heat` 0…1 lights the plate, steam rises with the time t */
  function bath(c, x, y, w, h, heat, t) {
    var plateY = y + h;
    rr(c, x - w / 2 - 8, plateY, w + 16, 15, 3);
    var pg = c.createLinearGradient(0, plateY, 0, plateY + 15); pg.addColorStop(0, '#5F6B78'); pg.addColorStop(1, '#333C47');
    c.fillStyle = pg; c.fill();
    c.fillStyle = mixHex('#46515E', '#FF7A3C', heat); c.fillRect(x - w / 2 + 2, plateY, w - 4, 3.2);
    c.fillStyle = rgba('#7FC4EC', .36); c.fillRect(x - w / 2, y + h * .24, w, h * .76);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - w / 2, y + h * .24, w, 1.4);
    c.strokeStyle = LIGHT ? 'rgba(62,86,110,.85)' : C.glass; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - w / 2 - 3, y); c.lineTo(x - w / 2, y + 3); c.lineTo(x - w / 2, y + h); c.lineTo(x + w / 2, y + h); c.lineTo(x + w / 2, y + 3); c.lineTo(x + w / 2 + 3, y); c.stroke();
    if (heat > .02) {
      c.lineCap = 'round'; c.lineWidth = 2;
      for (var i = 0; i < 4; i++) {
        var u = ((t || 0) * .35 + i / 4) % 1, sx = x - w * .32 + i * w * .21, a = heat * .5 * Math.sin(u * Math.PI);
        c.strokeStyle = (LIGHT ? 'rgba(96,120,144,' : 'rgba(232,242,250,') + a.toFixed(3) + ')';
        c.beginPath(); c.moveTo(sx, y - 4 - u * 28);
        c.bezierCurveTo(sx + 6, y - 12 - u * 28, sx - 6, y - 20 - u * 28, sx + 2, y - 30 - u * 28); c.stroke();
      }
    }
  }

  global.MolDraw = {
    C: C, AA: AA, TAU: TAU, lerp: lerp, clamp: clamp, ease: ease, seg: seg, mixHex: mixHex, rgba: rgba, rng: rng,
    ball: ball, rr: rr, ground: ground, frame: frame, arrow: arrow,
    MODELS: MODELS, formula: formula, model: model, turn: turn,
    glc: glc, ringAt: ringAt, joinPoints: joinPoints, joinLink: joinLink, tailPts: tailPts, tail: tail, glycerolBar: glycerolBar, bead: bead,
    helix: helix, dnaGeom: dnaGeom, PAIR: PAIR, baseCol: baseCol, tile: tile, setLight: setLight,
    tube: tube, rack: rack, dropper: dropper, drop: drop, bath: bath
  };
})(window);
