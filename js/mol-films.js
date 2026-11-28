/* ============================================================
   mol-films.js — the Molecules Lab's step animations.

   Each step's words are in parts with their level: IGCSE lines first; IB lines name their statement of the IB Biology
   guide (2025) in a comment; Beyond lines are in neither syllabus. Every process is true at every frame:
   - a large molecule is only ever made of the small molecules the step shows, and a chain or strand keeps its length;
   - one large molecule never changes into another: its glucose molecules separate first, then join in the new way;
   - a fat is one glycerol joined to three fatty acids; a base on one strand meets only its partner (A with T, C with G);
   - a food test shows the true colour of its reagent before and after; Benedict's solution changes only when heated.
   Every frame is a pure function of the time t.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit, D = global.MolDraw, T = global.MolTests, Film = global.MolFilm;
  if (!L || !K || !D || !T || !Film) return;
  var seg = D.seg, ease = D.ease, lerp = D.lerp, clamp = D.clamp, C = D.C, TAU = D.TAU;

  function scene(W, H, o) {
    var amb = 0;
    return {
      W: W, H: H, seek: function () {}, to: function () {}, idle: function (d) { amb += d; },
      draw: function (c, t) { D.frame(c, 0, 0, W, H, 16, function () { D.ground(c, 0, 0, W, H); o.draw(c, t, amb); D.setLight(false); }); },
      labels: o.labels, read: o.read
    };
  }

  /* ======================================================================= the same glucose rings, joined three ways
     Each ring is [x, y, angle of its carbon 1, turned over or not]; each link is [from, to, kind]. A link runs from carbon 4
     of one ring (kind 'c') or from its carbon 6 at a branch (kind 'b') to carbon 1 of the next, so a glucose molecule has one
     link in and at most two links out. Cellulose: every second ring is turned over, as in the real chain. */
  var POLY = (function () {
    var W = 560, H = 400, N = 46, R = D.rng(11), d = 18.5, db = 27;   /* db: a branch's first link is longer, so its carbon 6 arm and oxygen can be seen */
    function empty(r) { return { p: [], links: [], r: r }; }
    /* a wave from x0 to x1 whose length is exactly `len`, cut into rings d apart */
    function wave(x0, x1, yc, periods, phase, len) {
      var at = function (A, u) { return [x0 + u * (x1 - x0), yc + A * Math.sin(u * TAU * periods + phase)]; };
      var arc = function (A) { var l = 0, q = at(A, 0); for (var i = 1; i <= 1200; i++) { var v = at(A, i / 1200); l += Math.hypot(v[0] - q[0], v[1] - q[1]); q = v; } return l; };
      var lo = 0, hi = H; for (var b = 0; b < 40; b++) { var m = (lo + hi) / 2; if (arc(m) < len) lo = m; else hi = m; }
      var out = [], n = Math.round(len / d) + 1, want = 0, q = at(lo, 0), run = 0;
      out.push(q);
      for (var i = 1; i <= 6000 && out.length < n; i++) { var v = at(lo, i / 6000); run += Math.hypot(v[0] - q[0], v[1] - q[1]); q = v; if (run >= want + d) { want += d; out.push(v); } }
      while (out.length < n) out.push(at(lo, 1));
      return out.map(function (v, k) {
        var a = out[Math.max(0, k - 1)], b2 = out[Math.min(n - 1, k + 1)], dir = Math.atan2(b2[1] - a[1], b2[0] - a[0]);
        return [v[0], v[1], dir + Math.PI, 0];
      });
    }
    /* separate molecules, spread out so that none lies on another */
    var scatter = empty(8);
    for (var i = 0; i < N; i++) {
      var best = null, far = -1;
      for (var t0 = 0; t0 < 14; t0++) {
        var x = 34 + R() * (W - 68), y = 34 + R() * (H - 68), near = 1e9;
        scatter.p.forEach(function (o) { near = Math.min(near, Math.hypot(o[0] - x, o[1] - y)); });
        if (near > far) { far = near; best = [x, y]; }
      }
      scatter.p.push([best[0], best[1], R() * TAU, 0]);
    }
    /* a single chain */
    var chain = empty(6.6); chain.p = wave(32, 528, H / 2, 1, 0, (N - 1) * d);
    for (var a = 1; a < N; a++) chain.links.push([a - 1, a, 'c']);
    /* starch: a long chain with a few branches, each leaving from a carbon 6 */
    var starch = empty(6.6); starch.p = wave(46, 514, 128, 1.05, .4, 27 * d);
    for (var l0 = 1; l0 < 28; l0++) starch.links.push([l0 - 1, l0, 'c']);
    function branch(m, from, turn, n, bend) {
      var q = m.p[from], ang = q[2] - Math.PI + turn, x = q[0], y = q[1], prev = from, kind = 'b';
      for (var k = 0; k < n; k++) {
        var st0 = k ? d : db; x += st0 * Math.cos(ang); y += st0 * Math.sin(ang); m.p.push([x, y, ang + Math.PI, 0]);
        m.links.push([prev, m.p.length - 1, kind]); prev = m.p.length - 1; kind = 'c'; ang += bend;
      }
    }
    branch(starch, 8, .95, 9, .04); branch(starch, 19, .95, 9, -.04);
    /* glycogen: a tree whose every branch forks again */
    var gly = empty(6.6), G = { x: 278.1, y: 228.69, a0: -2.7365, root: 1.8928, l: [.6893, .7703], r: [1.1977, 1.1537] };
    gly.p.push([G.x, G.y, G.a0 + Math.PI, 0]);
    function run(from, dir, n, kind) {
      var x = gly.p[from][0], y = gly.p[from][1], prev = from;
      for (var k = 0; k < n; k++) {
        var st1 = !k && kind === 'b' ? db : d; x += st1 * Math.cos(dir); y += st1 * Math.sin(dir); gly.p.push([x, y, dir + Math.PI, 0]);
        gly.links.push([prev, gly.p.length - 1, kind]); prev = gly.p.length - 1; kind = 'c';
      }
      return prev;
    }
    function tree(from, dir, lens, kind, lv) {
      var e = run(from, dir, lens[0], kind);
      if (lens.length > 1) { tree(e, dir - G.l[lv], lens.slice(1), 'c', lv + 1); tree(e, dir + G.r[lv], lens.slice(1), 'b', lv + 1); }
    }
    tree(0, G.a0, [5, 3, 3], 'c', 0); tree(0, G.a0 + G.root, [4, 3, 3], 'b', 0);
    /* amylopectin, one of the two molecules in starch: a chain with branches from carbon 6, far fewer than in glycogen */
    var amylo = empty(6.6); amylo.p = wave(86, 470, 104, .9, .2, 21 * d);
    for (var l9 = 1; l9 < 22; l9++) amylo.links.push([l9 - 1, l9, 'c']);
    branch(amylo, 4, .95, 8, .03); branch(amylo, 11, .95, 8, -.02); branch(amylo, 17, .95, 8, .03);
    /* cellulose: straight chains side by side; every second ring is turned over; links between the chains */
    var cel = empty(12); cel.cross = [];
    var rows = [12, 11, 12, 11], k2 = 0, rowY = [H / 2 - 93, H / 2 - 31, H / 2 + 31, H / 2 + 93], first = [], sp = 41;
    rows.forEach(function (n, ri) {
      first.push(k2);
      var x0 = W / 2 - (n - 1) * sp / 2;
      for (var j = 0; j < n; j++) { cel.p.push([x0 + j * sp, rowY[ri], Math.PI, j % 2]); if (j) cel.links.push([k2 - 1, k2, 'c']); k2++; }
    });
    for (var r1 = 0; r1 < 3; r1++) {
      var n1 = rows[r1], n2 = rows[r1 + 1];
      for (var j1 = 0; j1 < Math.min(n1, n2); j1 += 2) cel.cross.push([first[r1] + j1 + (n1 > n2 ? 1 : 0), first[r1 + 1] + j1 + (n2 > n1 ? 1 : 0)]);
    }
    if ([chain, starch, gly, cel, amylo].some(function (m) { return m.p.length !== N; })) throw new Error('polymer layouts must have ' + N + ' rings: ' + [chain.p.length, starch.p.length, gly.p.length, cel.p.length, amylo.p.length]);
    /* the ring at the tip of the top branch of glycogen: its name's line ends here, over no other ring */
    var tip = 0; gly.p.forEach(function (p, ix) { if (p[1] < gly.p[tip][1]) tip = ix; });
    gly.tip = tip;
    return { W: W, H: H, N: N, scatter: scatter, chain: chain, starch: starch, glycogen: gly, cellulose: cel, amylopectin: amylo };
  })();
  function turnBy(a, b) { var q = (b - a) % TAU; if (q > Math.PI) q -= TAU; if (q < -Math.PI) q += TAU; return q; }
  /* draw the rings at the moment k (0…1) of the move from layout a to layout b; drift: small movement of free molecules */
  function drawPoly(c, a, b, k, drift, amb) {
    var P = [], rr = lerp(a.r, b.r, k), fk = clamp((k - .2) / .4);
    for (var i = 0; i < POLY.N; i++) {
      var x = lerp(a.p[i][0], b.p[i][0], k), y = lerp(a.p[i][1], b.p[i][1], k), rot = a.p[i][2] + turnBy(a.p[i][2], b.p[i][2]) * k;
      if (drift) { x += Math.sin(amb * .7 + i * 1.9) * 5 * drift; y += Math.cos(amb * .6 + i * 2.7) * 5 * drift; rot += Math.sin(amb * .4 + i) * .4 * drift; }
      var f = lerp(a.p[i][3] || 0, b.p[i][3] || 0, fk);
      P.push({ x: x, y: y, rot: rot, turn: f, flip: f > .5 });
    }
    var la = 1 - clamp(k * 3), lb = clamp((k - .6) / .4), w = Math.max(1.5, rr * .3);
    [[a, la], [b, lb]].forEach(function (m) { if (m[0].links.length && m[1] > 0) m[0].links.forEach(function (q) { D.joinLink(c, P[q[0]], P[q[1]], rr, q[2], w, m[1]); }); });
    var cr = b.cross && lb > 0 ? b.cross : a.cross && la > 0 ? a.cross : null;
    if (cr) {
      c.strokeStyle = 'rgba(214,240,255,' + (.75 * (b.cross ? lb : la)).toFixed(3) + ')'; c.lineWidth = 1.5; c.setLineDash([3, 3]);
      c.beginPath();
      /* each link between chains ends at the edge of its two rings */
      cr.forEach(function (q) { var A = P[q[0]], B = P[q[1]], dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, e = rr * .95; c.moveTo(A.x + dx / l * e, A.y + dy / l * e); c.lineTo(B.x - dx / l * e, B.y - dy / l * e); });
      c.stroke(); c.setLineDash([]);
    }
    P.forEach(function (p) {
      if (p.turn <= 0 || p.turn >= 1) { D.glc(c, p.x, p.y, rr, p.rot, null, false, p.turn >= 1); return; }
      /* a ring turning over: it turns about the line from its carbon 1 to its carbon 4 */
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(Math.PI * p.turn)); c.rotate(-p.rot); c.translate(-p.x, -p.y);
      D.glc(c, p.x, p.y, rr, p.rot); c.restore();
    });
    return P;
  }
  /* a dashed line round a whole molecule, so that its name stands for all of it and not for the one ring its line would end on */
  function boxOf(pts, pad) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad, cx: (x0 + x1) / 2 };
  }
  function drawBox(c, b, alpha) {
    if (alpha <= 0) return;
    c.strokeStyle = 'rgba(255,233,179,' + (.8 * alpha).toFixed(3) + ')'; c.lineWidth = 1.7; c.setLineDash([6, 5]);
    D.rr(c, b.x, b.y, b.w, b.h, 14); c.stroke(); c.setLineDash([]);
  }
  function polyBox(lay) { return boxOf(lay.p, lay.r + 9); }
  /* ======================================================================= amylose, the other molecule in starch
     One chain with no branches, coiled into a left-handed helix of six glucose molecules to a turn, hollow along its axis.
     The picture looks along the helix at an angle, so each turn is seen as a loop and the hollow can be seen. */
  var AMY = { n: 36, perTurn: 6, R: 48, dx: 12.6, r: 9.6, tilt: .95 };
  function amyAt(i, spin, cx, cy, sc) {
    var th = spin - i * TAU / AMY.perTurn, X = (i - (AMY.n - 1) / 2) * AMY.dx, Y = AMY.R * Math.cos(th), Z = AMY.R * Math.sin(th), cb = Math.cos(AMY.tilt), sb = Math.sin(AMY.tilt);
    return { x: cx + (X * cb + Z * sb) * sc, y: cy - Y * sc, z: -X * sb + Z * cb, front: Math.sin(th) };
  }
  /* the iodine: five short chains of atoms along the axis; `k` 0…1 how far they have moved into the helix from its open end */
  function iodineAtoms(k, cx, cy, sc) {
    var out = [], cb = Math.cos(AMY.tilt), sb = Math.sin(AMY.tilt);
    for (var g = 0; g < 5; g++) {
      var e = ease(clamp(k * 1.5 - (4 - g) * .12));
      for (var a = 0; a < 5; a++) {
        var X = -137 + g * 70 + a * 11.5 + (1 - e) * 560;   /* the gaps between the chains fall between the front rings, so the short chains can be seen */
        out.push({ x: cx + X * cb * sc, y: cy, z: -X * sb, g: g });
      }
    }
    return out;
  }
  var IODINE = ['#D6D8F2', '#4A4E96', '#16173A'];
  function drawAmylose(c, cx, cy, sc, spin, iod) {
    var P = [], items = [], r = AMY.r * sc, lw = Math.max(2.2, 3.4 * sc), NIGHT = '#132A40';
    for (var i = 0; i < AMY.n; i++) {
      var q0 = amyAt(i, spin, cx, cy, sc), a0 = amyAt(i - .12, spin, cx, cy, sc), b0 = amyAt(i + .12, spin, cx, cy, sc);
      q0.rot = Math.atan2(b0.y - a0.y, b0.x - a0.x) + Math.PI; P.push(q0);
    }
    P.forEach(function (q, j) {
      /* each ring is opaque, so what lies behind it does not show through; the far side of the coil is darker */
      items.push({ z: q.z, f: function () {
        var rr = r * (.88 + .12 * q.front), v;
        c.beginPath();
        for (v = 0; v < 6; v++) { var an = q.rot + v * TAU / 6; c[v ? 'lineTo' : 'moveTo'](q.x + rr * Math.cos(an), q.y + rr * Math.sin(an)); }
        c.closePath(); c.fillStyle = '#1B3044'; c.fill();
        D.glc(c, q.x, q.y, rr, q.rot);
        c.beginPath();
        for (v = 0; v < 6; v++) { var am = q.rot + v * TAU / 6; c[v ? 'lineTo' : 'moveTo'](q.x + (rr + 1.3) * Math.cos(am), q.y + (rr + 1.3) * Math.sin(am)); }
        c.closePath(); c.fillStyle = 'rgba(19,42,64,' + ((1 - q.front) * .3).toFixed(3) + ')'; c.fill();
      } });
      if (j === AMY.n - 1) return;
      /* the link follows the curve of the coil, from the edge of one ring to the edge of the next, through its oxygen */
      for (var m = 0; m < 6; m++) (function (m) {
        var A = amyAt(j + .2 + .6 * m / 6, spin, cx, cy, sc), B = amyAt(j + .2 + .6 * (m + 1) / 6, spin, cx, cy, sc);
        items.push({ z: (A.z + B.z) / 2, f: function () {
          var dx = B.x - A.x, dy = B.y - A.y, l = Math.sqrt(dx * dx + dy * dy) || 1, ex = dx / l, ey = dy / l, k = (1 - (A.front + B.front) / 2) * .3;
          c.lineCap = 'butt';
          c.strokeStyle = D.mixHex(C.sugarLo, NIGHT, k); c.lineWidth = lw + 1.4; c.beginPath(); c.moveTo(A.x - ex * .4, A.y - ey * .4); c.lineTo(B.x + ex * .4, B.y + ey * .4); c.stroke();
          c.strokeStyle = D.mixHex(C.sugar, NIGHT, k); c.lineWidth = lw; c.beginPath(); c.moveTo(A.x - ex * .9, A.y - ey * .9); c.lineTo(B.x + ex * .9, B.y + ey * .9); c.stroke();
        } });
      })(m);
      var O = amyAt(j + .5, spin, cx, cy, sc);
      items.push({ z: O.z + .01, f: function () { D.ball(c, O.x, O.y, Math.max(1.8, 2.7 * sc), C.O); } });
    });
    if (iod != null) iodineAtoms(iod, cx, cy, sc).forEach(function (q) { items.push({ z: q.z, f: function () { D.ball(c, q.x, q.y, 5.6 * sc, IODINE); } }); });
    items.sort(function (a, b) { return a.z - b.z; });
    items.forEach(function (it) { it.f(); });
    c.lineCap = 'round';
    return P;
  }
  /* one large molecule never changes into another: its glucose molecules separate first, then join in the new way */
  function polyVia(c, a, b, k, amb) {
    var F = POLY.scatter;
    if (a === b || a === F || b === F) return drawPoly(c, a, b, k, (a === F ? 1 - k : 0) + (b === F ? k : 0), amb);
    if (k < .42) { var u = k / .42; return drawPoly(c, a, F, ease(u), ease(u), amb); }
    var w = (k - .42) / .58; return drawPoly(c, F, b, ease(w), 1 - ease(w), amb);
  }

  /* ======================================================================= a protein chain, in 3D
     Daniel, 24 Nov 2026: "it's very important to understand that the protein [folds] into a 3D structure", and then: the folds
     "look more like geometrical shapes rather than what a protein will look like". So each folded chain is a real one: a stretch of
     30 amino acids of the measured amylase (below), in its own shape and with its own sequence. The chain's beads lie one step
     apart at every moment: folding turns each link from its place in the loose chain to its place in the folded chain, so the chain
     never gets longer or shorter. It winds up from its far end, so the part not yet folded lies still (Inheritance Lab, 6 Nov
     2026); the picture keeps still while it folds. */
  function slerp(a, b, t) {
    var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], o, k0, k1;
    if (dot > .9995) { var q = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], l = Math.hypot(q[0], q[1], q[2]) || 1; return [q[0] / l, q[1] / l, q[2] / l]; }
    if (dot < -.9995) {
      var ax = Math.abs(a[2]) < .9 ? [-a[1], a[0], 0] : [0, -a[2], a[1]], al = Math.hypot(ax[0], ax[1], ax[2]) || 1, an = Math.PI * t;
      return [a[0] * Math.cos(an) + ax[0] / al * Math.sin(an), a[1] * Math.cos(an) + ax[1] / al * Math.sin(an), a[2] * Math.cos(an) + ax[2] / al * Math.sin(an)];
    }
    o = Math.acos(dot); k0 = Math.sin((1 - t) * o) / Math.sin(o); k1 = Math.sin(t * o) / Math.sin(o);
    return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
  }
  /* the loose chain: a gentle wave in the plane of the picture */
  function waveDir(i) { var a = 1.25 * Math.sin(i * TAU / 17); return [Math.cos(a), Math.sin(a), 0]; }
  /* the beads (units of one step, centred) of the fold F reached by the fraction k */
  function chain3At(F, n, k) {
    var pts = [[0, 0, 0]], x = 0, y = 0, z = 0;
    for (var i = 1; i < n; i++) {
      var from = (n - 1 - i) / (n - 1) * .78, d = slerp(waveDir(i), F[i - 1], ease(seg(k, from, from + .22)));
      x += d[0]; y += d[1]; z += d[2]; pts.push([x, y, z]);
    }
    var m = [0, 0, 0]; pts.forEach(function (p) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; });
    return pts.map(function (p) { return [p[0] - m[0] / n, p[1] - m[1] / n, p[2] - m[2] / n]; });
  }
  /* 3D points to the screen: turned by the reader (yaw, pitch), y upwards, so a molecule is never drawn as its mirror image */
  function project(P, view, cx, cy, s) {
    return P.map(function (p) { var q = D.turn(p, view.yaw || 0, view.pitch || 0, 0); return { x: cx + q[0] * s, y: cy - q[1] * s, z: q[2] }; });
  }
  /* a folding chain can swing wide for a moment: it is moved, never squeezed, so that it stays inside the picture */
  function inside(Q, W, H, m) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    Q.forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    /* past one edge: moved in; wider than the room: centred, so both ends show */
    var dx = x1 - x0 > W - 2 * m ? (W - x0 - x1) / 2 : x0 < m ? m - x0 : x1 > W - m ? W - m - x1 : 0;
    var dy = y1 - y0 > H - 2 * m ? (H - y0 - y1) / 2 : y0 < m ? m - y0 : y1 > H - m ? H - m - y1 : 0;
    return dx || dy ? Q.map(function (q) { return { x: q.x + dx, y: q.y + dy, z: q.z }; }) : Q;
  }
  /* a chain of beads in depth order; `upTo` how many have joined (all, if left out); `s` px to one step. Each link runs from the
     surface of one bead to the surface of the next, in short pieces at their own depth, so a link never jumps over its own bead
     as the chain turns. Farther beads are a little darker. */
  function drawChain3(c, Q, kinds, r, upTo, alpha, s, ends) {
    var m = upTo == null ? Q.length : Math.floor(upTo), items = [], zl = 1e9, zh = -1e9, u = s || 22, rz = r / u;
    Q.forEach(function (q) { zl = Math.min(zl, q.z); zh = Math.max(zh, q.z); });
    var span = zh - zl, fog = function (z) { return span > .3 ? .34 * (zh - z) / span : 0; };
    Q.forEach(function (q, i) {
      items.push({ z: q.z, f: function () {
        D.bead(c, q.x, q.y, r, kinds[i], alpha, fog(q.z));
        /* the two ends of the chain, ringed, so its length can be followed from one end to the other */
        if (ends && (i === 0 || i === Q.length - 1)) { c.globalAlpha = alpha == null ? 1 : alpha; c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, r + 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      } });
      if (!i || i >= m) return;
      var A = Q[i - 1], dx = (q.x - A.x) / u, dy = (q.y - A.y) / u, dz = q.z - A.z, L = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (L < rz * 2) return;
      for (var h = 0; h < 4; h++) (function (t0, t1) {
        var P0 = { x: lerp(A.x, q.x, t0), y: lerp(A.y, q.y, t0), z: lerp(A.z, q.z, t0) }, P1 = { x: lerp(A.x, q.x, t1), y: lerp(A.y, q.y, t1), z: lerp(A.z, q.z, t1) };
        items.push({ z: (P0.z + P1.z) / 2, f: function () {
          var ex = P1.x - P0.x, ey = P1.y - P0.y, l = Math.sqrt(ex * ex + ey * ey) || 1; ex /= l; ey /= l;
          c.globalAlpha = alpha == null ? 1 : alpha; c.lineCap = 'butt'; c.strokeStyle = D.mixHex('#8496AA', '#132A40', fog((P0.z + P1.z) / 2)); c.lineWidth = r * .55;
          c.beginPath(); c.moveTo(P0.x - ex * .5, P0.y - ey * .5); c.lineTo(P1.x + ex * .5, P1.y + ey * .5); c.stroke(); c.globalAlpha = 1;
        } });
      })(rz * .9 / L + (1 - 2 * rz * .9 / L) * h / 4, rz * .9 / L + (1 - 2 * rz * .9 / L) * (h + 1) / 4);
    });
    items.sort(function (a, b) { return a.z - b.z; });
    items.forEach(function (it) { it.f(); });
  }

  /* ======================================================================= a real protein: amylase, measured
     The Y7 cell game's molecule (js/data/amylase.js: PDB 1SMD, 496 amino acids). Its beads swell, take amylase's own colour and
     merge into its smooth surface: nothing is added, the surface is the outside of the same amino acids (Y7 review, 12 Nov 2026:
     the surface never comes over the chain like a coat). */
  var AMYL = null;
  function amylase() {
    if (AMYL || !global.AMYLASE) return AMYL;
    var A = global.AMYLASE, dec = global.atob;
    function unq(o) { var b = dec(o.d), n = b.length / 2, f = []; for (var i = 0; i < n; i++) { var k = i % 3; f.push(o.lo[k] + (o.hi[k] - o.lo[k]) * (b.charCodeAt(2 * i) | (b.charCodeAt(2 * i + 1) << 8)) / 65535); } return f; }
    function triples(f) { var out = []; for (var i = 0; i < f.length; i += 3) out.push([f[i], f[i + 1], f[i + 2]]); return out; }
    var ca = triples(unq(A.ca)), v = triples(unq(A.surf.v)), ib = dec(A.surf.i), tri = [], shut = dec(A.surf.shut), m = [0, 0, 0];
    for (var i = 0; i < ib.length / 2; i += 3) tri.push([0, 1, 2].map(function (q) { return ib.charCodeAt(2 * (i + q)) | (ib.charCodeAt(2 * (i + q) + 1) << 8); }));
    ca.forEach(function (p) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; }); m = m.map(function (q) { return q / ca.length; });
    ca = ca.map(function (p) { return [p[0] - m[0], p[1] - m[1], p[2] - m[2]]; }); v = v.map(function (p) { return [p[0] - m[0], p[1] - m[1], p[2] - m[2]]; });
    /* each triangle's outward direction: its corners go round anticlockwise, seen from outside */
    var fn = tri.map(function (t) {
      var a = v[t[0]], b = v[t[1]], d = v[t[2]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      var n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(n[0], n[1], n[2]) || 1;
      return [n[0] / l, n[1] / l, n[2] / l];
    });
    var out = 0; tri.forEach(function (t, j) { var c0 = v[t[0]]; out += fn[j][0] * c0[0] + fn[j][1] * c0[1] + fn[j][2] * c0[2]; });
    if (out < 0) fn = fn.map(function (n) { return [-n[0], -n[1], -n[2]]; });
    /* each point's direction, the mean of its triangles': the light changes smoothly over the surface */
    var vn = v.map(function () { return [0, 0, 0]; });
    tri.forEach(function (t, j) { t.forEach(function (q) { vn[q][0] += fn[j][0]; vn[q][1] += fn[j][1]; vn[q][2] += fn[j][2]; }); });
    vn = vn.map(function (n) { var l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; });
    /* each bead in the colour of its own kind of amino acid, as in the chains above */
    var ORDER = 'ACDEFGHIKLMNPQRSTVWY', kind = (A.seq || '').split('').map(function (q) { return Math.max(0, ORDER.indexOf(q)); });
    return (AMYL = { n: A.n, ca: ca, v: v, tri: tri, fn: fn, vn: vn, shut: shut, ss: A.ss, seq: A.seq, kind: kind });
  }
  var LAYER = null;
  function onLayer(c, alpha, paint) {
    if (alpha >= 1 || !c.canvas || !c.canvas.ownerDocument) { paint(c); return; }
    if (!LAYER) LAYER = c.canvas.ownerDocument.createElement('canvas');
    if (LAYER.width !== c.canvas.width || LAYER.height !== c.canvas.height) { LAYER.width = c.canvas.width; LAYER.height = c.canvas.height; }
    var g = LAYER.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LAYER.width, LAYER.height); g.setTransform(c.getTransform());
    paint(g);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(LAYER, 0, 0); c.restore();
  }
  var AMY_COL = [226, 162, 66], LIGHT = (function () { var l = [-.42, .5, .76], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  function surfaceColours(A, view) {
    return A.vn.map(function (n, i) {
      var q = D.turn(n, view.yaw || 0, view.pitch || 0, 0), lam = Math.max(0, q[0] * LIGHT[0] + q[1] * LIGHT[1] + q[2] * LIGHT[2]);
      var hz = Math.max(0, q[2]) * .5 + lam * .5, o = Math.pow(Math.min(1, A.shut.charCodeAt(i) / 255 / .15), .7), k = .4 + .66 * lam, sp = Math.pow(hz, 24) * 70;
      return [AMY_COL[0] * (1 - .32 * o) * k + sp, AMY_COL[1] * (1 - .42 * o) * k + sp, AMY_COL[2] * (1 - .5 * o) * k + sp].map(function (x) { return Math.min(255, x); });
    });
  }
  var RASTER = null;
  function paintSurface(g, A, cx, cy, s, view) {
    var P = project(A.v, view, cx, cy, s), col = surfaceColours(A, view), fn = A.fn.map(function (n) { return D.turn(n, view.yaw || 0, view.pitch || 0, 0)[2]; });
    if (g.canvas && g.canvas.ownerDocument && g.getTransform) {
      /* the smooth shape: each pixel takes the colour shared smoothly from the corners of its triangle, and the nearest surface wins */
      var m = g.getTransform(), ss = Math.hypot(m.a, m.b) < 1.5 ? 2 : 1, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      var Q = P.map(function (p) { var x = (m.a * p.x + m.c * p.y + m.e) * ss, y = (m.b * p.x + m.d * p.y + m.f) * ss; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); return [x, y, p.z]; });
      x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1;
      var w = Math.ceil(x1) - x0 + 2, h = Math.ceil(y1) - y0 + 2;
      if (!RASTER) RASTER = g.canvas.ownerDocument.createElement('canvas');
      if (RASTER.width !== w || RASTER.height !== h) { RASTER.width = w; RASTER.height = h; }
      var rc = RASTER.getContext('2d'), img = rc.createImageData(w, h), px = img.data, zb = new Float32Array(w * h).fill(-1e9);
      A.tri.forEach(function (t, j) {
        if (fn[j] <= 0) return;
        var a = Q[t[0]], b = Q[t[1]], c = Q[t[2]], ca = col[t[0]], cb = col[t[1]], cc = col[t[2]];
        var bx0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) - x0)), bx1 = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0]) - x0));
        var by0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) - y0)), by1 = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1]) - y0));
        var den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (!den) return;
        for (var y = by0; y <= by1; y++) for (var x = bx0; x <= bx1; x++) {
          var X = x + x0 + .5, Y = y + y0 + .5, l0 = ((b[1] - c[1]) * (X - c[0]) + (c[0] - b[0]) * (Y - c[1])) / den, l1 = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (Y - c[1])) / den, l2 = 1 - l0 - l1;
          if (l0 < -.001 || l1 < -.001 || l2 < -.001) continue;
          var z = l0 * a[2] + l1 * b[2] + l2 * c[2], k = y * w + x;
          if (z <= zb[k]) continue;
          zb[k] = z; k *= 4;
          px[k] = l0 * ca[0] + l1 * cb[0] + l2 * cc[0]; px[k + 1] = l0 * ca[1] + l1 * cb[1] + l2 * cc[1]; px[k + 2] = l0 * ca[2] + l1 * cb[2] + l2 * cc[2]; px[k + 3] = 255;
        }
      });
      rc.putImageData(img, 0, 0);
      g.save(); g.setTransform(1 / ss, 0, 0, 1 / ss, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(RASTER, x0, y0); g.restore();
      return;
    }
    /* where there is no screen (the checks): flat triangles, nearest last */
    A.tri.map(function (t, j) { return { t: t, j: j, z: (P[t[0]].z + P[t[1]].z + P[t[2]].z) / 3 }; }).filter(function (q) { return fn[q.j] > 0; })
      .sort(function (a, b) { return a.z - b.z; }).forEach(function (q) {
        var cl = col[q.t[0]], a = P[q.t[0]], b = P[q.t[1]], d = P[q.t[2]];
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(d.x, d.y); g.closePath(); g.fillStyle = 'rgb(' + cl.map(Math.round).join(',') + ')'; g.fill();
      });
  }
  /* k: 0 its amino acids, 1 its smooth shape. grow (0…1): how much of the chain is drawn, from its first amino acid onwards, so the
     one long chain can be followed as it fills the shape (Daniel, 24 Nov 2026: a glow along the chain was "very hard to understand") */
  function drawAmylase(c, cx, cy, s, view, k, grow) {
    var A = amylase(); if (!A) return null;
    var bk = ease(clamp(k / .7)), sk = clamp((k - .45) / .45), Q = project(A.ca, view, cx, cy, s);
    if (sk < 1) {
      var items = [], r = lerp(.13, .5, bk) * s, zl = 1e9, zh = -1e9, upTo = grow == null ? A.n : grow * A.n, linkA = 1 - clamp(bk * 2.2);
      Q.forEach(function (q) { zl = Math.min(zl, q.z); zh = Math.max(zh, q.z); });
      Q.forEach(function (q, i) {
        if (i >= upTo) return;
        var fog = .36 * (zh - q.z) / Math.max(.1, zh - zl), col = D.AA[A.kind[i] % D.AA.length];
        items.push({ z: q.z, f: function () { D.bead(c, q.x, q.y, r, col, null, fog); } });
        if (i && linkA > 0) items.push({ z: (q.z + Q[i - 1].z) / 2, f: function () {
          c.globalAlpha = linkA; c.strokeStyle = D.mixHex('#A9B8C8', '#132A40', fog); c.lineWidth = Math.max(1.2, .07 * s); c.lineCap = 'round';
          c.beginPath(); c.moveTo(Q[i - 1].x, Q[i - 1].y); c.lineTo(q.x, q.y); c.stroke(); c.globalAlpha = 1;
        } });
      });
      items.sort(function (a, b) { return a.z - b.z; });
      items.forEach(function (it) { it.f(); });
    }
    if (sk > 0) onLayer(c, sk, function (g) { paintSurface(g, A, cx, cy, s, view); });
    return Q;
  }
  /* the box round the whole molecule: its smooth shape is the largest it is ever drawn */
  function amylaseBox(cx, cy, s, view) { var A = amylase(); return boxOf(project(A.v, view, cx, cy, s).map(function (q) { return [q.x, q.y]; }), 8); }

  /* two stretches of amylase's chain, as the folded chains of the station: 1SMD amino acids 68–97 (a helix, a turn and a strand)
     and 401–430 (three strands side by side). Each is laid with its longest side across the picture and its next longest upright
     (a turn, never a mirror image), then tipped a little so its depth can be seen. Each link is one step long. */
  function realFold(start, tip) {
    var A = amylase(), P = A.ca.slice(start, start + 30), c = [0, 0, 0];
    P.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }); c = c.map(function (q) { return q / 30; });
    P = P.map(function (p) { return [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; });
    function axis(skip) {
      var v = [1, .3, .2];
      for (var it = 0; it < 60; it++) {
        var w = [0, 0, 0];
        P.forEach(function (p) { var d = p[0] * v[0] + p[1] * v[1] + p[2] * v[2]; w[0] += p[0] * d; w[1] += p[1] * d; w[2] += p[2] * d; });
        skip.forEach(function (e) { var d = w[0] * e[0] + w[1] * e[1] + w[2] * e[2]; w = [w[0] - e[0] * d, w[1] - e[1] * d, w[2] - e[2] * d]; });
        var l = Math.hypot(w[0], w[1], w[2]) || 1; v = [w[0] / l, w[1] / l, w[2] / l];
      }
      return v;
    }
    var e1 = axis([]), e2 = axis([e1]), e3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    var dirs = [];
    for (var i = 1; i < 30; i++) {
      var d = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
      var q = [(d[0] * e1[0] + d[1] * e1[1] + d[2] * e1[2]) / l, (d[0] * e2[0] + d[1] * e2[1] + d[2] * e2[2]) / l, (d[0] * e3[0] + d[1] * e3[1] + d[2] * e3[2]) / l];
      dirs.push(D.turn(q, tip[0], tip[1], tip[2]));
    }
    var ORDER = 'ACDEFGHIKLMNPQRSTVWY';
    return { dirs: dirs, kinds: A.seq.slice(start, start + 30).split('').map(function (q) { return Math.max(0, ORDER.indexOf(q)); }) };
  }
  var F1 = realFold(67, [.35, -.3, 0]), F2 = realFold(400, [-.4, -.3, 0]), FOLD1 = F1.dirs, FOLD2 = F2.dirs, KINDS1 = F1.kinds, KINDS2 = F2.kinds;

  global.MolShapes = { POLY: POLY, drawPoly: drawPoly, polyVia: polyVia, AMY: AMY, amyAt: amyAt, iodineAtoms: iodineAtoms, drawAmylose: drawAmylose, boxOf: boxOf, drawBox: drawBox, polyBox: polyBox,
                       chain3At: chain3At, project: project, inside: inside, drawChain3: drawChain3, KINDS1: KINDS1, KINDS2: KINDS2, FOLD1: FOLD1, FOLD2: FOLD2, FOLD_FROM: [68, 401], amylase: amylase, drawRealProtein: drawAmylase, realBox: amylaseBox };

  /* ==================================================================================== 1. from a chain to its atoms */
  /* The IB lines say what their statements in the IB Biology guide (first exams 2025) say, at the guide's depth (Daniel,
     27 Nov 2026: "the IB comments are not really IB level … The IB requires a little bit more"): B1.1.1–B1.1.10, B1.2.1, B1.2.2,
     B1.2.4, B1.2.5 and A1.2.2–A1.2.9 are SL and HL ('ib'); B1.2.7–B1.2.12, A1.2.11 and A1.2.12 are HL only ('ibhl'); what the
     guide does not ask (the number of hydrogen bonds in each base pair: A1.2.6 says pupils need not memorize it) is 'bey'. */
  /* A step line marked 'card' says what a sentence card of What you need to know says (Daniel, 27 Nov 2026: one place for each
     idea). Where the station merges that card into the step (its master's `inFilm`), the card's own words stand there instead,
     marked as the card's were; every other line stays, because it adds to the card. Without the card the line is drawn. */
  L.add('atomsfilm', Film({
    title: 'From a large molecule to its atoms',
    aria: 'A long chain of starch. The picture moves in to one glucose molecule, which is shown as a model of its atoms: carbon, hydrogen and oxygen.',
    pills: [['c', 'Carbon:'], ['h', 'Hydrogen:'], ['o', 'Oxygen:']],
    key: [['glucose', 'one glucose molecule', [1]], ['atC', 'carbon atom', [2, 3]], ['atH', 'hydrogen atom', [2, 3]], ['atO', 'oxygen atom', [2, 3]]],
    M: [0, 4, 9, 14, 21],
    steps: [
      { t: 0, still: 3.6, h: 'A large molecule', p: [['ig', 'This is part of one molecule of **starch**. It is a very long chain.'], ['ib', 'A large molecule made of many similar smaller molecules, the **monomers**, is a **polymer**. Three main kinds of polymer in living things are **polysaccharides**, such as starch; **polypeptides**, which make proteins; and **nucleic acids**, DNA and RNA.']] },
      { t: 4, still: 8.8, h: 'A smaller molecule', p: [['ig', 'The chain is made of many smaller molecules joined together. Each ring is one **glucose** molecule.'], ['ib', 'Glucose is a **monosaccharide**, one sugar unit. It is a **hexose**, a sugar with six carbon atoms: five of them and one oxygen atom form its ring. A sugar with five carbon atoms is a **pentose**.']] },
      { t: 9, still: 13.6, h: 'Atoms', p: [['ig', 'A molecule is made of **atoms**. In one glucose molecule, atoms of three **elements** are joined together.'], ['ib', 'The atoms are joined by **covalent bonds**: in each one, two atoms share a pair of electrons. A carbon atom shares four pairs of electrons: as four single bonds, or as single and double bonds (a double bond shares two pairs), with other carbon atoms or with atoms of other non-metals, such as hydrogen, oxygen and nitrogen.']] },
      { t: 14, still: 20.6, h: 'Three elements', p: [['ig', 'Glucose contains **carbon**, **hydrogen** and **oxygen**: 6 carbon, 12 hydrogen and 6 oxygen atoms.'], ['ig', 'Its formula is C₆H₁₂O₆.'], ['ib', 'So carbon atoms can join in **long chains**, in **branched chains** and in one ring or several **rings**: the **great variety of molecules** that life is based on.']] }   /* 0610: 6.1 and 12.2, the balanced equations */
    ],
    make: function () {
      var W = 560, H = 400, M = D.MODELS.glucose, r0 = 13, sp = 37, n = 19, mid = 9;
      /* each ring's carbon 1 faces the ring before it and its carbon 4 the ring after it */
      function posAt(i) { return [W / 2 + (i - mid) * sp, H / 2 + Math.sin((i - mid) * .5) * 20]; }
      function ringAt(i) { var p = posAt(i), a = posAt(i - 1), b = posAt(i + 1); return { x: p[0], y: p[1], rot: Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI }; }
      var ROT = ringAt(mid).rot;
      function elAt(t) { return t < 14 ? null : t < 16.4 ? 'C' : t < 18.6 ? 'H' : 'O'; }
      return scene(W, H, {
        draw: function (c, t) {
          var z = lerp(1, 4.5, ease(seg(t, 4.6, 8.4))), rFade = 1 - seg(t, 9.2, 10.8), mFade = seg(t, 9.6, 11.4);
          if (rFade > 0) {
            c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
            var others = 1 - seg(t, 5.5, 8);
            for (var i = 0; i < n - 1; i++) { D.joinLink(c, ringAt(i), ringAt(i + 1), r0, 'c', 3.4, rFade * ((i === mid || i === mid - 1) ? Math.max(others, .45) : Math.max(others, .25))); }
            for (var j = 0; j < n; j++) { var p = ringAt(j); D.glc(c, p.x, p.y, r0, p.rot, rFade * (j === mid ? 1 : Math.max(others, .28)), j === mid && t >= 4); }
            c.restore();
          }
          if (mFade > 0) {
            /* the model is turned so that its ring and its one oxygen lie where the flat ring's lie */
            var s = 13 * 4.5 / 1.43 * (.82 + .18 * mFade);
            D.model(c, M, W / 2, H / 2 + 4, s * 1.08, { roll: ROT, yaw: -.56, pitch: -.32, only: elAt(t), alpha: mFade });
          }
        },
        labels: function (t) {
          if (t < 4) return [{ id: 's', text: 'part of one starch molecule', x: W / 2 - 74, y: H / 2 + Math.sin(-1) * 20, side: 'T' }];
          if (t < 4.7) return [];
          if (t < 9.2) { var z = lerp(1, 4.5, ease(seg(t, 4.6, 8.4))); return [{ id: 'g', text: 'one glucose molecule', x: W / 2, y: H / 2 - 13 * z * .86, side: 'T' }]; }
          return [];
        },
        read: function (t, pill) {
          pill('c', t >= 14 ? '6 atoms' : '–', t >= 14 && t < 16.4 ? 'ok' : '');
          pill('h', t >= 16.4 ? '12 atoms' : '–', t >= 16.4 && t < 18.6 ? 'ok' : '');
          pill('o', t >= 18.6 ? '6 atoms' : '–', t >= 18.6 ? 'ok' : '');
        }
      });
    }
  }));

  /* ==================================================================================== 2. glucose, three ways */
  L.add('carbfilm', Film({
    title: 'One small molecule, three large molecules',
    aria: 'Separate glucose molecules join into one chain. Glucose molecules then join as starch, as glycogen and as cellulose.',
    key: [['glucose', 'one glucose molecule'], ['linked', 'link between two glucose molecules', [1, 2, 3, 4]], ['hbond', 'links between the chains', [4]]],
    M: [0, 4.5, 10, 16.5, 23, 29.5],
    steps: [
      { t: 0, still: 4, h: 'Glucose', p: [['ig', 'Each ring is one **glucose** molecule.'], ['ig', 'Glucose is a small, soluble molecule.', 'card'], ['ib', 'The properties of glucose suit its use: glucose is **soluble**, so it is easily transported, for example in the blood; it is chemically **stable**, so it does not change as it is transported; and its **oxidation** in respiration releases energy.'], ['ib', 'Glucose has two ring forms, **alpha-glucose** and **beta-glucose**. They differ only in the side of the ring to which the –OH group on carbon 1 points.']] },
      { t: 4.5, still: 9.6, h: 'Glucose molecules join', p: [['ig', 'Many glucose molecules join in a chain and make one **large molecule**.'], ['ib', 'Each glucose joins the next by a **condensation reaction**: an –OH from one and an –H from the other leave as a molecule of water. **Hydrolysis** is the reverse: a molecule of water is split to provide the –H and the –OH that become part of the separate monomers. This is how digestion separates them.']] },
      { t: 10, still: 16, h: 'Starch', p: [['ig', '**Starch** is made from glucose. It is the store of carbohydrate in **plants**.', 'card'], ['ib', 'Starch is a polymer of **alpha-glucose**. Its coiled and branched chains make it **compact**, and its very large molecules make it **insoluble**, so a store of starch does not make water enter the cell by osmosis. Alpha-glucose is easily added to or removed from the ends of the chains, by condensation and hydrolysis, to build or use the store.']] },
      { t: 16.5, still: 22.5, h: 'Glycogen', p: [['ig', '**Glycogen** is made from glucose. It is the store of carbohydrate in **animals**, in the liver and the muscles.', 'card'], ['ib', 'Glycogen is also made of **alpha-glucose**, with even more branches than starch. **Each branch has an end**, and glucose is added or removed at the ends, so many ends let an animal **store or release glucose quickly**.']] },
      { t: 23, still: 29, h: 'Cellulose', p: [['ig', '**Cellulose** is made from glucose. It makes the **cell walls** of plants.', 'card'], ['ib', 'Cellulose is a polymer of **beta-glucose**. Each beta-glucose is rotated through 180° compared with the next, so the chain stays straight. Straight chains lie side by side in bundles, cross-linked by **hydrogen bonds**: fibres with a high tensile strength, which resist pulling.']] }
    ],
    make: function () {
      var W = POLY.W, H = POLY.H;
      function now(t) {
        if (t < 4.5) return [POLY.scatter, POLY.scatter, 0];
        if (t < 10) return [POLY.scatter, POLY.chain, seg(t, 4.8, 8.8)];
        if (t < 16.5) return [POLY.chain, POLY.starch, seg(t, 10.3, 14.6)];
        if (t < 23) return [POLY.starch, POLY.glycogen, seg(t, 16.8, 21.1)];
        return [POLY.glycogen, POLY.cellulose, seg(t, 23.3, 27.6)];
      }
      /* the molecule that has finished forming: its layout, the moment it finished, its name */
      function whole(t) {
        return t >= 14.6 && t < 16.5 ? [POLY.starch, 14.6, 'starch'] : t >= 21.1 && t < 23 ? [POLY.glycogen, 21.1, 'glycogen'] : t >= 27.6 ? [POLY.cellulose, 27.6, 'cellulose'] : null;
      }
      return scene(W, H, {
        draw: function (c, t, amb) {
          var q = now(t), w = whole(t); polyVia(c, q[0], q[1], q[2], amb + t);
          if (w) drawBox(c, polyBox(w[0]), clamp((t - w[1]) / .4));
        },
        labels: function (t) {
          var w = whole(t); if (!w) return [];
          var b = polyBox(w[0]);
          return [{ id: w[2], text: w[2], x: b.cx, y: b.y, side: 'T' }];
        }
      });
    }
  }));

  /* ==================================================================================== 3. a fat from its parts */
  function h2o(c, x, y, a) {
    c.globalAlpha = a;
    D.ball(c, x - 5, y + 3, 2.8, C.H); D.ball(c, x + 5, y + 3, 2.8, C.H); D.ball(c, x, y, 4.8, C.O);
    c.globalAlpha = 1;
  }
  L.add('fatfilm', Film({
    title: 'One glycerol and three fatty acids',
    aria: 'A glycerol molecule and three fatty acid molecules. Each fatty acid moves in and joins the glycerol, one at a time, and they make one fat molecule.',
    key: [['glycerol', 'glycerol'], ['joinpt', 'place where a fatty acid joins', [0]], ['fatty', 'fatty acid'], ['atO', 'acid end of a fatty acid'], ['water', 'water released (IB)', [1]]],
    M: [0, 4.5, 11, 17],
    steps: [
      { t: 0, still: 4.2, h: 'The two kinds of small molecule', p: [['ig', 'A fat or an oil is made from two kinds of smaller molecule: **glycerol** and **fatty acids**.', 'card'], ['ib', 'Fats and oils are **lipids**: substances that dissolve in non-polar solvents, and in ethanol, but only sparingly (very little) in water. Waxes and steroids are lipids too.']] },
      { t: 4.5, still: 10.8, h: 'Three fatty acids join', p: [['ig', '**Three** fatty acids join to **one** glycerol.', 'card'], ['ib', 'Each fatty acid joins to one of the three –OH groups of glycerol by a **condensation reaction**, which releases a molecule of water. A **phospholipid** forms in the same way, from glycerol, two fatty acids and a phosphate group.']] },   /* IB B1.1.9 */
      { t: 11, still: 16.6, h: 'One fat molecule', p: [['ig', 'The result is one molecule of **fat** (or oil). Fats and oils contain carbon, hydrogen and oxygen.'], ['ib', 'This molecule is a **triglyceride**. In a **saturated** fatty acid every bond between carbon atoms is single; a **monounsaturated** fatty acid has one C=C double bond, and a **polyunsaturated** fatty acid has two or more.'], ['ib', 'Most double bonds in living things bend the chain, so unsaturated fatty acids pack less closely than saturated ones, and the lipid melts at a lower temperature. So plants store **oils**, rich in unsaturated fatty acids, and endotherms, such as mammals, store **fats**, rich in saturated ones.'], ['ib', 'Triglycerides suit **long-term energy storage**: a gram releases about twice as much energy as a gram of carbohydrate, and they are insoluble, so they do not affect osmosis. Stored in **adipose tissue** under the skin, fat is also a **thermal insulator**: animals of cold habitats, such as seals, have thick layers.']] }
    ],
    make: function () {
      var W = 560, H = 400, gx = 136, gy = H / 2, gh = 214, gw = 36, ys = [gy - 76, gy, gy + 76], n = 15, step = 18;
      var starts = [[256, 72, -.1], [268, 200, .03], [256, 328, .1]];
      return scene(W, H, {
        draw: function (c, t, amb) {
          /* glycerol's three joining places: each shows until its fatty acid has arrived */
          D.glycerolBar(c, gx, gy, gh, gw, null, ys.filter(function (y, q) { return t < 4.7 + q * 1.8 + 1.8; }));
          for (var i = 0; i < 3; i++) {
            var a = 4.7 + i * 1.8, k = ease(seg(t, a, a + 1.8)), s = starts[i];
            var bob = (1 - k) * Math.sin(amb * .7 + i * 2) * 3;
            var x0 = lerp(s[0], gx + gw / 2 + 3, k), y0 = lerp(s[1] + bob, ys[i], k), ang = lerp(s[2], 0, k);
            D.tail(c, D.tailPts(x0, y0, ang, n, step, 0), 6);
            D.ball(c, x0, y0, 7, C.O);
            if (k >= 1 && t < a + 2.5) {
              var u = seg(t, a + 1.8, a + 2.5);
              c.strokeStyle = 'rgba(255,240,190,' + (1 - u).toFixed(3) + ')'; c.lineWidth = 2.4;
              c.beginPath(); c.arc(x0, y0, 9 + 10 * u, 0, TAU); c.stroke();
            }
            /* the water that each join releases, leaving the join */
            var wT = seg(t, a + 1.7, a + 2.7);
            if (wT > 0) h2o(c, x0 + 16 + 26 * wT, y0 - 14 - 12 * wT, seg(wT, 0, .3) * (1 - seg(t, 11, 11.4)));
          }
          if (t > 11.4) {
            var o = seg(t, 11.4, 12.4);
            c.strokeStyle = 'rgba(255,233,179,' + (.8 * o).toFixed(3) + ')'; c.lineWidth = 1.8; c.setLineDash([6, 5]);
            D.rr(c, gx - 30, gy - gh / 2 - 16, 348, gh + 32, 16); c.stroke(); c.setLineDash([]);
          }
        },
        labels: function (t) {
          var it = [];
          if (t < 11.4) it.push({ id: 'g', text: 'glycerol', x: gx, y: gy - gh / 2 + 4, side: 'T' });
          if (t < 4.7) it.push({ id: 'f', text: 'fatty acid', x: starts[0][0] + 90, y: starts[0][1] - 12, side: 'T' });
          if (t >= 11.4) it.push({ id: 'one', text: 'one fat molecule', x: gx + 144, y: gy - gh / 2 - 15, side: 'T' });
          return it;
        }
      });
    }
  }));

  /* ==================================================================================== 4. a protein from amino acids */
  L.add('protfilm', Film({
    title: 'From amino acids to a protein',
    aria: 'Separate amino acids of different kinds join, one after another, in a chain. The chain folds into a 3D shape. Amino acids in a different sequence join and fold into a different shape. A real protein, amylase, is built up one amino acid after another, and its folded chain then merges into one smooth shape: the same folded chain.',
    key: [['amino', 'an amino acid (each colour is one kind)'], ['chainEnd', 'an end of the chain', [1, 2, 3]], ['protSurf', 'the folded chain, drawn as a smooth shape', [4]]],
    M: [0, 4.5, 11, 17.5, 26.5, 38.5],
    steps: [
      { t: 0, still: 4.2, h: 'Amino acids', p: [['ig', 'Proteins are made from small molecules called **amino acids**.', 'card'], ['ig', 'Here, each colour is one kind of amino acid.'], ['ib', 'Every amino acid has the same main part: a central carbon atom, the **alpha carbon**, bonded to an **amine group** (–NH₂), a **carboxyl group** (–COOH), a hydrogen atom and an **R group**. The 20 kinds of amino acid that the genetic code codes for differ only in their R group.']] },   /* IB B1.2.4 */
      { t: 4.5, still: 10.8, h: 'A chain', p: [['ig', 'Amino acids join, one after another, in a **chain**.', 'card'], ['ib', 'Two amino acids join by a **condensation reaction**: the carboxyl group of one reacts with the amine group of the next, a molecule of water is released and a **peptide bond** forms. In words: amino acid + amino acid → dipeptide + water. Many amino acids joined in this way make a **polypeptide**.']] },
      { t: 11, still: 17.2, h: 'The chain folds', p: [['ig', 'The chain **folds** into its own **3D shape**.', 'card'], ['ig', 'The chain does not become longer or shorter: only its shape changes.'], ['ib', 'Heat, or a pH far from the one the protein works at, breaks many of the weaker bonds that hold this shape. The protein is **denatured**: its shape changes, and usually it cannot regain it.'], ['ibhl', '**Hydrogen bonds** at regular places coil parts of the chain into **alpha helices** or fold them into **beta-pleated sheets**: the **secondary structure**. The whole chain then folds into its **tertiary structure**, held by bonds between R groups: hydrogen bonds, **ionic bonds**, **disulfide bonds** between cysteines and **hydrophobic interactions**.']] },
      { t: 17.5, still: 26.1, h: 'A different sequence', p: [['ig', 'Amino acids in a different **sequence** (order) join and fold into a **different protein**, with a different shape.', 'card'], ['ib', 'There are **20 kinds of amino acid**. A chain can have any number of them, from a few to thousands, in **any order**. So the number of possible chains is **almost without limit**: for a chain of only 10 amino acids there are 20¹⁰ possible sequences, more than ten million million.'], ['ibhl', 'The sequence is the **primary structure**. The sequence, and the exact position of each amino acid, determines the 3D shape, so every molecule of one protein folds into the same precise shape.']] },
      { t: 26.5, still: 38, h: 'A real protein', p: [['ig', 'A real protein is a much longer chain. **Amylase**, the enzyme in saliva, has 496 amino acids.', 'card'], ['ig', 'The picture adds them one after another, in the order of the chain.'], ['ig', 'Pictures often show a protein as one **smooth shape**. This smooth shape is the folded chain itself: every amino acid is still inside it.', 'card'], ['ibhl', 'Amylase is a **globular protein**: its chain folds into a compact, rounded shape, with most hydrophobic R groups inside and hydrophilic R groups on the surface, so it dissolves in water. A **fibrous protein**, such as collagen, is long and narrow, and gives strength.'], ['ibhl', 'Amylase is one polypeptide. A protein made of two or more polypeptides has a **quaternary structure**: insulin has two and collagen three. Haemoglobin has four, each with a haem group. A protein with a non-protein part, such as haem, is a **conjugated protein**; insulin and collagen have no non-protein part, so they are **non-conjugated**.']] }
    ],
    make: function () {
      var W = 560, H = 400, n = 30, step = 28, r = 9.4;
      var R = D.rng(9), free = [], free2 = [];
      for (var i = 0; i < n; i++) free.push([38 + R() * (W - 76), 34 + R() * (H - 68)]);
      /* the second sequence's amino acids appear in the lower part of the picture, below the first protein */
      for (var i2 = 0; i2 < n; i2++) free2.push([38 + R() * (W - 76), H * .58 + R() * (H * .42 - 30)]);
      var still = { yaw: 0, pitch: 0 };
      function at(F, k, cx, cy, view) { return inside(project(chain3At(F, n, k), view || still, cx == null ? W / 2 : cx, cy == null ? H / 2 : cy, step), W, H, r + 6); }
      function turnAfter(t, t0) { return { yaw: .9 * ease(seg(t, t0, t0 + 2)), pitch: 0 }; }
      function boxOfQ(Q) { return boxOf(Q.map(function (q) { return [q.x, q.y]; }), r + 8); }
      /* amino acids that move one after another from where they are into a chain; a link forms only when both its amino acids are in place */
      function joining(t, t0, from, line, amb, gap) {
        var done = 0, Q = line.map(function (p, j) {
          var a = from[j], tj = t0 + j * gap, kk = ease(seg(t, tj, tj + .9)), w = 1 - kk;
          if (t >= tj + .9 && done === j) done = j + 1;
          return { x: lerp(a[0] + Math.sin(amb * .6 + j * 2) * 5 * w, p.x, kk), y: lerp(a[1] + Math.cos(amb * .5 + j * 3) * 5 * w, p.y, kk), z: 0 };
        });
        return { Q: Q, done: done };
      }
      var A0 = { yaw: -.35, pitch: .12 };
      return scene(W, H, {
        draw: function (c, t, amb) {
          if (t < 11) {
            var J = joining(t, 4.8, free, at(FOLD1, 0), amb, .13);
            drawChain3(c, J.Q, KINDS1, r, Math.max(1, J.done), null, step, J.done >= n);
          } else if (t < 17.5) {
            /* the picture keeps still while the chain folds, then turns a little, so its depth can be seen */
            var Q1 = at(FOLD1, ease(seg(t, 11.3, 15.4)), W / 2, H / 2, turnAfter(t, 15.5));
            drawChain3(c, Q1, KINDS1, r, null, null, step, true);
            if (t >= 16.6) drawBox(c, boxOfQ(Q1), clamp((t - 16.6) / .4));
          } else if (t < 26.5) {
            /* the first protein waits higher up; the new amino acids appear below it, join one after another along the foot, and
               the new chain folds; then both stand side by side */
            var mv = ease(seg(t, 17.7, 19.0)), back = ease(seg(t, 23.0, 25.6)), v1 = turnAfter(t, 15.5);
            drawChain3(c, at(FOLD1, 1, lerp(W / 2, W * .27, mv), lerp(H / 2, H * .3, mv * (1 - back)), v1), KINDS1, r, null, null, step, true);
            if (t >= 18.8) {
              var ap = seg(t, 18.8, 19.4), fk = ease(seg(t, 23.0, 25.6)), cx2 = lerp(W / 2, W * .73, fk), cy2 = lerp(H - 104, H / 2, fk);
              if (t < 23.0) { var J2 = joining(t, 19.5, free2, at(FOLD2, 0, W / 2, H - 104), amb, .1); drawChain3(c, J2.Q, KINDS2, r, Math.max(1, J2.done), ap, step); }
              else drawChain3(c, at(FOLD2, fk, cx2, cy2, v1), KINDS2, r, null, null, step, true);
            }
            if (t >= 25.6) { var ba = clamp((t - 25.6) / .4); drawBox(c, boxOfQ(at(FOLD1, 1, W * .27, H / 2, v1)), ba); drawBox(c, boxOfQ(at(FOLD2, 1, W * .73, H / 2, v1)), ba); }
          } else {
            /* one picture leaves before the next arrives */
            var inA = seg(t, 26.9, 27.4), view = { yaw: -.35 + .5 * ease(seg(t, 33.2, 37.6)), pitch: .12 };
            if (t < 26.9) { var outA = 1 - seg(t, 26.5, 26.9); drawChain3(c, at(FOLD1, 1, W * .27, H / 2, turnAfter(t, 15.5)), KINDS1, r, null, outA, step); drawChain3(c, at(FOLD2, 1, W * .73, H / 2, turnAfter(t, 15.5)), KINDS2, r, null, outA, step); }
            else {
              onLayer(c, inA, function (g) { drawAmylase(g, W / 2, H / 2 + 6, 36, view, seg(t, 33.2, 36.4), seg(t, 27.4, 31.2)); });
              /* the name stands for the whole molecule */
              if ((t >= 31.2 && t < 33.2) || t >= 36.4) drawBox(c, amylaseBox(W / 2, H / 2 + 6, 36, view), clamp(t < 33.2 ? (t - 31.2) / .4 : (t - 36.4) / .4));
            }
          }
        },
        labels: function (t) {
          if (t < 4.6) return [{ id: 'a', text: 'one amino acid', x: free[4][0], y: free[4][1] - 7, side: 'T' }];
          if (t >= 16.6 && t < 17.5) { var b0 = boxOfQ(at(FOLD1, 1, W / 2, H / 2, turnAfter(t, 15.5))); return [{ id: 'p', text: 'one protein', x: b0.cx, y: b0.y, side: 'T' }]; }
          if (t >= 25.6 && t < 26.5) {
            var v1 = turnAfter(t, 15.5), b1 = boxOfQ(at(FOLD1, 1, W * .27, H / 2, v1)), b2 = boxOfQ(at(FOLD2, 1, W * .73, H / 2, v1));
            return [{ id: 'p1', text: 'one protein', x: b1.cx, y: b1.y, side: 'T' }, { id: 'p2', text: 'a different protein', x: b2.cx, y: b2.y, side: 'T' }];
          }
          if (t >= 31.2 && t < 33.2) { var ba = amylaseBox(W / 2, H / 2 + 6, 36, A0); return [{ id: 'am', text: 'amylase', x: ba.cx, y: ba.y, side: 'T' }]; }
          if (t >= 36.4) { var bs = amylaseBox(W / 2, H / 2 + 6, 36, { yaw: -.35 + .5 * ease(seg(t, 33.2, 37.6)), pitch: .12 }); return [{ id: 'sf', text: 'amylase as a smooth shape', x: bs.cx, y: bs.y, side: 'T' }]; }
          return [];
        }
      });
    }
  }));

  /* ==================================================================================== 5. the structure of DNA */
  var DNA_SEQ = 'ATGCCGTACGATTGCA';
  L.add('dnafilm', Film({
    title: 'How a DNA molecule is put together',
    aria: 'One strand with its bases. A second strand arrives, each of its bases pairing with its partner: A with T and C with G. Bonds form between the bases. The two strands coil into a double helix.',
    key: [['strand', 'strand'], ['bases', 'bases', null, 'ATCG'], ['hbond', 'bonds between the bases', [2, 3]]],
    M: [0, 4.5, 11, 16, 23],
    steps: [
      { t: 0, still: 4.2, h: 'One strand', p: [['ig', 'A DNA molecule has **two strands**. Each strand contains chemicals called **bases**: **A**, **T**, **C** and **G**.', 'card'], ['ig', 'The picture shows one of the two strands.'], ['ib', 'Each strand is a chain of **nucleotides**. A nucleotide has three parts: a **phosphate** group, a pentose sugar (**deoxyribose** in DNA) and a **base**. The sugar of one nucleotide is joined to the phosphate of the next by a covalent bond, so each strand has a strong **sugar–phosphate backbone**. The bases are adenine (A), thymine (T), cytosine (C) and guanine (G).']] },
      { t: 4.5, still: 10.8, h: 'The bases pair', p: [['ig', 'The second strand lies beside the first.'], ['ig', 'The bases always pair in the same way: **A with T**, and **C with G**.', 'card'], ['ib', 'The two strands are **antiparallel**: they run in opposite directions. Because each base pairs with only one other, each strand is a template for the other: this **complementary base pairing** lets DNA be copied (replication) and its information be used (expression).'], ['ibhl', 'A and G are **purines**, with two rings; C and T are **pyrimidines**, with one ring. Each pair has one of each, so every pair has the same length and the helix has the same shape, whatever the sequence.'], ['ibhl', '5′ and 3′ name two carbon atoms of deoxyribose, so each strand has a **5′ end** and a **3′ end**. New nucleotides are added **only at the 3′ end**, when DNA is copied and when RNA is made.']] },
      { t: 11, still: 15.8, h: 'Bonds', p: [['ig', '**Bonds** between the pairs of bases hold the two strands together.', 'card'], ['ib', 'These are **hydrogen bonds**. Each one is weak, so the two strands can be separated, to copy the DNA or to use a gene, but together the many hydrogen bonds hold the strands firmly.'], ['bey', 'An A–T pair is held by **two hydrogen bonds**; a C–G pair by **three**.']] },   /* IB A1.2.6 */
      { t: 16, still: 22.6, h: 'A double helix', p: [['ig', 'The two strands are **coiled** together to form a **double helix**.', 'card'], ['ib', 'Any length of DNA can have any sequence of bases: a strand of n bases has **4ⁿ possible sequences**. So DNA can store an **almost limitless quantity of information** in very little space.']] }
    ],
    make: function () {
      var W = 560, H = 400, n = DNA_SEQ.length;
      function geo(t) { var tw = ease(seg(t, 16.3, 21.6)), g = D.dnaGeom(tw); g.tw = tw; g.x0 = W / 2 - (n - 1) * g.dx / 2; return g; }
      return scene(W, H, {
        draw: function (c, t) {
          var sec = seg(t, 4.8, 9.6), g = geo(t);
          c.save(); c.translate(W / 2, H / 2); c.scale(g.cam, g.cam); c.translate(-W / 2, -H / 2);
          D.helix(c, { seq: DNA_SEQ, x0: g.x0, y: H / 2, dx: g.dx, R: g.R, w: 8.4 / g.cam, cam: g.cam, twist: g.tw, turn: g.tw * .55, second: t < 4.8 ? 0 : sec, secondOff: 130,
                       show: { bonds: t >= 11.2, letters: g.tw < .32 }, bondAlpha: seg(t, 11.2, 12.6) * .95 });
          c.restore();
        },
        labels: function (t) {
          var it = [], g = geo(t);
          if (t < 16) {
            it.push({ id: 's1', text: 'strand', x: g.x0 + 2 * g.dx, y: H / 2 - g.R, side: 'T' });
            if (t >= 9.6) it.push({ id: 's2', text: 'strand', x: g.x0 + 12 * g.dx, y: H / 2 + g.R, side: 'B' });
          }
          if (t >= 21.6) {
            /* the name's line ends on the upper strand, at a pair where it lies at its highest */
            var j = 0, top = 1e9; for (var q = 4; q < 11; q++) { var th = g.tw * q * TAU / 10 + .55, ty = H / 2 - g.R * Math.cos(th) * g.cam; if (ty < top) { top = ty; j = q; } } var yy = top, xx = W / 2 + (j - (n - 1) / 2) * g.dx * g.cam;
            it.push({ id: 'h', text: 'double helix', x: xx, y: yy, side: 'T' });
          }
          return it;
        }
      });
    }
  }));

  /* ==================================================================================== 6. preparing a food sample */
  /* the food in the mortar: sixty grains that start as nine broken chunks (each chunk is its grains packed together) and are ground
     apart into fine crumbs (Daniel, 24 Nov 2026: "make sure that the pieces look a bit more professionally done") */
  var GRAINS = (function () {
    var R = D.rng(31), chunks = [], out = [];
    for (var k = 0; k < 9; k++) chunks.push([(R() - .5) * 84, (R() - .5) * 6, .6 + R() * .5]);
    for (var i = 0; i < 60; i++) {
      var ch = chunks[i % 9], a = R() * TAU, sides = 5 + Math.floor(R() * 3), shape = [];
      for (var v = 0; v < sides; v++) shape.push(.72 + R() * .42);
      out.push({ cx: ch[0] + Math.cos(a) * 5 * ch[2], cy: ch[1] + Math.sin(a) * 2.2, fx: (R() - .5) * 96, fy: (R() - .5) * 8, rot: R() * TAU, shape: shape, tone: R(), big: ch[2] });
    }
    return out;
  })();
  function grain(c, x, y, s, g) {
    c.beginPath();
    g.shape.forEach(function (k, v) { var a = g.rot + v * TAU / g.shape.length; c[v ? 'lineTo' : 'moveTo'](x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * .8); });
    c.closePath();
    var lg = c.createLinearGradient(x - s, y - s, x + s, y + s);
    lg.addColorStop(0, D.mixHex('#F6EED6', '#E9DDB6', g.tone)); lg.addColorStop(1, D.mixHex('#C9B583', '#B49D66', g.tone));
    c.fillStyle = lg; c.fill(); c.strokeStyle = 'rgba(110,88,48,.55)'; c.lineWidth = .5; c.stroke();
  }
  function mortar(c, x, y, grind, stir, water, t) {
    /* a white porcelain mortar: glazed outside, a matt grey inside, a lip for pouring */
    c.save();
    c.beginPath(); c.moveTo(x - 68, y); c.bezierCurveTo(x - 66, y + 46, x - 30, y + 62, x, y + 62); c.bezierCurveTo(x + 30, y + 62, x + 66, y + 46, x + 68, y); c.closePath();
    var lg = c.createLinearGradient(x - 68, 0, x + 68, 0); lg.addColorStop(0, '#D7DDE3'); lg.addColorStop(.35, '#FBFCFD'); lg.addColorStop(1, '#A9B4BF');
    c.fillStyle = lg; c.fill(); c.strokeStyle = '#7A8794'; c.lineWidth = 1.1; c.stroke();
    D.rr(c, x - 30, y + 58, 60, 9, 4); c.fillStyle = '#C7CFD7'; c.fill(); c.strokeStyle = '#7A8794'; c.stroke();
    c.beginPath(); c.ellipse(x, y, 68, 11, 0, 0, TAU); c.fillStyle = '#E9EDF1'; c.fill(); c.strokeStyle = '#7A8794'; c.stroke();
    c.beginPath(); c.ellipse(x, y + 1.5, 60, 8, 0, 0, TAU); var ig = c.createRadialGradient(x, y + 3, 4, x, y + 2, 62); ig.addColorStop(0, '#B9C1C9'); ig.addColorStop(1, '#8E99A4'); c.fillStyle = ig; c.fill();
    c.beginPath(); c.ellipse(x, y + 1.5, 60, 8, 0, 0, TAU); c.clip();
    GRAINS.forEach(function (g, i) {
      var k = ease(clamp(grind * 1.15 - (i % 9) * .02)), s = lerp(5.4 * g.big, 1.7, k);
      grain(c, x + lerp(g.cx, g.fx * .56, k), y + 2 + lerp(g.cy, g.fy * .5, k), s, g);
    });
    /* the water, rising over the ground food; the soluble part colours it a little */
    if (water > 0) { c.fillStyle = 'rgba(176,214,236,' + (.55 * water).toFixed(3) + ')'; c.fillRect(x - 62, y - 9 + 9 * (1 - water), 124, 22); c.fillStyle = 'rgba(255,255,255,' + (.35 * water).toFixed(3) + ')'; c.fillRect(x - 62, y - 9 + 9 * (1 - water), 124, .9); }
    c.restore();
    /* the pestle: a white porcelain rod with a rounded end, worked in the bowl */
    var sw = grind > 0 && grind < 1 ? Math.sin((t || 0) * 5) * 14 : stir > 0 ? Math.sin((t || 0) * 3.4) * 24 * stir : 0;
    c.save(); c.translate(x + 16 + sw, y + 2); c.rotate(.42 + sw * .012);
    c.beginPath(); c.moveTo(-5, -96); c.lineTo(5, -96); c.lineTo(8, -14); c.quadraticCurveTo(9, 2, 0, 3); c.quadraticCurveTo(-9, 2, -8, -14); c.closePath();
    var pg = c.createLinearGradient(-9, 0, 9, 0); pg.addColorStop(0, '#E2E7EC'); pg.addColorStop(.4, '#FFFFFF'); pg.addColorStop(1, '#A5B0BB');
    c.fillStyle = pg; c.fill(); c.strokeStyle = '#7A8794'; c.lineWidth = 1; c.stroke(); c.restore();
  }
  /* a wash bottle of distilled water, the way water is added in a laboratory: a soft plastic bottle, its cap and its bent spout.
     Its base stands at (x, y); `tilt` 0…1 leans it towards the mortar, its spout pointing down into the bowl; `sq` squeezes it. */
  var WB = { s: .8, lean: .62 };
  function washBottle(c, x, y, tilt, sq) {
    c.save(); c.translate(x, y); c.rotate(WB.lean * tilt); c.scale(WB.s, WB.s);
    var w = 30 - 3 * sq;
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -58); c.quadraticCurveTo(-w / 2, -70, -8, -72); c.lineTo(8, -72); c.quadraticCurveTo(w / 2, -70, w / 2, -58); c.lineTo(w / 2, 0); c.quadraticCurveTo(w / 2, 4, 0, 4); c.quadraticCurveTo(-w / 2, 4, -w / 2, 0); c.closePath();
    var bg = c.createLinearGradient(-w / 2, 0, w / 2, 0); bg.addColorStop(0, 'rgba(236,244,250,.9)'); bg.addColorStop(.4, 'rgba(255,255,255,.95)'); bg.addColorStop(1, 'rgba(196,212,226,.9)');
    c.fillStyle = bg; c.fill(); c.strokeStyle = '#8796A5'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(176,214,236,.55)'; c.fillRect(-w / 2 + 1.5, -36, w - 3, 38);
    D.rr(c, -8, -80, 16, 9, 2); c.fillStyle = '#3E7CC3'; c.fill(); c.strokeStyle = '#2A5A92'; c.stroke();
    c.strokeStyle = '#C9D6E2'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -96); c.quadraticCurveTo(0, -104, 12, -104); c.lineTo(24, -104); c.stroke();
    c.strokeStyle = '#8796A5'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -96); c.quadraticCurveTo(0, -104, 12, -104); c.lineTo(24, -104); c.stroke();
    c.fillStyle = '#FFFFFF'; D.rr(c, -w / 2 + 3, -54, w - 6, 13, 2); c.fill();
    c.fillStyle = '#10202E'; c.font = '700 6.5px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H\u2082O', 0, -47.5);
    c.restore();
    return bottleAt(x, y, tilt, 24, -104);
  }
  /* a point (u, v) of the bottle, in the picture: its spout's tip is (24, -104), the middle of its body (0, -36) */
  function bottleAt(x, y, tilt, u, v) { var a = WB.lean * tilt, k = WB.s; return [x + k * (u * Math.cos(a) - v * Math.sin(a)), y + k * (u * Math.sin(a) + v * Math.cos(a))]; }
  /* the funnel: `level` how much mixture is still in the paper, `res` the solid left on it, `fill` the filtrate below */
  function funnelFlask(c, x, y, level, res, fill, drip) {
    c.beginPath(); c.moveTo(x - 9, y + 54); c.lineTo(x - 9, y + 74); c.lineTo(x - 44, y + 136); c.quadraticCurveTo(x, y + 142, x + 44, y + 136); c.lineTo(x + 9, y + 74); c.lineTo(x + 9, y + 54);
    c.save(); c.closePath(); c.fillStyle = 'rgba(190,220,240,.08)'; c.fill(); c.clip();
    c.fillStyle = 'rgba(240,235,205,.26)'; c.fillRect(x - 50, y + 140 - 16 * fill, 100, 16 * fill + 4); c.restore();
    c.beginPath(); c.moveTo(x - 9, y + 54); c.lineTo(x - 9, y + 74); c.lineTo(x - 44, y + 136); c.quadraticCurveTo(x, y + 142, x + 44, y + 136); c.lineTo(x + 9, y + 74); c.lineTo(x + 9, y + 54);
    c.strokeStyle = C.glass; c.lineWidth = 1.8; c.stroke();
    /* the stem is open at its tip, so the filtrate can leave */
    c.beginPath(); c.moveTo(x - 50, y - 16); c.lineTo(x - 5, y + 38); c.lineTo(x - 4, y + 68); c.moveTo(x + 4, y + 68); c.lineTo(x + 5, y + 38); c.lineTo(x + 50, y - 16); c.strokeStyle = C.glass; c.lineWidth = 1.9; c.stroke();
    c.beginPath(); c.moveTo(x - 43, y - 12); c.lineTo(x, y + 36); c.lineTo(x + 43, y - 12); c.closePath(); c.fillStyle = '#F4F2E7'; c.fill(); c.strokeStyle = '#B9B28F'; c.lineWidth = 1; c.stroke();
    if (level > 0) {
      var yl = lerp(y + 30, y - 6, level), hw = 43 * (y + 36 - yl) / 48;
      c.beginPath(); c.moveTo(x - hw, yl); c.lineTo(x, y + 36); c.lineTo(x + hw, yl); c.closePath(); c.fillStyle = '#DCD6B8'; c.fill();
    }
    if (res > 0) {
      var yr = y + 36 - 24 * res, hr = 43 * (y + 36 - yr) / 48;
      c.beginPath(); c.moveTo(x - hr, yr); c.lineTo(x, y + 36); c.lineTo(x + hr, yr); c.closePath(); c.fillStyle = '#B9A878'; c.fill();
    }
    if (drip != null) D.drop(c, x, y + 74 + drip * 44, 'rgba(229,223,194,.8)', 2.6);
  }
  L.add('prepfilm', Film({
    title: 'Preparing a food for testing',
    aria: 'A solid food is ground with a pestle in a mortar, distilled water is added from a wash bottle and stirred, and the mixture is filtered: the filtrate passes through and the residue stays on the paper. Each test has its own labelled tube: the filtrate, the mixture, or for the ethanol test fresh food with no water.',
    M: [0, 6, 11, 17, 23.5],
    steps: [
      { t: 0, still: 5.8, h: 'Grind the food', p: [['ig', 'Most foods are solid. Cut a small piece.'], ['ig', 'Then **grind** it with a **pestle and mortar**.', 'card']] },
      { t: 6, still: 10.8, h: 'Add water', p: [['ig', 'Add a little **distilled water** from a wash bottle and stir.', 'card'], ['ig', 'Substances that are soluble dissolve in the water.']] },
      { t: 11, still: 16.8, h: 'Filter', p: [['ig', 'If solid pieces hide the colour of a test, **filter** the mixture. The liquid that passes through is the **filtrate**. The solid left on the filter paper is the **residue**.', 'card']] },
      { t: 17, still: 23.2, h: 'Label the tubes', p: [['ig', 'Put each sample in its own **labelled test tube**.'], ['ig', 'Use the **filtrate** for Benedict’s solution and DCPIP. Starch grains and many proteins stay in the residue, so use the **mixture** for iodine and biuret.', 'card'], ['ig', 'For the **ethanol** test, crush a fresh piece of food with **no water**: fats do not dissolve in water.', 'card']] }
    ],
    make: function () {
      var W = 560, H = 420, TY = 94, TH = 246, TW = 50;
      return scene(W, H, {
        draw: function (c, t, amb) {
          /* one picture leaves before the next arrives: two pictures are never laid over each other */
          var fade1 = 1 - seg(t, 11, 11.35), fade2 = seg(t, 11.35, 11.8) * (1 - seg(t, 17, 17.35)), fade3 = seg(t, 17.35, 17.9);
          if (fade1 > 0) {
            c.globalAlpha = fade1;
            var gr = seg(t, .6, 5.4), wat = seg(t, 6.5, 8.4), stir = t >= 8.4 && t < 10.8 ? 1 : 0;
            c.save(); c.translate(W / 2, 222); c.scale(1.95, 1.95); c.translate(-W / 2, -167);
            mortar(c, W / 2, 184, gr, stir, wat, t);
            if (t >= 6 && t < 8.9) {
              /* the wash bottle comes over the mortar, is squeezed, and a thin stream of distilled water runs into the bowl */
              var po = seg(t, 6, 6.5) * (1 - seg(t, 8.4, 8.9)), on = t > 6.5 && t < 8.4;
              c.globalAlpha = fade1 * po;
              var tip = washBottle(c, W / 2 - 104, 198, ease(seg(t, 6, 6.5)), on ? .5 + .5 * Math.sin(t * 9) : 0);
              if (on) {
                c.strokeStyle = 'rgba(176,214,236,.95)'; c.lineWidth = 1.6; c.lineCap = 'round';
                c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(tip[0] + 14, tip[1] + 4, W / 2 - 20, 183); c.stroke();
              }
              c.globalAlpha = fade1;
            }
            c.restore();
            c.globalAlpha = 1;
          }
          if (fade2 > 0) {
            c.globalAlpha = fade2;
            var fl = seg(t, 11.8, 16.2);
            c.save(); c.translate(W / 2, H / 2 + 4); c.scale(2.1, 2.1); c.translate(-W / 2, -141);
            funnelFlask(c, W / 2, 78, 1 - fl, fl, fl, t > 11.8 && t < 16.2 ? (amb * 1.3 + t * 1.3) % 1 : null);
            c.restore();
            c.globalAlpha = 1;
          }
          if (fade3 > 0) {
            c.globalAlpha = fade3;
            var xs = [88, 184, 280, 376, 472], names = ['iodine', 'Benedict’s', 'biuret', 'ethanol', 'DCPIP'];
            D.rack(c, 36, 524, TY + TH * .44, TH * .6);
            /* which sample each test uses (the 0610 mark schemes and examiner reports): the filtrate for Benedict's solution and DCPIP; the
               mixture for iodine and biuret, because starch grains and many proteins stay in the residue; for the ethanol test, a fresh
               piece of food crushed with no water, because fats do not dissolve in water (examiner reports 2010, 2019, 2025) */
            var what = ['mixture', 'filtrate', 'mixture', 'food, no water', 'filtrate'];
            xs.forEach(function (x, i) {
              var k = seg(t, 18 + i * .8, 18.8 + i * .8), dry = i === 3, unf = i === 0 || i === 2;
              D.tube(c, x, TY, TW, TH, dry ? null : { col: unf ? '#D9D2B3' : 'rgba(240,235,205,.26)', level: .46 * k + .001, cloud: unf ? .45 : 0, bits: unf && k > .5 ? 12 : 0, bitsCol: 'rgba(120,100,60,.55)' });
              if (dry && k > 0) GRAINS.slice(0, 14).forEach(function (g, j) { grain(c, x + (j % 5 - 2) * 7 + (j > 9 ? 3 : 0), TY + TH - 10 - Math.floor(j / 5) * 6 + (1 - k) * -40, 4.2, g); });
              if (k > .2) { var fs = D.textSize(c, 11.5, 9.5); c.font = '600 ' + fs + 'px Inter, system-ui, sans-serif'; c.fillStyle = 'rgba(236,244,250,' + (.9 * seg(k, .2, .6)).toFixed(3) + ')'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(what[i], x, TY + TH + 30); }
              c.fillStyle = '#F4F7FA'; D.rr(c, x - 44, TY - 32, 88, 24, 5); c.fill();
              c.fillStyle = '#10202E'; c.font = '600 ' + D.textSize(c, 13, 10) + 'px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(names[i], x, TY - 19.5);
            });
            c.globalAlpha = 1;
          }
        },
        labels: function (t) {
          if (t < 6) return [{ id: 'm', text: 'mortar', x: W / 2 - 78, y: 335, side: 'B' }, { id: 'p', text: 'pestle', x: W / 2 + 92 + (t > .6 && t < 5.4 ? Math.sin(t * 5) * 27 : 0), y: 88, side: 'T' }];
          if (t >= 6.5 && t < 8.4) { var bm = bottleAt(W / 2 - 104, 198, 1, 0, -36); return [{ id: 'wb', text: 'distilled water', x: W / 2 + (bm[0] - W / 2) * 1.95, y: 222 + (bm[1] - 167) * 1.95, side: 'T' }]; }
          if (t >= 12.2 && t < 17) { var fl = [{ id: 'fp', text: 'filter paper', x: W / 2 - 52, y: 76, side: 'T' }]; if (t >= 13.5) { fl.push({ id: 'ft', text: 'filtrate', x: W / 2, y: 354, side: 'B' }); fl.push({ id: 'rs', text: 'residue', x: W / 2 + 17, y: 134, side: 'T' }); } return fl; }
          return [];
        }
      });
    }
  }));

  /* ==================================================================================== 7–11. the five food tests
     Two tubes side by side, on a white tile so the true colours can be read: the food, and water as a control. */
  function dropperAt(t, a, X1, X2) {
    var y = 60, x, sq = 0;
    if (t < a) return null;
    if (t < a + 1) x = lerp(X1 + 170, X1, ease(seg(t, a, a + 1)));
    else if (t < a + 2.4) { x = X1; sq = Math.abs(Math.sin((t - a - 1) * Math.PI * 3 / 1.4)); }
    else if (t < a + 3.2) x = lerp(X1, X2, ease(seg(t, a + 2.4, a + 3.2)));
    else if (t < a + 4.6) { x = X2; sq = Math.abs(Math.sin((t - a - 3.2) * Math.PI * 3 / 1.4)); }
    else if (t < a + 5.4) x = lerp(X2, X2 + 200, ease(seg(t, a + 4.6, a + 5.4)));
    else return null;
    return { x: x, y: y, sq: sq };
  }
  function dropsIn(c, t, a, x, y0, y1, col) {
    for (var k = 0; k < 3; k++) { var t0 = a + k * .46, u = seg(t, t0, t0 + .42); if (u > 0 && u < 1) D.drop(c, x, lerp(y0, y1, u * u), col); }
  }
  function tag(c, x, y, text) {
    var fs = D.textSize(c, 12), hh = 20 * fs / 12;
    c.font = '600 ' + fs + 'px Inter, system-ui, sans-serif'; var w = c.measureText(text).width + 14 * fs / 12;
    c.fillStyle = '#FFFFFF'; D.rr(c, x - w / 2, y, w, hh, 5); c.fill(); c.strokeStyle = '#A9B6C2'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#10202E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + hh / 2 + .5);
  }
  function twoTubes(cfg) {
    var W = 560, H = 420, X1 = 170, X2 = 390, Y = 84, TW = 78, TH = 226, RY = 213, BY = 176, BH = 176, BW = 460;
    return function () {
      return scene(W, H, {
        draw: function (c, t, amb) {
          D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true);
          var st = cfg.state(t), dy = st.dy || 0, shake = st.shake ? Math.sin(t * 22) * 3 * st.shake : 0, bA = st.bathA || 0;
          if (bA < 1) { c.globalAlpha = 1 - bA; D.rack(c, X1 - 86, X2 + 86, RY, 107); c.globalAlpha = 1; }
          var pa = dropperAt(t, cfg.addAt, X1, X2);
          if (bA > 0) { c.globalAlpha = bA; D.bath(c, W / 2, BY, BW, BH, st.bath, amb + t); c.globalAlpha = 1; }
          D.tube(c, X1 + shake, Y + dy, TW, TH, T.liquid(cfg.test, cfg.food, st.a1, st.d1, st.level));
          D.tube(c, X2 + shake, Y + dy, TW, TH, T.liquid(cfg.test, 'water', st.a2, st.d2, st.level));
          if (bA > 0) { c.fillStyle = 'rgba(127,196,236,' + (.07 * bA).toFixed(3) + ')'; c.fillRect(W / 2 - BW / 2, BY + BH * .24, BW, BH * .76); }
          tag(c, X1, 378, cfg.tagA ? cfg.tagA(t) : cfg.foodName); tag(c, X2, 378, cfg.tagB ? cfg.tagB(t) : 'water (control)');
          if (pa) {
            var col2 = cfg.reagentCol2 || cfg.reagentCol, col = pa.x > (X1 + X2) / 2 && t > cfg.addAt + 2.8 ? col2 : cfg.reagentCol;
            D.dropper(c, pa.x, pa.y, col, pa.sq);
            if (Math.abs(pa.x - X1) < 1) dropsIn(c, t, cfg.addAt + 1, X1, pa.y + 6, Y + TH * .5 + 6, cfg.reagentCol);
            if (Math.abs(pa.x - X2) < 1) dropsIn(c, t, cfg.addAt + 3.2, X2, pa.y + 6, Y + TH * .5 + 6, col2);
          }
          if (cfg.overlay) cfg.overlay(c, t);
        },
        labels: function () { return []; }
      });
    };
  }
  function simple(test, food, foodName, reagentCol, extra) {
    var o = {
      test: test, food: food, foodName: foodName, reagentCol: reagentCol, addAt: 4,
      state: function (t) {
        return { a1: seg(t, 5.2, 6.4), a2: seg(t, 7.4, 8.6), d1: ease(seg(t, 10.2, 12.6)), d2: ease(seg(t, 10.2, 12.6)), shake: extra && t >= 9.2 && t < 10.2 ? 1 : 0 };
      }
    };
    return o;
  }

  L.add('iodinefilm', Film({
    title: 'The iodine test for starch',
    aria: 'Iodine solution is added to a food and to water. The food turns blue-black because it contains starch. The water stays orange-brown.',
    M: [0, 4, 10, 16],
    steps: [
      { t: 0, still: 3.7, h: 'Two tubes', p: [['ig', 'One tube holds the **food** in water. The other holds only **water**: this is the **control**.']] },
      { t: 4, still: 9.8, h: 'Add iodine solution', p: [['ig', 'Add two or three drops of **iodine solution**, which is **orange-brown**, to each tube.', 'card']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', '**Blue-black** shows that **starch** is present.', 'card'], ['ig', 'The control stays orange-brown.']] }
    ],
    make: twoTubes(simple('iodine', 'cornflour', 'cornflour in water', C.iodine))
  }));

  L.add('benedictfilm', Film({
    title: 'The Benedict’s test for reducing sugars',
    aria: 'Benedict’s solution is added to a food and to water. Both tubes are heated in a hot water bath. The food turns brick red because it contains a reducing sugar. The water stays blue.',
    M: [0, 4, 10, 18, 25],
    steps: [
      { t: 0, still: 3.7, h: 'Two tubes', p: [['ig', 'One tube holds the **food** in water. The other holds only **water**, the control.']] },
      { t: 4, still: 9.8, h: 'Add Benedict’s solution', p: [['ig', 'Add **Benedict’s solution**, which is **blue**, to each tube.', 'card'], ['ig', 'Nothing changes yet.']] },
      { t: 10, still: 17.7, h: 'Heat in a water bath', p: [['ig', '**Heat** the tubes in a **hot water bath** for a few minutes.', 'card'], ['ig', 'Never use a flame on the tube directly.']] },
      { t: 18, still: 24.7, h: 'Observe the colour', p: [['ig', 'With a **reducing sugar**, the colour changes from blue to **green, yellow, orange or brick red**. A higher concentration of reducing sugar gives a colour further along this list.', 'card'], ['ig', 'The control stays blue.']] }
    ],
    make: twoTubes({
      test: 'benedict', food: 'honey', foodName: 'honey in water', reagentCol: C.ben[0], addAt: 4,
      state: function (t) {
        var inb = ease(seg(t, 10.3, 11.9)) * (1 - ease(seg(t, 18.2, 19.8)));
        return { a1: seg(t, 5.2, 6.4), a2: seg(t, 7.4, 8.6), d1: seg(t, 12, 17.8), d2: 0, dy: inb * 30, bathA: clamp(seg(t, 10, 10.8) * (1 - seg(t, 19.2, 20.2))), bath: clamp(seg(t, 10.8, 11.6) * (1 - seg(t, 18, 18.8))) };
      },
      /* the five colours, with a marker that moves along them to the colour of this food */
      overlay: function (c, t) {
        var a = seg(t, 20, 20.8); if (a <= 0) return;
        c.globalAlpha = a;
        var names = ['blue', 'green', 'yellow', 'orange', 'brick red'], bw = 74, x0 = 280 - bw * 2.5, y0 = 22;
        names.forEach(function (n, i) {
          c.fillStyle = C.ben[i]; D.rr(c, x0 + i * bw + 2, y0, bw - 4, 21, 4); c.fill();
          c.fillStyle = i === 2 ? '#10202E' : '#FFFFFF'; c.font = '600 ' + D.textSize(c, 12, 9.5) + 'px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(n, x0 + (i + .5) * bw, y0 + 11);
        });
        var m = x0 + 4.5 * bw;
        c.fillStyle = '#10202E'; c.beginPath(); c.moveTo(m, y0 + 24); c.lineTo(m - 7, y0 + 35); c.lineTo(m + 7, y0 + 35); c.closePath(); c.fill();
        c.globalAlpha = 1;
      }
    })
  }));

  L.add('biuretfilm', Film({
    title: 'The biuret test for protein',
    aria: 'Biuret solution is added to a food and to water, and the tubes are shaken. The food turns purple because it contains protein. The water stays blue.',
    M: [0, 4, 10, 16],
    steps: [
      { t: 0, still: 3.7, h: 'Two tubes', p: [['ig', 'One tube holds the **food** in water. The other holds only **water**, the control.']] },
      { t: 4, still: 9.8, h: 'Add biuret solution', p: [['ig', 'Add **biuret solution**, which is **blue**, to each tube and shake gently.', 'card']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', '**Purple** shows that **protein** is present.', 'card'], ['ig', 'The control stays blue.']] }
    ],
    make: twoTubes(simple('biuret', 'gelatine', 'gelatine in water', C.biuret, true))
  }));

  L.add('dcpipfilm', Film({
    title: 'The DCPIP test for vitamin C',
    aria: 'A food solution is added, one drop at a time, to blue DCPIP. With vitamin C the blue colour disappears. With water the DCPIP stays blue.',
    M: [0, 4, 10, 16],
    steps: [
      { t: 0, still: 3.7, h: 'Blue DCPIP', p: [['ig', 'Put some **DCPIP solution**, which is **blue**, in two test tubes.', 'card']] },
      { t: 4, still: 9.8, h: 'Add the food', p: [['ig', 'Add the **food solution**, **one drop at a time**, to one tube, and water to the other (the control).', 'card']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', 'The blue colour disappears: **vitamin C** is present. The liquid becomes **colourless**, or the pale colour of the food.', 'card'], ['ig', 'The control stays blue.']] }
    ],
    make: twoTubes({
      test: 'dcpip', food: 'kiwi', reagentCol: '#B7D67A', reagentCol2: C.water, addAt: 4,
      tagA: function (t) { return t < 5 ? 'DCPIP' : 'DCPIP + kiwi fruit'; },
      tagB: function (t) { return t < 7.2 ? 'DCPIP' : 'DCPIP + water (control)'; },
      state: function (t) { return { a1: 1, a2: 1, d1: ease(seg(t, 6, 12.6)), d2: 0 }; }
    })
  }));

  /* ---------- the emulsion test has two stages: shake with ethanol, then pour into water. On the dark ground, where a
     white cloud shows best. ---------- */
  L.add('emulsionfilm', Film({
    title: 'The ethanol emulsion test for fats and oils',
    aria: 'A food is shaken with ethanol, and the liquid is poured into a tube of water. With a fat or an oil a cloudy white emulsion forms. With no fat the water stays clear.',
    M: [0, 4, 9, 14, 21, 27],
    steps: [
      { t: 0, still: 3.7, h: 'Two tubes', p: [['ig', 'One tube holds the **food**. The other holds only **water**, the control.']] },
      { t: 4, still: 8.8, h: 'Add ethanol', p: [['ig', 'Add **ethanol** to each tube. Keep ethanol away from flames.']] },
      { t: 9, still: 13.8, h: 'Shake', p: [['ig', '**Shake** the tubes.', 'card'], ['ig', 'Fats and oils dissolve in ethanol.']] },
      { t: 14, still: 20.8, h: 'Pour into water', p: [['ig', 'Pour the liquid from each tube into a clean tube of **water**.', 'card']] },
      { t: 21, still: 26.8, h: 'Observe the result', p: [['ig', 'A **cloudy white emulsion** shows that a **fat or oil** is present.', 'card'], ['ig', 'The control stays clear.'], ['ib', 'Lipids dissolve in non-polar solvents, and in ethanol, but only sparingly (very little) in water: they are **hydrophobic**. In water the lipid separates as tiny droplets, which scatter light, so the emulsion looks cloudy white.']] }
    ],
    make: (global.MolShapes.emulsion = function () {
      var W = 560, H = 420, X = [100, 216, 344, 460], Y = 128, TW = 56, TH = 196, TILT = 1.85;
      function pourK(i, t) { var from = i === 0 ? 14.7 : 17.4; return ease(seg(t, from, from + .7)) * (1 - ease(seg(t, from + 2.3, from + 3))); }
      function drained(i, t) { var from = i === 0 ? 15.4 : 18.1; return seg(t, from, from + 1.5); }
      function liq(i, t) {
        var food = i < 2 ? 'sesame' : 'water', add = seg(t, i < 2 ? 5 : 6.6, i < 2 ? 6.2 : 7.8), sh = seg(t, 9.3, 12);
        if (i === 0 || i === 2) {
          var dr = drained(i, t), lv = .15 + .19 * add, k = pourK(i, t);
          var q = T.liquid('emulsion', food, food === 'sesame' ? add * Math.max(.25, sh) : add, 0, lv * (1 - dr) + .001);
          if (food === 'water') q.col = C.clear;
          q.anchor = k;
          return q;
        }
        var from = i === 1 ? 15.4 : 18.1, po = seg(t, from, from + 1.5);
        /* where the oil in ethanol meets the water it comes out as droplets, so the water turns cloudy as it is poured */
        return { col: C.clear, level: .34 + .28 * po, cloud: food === 'sesame' ? .95 * po : 0, oil: 0 };
      }
      return scene(W, H, {
        draw: function (c, t) {
          D.rack(c, 40, 520, Y + TH * .6, 92);
          var sh = t >= 9.3 && t < 13 ? Math.sin(t * 22) * 3.5 : 0, wA = seg(t, 14, 14.6);
          /* the clean water tubes are brought in for the fourth step */
          [1, 3].forEach(function (i) { if (wA > 0) { c.globalAlpha = wA; D.tube(c, X[i], Y + (1 - wA) * 14, TW, TH, liq(i, t)); c.globalAlpha = 1; } });
          [0, 2].forEach(function (i) {
            var k = pourK(i, t), tilt = k * TILT;
            /* in the pouring position the mouth lies over the water tube, and lower than the closed end */
            var px = X[i + 1] - Math.sin(TILT) * TH / 2, py = Y - 22 - TH / 2 + Math.cos(TILT) * TH / 2;
            var x = lerp(X[i], px, k), y = lerp(Y, py, k);
            D.tube(c, x + (k ? 0 : sh), y, TW, TH, liq(i, t), tilt);
            var dr = drained(i, t);
            if (k > .92 && dr > 0 && dr < 1) {
              var mx = x + Math.sin(tilt) * TH / 2, my = y + TH / 2 - Math.cos(tilt) * TH / 2;
              c.strokeStyle = i === 0 ? '#EFE4BF' : 'rgba(200,226,242,.9)'; c.lineWidth = 4; c.lineCap = 'round';
              c.beginPath(); c.moveTo(mx + 2, my + 8); c.quadraticCurveTo(X[i + 1] + 3, my + 26, X[i + 1], Y + TH * (1 - .34 - .28 * dr)); c.stroke();
            }
          });
          var m = seg(t, 14, 14.6);
          tag(c, lerp(X[0], (X[0] + X[1]) / 2, m), 366, 'sesame oil');
          tag(c, lerp(X[2], (X[2] + X[3]) / 2, m), 366, 'water (control)');
          var pa = t >= 4 && t < 9 ? (t < 4.9 ? lerp(X[0] + 170, X[0], ease(seg(t, 4, 4.9))) : t < 6.2 ? X[0] : t < 6.6 ? lerp(X[0], X[2], ease(seg(t, 6.2, 6.6))) : t < 7.9 ? X[2] : lerp(X[2], X[2] + 180, ease(seg(t, 7.9, 8.7)))) : null;
          if (pa != null) {
            D.dropper(c, pa, Y - 20, C.ethanol, (t > 5 && t < 6.2) || (t > 6.7 && t < 7.8) ? Math.abs(Math.sin(t * 8)) : 0);
            if (Math.abs(pa - X[0]) < 1) dropsIn(c, t, 5, X[0], Y - 14, Y + TH * .78, C.ethanol);
            if (Math.abs(pa - X[2]) < 1) dropsIn(c, t, 6.7, X[2], Y - 14, Y + TH * .78, C.ethanol);
          }
        },
        labels: function (t) {
          var it = [], top = function (lv) { return Y + TH * (1 - lv); };
          if (t < 4) it.push({ id: 'oil', text: 'sesame oil', x: X[0], y: top(.15) + 2, side: 'T' });
          if (t >= 14.2 && t < 14.8) it.push({ id: 'w', text: 'clean water', x: X[1], y: top(.34) + 2, side: 'T' });
          if (t >= 21) { it.push({ id: 'e', text: 'cloudy white emulsion', x: X[1], y: top(.62) + 3, side: 'T' }); it.push({ id: 'c', text: 'stays clear', x: X[3], y: top(.62) + 3, side: 'T' }); }
          return it;
        }
      });
    })
  }));
})(window);
