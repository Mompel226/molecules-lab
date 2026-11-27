/* ============================================================
   views/mol-bench.js — the food test bench (0610 4.1.3): nothing happens until the pupil does it.

   The picture on the left is the tube; the choices and the notebook are a card on the right (memory
   animations-beside-their-buttons). Each food does what it truly does in each test (js/mol-tests.js), and a step left
   out has its true result: Benedict's solution that is not heated stays blue, whatever is in the tube (memory
   bench-sims-show-the-truth). The notebook records only what the pupil has really seen.
   ============================================================ */
(function (global) {
  'use strict';
  var Views = global.Views, D = global.MolDraw, T = global.MolTests, MV = global.MolView, L = global.CircLearn;
  if (!Views || !D || !T || !MV || !L) return;
  var C = D.C, ease = D.ease, seg = D.seg, lerp = D.lerp;

  var STAGES = {
    iodine: [['add', 'Add iodine solution']],
    benedict: [['add', 'Add Benedict’s solution'], ['heat', 'Heat in a water bath']],
    biuret: [['add', 'Add biuret solution']],
    emulsion: [['add', 'Add ethanol and shake'], ['pour', 'Pour into water']],
    dcpip: [['add', 'Add the food, one drop at a time']]
  };
  var NUTRIENTS = [['starch', 'starch'], ['sugar', 'reducing sugar'], ['protein', 'protein'], ['fat', 'fat or oil'], ['vitc', 'vitamin C']];
  /* the mystery foods are new to the pupil: never one of the foods they have just tested */
  var POOL = global.MolTests.FOODS.filter(function (f) { return f.mystery; }).map(function (f) { return f.id; });

  var B = global.MolBench = {
    food: 'cornflour', test: 'iodine', stage: 0, k: 1, busy: false, msg: '', log: {}, myst: null, mystLog: {}, picks: {}, verdict: null, fns: [],
    on: function (f) { this.fns.push(f); },
    tell: function () { this.fns.forEach(function (f) { f(); }); },
    shown: function () { return this.myst || this.food; },
    fresh: function () { this.stage = 0; this.k = 1; this.busy = false; this.msg = ''; },
    setFood: function (id) { this.myst = null; this.verdict = null; this.food = id; this.fresh(); this.tell(); },
    setTest: function (id) { this.test = id; this.fresh(); this.tell(); },
    done: function () { return this.stage >= STAGES[this.test].length && !this.busy; },
    act: function (still) {
      if (this.busy || this.stage >= STAGES[this.test].length) return;
      this.msg = ''; this.stage++; this.k = still ? 1 : 0; this.busy = !still;
      if (still) this.settle(); else this.tell();
    },
    settle: function () { this.busy = false; this.k = 1; this.tell(); },
    read: function () {
      var S = STAGES[this.test], f = this.shown();
      if (this.stage < S.length) {
        this.msg = this.test === 'benedict' && this.stage === 1 ? 'Not yet: Benedict’s solution changes colour only when it is heated.'
          : this.test === 'emulsion' && this.stage === 1 ? 'Not yet: the emulsion forms only when the liquid is poured into water.'
          : 'First carry out the test.';
        this.tell(); return;
      }
      if (this.busy) return;
      if (this.myst) this.mystLog[this.test] = 1; else this.log[f + '|' + this.test] = 1;
      this.msg = 'Recorded in your notebook: ' + T.word(this.test, f) + '.';
      this.tell();
    },
    mystery: function () {
      var was = this.myst, pick = was;
      var i = 0; while (pick === was && i++ < 20) pick = POOL[Math.floor(Math.random() * POOL.length)];
      this.myst = pick; this.mystLog = {}; this.picks = {}; this.verdict = null; this.fresh(); this.tell();
    },
    check: function () {
      var h = T.BY[this.myst].has, picks = this.picks, right = NUTRIENTS.every(function (n) { return !!h[n[0]] === !!picks[n[0]]; });
      var tested = Object.keys(this.mystLog).length;
      this.verdict = right && tested === 5 ? 'right' : right ? 'guess' : 'wrong';
      this.tell();
    }
  };

  /* ======================================================================= the tube */
  Views.add('benchv', function (spec, ctx) {
    var W = 560, H = 420, amb = 0, BY = 168, BH = 190, BW = 340;
    function sub() { return STAGES[B.test][B.stage - 1]; }
    var scene = {
      W: W, H: H,
      tick: function (dt) {
        amb += dt;
        if (B.busy) { B.k = Math.min(1, B.k + dt / (sub()[0] === 'heat' ? 3.2 : 1.8)); if (B.k >= 1) B.settle(); }
      },
      draw: function (c) {
        D.frame(c, 0, 0, W, H, 16, function () {
          D.ground(c, 0, 0, W, H);
          var f = B.shown(), t = B.test, s = B.stage, k = ease(B.k), X = W / 2, Y = 78, TW = 96, TH = 262, tilt = 0, dy = 0, shake = 0, q;
          if (t !== 'emulsion') { D.tile(c, 40, 8, W - 80, H - 16); D.setLight(true); }
          var name = sub() ? sub()[0] : '';
          if (t === 'dcpip') {
            q = T.liquid('dcpip', f, 1, s >= 1 ? ease(seg(B.k, .25, 1)) : 0, .5);
          } else if (t === 'benedict') {
            var heatK = s >= 2 ? (name === 'heat' ? B.k : 1) : 0;
            q = T.liquid('benedict', f, s >= 1 ? (s === 1 ? k : 1) : 0, heatK, .5);
            if (s >= 2) { dy = (name === 'heat' && B.busy ? Math.min(1, B.k * 3.5) : 1) * 14; }
          } else if (t === 'emulsion') {
            q = T.liquid('emulsion', f, s >= 1 ? (s === 1 ? k : 1) : 0, s >= 2 ? (name === 'pour' ? ease(seg(B.k, .55, 1)) : 1) : 0, s >= 2 ? .62 : .42);
            if (s === 1 && B.busy) shake = Math.sin(amb * 30) * 3.5;
          } else {
            q = T.liquid(t, f, s >= 1 ? Math.min(1, k * 1.5) : 0, s >= 1 ? ease(seg(B.k, .45, 1)) : 0, .5);
          }
          if (!(t === 'benedict' && s >= 2)) D.rack(c, X - 170, X + 170, 214, 136);
          if (t === 'benedict' && s >= 2) D.bath(c, X, BY, BW, BH, name === 'heat' && B.busy ? 1 : .35, amb);
          D.tube(c, X + shake, Y + dy, TW, TH, q, tilt);
          if (t === 'benedict' && s >= 2) { c.fillStyle = 'rgba(127,196,236,.07)'; c.fillRect(X - BW / 2, BY + BH * .24, BW, BH * .76); }
          /* the reagent going in */
          if (B.busy && (name === 'add' || name === 'pour')) {
            var col = t === 'dcpip' ? T.BY[f].look.col : name === 'pour' ? '#E6EEF2' : T.TESTS[t].col;
            D.dropper(c, X, 66, col, Math.abs(Math.sin(B.k * 14)));
            for (var i = 0; i < 3; i++) { var u = seg(B.k, .08 + i * .22, .3 + i * .22); if (u > 0 && u < 1) D.drop(c, X, lerp(72, Y + TH * .5, u * u), col); }
          }
          /* the name of what is in the tube */
          var nfs = D.textSize(c, 12.5), nh = 22 * nfs / 12.5; c.font = '600 ' + nfs + 'px Inter, system-ui, sans-serif';
          var nm = B.myst ? 'mystery food' : T.BY[f].name, tw = c.measureText(nm).width + 16 * nfs / 12.5;
          c.fillStyle = '#FFFFFF'; D.rr(c, X - tw / 2, 379, tw, nh, 6); c.fill(); c.strokeStyle = '#A9B6C2'; c.lineWidth = 1; c.stroke();
          c.fillStyle = '#10202E'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm, X, 379 + nh / 2 + .5); D.setLight(false);
        });
      },
      labels: function () { return []; },
      read: function (pill) { pill('t', T.TESTS[B.test].name + ' · finds ' + T.TESTS[B.test].finds); }
    };
    var V = MV({
      scene: scene, aria: 'A test tube on a rack with the chosen food. Press the buttons to carry out the chosen food test.',
      barLabel: 'Carry out the test', buttons: [['act', 'Add', 'memv__btn--go'], ['read', 'Record the result'], ['new', 'New tube']], read: [['t', 'Test:']], bands: '',
      onButton: function (id) {
        if (id === 'act') { B.act(V.isStill()); V.paint(); }
        else if (id === 'read') B.read();
        else { B.fresh(); B.tell(); }
      }
    });
    function sync() {
      var S = STAGES[B.test], a = V.button('act'), nxt = S[B.stage];
      a.textContent = nxt ? nxt[1] : 'Test done';
      a.disabled = !nxt || B.busy;
      V.button('read').disabled = B.busy;
      V.paint();
    }
    B.on(sync);
    return {
      el: V.el, start: function () { V.start(); sync(); }, stop: V.stop, say: 'A negative result means that the test did not detect the substance',
      credit: 'Drawn for this lab, in the true colours of each test.', focus: function () {}
    };
  });

  /* ======================================================================= the choices and the notebook, in a card */
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  L.add('benchctl', function () {
    var box = h('div', 'widget bn');
    var foods = h('div', 'bn__row'), tests = h('div', 'bn__row'), say = h('p', 'bn__say'), grid = h('div', 'bn__grid'), my = h('div', 'bn__my');
    say.setAttribute('aria-live', 'polite');
    box.appendChild(h('p', 'bn__h', '1. Choose a food'));
    box.appendChild(foods);
    box.appendChild(h('p', 'bn__h', '2. Choose a test'));
    box.appendChild(tests);
    box.appendChild(say);
    box.appendChild(h('p', 'bn__h', '3. Your notebook: the results you have recorded'));
    box.appendChild(grid);
    box.appendChild(h('p', 'bn__h', '4. A mystery food'));
    box.appendChild(my);
    function chip(row, id, label, click) {
      var b = h('button', 'bn__chip', label); b.type = 'button'; b.setAttribute('data-id', id); b.addEventListener('click', function () { click(id); }); row.appendChild(b); return b;
    }
    var fB = {}, tB = {};
    T.FOODS.forEach(function (f) { if (!f.mystery) fB[f.id] = chip(foods, f.id, f.name, function (id) { B.setFood(id); }); });
    T.ORDER.forEach(function (id) { tB[id] = chip(tests, id, T.TESTS[id].short, function (x) { B.setTest(x); }); });

    var cells = {}, tbl = h('table', 'bn__t');
    var head = '<tr><th scope="col">food</th>' + T.ORDER.map(function (id) { return '<th scope="col">' + T.TESTS[id].short + '</th>'; }).join('') + '</tr>';
    tbl.innerHTML = '<thead>' + head + '</thead><tbody></tbody>';
    var tb = tbl.querySelector('tbody');
    T.FOODS.forEach(function (f) {
      if (f.mystery) return;
      var tr = h('tr'); tr.appendChild(h('th', '', L.esc(f.name))); tr.firstChild.setAttribute('scope', 'row');
      T.ORDER.forEach(function (id) { var td = h('td'); td.innerHTML = '<span class="bn__c" aria-label="not tested yet"></span>'; tr.appendChild(td); cells[f.id + '|' + id] = td.firstChild; });
      tb.appendChild(tr);
    });
    /* the mystery food has its own row, so each result recorded for it can be seen (Daniel, 25 Nov 2026) */
    var mTr = h('tr', 'bn__mrow'), mCells = {}; mTr.appendChild(h('th', '', 'mystery food')); mTr.firstChild.setAttribute('scope', 'row');
    T.ORDER.forEach(function (id) { var td = h('td'); td.innerHTML = '<span class="bn__c" aria-label="not tested yet"></span>'; mTr.appendChild(td); mCells[id] = td.firstChild; });
    tb.appendChild(mTr);
    grid.appendChild(tbl);

    /* the mystery food */
    var mGo = h('button', 'bn__go', 'Give me a mystery food'); mGo.type = 'button'; mGo.addEventListener('click', function () { B.mystery(); });
    var mText = h('p', 'bn__m'), mRow = h('div', 'bn__row'), mChk = h('button', 'bn__go', 'Check'); mChk.type = 'button';
    mChk.addEventListener('click', function () { B.check(); });
    var nB = {};
    NUTRIENTS.forEach(function (n) { nB[n[0]] = chip(mRow, n[0], n[1], function (id) { B.picks[id] = !B.picks[id]; B.verdict = null; B.tell(); }); });
    var mOut = h('p', 'bn__say'); mOut.setAttribute('aria-live', 'polite');
    my.appendChild(mGo); my.appendChild(mText); my.appendChild(mRow); my.appendChild(mChk); my.appendChild(mOut);

    function sync() {
      Object.keys(fB).forEach(function (id) { fB[id].setAttribute('aria-pressed', !B.myst && B.food === id ? 'true' : 'false'); });
      Object.keys(tB).forEach(function (id) { tB[id].setAttribute('aria-pressed', B.test === id ? 'true' : 'false'); });
      say.textContent = B.msg || 'Press the buttons on the picture.';
      say.classList.toggle('is-res', /^Recorded/.test(B.msg));
      Object.keys(cells).forEach(function (k) {
        var q = k.split('|'), seen = B.log[k];
        cells[k].style.background = seen ? T.chip(q[1], q[0]) : '';
        cells[k].classList.toggle('is-on', !!seen);
        cells[k].setAttribute('aria-label', seen ? T.word(q[1], q[0]) : 'not tested yet');
      });
      var m = !!B.myst;
      mTr.hidden = !m;
      T.ORDER.forEach(function (id) {
        var seen = m && B.mystLog[id];
        mCells[id].style.background = seen ? T.chip(id, B.myst) : '';
        mCells[id].classList.toggle('is-on', !!seen);
        mCells[id].setAttribute('aria-label', seen ? T.word(id, B.myst) : 'not tested yet');
      });
      mTr.firstChild.textContent = B.verdict === 'right' ? 'mystery food: ' + T.BY[B.myst].name : 'mystery food';
      mText.hidden = mRow.hidden = mChk.hidden = !m;
      mGo.textContent = m ? 'Another mystery food' : 'Give me a mystery food';
      if (m) {
        var n = Object.keys(B.mystLog).length;
        mText.textContent = 'Carry out all five tests and record each result: it has its own row in your notebook (' + n + ' of 5 recorded). Then choose what it contains.';
        NUTRIENTS.forEach(function (x) { nB[x[0]].setAttribute('aria-pressed', B.picks[x[0]] ? 'true' : 'false'); });
      }
      mOut.textContent = !B.verdict ? '' : B.verdict === 'right' ? 'Correct: this food was ' + T.BY[B.myst].name + '.'
        : B.verdict === 'guess' ? 'Your choice fits this food, but carry out all five tests before you decide.' : 'Not yet. Look at your results again.';
      mOut.className = 'bn__say' + (B.verdict === 'right' ? ' is-res' : '');
    }
    B.on(sync); sync();
    return box;
  });
})(window);
