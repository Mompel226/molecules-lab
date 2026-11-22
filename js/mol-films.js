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

  /* ======================================================================= the same glucose rings, joined three ways */
  var POLY = (function () {
    var W = 560, H = 330, N = 46, R = D.rng(11);
    function empty() { return { p: [], links: [], r: 8 }; }
    var scatter = empty();
    for (var i = 0; i < N; i++) scatter.p.push([34 + R() * (W - 68), 34 + R() * (H - 68), R() * TAU]);
    /* a single chain */
    var chain = empty(); chain.r = 7.2;
    for (var a = 0; a < N; a++) {
      var u = a / (N - 1);
      chain.p.push([30 + u * (W - 60), H / 2 + Math.sin(u * TAU * 1.5) * 58, 0]);
      if (a) chain.links.push([a - 1, a]);
    }
    /* starch: a long chain with a few branches */
    var starch = empty(); starch.r = 7.6;
    function along(out, x, y, ang, n, sp, bend) {
      for (var k = 0; k < n; k++) { ang += bend || 0; x += sp * Math.cos(ang); y += sp * Math.sin(ang); out.push([x, y, ang]); }
    }
    var st = [];
    for (var s0 = 0; s0 < 28; s0++) { var q = s0 / 27; st.push([40 + q * 480, 112 + Math.sin(q * TAU * 1.05 + .4) * 34, 0]); }
    for (var l0 = 1; l0 < 28; l0++) starch.links.push([l0 - 1, l0]);
    var b1 = st[8], b2 = st[19];
    var i1 = st.length; along(st, b1[0], b1[1], 2.0, 9, 17.6, -.05);
    for (var l1 = i1; l1 < i1 + 9; l1++) starch.links.push([l1 === i1 ? 8 : l1 - 1, l1]);
    var i2 = st.length; along(st, b2[0], b2[1], 1.1, 9, 17.6, .05);
    for (var l2 = i2; l2 < i2 + 9; l2++) starch.links.push([l2 === i2 ? 19 : l2 - 1, l2]);
    starch.p = st;
    /* glycogen: many short branches from the middle */
    var gly = empty(); gly.r = 6.8; gly.p.push([W / 2, H / 2 + 2, 0]);
    function grow(from, ang, n, depth) {
      var x = gly.p[from][0], y = gly.p[from][1], prev = from;
      for (var k = 0; k < n; k++) {
        x += 15.4 * Math.cos(ang); y += 15.4 * Math.sin(ang);
        gly.p.push([x, y, ang]); gly.links.push([prev, gly.p.length - 1]); prev = gly.p.length - 1;
      }
      if (depth > 0) { grow(prev, ang - .62, depth === 2 ? 3 : 1, depth - 1); grow(prev, ang + .62, depth === 2 ? 3 : 1, depth - 1); }
    }
    [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6].forEach(function (a0) { grow(0, a0, 5, 2); });
    /* cellulose: straight chains lying side by side, with links between them */
    var cel = empty(); cel.r = 9.6; cel.cross = [];
    var rows = [12, 11, 12, 11], k = 0, rowY = [H / 2 - 66, H / 2 - 22, H / 2 + 22, H / 2 + 66], first = [];
    rows.forEach(function (n, ri) {
      first.push(k);
      var x0 = W / 2 - (n - 1) * 39 / 2;
      for (var j = 0; j < n; j++) { cel.p.push([x0 + j * 39, rowY[ri], 0]); if (j) cel.links.push([k - 1, k]); k++; }
    });
    for (var r1 = 0; r1 < 3; r1++) {
      var n1 = rows[r1], n2 = rows[r1 + 1];
      for (var j1 = 0; j1 < Math.min(n1, n2); j1 += 2) cel.cross.push([first[r1] + j1 + (n1 > n2 ? 1 : 0), first[r1 + 1] + j1 + (n2 > n1 ? 1 : 0)]);
    }
    if ([chain, starch, gly, cel].some(function (m) { return m.p.length !== N; })) throw new Error('polymer layouts must have ' + N + ' rings: ' + [chain.p.length, starch.p.length, gly.p.length, cel.p.length]);
    /* the ring at the tip of the top branch of glycogen: its name's line ends here, over no other ring */
    var tip = 0; gly.p.forEach(function (p, ix) { if (p[1] < gly.p[tip][1]) tip = ix; });
    gly.tip = tip;
    return { W: W, H: H, N: N, scatter: scatter, chain: chain, starch: starch, glycogen: gly, cellulose: cel };
  })();
  /* draw the rings at the moment k (0…1) of the move from layout a to layout b; drift: small movement of free molecules */
  function drawPoly(c, a, b, k, drift, amb) {
    var P = [], rr = lerp(a.r, b.r, k);
    for (var i = 0; i < POLY.N; i++) {
      var x = lerp(a.p[i][0], b.p[i][0], k), y = lerp(a.p[i][1], b.p[i][1], k), rot = lerp(a.p[i][2], b.p[i][2], k);
      if (drift) { x += Math.sin(amb * .7 + i * 1.9) * 5 * drift; y += Math.cos(amb * .6 + i * 2.7) * 5 * drift; rot += Math.sin(amb * .4 + i) * .4 * drift; }
      P.push([x, y, rot]);
    }
    var la = 1 - clamp(k * 3), lb = clamp((k - .6) / .4), w = rr * .36;
    if (a.links.length && la > 0) a.links.forEach(function (q) { D.link(c, P[q[0]][0], P[q[0]][1], P[q[1]][0], P[q[1]][1], w, la); });
    if (b.links.length && lb > 0) b.links.forEach(function (q) { D.link(c, P[q[0]][0], P[q[0]][1], P[q[1]][0], P[q[1]][1], w, lb); });
    var cr = b.cross && lb > 0 ? b.cross : a.cross && la > 0 ? a.cross : null;
    if (cr) {
      c.strokeStyle = 'rgba(214,240,255,' + (.75 * (b.cross ? lb : la)).toFixed(3) + ')'; c.lineWidth = 1.5; c.setLineDash([3, 3]);
      c.beginPath(); cr.forEach(function (q) { c.moveTo(P[q[0]][0], P[q[0]][1]); c.lineTo(P[q[1]][0], P[q[1]][1]); }); c.stroke(); c.setLineDash([]);
    }
    P.forEach(function (p) { D.glc(c, p[0], p[1], rr, p[2]); });
    return P;
  }
  /* one large molecule never changes into another: its glucose molecules separate first, then join in the new way */
  function polyVia(c, a, b, k, amb) {
    var F = POLY.scatter;
    if (a === b || a === F || b === F) return drawPoly(c, a, b, k, (a === F ? 1 - k : 0) + (b === F ? k : 0), amb);
    if (k < .42) { var u = k / .42; return drawPoly(c, a, F, ease(u), ease(u), amb); }
    var w = (k - .42) / .58; return drawPoly(c, F, b, ease(w), 1 - ease(w), amb);
  }

  /* ======================================================================= a protein chain
     Its beads lie one step apart at every moment: folding changes only the angle at each bead, so the chain never gets
     longer or shorter (Inheritance Lab, 6 Nov 2026: "a molecule that coils keeps its drawn length"). */
  function foldOf(seed, n, wx, wy) {
    /* a compact walk on a triangular lattice that never crosses itself: a real chain does not pass through itself */
    var DIR = []; for (var d = 0; d < 6; d++) DIR.push([Math.cos(d * Math.PI / 3), Math.sin(d * Math.PI / 3)]);
    for (var tries = 0; tries < 400; tries++) {
      var R = D.rng(seed + tries * 101), pts = [[0, 0]], dirs = [0], used = { '0,0': 1 }, ok = true;
      for (var i = 1; i < n; i++) {
        var p = pts[i - 1], best = -1, bestS = 1e9, cx = 0, cy = 0;
        pts.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= pts.length; cy /= pts.length;
        for (var dd = 0; dd < 6; dd++) {
          var back = (dirs[i - 1] + 3) % 6; if (dd === back) continue;
          /* a turn of at most 120 degrees at each bead */
          var turn = (dd - dirs[i - 1] + 6) % 6; if (turn === 3) continue;
          var x = p[0] + DIR[dd][0], y = p[1] + DIR[dd][1], key = Math.round(x * 2) + ',' + Math.round(y * 1.732);
          if (used[key]) continue;
          var near = 0;
          for (var nd = 0; nd < 6; nd++) { var nx0 = x + DIR[nd][0], ny0 = y + DIR[nd][1]; if (used[Math.round(nx0 * 2) + ',' + Math.round(ny0 * 1.732)]) near++; }
          /* close to the middle, but with room between the turns of the chain, so the chain can still be followed by eye */
          var s = wx * (x - cx) * (x - cx) + wy * (y - cy) * (y - cy) + R() * 5 + near * 2.4;
          if (s < bestS) { bestS = s; best = dd; }
        }
        if (best < 0) { ok = false; break; }
        var nx = p[0] + DIR[best][0], ny = p[1] + DIR[best][1];
        used[Math.round(nx * 2) + ',' + Math.round(ny * 1.732)] = 1; pts.push([nx, ny]); dirs.push(best);
      }
      if (!ok) continue;
      var turns = [];
      for (var t2 = 1; t2 < n - 1; t2++) { var dt = (dirs[t2] - dirs[t2 - 1] + 6) % 6; turns.push((dt > 3 ? dt - 6 : dt) * Math.PI / 3); }
      var mx = 0, my = 0; pts.forEach(function (q) { mx += q[0]; my += q[1]; });
      return { turns: turns, first: dirs[0] * Math.PI / 3, cx: mx / n, cy: my / n };
    }
    throw new Error('no fold found');
  }
  /* the beads for a fold reached by the fraction k, the chain's middle at (cx, cy) */
  function chainAt(F, n, cx, cy, step, k) {
    /* it winds up from its far end, so the part not yet folded lies still (Inheritance Lab, 6 Nov 2026) */
    var a = F.first * ease(seg(k, .78, 1)), pts = [[0, 0]], x = 0, y = 0, J = F.turns.length;
    for (var i = 1; i < n; i++) {
      if (i > 1) { var from = (J - (i - 2) - 1) / J * .78; a += F.turns[i - 2] * ease(seg(k, from, from + .22)); }
      x += step * Math.cos(a); y += step * Math.sin(a); pts.push([x, y]);
    }
    var mx = 0, my = 0; pts.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= n; my /= n;
    return pts.map(function (p) { return [p[0] - mx + cx, p[1] - my + cy]; });
  }
  /* `upTo`: how many beads of the chain have joined so far (all, if left out) */
  function drawChain(c, pts, kinds, r, alpha, upTo) {
    var m = upTo == null ? pts.length : Math.floor(upTo);
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#8496AA'; c.lineWidth = r * .55;
    c.beginPath(); pts.slice(0, m).forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.stroke();
    c.globalAlpha = 1;
    pts.slice(0, m).forEach(function (p, i) { D.bead(c, p[0], p[1], r, kinds[i], alpha); });
  }
  var KINDS1 = [], KINDS2 = [];
  (function () { var R = D.rng(23), S = D.rng(77); for (var i = 0; i < 34; i++) { KINDS1.push(Math.floor(R() * 20)); KINDS2.push(Math.floor(S() * 20)); } })();
  var FOLD1 = foldOf(5, 34, .55, 1.5), FOLD2 = foldOf(19, 34, 1.5, .5);
  global.MolShapes = { POLY: POLY, drawPoly: drawPoly, polyVia: polyVia, foldOf: foldOf, chainAt: chainAt, drawChain: drawChain, KINDS1: KINDS1, KINDS2: KINDS2, FOLD1: FOLD1, FOLD2: FOLD2 };

  /* ==================================================================================== 1. from a chain to its atoms */
  L.add('atomsfilm', Film({
    title: 'From a large molecule to its atoms',
    aria: 'A long chain of starch. The picture moves in to one glucose molecule, which is shown as a model of its atoms: carbon, hydrogen and oxygen.',
    pills: [['c', 'Carbon:'], ['h', 'Hydrogen:'], ['o', 'Oxygen:']],
    key: [['glucose', 'one glucose molecule', [1]], ['atC', 'carbon atom', [2, 3]], ['atH', 'hydrogen atom', [2, 3]], ['atO', 'oxygen atom', [2, 3]]],
    M: [0, 4, 9, 14, 21],
    steps: [
      { t: 0, still: 3.6, h: 'A large molecule', p: [['ig', 'This is part of one molecule of **starch**. It is a very long chain.']] },
      { t: 4, still: 8.8, h: 'A smaller molecule', p: [['ig', 'The chain is made of many smaller molecules joined together. Each ring is one **glucose** molecule.']] },
      { t: 9, still: 13.6, h: 'Atoms', p: [['ig', 'A molecule is made of **atoms**. In one glucose molecule, atoms of three **elements** are joined together.']] },
      { t: 14, still: 20.6, h: 'Three elements', p: [['ig', 'Glucose contains **carbon**, **hydrogen** and **oxygen**: 6 carbon, 12 hydrogen and 6 oxygen atoms.'], ['ib', 'Its formula is C₆H₁₂O₆.']] }   /* IB B1.1.4 */
    ],
    make: function () {
      var W = 560, H = 330, M = D.MODELS.glucose, r0 = 13, sp = 37, n = 19, mid = 9, ROT = -.12;
      function ringAt(i) { return [W / 2 + (i - mid) * sp, H / 2 + Math.sin((i - mid) * .5) * 20]; }
      function elAt(t) { return t < 14 ? null : t < 16.4 ? 'C' : t < 18.6 ? 'H' : 'O'; }
      return scene(W, H, {
        draw: function (c, t) {
          var z = lerp(1, 4.5, ease(seg(t, 4.6, 8.4))), rFade = 1 - seg(t, 9.2, 10.8), mFade = seg(t, 9.6, 11.4);
          if (rFade > 0) {
            c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
            var others = 1 - seg(t, 5.5, 8);
            for (var i = 0; i < n - 1; i++) { var a = ringAt(i), b = ringAt(i + 1); D.link(c, a[0], a[1], b[0], b[1], 4, rFade * ((i === mid || i === mid - 1) ? Math.max(others, .45) : Math.max(others, .25))); }
            for (var j = 0; j < n; j++) { var p = ringAt(j); D.glc(c, p[0], p[1], r0, ROT, rFade * (j === mid ? 1 : Math.max(others, .28)), j === mid && t >= 4); }
            c.restore();
          }
          if (mFade > 0) {
            /* the model is turned so that its ring and its one oxygen lie where the flat ring's lie */
            var s = 13 * 4.5 / 1.43 * (.82 + .18 * mFade);
            D.model(c, M, W / 2, H / 2 + 4, s * .9, { roll: 1.97, yaw: .1, pitch: -.42, only: elAt(t), alpha: mFade });
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
      { t: 0, still: 4, h: 'Glucose', p: [['ig', 'Each ring is one **glucose** molecule. Glucose is a small, soluble molecule.']] },
      { t: 4.5, still: 9.6, h: 'Glucose molecules join', p: [['ig', 'Many glucose molecules join in a chain and make one **large molecule**.']] },
      { t: 10, still: 16, h: 'Starch', p: [['ig', '**Starch** is made from glucose. It is the store of carbohydrate in **plants**.'], ['bey', 'Its chains are coiled or branched.']] },
      { t: 16.5, still: 22.5, h: 'Glycogen', p: [['ig', '**Glycogen** is made from glucose. It is the store of carbohydrate in **animals**, in the liver and the muscles.'], ['bey', 'It has many more branches than starch.']] },
      { t: 23, still: 29, h: 'Cellulose', p: [['ig', '**Cellulose** is made from glucose. It makes the **cell walls** of plants.'], ['bey', 'Its straight chains lie side by side, which makes a strong fibre.']] }
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
      return scene(W, H, {
        draw: function (c, t, amb) { var q = now(t); polyVia(c, q[0], q[1], q[2], amb + t); },
        labels: function (t) {
          if (t >= 14.6 && t < 16.5) return [{ id: 's', text: 'starch', x: POLY.starch.p[14][0], y: POLY.starch.p[14][1] - 8, side: 'T' }];
          if (t >= 21.1 && t < 23) { var g = POLY.glycogen.p[POLY.glycogen.tip]; return [{ id: 'g', text: 'glycogen', x: g[0], y: g[1] - 6, side: 'T' }]; }
          if (t >= 27.6) return [{ id: 'c', text: 'cellulose', x: POLY.cellulose.p[5][0], y: POLY.cellulose.p[5][1] - 8, side: 'T' }];
          return [];
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
    key: [['glycerol', 'glycerol'], ['fatty', 'fatty acid'], ['atO', 'acid end of a fatty acid'], ['water', 'water released (IB)', [1]]],
    M: [0, 4.5, 11, 17],
    steps: [
      { t: 0, still: 4.2, h: 'The two kinds of small molecule', p: [['ig', 'A fat or an oil is made from two kinds of smaller molecule: **glycerol** and **fatty acids**.']] },
      { t: 4.5, still: 10.8, h: 'Three fatty acids join', p: [['ig', '**Three** fatty acids join to **one** glycerol.'], ['ib', 'Each join is a condensation reaction that releases a molecule of water.']] },   /* IB B1.1.9 */
      { t: 11, still: 16.6, h: 'One fat molecule', p: [['ig', 'The result is one molecule of **fat** (or oil). Fats and oils contain carbon, hydrogen and oxygen.'], ['bey', 'Chemists call this molecule a triglyceride.']] }
    ],
    make: function () {
      var W = 560, H = 330, gx = 168, gy = H / 2, gh = 158, gw = 30, ys = [gy - 56, gy, gy + 56], n = 15, step = 17;
      var starts = [[262, 66, -.12], [280, 165, .03], [262, 264, .12]];
      return scene(W, H, {
        draw: function (c, t, amb) {
          D.glycerolBar(c, gx, gy, gh, gw);
          for (var i = 0; i < 3; i++) {
            var a = 4.7 + i * 1.8, k = ease(seg(t, a, a + 1.8)), s = starts[i];
            var bob = (1 - k) * Math.sin(amb * .7 + i * 2) * 3;
            var x0 = lerp(s[0], gx + gw / 2 + 3, k), y0 = lerp(s[1] + bob, ys[i], k), ang = lerp(s[2], 0, k);
            D.tail(c, D.tailPts(x0, y0, ang, n, step, 0), 5.5);
            D.ball(c, x0, y0, 6.4, C.O);
            if (k >= 1 && t < a + 2.5) {
              var u = seg(t, a + 1.8, a + 2.5);
              c.strokeStyle = 'rgba(255,240,190,' + (1 - u).toFixed(3) + ')'; c.lineWidth = 2.4;
              c.beginPath(); c.arc(x0, y0, 9 + 10 * u, 0, TAU); c.stroke();
            }
            /* the water that each join releases, leaving the join */
            var wT = seg(t, a + 1.7, a + 2.7);
            if (wT > 0 && wT < 1) h2o(c, x0 + 16 + 26 * wT, y0 - 14 - 12 * wT, Math.sin(wT * Math.PI));
          }
          if (t > 11.4) {
            var o = seg(t, 11.4, 12.4);
            c.strokeStyle = 'rgba(255,233,179,' + (.8 * o).toFixed(3) + ')'; c.lineWidth = 1.8; c.setLineDash([6, 5]);
            D.rr(c, gx - 28, gy - gh / 2 - 16, 330, gh + 32, 16); c.stroke(); c.setLineDash([]);
          }
        },
        labels: function (t) {
          var it = [];
          if (t < 11.4) it.push({ id: 'g', text: 'glycerol', x: gx, y: gy - gh / 2 + 4, side: 'T' });
          if (t < 4.7) it.push({ id: 'f', text: 'fatty acid', x: starts[0][0] + 90, y: starts[0][1] - 12, side: 'T' });
          if (t >= 11.4) it.push({ id: 'one', text: 'one fat molecule', x: gx + 137, y: gy - gh / 2 - 15, side: 'T' });
          return it;
        }
      });
    }
  }));

  /* ==================================================================================== 4. a protein from amino acids */
  L.add('protfilm', Film({
    title: 'From amino acids to a protein',
    aria: 'Separate amino acids of different kinds join, one after another, in a chain. The chain folds into a shape. A chain with a different sequence of amino acids has a different shape.',
    key: [['amino', 'an amino acid (each colour is one kind)']],
    M: [0, 4.5, 11, 17.5, 25],
    steps: [
      { t: 0, still: 4.2, h: 'Amino acids', p: [['ig', 'Proteins are made from small molecules called **amino acids**. Here, each colour is one kind of amino acid.'], ['ib', 'There are 20 different kinds of amino acid in proteins.']] },   /* IB B1.2.4 */
      { t: 4.5, still: 10.8, h: 'A chain', p: [['ig', 'Amino acids join, one after another, in a **chain**.']] },
      { t: 11, still: 17.2, h: 'The chain folds', p: [['ig', 'The chain **folds** into its own **shape**. The chain does not become longer or shorter: only its shape changes.']] },
      { t: 17.5, still: 24.6, h: 'A different sequence', p: [['ig', 'A different **sequence** (order) of amino acids makes a **different protein**, with a different shape.']] }
    ],
    make: function () {
      var W = 560, H = 330, n = 34, step = 15.2, r = 7;
      var R = D.rng(9), free = [];
      for (var i = 0; i < n; i++) free.push([38 + R() * (W - 76), 34 + R() * (H - 68)]);
      function pos(F, k, cx) { return chainAt(F, n, cx == null ? W / 2 : cx, H / 2, step, k); }
      return scene(W, H, {
        draw: function (c, t, amb) {
          if (t < 11) {
            /* each amino acid arrives in turn, and a link forms only when both of its amino acids are in place */
            var line = pos(FOLD1, 0), done = 0;
            var pts = line.map(function (p, j) {
              var a = free[j], t0 = 4.8 + j * .13, kk = ease(seg(t, t0, t0 + .9)), w = 1 - kk;
              if (t >= t0 + .9 && done === j) done = j + 1;
              return [lerp(a[0] + Math.sin(amb * .6 + j * 2) * 5 * w, p[0], kk), lerp(a[1] + Math.cos(amb * .5 + j * 3) * 5 * w, p[1], kk)];
            });
            if (done > 1) {
              c.strokeStyle = '#8496AA'; c.lineWidth = r * .55; c.lineCap = 'round'; c.beginPath();
              for (var q = 0; q < done; q++) c[q ? 'lineTo' : 'moveTo'](pts[q][0], pts[q][1]);
              c.stroke();
            }
            pts.forEach(function (p, j) { D.bead(c, p[0], p[1], r, KINDS1[j]); });
          } else if (t < 17.5) {
            drawChain(c, pos(FOLD1, ease(seg(t, 11.3, 16.6))), KINDS1, r);
          } else {
            /* the first protein stays in view, so the two shapes can be compared */
            var mv = ease(seg(t, 17.7, 19.2));
            drawChain(c, pos(FOLD1, 1, lerp(W / 2, W * .27, mv)), KINDS1, r);
            /* the second chain joins along the foot of the picture, where its own sequence can be seen, and then folds */
            if (t >= 19.4) {
              var fk = ease(seg(t, 21.3, 24.2)), cx2 = lerp(W / 2, W * .73, fk), cy2 = lerp(H - 44, H / 2, fk);
              drawChain(c, chainAt(FOLD2, n, cx2, cy2, step, fk), KINDS2, r, 1, 1 + seg(t, 19.4, 21.2) * (n - 1));
            }
          }
        },
        labels: function (t) {
          if (t < 4.6) return [{ id: 'a', text: 'one amino acid', x: free[4][0], y: free[4][1] - 7, side: 'T' }];
          if (t >= 16.2 && t < 17.7) return [{ id: 'p', text: 'one protein', x: W / 2, y: H / 2 - 46, side: 'T' }];
          if (t >= 24.2) {
            var topOf = function (F, cx) { var b = chainAt(F, n, cx, H / 2, step, 1)[0], q = chainAt(F, n, cx, H / 2, step, 1); q.forEach(function (p) { if (p[1] < b[1]) b = p; }); return b; };
            var a1 = topOf(FOLD1, W * .27), a2 = topOf(FOLD2, W * .73);
            return [{ id: 'p1', text: 'one protein', x: a1[0], y: a1[1] - 6, side: 'T' }, { id: 'p2', text: 'a different protein', x: a2[0], y: a2[1] - 6, side: 'T' }];
          }
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
      { t: 0, still: 4.2, h: 'One strand', p: [['ig', 'A DNA molecule has **two strands**. Here is one of them. Each strand contains chemicals called **bases**: **A**, **T**, **C** and **G**.']] },
      { t: 4.5, still: 10.8, h: 'The bases pair', p: [['ig', 'The second strand lies beside the first. The bases always pair in the same way: **A with T**, and **C with G**.']] },
      { t: 11, still: 15.8, h: 'Bonds', p: [['ig', '**Bonds** between the pairs of bases hold the two strands together.'], ['ib', 'These are hydrogen bonds.'], ['bey', 'A and T have two bonds; C and G have three.']] },   /* IB A1.2.6 */
      { t: 16, still: 22.6, h: 'A double helix', p: [['ig', 'The two strands are **coiled** together to form a **double helix**.']] }
    ],
    make: function () {
      var W = 560, H = 330, n = DNA_SEQ.length;
      function geo(t) { var tw = ease(seg(t, 16.3, 21.6)), g = D.dnaGeom(tw); g.tw = tw; g.x0 = W / 2 - (n - 1) * g.dx / 2; return g; }
      return scene(W, H, {
        draw: function (c, t) {
          var sec = seg(t, 4.8, 9.6), g = geo(t);
          c.save(); c.translate(W / 2, H / 2); c.scale(g.cam, g.cam); c.translate(-W / 2, -H / 2);
          D.helix(c, { seq: DNA_SEQ, x0: g.x0, y: H / 2, dx: g.dx, R: g.R, w: 6 / g.cam, cam: g.cam, twist: g.tw, turn: g.tw * .55, second: t < 4.8 ? 0 : sec, secondOff: 110,
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
            var j = 5, a = g.tw * j * TAU / 10 + .55, yy = H / 2 + g.R * Math.cos(a) * g.cam, xx = W / 2 + (j - (n - 1) / 2) * g.dx * g.cam;
            it.push({ id: 'h', text: 'double helix', x: xx, y: yy, side: 'T' });
          }
          return it;
        }
      });
    }
  }));

  /* ==================================================================================== 6. preparing a food sample */
  function mortar(c, x, y, grind, stir, water, t) {
    c.save();
    c.beginPath(); c.moveTo(x - 66, y); c.quadraticCurveTo(x - 58, y + 54, x, y + 58); c.quadraticCurveTo(x + 58, y + 54, x + 66, y); c.closePath();
    var lg = c.createLinearGradient(x - 66, 0, x + 66, 0); lg.addColorStop(0, '#CBD3DC'); lg.addColorStop(.5, '#F2F5F8'); lg.addColorStop(1, '#9CA8B5');
    c.fillStyle = lg; c.fill(); c.strokeStyle = '#6B7886'; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.ellipse(x, y, 66, 10, 0, 0, TAU); c.fillStyle = '#AAB5C1'; c.fill(); c.strokeStyle = '#6B7886'; c.stroke();
    c.beginPath(); c.ellipse(x, y + 1, 58, 7, 0, 0, TAU); c.clip();
    var R = D.rng(3);
    for (var i = 0; i < 26; i++) {
      var a = R() * TAU, rr = R() * 52, px = x + Math.cos(a) * rr, py = y + 2 + Math.sin(a) * 5, s = lerp(5.2, 1.4, grind) * (.7 + R() * .5);
      c.fillStyle = i % 3 ? '#E8DFC4' : '#D6C99F'; c.beginPath(); c.arc(px, py, s, 0, TAU); c.fill();
    }
    /* the water, rising over the ground food */
    if (water > 0) { c.fillStyle = 'rgba(150,205,235,' + (.6 * water).toFixed(3) + ')'; c.fillRect(x - 60, y - 9 + 9 * (1 - water), 120, 20); }
    c.restore();
    var sw = grind > 0 && grind < 1 ? Math.sin((t || 0) * 5) * 14 : stir > 0 ? Math.sin((t || 0) * 3.4) * 24 * stir : 0;
    c.save(); c.translate(x + 16 + sw, y + 1); c.rotate(.42 + sw * .012);
    D.rr(c, -7, -92, 14, 92, 7); var pg = c.createLinearGradient(-7, 0, 7, 0); pg.addColorStop(0, '#E6EBF0'); pg.addColorStop(1, '#9CA8B5');
    c.fillStyle = pg; c.fill(); c.strokeStyle = '#6B7886'; c.lineWidth = 1; c.stroke(); c.restore();
  }
  /* the funnel: `level` how much mixture is still in the paper, `res` the solid left on it, `fill` the filtrate below */
  function funnelFlask(c, x, y, level, res, fill, drip) {
    c.beginPath(); c.moveTo(x - 9, y + 54); c.lineTo(x - 9, y + 74); c.lineTo(x - 44, y + 136); c.quadraticCurveTo(x, y + 142, x + 44, y + 136); c.lineTo(x + 9, y + 74); c.lineTo(x + 9, y + 54);
    c.save(); c.closePath(); c.fillStyle = 'rgba(190,220,240,.08)'; c.fill(); c.clip();
    c.fillStyle = 'rgba(229,223,194,.42)'; c.fillRect(x - 50, y + 140 - 16 * fill, 100, 16 * fill + 4); c.restore();
    c.beginPath(); c.moveTo(x - 9, y + 54); c.lineTo(x - 9, y + 74); c.lineTo(x - 44, y + 136); c.quadraticCurveTo(x, y + 142, x + 44, y + 136); c.lineTo(x + 9, y + 74); c.lineTo(x + 9, y + 54);
    c.strokeStyle = C.glass; c.lineWidth = 1.8; c.stroke();
    c.beginPath(); c.moveTo(x - 50, y - 16); c.lineTo(x - 5, y + 38); c.lineTo(x - 4, y + 68); c.lineTo(x + 4, y + 68); c.lineTo(x + 5, y + 38); c.lineTo(x + 50, y - 16); c.strokeStyle = C.glass; c.lineWidth = 1.9; c.stroke();
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
    aria: 'A solid food is ground with a pestle in a mortar, water is added and stirred, the mixture is filtered if solid pieces hide the colour, and it is shared between labelled test tubes.',
    M: [0, 6, 11, 17, 23.5],
    steps: [
      { t: 0, still: 5.8, h: 'Grind the food', p: [['ig', 'Most foods are solid. Cut a small piece, then **grind** it with a **pestle and mortar**.']] },
      { t: 6, still: 10.8, h: 'Add water', p: [['ig', 'Add a little **distilled water** and stir. Substances that are soluble dissolve in the water.']] },
      { t: 11, still: 16.8, h: 'Filter', p: [['ig', 'If solid pieces hide the colour of a test, **filter** the mixture. The liquid that passes through is the **filtrate**.']] },
      { t: 17, still: 23.2, h: 'Label the tubes', p: [['ig', 'Use **labelled test tubes**, one for each test. Starch, fats and many proteins stay on the filter paper, so test for starch and protein with the **unfiltered** mixture, and for fats with a fresh, **dry** piece of food.']] }
    ],
    make: function () {
      var W = 560, H = 330;
      return scene(W, H, {
        draw: function (c, t, amb) {
          /* one picture leaves before the next arrives: two pictures are never laid over each other */
          var fade1 = 1 - seg(t, 11, 11.35), fade2 = seg(t, 11.35, 11.8) * (1 - seg(t, 17, 17.35)), fade3 = seg(t, 17.35, 17.9);
          if (fade1 > 0) {
            c.globalAlpha = fade1;
            var gr = seg(t, .6, 5.4), wat = seg(t, 6.5, 8.4), stir = t >= 8.4 && t < 10.8 ? 1 : 0;
            c.save(); c.translate(W / 2, 190); c.scale(1.5, 1.5); c.translate(-W / 2, -190);
            mortar(c, W / 2, 184, gr, stir, wat, t);
            if (t >= 6 && t < 8.8) {
              var po = seg(t, 6, 6.5) * (1 - seg(t, 8.3, 8.8));
              c.globalAlpha = fade1 * po;
              c.save(); c.translate(W / 2 - 76, 112); c.rotate(.5);
              D.rr(c, -14, -28, 28, 52, 5); c.fillStyle = 'rgba(190,226,245,.4)'; c.fill(); c.strokeStyle = C.glass; c.lineWidth = 1.5; c.stroke();
              c.beginPath(); c.moveTo(12, -28); c.lineTo(30, -44); c.strokeStyle = C.glass; c.lineWidth = 3; c.stroke();
              c.restore();
              for (var i = 0; i < 4; i++) { var u = (amb * .9 + t * .9 + i / 4) % 1; D.drop(c, lerp(W / 2 - 29, W / 2 - 24, u), lerp(88, 180, u), '#BFE3F5', 2.8); }
              c.globalAlpha = fade1;
            }
            c.restore();
            c.globalAlpha = 1;
          }
          if (fade2 > 0) {
            c.globalAlpha = fade2;
            var fl = seg(t, 11.8, 16.2);
            c.save(); c.translate(W / 2, 165); c.scale(1.45, 1.45); c.translate(-W / 2, -148);
            funnelFlask(c, W / 2, 78, 1 - fl, fl, fl, t > 11.8 && t < 16.2 ? (amb * 1.3 + t * 1.3) % 1 : null);
            c.restore();
            c.globalAlpha = 1;
          }
          if (fade3 > 0) {
            c.globalAlpha = fade3;
            var xs = [120, 200, 280, 360, 440], names = ['iodine', 'Benedict’s', 'biuret', 'ethanol', 'DCPIP'];
            D.rack(c, 86, 474, 158, 96);
            xs.forEach(function (x, i) {
              var k = seg(t, 18 + i * .8, 18.8 + i * .8), dry = i === 3, unf = i === 0 || i === 2;
              D.tube(c, x, 96, 34, 150, dry ? null : { col: unf ? '#D9D2B3' : 'rgba(229,223,194,.42)', level: .46 * k + .001, cloud: unf ? .45 : 0, bits: unf && k > .5 ? 12 : 0, bitsCol: 'rgba(120,100,60,.55)' });
              if (dry && k > 0) { c.fillStyle = '#D6C99F'; [[-7, 238], [4, 240], [-1, 233]].forEach(function (q) { c.beginPath(); c.arc(x + q[0], q[1] - 3 + (1 - k) * -30, 4.4, 0, TAU); c.fill(); }); }
              c.fillStyle = '#F4F7FA'; D.rr(c, x - 33, 66, 66, 19, 4); c.fill();
              c.fillStyle = '#10202E'; c.font = '600 10.5px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(names[i], x, 76);
            });
            c.globalAlpha = 1;
          }
        },
        labels: function (t) {
          if (t < 6) return [{ id: 'm', text: 'mortar', x: W / 2 - 56, y: 246, side: 'B' }, { id: 'p', text: 'pestle', x: W / 2 + 62 + (t > .6 && t < 5.4 ? Math.sin(t * 5) * 21 : 0), y: 74, side: 'T' }];
          if (t >= 12.2 && t < 17) { var fl = [{ id: 'fp', text: 'filter paper', x: W / 2 - 40, y: 50, side: 'T' }]; if (t >= 13.5) fl.push({ id: 'ft', text: 'filtrate', x: W / 2, y: 258, side: 'B' }); return fl; }
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
    c.font = '600 12px Inter, system-ui, sans-serif'; var w = c.measureText(text).width + 14;
    c.fillStyle = '#FFFFFF'; D.rr(c, x - w / 2, y, w, 20, 5); c.fill(); c.strokeStyle = '#A9B6C2'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#10202E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 10.5);
  }
  function twoTubes(cfg) {
    var W = 560, H = 330, X1 = 196, X2 = 364, Y = 84, TW = 50, TH = 150, RY = 170;
    return function () {
      return scene(W, H, {
        draw: function (c, t, amb) {
          D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true);
          var st = cfg.state(t), dy = st.dy || 0, shake = st.shake ? Math.sin(t * 22) * 3 * st.shake : 0, bA = st.bathA || 0;
          if (bA < 1) { c.globalAlpha = 1 - bA; D.rack(c, X1 - 54, X2 + 54, RY, 76); c.globalAlpha = 1; }
          var pa = dropperAt(t, cfg.addAt, X1, X2);
          if (bA > 0) { c.globalAlpha = bA; D.bath(c, W / 2, 146, 340, 118, st.bath, amb + t); c.globalAlpha = 1; }
          D.tube(c, X1 + shake, Y + dy, TW, TH, T.liquid(cfg.test, cfg.food, st.a1, st.d1, st.level));
          D.tube(c, X2 + shake, Y + dy, TW, TH, T.liquid(cfg.test, 'water', st.a2, st.d2, st.level));
          if (bA > 0) { c.fillStyle = 'rgba(127,196,236,' + (.2 * bA).toFixed(3) + ')'; c.fillRect(W / 2 - 170, 146 + 118 * .24, 340, 118 * .76); }
          tag(c, X1, 288, cfg.tagA ? cfg.tagA(t) : cfg.foodName); tag(c, X2, 288, cfg.tagB ? cfg.tagB(t) : 'water (control)');
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
      { t: 4, still: 9.8, h: 'Add iodine solution', p: [['ig', 'Add two or three drops of **iodine solution**, which is **orange-brown**, to each tube.']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', '**Blue-black** shows that **starch** is present. The control stays orange-brown.']] }
    ],
    make: twoTubes(simple('iodine', 'cornflour', 'cornflour in water', C.iodine))
  }));

  L.add('benedictfilm', Film({
    title: 'The Benedict’s test for reducing sugars',
    aria: 'Benedict’s solution is added to a food and to water. Both tubes are heated in a hot water bath. The food turns brick red because it contains a reducing sugar. The water stays blue.',
    M: [0, 4, 10, 18, 25],
    steps: [
      { t: 0, still: 3.7, h: 'Two tubes', p: [['ig', 'One tube holds the **food** in water. The other holds only **water**, the control.']] },
      { t: 4, still: 9.8, h: 'Add Benedict’s solution', p: [['ig', 'Add **Benedict’s solution**, which is **blue**, to each tube. Nothing changes yet.']] },
      { t: 10, still: 17.7, h: 'Heat in a water bath', p: [['ig', '**Heat** the tubes in a **hot water bath** for a few minutes. Never use a flame on the tube directly.']] },
      { t: 18, still: 24.7, h: 'Observe the colour', p: [['ig', 'With a **reducing sugar**, the colour changes from blue to **green, yellow, orange or brick red**. A higher concentration of reducing sugar gives a colour further along this list. The control stays blue.']] }
    ],
    make: twoTubes({
      test: 'benedict', food: 'honey', foodName: 'honey in water', reagentCol: C.ben[0], addAt: 4,
      state: function (t) {
        var inb = ease(seg(t, 10.3, 11.9)) * (1 - ease(seg(t, 18.2, 19.8)));
        return { a1: seg(t, 5.2, 6.4), a2: seg(t, 7.4, 8.6), d1: seg(t, 12, 17.8), d2: 0, dy: inb * 26, bathA: clamp(seg(t, 10, 10.8) * (1 - seg(t, 19.2, 20.2))), bath: clamp(seg(t, 10.8, 11.6) * (1 - seg(t, 18, 18.8))) };
      },
      /* the five colours, with a marker that moves along them to the colour of this food */
      overlay: function (c, t) {
        var a = seg(t, 20, 20.8); if (a <= 0) return;
        c.globalAlpha = a;
        var names = ['blue', 'green', 'yellow', 'orange', 'brick red'], bw = 74, x0 = 280 - bw * 2.5, y0 = 22;
        names.forEach(function (n, i) {
          c.fillStyle = C.ben[i]; D.rr(c, x0 + i * bw + 2, y0, bw - 4, 18, 4); c.fill();
          c.fillStyle = i === 2 ? '#10202E' : '#FFFFFF'; c.font = '600 10.5px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(n, x0 + (i + .5) * bw, y0 + 9.5);
        });
        var m = x0 + 4.5 * bw;
        c.fillStyle = '#10202E'; c.beginPath(); c.moveTo(m, y0 + 21); c.lineTo(m - 7, y0 + 32); c.lineTo(m + 7, y0 + 32); c.closePath(); c.fill();
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
      { t: 4, still: 9.8, h: 'Add biuret solution', p: [['ig', 'Add **biuret solution**, which is **blue**, to each tube and shake gently.']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', '**Purple** shows that **protein** is present. The control stays blue.']] }
    ],
    make: twoTubes(simple('biuret', 'gelatine', 'gelatine in water', C.biuret, true))
  }));

  L.add('dcpipfilm', Film({
    title: 'The DCPIP test for vitamin C',
    aria: 'A food solution is added, one drop at a time, to blue DCPIP. With vitamin C the blue colour disappears. With water the DCPIP stays blue.',
    M: [0, 4, 10, 16],
    steps: [
      { t: 0, still: 3.7, h: 'Blue DCPIP', p: [['ig', 'Put some **DCPIP solution**, which is **blue**, in two test tubes.']] },
      { t: 4, still: 9.8, h: 'Add the food', p: [['ig', 'Add the **food solution**, **one drop at a time**, to one tube, and water to the other (the control).']] },
      { t: 10, still: 15.8, h: 'Observe the colour', p: [['ig', 'The blue colour disappears: **vitamin C** is present. The liquid becomes **colourless**, or the pale colour of the food. The control stays blue.']] }
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
      { t: 9, still: 13.8, h: 'Shake', p: [['ig', '**Shake** the tubes. Fats and oils dissolve in ethanol.']] },
      { t: 14, still: 20.8, h: 'Pour into water', p: [['ig', 'Pour the liquid from each tube into a clean tube of **water**.']] },
      { t: 21, still: 26.8, h: 'Observe the result', p: [['ig', 'A **cloudy white emulsion** shows that a **fat or oil** is present. The control stays clear.'], ['bey', 'Fats and oils do not dissolve in water, so they form tiny droplets.']] }
    ],
    make: function () {
      var W = 560, H = 330, X = [112, 214, 346, 448], Y = 112, TW = 42, TH = 140, TILT = 1.85;
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
          D.rack(c, 66, 494, 196, 76);
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
              c.strokeStyle = i === 0 ? '#EFE4BF' : 'rgba(200,226,242,.9)'; c.lineWidth = 3; c.lineCap = 'round';
              c.beginPath(); c.moveTo(mx + 2, my + 8); c.quadraticCurveTo(X[i + 1] + 3, my + 26, X[i + 1], Y + TH * (1 - .34 - .28 * dr)); c.stroke();
            }
          });
          var m = seg(t, 14, 14.6);
          tag(c, lerp(X[0], (X[0] + X[1]) / 2, m), 284, 'sesame oil');
          tag(c, lerp(X[2], (X[2] + X[3]) / 2, m), 284, 'water (control)');
          var pa = t >= 4 && t < 9 ? (t < 4.9 ? lerp(X[0] + 170, X[0], ease(seg(t, 4, 4.9))) : t < 6.2 ? X[0] : t < 6.6 ? lerp(X[0], X[2], ease(seg(t, 6.2, 6.6))) : t < 7.9 ? X[2] : lerp(X[2], X[2] + 180, ease(seg(t, 7.9, 8.7)))) : null;
          if (pa != null) {
            D.dropper(c, pa, 92, C.ethanol, (t > 5 && t < 6.2) || (t > 6.7 && t < 7.8) ? Math.abs(Math.sin(t * 8)) : 0);
            if (Math.abs(pa - X[0]) < 1) dropsIn(c, t, 5, X[0], 98, Y + TH * .78, C.ethanol);
            if (Math.abs(pa - X[2]) < 1) dropsIn(c, t, 6.7, X[2], 98, Y + TH * .78, C.ethanol);
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
    }
  }));
})(window);
