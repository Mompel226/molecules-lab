/* ============================================================
   mol-tests.js — what each food really does in each food test (0610 4.1.3), in one place, so that the animations and the
   bench can never disagree (memory bench-sims-show-the-truth).

   The results are those of the mark schemes: iodine solution orange-brown → blue-black; Benedict's solution blue →
   green, yellow, orange, brick red ONLY after heating; biuret solution blue → purple; ethanol, then water → a cloudy white
   emulsion; DCPIP blue → colourless. Sucrose (table sugar) is not a reducing sugar, so Benedict's solution stays blue.
   Real foods hold more than one nutrient, in different quantities: kiwi fruit holds reducing sugars and vitamin C; tofu
   holds protein and some fat. A negative result means that the test found none: a very small quantity can go unseen.

   The foods are chosen by what they show, and none is in Dr Mompel's own practical or papers.
   ============================================================ */
(function (global) {
  'use strict';
  var D = global.MolDraw; if (!D) return;
  var C = D.C;

  var FOODS = [
    { id: 'water', name: 'water', look: { col: C.water }, neat: { col: C.clear }, has: {} },
    { id: 'cornflour', name: 'cornflour', look: { col: '#E8E6DC', cloud: .5 }, has: { starch: 1 } },
    { id: 'honey', name: 'honey', look: { col: '#F3E3B0' }, has: { sugar: 4 } },
    { id: 'tablesugar', name: 'table sugar', look: { col: C.water }, has: {} },
    { id: 'gelatine', name: 'gelatine', look: { col: '#F4EDD3' }, has: { protein: 1 } },
    { id: 'sesame', name: 'sesame oil', look: { col: C.water, oil: 1 }, neat: { col: '#E6C25A' }, has: { fat: 1 } },
    { id: 'kiwi', name: 'kiwi fruit', look: { col: '#DDEBC0', bits: 14, bitsCol: 'rgba(60,80,30,.5)' }, has: { sugar: 3, vitc: 1, protein: .3 } },
    { id: 'tofu', name: 'tofu', look: { col: '#EDE9DA', cloud: .4 }, has: { protein: 1, fat: .35 } }
  ];
  var BY = {}; FOODS.forEach(function (f) { BY[f.id] = f; });

  var BEN = [
    { col: C.ben[0], word: 'blue' }, { col: C.ben[1], word: 'green' }, { col: C.ben[2], word: 'yellow' },
    { col: C.ben[3], word: 'orange' }, { col: C.ben[4], word: 'brick red' }
  ];
  /* the colour of Benedict's solution at a level 0 … 4 that may lie between two colours */
  function benCol(v) {
    var i = Math.min(3, Math.floor(v));
    return D.mixHex(BEN[i].col, BEN[i + 1].col, Math.min(1, v - i));
  }

  var TESTS = {
    iodine:   { id: 'iodine', name: 'iodine solution', short: 'Iodine', finds: 'starch', col: C.iodine, heat: false },
    benedict: { id: 'benedict', name: 'Benedict’s solution', short: 'Benedict’s', finds: 'reducing sugars', col: C.ben[0], heat: true },
    biuret:   { id: 'biuret', name: 'biuret solution', short: 'Biuret', finds: 'protein', col: C.biuret, heat: false },
    emulsion: { id: 'emulsion', name: 'ethanol, then water', short: 'Ethanol', finds: 'fats and oils', col: C.ethanol, heat: false },
    dcpip:    { id: 'dcpip', name: 'DCPIP solution', short: 'DCPIP', finds: 'vitamin C', col: C.dcpip, heat: false }
  };
  var ORDER = ['iodine', 'benedict', 'biuret', 'emulsion', 'dcpip'];

  /* did this test find something in this food? */
  function positive(test, food) {
    var h = BY[food].has;
    return test === 'iodine' ? !!h.starch : test === 'benedict' ? !!h.sugar : test === 'biuret' ? !!h.protein : test === 'emulsion' ? !!h.fat : !!h.vitc;
  }
  /* the words of the result the pupil sees */
  function word(test, food) {
    var h = BY[food].has;
    if (test === 'iodine') return h.starch ? 'blue-black' : 'stays orange-brown';
    if (test === 'benedict') return h.sugar ? BEN[h.sugar].word : 'stays blue';
    if (test === 'biuret') return h.protein >= 1 ? 'purple' : h.protein ? 'pale purple' : 'stays blue';
    if (test === 'emulsion') return h.fat >= 1 ? 'cloudy white' : h.fat ? 'slightly cloudy' : 'stays clear';
    return h.vitc ? 'colourless' : 'stays blue';
  }
  /* the colour chip of that result */
  function chip(test, food) {
    var h = BY[food].has;
    if (test === 'iodine') return h.starch ? C.blueBlack : C.iodine;
    if (test === 'benedict') return BEN[h.sugar || 0].col;
    if (test === 'biuret') return h.protein >= 1 ? C.purple : h.protein ? D.mixHex(C.biuret, C.purple, .4) : C.biuret;
    if (test === 'emulsion') return h.fat >= 1 ? C.cloud : h.fat ? '#CBD8E0' : C.clear;
    return h.vitc ? '#EFF3EA' : C.dcpip;
  }

  /* the liquid in the tube: `added` 0…1 how far the reagent has mixed in; `done` 0…1 how far the change has gone (for
     Benedict's solution: how far the heating has gone) */
  function liquid(test, food, added, done, level) {
    var f = BY[food], h = f.has, l = test === 'emulsion' && f.neat ? f.neat : f.look;   /* the emulsion test starts with the food itself, in a dry tube */
    var q = { level: level == null ? .5 : level, col: l.col, cloud: l.cloud || 0, oil: l.oil || 0, bits: l.bits || 0, bitsCol: l.bitsCol };
    if (!added) return q;
    /* a reagent lies on the surface at first, then mixes in: never a colour between the two that could be read as a result */
    function layer(rc) { if (added < 1) q.top = { col: rc, f: added }; else { q.col = rc; q.cloud = (l.cloud || 0) * .3; q.bits = 0; } }
    if (test === 'iodine') {
      /* iodine turns blue-black at once where it meets starch */
      layer(h.starch ? C.blueBlack : C.iodine);
      if (h.starch && added >= 1) q.cloud = 0;
    } else if (test === 'benedict') {
      layer(C.ben[0]);
      if (h.sugar && added >= 1 && done > 0) { q.col = benCol(h.sugar * done); q.ppt = h.sugar >= 3 ? D.clamp((done - .55) / .45) * (h.sugar === 4 ? 1 : .55) : 0; }
    } else if (test === 'biuret') {
      layer(C.biuret);
      if (h.protein && added >= 1) q.col = D.mixHex(q.col, C.purple, done * (h.protein >= 1 ? 1 : .4));
    } else if (test === 'dcpip') {
      q.col = C.dcpip; q.cloud = 0; q.oil = 0; q.bits = 0;
      if (h.vitc) q.col = D.mixHex(q.col, l.col, done);   /* colourless, or the pale colour of the food: never a white */
    } else if (test === 'emulsion') {
      /* in ethanol the fat dissolves: a clear liquid. Poured into water (done), the fat comes out as tiny droplets */
      q.col = D.mixHex(l.col, f.id === 'sesame' ? '#EFE6BE' : C.clear, added); q.oil = 0; q.cloud = (l.cloud || 0) * (1 - added);
      q.bits = 0;
      if (done > 0) { q.col = D.mixHex(q.col, C.clear, done); q.cloud = (h.fat || 0) * done * (h.fat >= 1 ? .95 : .5); }
    }
    return q;
  }

  global.MolTests = { FOODS: FOODS, BY: BY, TESTS: TESTS, ORDER: ORDER, BEN: BEN, benCol: benCol, positive: positive, word: word, chip: chip, liquid: liquid };
})(window);
