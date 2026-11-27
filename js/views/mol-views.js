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

  /* drag sideways to turn; on a phone a finger that moves up or down still scrolls the page (touch-action: pan-y).
     The drag never selects the names on the picture (Daniel, 27 Nov 2026: turning amylase, "the word amylase gets
     highlighted partially at times"). The chip that says so stands inside the picture's lower left corner, light on the
     dark ground, and its arrows move each time the picture can be turned, until the pupil has turned a model once
     (Daniel, 27 Nov 2026: "the drag to turn is not very visible, so the students will miss it") */
  var turnedOnce = false;
  var TURN_ICON = '<svg class="memv__hint-i" viewBox="0 0 26 16" aria-hidden="true"><path d="M3.5 6.2C6 3.6 9.3 2.6 13 2.6s7 1 9.5 3.6"/><path d="M22.5 9.8C20 12.4 16.7 13.4 13 13.4S6 12.4 3.5 9.8"/><path class="memv__hint-h" d="M19.8 3.8l2.9 2.5-3.6 1.3M6.2 12.2L3.3 9.7l3.6-1.3"/></svg>';
  function dragTurn(V, on) {
    var el = V.el.querySelector('.mm__screen'); if (!el) return { enable: function () {} };
    var last = null, live = true;
    el.addEventListener('pointerdown', function (e) {
      if (!live) return;
      if (e.pointerType === 'mouse') e.preventDefault();   /* a mouse drag would otherwise start a text selection */
      last = [e.clientX, e.clientY]; try { el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.addEventListener('pointermove', function (e) {
      if (!last || !live) return;
      var dx = e.clientX - last[0], dy = e.clientY - last[1];
      if (!turnedOnce && Math.abs(dx) + Math.abs(dy) > 2) { turnedOnce = true; document.documentElement.classList.add('mol-turned'); }
      on(dx * .012, dy * .012); last = [e.clientX, e.clientY]; V.paint();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { el.addEventListener(n, function () { last = null; }); });
    var hint = document.createElement('span'); hint.className = 'memv__hint'; hint.innerHTML = TURN_ICON + '<span>Drag to turn</span>'; hint.setAttribute('aria-hidden', 'true');
    el.parentNode.appendChild(hint);
    el.addEventListener('keydown', function (e) {
      if (live && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { on(e.key === 'ArrowLeft' ? -.2 : .2, 0); V.paint(); e.preventDefault(); }
    });
    /* a picture that cannot turn at this moment does not promise a drag */
    function enable(yes) {
      var was = live;
      live = !!yes; last = null; hint.hidden = !live; el.classList.toggle('is-turnable', live);
      /* the arrows move again each time the picture becomes one that turns */
      if (live && !was) { hint.classList.remove('is-nudge'); void hint.offsetWidth; }
      if (live) hint.classList.add('is-nudge');
      if (live) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'slider'); el.setAttribute('aria-label', 'Turn the model: use the left and right arrow keys'); }
      else { el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label'); }
    }
    enable(true);
    return { enable: enable };
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
    var W = 560, H = 400, mode = 'glucose', only = null, yaw = -.56, pitch = -.32, roll = 3.4;   /* at rest the ring faces the reader, as in the film */
    var MOD = { glucose: D.MODELS.glucose, fatty: D.MODELS.fatty, amino: D.MODELS.amino };
    var FIT = { glucose: 45, fatty: 22, amino: 64 }, GROW = { glucose: 1.25, fatty: 1, amino: 1.25 }, POSE = { glucose: [-.56, -.32, 3.4], fatty: [.22, .1, 0], amino: [0, -.18, 0] };
    var NAME = { glucose: 'glucose, a carbohydrate', fatty: 'a fatty acid, part of a fat', amino: 'an amino acid, part of a protein' };
    var scene = {
      W: W, H: H, tick: function () {},
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          /* in a taller frame (scene.ext) the model grows as far as its width allows, and the title stays at the top */
          var e = scene.ext || 0, z = 1 + (GROW[mode] - 1) * Math.min(1, e / 80);
          D.model(c, MOD[mode], W / 2, H / 2 + 18, FIT[mode] * z, { yaw: yaw, pitch: pitch, roll: roll, only: only });
          /* the name is of the whole molecule, so it is a title and not a line to one atom */
          c.fillStyle = '#EAF2F8'; c.font = '600 15px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(NAME[mode], W / 2, 20 - e);
        });
      },
      labels: function () { return []; },
      read: function (pill) {
        var f = D.formula(MOD[mode]);
        pill('c', String(f.C || 0), only === 'C' ? 'ok' : ''); pill('h', String(f.H || 0), only === 'H' ? 'ok' : '');
        pill('o', String(f.O || 0), only === 'O' ? 'ok' : ''); pill('n', String(f.N || 0), only === 'N' ? 'ok' : '');
      }
    };
    var V = MV({
      scene: scene, aria: 'A model of a molecule made of atoms. Press a molecule to change it, press an element to light its atoms, and drag to turn the model.',
      barLabel: 'The molecule', buttons: [['glucose', 'Carbohydrate'], ['fatty', 'Fat'], ['amino', 'Protein']], bands: '',
      read: [['c', 'Carbon:', 'atC', 'atoms'], ['h', 'Hydrogen:', 'atH', 'atoms'], ['o', 'Oxygen:', 'atO', 'atoms'], ['n', 'Nitrogen:', 'atN', 'atoms']],
      onButton: function (id) { set(id); ctx.pick(id === 'glucose' ? 'carb' : id === 'fatty' ? 'fat' : 'prot', { stay: true }); }
    });
    var B2 = bar(V, 'Highlight one element', [['C', 'Carbon'], ['H', 'Hydrogen'], ['O', 'Oxygen'], ['N', 'Nitrogen']], function (id) { only = only === id ? null : id; B2.press(only); V.paint(); });
    dragTurn(V, function (dx, dy) { yaw += dx; pitch = Math.max(-1.5, Math.min(1.5, pitch + dy)); V.names(); });
    function set(id) { mode = id; yaw = POSE[id][0]; pitch = POSE[id][1]; roll = POSE[id][2]; V.press(id); V.names(); V.paint(); }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); set(mode); }, stop: V.stop,
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
    /* Inside starch: an extension, opened only from Starch. Each state says its level and what IGCSE needs (Daniel, 24 Nov 2026) */
    var sub = null, was = null, sk = 1, spin = .18, iod = 1;
    /* with iodine: the helix stands high and the spotting tile low */
    var IY = 112;
    var LEVEL = {
      two: ['Beyond the syllabus:', 'two kinds of molecule. For IGCSE: starch is made from glucose'],
      amylose: ['IB Biology:', 'a coiled chain. For IGCSE: starch is made from glucose'],
      amylopectin: ['IB Biology:', 'a branched chain. For IGCSE: starch is made from glucose'],
      iodine: ['Beyond IB:', 'iodine in the helix. For IGCSE: starch is made from glucose and turns iodine blue-black']
    };
    var GROUP = { two: 'inside', amylose: 'amylose', amylopectin: 'amylopectin', iodine: 'iodhelix' };
    function helixBox(cx, cy, sc) { var q = []; for (var i = 0; i < S.AMY.n; i++) { var a = S.amyAt(i, spin, cx, cy, sc); q.push([a.x, a.y]); } return S.boxOf(q, S.AMY.r * sc + 7); }
    function scaledBox(lay, ox, oy, z) { return S.boxOf(lay.p.map(function (q) { return [ox + (q[0] - W / 2) * z, oy + (q[1] - H / 2) * z]; }), lay.r * z + 8); }
    function well(c, x, y, col, text) {
      c.beginPath(); c.ellipse(x, y, 40, 37, 0, 0, TAU);
      var g = c.createRadialGradient(x, y - 14, 4, x, y, 40); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C9D0D9');
      c.fillStyle = g; c.fill(); c.strokeStyle = '#A4AFBC'; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.ellipse(x, y + 2, 28, 26, 0, 0, TAU); c.fillStyle = col; c.fill();
      c.beginPath(); c.ellipse(x - 9, y - 9, 7, 4, -.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
      c.fillStyle = '#10202E'; c.font = '600 ' + D.textSize(c, 13) + 'px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 54);
    }
    function paintSub(c, id) {
      if (id === 'two') {
        S.drawAmylose(c, W / 2, 94, .9, spin); S.drawBox(c, helixBox(W / 2, 94, .9), 1);
        c.save(); c.translate(W / 2, 272); c.scale(.74, .74); c.translate(-W / 2, -H / 2); S.drawPoly(c, P.amylopectin, P.amylopectin, 1, 0, 0); c.restore();
        S.drawBox(c, scaledBox(P.amylopectin, W / 2, 272, .74), 1);
      } else if (id === 'amylose') {
        S.drawAmylose(c, W / 2, H / 2, 1.4, spin); S.drawBox(c, helixBox(W / 2, H / 2, 1.4), 1);
      } else if (id === 'amylopectin') {
        S.drawPoly(c, P.amylopectin, P.amylopectin, 1, 0, 0); S.drawBox(c, S.polyBox(P.amylopectin), 1);
      } else {
        S.drawAmylose(c, W / 2, IY, 1.16, spin, iod);
        D.tile(c, 96, 252, 368, 140);
        var turnK = ease(seg(iod, .62, 1));
        well(c, 192, 302, C.iodine, 'iodine alone'); well(c, 368, 302, D.mixHex(C.iodine, C.blueBlack, turnK), 'with starch');
      }
    }
    function subLabels(id) {
      if (id === 'two') { var a = helixBox(W / 2, 94, .9), b = scaledBox(P.amylopectin, W / 2, 272, .74); return [{ id: 'a', text: 'amylose', x: a.cx, y: a.y, side: 'T' }, { id: 'b', text: 'amylopectin', x: b.cx, y: b.y + b.h, side: 'B' }]; }
      if (id === 'amylose') { var h = helixBox(W / 2, H / 2, 1.4); return [{ id: 'a', text: 'amylose: a helix', x: h.cx, y: h.y, side: 'T' }]; }
      if (id === 'amylopectin') { var q = S.polyBox(P.amylopectin); return [{ id: 'b', text: 'amylopectin: a chain with branches', x: q.cx, y: q.y, side: 'T' }]; }
      if (iod < 1) return [];
      /* the name's line ends on the iodine atom with the fewest rings above it */
      var R = [], best = null; for (var i = 0; i < S.AMY.n; i++) R.push(S.amyAt(i, spin, W / 2, IY, 1.16));
      S.iodineAtoms(1, W / 2, IY, 1.16).forEach(function (t) {
        var over = R.filter(function (o) { return o.z > t.z && o.y < t.y && Math.abs(o.x - t.x) < S.AMY.r * 1.16 + 2; }).length;
        if (!best || over < best.over) best = { over: over, x: t.x, y: t.y };
      });
      return [{ id: 'i', text: 'iodine inside the helix', x: best.x, y: best.y - 5, side: 'T' }];
    }
    var scene = {
      W: W, H: H,
      tick: function (dt) {
        amb += dt; if (k < 1) k = Math.min(1, k + dt / 2.6);
        if (sk < 1) sk = Math.min(1, sk + dt / .55);
        else if (sub === 'iodine' && iod < 1) iod = Math.min(1, iod + dt / 3.6);
      },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          /* one picture leaves before the next arrives */
          var id = sk < .5 ? was : sub;
          if (id) paintSub(c, id);
          else { S.polyVia(c, from, to, k, amb); if (k >= 1 && cur !== 'glucose') S.drawBox(c, S.polyBox(LAY[cur]), 1); }
          if (sk < 1) { c.globalAlpha = 1 - Math.abs(2 * sk - 1); D.ground(c, 0, 0, W, H); c.globalAlpha = 1; }
        });
      },
      labels: function () {
        if (sk < 1) return [];
        if (sub) return subLabels(sub);
        if (k < 1) return [];
        if (cur === 'glucose') return [{ id: 'g', text: 'one glucose molecule', x: P.scatter.p[6][0], y: P.scatter.p[6][1] - 8, side: 'T' }];
        var b = S.polyBox(LAY[cur]);
        return [{ id: cur, text: cur, x: b.cx, y: b.y, side: 'T' }];
      },
      read: function (pill) { if (sub) pill('w', LEVEL[sub][1], 'ext', LEVEL[sub][0]); else pill('w', WHERE[cur], '', 'Where:'); }
    };
    var ONE = 'one glucose molecule', LINK = 'link between two glucose molecules', CROSS = 'links between the chains', IOD = 'iodine atom';
    var V = MV({
      scene: scene, aria: 'Glucose molecules, shown separate, or joined as starch, glycogen or cellulose. From starch, an extension shows its two kinds of molecule, amylose and amylopectin, and iodine held inside the helix of amylose.',
      barLabel: 'The molecule', buttons: [['glucose', 'Glucose'], ['starch', 'Starch'], ['glycogen', 'Glycogen'], ['cellulose', 'Cellulose']],
      read: [['w', 'Where:']], liveNames: true,
      key: { all: [['glucose', ONE], ['linked', LINK], ['hbond', CROSS], ['iodineAt', IOD]],
             sets: [[ONE], [ONE, LINK], [ONE, LINK, CROSS], [ONE, LINK, IOD]],
             now: function () { return sub === 'iodine' ? [ONE, LINK, IOD] : sub ? [ONE, LINK] : cur === 'glucose' ? [ONE] : cur === 'cellulose' ? [ONE, LINK, CROSS] : [ONE, LINK]; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    var B2 = bar(V, 'Inside starch: an extension', [['inside', 'Inside starch (extension)'], ['two', 'Two kinds'], ['amylose', 'Amylose'], ['amylopectin', 'Amylopectin'], ['iodine', 'Iodine']], function (id) { var t = id === 'inside' ? 'two' : id; show(t); ctx.pick(GROUP[t], { stay: true }); });
    var B2b = {}; Array.prototype.forEach.call(B2.el.querySelectorAll('button'), function (x) { x.classList.add('memv__btn--ext'); B2b[x.getAttribute('data-b')] = x; });
    var TURN = dragTurn(V, function (dx) { spin -= dx; });
    function bar2() {
      /* the row keeps its place, so the picture does not jump when Starch is pressed */
      B2.el.style.visibility = cur === 'starch' ? '' : 'hidden';
      Object.keys(B2b).forEach(function (q) { B2b[q].hidden = q === 'inside' ? !!sub : !sub; });
      B2.press(sub);
      /* only Amylose turns: with iodine the picture is the helix over its spotting tile, iodine alone and with starch, and a
         chip there was in the way (Daniel, 27 Nov 2026: "that tag drag to turn, it's a bit bothery, so remove it") */
      TURN.enable(sub === 'amylose');
    }
    function show(id) {
      if (id === sub && id !== 'iodine') return;
      was = sub; sub = id; sk = V.isStill() || was === id ? 1 : 0;
      if (id === 'iodine') iod = V.isStill() ? 1 : 0;
      bar2(); V.names(); V.paint();
    }
    function set(id) {
      if (sub) { was = sub; sub = null; sk = V.isStill() ? 1 : 0; }
      if (id === cur && k >= 1) { V.press(id); bar2(); V.names(); V.paint(); return; }
      var o = LAY[id]; from = k >= .5 ? to : from; to = o; k = V.isStill() ? 1 : 0; cur = id; V.press(id); bar2(); V.names(); V.paint();
    }
    function toStarch() { if (cur !== 'starch') { cur = 'starch'; from = to = LAY.starch; k = 1; V.press('starch'); } }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); V.press(cur); bar2(); }, stop: V.stop,
      say: '46 glucose molecules in every picture',
      credit: 'Drawn for this lab. A real molecule of starch holds thousands of glucose molecules.',
      focus: function (part) {
        if (LAY[part]) set(part); else if (part === 'large') set('starch');
        else if (part === 'inside') { toStarch(); show('two'); } else if (part === 'amylose' || part === 'amylopectin') { toStarch(); show(part); }
        else if (part === 'iodhelix') { toStarch(); show('iodine'); }
      }
    };
  });

  /* ======================================================================= Fats and oils */
  Views.add('fatv', function (spec, ctx) {
    var W = 560, H = 400, mode = 'one', amb = 0, kAnim = 1;
    function eMol(c, x, y, s, kink, wob) {
      var gh = 66 * s, gw = 13 * s, ys = [y - gh * .36, y, y + gh * .36];
      ys.forEach(function (yy, i) {
        var a = (kink ? [-.14, 0, .14][i] : 0) + Math.sin(amb * 1.6 + i * 2 + x * .03) * wob;
        D.tail(c, D.tailPts(x + gw * .5, yy, a, 13, 7.4 * s, kink ? [-.62, .3, .72][i] : 0   /* one bend each, away from its neighbour, so the chains never cross */), 2.5 * s);
      });
      D.glycerolBar(c, x, y, gh, gw);
      /* each fatty acid is joined by its acid end at one of glycerol's three places */
      ys.forEach(function (yy) { D.ball(c, x + gw * .5, yy, 2.9 * s, C.O); });
    }
    /* a wax (IB B1.1.8): one fatty acid joined by an oxygen to one long alcohol, with no glycerol. The two straight chains lie very close to the
       chains beside them, which is why a wax remains solid at higher temperatures than most fats */
    var WAX = [];
    for (var wr = 0; wr < 13; wr++) for (var wq = 0; wq < 2; wq++) WAX.push([106 + wq * 258 + (wr % 2 ? 12 : 0), 36 + wr * 27]);
    function waxMol(c, x, y, wob) {
      var a = Math.sin(amb * 1.1 + x * .03 + y * .05) * wob;
      D.tail(c, D.tailPts(x, y, Math.PI + a, 15, 6.6, 0), 2.6);
      D.tail(c, D.tailPts(x, y, a, 27, 6.6, 0), 2.6);
      D.ball(c, x, y, 3.8, C.O);
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
            eMol(c, 150, H / 2, 2.8, false, 0);
            c.restore();
            /* a bracket: the name stands for all three fatty acids */
            c.strokeStyle = 'rgba(255,233,179,.85)'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.beginPath();
            c.moveTo(434, H / 2 - 88); c.lineTo(444, H / 2 - 88); c.lineTo(444, H / 2 + 88); c.lineTo(434, H / 2 + 88); c.stroke();
          } else if (mode === 'fat') {
            for (var r = 0; r < 5; r++) for (var q = 0; q < 4; q++) eMol(c, 38 + q * 122 + (r % 2 ? 34 : 0), 60 + r * 70, 1, false, .008);
          } else if (mode === 'wax') {
            WAX.forEach(function (q) { waxMol(c, q[0], q[1], .005); });
            S.drawBox(c, { x: WAX[0][0] - 94, y: WAX[0][1] - 13, w: 252, h: 26 }, a);
          } else {
            /* an oil: the bent chains cannot pack, so the molecules lie apart and move past each other */
            var SP = [[92, 92, .3], [272, 75, -.5], [452, 102, 2.7], [120, 259, -2.6], [292, 220, 1.1], [456, 291, -.6], [214, 334, .15]];
            SP.forEach(function (q, i) {
              var x = q[0] + Math.sin(amb * .35 + i * 2) * 13, y = q[1] + Math.cos(amb * .3 + i * 3) * 10, ang = q[2] + Math.sin(amb * .2 + i) * .22;
              c.save(); c.translate(x, y); c.rotate(ang); c.translate(-38, 0);
              eMol(c, 0, 0, .86, true, .03); c.restore();
            });
          }
          c.globalAlpha = 1;
        });
      },
      labels: function () {
        if (mode === 'one') return [{ id: 'g', text: 'glycerol', x: 150, y: H / 2 - 92, side: 'T' }, { id: 'f', text: 'three fatty acids', x: 444, y: H / 2 - 88, side: 'T' }];
        if (mode === 'wax') return [{ id: 'w', text: 'one wax molecule', x: WAX[0][0] + 32, y: WAX[0][1] - 13, side: 'T' }];
        return [];
      },
      read: function (pill) { pill('s', mode === 'one' ? 'one glycerol + three fatty acids' : mode === 'fat' ? 'solid at room temperature' : mode === 'wax' ? 'solid at higher temperatures than most fats' : 'liquid at room temperature'); }
    };
    var V = MV({
      scene: scene, aria: 'One fat molecule made of glycerol and three fatty acids; many molecules of a fat packed closely; many molecules of an oil moving past each other.',
      barLabel: 'What to show', buttons: [['one', 'One molecule'], ['fat', 'A fat'], ['oil', 'An oil'], ['wax', 'A wax (IB)', 'memv__btn--ext']], read: [['s', 'Shown:']], bands: 'T',
      key: { all: [['glycerol', 'glycerol'], ['fatty', 'fatty acid'], ['fatty', 'long chain of a wax molecule'], ['atO', 'where the two long chains join']],
             sets: [['glycerol', 'fatty acid'], ['long chain of a wax molecule', 'where the two long chains join']],
             now: function () { return mode === 'wax' ? ['long chain of a wax molecule', 'where the two long chains join'] : ['glycerol', 'fatty acid']; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    function set(id) { if (id !== mode) kAnim = V.isStill() ? 1 : 0; mode = id; V.press(id); V.names(); V.paint(); }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); V.press(mode); }, stop: V.stop, say: 'Press to compare a fat, an oil and a wax',
      credit: 'Drawn for this lab.',
      focus: function (part) { if (part === 'one' || part === 'fat' || part === 'oil' || part === 'wax') set(part); }
    };
  });

  /* ======================================================================= Proteins */
  Views.add('protv', function (spec, ctx) {
    /* Every press shows the process, never only its result (Daniel, 24 Nov 2026: the other sequence "just show[s] already the shape
       and you kind of form the links instead of actually showing the amino acids appearing"): amino acids appear, join one after
       another, and then fold. The real protein is built up one amino acid after another, in the order of its chain. */
    var W = 560, H = 400, n = 30, step = 28, r = 9.4, st = 'free', amb = 0;
    var seq = 1, appear = 1, join = 0, fold = 0, grow = 1, surf = 0, surfTo = 0, queue = [];
    var view = { yaw: 0, pitch: 0 }, FLAT = { yaw: 0, pitch: 0 };
    var R = D.rng(9), FREE = [[], []];
    for (var i = 0; i < n; i++) FREE[0].push([38 + R() * (W - 76), 34 + R() * (H - 68)]);
    for (var i2 = 0; i2 < n; i2++) FREE[1].push([38 + R() * (W - 76), H * .58 + R() * (H * .42 - 30)]);   /* below the first protein, which waits higher up */
    /* the separate amino acids spread over the whole height of a taller frame (scene.ext), in the same order */
    function freeOf(k) { var e = scene.ext || 0; return FREE[k].map(function (a) { return [a[0], H / 2 + (a[1] - H / 2) * (H + 2 * e) / H]; }); }
    var KA = 'an amino acid (each colour is one kind)', KE = 'an end of the chain', KC = 'the folded chain, drawn as a smooth shape';
    function F() { return seq === 1 ? S.FOLD1 : S.FOLD2; }
    function kinds() { return seq === 1 ? S.KINDS1 : S.KINDS2; }
    /* the real protein grows a little in a taller frame (scene.ext) */
    function realS() { return 36 * (1 + .2 * Math.min(1, (scene.ext || 0) / 80)); }
    function realBox() { return S.realBox(W / 2, H / 2 + 6, realS(), view); }
    /* the steps still to run, each with its own time (s) */
    var DUR = { appear: .5, join: 2.2, fold: 2.2, unfold: 1.4, grow: 3.4 };
    function run(list) { queue = V.isStill() ? [] : list.slice(); if (V.isStill()) list.forEach(finish); }
    function finish(q) { if (q === 'appear') appear = 1; else if (q === 'join') join = 1; else if (q === 'fold') fold = 1; else if (q === 'unfold') fold = 0; else if (q === 'grow') grow = 1; }
    var scene = {
      W: W, H: H,
      tick: function (dt) {
        amb += dt;
        if (queue.length) {
          var q = queue[0], d = dt / DUR[q];
          if (q === 'appear') appear = Math.min(1, appear + d); else if (q === 'join') join = Math.min(1, join + d);
          else if (q === 'fold') fold = Math.min(1, fold + d); else if (q === 'unfold') fold = Math.max(0, fold - d); else if (q === 'grow') grow = Math.min(1, grow + d);
          if ((q === 'appear' && appear >= 1) || (q === 'join' && join >= 1) || (q === 'fold' && fold >= 1) || (q === 'unfold' && fold <= 0) || (q === 'grow' && grow >= 1)) { queue.shift(); sync2(); }
        }
        if (surf !== surfTo) surf = surfTo > surf ? Math.min(surfTo, surf + dt / 2.6) : Math.max(surfTo, surf - dt / 1.4);
      },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          if (st === 'real') { S.drawRealProtein(c, W / 2, H / 2 + 6, realS(), view, ease(surf), grow); if (grow >= 1) S.drawBox(c, realBox(), 1); return; }
          /* the chain's places: a gentle wave, folding into its 3D shape; each amino acid moves into its place in turn */
          /* another sequence: the first protein waits higher up, the new chain forms below it, and both end side by side */
          var two = seq === 2, fe = ease(fold), cx = two ? lerp(W / 2, W * .73, fe) : W / 2, cy = two ? lerp(H - 104, H / 2, fe) : H / 2;
          if (two) S.drawChain3(c, S.inside(S.project(S.chain3At(S.FOLD1, n, 1), view, W * .27, lerp(H * .3, H / 2, fe), step), W, H, r + 6), S.KINDS1, r, null, null, step, true);
          var line = S.inside(S.project(S.chain3At(F(), n, fe), fold > 0 ? view : FLAT, cx, cy, step), W, H, r + 6), from = freeOf(seq - 1), done = 0;
          var Q = line.map(function (p, j) {
            var a = from[j], tj = j / n * .72, kk = ease(seg(join, tj, tj + .28)), w = 1 - kk;
            if (kk >= 1 && done === j) done = j + 1;
            return kk >= 1 ? p : { x: lerp(a[0] + Math.sin(amb * .6 + j * 2) * 5 * w, p.x, kk), y: lerp(a[1] + Math.cos(amb * .5 + j * 3) * 5 * w, p.y, kk), z: p.z * kk };
          });
          S.drawChain3(c, Q, kinds(), r, Math.max(1, done), appear, step, done >= n);
        });
      },
      labels: function () {
        if (st === 'real') { if (grow < 1) return []; var b = realBox(); return [{ id: 'r', text: surf > .5 ? 'amylase as a smooth shape' : 'amylase', x: b.cx, y: b.y, side: 'T' }]; }
        if (join <= 0 && appear >= 1) { var a4 = freeOf(seq - 1)[4]; return [{ id: 'a', text: 'one amino acid', x: a4[0], y: a4[1] - 7, side: 'T' }]; }
        return [];
      },
      read: function (pill) {
        var busy = queue.length > 0;
        pill('s', st === 'real' ? (grow < 1 ? 'amylase: its amino acids, one after another' : surf > .5 ? 'the same folded chain, drawn as a smooth shape' : 'amylase, a real protein: one chain of 496 amino acids')
          : join <= 0 ? (seq === 2 ? 'amino acids in another sequence' : 'separate amino acids')
          : busy ? (queue[0] === 'join' ? 'the amino acids join, one after another' : 'the chain folds')
          : fold > 0 ? (seq === 2 ? 'another sequence, another shape' : 'the chain folded into one 3D shape') : 'a chain: the sequence of amino acids');
      }
    };
    var V = MV({
      scene: scene, aria: 'Amino acids of different kinds join, one after another, in a chain, which folds into a 3D shape. Amino acids in another order join and fold into another shape. A real protein, amylase, is built up one amino acid after another, and shown as its folded chain or as one smooth shape, which is the same folded chain.',
      barLabel: 'What to show', buttons: [['free', 'Amino acids'], ['chain', 'A chain'], ['fold', 'Folded'], ['other', 'Another sequence']], read: [['s', 'Shown:']], liveNames: true, bands: 'T',
      key: { all: [['amino', KA], ['chainEnd', KE], ['protSurf', KC]], sets: [[KA, KE], [KA], [KC]], now: function () { return st === 'real' ? (surf > .5 ? [KC] : [KA]) : join >= 1 ? [KA, KE] : [KA]; } },
      onButton: function (id) { set(id); ctx.pick(id === 'free' ? 'aa' : id === 'other' ? 'order' : id, { stay: true }); }
    });
    var B2 = bar(V, 'A real protein', [['real', 'A real protein'], ['surface', 'Its smooth shape']], function (id) {
      if (id === 'real') { set('real'); ctx.pick('real', { stay: true }); return; }
      if (st !== 'real') set('real');
      surfTo = surfTo ? 0 : 1; if (V.isStill()) surf = surfTo; sync2(); V.names(); V.paint(); ctx.pick('real', { stay: true });
    });
    var TURN = dragTurn(V, function (dx, dy) { view.yaw += dx; view.pitch = Math.max(-1.4, Math.min(1.4, view.pitch + dy)); });
    function sync2() {
      var b = B2.el.querySelector('[data-b="surface"]'); b.textContent = surfTo ? 'Its amino acids' : 'Its smooth shape'; b.disabled = st !== 'real' || grow < 1;
      B2.press(st === 'real' ? 'real' : null);
      TURN.enable((st === 'real' && grow >= 1) || (st !== 'real' && fold >= 1 && !queue.length));
    }
    /* from the start of sequence `k`: its amino acids apart, not yet joined */
    function fresh(k) { seq = k; join = 0; fold = 0; appear = 1; view = { yaw: 0, pitch: 0 }; }
    function set(id) {
      if (id === 'real') { if (st !== 'real') { view = { yaw: -.35, pitch: .12 }; surf = surfTo = 0; grow = 0; run(['grow']); } }
      else {
        if (st === 'real') fresh(1);
        if (id === 'free') { fresh(1); queue = []; }
        else if (id === 'chain') { if (seq !== 1) fresh(1); run(fold > 0 ? ['unfold'].concat(join < 1 ? ['join'] : []) : join < 1 ? ['join'] : []); if (fold <= 0) view = { yaw: 0, pitch: 0 }; }
        else if (id === 'fold') { if (seq !== 1) fresh(1); run((join < 1 ? ['join'] : []).concat(fold < 1 ? ['fold'] : [])); }
        else if (id === 'other') { fresh(2); appear = 0; run(['appear', 'join', 'fold']); }
      }
      st = id; V.press(id === 'real' ? null : id); sync2(); V.names(); V.paint();
    }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); V.press(st); sync2(); }, stop: V.stop, say: 'Press to build a protein; drag to turn a folded protein',
      credit: 'Drawn for this lab. The two short chains are folded in the shapes of two stretches of 30 amino acids of human salivary amylase, and the real protein is the whole molecule, as measured by X-ray (PDB 1SMD, Ramasubbu et al. 1996; wwPDB, CC0), the same molecule as in the Y7 cell game.',
      focus: function (part) { if (part === 'aa') set('free'); else if (part === 'chain' || part === 'fold' || part === 'real') set(part); else if (part === 'order') set('other'); }
    };
  });

  /* ======================================================================= DNA */
  Views.add('dnav', function (spec, ctx) {
    var W = 560, H = 400, SEQ = 'ATGCCGTACGATTGCA', mode = 'helix', tw = 1, target = 1, turn = .55, G0 = D.dnaGeom(0), SX = G0.dx;
    /* a pair is marked as a pair: one outline round its two bases */
    function pairBox(q) { var cx = (W - 15 * SX) / 2 + q * SX, hw = SX * .46; return { x: cx - hw, y: H / 2 - G0.R - 11, w: hw * 2, h: 2 * G0.R + 22, cx: cx }; }
    var scene = {
      W: W, H: H,
      tick: function (dt) { if (tw !== target) { var d = dt / 1.6; tw = tw < target ? Math.min(target, tw + d) : Math.max(target, tw - d); } },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var e = ease(tw), n = SEQ.length, g = D.dnaGeom(e);
          c.save(); c.translate(W / 2, H / 2); c.scale(g.cam, g.cam); c.translate(-W / 2, -H / 2);
          D.helix(c, { seq: SEQ, x0: W / 2 - (n - 1) * g.dx / 2, y: H / 2, dx: g.dx, R: g.R, w: 8.4 / g.cam, cam: g.cam, twist: e, turn: turn * e, second: 1,
                       show: { bonds: mode === 'bonds' || mode === 'pairs' || mode === 'helix', letters: e < .3 }, dimBases: mode === 'strands' });
          c.restore();
          if (mode === 'pairs' && tw === target) [0, 3].forEach(function (q) { S.drawBox(c, pairBox(q), 1); });
        });
      },
      labels: function () {
        var x = (W - 15 * SX) / 2, up = G0.R * .86;   /* a name's line stops above the base's letter */
        if (tw !== target) return [];
        if (mode === 'strands') return [{ id: 's1', text: 'strand 1', x: x + 2 * SX, y: H / 2 - G0.R, side: 'T' }, { id: 's2', text: 'strand 2', x: x + 13 * SX, y: H / 2 + G0.R, side: 'B' }];
        if (mode === 'bases') return [{ id: 'b', text: 'one base', x: x + 5 * SX, y: H / 2 - up, side: 'T' }];
        if (mode === 'bonds') return [{ id: 'b', text: 'bonds between the bases', x: x + 8 * SX + SX * .66 * .34, y: H / 2 - G0.R * .12, side: 'T'   /* on the third bond of this C–G pair, beside the letter */ }];
        if (mode === 'pairs') return [{ id: 'at', text: 'A with T', x: x, y: pairBox(0).y, side: 'T' }, { id: 'cg', text: 'C with G', x: x + 3 * SX, y: pairBox(3).y, side: 'T' }];
        return [];
      },
      read: function (pill) { pill('s', mode === 'helix' ? 'two strands coiled together' : mode === 'strands' ? 'two strands' : mode === 'bases' ? 'each strand contains bases' : mode === 'bonds' ? 'bonds hold the strands together' : 'A with T, C with G'); }
    };
    var V = MV({
      scene: scene, aria: 'A DNA molecule. Press to show its two strands, bases, bonds and base pairs on a flat ladder, or the coiled double helix. Drag to turn the helix.',
      barLabel: 'What to show', buttons: [['helix', 'Double helix'], ['strands', 'Strands'], ['bases', 'Bases'], ['bonds', 'Bonds'], ['pairs', 'Pairs']], read: [['s', 'Shown:']],
      key: { all: [['strand', 'strand'], ['bases', 'bases', null, 'ATCG'], ['hbond', 'bonds between the bases']],
             sets: [['strand', 'bases', 'bonds between the bases']],
             now: function () { var a = ['strand', 'bases']; if (mode === 'bonds' || mode === 'pairs' || mode === 'helix') a.push('bonds between the bases'); return a; } },
      onButton: function (id) { set(id); ctx.pick(id, { stay: true }); }
    });
    var TURN = dragTurn(V, function (dx) { turn += dx; });
    function set(id) {
      mode = id; target = id === 'helix' ? 1 : 0; if (V.isStill()) tw = target;
      /* only the coiled helix turns: the flat ladder does not promise a drag */
      TURN.enable(id === 'helix');
      V.press(id); V.names(); V.paint();
    }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); V.press(mode); }, stop: V.stop, say: 'Drag to turn the helix',
      credit: 'Drawn for this lab. The bases keep the colours of the Inheritance Lab.',
      focus: function (part) { if (['helix', 'strands', 'bases', 'bonds', 'pairs'].indexOf(part) >= 0) set(part); }
    };
  });

  /* ======================================================================= the tests on the left: a tube pair, with a press */
  function tag(c, x, y, text, w) {
    var fs = D.textSize(c, 12), hh = 20 * fs / 12;
    c.font = '600 ' + fs + 'px Inter, system-ui, sans-serif'; var tw = Math.max(w || 0, c.measureText(text).width + 10 * fs / 12);
    c.fillStyle = '#FFFFFF'; D.rr(c, x - tw / 2, y, tw, hh, 5); c.fill(); c.strokeStyle = '#A9B6C2'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#10202E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + hh / 2 + .5);
  }

  /* ---------- iodine on a spotting tile; Benedict's before and after heating ---------- */
  Views.add('sugarv', function (spec, ctx) {
    var W = 560, H = 420, mode = 'iodine', on = false, k = 0, amb = 0;
    var WELLS = [['cornflour', 'cornflour'], ['tablesugar', 'table sugar'], ['honey', 'honey'], ['water', 'water']];
    var SCALE = [[0, 'none'], [1, 'very low'], [2, 'low'], [3, 'higher'], [4, 'highest']];
    var scene = {
      W: W, H: H,
      tick: function (dt) { amb += dt; if (on && k < 1) k = Math.min(1, k + dt / (mode === 'ben' ? 5 : 2.4)); else if (!on && k > 0) k = Math.max(0, k - dt / .5); },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          if (mode === 'iodine') {
            D.rr(c, 18, 70, 524, 280, 18);
            var tg = c.createLinearGradient(0, 70, 0, 350); tg.addColorStop(0, '#F7F8FA'); tg.addColorStop(1, '#D5DBE2');
            c.fillStyle = tg; c.fill(); c.strokeStyle = '#8C98A6'; c.lineWidth = 1.2; c.stroke();
            WELLS.forEach(function (w, i) {
              var x = 86 + i * 129, y = 188, f = T.BY[w[0]], drop = ease(seg(k, 0, .4 + i * .05)), ch = ease(seg(k, .35 + i * .06, .75 + i * .06));
              c.beginPath(); c.ellipse(x, y, 58, 56, 0, 0, TAU);
              var wg = c.createRadialGradient(x, y - 20, 6, x, y, 58); wg.addColorStop(0, '#FFFFFF'); wg.addColorStop(1, '#C9D0D9');
              c.fillStyle = wg; c.fill(); c.strokeStyle = '#A4AFBC'; c.stroke();
              var col = D.mixHex(f.look.col, T.positive('iodine', w[0]) ? C.blueBlack : C.iodine, Math.max(drop * .6, ch));
              c.beginPath(); c.ellipse(x, y + 3, 42, 40, 0, 0, TAU); c.fillStyle = col; c.fill();
              c.beginPath(); c.ellipse(x - 14, y - 14, 11, 6, -.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
              c.fillStyle = '#10202E'; c.font = '600 ' + D.textSize(c, 14) + 'px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText(w[1], x, y + 84);
            });
          } else {
            D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true);
            /* the colour changes only while the tubes stand in the hot water, with their liquid under its surface */
            var inB = on ? seg(k, 0, .12) * (1 - seg(k, .88, 1)) : 0, dip = ease(inB) * 30;
            if (inB < 1) { c.globalAlpha = 1 - inB; D.rack(c, 46, 514, 178, 142); c.globalAlpha = 1; }
            if (inB > 0) { c.globalAlpha = inB; D.bath(c, W / 2, 150, 476, 200, inB, amb); c.globalAlpha = 1; }
            SCALE.forEach(function (q, i) {
              var x = 100 + i * 90, v = q[0] * ease(seg(k, .16, .84));
              var col = T.benCol(v), ppt = q[0] >= 3 ? seg(k, .55, .84) * (q[0] === 4 ? 1 : .55) : 0;
              D.tube(c, x, 78 + dip, 60, 232, { col: col, level: .56, ppt: ppt });
              tag(c, x, 368, q[1], 80);
            });
            c.fillStyle = '#10202E'; c.font = '600 12.5px Inter, system-ui, sans-serif'; c.textAlign = 'center';
            c.fillText('concentration of reducing sugar', W / 2, 400);
            D.arrow(c, 76, 44, 484, 44, 6, '#6B7C8D', { head: 16, headW: 11, halo: false });
            D.setLight(false);
          }
        });
      },
      labels: function () { return []; },
      read: function (pill) {
        if (mode === 'iodine') pill('s', on && k >= 1 ? 'blue-black: starch is present' : on ? 'adding iodine solution…' : 'the foods, before iodine solution is added');
        else pill('s', on && k >= 1 ? 'the colour shows the concentration of reducing sugar' : on ? 'heating…' : 'before heating, Benedict’s solution stays blue');
      }
    };
    var V = MV({
      scene: scene, aria: 'A spotting tile with four foods and iodine solution; and five tubes of Benedict’s solution, before and after heating.',
      barLabel: 'The test', buttons: [['iodine', 'Iodine test'], ['ben', 'Benedict’s test'], ['act', 'Add iodine solution', 'memv__btn--go'], ['clear', 'Start again']], read: [['s', 'Shown:']], bands: '',
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
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); sync(); }, stop: V.stop, say: 'Press to carry out the test',
      credit: 'Drawn for this lab, in the true colours of each test.',
      focus: function (part) { if (part === 'iodine') set('iodine'); else if (part === 'benedict' || part === 'heat' || part === 'scale') { set('ben'); if (part === 'scale' && !on) { on = true; if (V.isStill()) k = 1; sync(); } } }
    };
  });

  /* ---------- biuret, emulsion and DCPIP, each beside its control ---------- */
  Views.add('threev', function (spec, ctx) {
    var W = 560, H = 420, mode = 'biuret', on = false, k = 0, emS = null;
    function emul() { return emS || (emS = S.emulsion()); }
    function emT() { return k > 0 ? lerp(4, 26.5, k) : 0; }
    var CASE = {
      biuret: { test: 'biuret', food: 'gelatine', name: 'gelatine', act: 'Add biuret solution', y: 'purple: protein is present', n: 'gelatine and water, before biuret solution is added' },
      emulsion: { test: 'emulsion', food: 'sesame', name: 'sesame oil', act: 'Shake with ethanol, pour into water', y: 'a cloudy white emulsion: a fat or oil is present', n: 'sesame oil and water, before ethanol is added' },
      dcpip: { test: 'dcpip', food: 'kiwi', name: 'kiwi fruit', act: 'Add the food, one drop at a time', y: 'the blue colour disappears: vitamin C is present', n: 'DCPIP solution is blue' }
    };
    var scene = {
      W: W, H: H,
      tick: function (dt) { if (on && k < 1) k = Math.min(1, k + dt / (mode === 'emulsion' ? 9 : 2.4)); else if (!on && k > 0) k = Math.max(0, k - dt / .5); },
      draw: function (c) {
        /* the emulsion test is the whole method: ethanol, shake, pour into water, and the cloud forms in the water */
        if (mode === 'emulsion') { emul().draw(c, emT(), 0); return; }
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var q = CASE[mode], e = ease(k), X1 = 170, X2 = 390, Y = 50, TH = 276, TW = 92;
          if (mode !== 'emulsion') { D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true); }
          D.rack(c, 66, 494, 200, 136);
          var a = mode === 'dcpip' ? 1 : Math.min(1, e * 2.2), d = mode === 'emulsion' ? ease(seg(k, .45, 1)) : ease(seg(k, .3, 1));
          var q1 = T.liquid(q.test, q.food, a, d, .55), q2 = T.liquid(q.test, 'water', a, mode === 'emulsion' ? d : 0, .55);
          D.tube(c, X1, Y, TW, TH, q1); D.tube(c, X2, Y, TW, TH, q2);
          tag(c, X1, 362, mode === 'dcpip' ? (on ? 'DCPIP + kiwi fruit' : 'DCPIP') : q.name); tag(c, X2, 362, mode === 'dcpip' ? (on ? 'DCPIP + water (control)' : 'DCPIP') : 'water (control)');
          D.setLight(false);
        });
      },
      labels: function () { return mode === 'emulsion' ? emul().labels(emT()) : []; },
      read: function (pill) { var q = CASE[mode]; pill('s', on && k >= 1 ? q.y : on ? (mode === 'emulsion' ? (emT() < 14 ? 'adding ethanol and shaking…' : 'pouring into water…') : 'wait…') : q.n); }
    };
    var V = MV({
      scene: scene, aria: 'Two test tubes, a food and water as a control. Press to carry out the biuret test, the ethanol emulsion test or the DCPIP test.',
      barLabel: 'The test', buttons: [['biuret', 'Biuret'], ['emulsion', 'Ethanol emulsion'], ['dcpip', 'DCPIP'], ['act', 'Add', 'memv__btn--go'], ['clear', 'Start again']], read: [['s', 'Shown:']], liveNames: true, bands: 'T',
      onButton: function (id) {
        if (CASE[id]) { set(id); ctx.pick(id, { stay: true }); }
        else if (id === 'act') { on = true; if (V.isStill()) k = 1; sync(); }
        else { on = false; k = 0; sync(); }
      }
    });
    function sync() { V.press(mode); V.button('act').textContent = CASE[mode].act; V.button('act').disabled = on; V.names(); V.paint(); }
    function set(id) { if (id !== mode) { on = false; k = 0; } mode = id; sync(); }
    return {
      el: V.el, tight: V.el.querySelector('.memv__fig'), start: function () { V.start(); sync(); }, stop: V.stop, say: 'Press to carry out the test',
      credit: 'Drawn for this lab, in the true colours of each test.',
      focus: function (part) { if (CASE[part]) set(part); }
    };
  });
})(window);
