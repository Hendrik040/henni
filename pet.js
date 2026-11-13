/* ═══════════════════════════════════════════════════════════════
   krackedtools.dev — site pet "Henni": a voxel Hendrik that follows the
   cursor. Ink colourway: a light hoodie in the site's white-ink tone,
   mauve-grey trousers, dark drawstrings with tiny orange aglets.
   Source, lab and tests: https://github.com/Hendrik040/henni (MIT).
   Colourways are generated from one source by swapping the clothing
   ramps; this file is built by tools/build-pet.mjs.

   Rendering: a tiny z-buffered software rasterizer at ~1 art px per
   voxel, scaled 3x pixel-sharp. Light comes from the top-left like the
   homepage tiles; each face picks a step from a hand-built colour ramp,
   part-ID creases separate overlapping parts, and the top/left contour
   is raised one step. Every fill stays at 3:1 or better on #131118.

   Behaviour:
   - He only arrives after 30 s on the site (counted across pages, per
     tab): a door grows out of the floor, he steps out, it sinks away.
   - The longer the visit, the further his day goes: walking → coding →
     podcast → surfing → saxophone → cocktails → skiing → kitesurfing →
     asleep on the couch. Clicking him skips ahead (or wakes him).
   - When the cursor rests, the sit-down scenes play: coding with his back
     to us at two big screens, four terminals on a finer 2x overlay telling
     one story (Claude Code ships PR #128, CodeRabbit calls it slop, Codex
     ships jokes, the push goes live on a Friday); The Merge podcast
     (THE MERGE desk, ON AIR light, camera), where real guests of the
     show, each hand-sculpted from their episode (pet-guests.js next to
     this file, loaded shortly before), take turns walking in through the door; a
     name tag shows as they sit, and clicking one opens their episode;
     a bar where he makes a martini, an old fashioned and
     a cuba libre (glasses drawn on the fine overlay so each one reads). While he skis and moves, he hits kickers and rails:
     backflip, cork 720, iron cross, misty 720, rail slide.
   - Now and then he stops following and goes his own way (first after
     45 s on foot, then every one to two minutes): he walks off on a path
     of his own and sits on a drinks crate with a Club-Mate for most of a
     minute, or does cartwheels across the page, or dances; then he comes
     back to the cursor. His day waits meanwhile; clicking him ends it.
   - He runs on TypeSafe's Jev: every 25 s a small snapshot of the visit
     (no typed text; see krackedtools.dev/privacy.html) goes to
     jev/jev-proxy.mjs on Railway, which picks his next activity and ranks
     the guests. Off krackedtools.dev and localhost he never calls it.
     Without an answer he keeps to his timetable and the newest guest
     goes first.
     On the podcasts page, resting on an episode brings its guest in.
   - Hovering him shows "send Henni home" and he holds still so you can
     click it: he waves, walks into a door and stays gone for the rest of
     the visit (the loop stops). "pin Henni here" keeps him in place.

   Mouse/trackpad only; hidden for prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (typeof window.matchMedia !== 'function' || !window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- Day schedule: seconds on site when each activity starts ----
  var ACTIVITIES = [
    { id: 'walk',     at: 0,   speed: 110 },   // a bigger figure travelling across text: keep him unhurried
    { id: 'coding',   at: 35,  speed: 90 },
    { id: 'podcast',  at: 80,  speed: 70 },
    { id: 'surf',     at: 125, speed: 240, off: 58 },
    { id: 'sax',      at: 170, speed: 80 },
    { id: 'cocktail', at: 215, speed: 70 },              // a longer session: three drinks
    { id: 'ski',      at: 275, speed: 260, off: 58 },
    { id: 'kite',     at: 320, speed: 300 },
    { id: 'sleep',    at: 365, speed: 0 }
  ];

  // ---- Render target ----
  var W = 128, H = 90;              // art pixels (≈ one voxel per pixel); wide enough for the desk and studio scenes
  var SCALE = 3;                    // CSS px per art pixel; an integer, so pixels stay square
  var OX = 64, OY = 82;             // art pixel under his feet
  var PITCH = 0.38;                 // camera looks down ~22°
  var CP = Math.cos(PITCH), SP = Math.sin(PITCH);
  var OFFSET_X = 38, OFFSET_Y = 34; // where his feet go relative to the cursor
  var STORE = 'kt-pet';

  // ---- Light: key from the top-left, like the homepage tiles ----
  var L = norm([-0.6, 0.65, 0.75]);
  var AMB = 0.46, DIF = 0.78;       // bands: shadow side ≤0.6, front 0.7–0.9, lit side 1.0, tops 1.1
  var SHADOW = [6, 5, 9];           // contact shadow = the tiles' cast-shadow colour

  // ---- Ramps, darkest first. The light band picks the step; a texel can sit a step up or down. ----
  // On 5-step ramps the four bands land on steps 1–4, all ≥3:1 on #131118. Step 0 only shows as
  // crease lines and two deliberate darks (the inside of the hood, the sax bell's mouth).
  var RAMPS = {
    skin:  ['#9c5549', '#d9977b', '#f5c4a3', '#fcd6b8', '#ffe5cf'],   // lit steps stay peach: a lit cheek, not a white mask
    stub:  ['#8f5546', '#c58f74', '#dcb393', '#edc8a8', '#f6d8bd'],   // golden-grey, not just darker skin
    hair:  ['#7b5432', '#a37b4c', '#c39f69', '#dfc28c', '#f2e2b6'],   // sandy gold like his own; mid sits 15 L* under the skin
    fade:  ['#6f5640', '#9c805f', '#b89c78', '#cfb591', '#e2cdab'],   // short faded sides: golden-grey, like the stubble
    hood:  ['#6e6878', '#9d97a9', '#c4bfcd', '#dcd8e3', '#ece9f1'],   // mauve-grey: the site's greys, lifted to ≥3:1
    jean:  ['#3f3a4a', '#5f5870', '#746c86', '#8a829b', '#a29ab3'],   // light-wash denim
    shoe:  ['#aaa3b8', '#dcd7e4', '#f6f4f9'],
    gum:   ['#b88757', '#c99563', '#d6a774'],
    hw:    ['#3b3645', '#55505f', '#6e6879', '#8a8495', '#a7a1b2'],   // headphones, stands, kite bar
    steel: ['#6f6c7c', '#9a97a8', '#c3c1ce', '#dddce6', '#f1f0f5'],   // mic, shaker
    cream: ['#b58c6f', '#e0b896', '#ffe0c2', '#fff0dd', '#fff8ee'],   // boards, blanket (the site's pale orange)
    peach: ['#b5531f', '#e0783a', '#ffa057', '#ffbb80', '#ffd3a8'],   // drink, cups, kite underside
    brass: ['#7a5514', '#b0841f', '#d8ad35', '#ecc95a', '#f8e28e'],   // sax, bottle, foot rail
    bar:   ['#36313e', '#4a4454', '#5f5869', '#756e80', '#8c8597'],
    top:   ['#7f7a8a', '#a09aaa', '#bfbac8', '#d6d2de', '#e9e6ef'],
    couch: ['#3c3646', '#524b5d', '#6a6276', '#827a8f', '#9b93a8'],
    wool:  ['#6f6052', '#94826f', '#b3a089', '#cbb9a0', '#ddcfb8'],   // oatmeal blanket
    sea:   ['#263a4a', '#30495d', '#3d5d74', '#51768f', '#6a8fa7'],   // slate, like the hero's bay
    foam:  ['#c3c0cd', '#e2dfe9', '#f3f1f7'],
    // the podcast guest: dark hair, a teal crew tee, charcoal trousers, a warmer skin tone
    ghair: ['#2a1c15', '#45301f', '#5a3f2b', '#70523a', '#8a6a4f'],
    gtop:  ['#2c4549', '#3f6168', '#53777f', '#6a8f96', '#86aab0'],
    gpant: ['#3a3542', '#55505f', '#68626f', '#7d7784', '#948e9b'],
    gskin: ['#6b3f2e', '#b8764f', '#d2946c', '#e2a983', '#ecbf9c'],
    // the bar: cola, ice (and a martini's gin), lime / olive
    cola:  ['#1f100a', '#3a1d12', '#55291a', '#6e3824', '#8a4a31'],
    ice:   ['#8fa3b4', '#b9cad8', '#d9e5ee', '#ecf3f8', '#f8fbfd'],
    lime:  ['#3f5a1f', '#5f7d2c', '#7f9c40', '#9db75c', '#bcd382'],
    // a Club-Mate on his break: brown glass, a pale label, on a drinks crate
    mate:  ['#5a3412', '#93592a', '#b07035', '#c98c4a', '#dfab6a'],
    label: ['#9c8a5c', '#cdb98a', '#e4d4a6', '#f1e6c4', '#f9f2df'],
    crate: ['#3a3f52', '#5b6582', '#717c9c', '#8a95b4', '#a6b0cc']
  };
  // texture letters → 'ramp', 'ramp±n' (step offset), 'ramp=n' (fixed step) or a flat colour
  var KEYDEF = {
    S: 'skin', s: 'skin-1', t: 'stub', F: 'fade',
    H: 'hair', h: 'hair-1', G: 'hair+1',
    O: 'hood', o: 'hood-1', q: 'hood=0',
    P: 'jean', Q: 'jean+1', N: 'shoe', g: 'gum',
    M: 'hw', K: 'steel', Z: 'steel+1', C: 'cream', A: 'peach',
    Y: 'brass', y: 'brass-1', j: 'brass=0', R: 'bar', r: 'bar-1', T: 'top',
    V: 'couch', v: 'couch-1', u: 'couch+1', W: 'wool', B: 'sea', a: 'sea+1', f: 'foam',
    E: '#1b1720', x: '#f6f4f9', w: '#f6f4f9', m: '#7a2c35', b: '#9b5e2a',  // eyes, glint, teeth, mouth, brows
    X: '#0b0a0e',                                                           // inside the doorway, screen glass
    J: '#221d2b', U: '#3d3647', i: '#c9c3d6',                               // terminal pane, title bar, text
    k: 'gtop-1', n: 'gtop+1', c: 'cola', d: 'ice', e: 'lime',                                               // pine trees on the ski slope
    D: '#3b3645', L: '#ff570a',                                             // strings (one white for all); the one accent
    I: 'mate', z: 'mate-1', l: 'label', p: 'crate'                          // the Club-Mate and its crate
  };
  // band (shadow, front, lit, top) → ramp step. 'floor': a one-step-darker texel never goes below
  // this step, so step 0 only ever shows as a crease line and the silhouette stays ≥3:1.
  var BANDS = { 3: [0, 1, 2, 2], 5: [1, 2, 3, 4] }, FLOOR = { 3: 0, 5: 1 };
  var MATS = [], KEYS = {}, MAT_ID = {};
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  (function () {
    for (var m in RAMPS) {
      MAT_ID[m] = MATS.length;
      var n = RAMPS[m].length;   // lit contour tops out at the 'light' step; the highlight is for top faces
      MATS.push({ c: RAMPS[m].map(rgb), band: BANDS[n], floor: FLOOR[n], edge: n === 5 ? 3 : n - 1 });
    }
    for (var k in KEYDEF) {
      var d = KEYDEF[k], r = /^([a-z]+)(?:([+-]\d)|=(\d))?$/.exec(d);
      KEYS[k] = r ? { m: MAT_ID[r[1]], o: r[2] ? +r[2] : 0, f: r[3] ? +r[3] : -1 } : { m: -1, c: rgb(d) };
    }
  })();
  // the guest is drawn with the same rig, re-keyed to his own colours
  var GUEST_DEF = { H: 'ghair', h: 'ghair-1', G: 'ghair+1', F: 'ghair-1', S: 'gskin', s: 'gskin-1', t: 'gskin',
    O: 'gtop', o: 'gtop-1', q: 'gtop=0', P: 'gpant', Q: 'gpant+1' };
  var GUEST_KEYS = {};
  (function () {
    for (var k in GUEST_DEF) {
      var r = /^([a-z]+)(?:([+-]\d)|=(\d))?$/.exec(GUEST_DEF[k]);
      GUEST_KEYS[k] = { m: MAT_ID[r[1]], o: r[2] ? +r[2] : 0, f: r[3] ? +r[3] : -1 };
    }
  })();
  function asGuest(fn) {
    var keep = {}, k, out;
    for (k in GUEST_KEYS) { keep[k] = KEYS[k]; KEYS[k] = GUEST_KEYS[k]; }
    out = fn();
    for (k in keep) KEYS[k] = keep[k];
    return out;
  }
  // Guests from The Merge bring their own look (pet-guests.js: window.ktPetGuests.looks[id](K)):
  // ramps (ghair, gskin, gtop, gpant, gbrd, gxa..gxe), key overrides (def), faces, head sides, hair,
  // glasses and body parts, torso width/texture, arms, and a talking gesture. Digits 1-9 key the extra
  // ramps: gxa, gxa-1, gxb, gxb-1, gxc, gxc-1, gxd, gxd-1, gxe. A look that fails to build is skipped.
  var LOOK_BASE = { k: 'gtop-1', n: 'gtop+1', b: '#9b5e2a', '1': 'gxa', '2': 'gxa-1', '3': 'gxb', '4': 'gxb-1',
    '5': 'gxc', '6': 'gxc-1', '7': 'gxd', '8': 'gxd-1', '9': 'gxe' };
  var LOOK_RAMPS = ['ghair', 'gskin', 'gtop', 'gpant', 'gbrd', 'gxa', 'gxb', 'gxc', 'gxd', 'gxe'];
  var LOOKS = {};
  function lookFace(rows) { rows = rows.slice(); rows.level = true; rows.lit = 0.8; return rows; }
  function registerGuest(id) {
    if (Object.prototype.hasOwnProperty.call(LOOKS, id)) return LOOKS[id];
    var G = window.ktPetGuests, f = G && G.looks && G.looks[id], look = null;
    try {
      if (typeof f === 'function') {
        look = f({ HH: HH, STRANDS: STRANDS, swap: swap, FACE: FACE }) || null;
        var R = look.ramps || {}, mats = {}, base = MATS.length, def = {}, k;
        LOOK_RAMPS.forEach(function (r, i) {
          var hex = R[r] || (r === 'gbrd' ? R.gskin : null) || RAMPS[r] || RAMPS.hw, c = hex.map(rgb), n = c.length;
          if (!BANDS[n]) throw new Error('ramp ' + r + ' needs 3 or 5 steps');
          mats[r] = base + i;
          MATS.push({ c: c, band: BANDS[n], floor: FLOOR[n], edge: n === 5 ? 3 : n - 1 });
        });
        for (k in GUEST_DEF) def[k] = GUEST_DEF[k];
        for (k in LOOK_BASE) def[k] = LOOK_BASE[k];
        for (k in look.def || {}) def[k] = look.def[k];
        look._keys = {};
        for (k in def) {
          var d = def[k], r = /^([a-z]+)(?:([+-]\d)|=(\d))?$/.exec(d), m = r ? (mats[r[1]] !== undefined ? mats[r[1]] : MAT_ID[r[1]]) : -1;
          look._keys[k] = r && m !== undefined ? { m: m, o: r[2] ? +r[2] : 0, f: r[3] ? +r[3] : -1 } : { m: -1, c: rgb(d) };
        }
        if (look.faces) {
          var F = {};
          ['smile', 'blink', 'talk'].forEach(function (n) { F[n] = lookFace(look.faces[n] || look.faces.smile); });
          F.smileL = lookFace(swap(F.smile, 5, F.smile[5].replace(/xE/g, 'Ex')));
          F.talkL = lookFace(swap(F.talk, 5, F.talk[5].replace(/xE/g, 'Ex')));
          look._faces = F;
        }
        if (look.head) look._head = { r: look.head.r, l: rev(look.head.r), b: look.head.b, t: look.head.t || 'H', d: HEAD.d };
      }
    } catch (e) { look = null; }
    LOOKS[id] = look || false;
    return look || false;
  }
  function asLook(look, fn) {
    var keep = {}, k, out;
    for (k in look._keys) { keep[k] = KEYS[k]; KEYS[k] = look._keys[k]; }
    try { out = fn(); } finally { for (k in keep) KEYS[k] = keep[k]; }
    return out;
  }
  // 2D overlays (notes, waves, z's, spray, kite lines)
  var OV = { ink: rgb('#ece9f1'), peach: rgb('#ffa057'), foam: rgb('#f3f1f7'), sea: rgb('#6a8fa7'), line: rgb('#d6d2de') };

  // ---- Textures (rows top→bottom; side faces read front→back) ----
  function rev(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }
  function swap(rows, i, row) { var c = rows.slice(); c[i] = row; return c; }
  // 12x12 face: high forehead (hair only at the temples' corners), arched brows, 2x2 eyes with
  // a glint, nose shadow, wide grin (raised corners, teeth row, lower lip), golden-grey stubble
  var FACE = ['hSSSSSSSSSSh', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SbSSSSSSSSbS', 'SSSxESSxESSS',
              'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSmSSSSSSmSS', 'tSSmwwwwmSSt', 'ttSSmmmmSStt', 'tttttttttttt'];
  var FACES = {
    smile: FACE,
    blink: swap(swap(FACE, 5, 'SSSSSSSSSSSS'), 6, 'SSSEESSEESSS'),
    talk: swap(swap(swap(FACE, 8, 'SSSmmmmmmSSS'), 9, 'tSSmwwwwmSSt'), 10, 'ttSSmmmmSStt'),
    sleep: swap(swap(swap(swap(swap(FACE, 5, 'SSSSSSSSSSSS'), 6, 'SSEEESSEEESS'), 8, 'SSSSSSSSSSSS'), 9, 'tSSSSmmSSSSt'), 10, 'ttSSSSSSSStt')
  };
  // the glint sits on the far side of each eye, so the pupils point where he looks
  FACES.smileL = swap(FACES.smile, 5, 'SSSExSSExSSS');
  FACES.talkL = swap(FACES.talk, 5, 'SSSExSSExSSS');
  for (var fk in FACES) { FACES[fk].level = true; FACES[fk].lit = 0.8; }
  var PRI = 'Exmwb'; // features that must survive minification, most important first
  // When the face lands on fewer than 12 screen columns (turned) or rows (nodding, leaning),
  // give up whole skin columns/rows first, so an eye never thins to 1 px and the grin keeps its
  // corners. Columns: cheek edges, outer brow ends, the gap between the eyes. Rows: forehead,
  // fringe, nose shadow, stubble.
  function keepTable(drop) {
    var t = [];
    for (var n = 1; n <= 12; n++) { t[n] = []; for (var i = 0; i < 12; i++) if (drop.indexOf(i) >= 12 - n) t[n].push(i); }
    return t;
  }
  var KEEP_C = keepTable([0, 11, 1, 10, 6, 5, 2, 9, 3, 8, 4, 7]);
  var KEEP_R = keepTable([2, 0, 7, 11, 1, 4, 10, 3, 6, 8, 9, 5]);
  function kept(t, k) { return k < 0 ? Math.max(0, t[0] - 1) : k >= t.length ? Math.min(11, t[t.length - 1] + 1) : t[k]; }
  // short faded sides (10 deep, front→back): a golden-grey fade above and behind the ear, skin at temple and jaw
  var HEAD_R = ['HHHHHHHHHH', 'HHHHHHHHHH', 'SFFFFFFFFF', 'SSFFFFFFFF', 'SSSFFFFFFF', 'SSSSFFFFFF',
                'SSSSSFFFFF', 'SSSSSSFFFF', 'SSSSSSSFFF', 'tSSSSSSSFF', 'ttSSSSSSSs', 'tttSSSSsss'];
  var HEAD = {
    r: HEAD_R, l: rev(HEAD_R), t: 'H', d: 's',
    b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF',
        'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss']
  };
  // hair tops are combed back: darker strands run front to back and stop short of the lit front edge
  var STRANDS = ['HhHHHhHHHhHH', 'HhHHHhHHHhHH', 'HHHHHHHHHHHH'];
  var CROWN = { all: 'H', t: STRANDS };
  var CAP = { all: 'H', t: STRANDS, f: ['GHGGHGGHGGHG', 'HhHHhHHhHHhH'] };
  var QUIFF = { all: 'H', t: ['HhHHhH', 'HhHHhH', 'GHGGHG'], f: ['GGHGGH', 'HHHhHH'] };
  // the ears' small top faces take the step-darker key so they never flash the highlight
  var EAR_L = { all: 'S', t: 's', l: 's' }, EAR_R = { all: 'S', t: 's', r: 's' };
  var HOOD = { all: 'O', f: 'q', d: 'o' };               // its front face is the inside of the hood
  var TORSO = {                                           // pullover: no opening, centred strings, kangaroo pocket
    f: ['OOOOOOOOOOOO', 'OOOODOODOOOO', 'OOOODOODOOOO', 'OOOODOODOOOO', 'OOOOLOOLOOOO',
        'OOooooooooOO', 'OoOOOOOOOOoO', 'OoOOOOOOOOoO', 'OOOOOOOOOOOO'],
    all: 'O', t: 'o'                                      // top a step darker: no bright shoulder strip
  };
  TORSO.f.pri = 'LD';                                     // both strings and aglets survive a turned torso (never one centred line)
  var ARM = { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'oooo', 'SSSS', 'SSSS'], t: 'o', d: 'S' };
  var LEG = { all: ['P', 'P', 'P', 'P', 'P', 'P', 'Q'], f: ['PPPP', 'PPPP', 'PQQP', 'PQQP', 'PPPP', 'PPPP', 'QQQQ'] };
  var GTORSO = { all: 'O', t: 'o', f: ['OOOooooOOOOO'.replace(/^OOO/, 'OOO'), 'OOOOooooOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO',
    'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'] };   // crew-neck tee
  var GLASSES = { all: 'M', f: ['MMMM', 'M..M', 'M..M', 'MMMM'] };
  var DOOR_F = ['VVVVVVVV', 'VvvvvvvV', 'VvVVVVvV', 'VvVVVVvV', 'VvvvvvvV', 'VVVVVVVV', 'VvvvvvvV', 'VvVVVVvV', 'VvVVVVvV', 'VvvvvvvV', 'VVVVVVVV'];
  var SHOE = { all: ['NNNNNNN', 'NNNNNNN', 'ggggggg'], f: ['NNNN', 'NNNN', 'gggg'], b: ['NLLN', 'NLLN', 'gggg'], t: 'N', d: 'g' };

  // ---------- small math ----------
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rot(rx, ry, rz) { // R = Ry · Rx · Rz
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    var rxz = [cz, -sz, 0, cx * sz, cx * cz, -sx, sx * sz, sx * cz, cx];           // Rx · Rz
    return [cy * rxz[0] + sy * rxz[6], cy * rxz[1] + sy * rxz[7], cy * rxz[2] + sy * rxz[8],
            rxz[3], rxz[4], rxz[5],
            -sy * rxz[0] + cy * rxz[6], -sy * rxz[1] + cy * rxz[7], -sy * rxz[2] + cy * rxz[8]];
  }
  function mulM(a, b) {
    return [a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
  }
  function mulV(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  var WORLD = { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };
  function child(par, x, y, z, rx, ry, rz) {
    var t = mulV(par.m, [x, y, z]);
    return { m: mulM(par.m, rot(rx || 0, ry || 0, rz || 0)), t: [t[0] + par.t[0], t[1] + par.t[1], t[2] + par.t[2]] };
  }
  function toWorld(xf, p) { var v = mulV(xf.m, p); return [v[0] + xf.t[0], v[1] + xf.t[1], v[2] + xf.t[2]]; }
  function project(p) { // world → screen (art px) + depth (bigger = closer)
    return { x: OX + p[0], y: OY - (p[1] * CP - p[2] * SP), z: p[1] * SP + p[2] * CP };
  }

  // ---------- his words, in the visitor's language ----------
  // The browser's preferred languages (navigator.languages) pick a table; anything
  // else gets English. Hand-written, never generated: Jev decides what he does,
  // these are only the words for it. ?henni-lang=de (or es, fr, pt, ja, zh, en) tries one out.
  var WORDS = {
    en: {
      name: 'English', title: 'Hendrik — click to change what he’s doing', home: 'send Henni home', pin: 'pin Henni here', unpin: 'unpin Henni',
      watch: 'Watch {name} on The Merge ↗', mate: 'Club-Mate break', wheel: 'watch this', dance: 'this is my song', ahh: 'ahh',
      hi: 'oh, I’m running on Jev', hiLang: '', end: 'you made it to the end!', skim: 'skimming, huh?', idle: 'still there?',
      running: 'running on Jev', says: 'Jev says: {act} · {p}% sure',
      act: { walk: 'a walk', coding: 'code', podcast: 'podcast', surf: 'surf', sax: 'sax', cocktail: 'cocktails', ski: 'ski', kite: 'kite', sleep: 'nap' }
    },
    de: {
      name: 'Deutsch', title: 'Hendrik – klick, damit er was anderes macht', home: 'Henni nach Hause schicken', pin: 'Henni hier festpinnen', unpin: 'Henni lösen',
      watch: '{name} in The Merge ansehen ↗', mate: 'Club-Mate-Pause', wheel: 'guck mal', dance: 'das ist mein Song', ahh: 'ahh',
      hi: 'oh, ich laufe auf Jev', hiLang: 'ich spreche Deutsch, weil dein Browser es tut', end: 'du hast es bis zum Ende geschafft!', skim: 'nur am Überfliegen, was?', idle: 'noch da?',
      running: 'läuft auf Jev', says: 'Jev sagt: {act} · zu {p}{nb}% sicher',
      act: { walk: 'Spaziergang', coding: 'Code', podcast: 'Podcast', surf: 'Surfen', sax: 'Saxofon', cocktail: 'Cocktails', ski: 'Skifahren', kite: 'Kiten', sleep: 'Nickerchen' }
    },
    es: {
      name: 'Español', title: 'Hendrik: haz clic para cambiar lo que hace', home: 'mandar a Henni a casa', pin: 'fijar a Henni aquí', unpin: 'soltar a Henni',
      watch: 'Ver a {name} en The Merge ↗', mate: 'pausa de Club-Mate', wheel: 'mira esto', dance: 'esta es mi canción', ahh: 'ahh',
      hi: 'oh, funciono con Jev', hiLang: 'te hablo en español porque tu navegador también', end: '¡llegaste al final!', skim: 'leyendo por encima, ¿eh?', idle: '¿sigues ahí?',
      running: 'funciono con Jev', says: 'Jev dice: {act} · {p}{nb}% seguro',
      act: { walk: 'un paseo', coding: 'código', podcast: 'pódcast', surf: 'surf', sax: 'saxo', cocktail: 'cócteles', ski: 'esquí', kite: 'kite', sleep: 'siesta' }
    },
    fr: {
      name: 'Français', title: 'Hendrik – clique pour changer ce qu’il fait', home: 'renvoyer Henni chez lui', pin: 'épingler Henni ici', unpin: 'détacher Henni',
      watch: 'Voir {name} dans The Merge ↗', mate: 'pause Club-Mate', wheel: 'regarde ça', dance: 'c’est ma chanson', ahh: 'ahh',
      hi: 'oh, je tourne sur Jev', hiLang: 'je parle français, comme ton navigateur', end: 'tu as tout lu{nb}!', skim: 'tu survoles, hein{nb}?', idle: 'toujours là{nb}?',
      running: 'je tourne sur Jev', says: 'Jev dit{nb}: {act} · sûr à {p}{nb}%',
      act: { walk: 'une balade', coding: 'du code', podcast: 'podcast', surf: 'surf', sax: 'saxo', cocktail: 'cocktails', ski: 'ski', kite: 'kite', sleep: 'sieste' }
    },
    pt: {
      name: 'Português', title: 'Hendrik – clique para mudar o que ele está fazendo', home: 'mandar o Henni para casa', pin: 'fixar o Henni aqui', unpin: 'soltar o Henni',
      watch: 'Ver {name} no The Merge ↗', mate: 'pausa para Club-Mate', wheel: 'olha só', dance: 'essa é a minha música', ahh: 'ahh',
      hi: 'oh, eu rodo no Jev', hiLang: 'falo português porque seu navegador também fala', end: 'você chegou ao fim!', skim: 'só passando o olho, né?', idle: 'ainda está aí?',
      running: 'rodando no Jev', says: 'Jev diz: {act} · {p}% de certeza',
      act: { walk: 'uma caminhada', coding: 'código', podcast: 'podcast', surf: 'surfe', sax: 'sax', cocktail: 'coquetéis', ski: 'esqui', kite: 'kite', sleep: 'soneca' }
    },
    ja: {
      name: '日本語', title: 'Hendrik — クリックで行動が変わるよ', home: 'Henni をおうちに帰す', pin: 'Henni をここに固定', unpin: 'Henni の固定を外す',
      watch: 'The Merge で {name} を見る ↗', mate: 'クラブマテ休憩', wheel: '見てて', dance: 'この曲好きなんだ', ahh: 'ふぅ',
      hi: 'あ、ぼくは Jev で動いてるよ', hiLang: 'ブラウザが日本語だから日本語で話すね', end: '最後まで読んだね！', skim: '流し読み中？', idle: 'まだいる？',
      running: 'Jev で動作中', says: 'Jev の判断：{act} · 確信度 {p}%',
      act: { walk: '散歩', coding: 'コーディング', podcast: 'ポッドキャスト', surf: 'サーフィン', sax: 'サックス', cocktail: 'カクテル', ski: 'スキー', kite: 'カイト', sleep: 'お昼寝' }
    },
    zh: {
      name: '中文', title: 'Hendrik —— 点一下，换件事做', home: '送 Henni 回家', pin: '把 Henni 固定在这里', unpin: '取消固定 Henni',
      watch: '在 The Merge 观看 {name} ↗', mate: 'Club-Mate 小憩', wheel: '看我的', dance: '这是我的歌', ahh: '啊～',
      hi: '哦，我是靠 Jev 运行的', hiLang: '你的浏览器说中文，所以我也说中文', end: '你读到最后了！', skim: '在快速浏览吗？', idle: '还在吗？',
      running: '由 Jev 驱动', says: 'Jev 说：{act} · {p}% 把握',
      act: { walk: '散步', coding: '写代码', podcast: '播客', surf: '冲浪', sax: '萨克斯', cocktail: '鸡尾酒', ski: '滑雪', kite: '风筝冲浪', sleep: '小睡' }
    }
  };
  var LANG = (function () {
    var forced = '';
    try { forced = (new URLSearchParams(location.search).get('henni-lang') || '').toLowerCase(); } catch (e) { /* no location */ }
    if (WORDS[forced]) return forced;
    var prefs = [];
    try { prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(String); } catch (e) { /* no navigator */ }
    for (var i = 0; i < prefs.length; i++) {
      var tag = prefs[i].toLowerCase(), base = tag.split('-')[0];
      if (base === 'zh') { if (/hant|-tw|-hk|-mo/.test(tag)) continue; return 'zh'; }   // only Simplified Chinese is written
      if (base === 'en') return 'en';
      if (WORDS[base]) return base;
    }
    return 'en';
  })();
  var SAY = WORDS[LANG];
  function say(key, vars) {
    var str = SAY[key] != null ? SAY[key] : WORDS.en[key];
    vars = vars || {};
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return k === 'nb' ? ' ' : vars[k] != null ? vars[k] : m; });
  }

  // ---------- frame buffer ----------
  // kind: 0 empty · 1 Hendrik (+ what he holds) · 2 shadow · 4 overlay
  //       5 scenery (bar, couch, boards, stand, kite) · 7 water
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.setAttribute('aria-hidden', 'true');
  var PET_TITLE = say('title');
  canvas.title = PET_TITLE;
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:' + W * SCALE + 'px;height:' + H * SCALE + 'px;' +
    'z-index:60;image-rendering:pixelated;will-change:transform;pointer-events:none;' +
    'cursor:var(--cursor-hand,pointer);';
  var ctx = canvas.getContext('2d');
  // a second, finer canvas laid exactly over the first, for the coding screens' text
  var SW2 = W * 2, SH2 = H * 2;
  var scr = document.createElement('canvas');
  scr.width = SW2; scr.height = SH2;
  scr.setAttribute('aria-hidden', 'true');
  scr.style.cssText = 'position:fixed;left:0;top:0;width:' + W * SCALE + 'px;height:' + H * SCALE + 'px;' +
    'z-index:60;image-rendering:pixelated;will-change:transform;pointer-events:none;';
  var sctx = scr.getContext('2d'), simg = sctx.createImageData(SW2, SH2), sbuf = simg.data, scrUsed = false, scrDirty = false;
  // hover bubble with one action: send him home (for the rest of this visit)
  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'kt-pet-bubble';
  bubble.textContent = say('home');
  bubble.style.cssText = 'position:fixed;left:0;top:0;z-index:61;display:none;';
  var bubbleCss = document.createElement('style');
  bubbleCss.textContent = '.kt-pet-bubble{font:12px/1 var(--font-mono,ui-monospace,monospace);' +
    'letter-spacing:.02em;color:#ece9f1;background:#131118;border:1px solid #3a3540;padding:7px 10px;white-space:nowrap;' +
    'cursor:var(--cursor-hand,pointer);transition:color .15s,border-color .15s}' +
    '.kt-pet-bubble:hover,.kt-pet-bubble:focus-visible{color:#ff570a;border-color:#ff570a;outline:none}' +
    '.kt-pet-bubble::after{content:"";position:absolute;left:50%;bottom:-5px;width:8px;height:8px;background:#131118;' +
    'border-right:1px solid #3a3540;border-bottom:1px solid #3a3540;transform:translateX(-50%) rotate(45deg)}' +
    '.kt-pet-bubble:hover::after{border-color:#ff570a}' +
    '.kt-pet-pin::after{top:-5px;bottom:auto;border:none;border-left:1px solid #3a3540;border-top:1px solid #3a3540}' +
    '.kt-pet-pin:hover::after{border-color:#ff570a}';
  // under his feet, with the bubble: pin him where he stands (he stops following) or let him go again
  var pinBtn = document.createElement('button');
  pinBtn.type = 'button';
  pinBtn.className = 'kt-pet-bubble kt-pet-pin';
  pinBtn.style.cssText = 'position:fixed;left:0;top:0;z-index:61;display:none;';
  var bubbleOn = false, bubbleHide = 0, bubbleAt = null;
  var img = ctx.createImageData(W, H), buf = img.data;
  var N = W * H;
  var zb = new Float32Array(N), kind = new Uint8Array(N), part = new Uint16Array(N);
  var mat = new Int16Array(N), stp = new Int8Array(N), fce = new Uint8Array(N), mark = new Uint8Array(N);
  var KIND = 1, partId = 0, nextPart = 0, groups = {}, curFace = 0;

  function clear() {
    buf.fill(0); zb.fill(-1e9); kind.fill(0); part.fill(0); mat.fill(-1); fce.fill(0);
    partId = 0; nextPart = 0; groups = {};
  }
  function solid(k) { return k === 1 || k === 5 || k === 7; }
  function put(x, y, z, c, m, si) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x;
    if (z <= zb[i]) return;
    zb[i] = z; kind[i] = KIND; part[i] = partId; mat[i] = m; stp[i] = si; fce[i] = curFace;
    var o = i * 4;
    buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = 255;
  }
  function dot(x, y, c, a) { // 2D overlay pixel (no depth test)
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    var i = y * W + x, o = i * 4, k = Math.min(1, a);
    var ba = buf[o + 3] / 255, na = k + ba * (1 - k);
    buf[o] = (c[0] * k + buf[o] * ba * (1 - k)) / na;
    buf[o + 1] = (c[1] * k + buf[o + 1] * ba * (1 - k)) / na;
    buf[o + 2] = (c[2] * k + buf[o + 2] * ba * (1 - k)) / na;
    buf[o + 3] = na * 255;
    if (!solid(kind[i])) kind[i] = 4;
  }

  // ---------- textured box rasterizer ----------
  function texel(spec, u, v) {
    if (typeof spec === 'string') return spec;
    if (typeof spec === 'function') return spec(u, v);
    var row = spec[Math.min(spec.length - 1, (v * spec.length) | 0)];
    return row.charAt(Math.min(row.length - 1, (u * row.length) | 0));
  }
  // When a face is drawn smaller than its texel grid, look across the texels this
  // pixel covers (c0..c1, r0..r1; a keep table may pin either) and keep the most
  // important feature (eyes, mouth) so it never drops out; else the centre texel.
  function texelIn(spec, c0, c1, r0, r1, cc, rc, pri) {
    var best = null, bp = 99;
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      var ch = spec[r].charAt(c), pi = pri.indexOf(ch);
      if (pi >= 0 && pi < bp) { bp = pi; best = ch; }
    }
    return best || spec[rc].charAt(cc);
  }
  function pick(tex, k) {
    if (typeof tex === 'string' || typeof tex === 'function' || Array.isArray(tex)) return tex;
    return tex[k] !== undefined ? tex[k] : tex.all;
  }
  function face(xf, o, ua, va, ul, vl, n, spec) {
    if (spec == null) return;
    var wn = mulV(xf.m, n);
    var nx = wn[0], ny = wn[1] * CP - wn[2] * SP, nz = wn[1] * SP + wn[2] * CP;
    if (nz <= 0.02) return;                                     // facing away
    var shade = Math.min(1.1, Math.round((AMB + DIF * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])) * 10) / 10);
    if (spec.lit) shade = clamp(shade, spec.lit, 0.9);          // the face always sits on the base step: no shadow, no white mask
    var band = shade < 0.65 ? 0 : shade < 0.95 ? 1 : shade < 1.05 ? 2 : 3;
    if (band === 3 && wn[1] < 0.5) band = 2;                   // the highlight step is for faces that point up
    curFace = spec.level ? 1 : 0;
    var p0 = project(toWorld(xf, o));
    var pu = project(toWorld(xf, [o[0] + ua[0] * ul, o[1] + ua[1] * ul, o[2] + ua[2] * ul]));
    var pv = project(toWorld(xf, [o[0] + va[0] * vl, o[1] + va[1] * vl, o[2] + va[2] * vl]));
    var ax = pu.x - p0.x, ay = pu.y - p0.y, bx = pv.x - p0.x, by = pv.y - p0.y;
    var det = ax * by - ay * bx;
    if (det > -1e-4 && det < 1e-4) return;
    var x0 = Math.max(0, Math.floor(Math.min(p0.x, pu.x, pv.x, pu.x + bx))), x1 = Math.min(W - 1, Math.ceil(Math.max(p0.x, pu.x, pv.x, pu.x + bx)));
    var y0 = Math.max(0, Math.floor(Math.min(p0.y, pu.y, pv.y, pu.y + by))), y1 = Math.min(H - 1, Math.ceil(Math.max(p0.y, pu.y, pv.y, pu.y + by)));
    var dzu = pu.z - p0.z, dzv = pv.z - p0.z;
    // faces sample features with priority; an upright face (rolled less than ~12°) keeps its
    // texel rows and columns level on screen, a tilted one (kite lean, asleep) follows the tilt
    // (other textures can name their own must-keep texels in .pri, e.g. the hoodie's strings)
    var lev = !!spec.level, pri = spec.pri || (lev ? PRI : ''), lvl = false, hu = 0, hv = 0, keepC = null, keepR = null, lu = 0, lv = 0, tm = 0, tn = 0;
    if (pri) {
      tm = spec[0].length; tn = spec.length;
      lvl = lev && bx * bx < 0.05 * by * by;
      lu = lvl ? Math.abs(ax) : Math.hypot(ax, ay);
      lv = lvl ? Math.abs(by) : Math.hypot(bx, by);
      hu = lu < 0.97 * tm ? (tm / lu - 1) / 2 + 0.02 : 0;
      hv = lv < 0.97 * tn ? (tn / lv - 1) / 2 + 0.02 : 0;
      // one texel per screen pixel, counted from the face's edge (12 or more pixels: identity)
      if (lvl && tm === 12) keepC = KEEP_C[clamp(Math.round(lu), 1, 12)];
      if (lvl && tn === 12) keepR = KEEP_R[clamp(Math.round(lv), 1, 12)];
    }
    for (var y = y0; y <= y1; y++) {
      var dy = y + 0.5 - p0.y;
      for (var x = x0; x <= x1; x++) {
        var dx = x + 0.5 - p0.x;
        var s = (dx * by - dy * bx) / det, q = (ax * dy - ay * dx) / det;
        if (s < -0.02 || q < -0.02 || s > 1.02 || q > 1.02) continue;
        // an upright face is sampled on a screen-aligned grid: rows measured from the face's
        // horizontal mid-line, columns from its vertical mid-line, so a 2x2 eye stays square
        var sLev = lvl ? (dx - 0.5 * bx) / ax : 0, qLev = lvl ? (dy - 0.5 * ay) / by : 0;
        s = s < 0 ? 0 : s > 0.9999 ? 0.9999 : s;
        q = q < 0 ? 0 : q > 0.9999 ? 0.9999 : q;
        var key;
        if (pri) {
          var ss = lvl ? clamp(sLev, 0, 0.9999) : s, qs = lvl ? clamp(qLev, 0, 0.9999) : q, c0, c1, r0, r1, cc, rc;
          // pixel column/row counted across the face; edge pixels take the neighbouring dropped texel
          if (keepC) cc = c0 = c1 = kept(keepC, Math.floor(sLev * lu));
          else { cc = Math.min(tm - 1, (ss * tm) | 0); c0 = Math.max(0, Math.floor(ss * tm - hu)); c1 = Math.min(tm - 1, Math.floor(ss * tm + hu)); }
          if (keepR) rc = r0 = r1 = kept(keepR, Math.floor(qLev * lv));
          else { rc = Math.min(tn - 1, (qs * tn) | 0); r0 = Math.max(0, Math.floor(qs * tn - hv)); r1 = Math.min(tn - 1, Math.floor(qs * tn + hv)); }
          key = texelIn(spec, c0, c1, r0, r1, cc, rc, pri);
        } else key = texel(spec, s, q);
        var K = KEYS[key];
        if (!K) continue;
        var z = p0.z + dzu * s + dzv * q;
        if (K.m < 0) put(x, y, z, K.c, -1, 0);
        else {
          var M = MATS[K.m], si = K.f >= 0 ? K.f : K.o < 0 ? Math.max(M.floor, M.band[band] + K.o) : Math.min(M.c.length - 1, M.band[band] + K.o);
          put(x, y, z, M.c[si], K.m, si);
        }
      }
    }
  }
  // grp: boxes sharing a crease group never crease each other (head + ears, crown + cap, the sea, the kite)
  function box(xf, x0, y0, z0, x1, y1, z1, tex, grp) {
    if (grp) { if (!groups[grp]) groups[grp] = ++nextPart; partId = groups[grp]; }
    else partId = ++nextPart;
    var sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    face(xf, [x0, y1, z1], [1, 0, 0], [0, -1, 0], sx, sy, [0, 0, 1], pick(tex, 'f'));
    face(xf, [x1, y1, z0], [-1, 0, 0], [0, -1, 0], sx, sy, [0, 0, -1], pick(tex, 'b'));
    face(xf, [x1, y1, z1], [0, 0, -1], [0, -1, 0], sz, sy, [1, 0, 0], pick(tex, 'r'));
    face(xf, [x0, y1, z0], [0, 0, 1], [0, -1, 0], sz, sy, [-1, 0, 0], pick(tex, 'l'));
    face(xf, [x0, y1, z0], [1, 0, 0], [0, 0, 1], sx, sz, [0, 1, 0], pick(tex, 't'));
    face(xf, [x0, y0, z1], [1, 0, 0], [0, 0, -1], sx, sz, [0, -1, 0], pick(tex, 'd'));
  }
  // contact shadow, cast a little away from the light, with a denser core
  function shadow(cx, rx, ry) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var e = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (e > 1) continue;
      var px = OX + cx + 2 + x, py = OY + y;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      var i = py * W + px, o = i * 4;
      zb[i] = -1e8; kind[i] = 2; mat[i] = -1;
      buf[o] = SHADOW[0]; buf[o + 1] = SHADOW[1]; buf[o + 2] = SHADOW[2]; buf[o + 3] = e < 0.4 ? 190 : 130;
    }
  }
  // No dark outline (it would vanish on #131118). Instead:
  // creases — a pixel whose up/left/right neighbour is another part more than 0.8 voxel
  //   closer drops to its material's darkest step (sleeve over hoodie, chin over neck,
  //   hem over jeans, clump over clump); face texels never crease;
  // lit contour — top/left silhouette pixels go one ramp step up, like the tiles' lit faces.
  function finish() {
    var x, y, i, j, n, k;
    mark.fill(0);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; k = kind[i];
      if (!solid(k) || mat[i] < 0) continue;
      if (!fce[i]) for (n = 0; n < 3; n++) {
        j = n === 0 ? (y > 0 ? i - W : -1) : n === 1 ? (x > 0 ? i - 1 : -1) : (x < W - 1 ? i + 1 : -1);
        if (j >= 0 && solid(kind[j]) && part[j] !== part[i] && zb[j] - zb[i] > 0.8) { mark[i] = 1; break; }
      }
      if (!mark[i] && k !== 7 && !fce[i] && ((y > 0 ? !solid(kind[i - W]) : true) || (x > 0 ? !solid(kind[i - 1]) : true))) mark[i] = 2;
    }
    for (i = 0; i < N; i++) {
      if (!mark[i]) continue;
      var M = MATS[mat[i]], si = mark[i] === 1 ? 0 : Math.max(stp[i], Math.min(M.edge, stp[i] + 1)), c = M.c[si], o = i * 4;
      buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; stp[i] = si;
    }
  }
  function line2d(a, b, c, alpha) {
    var n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) | 0;
    for (var i = 0; i <= n; i++) { var lx = Math.round(a.x + (b.x - a.x) * i / n), ly = Math.round(a.y + (b.y - a.y) * i / n); if (lx >= 0 && ly >= 0 && lx < W && ly < H && kind[ly * W + lx] === 1) continue; dot(lx, ly, c, alpha); }
  }
  function glyph(rows, x, y, c, a) { // notes, voice, z's: they pass behind him, never across his pixels
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      if (rows[j][i] !== '#') continue;
      var gx = Math.round(x + i), gy = Math.round(y + j);
      if (gx >= 0 && gy >= 0 && gx < W && gy < H && kind[gy * W + gx] === 1) continue;
      dot(gx, gy, c, a);
    }
  }
  var NOTE = ['..##', '..#.', '..#.', '###.', '###.'], NOTE2 = ['.#####', '.#...#', '.#...#', '##..##', '##..##'];
  var Z4 = ['####', '..#.', '.#..', '####'], Z5 = ['#####', '...#.', '..#..', '.#...', '#####'], Z6 = ['######', '....#.', '...#..', '..#...', '.#....', '######'];
  var WAVE = ['#..', '.#.', '..#', '..#', '.#.', '#..'], WAVE_L = ['..#', '.#.', '#..', '#..', '.#.', '..#'];

  // ---------- Hendrik (feet at y 0, ~40 voxels to the top of the quiff) ----------
  var HH = 12 / CP;                 // head height: the 12 face rows land on 12 screen rows
  function hendrik(root, p) {
    var lA = child(root, -2.7, 10.5, 0, p.lA[0], p.lA[1], p.lA[2]);
    box(lA, -2, -7.5, -2, 2, 0, 2, LEG); box(lA, -2.2, -10.5, -2.4, 2.2, -7.5, 4.2, SHOE);
    var lB = child(root, 2.7, 10.5, 0, p.lB[0], p.lB[1], p.lB[2]);
    box(lB, -2, -7.5, -2, 2, 0, 2, LEG); box(lB, -2.2, -10.5, -2.4, 2.2, -7.5, 4.2, SHOE);
    var up = p.breath ? child(root, 0, p.breath, 0, 0, 0, 0) : root;  // a breath lifts the upper body; feet stay put
    var LK = p.look || null, B = function (on, b) { box(on, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]); };
    if (LK) {                                                // a guest's own build: torso width, garment, hem, collars
      var tw = LK.torsoW || 6;
      box(up, -tw, 11.2, -3, tw, 21.5, 3, LK.torso || p.torso || TORSO);
      box(up, -tw - 0.5, 10, -3.5, tw + 0.5, 11.6, 3.5, LK.hem || 'o');
      (LK.body || []).forEach(function (b) { B(up, b); });
    } else {
    box(up, -6, 11.2, -3, 6, 21.5, 3, p.torso || TORSO);     // oversized pullover hoodie
    box(up, -6.5, 10, -3.5, 6.5, 11.6, 3.5, 'o');            // ribbed hem, a touch wider than the body
    }
    if (!p.guest) box(up, -5.2, 20.2, -5.8, 5.2, 23.6, -1.6, HOOD);        // hood bunched behind the neck
    box(up, -2.6, 20.5, -2.6, 2.6, 22.2, 2.6, 's');          // neck
    var head = child(up, 0, 21.6, 0, p.head[0], p.head[1], p.head[2]);
    var FS = (LK && LK._faces) || FACES, HS = (LK && LK._head) || HEAD;
    var fk = p.face + (p.gaze < 0 && FS[p.face + 'L'] ? 'L' : '');
    box(head, -6, 0, -4.5, 6, HH, 6, { f: FS[fk] || FS.smile, r: HS.r, l: HS.l, b: HS.b, t: HS.t, d: HS.d }, 'head');
    box(head, -7, 4.4, -1, -6, 7.6, 1, EAR_L, 'head');
    box(head, 6, 4.4, -1, 7, 7.6, 1, EAR_R, 'head');
    // hair: a short flat crown and a cap behind a high hairline; the quiff lifts at the front
    // in clumps that taper as they rise, peaking front-left of centre (toward his right),
    // with a lower tuft beside the crest so the top reads rounded, not as a block or a brim
    if (LK && LK.hair) LK.hair.forEach(function (b) { B(head, b); });
    else {
    box(head, -6.1, HH - 0.9, -4.7, 6.1, HH + 0.3, 0.6, CROWN, 'hair');
    box(head, -6, HH - 0.2, 0.6, 6, HH + 1.2, 6.2, CAP, 'hair');
    box(head, -6, HH + 1, -2.4, 5.4, HH + 2.8, 6.6, QUIFF, 'hair');
    if (!p.guest) {
      box(head, -5.6, HH + 2.6, -1.4, 3.4, HH + 4.4, 6.4, QUIFF);
      box(head, -4.6, HH + 4.2, 0.4, 0.4, HH + 6.6, 6.0, QUIFF);   // the crest
      box(head, 0.2, HH + 4.2, -0.2, 2.4, HH + 5.4, 4.6, QUIFF);   // the tuft beside it
    }
    }
    if (LK && LK.glasses) LK.glasses.forEach(function (b) { B(head, b); });
    else if (p.glasses) {
      box(head, -4.2, 4.9, 6, -0.4, 8.1, 6.5, GLASSES, 'glasses');
      box(head, 0.4, 4.9, 6, 4.2, 8.1, 6.5, GLASSES, 'glasses');
      box(head, -0.4, 7.2, 6, 0.4, 7.7, 6.5, 'M', 'glasses');
    }
    if (p.phones) {                                          // over-ear headphones: the band sits in the quiff behind the crest
      var gb = LK && LK.phonesY || HH + 2.6;                 // a guest's band rests on their own hair or cap
      box(head, -7.4, p.guest ? gb : HH + 4.4, -1.6, 7.4, p.guest ? gb + 1 : HH + 5.4, -0.3, { all: 'K', t: 'Z' }, 'phones');
      box(head, -7.4, 8.6, -1.6, -6.2, p.guest ? gb : HH + 4.4, -0.3, 'K', 'phones');
      box(head, 6.2, 8.6, -1.6, 7.4, p.guest ? gb : HH + 4.4, -0.3, 'K', 'phones');
      var CUP = ['AAAA', 'ALLA', 'ALLA', 'ALLA', 'AAAA'];     // orange disc in a peach shell
      box(head, -9.4, 2.6, -2.8, -6.6, 9.2, 2.8, { all: 'A', l: CUP, r: 'M' });
      box(head, 6.6, 2.6, -2.8, 9.4, 9.2, 2.8, { all: 'A', r: CUP, l: 'M' });
    }
    var aA = child(up, -7.7, 21, 0, p.aA[0], p.aA[1], p.aA[2]);
    box(aA, -2, -11, -2, 2, 0, 2, LK && LK.arm || ARM);
    var aB = child(up, 7.7, 21, 0, p.aB[0], p.aB[1], p.aB[2]);
    box(aB, -2, -11, -2, 2, 0, 2, LK && LK.arm || ARM);
    return { head: head, aA: aA, aB: aB, lA: lA, lB: lB };
  }

  // ---------- state ----------
  // He only shows up after ARRIVE_AFTER seconds on the site (counted across pages,
  // per tab), stepping out of a door; 'elapsed' is his time since arriving.
  var ARRIVE_AFTER = 30;
  var state = { elapsed: 0, x: 0, y: 0, wait: 0, arrived: false };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (saved && typeof saved.elapsed === 'number') {
      state = saved;
      if (typeof state.arrived !== 'boolean') state.arrived = state.elapsed > 0;
      if (typeof state.wait !== 'number') state.wait = 0;
      state.leaving = false;                                 // a half-finished goodbye doesn't carry over
    }
  } catch (e) { /* storage blocked: start fresh */ }
  // Keep him on the page. A restored position, a resized window or a hidden
  // (0x0) viewport must never strand him off-screen.
  function keepInView() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 160 || vh < 160) return false;               // collapsed/hidden viewport: hold still
    if (!state.x || !isFinite(state.x) || !isFinite(state.y)) { state.x = vw - 140; state.y = vh - 40; }
    state.x = clamp(state.x, 24, vw - 24);
    state.y = clamp(state.y, 130, vh - 6);
    return true;
  }
  keepInView();

  var mouse = null, moving = false, dir = 1, sd = 1, kd = 1, yaw = -0.45, walkPhase = 0, t = 0, last = 0;
  var current = null, poof = 0, boxX = 0, boxY = 0, tp = 0, still = 0, arriveT = 0, podSide = 1, leaveT = 0;
  function ramp(a, b, x) { return x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a); }
  function ease(k) { return k * k * (3 - 2 * k); }

  function activityIndex() {
    var i = 0;
    for (var k = 0; k < ACTIVITIES.length; k++) if (state.elapsed >= ACTIVITIES[k].at) i = k;
    return i;
  }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function pose() {
    var blink = (t % 3.7) < 0.13;
    return { x: 0, y: 0, rx: 0, rz: 0, yaw: yaw, gaze: yaw < 0 ? -1 : 1,
      head: [0, 0, 0], aA: [0, 0, -0.12], aB: [0, 0, 0.12], lA: [0, 0, 0], lB: [0, 0, 0],
      face: blink ? 'blink' : 'smile', phones: false };
  }
  function walkCycle(p, amount) { walkAt(p, walkPhase, amount); }
  function walkAt(p, phase, amount) {
    var s = Math.sin(phase) * amount;
    p.lA[0] = 0.75 * s; p.lB[0] = -0.75 * s; p.aA[0] = -0.6 * s; p.aB[0] = 0.6 * s;
    p.y += Math.abs(Math.cos(phase)) * 1.2 * amount;
  }
  function lookAtCursor(p) {
    if (!mouse) return;
    var look = clamp((mouse.x - state.x) / 150, -1.1, 1.1);
    if (Math.abs(look) < 0.5) look = look < 0 ? -0.5 : 0.5;
    p.head[1] = clamp(look - p.yaw, -0.6, 0.6);
    p.gaze = look < 0 ? -1 : 1;
    p.head[0] = clamp((mouse.y - (state.y - 87)) / 360, -0.12, 0.12);
  }
  // snap the root to whole pixels so textures don't crawl on sub-pixel motion
  function rootOf(p) { return child(WORLD, Math.round(p.x), Math.round(p.y * CP) / CP, 0, p.rx, p.yaw, p.rz); }

  // ---------- activities (props and scenes at 1.4x) ----------
  function drawWalk() {
    var p = pose();
    if (moving) walkCycle(p, 1); else { lookAtCursor(p); p.breath = (Math.floor(t / 1.3) % 2) / CP; }  // 1 px breath
    shadow(0, 10, 2);
    hendrik(rootOf(p), p);
    finish();
  }

  function podcastSolo() {
    var p = pose();
    p.phones = true;
    var talking = ((tp / 2.4) | 0) % 3 !== 2;
    if (talking && ((tp * 7) | 0) % 3 !== 0) p.face = 'talk';
    if (moving) walkCycle(p, 1);                               // on the move, the headphones say podcast
    else {
      p.head[0] = 0.05 + (p.face === 'talk' ? 0.04 : 0);        // nods with his words
      p.aA = [-0.5, 0, -1.05 - 0.3 * Math.sin(tp * 3.1)];        // talking with his free hand
    }
    shadow(2, 12, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    if (!moving) {                                             // mic on a stand beside his mouth
      KIND = 5;
      box(root, 11, 0, -1.4, 18, 1.4, 5.6, 'M');
      box(root, 13.8, 1.4, 1.4, 15.2, 19, 2.8, { all: 'K', f: 'Z' });
      box(root, 8.6, 19, 1.4, 15.2, 20.4, 2.8, 'K');
      box(root, 8.6, 19, 2.8, 10, 20.4, 6.6, 'K');
      box(root, 6.4, 20.4, 5.4, 10.6, 27, 9.6, { all: 'K', f: ['ZZZZ', 'KZKZ', 'ZKZK', 'KZKZ', 'MMMM', 'MMMM'], t: 'Z', d: 'M' });
      KIND = 1;
    }
    finish();
    if (talking && !moving) {                                  // voice on his free side
      var c = project(toWorld(parts.head, [-3.5, 2.5, 6]));
      for (var i = 0; i < 2; i++) {
        var ph = (t * 1.6 + i / 2) % 1;
        glyph(WAVE_L, c.x - 6 - ph * 11, c.y - 4 - ph * 4, OV.peach, 1 - ph);
      }
    }
  }

  function drawSurf(dt) {
    sd += (dir - sd) * (1 - Math.exp(-dt * 5));
    var swell = Math.sin(tp * 2.6) * 1.2;
    var p = pose();
    p.yaw = 0; p.y = 6 + swell + 0.6; p.rx = 0.22; p.rz = -sd * 0.14;
    p.lA = [0.06, 0, -0.45]; p.lB = [-0.06, 0, 0.45];
    var fwd = sd > 0 ? 'aB' : 'aA', back = sd > 0 ? 'aA' : 'aB';
    p[fwd] = [-0.35, 0, dir * (1.05 + 0.1 * Math.sin(tp * 2))];  // front arm low and forward
    p[back] = [0.25, 0, -dir * (2.2 + 0.1 * Math.sin(tp * 2 + 1))]; // back arm up behind
    p.head[1] = sd * 0.75; p.gaze = sd;
    var root = rootOf(p);
    KIND = 5;
    box(root, -15.4, -1.4, -4.4, 15.4, 0, 4.4, { all: 'C', t: function (u, v) { return v > 0.42 && v < 0.58 ? 'L' : 'C'; } }, 'board');
    box(root, 15.4, -1.4, -2.8, 18.2, 0, 2.8, 'C', 'board');
    KIND = 1;
    hendrik(root, p);
    // a small oval patch of sea that rises into a breaking wave behind him
    KIND = 7;
    for (var xi = -30; xi < 30; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 30, 2)));
      var d = -xi * sd;
      var crest = d > 7 ? Math.min(18, (d - 7) * 1.6) * e * (0.92 + 0.08 * Math.sin(t * 3)) : 0;
      var h = (3.4 + 1.1 * Math.sin(xi / 5.6 + t * 4)) * e * (Math.abs(xi + 1) < 17 ? 0.55 : 1) + crest;
      box(WORLD, xi, -2, -9.8 * e, xi + 2, h, 1.4 + 4.2 * e + crest * 0.3,
        { all: 'B', t: crest > 12 ? 'f' : 'a', f: function (u, v) { return v < 0.12 ? 'a' : 'B'; } }, 'sea');
      if (crest > 9.8) box(WORLD, sd > 0 ? xi + 2 : xi - 5.6, h - 2.8, -7 * e, sd > 0 ? xi + 7.6 : xi, h + 0.8, 0.7, { all: 'f', d: 'B' }, 'sea');
    }
    KIND = 1;
    finish();
    for (var s2 = 0; s2 < 6; s2++) {                            // spray: short dashes trailing him
      var sp = (t * 1.4 + s2 / 6) % 1, sx = OX - dir * (14 + s2 * 2) - dir * sp * 6, sy = OY - 17 - sp * 8 + (s2 % 2) * 3;
      dot(sx, sy, OV.foam, 1 - sp); dot(sx - dir, sy, OV.foam, (1 - sp) * 0.6);
    }
  }

  function drawSax() {
    var p = pose();
    if (moving) { walkCycle(p, 1); p[dir > 0 ? 'aB' : 'aA'] = [-0.5, 0, dir * 0.12]; }   // one hand carries it
    else {
      p.rx = -0.1; p.rz = 0.07 * Math.sin(tp * 2.8); p.y = -0.5 * Math.abs(Math.sin(tp * 2.8)); p.head[0] = 0.12;
      p.aA = [-1.0, 0, 0.85]; p.aB = [-0.65, 0, -0.41];
    }
    shadow(1, 11, 2);
    var root = rootOf(p);
    hendrik(root, p);
    // a tilted alto: neck at his mouth, body down to the hip, bell flaring out;
    // on the walk it hangs at his leading side, bell turned away from him
    var sax = moving ? child(root, dir * 5.4, 14, 5.2, 0, dir > 0 ? 0 : Math.PI, 0.45) : child(root, 1.6, 15, 6.4, 0, 0, 0.32);
    box(sax, -0.9, -7, -0.9, 0.9, 7, 0.9, { all: 'Y', f: ['YY', 'yY', 'YY', 'Yy', 'YY', 'yY', 'YY', 'Yy', 'YY', 'YY'] }, 'sax');  // body, keys
    box(sax, -0.9, -9.2, -0.9, 6, -7, 0.9, 'y', 'sax');          // U-bend at the hip
    box(sax, 4.4, -7, -1, 6.6, -1, 1, 'Y', 'sax');                // up to the bell
    box(sax, 3, -1, -2.4, 8.6, 1.2, 2.4, { all: 'Y', f: 'y', t: ['YYYYYY', 'YjjjjY', 'YjjjjY', 'YjjjjY', 'YYYYYY'] }, 'sax'); // flared bell, dark mouth
    box(sax, -0.7, 7, -0.7, 0.7, 9.8, 0.7, 'Y', 'sax');           // neck
    if (!moving) box(root, -2, 23.6, 5.4, -0.4, 25, 7.8, 'M');     // mouthpiece at his lips
    finish();
    if (!moving) {
      var b = project(toWorld(sax, [5.1, 1.2, 0]));
      for (var n = 0; n < 3; n++) {
        var ph = (t * 0.55 + n / 3) % 1;
        glyph(n === 1 ? NOTE2 : NOTE, b.x + 3 + n * 4 + Math.sin(ph * 6 + n) * 3, b.y - 7 - ph * 22, n === 1 ? OV.peach : OV.ink, 1 - ph);
      }
    }
  }

  // ---------- shared scene props: they grow up out of the floor and sink back ----------
  function scaledY(x, z, g) { return { m: [1, 0, 0, 0, g, 0, 0, 0, 1], t: [x, 0, z] }; }
  function door(cx, cz, open, g) {
    if (g <= 0.02) return;
    var prev = KIND; KIND = 5;
    var d = scaledY(cx, cz, g);
    box(d, -10, 0, -1.4, -8, 47, 1.4, { all: 'R', t: 'T' }, 'door');
    box(d, 8, 0, -1.4, 10, 47, 1.4, { all: 'R', t: 'T' }, 'door');
    box(d, -10, 45, -1.4, 10, 48.4, 1.4, { all: 'R', t: 'T' }, 'door');
    box(d, -8, 0, -1.2, 8, 45, -0.8, 'X', 'doorway');           // the dark inside
    var leaf = child(d, -8, 0, -1.4, 0, open, 0);                  // swings inward, into the dark
    box(leaf, 0, 0.2, 0.2, 16, 44.8, 1.4, { all: 'V', f: DOOR_F, b: DOOR_F }, 'leaf');
    box(leaf, 13, 21, 1.4, 14.4, 22.6, 2.6, 'Y', 'knob');
    KIND = prev;
  }
  function chair(cx, cz, cyaw, g, back) {
    if (g <= 0.02) return;
    var prev = KIND; KIND = 5;
    var c = child(scaledY(cx, cz, g), 0, 0, 0, 0, cyaw, 0), id = 'chair' + cx;
    box(c, -6.4, 4.6, -5.6, 6.4, 6, 5, { all: 'R', t: 'T' }, id);
    box(c, -6.4, 6, -6.8, 6.4, back || 19, -5.6, { all: 'R', f: 'r' }, id);
    box(c, -6, 0, -6.4, -4.8, 4.6, -5.2, 'r'); box(c, 4.8, 0, -6.4, 6, 4.6, -5.2, 'r');
    box(c, -6, 0, 3.6, -4.8, 4.6, 4.8, 'r'); box(c, 4.8, 0, 3.6, 6, 4.6, 4.8, 'r');
    KIND = prev;
  }
  // sitting: thighs forward onto a seat 6 voxels high, hands on his knees
  function seat(p, k) {
    if (k <= 0) return;
    p.lA = [-1.3 * k, 0, -0.08 * k]; p.lB = [-1.3 * k, 0, 0.08 * k];
    p.aA = [-0.85 * k, 0, -0.12]; p.aB = [-0.85 * k, 0, 0.12];
    p.y = -2.5 * k;
  }

  // ---------- arrival: a door grows, opens, he steps out, it closes and sinks ----------
  function drawArrival(at) {
    var g = ease(ramp(0, 0.45, at)) * (1 - ease(ramp(2.85, 3.25, at)));
    var open = 1.45 * (ease(ramp(0.5, 0.95, at)) - ease(ramp(2.3, 2.75, at)));
    var w = ramp(1.0, 2.2, at), z = -7 + 8 * w;
    var p = pose(); p.yaw = 0;
    if (w > 0 && w < 1) walkAt(p, at * 9, 1);
    if (z > -2) shadow(0, 10, 2);
    door(0, -1.5, open, g);
    if (at > 0.95) hendrik(child(WORLD, 0, Math.round(p.y * CP) / CP, z, 0, 0, 0), p);
    finish();
  }

  // ---------- going home: a wave, a door, he walks in, the door sinks away ----------
  function drawDepart(lt) {
    var g = ease(ramp(0, 0.45, lt)) * (1 - ease(ramp(2.95, 3.35, lt)));
    var open = 1.45 * (ease(ramp(0.5, 0.95, lt)) - ease(ramp(2.4, 2.85, lt)));
    var turn = ease(ramp(0.7, 1.15, lt)), w = ramp(1.15, 2.35, lt), z = 1 - 9 * w;
    var p = pose();
    p.yaw = yaw + ((yaw >= 0 ? Math.PI : -Math.PI) - yaw) * turn;
    if (lt < 0.8) { p.face = 'smile'; p.aB = [-0.2, 0, 2.5 + 0.35 * Math.sin(lt * 16)]; }   // waves goodbye
    if (w > 0 && w < 1) walkAt(p, lt * 9, 1);
    if (z > -2) shadow(0, 10, 2);
    door(0, -1.5, open, g);
    if (w < 1) hendrik(child(WORLD, 0, Math.round(p.y * CP) / CP, z, 0, p.yaw, 0), p);
    finish();
  }

  // ---------- podcast: when the cursor rests, two chairs appear and guests from The Merge take turns ----------
  // Each guest gets a slot: out of the ON AIR door and into the chair (ENTER), a conversation (TALK),
  // a wave and back out through the door (EXIT), and a moment with the light off (GAP). Who comes on
  // is decided per slot (nextGuest); without guests (no file, a model-review card) Henni records solo.
  var G_START = 1.35, ENTER = 2.1, TALK = 13, EXIT = 2.7, GAP = 1.0, CYC = ENTER + TALK + EXIT + GAP, SEEN_AT = ENTER + 5;
  var pod = { ids: [], cur: null, curLt: 0 }, gLo = 0, gHi = 0, gNow = null, tagReq = null;
  function guestPose(lt, s, GX, DX) {
    if (lt < 0 || lt >= ENTER + TALK + 2.4) return null;
    var p = pose(); p.phones = true; p.guest = true; p.torso = GTORSO;
    p.face = ((t + 1.7) % 4.1) < 0.13 ? 'blink' : 'smile';
    var x = DX, z = -20, ex = lt - ENTER - TALK;
    if (lt < 0.85) { z = -20 + 22 * ramp(0, 0.85, lt); p.yaw = 0; walkAt(p, lt * 9, 1); }        // out of the wall door
    else if (lt < 1.6) { z = 2; x = DX + (GX - DX) * ramp(0.85, 1.6, lt); p.yaw = -s * Math.PI / 2; walkAt(p, lt * 9, 1); }
    else if (ex < 0) {
      var k = ease(ramp(1.6, 2.1, lt));
      x = GX; z = 2 - 2 * k;
      p.yaw = -s * Math.PI / 2 + s * (Math.PI / 2 - 0.6) * k;
      seat(p, k);
    } else if (ex < 0.8) {                                             // stands up, waving goodbye
      var u = 1 - ease(ramp(0, 0.4, ex)), wv = 2.5 + 0.35 * Math.sin(ex * 16);
      x = GX; z = 2 - 2 * u;
      p.yaw = -s * 0.6;                                              // still turned to Henni, waving with the outer arm
      seat(p, u);
      p.face = 'smile';
      if (s > 0) { p.aB = [-0.2, 0, wv]; p.aA = [0, 0, -0.12]; } else { p.aA = [-0.2, 0, -wv]; p.aB = [0, 0, 0.12]; }
    } else if (ex < 1.55) { z = 2; x = GX + (DX - GX) * ramp(0.8, 1.55, ex); p.yaw = s * Math.PI / 2; walkAt(p, ex * 9, 1); }
    else { z = 2 - 22 * ramp(1.55, 2.4, ex); p.yaw = Math.PI; walkAt(p, ex * 9, 1); }      // back into the doorway
    return { p: p, x: x, z: z };
  }
  function doorOpen(lt, next) {
    var o = ease(ramp(-0.35, 0.05, lt)) - ease(ramp(2.05, 2.45, lt));
    o += ease(ramp(ENTER + TALK + 0.5, ENTER + TALK + 0.9, lt)) - ease(ramp(ENTER + TALK + 2.3, ENTER + TALK + 2.7, lt));
    if (next) o += ease(ramp(CYC - 0.35, CYC + 0.05, lt));
    return 1.45 * o;
  }
  var GUESTS_V = 1, guestsAsked = false, PET_SRC = '';
  try { PET_SRC = (document.currentScript && document.currentScript.src) || ''; } catch (e) { /* no script url */ }
  function loadGuests() {                                         // pet-guests.js, next to this script
    if (guestsAsked) return;
    guestsAsked = true;
    if (window.ktPetGuests || !PET_SRC) return;
    var sc = document.createElement('script');
    sc.src = PET_SRC.replace(/[^\/?#]+\.js(?:[?#].*)?$/, 'pet-guests.js?v=' + GUESTS_V);
    sc.async = true;
    (document.head || document.body).appendChild(sc);
  }
  function guestCat() { var G = window.ktPetGuests; return G && G.catalogue && G.looks ? G.catalogue : null; }
  function guestOf(id) { var c = guestCat(); if (!c) return null; for (var i = 0; i < c.guests.length; i++) if (c.guests[i].id === id) return c.guests[i]; return null; }
  // the next guest: one asked for (a resting podcast card, then one cut off last time, then this page's),
  // then Jev's ranking while it is fresh, then newest first; nobody twice in a visit until all have been on
  function lineupNext(live, skip, firsts, probs) {
    var i, best = null, bp = -1;
    for (i = 0; i < firsts.length; i++) if (firsts[i] && live.indexOf(firsts[i]) >= 0 && skip.indexOf(firsts[i]) < 0) return firsts[i];
    if (probs) for (var id in probs) if (live.indexOf(id) >= 0 && skip.indexOf(id) < 0 && probs[id] > bp) { best = id; bp = probs[id]; }
    if (best) return best;
    for (i = 0; i < live.length; i++) if (skip.indexOf(live[i]) < 0) return live[i];
    return null;
  }
  function nextGuest() {
    var cat = guestCat();
    if (!cat) return null;
    var card = studioCard && cat.episodes[studioCard];
    if (studioCard && !(card && card.guest)) return null;           // a model review: Henni records solo
    var live = [], i, g;
    for (i = 0; i < cat.guests.length; i++) { g = cat.guests[i]; if (g.live && registerGuest(g.id)) live.push(g.id); }
    var seen = state.seen || (state.seen = []), skip = pod.ids.filter(Boolean);
    if (!live.filter(function (id) { return seen.indexOf(id) < 0 && skip.indexOf(id) < 0; }).length) seen.length = 0;  // everyone's been on
    var pageGuest = null;
    for (i = 0; i < cat.guests.length; i++) if (cat.guests[i].pages.indexOf(PATH) >= 0) pageGuest = cat.guests[i].id;
    if (card && !pod.ids.length) return live.indexOf(card.guest) >= 0 ? card.guest : null;   // the card's guest, even if seen
    var fresh = jev && jev.guests && t - jevAt <= JEV_FRESH && !(jev.guest_fits != null && jev.guest_fits < 0.3) ? jev.guests : null;   // nobody fits: newest first
    return lineupNext(live, seen.concat(skip), [state.podNext, pageGuest], fresh);
  }
  // a slot is decided once the guests' file is here: a slot already under way by then stays empty (false),
  // so nobody pops in mid-scene; no guest starts without time for a whole visit before the scene ends
  function podGuest(k, lt) {
    if (pod.ids[k] === undefined) {
      if (!guestCat()) return null;
      var left = ACTIVITIES[podIdx() + 1].at - state.elapsed + G_START + k * CYC - (still - 0.35);
      if (lt > 0.05) pod.ids[k] = false;
      else if (k > 0 && pod.ids[k - 1] === null) pod.ids[k] = null;
      else if (!studioCard && left < CYC - GAP) pod.ids[k] = null;
      else pod.ids[k] = nextGuest();
    }
    return pod.ids[k];
  }
  function podIdx() { for (var i = 0; i < ACTIVITIES.length; i++) if (ACTIVITIES[i].id === 'podcast') return i; return 0; }
  // the studio folds away (he walked off, or the scene ended): a guest who hadn't settled in comes first next time
  function foldStudio() {
    if (pod.cur && pod.curLt < SEEN_AT) state.podNext = pod.cur;
    pod = { ids: [], cur: null, curLt: 0 }; gNow = null;
  }
  function episodeFor(g) { return studioCard && g.episodes.indexOf(studioCard) >= 0 ? studioCard : g.episodes[0]; }
  // the studio, no walls: ON AIR light on top of the guest's door, THE MERGE on the desk front,
  // a camera on a tripod in the front corner
  function studio(s, g, DX, live) {
    var w = scaledY(0, 0, g);
    KIND = 5;
    box(w, DX - 12, 48.4, -17.4, DX + 12, 55, -16.2, { all: 'M', f: live ? 'L' : 'r' }, 'onair');
    var cam = child(scaledY(-s * 22, 13, g), 0, 0, 0, 0, Math.atan2(s * 36, -13), 0);
    box(cam, -0.4, 0, -3, 0.4, 15, -2.2, 'M', 'tripod'); box(cam, -3, 0, 1.6, -2.2, 15, 2.4, 'M', 'tripod'); box(cam, 2.2, 0, 1.6, 3, 15, 2.4, 'M', 'tripod');
    box(cam, -3, 15, -4, 3, 20, 4, { all: 'M', t: 'K' }, 'cam');
    box(cam, -1.6, 15.8, 4, 1.6, 19.2, 7, { all: 'K', f: 'X' }, 'cam');
    box(cam, 1.4, 20, -3, 2.6, 21.2, -1.8, live && ((t * 2) | 0) % 2 ? 'L' : 'r', 'tally');
    KIND = 1;
  }
  function studioText(s, DX, live, g) {
    if (g < 0.99) return;
    var a = project([s * 14 - 26, 7.4, 14.5]), b = project([DX - 12, 55, -16.2]);
    txt('THE MERGE', Math.round(a.x) + 8, Math.round(a.y) + 1, OV.ink);
    txt('ON AIR', Math.round(b.x) + 1, Math.round(b.y) + 1, live ? OV.ink : C_DIM);
  }
  function drawPodcast() {
    if (moving || still < 0.35) {
      if (pod.ids.length || pod.opened) foldStudio();
      podSide = state.x + 260 > window.innerWidth ? -1 : 1; return podcastSolo();
    }
    var ps = still - 0.35, s = podSide, GX = s * 34, DX = s * 50;            // far enough apart to tell them apart
    if (!pod.ids.length && !pod.opened) {                         // the studio just opened: make sure Jev's answer is fresh
      pod.opened = true;
      if (JEV_URL && !jevBusy && (!jev || t - jevAt > JEV_FRESH)) askJev();
    }
    var g = ease(ramp(0, 0.5, ps)), sit = ease(ramp(0.4, 0.9, ps));
    var gt = ps - G_START, k = Math.max(0, Math.floor(gt / CYC)), lt = gt - k * CYC;
    var gid = gt >= -0.4 ? podGuest(k, lt) : null, look = gid && registerGuest(gid), guest = look && guestOf(gid);
    if (!guest) gid = null;
    var nextOn = gid && lt > CYC - 0.4 ? !!podGuest(k + 1, lt - CYC) : false;
    var dop = gid ? doorOpen(lt, nextOn) : 0;
    var talkT = lt - ENTER - 0.15, onAir = gid ? talkT >= 0 && lt < ENTER + TALK : ps > 3.6;
    var live = onAir, speaker = !onAir ? -1 : gid ? ((talkT / 2.6) | 0) % 2 : 0, flick = ((tp * 7) | 0) % 3 !== 0;
    if (gid) {
      pod.cur = gid; pod.curLt = lt;
      if (lt >= SEEN_AT && !pod.counted) {
        pod.counted = gid;
        var seen = state.seen || (state.seen = []);
        if (seen.indexOf(gid) < 0) seen.push(gid);
        if (state.podNext === gid) state.podNext = null;
      }
    } else if (pod.cur && lt >= 0) pod.cur = null;
    if (pod.counted && pod.counted !== gid) pod.counted = null;
    var p = pose(); p.phones = true;
    p.yaw = yaw + (s * 0.6 - yaw) * sit;
    p.x = -s * 5 * sit;                                           // scoots over as he sits
    seat(p, sit);
    if (speaker === 0) { if (flick) p.face = 'talk'; p.aA = [-1.1, 0, -0.5 - 0.3 * Math.sin(tp * 3.1)]; }
    shadow(Math.round(p.x), 12, 2);
    if (g > 0.02) studio(s, g, DX, live);
    if (g > 0.02) door(DX, -17, dop, g);
    chair(-s * 5, 0, s * 0.6, g);
    var hp = hendrik(rootOf(p), p);
    chair(GX, 0, -s * 0.6, g);
    var gq = gid ? guestPose(lt, s, GX, DX) : null, gh = null;
    gLo = gHi = 0; gNow = null; tagReq = null;
    if (gq) {
      try {
        gq.p.look = look;
        if (speaker === 1) {
          if (flick) gq.p.face = 'talk';
          if (look.gesture) look.gesture(gq.p, tp); else gq.p.aB = [-1.1, 0, 0.5 + 0.3 * Math.sin(tp * 3.3)];
        }
        shadow(Math.round(gq.x), 9, 2);
        groups = {}; gLo = nextPart + 1;                          // the guest's own parts, for clicks and the tag
        gh = asLook(look, function () { return hendrik(child(WORLD, Math.round(gq.x), Math.round(gq.p.y * CP) / CP, gq.z, 0, gq.p.yaw, 0), gq.p); });
        gHi = nextPart;
      } catch (e) { LOOKS[gid] = false; gq = gh = null; gLo = gHi = 0; }   // a broken look: that guest stays out
    }
    if (gq) {
      var ep = episodeFor(guest);
      gNow = { id: gid, name: guest.name, ep: ep };
      if (lt >= ENTER - 0.3 && lt < ENTER + 2) tagReq = guest.name + ' · ' + ((guestCat().episodes[ep] || {}).tag || '');
    }
    if (g > 0.05) {                                               // the table: mugs and a boom mic for each
      KIND = 5;
      var tb = scaledY(s * 14, 6, g);
      box(tb, -26, 0, -3, 26, 9, 8.5, { all: 'R', t: 'T' }, 'table');   // deep enough to hide their feet
      box(tb, -1.2, 9, -2.6, 1.2, 11.6, -0.2, { all: 'C', t: 'A' }, 'mug0');
      box(tb, 2.8, 9, -2.2, 5.2, 11.6, 0.2, { all: 'C', t: 'A' }, 'mug1');
      if (sit > 0.6) for (var i = 0; i < 2; i++) {
        var mx = s * (i ? 27 : 2);
        box(WORLD, mx - 0.6, 9, 6, mx + 0.6, 19, 7.2, 'K', 'mic' + i);
        box(WORLD, mx - 1.8, 18.5, 5, mx + 1.8, 24.5, 8.2, { all: 'M', f: ['MMM', 'MKM', 'LLL', 'MMM'], t: 'K' }, 'mic' + i);
      }
      KIND = 1;
    }
    finish();
    if (tagReq) {                                                 // the tag sits over the guest's highest pixel
      for (var ty = 0; ty < H && tagReq; ty++) for (var tx = 0; tx < W; tx++) {
        var pi = ty * W + tx;
        if (kind[pi] === 1 && part[pi] >= gLo && part[pi] <= gHi) { tagAt = [tx, ty]; ty = H; break; }
      }
    }
    studioText(s, DX, live, g);
    if (speaker >= 0) {                                           // voice on the speaker's outer side
      var who = speaker ? gh : hp, out = speaker ? s : -s;
      if (who) {
        var c = project(toWorld(who.head, [out * 3.5, 2.5, 6]));
        for (var k = 0; k < 2; k++) {
          var ph = (t * 1.6 + k / 2) % 1;
          glyph(out < 0 ? WAVE_L : WAVE, c.x + out * (6 + ph * 11) - (out < 0 ? 3 : 0), c.y - 4 - ph * 4, OV.peach, 1 - ph);
        }
      }
    }
  }

  // ---------- cocktails: a martini, an old fashioned, a cuba libre — made, garnished, served ----------
  function shakerAt(xf) {
    box(xf, -2, -7, -2, 2, 0.6, 2, { all: 'K', l: 'Z', t: 'Z', f: ['KZZK', 'KZZK', 'MMMM', 'KZZK', 'KZZK', 'KZZK'] }, 'shaker');
    box(xf, -1.4, -9, -1.4, 1.4, -7, 1.4, 'Z', 'shaker');
    box(xf, -0.7, -10.2, -0.7, 0.7, -9, 0.7, 'K', 'shaker');
  }
  function bottleAt(xf, body, label) {                          // hangs from his hand, neck (and pour) at the bottom
    box(xf, -1.6, -6.6, -1.6, 1.6, 0.4, 1.6, { all: body, f: ['QQQQ'.replace(/Q/g, body), label, label, 'QQQQ'.replace(/Q/g, body)] }, 'bottle');
    box(xf, -0.7, -9.4, -0.7, 0.7, -6.6, 0.7, body, 'bottle');
    box(xf, -0.8, -10.2, -0.8, 0.8, -9.4, 0.8, 'K', 'bottle');
  }
  var BAR_YAW = -0.3;
  function bar() {                                              // just the counter, long enough to hold every glass
    var bx = child(WORLD, 0, 0, 0, 0, BAR_YAW, 0);
    box(bx, -23, 0, 4.8, 31, 12.6, 12, { all: 'R', f: function (u, v) { return v > 0.12 && v < 0.22 ? 'L' : v > 0.86 ? 'r' : 'R'; } });
    box(bx, -24.4, 12.6, 3.6, 32.4, 14.2, 13.4, 'T');                 // runs on past the glasses
    box(bx, -21.6, 2, 12, 29.6, 3.2, 13.4, 'y');
  }
  // world z of the counter top at world x, lz deep into it (the counter is turned by BAR_YAW)
  function onCounter(x, lz) {
    var sy = Math.sin(BAR_YAW), cy = Math.cos(BAR_YAW), lx = (x - sy * lz) / cy;
    return -sy * lx + cy * lz;
  }
  // ---- the drinks, drawn on the fine overlay (2 px per art px) so each glass reads at a glance ----
  // They stand in front of him, so unlike the screen text they may cover his pixels.
  var GLW = [206, 226, 240], GLR = [248, 251, 255], ICE = [236, 245, 252];
  var MART = [196, 222, 234], MART_L = [240, 248, 252], OLIVE = [124, 160, 42], OLIVE_D = [72, 100, 24], PIMENTO = [228, 62, 38];
  var AMB = [212, 124, 36], AMB_D = [156, 80, 22], AMB_L = [246, 184, 86], PEEL = [255, 152, 34], PEEL_D = [218, 96, 16];
  var COLA = [80, 41, 23], COLA_L = [140, 82, 46], FIZZ = [214, 168, 128], LIME = [120, 182, 40], LIME_L = [214, 240, 134];
  var SPOON = [178, 178, 192], STRAW = [255, 87, 10], STRAW_L = [255, 236, 224];
  function prow(x0, x1, y, c, a) { for (var x = x0; x < x1; x++) pdot(x, y, c, a); }
  function pline(x0, y0, x1, y1, c, a, w) {
    var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (var i = 0; i <= n; i++) for (var q = 0; q < (w || 1); q++) pdot(x0 + (x1 - x0) * i / n + q, y0 + (y1 - y0) * i / n, c, a);
  }
  function iceCube(x, y, s) {                                   // see-through, lit on its top and left edge
    for (var r = 0; r < s; r++) prow(x, x + s, y + r, ICE, 0.4);
    prow(x, x + s, y, ICE, 0.95);
    for (var r2 = 1; r2 < s; r2++) pdot(x, y + r2, ICE, 0.8);
  }
  // straight glass: the faint inside first, then (front) the walls, a highlight, the thick base and the rim
  function tumbler(cx, by, hw, h, front) {
    if (!front) { for (var y = by - h; y < by; y++) prow(cx - hw + 1, cx + hw - 1, y, GLW, 0.1); return; }
    for (var y2 = by - h; y2 < by; y2++) { pdot(cx - hw, y2, GLW, 0.85); pdot(cx + hw - 1, y2, GLW, 0.85); }
    for (var y3 = by - h + 2; y3 < by - 4; y3++) pdot(cx - hw + 2, y3, GLR, 0.35);
    prow(cx - hw + 1, cx + hw - 1, by - 2, GLW, 0.6);
    prow(cx - hw, cx + hw, by - 1, GLR, 0.85);
    prow(cx - hw, cx + hw, by - h, GLR, 0.95);
  }
  function drinkScene(d, cd, gx, gz) {
    var out = { stream: null, label: null };
    var slide = ease(ramp(7.3, 8.3, cd)), z = gz + slide * 3;   // slid across to the guest
    if (cd > 8.8) return out;
    out.label = cd > 7.0 ? DRINKS[d] : null;
    scrUsed = true;
    var P = project([gx, 14.2, z]), cx = Math.round(P.x * 2), by = Math.round(P.y * 2);
    if (d === 0) {                                              // martini: a V glass on a stem, olive on a pick
      var f = ramp(3.0, 4.6, cd), fl = Math.round(7 * f), b0 = by - 11, k, hw;
      for (k = 0; k < 9; k++) {
        hw = 1 + Math.round(k * 0.75);
        if (k < fl) prow(cx - hw, cx + hw, b0 - k, k === fl - 1 ? MART_L : MART, 0.9);
        else prow(cx - hw, cx + hw, b0 - k, GLW, 0.1);
      }
      if (cd > 5.0) {                                           // the olive drops in on its pick
        var dy = -Math.round(12 * (1 - ease(ramp(5.0, 5.6, cd))));
        pline(cx + 1, b0 - 3 + dy, cx + 6, b0 - 14 + dy, STRAW, 1);
        prow(cx - 1, cx + 2, b0 - 1 + dy, OLIVE_D, 1);
        prow(cx - 2, cx + 3, b0 - 2 + dy, OLIVE, 1); prow(cx - 2, cx + 3, b0 - 3 + dy, OLIVE, 1);
        prow(cx - 1, cx + 2, b0 - 4 + dy, OLIVE, 1);
        pdot(cx, b0 - 3 + dy, PIMENTO, 1); pdot(cx, b0 - 2 + dy, PIMENTO, 1);
      }
      for (k = 0; k < 9; k++) { hw = 1 + Math.round(k * 0.75); pdot(cx - hw - 1, b0 - k, GLW, 0.85); pdot(cx + hw, b0 - k, GLW, 0.85); }
      prow(cx - 8, cx + 8, b0 - 8, GLR, 0.95);                 // rim
      for (var y = b0 + 1; y < by - 2; y++) { pdot(cx - 1, y, GLW, 0.8); pdot(cx, y, GLR, 0.6); }   // stem
      prow(cx - 4, cx + 4, by - 2, GLW, 0.8); prow(cx - 6, cx + 6, by - 1, GLR, 0.85);           // foot
      if (cd > 3.0 && cd < 4.6) out.stream = [cx, b0 - Math.max(fl, 1)];
    } else if (d === 1) {                                       // old fashioned: rocks glass, big cube, whiskey, stir, peel
      var hw1 = 7, h1 = 12, f1 = ramp(1.5, 3.0, cd), rows = Math.round(7 * f1);
      tumbler(cx, by, hw1, h1, false);
      for (var r = 0; r < rows; r++) prow(cx - hw1 + 1, cx + hw1 - 1, by - 3 - r, r === rows - 1 ? AMB_L : r < 2 ? AMB_D : AMB, 0.92);
      if (cd > 0.5) iceCube(cx - 3, by - 9 - Math.round(14 * (1 - ease(ramp(0.5, 1.0, cd)))), 6);
      if (cd > 3.4 && cd < 5.6) {                               // the bar spoon goes round
        var sx = cx + Math.round(Math.cos(cd * 9) * 2);
        pline(sx, by - 4, sx + 1, by - 24, SPOON, 1); prow(sx, sx + 3, by - 25, SPOON, 1);
      }
      tumbler(cx, by, hw1, h1, true);
      if (cd > 5.4) {                                           // an orange peel twist on the rim
        var py = by - h1 - 1 - Math.round(8 * (1 - ease(ramp(5.4, 5.9, cd))));
        prow(cx + 2, cx + 7, py, PEEL, 1); prow(cx + 4, cx + 9, py + 1, PEEL_D, 1); pdot(cx + 8, py + 2, PEEL, 1);
      }
      if (cd > 1.5 && cd < 3.0) out.stream = [cx, by - 3 - Math.max(rows, 1)];
    } else {                                                    // cuba libre: highball, rum then cola, ice, fizz, lime, straw
      var hw2 = 5, h2 = 22, rum = ramp(1.7, 2.4, cd) * 0.25, cola = ramp(3.1, 4.8, cd) * 0.7;
      var rr = Math.round(18 * rum / 0.95), cr = Math.round(18 * (rum + cola) / 0.95) - rr, top = by - 3 - rr - cr;
      tumbler(cx, by, hw2, h2, false);
      for (var r1 = 0; r1 < rr; r1++) prow(cx - hw2 + 1, cx + hw2 - 1, by - 3 - r1, cr ? AMB_D : AMB, 0.92);
      for (var r2 = 0; r2 < cr; r2++) prow(cx - hw2 + 1, cx + hw2 - 1, by - 3 - rr - r2, r2 === cr - 1 ? COLA_L : COLA, 0.95);
      if (cd > 3.1 && cd < 7.2 && cr) for (var b = 0; b < 3; b++) {   // fizz rising
        var ph = (t * 1.3 + b / 3) % 1;
        pdot(cx - 2 + b * 2, by - 3 - ph * (by - 3 - top), FIZZ, 0.8 * (1 - ph));
      }
      for (var c = 0; c < 2; c++) if (cd > 0.5 + c * 0.3) {    // ice: dropped in, floats once there's a drink
        var rest = rr + cr > 4 ? top + c * 3 : by - 7 - c * 4;
        iceCube(cx - 4 + c * 4, rest - Math.round(18 * (1 - ease(ramp(0.5 + c * 0.3, 1.0 + c * 0.3, cd)))), 4);
      }
      tumbler(cx, by, hw2, h2, true);
      if (cd > 5.8) {                                           // a striped straw
        var sd = Math.round(10 * (1 - ease(ramp(5.8, 6.2, cd))));
        pline(cx - 1, by - 5 - sd, cx + 3, by - 31 - sd, STRAW, 1, 2);
        for (var st = 0; st < 3; st++) pdot(cx + 2, by - 24 - st * 2 - sd, STRAW_L, 0.9);
      }
      if (cd > 5.2) {                                           // a lime wedge on the rim
        var ly = by - h2 - 2 - Math.round(8 * (1 - ease(ramp(5.2, 5.7, cd))));
        prow(cx + 2, cx + 8, ly, LIME, 1); prow(cx + 2, cx + 8, ly + 1, LIME_L, 1); prow(cx + 3, cx + 7, ly + 2, LIME_L, 1); prow(cx + 4, cx + 6, ly + 3, LIME, 1);
      }
      if ((cd > 1.7 && cd < 2.4) || (cd > 3.1 && cd < 4.8)) out.stream = [cx, Math.min(top, by - 4)];
    }
    return out;
  }
  var DRINKS = ['MARTINI', 'OLD FASHIONED', 'CUBA LIBRE'], DRINK_T = 9.5;
  function drawCocktail() {
    var p = pose(), parts;
    if (moving) {                                               // carried upright at chest height on the walk
      var lead = dir > 0 ? 'aB' : 'aA';
      walkCycle(p, 1); p[lead] = [-1.3, 0, dir * 0.15];
      shadow(0, 10, 2);
      parts = hendrik(rootOf(p), p);
      shakerAt(child(parts[lead], 0, -11.6, 0, Math.PI + 1.3, 0, 0));
      finish();
      return;
    }
    var all = still % (DRINK_T * 3), d = Math.floor(all / DRINK_T), cd = all - d * DRINK_T;
    // what his right hand holds and how far it is tipped (0 upright … 1 pouring)
    var holding = null, tip = 0, shaking = false;
    if (d === 0) {
      if (cd > 0.5 && cd < 2.5) shaking = true;
      if (cd >= 2.5 && cd < 5.0) { holding = 'shaker'; tip = ease(ramp(2.5, 3.0, cd)) * (1 - ease(ramp(4.6, 5.0, cd))); }
    } else if (d === 1) {
      if (cd >= 1.0 && cd < 3.4) { holding = 'whiskey'; tip = ease(ramp(1.0, 1.5, cd)) * (1 - ease(ramp(3.0, 3.4, cd))); }
    } else {
      if (cd >= 1.3 && cd < 2.7) { holding = 'rum'; tip = ease(ramp(1.3, 1.7, cd)) * (1 - ease(ramp(2.4, 2.7, cd))); }
      if (cd >= 2.7 && cd < 5.2) { holding = 'cola'; tip = ease(ramp(2.7, 3.1, cd)) * (1 - ease(ramp(4.8, 5.2, cd))); }
    }
    var stirring = d === 1 && cd > 3.4 && cd < 5.6;
    var sh = shaking ? [0.3, 0, -0.3, 0][Math.round(tp * 10) % 4] : 0;
    p.yaw = 0.3;
    p.aB = shaking ? [-2.75 + sh, 0, 0.22] : holding ? [-2.25, 0, 0.75] : stirring ? [-1.3, 0, 0.75] : [-0.75, 0, 0.12];
    p.aA = cd > 7.0 && cd < 8.6 ? [-1.0, 0, -0.95] : [-0.75, 0, -0.12];  // presents the drink
    p.head[0] = 0.22; p.head[1] = 0.35; p.gaze = 1;
    if (shaking) p.head[1] = 0.1;
    shadow(0, 17, 2);
    var root = rootOf(p);
    parts = hendrik(root, p);
    // the glass stands where a tipped vessel in his raised hand pours
    var armUp = child(root, 7.7, 21, 0, -2.25, 0, 0.75), handUp = toWorld(armUp, [0, -11.6, 0]);
    var pourTip = [handUp[0] + 10.2 * Math.sin(0.45), handUp[1] - 10.2 * Math.cos(0.45), handUp[2]];
    var gx = clamp(pourTip[0], -11, 16), gz = onCounter(gx, 6.8);
    var vessel = null, tipW = null;
    if (shaking) shakerAt(child(parts.aB, 0, -11.6, 0, sh * 0.6, 0, 0));
    else if (holding) {
      var hand = toWorld(parts.aB, [0, -11.6, 0]);
      vessel = child(WORLD, hand[0], hand[1], hand[2], 0, 0, 0.45 + (1 - tip) * 1.2);
      if (holding === 'shaker') shakerAt(vessel);
      else if (holding === 'whiskey') bottleAt(vessel, 'Y', 'DDDD');
      else if (holding === 'rum') bottleAt(vessel, 'y', 'DDDD');
      else bottleAt(vessel, 'c', 'LLLL');
      tipW = toWorld(vessel, [0, -10.2, 0]);
    }
    KIND = 5;
    bar();
    var dr = drinkScene(d, cd, gx, gz);
    KIND = 1;
    finish();
    if (shaking && sh > 0) {
      var cc = project(toWorld(parts.aB, [0, -15, 0]));
      glyph(WAVE, cc.x + 5, cc.y - 3, OV.ink, 0.8);
    }
    if (dr.stream && tipW && tip > 0.9) {                        // the pour, on the fine layer with the glass
      var a = project(tipW), col = holding === 'cola' ? COLA_L : holding === 'shaker' ? [226, 236, 243] : AMB;
      pline(Math.round(a.x * 2), Math.round(a.y * 2), dr.stream[0], dr.stream[1], col, 0.95, 2);
    }
    if (dr.label) {                                             // the drink's name over the finished glass
      var fade = 1 - ramp(8.4, 8.8, cd);
      txt(dr.label, Math.round(OX - dr.label.length * 2), 6, OV.peach, fade);
    }
  }

  // ---------- coding: back to us, locked in, two big screens you can actually read ----------
  // 3x5 pixel font for the screens (caps only; '•' bullet, '✓' check, '█' cursor)
  var FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
    '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
    '9': '111101111001110', ' ': '000000000000000', '>': '100010001010100', '.': '000000000000010', '(': '001010010010001',
    ')': '100010010010100', '+': '000010111010000', '-': '000000111000000', '/': '001001010100100', '$': '011110010011110',
    ':': '000010000010000', '#': '101111101111101', '*': '000101010101000', '•': '000111111111000', '✓': '000000001101010', '█': '111111111111111',
    '!': '010010010000010', ',': '000000000010100',
    '%': '101001010100101', '\\': '100100010001001', '_': '000000000000111', '<': '001010100010001', '^': '010101000000000',
    '?': '110001010000010', "'": '010010000000000', '=': '000111000111000', '✗': '000101010101000'
  };
  function txt(str, x, y, c, a) {                               // drawn like the other overlays: never across his pixels
    for (var i = 0; i < str.length; i++) {
      var bits = FONT[str.charAt(i)] || FONT[' '];
      for (var r = 0; r < 5; r++) for (var q = 0; q < 3; q++) {
        if (bits.charAt(r * 3 + q) !== '1') continue;
        var gx = Math.round(x + i * 4 + q), gy = Math.round(y + r);
        if (gx >= 0 && gy >= 0 && gx < W && gy < H && kind[gy * W + gx] === 1) continue;
        dot(gx, gy, c, a === undefined ? 1 : a);
      }
    }
  }
  function txtLine(segs, x, y, upto) {                         // coloured segments, cut after 'upto' characters
    var n = 0;
    for (var i = 0; i < segs.length && n < upto; i++) {
      var s = segs[i][0].slice(0, upto - n);
      txt(s, x + n * 4, y, segs[i][1]);
      n += s.length;
    }
    return n;
  }
  var C_OR = rgb('#ff570a'), C_SOFT = rgb('#b3abc2'), C_DIM = rgb('#5e5672');
  // ---- the screens: four terminals drawn on the finer overlay canvas (2 px per art px) ----
  function sdot(x, y, c, a) {                                   // never across his pixels
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < SW2 && y < SH2 && kind[(y >> 1) * W + (x >> 1)] === 1) return;
    pdot(x, y, c, a);
  }
  function pdot(x, y, c, a) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= SW2 || y >= SH2 || a <= 0) return;
    var o = (y * SW2 + x) * 4, k = Math.min(1, a), ba = sbuf[o + 3] / 255, na = k + ba * (1 - k);
    sbuf[o] = (c[0] * k + sbuf[o] * ba * (1 - k)) / na;
    sbuf[o + 1] = (c[1] * k + sbuf[o + 1] * ba * (1 - k)) / na;
    sbuf[o + 2] = (c[2] * k + sbuf[o + 2] * ba * (1 - k)) / na;
    sbuf[o + 3] = na * 255;
  }
  function stxt(str, x, y, c, a) {
    for (var i = 0; i < str.length; i++) {
      var bits = FONT[str.charAt(i)] || FONT[' '];
      for (var r = 0; r < 5; r++) for (var q = 0; q < 3; q++) if (bits.charAt(r * 3 + q) === '1') sdot(x + i * 4 + q, y + r, c, a === undefined ? 1 : a);
    }
  }
  function sline(segs, x, y, upto) {
    var n = 0;
    for (var i = 0; i < segs.length && n < upto; i++) { var s = segs[i][0].slice(0, upto - n); stxt(s, x + n * 4, y, segs[i][1]); n += s.length; }
    return n;
  }
  // a script: lines of [text, colour] segments. '>' and '$' lines are typed; replies arrive after a beat;
  // '(' lines are ASCII art and drop in together; a number is a pause, { at: s } waits until s
  function script(lines, offset) {
    var at = offset || 0, T = [], L = [], art = false;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (typeof ln === 'number') { at += ln; continue; }
      if (!ln.length) { at = Math.max(at, ln.at); continue; }
      var len = 0; for (var j = 0; j < ln.length; j++) len += ln[j][0].length;
      var c0 = ln[0][0].charAt(0), typed = c0 === '>' || c0 === '$', isArt = c0 === '(';
      at += isArt && art ? 0.12 : typed ? 0.9 : 0.8;
      var cps = typed ? 11 : isArt ? 400 : 45;
      T.push({ at: at, len: len, cps: cps }); L.push(ln);
      at += len / cps; art = isArt;
    }
    return { lines: L, T: T, end: at + 3 };
  }
  function after(sc, i) { return sc.T[i].at + sc.T[i].len / sc.T[i].cps; }
  var INK = OV.ink, PE = OV.peach;
  // One story across the four panes: Claude Code builds the things this site actually has and opens
  // PR #128, CodeRabbit calls it slop, the force push bounces off the rabbit, Claude appeases it,
  // the rabbit caves, and it goes live on a Friday. Codex ships the features nobody asked for.
  var CLAUDE = script([
    [['> ', C_OR], ['MAKE THE TILES WAVE', INK]],
    [['• ', C_OR], ['EDIT HOME.JS ', C_SOFT], ['+212 ', PE], ['-3', C_DIM]],
    [['✓ ', PE], ['THE TILES WAVE NOW', INK]],
    [['> ', C_OR], ['DAMP IT 15% MORE', INK]],
    [['✓ ', PE], ['DAMPING = 0.956', INK]],
    [['> ', C_OR], ['TEACH HENNI A BACKFLIP', INK]],
    [['✓ ', PE], ['HE LANDED IT. MOSTLY', INK]],
    [['> ', C_OR], ['SHIP IT', INK]],
    [['• ', C_OR], ['GH PR CREATE #128', C_SOFT]],
    [['✓ ', PE], ['PR #128: ', INK], ['+9,412 LINES', PE]],
    { at: 23.5 },
    [['> ', C_OR], ['APPEASE THE RABBIT', INK]],
    [['✓ ', PE], ['FIXED 1 OF 2,345', INK]],
    [['> ', C_OR], ['MAKE HIM A MARTINI', INK]],
    [['✓ ', PE], ['SHAKEN, NOT TESTED', INK]]
  ]);
  var CODEX = script([
    [['> ', INK], ['ADD DARK MODE', INK]],
    [['✓ ', PE], ['IT WAS ALREADY DARK', C_SOFT]],
    [['> ', INK], ['MAKE IT POP', INK]],
    [['✓ ', PE], ['ADDED 14 GRADIENTS', C_SOFT]],
    [['> ', INK], ['FIX THE BUG', INK]],
    [['✓ ', PE], ['RENAMED IT A FEATURE', C_SOFT]],
    [['> ', INK], ['HENNI NEEDS A JOB', INK]],
    [['✓ ', PE], ['HENNI IS NOW A PM', C_SOFT]],
    [['> ', INK], ['MOBILE VERSION?', INK]],
    [['✓ ', PE], ['HENNI STAYS HOME', C_SOFT]],
    [['> ', INK], ['MAKE IT FASTER', INK]],
    [['✓ ', PE], ['DELETED THE TESTS', C_SOFT]],
    [['> ', INK], ['ADD AI', INK]],
    [['✓ ', PE], ['THE 404 HAS FEELINGS', C_SOFT]]
  ], 1.5);
  var RABBIT = script([
    [['REVIEWING PR #127...', C_SOFT]],
    { at: after(CLAUDE, 2) },
    [['! ', C_OR], ['HOME.JS: TOO MUCH WAVE', C_SOFT]],
    { at: after(CLAUDE, 4) },
    [['✓ ', PE], ['DAMPED. APPROVED.', PE]],
    { at: after(CLAUDE, 9) },
    [['REVIEWING PR #128...', C_SOFT]],
    [['(\\_/)  ', C_OR], ['2,345 BUGS FOUND', INK]],
    [['(O.O)  ', C_OR], ['THIS IS SLOP.', INK]],
    [['(> <)  ', C_OR], ["DON'T SHIP IT.", INK]],
    [['! ', C_OR], ['PET.JS: HE IS A PM NOW?', C_SOFT]],
    [['✗ ', C_OR], ['CHANGES REQUESTED', C_OR]],
    { at: after(CLAUDE, 11) },
    [['RE-REVIEWING PR #128...', C_SOFT]],
    [['(\\_/)  ', C_OR], ['2,344 BUGS LEFT', INK]],
    [['(-.-)  ', C_OR], ['...FINE.', INK]],
    [['(> <)  ', C_OR], ['SHIP IT. COWARD.', INK]],
    [['✓ ', PE], ['APPROVED (RELUCTANTLY)', PE]]
  ], 1.5);
  RABBIT.bot = true;                                            // a review bot: no blinking cursor
  var SHELL = script([
    [['$ ', C_DIM], ['NPM TEST', C_SOFT]],
    [['', INK]],
    1.6,                                                        // the bar needs time to fill
    [['  41 PASSED, 1 VIBED', PE]],
    { at: after(RABBIT, 8) + 0.3 },
    [['$ ', C_DIM], ['GIT PUSH --FORCE', C_SOFT]],
    [['  BLOCKED BY A RABBIT', C_OR]],
    { at: after(RABBIT, 13) },
    [['$ ', C_DIM], ['GIT PUSH', C_SOFT]],
    [['✓ ', PE], ['LIVE. ON A FRIDAY.', INK]]
  ], 2.2);
  var SCRIPTS = [CLAUDE, CODEX, RABBIT, SHELL], LOOP = 0;           // one loop, so the story restarts together
  SCRIPTS.forEach(function (sc) { LOOP = Math.max(LOOP, sc.end); });
  SCRIPTS.forEach(function (sc) { sc.end = LOOP; });
  // draw one pane: title bar + the last lines of its script at time ct; lines clip at the pane edge
  var LH = 7;
  function pane(sc, ct, x0, x1, y0, y1, title, tcol) {
    for (var xx = x0; xx < x1; xx++) sdot(xx, y0 + 7, C_DIM, 0.7);               // title rule
    stxt(title, x0 + 1, y0 + 1, tcol);
    var rows = Math.floor((y1 - y0 - 8) / LH), maxc = Math.floor((x1 - x0) / 4), t2 = ct % sc.end, shown = [], cur = -1;
    for (var i = 0; i < sc.lines.length; i++) {
      var T = sc.T[i];
      if (t2 < T.at) break;
      var n = Math.min(T.len, Math.floor((t2 - T.at) * T.cps));
      shown.push([i, n]);
      if (n < T.len) cur = shown.length - 1;
    }
    var first = Math.max(0, shown.length - (cur >= 0 || sc.bot ? rows : rows - 1)), lx = x0 + 1, ly = y0 + 10;   // idle: the cursor gets its own row
    for (var k = first; k < shown.length; k++) {
      var y = y0 + 10 + (k - first) * LH, li = shown[k][0];
      if (sc === SHELL && li === 1) {                           // the test run fills a bar
        var prog = clamp((t2 - sc.T[1].at) / 2.2, 0, 1), bw = x1 - x0 - 4;
        for (var b = 0; b < bw; b++) sdot(x0 + 2 + b, y + 2, b < bw * prog ? PE : C_DIM, 1);
        continue;
      }
      var w = sline(sc.lines[li], x0 + 1, y, Math.min(shown[k][1], maxc));
      lx = x0 + 1 + w * 4; ly = y;
    }
    if (sc.bot) return;
    if (cur >= 0) stxt('█', lx, ly, C_SOFT, 0.8);
    else if (((t * 2) | 0) % 2 === 0) stxt('█', x0 + 1, y0 + 10 + (shown.length - first) * LH, C_SOFT, 0.7);
  }
  var MON = [[-58, -2.6], [2.6, 58]], MON_Y0 = 28, MON_Y1 = 77, MON_Z = -12;
  function screens(ct, g) {
    if (g < 0.99) return;
    scrUsed = true;
    var top = Math.ceil((OY - (MON_Y1 * CP - MON_Z * SP)) * 2) + 2, bot = Math.floor((OY - (MON_Y0 * CP - MON_Z * SP)) * 2) - 2;
    var mid = top + Math.round((bot - top) * 0.55), rmid = top + Math.round((bot - top) * 0.62);   // the rabbit gets a taller pane
    var L0 = Math.ceil((OX + MON[0][0]) * 2) + 3, L1 = Math.floor((OX + MON[0][1]) * 2) - 3;
    var R0 = Math.ceil((OX + MON[1][0]) * 2) + 3, R1 = Math.floor((OX + MON[1][1]) * 2) - 3;
    pane(CLAUDE, ct, L0, L1, top, mid - 2, '* CLAUDE CODE', C_OR);
    pane(CODEX, ct, L0, L1 - 10, mid + 2, bot, 'CODEX', INK);             // the lower panes keep clear of his head
    pane(RABBIT, ct, R0, R1, top, rmid - 2, 'CODERABBIT REVIEW', C_OR);
    pane(SHELL, ct, R0 + 10, R1, rmid + 2, bot, 'TERMINAL', C_SOFT);
  }
  function drawCoding() {
    var p = pose();
    if (moving || still < 0.2) {
      if (moving) walkCycle(p, 1); else lookAtCursor(p);
      shadow(0, 10, 2);
      hendrik(rootOf(p), p);
      finish();
      return;
    }
    var cs = still - 0.2, g = ease(ramp(0, 0.5, cs)), sit = ease(ramp(0.5, 1.1, cs));
    var away = yaw >= 0 ? Math.PI : -Math.PI;                    // turns his back to us
    p.yaw = yaw + (away - yaw) * sit;
    seat(p, sit);
    if (sit > 0.95) {                                             // typing, head nodding along
      var ty2 = ((tp * 10) | 0) % 2;
      p.aA = [-1.3 - 0.1 * ty2, 0, 0.12]; p.aB = [-1.3 - 0.1 * (1 - ty2), 0, -0.12];
      p.head[0] = 0.06 + 0.04 * Math.sin(tp * 2);
    }
    shadow(0, 13, 2);
    chair(0, 0, away, g, 12);                                     // low back, so we see his
    hendrik(rootOf(p), p);
    if (g > 0.05) {
      KIND = 5;
      var d = scaledY(0, 0, g);
      box(d, -52, 12, -15, 52, 13.4, -4.6, { all: 'R', t: 'T' }, 'desk');                   // a long desk under the screens
      box(d, -51, 0, -14, -49.6, 12, -5.6, 'r'); box(d, 49.6, 0, -14, 51, 12, -5.6, 'r');
      box(d, 40, 13.4, -9, 43.4, 17.4, -5.6, { all: 'C', t: 'A' }, 'mug');
      box(d, -7, 13.4, -9, 7, 14, -6, { all: 'M', t: 'K' }, 'keyboard');
      for (var m = 0; m < 2; m++) {                                                          // two big screens on arms
        var x0 = MON[m][0], x1 = MON[m][1], cx = (x0 + x1) / 2;
        box(d, cx - 1, 13.4, -14, cx + 1, MON_Y0, -12.6, 'M', 'arm' + m);
        box(d, cx - 5, 13.4, -15, cx + 5, 14.2, -11, 'M', 'arm' + m);
        box(d, x0 - 1.2, MON_Y0 - 1.2, MON_Z - 1.4, x1 + 1.2, MON_Y1 + 1.2, MON_Z, { all: 'M', f: 'X' }, 'mon' + m);
      }
      KIND = 1;
    }
    finish();
    screens(Math.max(0, cs - 1.3), g);
  }

  // ---------- skiing: downhill, and while you move him he hits kickers and rails ----------
  // Every 3.6 s of skiing one feature scrolls in: a kicker for a trick (backflip, cork 720,
  // iron cross, misty 720) or a rail to slide. The trick's name shows after the landing.
  var skiPhase = 0, skiClock = 0, trickDir = 1;
  var TRICKS = ['BACKFLIP', 'CORK 720', 'RAIL SLIDE', 'IRON CROSS', 'MISTY 720'], TRICK_T = 3.6;
  function tree(x, z, h) {
    box(WORLD, x - 0.8, -1.2, z - 0.8, x + 0.8, 3, z + 0.8, 'r', 'tree' + x);
    box(WORLD, x - 4.5 * h, 3, z - 4.5 * h, x + 4.5 * h, 7, z + 4.5 * h, { all: 'k', t: 'f' }, 'tree' + x);
    box(WORLD, x - 3.2 * h, 7, z - 3.2 * h, x + 3.2 * h, 11, z + 3.2 * h, { all: 'k', t: 'f' }, 'tree' + x);
    box(WORLD, x - 1.8 * h, 11, z - 1.8 * h, x + 1.8 * h, 14.5, z + 1.8 * h, { all: 'k', t: 'f' }, 'tree' + x);
  }
  function kicker(kx, d) {                                      // stepped snow kicker, the lip toward his travel
    for (var i = 0; i < 4; i++) {
      var a = kx - d * (i + 1) * 3.2, b = kx - d * i * 3.2;
      box(WORLD, Math.min(a, b), -1.6, -5.5, Math.max(a, b), -1 + 1.7 * (4 - i), 5.5, { all: 'a', t: 'f' }, 'kicker');
    }
  }
  function rail(cx) {                                           // a 26-long rail on two posts
    box(WORLD, cx - 13, 5, -0.8, cx + 13, 6, 0.8, { all: 'K', t: 'Z' }, 'rail');
    box(WORLD, cx - 11.5, -1.5, -0.6, cx - 10.3, 5, 0.6, 'M', 'rail'); box(WORLD, cx + 10.3, -1.5, -0.6, cx + 11.5, 5, 0.6, 'M', 'rail');
  }
  function drawSki(dt) {
    sd += (dir - sd) * (1 - Math.exp(-dt * 5));
    var c0 = skiClock % TRICK_T, inTrick = c0 > 0.7 && c0 < 2.5;
    if (moving || inTrick) skiClock += dt;                      // a trick in the air always lands
    if (moving) skiPhase += dt * dir;
    var c = skiClock % TRICK_T, trick = TRICKS[Math.floor(skiClock / TRICK_T) % TRICKS.length];
    if (c < 0.1) trickDir = dir;
    var d = trickDir, going = moving || inTrick;
    var p = pose(), air = 0, sRx = 0, sRy = 0, tuck = 0, cross = 0, onRail = false;
    p.yaw = sd * 0.9; p.rx = 0.3; p.rz = moving ? Math.sin(tp * 3) * 0.08 : 0;
    p.aA = [-0.55, 0, -0.45]; p.aB = [-0.55, 0, 0.45];
    p.head[0] = -0.1;
    if (going) {
      if (trick === 'RAIL SLIDE') {
        if (c > 0.75 && c < 2.55) {
          onRail = true;
          air = c < 0.9 ? 7.2 * ease(ramp(0.75, 0.9, c)) + 3 * Math.sin(Math.PI * ramp(0.75, 0.9, c)) : c > 2.35 ? 7.2 * (1 - ease(ramp(2.35, 2.55, c))) + 3 * Math.sin(Math.PI * ramp(2.35, 2.55, c)) : 7.2;
          p.yaw = d * 0.9 - d * (Math.PI / 2) * ease(ramp(0.75, 0.95, c)) * (1 - ease(ramp(2.3, 2.5, c)));   // skis across the rail
          p.aA = [-0.2, 0, -1.4]; p.aB = [-0.2, 0, 1.4];        // arms out for balance
          p.rx = 0.15;
        }
      } else if (c > 0.9 && c < 2.1) {
        var k = ramp(0.9, 2.1, c), e = ease(k);
        air = 22 * Math.sin(Math.PI * k);
        tuck = Math.sin(Math.PI * k);
        if (trick === 'BACKFLIP') sRx = -2 * Math.PI * e;
        if (trick === 'CORK 720') { sRy = 4 * Math.PI * e * d; sRx = -0.9 * Math.sin(Math.PI * k); }
        if (trick === 'MISTY 720') { sRx = 2 * Math.PI * e; sRy = 4 * Math.PI * e * d; }
        if (trick === 'IRON CROSS') { cross = Math.sin(Math.PI * k); tuck *= 0.5; }
        p.aA = [-1.5 * tuck, 0, -0.45]; p.aB = [-1.5 * tuck, 0, 0.45];        // reach for a grab
        if (trick === 'IRON CROSS') { p.aA = [-0.4, 0, -1.2 * cross]; p.aB = [-0.4, 0, 1.2 * cross]; }
      } else if (c >= 2.1 && c < 2.4) p.y = -1.6 * Math.sin(Math.PI * ramp(2.1, 2.4, c));   // absorbs the landing
    }
    p.lA = [-0.3 - 0.9 * tuck, 0, -0.06]; p.lB = [-0.3 - 0.9 * tuck, 0, 0.06];
    // body spins around its middle, not its feet
    var base = child(WORLD, 0, Math.round((air + p.y) * CP) / CP, 0, 0, p.yaw, 0);
    var spin = child(base, 0, 18, 0, sRx, sRy, 0);
    var root = child(spin, 0, -18, 0, p.rx, 0, p.rz);
    shadow(0, Math.max(4, Math.round(10 - air * 0.3)), 2);
    var parts = hendrik(root, p);
    KIND = 5;
    var legs = [parts.lA, parts.lB], lx = [p.lA[0], p.lB[0]];
    for (var q = 0; q < 2; q++) {                               // skis under each boot, tips up; crossed for the iron cross
      var sk = child(legs[q], 0, -10.5, 0, -lx[q], (q ? -1 : 1) * 0.55 * cross, 0);
      box(sk, -1.3, -1.2, -9, 1.3, -0.2, 13, { all: 'M', t: 'L' }, 'ski' + q);
      box(sk, -1.3, -0.2, 13, 1.3, 1.2, 15, { all: 'M', t: 'L' }, 'ski' + q);
    }
    KIND = 1;
    var poles = [child(parts.aA, 0, -10.8, 0, 0.9, 0, 0), child(parts.aB, 0, -10.8, 0, 0.9, 0, 0)];
    for (var r = 0; r < 2; r++) { box(poles[r], -0.4, -14, -0.4, 0.4, 0, 0.4, 'K', 'pole' + r); box(poles[r], -1.2, -13, -1.2, 1.2, -12.4, 1.2, 'M', 'pole' + r); }
    // the slope: snow with moguls, pines, and the next kicker or rail scrolling past
    KIND = 7;
    for (var xi = -34; xi < 34; xi += 2) {
      var ee = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 34, 2)));
      var hh = -1.2 + 1.0 * Math.sin(xi / 4 + skiPhase * 7) * ee;
      box(WORLD, xi, -3.5, -9.8 * ee, xi + 2, hh, 1.4 + 6 * ee, { all: 'f', f: function (u, v) { return v < 0.35 ? 'f' : 'a'; } }, 'snow');
    }
    KIND = 5;
    for (var tI = 0; tI < 2; tI++) {
      var tx = ((((-skiPhase * 26 + tI * 30) % 60) + 60) % 60) - 30;
      if (Math.abs(tx) < 26) tree(Math.round(tx), -8, tI ? 0.8 : 1);
    }
    if (going) {
      if (trick === 'RAIL SLIDE') {
        var rc = c < 0.9 ? d * (13 + 40 * (1 - ramp(0, 0.9, c))) : d * (13 - 26 * ramp(0.9, 2.3, c)) - (c > 2.3 ? d * 30 * ramp(2.3, 3.0, c) : 0);
        if (Math.abs(rc) < 52) rail(rc);
      } else {
        var kx = c < 0.9 ? d * 40 * (1 - ramp(0, 0.9, c)) : -d * 40 * ramp(0.9, 2.1, c);
        if (Math.abs(kx) < 50 && c < 2.1) kicker(kx, d);
      }
    }
    KIND = 1;
    finish();
    if (moving) for (var s2 = 0; s2 < 7; s2++) {                  // snow spray off the tails
      var sp = (t * 1.8 + s2 / 7) % 1, sx = OX - dir * (12 + s2 * 2) - dir * sp * 6, sy = OY - 3 - sp * 9 - (s2 % 3);
      if (air < 1) { dot(sx, sy, OV.foam, 1 - sp); dot(sx - dir, sy, OV.foam, (1 - sp) * 0.6); }
    }
    if (going && c >= 2.1 && c < 2.5) for (var b2 = 0; b2 < 10; b2++) {   // landing burst
      var bk = ramp(2.1, 2.5, c), ang = b2 / 10 * Math.PI;
      dot(OX + Math.cos(ang) * (6 + bk * 14), OY - 2 - Math.sin(ang) * bk * 8, OV.foam, 1 - bk);
    }
    if (going && c > 2.2 && c < 3.4) {                            // the trick's name
      var al = 1 - ramp(3.0, 3.4, c);
      txt(trick, Math.round(OX - trick.length * 2), 10, OV.peach, al);
    }
  }

  function drawKite(dt) {
    kd += (dir - kd) * (1 - Math.exp(-dt * 4));
    var bob = Math.sin(tp * 2.4) * 0.8;
    var p = pose();
    p.yaw = 0; p.y = 4.2 + bob - 0.6; p.rz = kd * 0.28;
    p.lA = [0, 0, -0.3]; p.lB = [0, 0, 0.3];
    p.aA = [-0.25, 0, kd * 1.9]; p.aB = [-0.25, 0, kd * 1.9];
    p.head[1] = kd * 0.5; p.head[0] = -0.2; p.head[2] = -kd * 0.22; p.gaze = kd;
    var root = rootOf(p);
    KIND = 5;
    box(root, -9.8, -1.4, -3.6, 9.8, 0, 3.6, { all: 'M', t: function (u) { return u < 0.15 || u > 0.85 ? 'C' : 'K'; }, d: 'M' }, 'kboard');
    KIND = 1;
    var parts = hendrik(root, p);
    var bar = child(parts.aB, 0, -11.8, 0, 0, 0, 0);
    box(bar, -0.7, -0.7, -6.3, 0.7, 0.7, 6.3, 'M');
    // small oval of choppy sea with scattered whitecaps
    KIND = 7;
    var tick = (t * 6) | 0;
    for (var xi = -28; xi < 28; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 28, 2)));
      var h = (2.2 + 0.8 * Math.sin(xi / 4.2 + t * 6)) * e;
      (function (xc) {
        box(WORLD, xc, -2, -9.8 * e, xc + 2, h, 1.4 + 4.2 * e + (Math.sin(xc * 1.3 + t * 3) > 0 ? 1.1 : 0), {
          all: 'B', f: function (u, v) { return v < 0.2 ? 'a' : 'B'; },
          t: function (u, v) { return ((xc * 3 + ((v * 7) | 0) * 7 + tick) % 9) === 0 ? 'f' : 'a'; }
        }, 'sea');
      })(xi);
    }
    // the kite: one solid orange canopy with a pale leading edge; it arcs over when he turns
    KIND = 5;
    var kx = kd * 18, ky = 49 + 7 * (1 - kd * kd) + Math.sin(tp * 1.3) * 1.7;
    var kite = child(WORLD, kx, ky, -8.4, 0, 0, Math.sin(tp * 1.3) * 0.08 - (kd * 0.25));
    for (var i = 0; i < 7; i++) {
      var sx = (i - 3) * 4.1, sy = -0.77 * (i - 3) * (i - 3);
      box(kite, sx - 2.1, sy, -2.2, sx + 2.1, sy + 2.2, 2.2, { all: 'L', t: 'C', d: 'A' }, 'kite');
    }
    KIND = 1;
    finish();
    var b1 = project(toWorld(bar, [0, 0, -6.3])), b2 = project(toWorld(bar, [0, 0, 6.3]));
    var k1 = project(toWorld(kite, [-14, -10.4, 0])), k2 = project(toWorld(kite, [14, -10.4, 0]));
    line2d(b1, k1, OV.line, 0.55); line2d(b2, k2, OV.line, 0.55);
    for (var s = 0; s < 7; s++) {
      var sp = (t * 2.2 + s / 7) % 1, sx2 = OX - dir * (11 + s * 2.2 + sp * 7), sy2 = OY - 4 - sp * 7 - (s % 3);
      dot(sx2, sy2, s % 2 ? OV.foam : OV.sea, 1 - sp); dot(sx2 - dir, sy2, OV.foam, (1 - sp) * 0.5);
    }
  }

  function drawSleep() {
    shadow(0, 25, 3);
    KIND = 5;                                                 // the couch
    box(WORLD, -19.6, 1.4, -7, 19.6, 7, 7, { all: 'V', f: function (u, v) { return v < 0.25 ? 'u' : v > 0.8 ? 'v' : (u > 0.49 && u < 0.51 ? 'v' : 'V'); } });
    box(WORLD, -19.6, 7, -7, 19.6, 23.8, -3, { all: 'v', t: 'u', f: function (u, v) { return v < 0.1 ? 'u' : 'V'; } });
    box(WORLD, -24.5, 1.4, -7, -19.6, 15.4, 7, { all: 'v', t: 'u', f: 'V' });
    box(WORLD, 19.6, 1.4, -7, 24.5, 15.4, 7, { all: 'v', t: 'u', f: 'V' });
    box(WORLD, -22.4, 0, 4.2, -21, 1.4, 5.6, 'M'); box(WORLD, 21, 0, 4.2, 22.4, 1.4, 5.6, 'M');
    KIND = 1;
    // Hendrik out cold on his side, head propped on the armrest, under a blanket
    var p = pose();
    p.face = 'sleep'; p.yaw = 0;
    p.aB = [0, 0.93, -1.57]; p.aA = [0, 0, 0];
    p.lA = [0.1, 0, 0]; p.lB = [-0.05, 0, 0];
    var breathe = (t % 3) < 1.5 ? 0 : 1;
    var root = child(WORLD, 18.9, 14, 0.7, 0, 0, Math.PI / 2 - 0.12);
    hendrik(root, p);
    box(WORLD, -4.2, 6.4, -3.6, 16.6, 20.4 + breathe, 4.6, {
      all: 'W',
      f: function (u) { return u > 0.62 && u < 0.7 ? 'L' : 'W'; },
      t: function (u) { return u > 0.62 && u < 0.7 ? 'L' : 'W'; }
    });
    finish();
    var hp = project([-16.8, 25.2, 0]);
    for (var z = 0; z < 3; z++) {
      var ph = (t * 0.32 + z / 3) % 1;
      glyph(ph < 0.33 ? Z4 : ph < 0.66 ? Z5 : Z6, hp.x + ph * 12 + z, hp.y - 4 - ph * 22, OV.ink, (1 - ph) * 0.7);
    }
  }

  // ---------- outings: now and then he stops following and goes his own way ----------
  // After OUT_FIRST seconds on foot (then every OUT_MIN–OUT_MAX, counted across pages) he leaves the
  // cursor on a path of his own: a Club-Mate break on a drinks crate for most of a minute, cartwheels
  // across the page, or a dance. His day waits meanwhile. A click (which also skips ahead), a pin or
  // the podcasts page's studio ends it; the hover bubble holds it. Never on a board, asleep, or out of
  // a sit-down scene he has settled into.
  var OUT_FIRST = 45, OUT_MIN = 60, OUT_MAX = 120, OUT_WALK = 95, MATE_T = 50, WHEEL_T = 0.85, WHEEL_PX = 105, TADA_T = 1.5;
  var OUT_ON = { walk: 1, coding: 1, podcast: 1, sax: 1, cocktail: 1 };
  var OUT_KINDS = [['mate', 2, say('mate')], ['wheel', 1, say('wheel')], ['dance', 1, say('dance')]];
  var outing = null, outForce = null;
  if (typeof state.free !== 'number') state.free = 0;           // seconds on foot since the last outing
  if (typeof state.outIn !== 'number') state.outIn = OUT_FIRST;  // ... when the next one is due
  if (state.outNow) { outForce = state.outNow; state.free = state.outIn; delete state.outNow; }   // the lab asks for one
  function outSpot() {                                          // somewhere on the page, away from the cursor and from him
    var vw = window.innerWidth, vh = window.innerHeight, y0 = Math.max(160, vh * 0.35), best = null, bd = -1;
    for (var n = 0; n < 6; n++) {
      var s = [120 + Math.random() * Math.max(0, vw - 240), y0 + Math.random() * Math.max(0, vh - 30 - y0)];
      var d = Math.min(mouse ? Math.hypot(s[0] - mouse.x, s[1] - mouse.y) : 1e4, Math.hypot(s[0] - state.x, s[1] - state.y));
      if (d > bd) { best = s; bd = d; }
      if (d > 220) break;
    }
    return best;
  }
  function startOuting() {
    var opts = OUT_KINDS.filter(function (o) { return o[0] !== state.outLast; }), tot = 0, k, pick = opts[opts.length - 1];
    opts.forEach(function (o) { tot += o[1]; });
    var r = Math.random() * tot;
    for (k = 0; k < opts.length; k++) { r -= opts[k][1]; if (r < 0) { pick = opts[k]; break; } }
    for (k = 0; k < OUT_KINDS.length; k++) if (OUT_KINDS[k][0] === outForce) pick = OUT_KINDS[k];
    outForce = null;
    state.outLast = pick[0]; state.free = 0;
    state.outIn = OUT_MIN + Math.random() * (OUT_MAX - OUT_MIN);
    var beats = [{ id: 'go' }];
    if (pick[0] === 'mate') beats.push({ id: 'mate', T: MATE_T }, { id: 'go' });
    else if (pick[0] === 'wheel') beats.push({ id: 'wheel' }, { id: 'tada', T: TADA_T, say: 'TA-DA!' });
    else beats.push({ id: 'dance', T: 7.5 }, { id: 'tada', T: TADA_T });
    if (current === 'podcast') foldStudio();
    outing = { kind: pick[0], beats: beats, i: 0 };
    think(pick[2], 3);
  }
  function endOuting() { outing = null; still = 0; }
  function outBegin(b) {
    b.t = 0;
    if (b.id === 'go') {                                        // a gentle curve to a spot of his own, not a beeline
      var to = outSpot(), dx = to[0] - state.x, dy = to[1] - state.y, bend = (Math.random() - 0.5) * 0.6;
      b.from = [state.x, state.y]; b.to = to; b.s = 0;
      b.via = [(state.x + to[0]) / 2 - dy * bend, (state.y + to[1]) / 2 + dx * bend];
      b.len = Math.hypot(dx, dy) * (1 + Math.abs(bend) * 0.5);
    } else if (b.id === 'wheel') {                              // toward the side with more room
      var vw = window.innerWidth;
      b.d = state.x > vw / 2 ? -1 : 1;
      b.n = clamp(Math.floor((b.d > 0 ? vw - 60 - state.x : state.x - 60) / WHEEL_PX), 1, 3);
      b.x0 = state.x; b.T = b.n * WHEEL_T;
    } else if (b.id === 'mate') b.side = state.x < window.innerWidth / 2 ? 1 : -1;   // sits turned into the page
  }
  function outTick(dt) {
    var b = outing.beats[outing.i];
    if (b.t == null) outBegin(b);
    if (b.id === 'go') {
      b.s = b.len < 4 ? 1 : Math.min(1, b.s + OUT_WALK * dt / b.len);
      var u = b.s, v = 1 - u;
      var nx = v * v * b.from[0] + 2 * v * u * b.via[0] + u * u * b.to[0], ny = v * v * b.from[1] + 2 * v * u * b.via[1] + u * u * b.to[1];
      var step = Math.hypot(nx - state.x, ny - state.y);
      if (Math.abs(nx - state.x) > 0.3) dir = nx > state.x ? 1 : -1;
      state.x = nx; state.y = ny; walkPhase += step / 9; moving = step > 0.01;
      if (b.s < 1) return;
    } else {
      b.t += dt;
      if (b.id === 'wheel') { dir = b.d; state.x = b.x0 + b.d * WHEEL_PX * Math.min(b.t / WHEEL_T, b.n); }
      if (b.id === 'mate' && b.t > 6 && !b.ahh) { b.ahh = true; think(say('ahh'), 2.2); }   // after the first sip
      if (b.t < b.T) return;
    }
    if (++outing.i >= outing.beats.length) endOuting();
    else outBegin(outing.beats[outing.i]);                      // set up now: this frame already faces and draws it
  }
  function outYaw() {                                           // which way he faces, eased like the rest
    var b = outing.beats[outing.i];
    return b.id === 'go' ? (moving ? dir * 0.85 : -0.45) : b.id === 'mate' ? b.side * 1.05 : 0;
  }
  // the Club-Mate: brown glass, a pale label, a crown cap; centred on the grip, neck up
  function mateBottle(xf) {
    box(xf, -1.4, -3.4, -1.4, 1.4, 3.0, 1.4, { all: ['III', 'lll', 'lll', 'lll', 'III', 'zzz'], t: 'I', d: 'z' }, 'mate');
    box(xf, -0.7, 3.0, -0.7, 0.7, 5.6, 0.7, 'I', 'mate');
    box(xf, -0.8, 5.6, -0.8, 0.8, 6.3, 0.8, 'K', 'mate');
  }
  function crate(g, cyaw) {                                     // a drinks crate, caps showing, grown out of the floor like his chairs
    if (g <= 0.02) return;
    var prev = KIND; KIND = 5;
    var c = child(scaledY(0, 0, g), 0, 0, 0, 0, cyaw, 0);
    box(c, -6.4, 0, -5.6, 6.4, 6, 5.6, { all: 'p', f: ['pppppppppppp', 'pXXXppppXXXp', 'pppppppppppp', 'pppppppppppp', 'pppppppppppp'], t: ['KIKIKIKI', 'IIIIIIII', 'KIKIKIKI', 'IIIIIIII', 'KIKIKIKI'] }, 'crate');
    KIND = prev;
  }
  function drawOuting() {
    var b = outing.beats[outing.i], p = pose();
    if (b.t == null) outBegin(b);
    if (b.id === 'mate') { drawMate(b, p); return; }
    if (b.id === 'wheel') { drawWheel(b, p); return; }
    if (b.id === 'dance') { drawDance(b, p); return; }
    if (b.id === 'tada') {                                      // arms up, a little hop
      var k = Math.sin(Math.PI * Math.min(1, b.t / 0.5));
      p.yaw = yaw; p.y = 2.4 * k; p.face = 'smile';
      p.aA = [-0.15, 0, -2.6]; p.aB = [-0.15, 0, 2.6];
    } else if (moving) walkCycle(p, 1);
    else lookAtCursor(p);
    shadow(0, 10, 2);
    hendrik(rootOf(p), p);
    finish();
    if (b.say && b.t < TADA_T) txt(b.say, Math.round(OX - b.say.length * 2), 10, OV.peach, 1 - ramp(TADA_T - 0.4, TADA_T, b.t));
  }
  // the break: a crate rises, he sits, opens a Club-Mate, sips, swings his feet, looks around, gets up
  function drawMate(b, p) {
    var T = b.T, bt = b.t;
    var g = ease(ramp(0, 0.5, bt)) * (1 - ease(ramp(T - 0.6, T - 0.1, bt)));
    var sit = ease(ramp(0.5, 1.2, bt)) * (1 - ease(ramp(T - 1.3, T - 0.6, bt)));
    var hasBottle = bt > 1.3 && bt < T - 1.3;
    var sc = bt - 3.5, n = Math.floor(sc / 8), c = sc - n * 8;   // a sip every 8 s: up, hold, down
    var sip = sc > 0 && bt < T - 3 ? ease(ramp(0, 0.5, c)) * (1 - ease(ramp(1.9, 2.4, c))) : 0;
    // side-on on the crate, legs angled down to the floor, the bottle in the hand nearer to us
    seat(p, sit);
    p.lA = [-0.95 * sit, 0, -0.08 * sit]; p.lB = [-0.95 * sit, 0, 0.08 * sit];
    p.yaw = yaw;
    if (sit > 0.95) {
      var sw = Math.sin(bt * 2.1) * 0.12;                        // feet swinging off the crate
      p.lA[0] += sw; p.lB[0] -= sw;
      if (bt % 12 < 3 && mouse) lookAtCursor(p);                 // now and then a look at you
      else { p.head[1] = 0.55 * Math.sin(bt * 0.37); p.gaze = p.head[1] + p.yaw < 0 ? -1 : 1; }
    }
    var arm = b.side > 0 ? 'aA' : 'aB', m = b.side > 0 ? -1 : 1;
    if (hasBottle) {
      p[arm] = [-0.85 - 1.65 * sip, 0, m * (0.12 - 0.67 * sip)];   // knee → mouth
      p.head[0] = -0.4 * sip; if (sip > 0.5) { p.head[1] = 0; p.face = 'blink'; }
    }
    shadow(0, 12, 2);
    crate(g, p.yaw);
    var parts = hendrik(rootOf(p), p);
    if (hasBottle) {
      var hand = toWorld(parts[arm], [0, -11.6, 0]);
      mateBottle(child(WORLD, hand[0], hand[1] + 1.2 * (1 - sip), hand[2], -2.3 * sip, p.yaw, 0));
    }
    finish();
  }
  // cartwheels: arms up, legs apart, turning round his middle; his head is bigger than his arms are
  // long, so the middle rises as he goes over (an aerial) and his quiff never dips through the floor
  function drawWheel(b, p) {
    var th = 2 * Math.PI * Math.min(b.t / WHEEL_T, b.n);
    p.yaw = 0; p.face = 'smile';
    p.aA = [0, 0, -2.75]; p.aB = [0, 0, 2.75]; p.lA = [0, 0, -0.5]; p.lB = [0, 0, 0.5];
    var spin = child(WORLD, 0, 18 + 2.9 * (1 - Math.cos(th)), 0, 0, 0, -b.d * th);
    shadow(0, 9, 2);
    hendrik(child(spin, 0, -18, 0, 0, 0, 0), p);
    finish();
  }
  // a dance: a disco point that swaps hands, hips swaying, a bounce, singing along, notes rising
  function drawDance(b, p) {
    var beat = b.t * 2.4 * Math.PI, s = Math.sin(beat), up = Math.sin(beat / 2) > 0;
    p.yaw = 0.3 * Math.sin(beat / 2); p.rz = 0.09 * s; p.y = Math.abs(s) * 1.4;
    if (up) { p.aB = [-0.2, 0, 2.6]; p.aA = [0, 0, -0.55]; } else { p.aA = [-0.2, 0, -2.6]; p.aB = [0, 0, 0.55]; }
    p.lA = [0.28 * s, 0, -0.1]; p.lB = [-0.28 * s, 0, 0.1];
    p.head[2] = 0.14 * s;
    p.face = ((b.t * 3) | 0) % 3 ? 'talk' : 'smile';
    shadow(0, 10, 2);
    var root = rootOf(p);
    hendrik(root, p);
    finish();
    var hp = project(toWorld(root, [0, 41, 0]));
    for (var k = 0; k < 3; k++) {
      var ph = (b.t * 0.6 + k / 3) % 1;
      glyph(k === 1 ? NOTE2 : NOTE, hp.x - 14 + k * 12 + Math.sin(ph * 6 + k) * 3, hp.y - 3 - ph * 18, k === 1 ? OV.peach : OV.ink, 1 - ph);
    }
  }

  var DRAW = { walk: drawWalk, coding: drawCoding, podcast: drawPodcast, surf: drawSurf, sax: drawSax, cocktail: drawCocktail, ski: drawSki, kite: drawKite, sleep: drawSleep };

  // ---------- Jev: a decision model picks what he does next ----------
  // Every JEV_EVERY seconds he sends a small snapshot of the visit (page, scroll,
  // idle time, hour; nothing the visitor typed) to a proxy, which asks TypeSafe's
  // Jev a fixed set of questions in one call (jev/jev-proxy.mjs). When an
  // activity ends, Jev's choice replaces the timetable; with no answer, or an
  // unsure one, the timetable carries on. Off wherever JEV_URL is empty. On krackedtools.dev the
  // proxy runs on Railway (jev/deploy.sh); there a mock answer (past the daily cap)
  // still steers him, but he doesn't talk about Jev.
  var JEV_HOSTED = 'https://jev-proxy-production-bebb81e9.up.railway.app/decide';
  var HOST = typeof location !== 'undefined' ? location.hostname : '', ON_SITE = /^(www\.)?krackedtools\.dev$/.test(HOST);
  var JEV_URL = /^(localhost|127\.0\.0\.1)$/.test(HOST) ? 'http://' + HOST + ':8787/decide' : ON_SITE ? JEV_HOSTED : '';
  var JEV_EVERY = 25, JEV_FRESH = 60, JEV_SURE = 0.3;
  var LABEL = SAY.act;
  var jev = null, jevAt = 0, jevUsed = 0, jevBusy = false, jevNext = 2, jevCount = 0, jevSaid = {};
  var pageAt = 0, inputAt = 0, snapAt = 0, scrolled = 0, scrollWas = 0;
  // where the visitor is: this page (as the site lists it), an episode it embeds, a podcast card under the cursor
  var PATH = (function () {
    var p = (typeof location !== 'undefined' && location.pathname) || '/';
    p = p.replace(/\/index\.html$/, '/');
    if (!/\/$/.test(p) && !/\.[a-z]+$/i.test(p)) p += '.html';
    return p;
  })();
  var ON_PODCASTS = /podcasts/.test(PATH), PAGE_EP = null, cardHover = null, cardAt = 0, studioCard = null;
  function noteCard(e) {
    var a = e && e.target && e.target.closest ? e.target.closest('a.podcast-entry') : null;
    var m = a && /[?&]v=([\w-]{11})/.exec(a.href || ''), id = m ? m[1] : null;
    if (id !== cardHover) { cardHover = id; cardAt = performance.now(); }
  }
  // podcasts page: resting on an episode for a second opens the studio with its guest (or solo for a
  // model review); off the cards for two seconds, he goes back to where he was in his day
  function cardTick() {
    if (!ON_PODCASTS) return;
    var now = performance.now(), pi = podIdx();
    if (cardHover && now - cardAt >= 1000 && studioCard !== cardHover) {
      studioCard = cardHover; foldStudio(); still = 0;            // the studio starts over: their guest walks in first
      loadGuests();
      if (ACTIVITIES[activityIndex()].id !== 'podcast') {
        if (state.prePod == null) state.prePod = state.elapsed;
        state.elapsed = ACTIVITIES[pi].at;
      }
    } else if (!cardHover && studioCard && now - cardAt >= 2000) {
      studioCard = null; foldStudio();
      if (state.prePod != null) { state.elapsed = state.prePod; state.prePod = null; }
    }
    if (studioCard && state.elapsed > ACTIVITIES[pi + 1].at - 1) state.elapsed = ACTIVITIES[pi + 1].at - 1;   // on air while he's looked at
  }
  // the guest's name tag: for a moment as they sit down, over their head
  var tag = document.createElement('div');
  tag.className = 'kt-pet-tag';
  tag.setAttribute('aria-hidden', 'true');
  tag.style.cssText = 'position:fixed;left:0;top:0;z-index:61;display:none;pointer-events:none;';
  bubbleCss.textContent += '.kt-pet-tag{font:12px/1 var(--font-mono,ui-monospace,monospace);letter-spacing:.02em;color:#ece9f1;' +
    'background:#131118;border:1px solid #3a3540;padding:7px 10px;white-space:nowrap}';
  var tagAt = null, tagShown = '';
  function tagTick() {
    if (tagReq && tagAt && !state.leaving && !state.home) {
      if (thoughtOn) { thoughtOn = false; thought.style.display = 'none'; }
      if (tagShown !== tagReq) { tag.textContent = tagReq; tagShown = tagReq; }
      tag.style.display = 'block';
      tag.style.transform = 'translate(' + Math.round(boxX + tagAt[0] * SCALE) + 'px,' + Math.round(boxY + tagAt[1] * SCALE - 10) + 'px) translate(-50%,-100%)';
    } else if (tagShown) { tag.style.display = 'none'; tagShown = ''; }
  }
  // his thought bubble: what Jev just told him (never clickable, never in the way)
  var thought = document.createElement('div');
  thought.className = 'kt-pet-thought';
  thought.setAttribute('aria-hidden', 'true');
  thought.style.cssText = 'position:fixed;left:0;top:0;z-index:61;display:none;pointer-events:none;';
  bubbleCss.textContent += '.kt-pet-thought{font:12px/1 var(--font-mono,ui-monospace,monospace);letter-spacing:.02em;color:#ece9f1;' +
    'background:#131118;border:1px solid #3a3540;padding:7px 10px;white-space:nowrap}' +
    '.kt-pet-thought::before,.kt-pet-thought::after{content:"";position:absolute;left:50%;background:#131118;border:1px solid #3a3540}' +
    '.kt-pet-thought::before{bottom:-9px;width:5px;height:5px;margin-left:-8px}' +
    '.kt-pet-thought::after{bottom:-15px;width:3px;height:3px;margin-left:-2px}';
  var thoughtOn = false, thoughtEnd = 0;
  function think(text, secs) {
    if (bubbleOn || state.leaving || state.home) return;
    thought.textContent = text;
    thoughtEnd = performance.now() + secs * 1000;
    thoughtOn = true; thought.style.display = 'block';
  }
  function noteInput() { inputAt = performance.now(); }
  function noteScroll() {
    var y = window.scrollY || 0;
    scrolled += Math.abs(y - scrollWas); scrollWas = y;
    noteInput();
  }
  function snapshot() {
    var now = performance.now(), p = location.pathname;
    var room = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var speed = scrolled / Math.max(1, (now - snapAt) / 1000);   // px per second since the last snapshot
    scrolled = 0; snapAt = now;
    return {
      title: document.title,
      kind: /podcasts/.test(p) ? 'podcasts' : /writing/.test(p) ? 'writing' : /\/posts\//.test(p) ? 'post' : /(\/|index\.html)$/.test(p) ? 'home' : 'other',
      scroll: Math.round(100 * clamp((window.scrollY || 0) / room, 0, 1)),
      page_s: Math.round((now - pageAt) / 1000), site_s: Math.round(state.wait + state.elapsed),
      idle_s: Math.round((now - inputAt) / 1000), speed: Math.round(speed),
      hour: new Date().getHours(), doing: current || 'walk', done: state.done || [],
      path: PATH, episode: cardHover || studioCard || PAGE_EP, tz: timeZone(), read: (state.read || []).slice(0, -1).slice(-5)
    };
  }
  function timeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function muse(d) {                                            // now and then he says what's on his mind
    if (current === 'sleep' || thoughtOn) return;
    var tag = d.mock ? ' (mock)' : '';
    if (!state.jevHi) { state.jevHi = true; think(say('hi') + tag, 5); return; }
    if (LANG !== 'en' && !state.langHi) { state.langHi = true; think(say('hiLang'), 5); return; }   // once per tab: why he speaks this language
    if (d.finished > 0.8 && !jevSaid.fin) { jevSaid.fin = 1; think(say('end'), 4); return; }
    if (d.skimming > 0.8 && !jevSaid.skim) { jevSaid.skim = 1; think(say('skim'), 4); return; }
    if (d.idle > 0.8 && !jevSaid.idle) { jevSaid.idle = 1; think(say('idle'), 4); return; }
    if (jevCount % 4 === 0) think(d.mock ? say('running') + tag : say('running') + ' · ' + d.ms + ' ms', 4);
  }
  function askJev() {
    jevBusy = true;
    var done = function () { jevBusy = false; jevNext = t + JEV_EVERY; };
    fetch(JEV_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(snapshot()) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        done();
        if (d && d.ok && DRAW[d.activity] && !(d.mock && ON_SITE)) { jev = d; jevAt = t; jevCount++; muse(d); }
      }, done);
  }
  function jevPick() {                                          // Jev's likeliest activity that isn't the one he's doing
    if (!jev || t - jevAt > JEV_FRESH) return null;
    var best = null, bp = 0, P = jev.probabilities || {};
    for (var id in P) if (id !== current && DRAW[id] && P[id] > bp) { best = id; bp = P[id]; }
    return bp >= JEV_SURE ? { id: best, p: bp } : null;
  }
  function jevTick(was) {
    if (!JEV_URL) return;
    if (!jevBusy && t >= jevNext && !document.hidden) askJev();
    var idx = activityIndex(), a = ACTIVITIES[idx];
    // an activity just ran out, or he has napped a while and a new answer is in
    var due = idx !== was || (a.id === 'sleep' && state.elapsed - a.at > 45 && jevAt !== jevUsed);
    if (!due) return;
    jevUsed = jevAt;
    var pick = jevPick();
    if (!pick) return;
    for (var k = 0; k < ACTIVITIES.length; k++) if (ACTIVITIES[k].id === pick.id) state.elapsed = ACTIVITIES[k].at;
    if (!(jev.mock && ON_SITE)) think(say('says', { act: LABEL[pick.id], p: Math.round(pick.p * 100) }), 5);
  }

  // ---------- loop ----------
  function frame(now) {
    if (state.home) { canvas.style.visibility = 'hidden'; scr.style.visibility = 'hidden'; bubble.style.display = 'none'; pinBtn.style.display = 'none'; thought.style.display = 'none'; return; }   // gone home: the loop stops
    requestAnimationFrame(frame);
    var raw = Math.min((now - last) / 1000, 1), dt = Math.min(raw, 0.05);   // raw: real time, for the 30 s wait
    last = now;
    if (!(dt > 0)) return;
    t += dt; tp = Math.floor(t * 10) / 10;
    // not here yet: wait out the first ARRIVE_AFTER seconds, then step out of a door
    if (!state.arrived) {
      keepInView();
      if (state.wait < ARRIVE_AFTER) { state.wait += raw; canvas.style.visibility = 'hidden'; scr.style.visibility = 'hidden'; return; }
      canvas.style.visibility = ''; scr.style.visibility = '';
      arriveT += dt;
      clear(); KIND = 1;
      drawArrival(arriveT);
      ctx.putImageData(img, 0, 0);
      place();
      if (arriveT >= 3.25) state.arrived = true;
      return;
    }
    if (state.leaving) {
      leaveT += dt;
      clear(); KIND = 1;
      if (scrDirty) { sbuf.fill(0); sctx.putImageData(simg, 0, 0); scrDirty = false; }   // the screens go dark with the desk
      drawDepart(leaveT);
      ctx.putImageData(img, 0, 0);
      place();
      tagReq = null; tagTick();
      if (leaveT >= 3.4) { state.home = true; state.leaving = false; save(); }
      return;
    }
    cardTick();
    var was = activityIndex();
    if (!outing) state.elapsed += dt;                          // his day waits while he's off on his own
    jevTick(was);
    if (!guestsAsked) {                                       // the guests' file, shortly before the studio opens
      var pi = podIdx();
      if (ON_PODCASTS || state.elapsed > ACTIVITIES[pi].at - 10 && state.elapsed < ACTIVITIES[pi + 1].at) loadGuests();
    }

    var act = ACTIVITIES[activityIndex()];
    if (current !== act.id) {
      if (current === 'podcast') foldStudio();
      if (current) poof = 0.4;
      current = act.id; still = 0;
      var done = state.done || (state.done = []);              // what he has done this visit, for Jev
      if (done[done.length - 1] !== act.id) { done.push(act.id); if (done.length > 12) done.shift(); }
    }

    // follow the cursor (asleep, he stays on his couch; while his bubble is up he holds still so you can
    // click it; pinned, he stays where he was put), unless he's off on an outing of his own
    moving = false;
    var inView = keepInView();
    if (outing && (state.pinned || studioCard || !OUT_ON[act.id])) endOuting();
    if (!outing && OUT_ON[act.id] && !state.pinned && !bubbleOn && !studioCard && (act.id === 'walk' || still < 0.35)) {
      state.free += dt;
      if (state.free >= state.outIn && inView) startOuting();
    }
    // while the studio is up he stays at the desk as long as the cursor stays over it, so a guest can be clicked
    var studioHold = act.id === 'podcast' && still >= 0.35 && mouse && mouse.x >= boxX && mouse.x < boxX + W * SCALE && mouse.y >= boxY && mouse.y < boxY + H * SCALE;
    if (outing) { if (inView && !bubbleOn) outTick(dt); }
    else if (mouse && act.speed > 0 && inView && !bubbleOn && !state.pinned && !studioHold) {
      var off = act.off || OFFSET_X;
      var tx = mouse.x + off * (mouse.x > window.innerWidth - 160 ? -1 : 1);
      var ty = Math.min(window.innerHeight - 6, mouse.y + OFFSET_Y);
      var dx = tx - state.x, dy = ty - state.y, d = Math.hypot(dx, dy);
      if (d > 6) {
        var stepLen = Math.min(d, Math.min(300, act.speed * (d > 300 ? 1.4 : 1)) * dt);
        state.x += dx / d * stepLen; state.y += dy / d * stepLen;
        walkPhase += stepLen / 9;                              // longer legs, longer stride
        moving = true;
        if (Math.abs(dx) > 3) dir = dx > 0 ? 1 : -1;
      }
    }
    still = moving ? 0 : still + dt;                           // how long he has been standing still
    // at rest he stands three-quarter on (so his sides show), turned toward the cursor
    var target = 0;
    if (outing) target = outYaw();
    else if (act.id === 'walk' || act.id === 'coding' || act.id === 'podcast' || act.id === 'sax' || act.id === 'cocktail') {
      if (moving) target = dir * 0.85;
      else if (mouse) target = (mouse.x < state.x ? -1 : 1) * clamp(0.45 + Math.abs(mouse.x - state.x) / 400, 0.45, 0.7);
      else target = -0.45;
      if (!moving && act.id === 'sax') target += 0.35;
    }
    yaw += (target - yaw) * (1 - Math.exp(-dt * 7));
    if (!isFinite(yaw)) yaw = -0.45;                           // never let a bad angle stick

    clear();
    KIND = 1;
    if (scrUsed || scrDirty) sbuf.fill(0);
    scrUsed = false;
    tagReq = null; tagAt = null; gLo = gHi = 0; gNow = null;
    if (outing) drawOuting(dt); else DRAW[act.id](dt);
    if (scrUsed || scrDirty) { sctx.putImageData(simg, 0, 0); scrDirty = scrUsed; }
    if (poof > 0) {                                           // a few squares on the 7px grid, not a sparkle
      poof -= dt;
      var k = 1 - poof / 0.4, rad = 6 + k * 17;
      for (var a = 0; a < 6; a++) {
        var ax = Math.round(OX + Math.cos(a * 1.047) * rad), ay = Math.round(OY - 20 + Math.sin(a * 1.047) * rad * 0.6);
        var al = poof / 0.4 * 0.8;
        dot(ax, ay, OV.ink, al); dot(ax + 1, ay, OV.ink, al); dot(ax, ay + 1, OV.ink, al); dot(ax + 1, ay + 1, OV.ink, al);
      }
    }
    ctx.putImageData(img, 0, 0);
    place();
    tagTick();
  }
  function place() {
    boxX = Math.round(state.x - OX * SCALE);
    boxY = Math.round(state.y - OY * SCALE);
    canvas.style.transform = 'translate(' + boxX + 'px,' + boxY + 'px)';
    scr.style.transform = canvas.style.transform;
    if (thoughtOn) {                                           // his thought floats along with him, and yields to the hover bubble
      var th = bubbleOn || state.leaving || performance.now() > thoughtEnd ? null : overHead();
      if (th) thought.style.transform = 'translate(' + th[0] + 'px,' + (th[1] - 20) + 'px) translate(-50%,-100%)';
      else { thoughtOn = false; thought.style.display = 'none'; }
    }
    if (bubbleOn) {
      if (bubbleHide && performance.now() > bubbleHide) { bubbleOn = false; bubble.style.display = 'none'; pinBtn.style.display = 'none'; return; }
      if (bubbleAt && bubbleAt[0] === boxX && bubbleAt[1] === boxY) return;   // pinned while he holds still
      var at = overHead();
      if (!at) return;
      bubbleAt = [boxX, boxY];
      bubble.style.transform = 'translate(' + at[0] + 'px,' + (at[1] - 10) + 'px) translate(-50%,-100%)';
      pinBtn.style.transform = 'translate(' + at[0] + 'px,' + Math.round(state.y + 12) + 'px) translate(-50%,0)';
    }
  }
  function overHead() {                                        // page point above the highest pixel of him
    var top = H, sx = 0, n = 0;
    for (var i = 0; i < W * H; i++) if (kind[i] === 1) { var yy = (i / W) | 0; if (yy < top) top = yy; sx += i % W; n++; }
    return n ? [Math.round(boxX + (sx / n) * SCALE), Math.round(boxY + top * SCALE)] : null;
  }
  function showBubble() {
    if (state.leaving || state.home) return;
    bubbleHide = 0;
    if (!bubbleOn) {
      bubbleOn = true; bubbleAt = null; bubble.style.display = 'block';
      pinBtn.textContent = state.pinned ? say('unpin') : say('pin');
      pinBtn.style.display = 'block';
    }
  }
  function hideBubbleSoon() { if (bubbleOn && !bubbleHide) bubbleHide = performance.now() + 700; }
  bubble.addEventListener('mouseenter', showBubble);
  bubble.addEventListener('mouseleave', hideBubbleSoon);
  pinBtn.addEventListener('mouseenter', showBubble);
  pinBtn.addEventListener('mouseleave', hideBubbleSoon);
  pinBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    state.pinned = !state.pinned;
    pinBtn.textContent = state.pinned ? say('unpin') : say('pin');
    save();
  });
  bubble.addEventListener('click', function (e) {
    e.stopPropagation();
    bubbleOn = false; bubble.style.display = 'none'; pinBtn.style.display = 'none';
    state.leaving = true; leaveT = 0; save();
  });

  // The canvas box is bigger than Hendrik and sits next to the cursor, so it
  // only takes the mouse over Hendrik himself — never over scenery or water.
  function overPet(cx, cy) {
    var lx = ((cx - boxX) / SCALE) | 0, ly = ((cy - boxY) / SCALE) | 0;
    if (lx < 0 || ly < 0 || lx >= W || ly >= H) return false;
    return kind[ly * W + lx] === 1;
  }
  // a guest in the studio: hovering names their episode, clicking opens it
  function overGuest(cx, cy) {
    if (!gNow || !gHi) return null;
    var lx = ((cx - boxX) / SCALE) | 0, ly = ((cy - boxY) / SCALE) | 0;
    if (lx < 0 || ly < 0 || lx >= W || ly >= H) return null;
    var i = ly * W + lx;
    return kind[i] === 1 && part[i] >= gLo && part[i] <= gHi ? gNow : null;
  }
  window.addEventListener('mousemove', function (e) {
    mouse = { x: e.clientX, y: e.clientY };
    var og = overGuest(e.clientX, e.clientY), over = !og && overPet(e.clientX, e.clientY);
    canvas.style.pointerEvents = og || over ? 'auto' : 'none';
    canvas.title = og ? say('watch', { name: og.name }) : PET_TITLE;
    if (over) showBubble(); else if (e.target !== bubble && e.target !== pinBtn) hideBubbleSoon();
  });
  window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse = null; });
  window.addEventListener('pagehide', save);
  canvas.addEventListener('click', function (e) {
    var og = e && overGuest(e.clientX, e.clientY);
    if (og) { window.open('https://www.youtube.com/watch?v=' + og.ep, '_blank', 'noopener'); return; }
    // asleep → wake up and start the day again; otherwise skip ahead (and back from any outing)
    if (outing) endOuting();
    var idx = activityIndex();
    state.elapsed = ACTIVITIES[idx].id === 'sleep' ? 0 : ACTIVITIES[idx + 1].at;
    save();
  });

  function start() {
    document.body.appendChild(canvas);
    document.body.appendChild(scr);
    document.body.appendChild(bubble);
    document.body.appendChild(pinBtn);
    document.body.appendChild(thought);
    document.body.appendChild(tag);
    (document.head || document.body).appendChild(bubbleCss);
    last = performance.now();
    pageAt = inputAt = snapAt = last;
    scrollWas = window.scrollY || 0;
    window.addEventListener('scroll', noteScroll, { passive: true });
    window.addEventListener('mousemove', noteInput);
    window.addEventListener('keydown', noteInput);
    document.addEventListener('mouseover', noteCard);
    var rd = state.read || (state.read = []);                 // the pages read this visit, for Jev
    if (rd[rd.length - 1] !== PATH) { rd.push(PATH); if (rd.length > 6) rd.shift(); }
    try {
      var yt = document.querySelector('iframe[src*="youtube"]'), ym = yt && /embed\/([\w-]{11})/.exec(yt.src || '');
      PAGE_EP = ym ? ym[1] : null;
    } catch (e) { PAGE_EP = null; }
    if (ON_PODCASTS) loadGuests();
    requestAnimationFrame(frame);
    setInterval(save, 1000);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
