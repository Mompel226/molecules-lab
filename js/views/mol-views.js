/* ============================================================
   views/mol-views.js — each station's own left picture (Daniel, 7 Oct 2026: "a thing the pupil learns FROM").

   atomsv   Elements: a real molecule you can turn; light up one element at a time
   carbv    Carbohydrates: the same glucose molecules joined as starch, glycogen and cellulose
   fatv     Fats and oils: one molecule; many molecules of a fat and of an oil
   protv    Proteins: amino acids, a chain, a fold, and a different order
   dnav     DNA: a double helix you can turn, opened to a ladder for its bases and bonds
   sugarv   The iodine test on a spotting tile; the Benedict's test before and after heating
   threev   The biuret, emulsion and DCPIP tests, each beside its control
   Every picture keeps its state when a card opens or shuts, and with Reduce motion shows the same state as a still
   (memory animations-wait-for-the-reader). No picture turns by itself: the pupil turns it.
   ============================================================ */
(function (global) {
  'use strict';
  var Views = global.Views, D = global.MolDraw, T = global.MolTests, MV = global.MolView, S = global.MolShapes, L = global.CircLearn;
  if (!Views || !D || !T || !MV || !S) return;
  var C = D.C, ease = D.ease, lerp = D.lerp, clamp = D.clamp, seg = D.seg, TAU = D.TAU;

  /* drag sideways to turn; on a phone a finger that moves up or down still scrolls the page (touch-action: pan-y) */
  function dragTurn(V, on) {
    var el = V.el.querySelector('.mm__screen'); if (!el) return;
    el.classList.add('is-turnable');
    var last = null;
    el.addEventListener('pointerdown', function (e) { last = [e.clientX, e.clientY]; try { el.setPointerCapture(e.pointerId); } catch (x) {} });
    el.addEventListener('pointermove', function (e) { if (!last) return; on((e.clientX - last[0]) * .012, (e.clientY - last[1]) * .012); last = [e.clientX, e.clientY]; V.paint(); });
    ['pointerup', 'pointercancel'].forEach(function (n) { el.addEventListener(n, function () { last = null; }); });
    el.setAttribute('tabindex', '0'); el.setAttribute('role', 'slider'); el.setAttribute('aria-label', 'Turn the model: use the left and right arrow keys');
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { on(e.key === 'ArrowLeft' ? -.2 : .2, 0); V.paint(); e.preventDefault(); }
    });
  }
  function bar(V, label, items, click) {
    var b = document.createElement('div'); b.className = 'vbar memv__bar memv__bar--2'; b.setAttribute('role', 'group'); b.setAttribute('aria-label', label);
    var btn = {};
    items.forEach(function (q) {
      var x = document.createElement('button'); x.type = 'button'; x.className = 'memv__btn memv__btn--el'; x.innerHTML = q[1]; x.setAttribute('data-b', q[0]); x.setAttribute('aria-pressed', 'false');
      x.addEventListener('click', function () { click(q[0]); }); btn[q[0]] = x; b.appendChild(x);
    });
    var fig = V.el.querySelector('.memv__fig'); V.el.insertBefore(b, fig);
    return { el: b, press: function (id) { Object.keys(btn).forEach(function (k) { btn[k].setAttribute('aria-pressed', k === id ? 'true' : 'false'); }); } };
  }

  /* ======================================================================= Elements */
  Views.add('atomsv', function (spec, ctx) {
    var W = 560, H = 330, mode = 'glucose', only = null, yaw = .34, pitch = -.92;
    var MOD = { glucose: D.MODELS.glucose, fatty: D.MODELS.fatty, amino: D.MODELS.amino };
    var FIT = { glucose: 39, fatty: 21, amino: 56 }, POSE = { glucose: [.34, -.92], fatty: [.22, .1], amino: [0, -.18] };
    var NAME = { glucose: 'glucose, a carbohydrate', fatty: 'a fatty acid, part of a fat', amino: 'an amino acid, part of a protein' };
    var scene = {
      W: W, H: H, tick: function () {},
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          D.model(c, MOD[mode], W / 2, H / 2 + 4, FIT[mode], { yaw: yaw, pitch: pitch, only: only });
        });
      },
      labels: function () {
        /* the name's line ends on the highest atom near the middle of the model, however it has been turned */
        var best = null;
        MOD[mode].atoms.forEach(function (a) { var p = D.turn(a.p, yaw, pitch), x = W / 2 + p[0] * FIT[mode], y = H / 2 + 4 + p[1] * FIT[mode]; if (Math.abs(x - W / 2) < 60 && (!best || y < best[1])) best = [x, y]; });
        return [{ id: 'n', text: NAME[mode], x: best ? best[0] : W / 2, y: best ? best[1] - 5 : H / 2 - 74, side: 'T' }];
      },
      read: function (pill) {
        var f = D.formula(MOD[mode]);
        pill('c', String(f.C || 0), only === 'C' ? 'ok' : ''); pill('h', String(f.H || 0), only === 'H' ? 'ok' : '');
        pill('o', String(f.O || 0), only === 'O' ? 'ok' : ''); pill('n', String(f.N || 0), only === 'N' ? 'ok' : '');
      }
    };
    var V = MV({
      scene: scene, aria: 'A model of a molecule made of atoms. Press a molecule to change it, press an element to light its atoms, and drag to turn the model.',
      barLabel: 'The molecule', buttons: [['glucose', 'Carbohydrate'], ['fatty', 'Fat'], ['amino', 'Protein']],
      read: [['c', 'Carbon:', 'atC', 'atoms'], ['h', 'Hydrogen:', 'atH', 'atoms'], ['o', 'Oxygen:', 'atO', 'atoms'], ['n', 'Nitrogen:', 'atN', 'atoms']],
      onButton: function (id) { set(id); ctx.pick(id === 'glucose' ? 'carb' : id === 'fatty' ? 'fat' : 'prot', { stay: true }); }
    });
    var B2 = bar(V, 'Highlight one element', [['C', 'Carbon'], ['H', 'Hydrogen'], ['O', 'Oxygen'], ['N', 'Nitrogen']], function (id) { only = only === id ? null : id; B2.press(only); V.paint(); });
    dragTurn(V, function (dx, dy) { yaw += dx; pitch = Math.max(-1.5, Math.min(1.5, pitch + dy)); V.names(); });
    function set(id) { mode = id; yaw = POSE[id][0]; pitch = POSE[id][1]; V.press(id); V.names(); V.paint(); }
    return {
      el: V.el, start: function () { V.start(); set(mode); }, stop: V.stop,
      say: 'Drag to turn the model',
      credit: 'Models drawn for this lab from real bond lengths and angles.',
      focus: function (part) { if (part === 'carb') set('glucose'); else if (part === 'fat') set('fatty'); else if (part === 'prot') set('amino'); only = part === 'prot' ? 'N' : null; B2.press(only); V.paint(); }
    };
  });

  /* ======================================================================= Carbohydrates */
  Views.add('carbv', function (spec, ctx) {
    var P = S.POLY, W = P.W, H = P.H, from = P.scatter, to = P.scatter, k = 1, cur = 'glucose', amb = 0;
    var LAY = { glucose: P.scatter, starch: P.starch, glycogen: P.glycogen, cellulose: P.cellulose };
    var WHERE = { glucose: 'dissolved in cytoplasm and blood', starch: 'a store in plant cells', glycogen: 'a store in liver and muscle cells', cellulose: 'the cell walls of plants' };
    var scene = {
      W: W, H: H,
      tick: function (dt) { amb += dt; if (k < 1) k = Math.min(1, k + dt / 2.6); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          S.polyVia(c, from, to, k, amb);
        });
      },
      labels: function () {
        if (k < 1) return [];
        if (cur === 'glucose') return [{ id: 'g', text: 'one glucose molecule', x: P.scatter.p[6][0], y: P.scatter.p[6][1] - 8, side: 'T' }];
        var a = cur === 'starch' ? P.starch.p[14] : cur === 'glycogen' ? P.glycogen.p[P.glycogen.tip] : P.cellulose.p[5];
        return [{ id: cur, text: cur === 'starch' ? 'starch' : cur === 'glycogen' ? 'glycogen' : 'cellulose', x: a[0], y: a[1] - 8, side: 'T' }];
      },
      read: function (pill) { pill('w', WHERE[cur]); }
    };
    var V = MV({
      scene: scene, aria: 'Glucose molecules, shown separate, or joined as starch, glycogen or cellulose.',
      barLabel: 'The molecule', buttons: [['glucose', 'Glucose'], ['starch', 'Starch'], ['glycogen', 'Glycogen'], ['cellulose', 'Cellulose']],
      read: [['w', 'Where:']], liveNames: true,
      key: { all: [['glucose', 'one glucose molecule'], ['linked', 'link between two glucose molecules'], ['hbond', 'links between the chains']],
             sets: [['one glucose molecule'], ['one glucose molecule', 'link between two glucose molecules'], ['one glucose molecule', 'link between two glucose molecules', 'links between the chains']],
             now: function () { return cur === 'glucose' ? ['one glucose molecule'] : cur === 'cellulose' ? ['one glucose molecule', 'link between two glucose molecules', 'links between the chains'] : ['one glucose molecule', 'link between two glucose molecules']; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    function set(id) {
      if (id === cur && k >= 1) { V.press(id); return; }
      var o = LAY[id]; from = k >= .5 ? to : from; to = o; k = V.isStill() ? 1 : 0; cur = id; V.press(id); V.names(); V.paint();
    }
    return {
      el: V.el, start: function () { V.start(); V.press(cur); }, stop: V.stop,
      say: '46 glucose molecules in every picture',
      credit: 'Drawn for this lab. A real molecule of starch holds thousands of glucose molecules.',
      focus: function (part) { if (LAY[part]) set(part); else if (part === 'large') set('starch'); }
    };
  });

  /* ======================================================================= Fats and oils */
  Views.add('fatv', function (spec, ctx) {
    var W = 560, H = 330, mode = 'one', amb = 0, kAnim = 1;
    function eMol(c, x, y, s, kink, wob) {
      var gh = 66 * s, gw = 13 * s, ys = [y - gh * .36, y, y + gh * .36];
      ys.forEach(function (yy, i) {
        var a = (kink ? [-.1, .08, .14][i] : 0) + Math.sin(amb * 1.6 + i * 2 + x * .03) * wob;
        D.tail(c, D.tailPts(x + gw * .5, yy, a, 13, 7.4 * s, kink ? [.72, -.62, .62][i] : 0), 2.5 * s);
      });
      D.glycerolBar(c, x, y, gh, gw);
    }
    var scene = {
      W: W, H: H,
      tick: function (dt) { amb += dt; if (kAnim < 1) kAnim = Math.min(1, kAnim + dt / .7); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var a = ease(kAnim);
          c.globalAlpha = a;
          if (mode === 'one') {
            c.save(); c.translate(0, 0);
            eMol(c, 148, H / 2, 2.25, false, 0);
            c.restore();
          } else if (mode === 'fat') {
            for (var r = 0; r < 4; r++) for (var q = 0; q < 2; q++) eMol(c, 62 + q * 232 + (r % 2 ? 22 : 0), 48 + r * 78, .92, false, .008);
          } else {
            /* an oil: the bent chains cannot pack, so the molecules lie apart and move past each other */
            var SP = [[92, 76, .3], [272, 62, -.5], [452, 84, 2.7], [120, 214, -2.6], [292, 182, 1.1], [456, 240, -.6], [214, 276, .15]];
            SP.forEach(function (q, i) {
              var x = q[0] + Math.sin(amb * .35 + i * 2) * 13, y = q[1] + Math.cos(amb * .3 + i * 3) * 10, ang = q[2] + Math.sin(amb * .2 + i) * .22;
              c.save(); c.translate(x, y); c.rotate(ang); c.translate(-38, 0);
              eMol(c, 0, 0, .74, true, .03); c.restore();
            });
          }
          c.globalAlpha = 1;
        });
      },
      labels: function () {
        if (mode === 'one') return [{ id: 'g', text: 'glycerol', x: 148, y: H / 2 - 72, side: 'T' }, { id: 'f', text: 'three fatty acids', x: 340, y: H / 2 - 54, side: 'T' }];
        return [];
      },
      read: function (pill) { pill('s', mode === 'one' ? 'one glycerol + three fatty acids' : mode === 'fat' ? 'solid at room temperature' : 'liquid at room temperature'); }
    };
    var V = MV({
      scene: scene, aria: 'One fat molecule made of glycerol and three fatty acids; many molecules of a fat packed closely; many molecules of an oil moving past each other.',
      barLabel: 'What to show', buttons: [['one', 'One molecule'], ['fat', 'A fat'], ['oil', 'An oil']], read: [['s', 'Shown:']],
      key: { all: [['glycerol', 'glycerol'], ['fatty', 'fatty acid']], sets: [['glycerol', 'fatty acid']], now: function () { return ['glycerol', 'fatty acid']; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    function set(id) { if (id !== mode) kAnim = V.isStill() ? 1 : 0; mode = id; V.press(id); V.names(); V.paint(); }
    return {
      el: V.el, start: function () { V.start(); V.press(mode); }, stop: V.stop, say: 'Press to compare a fat and an oil',
      credit: 'Drawn for this lab.',
      focus: function (part) { if (part === 'one' || part === 'fat' || part === 'oil') set(part); }
    };
  });

  /* ======================================================================= Proteins */
  Views.add('protv', function (spec, ctx) {
    var W = 560, H = 330, n = 34, step = 15.2, r = 7, st = 'free', k = 1, amb = 0, kinds = S.KINDS1, F = S.FOLD1, was = 0, now = 0;
    var R = D.rng(9), free = []; for (var i = 0; i < n; i++) free.push([38 + R() * (W - 76), 34 + R() * (H - 68)]);
    function shapeOf(s) { return s === 'fold' || s === 'other' ? 1 : 0; }
    var scene = {
      W: W, H: H,
      tick: function (dt) { amb += dt; if (k < 1) k = Math.min(1, k + dt / 2); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var e = ease(k), f = lerp(was, now, e);
          if (st === 'free') {
            free.forEach(function (p, j) { D.bead(c, p[0] + Math.sin(amb * .6 + j * 2) * 5, p[1] + Math.cos(amb * .5 + j * 3) * 5, r, kinds[j]); });
          } else {
            S.drawChain(c, S.chainAt(F, n, W / 2, H / 2, step, f), kinds, r);
          }
        });
      },
      labels: function () { return st === 'free' ? [{ id: 'a', text: 'one amino acid', x: free[4][0], y: free[4][1] - 7, side: 'T' }] : []; },
      read: function (pill) { pill('s', st === 'free' ? 'separate amino acids' : st === 'chain' ? 'a chain: the sequence of amino acids' : st === 'fold' ? 'the chain folded into one shape' : 'another sequence, another shape'); }
    };
    var V = MV({
      scene: scene, aria: 'Amino acids of different kinds, joined in a chain, and folded into a shape. Another order of amino acids folds into another shape.',
      barLabel: 'What to show', buttons: [['free', 'Amino acids'], ['chain', 'A chain'], ['fold', 'Folded'], ['other', 'Another sequence']], read: [['s', 'Shown:']],
      key: { all: [['amino', 'an amino acid (each colour is one kind)']], sets: [['an amino acid (each colour is one kind)']], now: function () { return ['an amino acid (each colour is one kind)']; } },
      onButton: function (id) { set(id); ctx.pick(id === 'free' ? 'aa' : id === 'other' ? 'order' : id, { stay: true }); }
    });
    function set(id) {
      var f = lerp(was, now, ease(k));
      if (id === 'other' && st !== 'other') { kinds = S.KINDS2; F = S.FOLD2; f = 0; }
      else if (id !== 'other' && st === 'other') { kinds = S.KINDS1; F = S.FOLD1; f = 0; }
      was = f; now = shapeOf(id); k = V.isStill() ? 1 : 0; st = id; V.press(id); V.names(); V.paint();
    }
    return {
      el: V.el, start: function () { V.start(); V.press(st); }, stop: V.stop, say: 'Press to build a protein',
      credit: 'Drawn for this lab. A real protein is usually hundreds of amino acids long.',
      focus: function (part) { if (part === 'aa') set('free'); else if (part === 'chain' || part === 'fold') set(part); else if (part === 'order') set('other'); }
    };
  });

  /* ======================================================================= DNA */
  Views.add('dnav', function (spec, ctx) {
    var W = 560, H = 330, SEQ = 'ATGCCGTACGATTGCA', mode = 'helix', tw = 1, target = 1, turn = .55;
    var scene = {
      W: W, H: H,
      tick: function (dt) { if (tw !== target) { var d = dt / 1.6; tw = tw < target ? Math.min(target, tw + d) : Math.max(target, tw - d); } },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var e = ease(tw), n = SEQ.length, g = D.dnaGeom(e);
          c.save(); c.translate(W / 2, H / 2); c.scale(g.cam, g.cam); c.translate(-W / 2, -H / 2);
          D.helix(c, { seq: SEQ, x0: W / 2 - (n - 1) * g.dx / 2, y: H / 2, dx: g.dx, R: g.R, w: 6 / g.cam, cam: g.cam, twist: e, turn: turn * e, second: 1,
                       show: { bonds: mode === 'bonds' || mode === 'pairs', letters: e < .3 }, dimBases: mode === 'strands' });
          c.restore();
        });
      },
      labels: function () {
        var x = (W - 15 * 30) / 2;
        if (tw !== target) return [];
        if (mode === 'strands') return [{ id: 's1', text: 'strand 1', x: x + 2 * 30, y: H / 2 - 42, side: 'T' }, { id: 's2', text: 'strand 2', x: x + 13 * 30, y: H / 2 + 42, side: 'B' }];
        if (mode === 'bases') return [{ id: 'b', text: 'one base', x: x + 5 * 30, y: H / 2 - 30, side: 'T' }];
        if (mode === 'bonds') return [{ id: 'b', text: 'bonds between the bases', x: x + 8 * 30 + 6, y: H / 2 - 3, side: 'T' }];
        if (mode === 'pairs') return [{ id: 'at', text: 'A with T', x: x, y: H / 2 - 30, side: 'T' }, { id: 'cg', text: 'C with G', x: x + 3 * 30, y: H / 2 - 30, side: 'T' }];
        return [];
      },
      read: function (pill) { pill('s', mode === 'helix' ? 'two strands coiled together' : mode === 'strands' ? 'two strands' : mode === 'bases' ? 'each strand contains bases' : mode === 'bonds' ? 'bonds hold the strands together' : 'A with T, C with G'); }
    };
    var V = MV({
      scene: scene, aria: 'A DNA molecule. Press to show its two strands, bases, bonds and base pairs on a flat ladder, or the coiled double helix. Drag to turn the helix.',
      barLabel: 'What to show', buttons: [['helix', 'Double helix'], ['strands', 'Strands'], ['bases', 'Bases'], ['bonds', 'Bonds'], ['pairs', 'Pairs']], read: [['s', 'Shown:']],
      key: { all: [['strand', 'strand'], ['bases', 'bases', null, 'ATCG'], ['hbond', 'bonds between the bases']],
             sets: [['strand', 'bases', 'bonds between the bases']],
             now: function () { var a = ['strand', 'bases']; if (mode === 'bonds' || mode === 'pairs') a.push('bonds between the bases'); return a; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    dragTurn(V, function (dx) { turn += dx; });
    function set(id) { mode = id; target = id === 'helix' ? 1 : 0; if (V.isStill()) tw = target; V.press(id); V.names(); V.paint(); }
    return {
      el: V.el, start: function () { V.start(); V.press(mode); }, stop: V.stop, say: 'Drag to turn the helix',
      credit: 'Drawn for this lab. The bases keep the colours of the Inheritance Lab.',
      focus: function (part) { if (['helix', 'strands', 'bases', 'bonds', 'pairs'].indexOf(part) >= 0) set(part); }
    };
  });

  /* ======================================================================= the tests on the left: a tube pair, with a press */
  function tag(c, x, y, text, w) {
    c.font = '600 12px Inter, system-ui, sans-serif'; var tw = w || c.measureText(text).width + 14;
    c.fillStyle = '#FFFFFF'; D.rr(c, x - tw / 2, y, tw, 20, 5); c.fill(); c.strokeStyle = '#A9B6C2'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#10202E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 10.5);
  }

  /* ---------- iodine on a spotting tile; Benedict's before and after heating ---------- */
  Views.add('sugarv', function (spec, ctx) {
    var W = 560, H = 330, mode = 'iodine', on = false, k = 0, amb = 0;
    var WELLS = [['cornflour', 'cornflour'], ['tablesugar', 'table sugar'], ['honey', 'honey'], ['water', 'water']];
    var SCALE = [[0, 'none'], [1, 'very low'], [2, 'low'], [3, 'higher'], [4, 'highest']];
    var scene = {
      W: W, H: H,
      tick: function (dt) { amb += dt; if (on && k < 1) k = Math.min(1, k + dt / 2.4); else if (!on && k > 0) k = Math.max(0, k - dt / .5); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          if (mode === 'iodine') {
            D.rr(c, 56, 56, 448, 214, 16);
            var tg = c.createLinearGradient(0, 56, 0, 270); tg.addColorStop(0, '#F7F8FA'); tg.addColorStop(1, '#D5DBE2');
            c.fillStyle = tg; c.fill(); c.strokeStyle = '#8C98A6'; c.lineWidth = 1.2; c.stroke();
            WELLS.forEach(function (w, i) {
              var x = 126 + i * 103, y = 150, f = T.BY[w[0]], drop = ease(seg(k, 0, .4 + i * .05)), ch = ease(seg(k, .35 + i * .06, .75 + i * .06));
              c.beginPath(); c.ellipse(x, y, 40, 38, 0, 0, TAU);
              var wg = c.createRadialGradient(x, y - 14, 4, x, y, 40); wg.addColorStop(0, '#FFFFFF'); wg.addColorStop(1, '#C9D0D9');
              c.fillStyle = wg; c.fill(); c.strokeStyle = '#A4AFBC'; c.stroke();
              var col = D.mixHex(f.look.col, T.positive('iodine', w[0]) ? C.blueBlack : C.iodine, Math.max(drop * .6, ch));
              c.beginPath(); c.ellipse(x, y + 2, 26, 24, 0, 0, TAU); c.fillStyle = col; c.fill();
              c.beginPath(); c.ellipse(x - 8, y - 8, 7, 4, -.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
              c.fillStyle = '#10202E'; c.font = '600 12.5px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText(w[1], x, y + 58);
            });
          } else {
            D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true);
            D.rack(c, 66, 494, 150, 96);
            SCALE.forEach(function (q, i) {
              var x = 112 + i * 84, v = q[0] * ease(seg(k, 0, .95));
              var col = T.benCol(v), ppt = q[0] >= 3 ? seg(k, .6, 1) * (q[0] === 4 ? 1 : .55) : 0;
              D.tube(c, x, 76, 40, 158, { col: col, level: .56, ppt: ppt });
              tag(c, x, 252, q[1], 66);
            });
            c.fillStyle = '#10202E'; c.font = '600 12.5px Inter, system-ui, sans-serif'; c.textAlign = 'center';
            c.fillText('concentration of reducing sugar', W / 2, 294);
            D.arrow(c, 96, 42, 464, 42, 6, '#6B7C8D', { head: 16, headW: 11, halo: false });
            D.setLight(false);
          }
        });
      },
      labels: function () { return []; },
      read: function (pill) {
        if (mode === 'iodine') pill('s', on && k >= 1 ? 'blue-black: starch is present' : on ? 'adding iodine solution…' : 'iodine solution is orange-brown');
        else pill('s', on && k >= 1 ? 'the colour shows the concentration of reducing sugar' : on ? 'heating…' : 'before heating, Benedict’s solution stays blue');
      }
    };
    var V = MV({
      scene: scene, aria: 'A spotting tile with four foods and iodine solution; and five tubes of Benedict’s solution, before and after heating.',
      barLabel: 'The test', buttons: [['iodine', 'Iodine test'], ['ben', 'Benedict’s test'], ['act', 'Add iodine solution', 'memv__btn--go'], ['clear', 'Start again']], read: [['s', 'Shown:']],
      onButton: function (id) {
        if (id === 'iodine' || id === 'ben') { set(id); ctx.pick(id === 'ben' ? 'benedict' : 'iodine', { stay: true }); }
        else if (id === 'act') { on = true; if (V.isStill()) k = 1; sync(); }
        else { on = false; k = 0; sync(); }
      }
    });
    function sync() {
      V.press(mode); V.button('act').textContent = mode === 'iodine' ? 'Add iodine solution' : 'Heat in a water bath';
      V.button('act').disabled = on; V.names(); V.paint();
    }
    function set(id) { if (id !== mode) { on = false; k = 0; } mode = id; sync(); }
    return {
      el: V.el, start: function () { V.start(); sync(); }, stop: V.stop, say: 'Press to carry out the test',
      credit: 'Drawn for this lab, in the true colours of each test.',
      focus: function (part) { if (part === 'iodine') set('iodine'); else if (part === 'benedict' || part === 'heat' || part === 'scale') { set('ben'); if (part === 'scale' && !on) { on = true; if (V.isStill()) k = 1; sync(); } } }
    };
  });

  /* ---------- biuret, emulsion and DCPIP, each beside its control ---------- */
  Views.add('threev', function (spec, ctx) {
    var W = 560, H = 330, mode = 'biuret', on = false, k = 0;
    var CASE = {
      biuret: { test: 'biuret', food: 'gelatine', name: 'gelatine', act: 'Add biuret solution', y: 'purple: protein is present', n: 'biuret solution is blue' },
      emulsion: { test: 'emulsion', food: 'sesame', name: 'sesame oil', act: 'Shake with ethanol, pour into water', y: 'a cloudy white emulsion: a fat or oil is present', n: 'ethanol is colourless' },
      dcpip: { test: 'dcpip', food: 'kiwi', name: 'kiwi fruit', act: 'Add the food, one drop at a time', y: 'the blue colour disappears: vitamin C is present', n: 'DCPIP solution is blue' }
    };
    var scene = {
      W: W, H: H,
      tick: function (dt) { if (on && k < 1) k = Math.min(1, k + dt / 2.4); else if (!on && k > 0) k = Math.max(0, k - dt / .5); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var q = CASE[mode], e = ease(k), X1 = 190, X2 = 370, Y = 62, TH = 180, TW = 56;
          if (mode !== 'emulsion') { D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true); }
          D.rack(c, 130, 430, 158, 104);
          var a = mode === 'dcpip' ? 1 : Math.min(1, e * 2.2), d = mode === 'emulsion' ? ease(seg(k, .45, 1)) : ease(seg(k, .3, 1));
          var q1 = T.liquid(q.test, q.food, a, d, .55), q2 = T.liquid(q.test, 'water', a, mode === 'emulsion' ? d : 0, .55);
          D.tube(c, X1, Y, TW, TH, q1); D.tube(c, X2, Y, TW, TH, q2);
          tag(c, X1, 276, q.name); tag(c, X2, 276, 'water (control)');
          D.setLight(false);
        });
      },
      labels: function () { return []; },
      read: function (pill) { var q = CASE[mode]; pill('s', on && k >= 1 ? q.y : on ? 'wait…' : q.n); }
    };
    var V = MV({
      scene: scene, aria: 'Two test tubes, a food and water as a control. Press to carry out the biuret test, the ethanol emulsion test or the DCPIP test.',
      barLabel: 'The test', buttons: [['biuret', 'Biuret'], ['emulsion', 'Ethanol emulsion'], ['dcpip', 'DCPIP'], ['act', 'Add', 'memv__btn--go'], ['clear', 'Start again']], read: [['s', 'Shown:']],
      onButton: function (id) {
        if (CASE[id]) { set(id); ctx.pick(id, { stay: true }); }
        else if (id === 'act') { on = true; if (V.isStill()) k = 1; sync(); }
        else { on = false; k = 0; sync(); }
      }
    });
    function sync() { V.press(mode); V.button('act').textContent = CASE[mode].act; V.button('act').disabled = on; V.names(); V.paint(); }
    function set(id) { if (id !== mode) { on = false; k = 0; } mode = id; sync(); }
    return {
      el: V.el, start: function () { V.start(); sync(); }, stop: V.stop, say: 'Press to carry out the test',
      credit: 'Drawn for this lab, in the true colours of each test.',
      focus: function (part) { if (CASE[part]) set(part); }
    };
  });
})(window);
