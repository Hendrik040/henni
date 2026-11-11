/* ═══════════════════════════════════════════════════════════════
   krackedtools.dev — site pet, "Crossy Chibi" variant: a pocket-size
   voxel-toy Hendrik that follows the cursor.

   A chunky toy built from flat-coloured blocks: a big head (wider than
   his body) on a short neck, with a golden quiff swept up in stepped
   clumps, short faded sides, a forehead, 1x2 eyes, a wide toothy grin
   and light stubble along the jaw; a sage crew-neck tee, mauve-grey
   board shorts with an orange side stripe, bare shins and chunky white
   sneakers. Every frame is rendered by a tiny z-buffered software
   rasterizer at one art pixel per voxel and scaled up pixel-sharp.

   Shading is three flat bands per material (top, lit face, shadow side)
   looked up from hand-picked ramps, with the light from the top-left
   like the homepage tiles. No drawn outlines: colour alone separates the
   shapes, and every fill on his silhouette clears 3:1 on the page (a
   faint dark halo only shows over the bright homepage tiles). The face
   keeps its rows level, one pixel each, whichever way he turns.
   He hops (squash, stretch, land) when he chases the cursor and stands
   still otherwise.

   The longer a visitor stays (time is counted across pages, per tab),
   the further he gets through his day: walking → podcasting → surfing →
   saxophone → shaking cocktails → kitesurfing → asleep on the couch.
   Clicking him skips ahead; clicking him while he sleeps wakes him up.

   Mouse/trackpad only; hidden for prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (typeof window.matchMedia !== 'function' || !window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- Day schedule: seconds on site when each activity starts ----
  // hop: he travels in squash-and-stretch hops; the boards glide instead.
  var ACTIVITIES = [
    { id: 'walk',     at: 0,   speed: 110, hop: true },
    { id: 'podcast',  at: 35,  speed: 70,  hop: true },
    { id: 'surf',     at: 80,  speed: 200, off: 58 },
    { id: 'sax',      at: 125, speed: 75,  hop: true },
    { id: 'cocktail', at: 170, speed: 70,  hop: true },
    { id: 'kite',     at: 215, speed: 220 },
    { id: 'sleep',    at: 260, speed: 0 }
  ];

  // ---- Render target ----
  var W = 64, H = 56;               // art pixels (≈ one voxel per pixel)
  var SCALE = 3;                    // CSS px per art pixel
  var OX = 32, OY = 48;             // art pixel under his feet
  var PITCH = 0.38;                 // camera looks down ~22°
  var CP = Math.cos(PITCH), SP = Math.sin(PITCH);
  var OFFSET_X = 38, OFFSET_Y = 34; // where his feet go relative to the cursor
  var STORE = 'kt-pet';

  // ---- Light: key from the top-left (like the homepage tiles) ----
  // Each face gets one of three flat bands: 0 shadow side, 1 lit side/front, 2 top.
  var L = norm([-0.6, 0.65, 0.75]);
  var AMB = 0.46, DIF = 0.78;
  var BAND_LO = 0.66, BAND_HI = 1.0;
  var SHADOW = [6, 5, 9];           // contact shadow = the homepage tiles' cast-shadow colour

  // ---- Palette: hand-picked 3-step ramps (shadow, base, light) ----
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  // Colours are shared where they can be (teeth = sneaker white, neckline =
  // tee shadow, sole = sneaker shadow, lit stubble = skin base) so he stays
  // inside a 20-colour budget (21 with the headphones on).
  var MAT = {
    hair:   ['#8f6c47', '#bf9a68', '#e8d3a3'],   // ash/sandy blond quiff (mid sits well under the skin)
    skin:   ['#d9977b', '#f5c4a3', '#ffe4cc'],
    stub:   ['#d9977b', '#d9af8f', '#f5c4a3'],   // light golden-grey stubble (lit: the skin base, one step under lit skin)
    tee:    ['#677d60', '#87a07c', '#abc2a0'],   // sage crew-neck tee
    shorts: ['#655f80', '#837d9f', '#a8a2c2'],   // board shorts in the site's own mauve-grey family (shadow 3.1:1)
    shoe:   ['#bdb6cb', '#e2deea', '#f7f5fa'],   // chunky white sneakers
    orange: ['#d64a0c', '#ff570a', '#ffa057'],   // the site accent, as a lit block
    hw:     ['#6b6480', '#8a829c', '#aaa3bb'],   // mauve-grey hardware (stand, band, bar), 3.3:1 in shadow
    grille: ['#9fa3b2', '#c6c9d4', '#e6e8ee'],   // mic grille, shaker steel
    board:  ['#e0bf9f', '#ffe0c2', '#fff1e2'],   // pale-orange boards
    water:  ['#3d5c72', '#56798f', '#7a9bb0'],   // slate sea
    brass:  ['#b27a26', '#e0a93a', '#f7d272'],
    bar:    ['#5c5469', '#776f88', '#9a92ab'],
    counter:['#a29bb0', '#bdb6c9', '#d6d0df'],
    couch:  ['#5f586d', '#7c748b', '#a19ab0'],
    drink:  ['#e8833f', '#ffa057', '#ffc48f'],
    amber:  ['#7a5424', '#9c6c30', '#c08a44']
  };
  // texture keys → material + ramp offset, or one flat colour
  var KEYS = {
    H: ['hair', 0], h: ['hair', -1], G: ['hair', 1],
    S: ['skin', 0], s: ['skin', -1], t: ['stub', 0],
    E: '#1b1720', w: '#f7f5fa', m: '#9a5a50', b: '#9b5e2a',
    T: ['tee', 0], n: ['tee', -1],
    U: ['shorts', 0], A: '#ff570a',
    K: ['shoe', 0], g: ['shoe', -1],
    O: ['orange', 0], M: ['hw', 0], N: ['hw', -1], k: ['grille', 0], z: ['grille', 0], Z: ['grille', 1],
    C: ['board', 0], c: ['board', -1],
    I: ['tee', 0], i: ['tee', -1],                         // the sage throw on the couch
    j: ['shorts', -1],                                     // the shorts' waist ledge (top band = base step)
    B: ['water', 0], a: ['water', 1], f: '#ece9f1',
    Y: ['brass', 0], y: ['brass', -1], q: '#7a5424',
    R: ['bar', 0], r: ['bar', -1], u: ['counter', 0],
    V: ['couch', 0], v: ['couch', -1],
    d: ['drink', 0], x: ['amber', 0], D: '#ece9f1', l: '#ffa057'
  };
  var RAMP = {};
  (function () {
    for (var key in KEYS) {
      var spec = KEYS[key], ramp;
      if (typeof spec === 'string') { var c = hex(spec); ramp = [c, c, c]; }
      else {
        var steps = MAT[spec[0]].map(hex);
        ramp = [0, 1, 2].map(function (i) { return steps[clamp(i + spec[1], 0, 2)]; });
      }
      RAMP[key] = ramp;
    }
  })();
  var PAL = { D: hex('#ece9f1'), l: hex('#ffa057'), f: hex('#ece9f1'), a: hex('#7a9bb0') };

  // ---- Textures (rows top→bottom; side faces read front→back) ----
  function rev(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }
  function swap(rows, i, row) { var c = rows.slice(); c[i] = row; return c; }
  // 10x8 face: temples and forehead, brows, 1x2 eyes, grin corners raised a
  // pixel, a row of teeth between the corners with a short lower lip under
  // them, then stubble framing the jaw and chin. No nose: the grin and the
  // stubble get the rows instead. The hairline is the crown box, not a
  // painted row, so the 8 rows fit the ~8 px the face projects to.
  var FACE = ['hSSSSSSSSh', 'SSbbSSbbSS', 'SSSESSESSS', 'SSSESSESSS',
              'SSmSSSSmSS', 'tSSwwwwSSt', 'ttSSmmSStt', 'tttttttttt'];
  var FACES = {
    smile: FACE,
    blink: swap(swap(FACE, 2, 'SSSSSSSSSS'), 3, 'SSEESSEESS'),
    talk: swap(FACE, 6, 'ttSSEESStt'),
    sleep: swap(swap(swap(swap(swap(FACE, 2, 'SSSSSSSSSS'), 3, 'SSEESSEESS'), 4, 'SSSSSSSSSS'), 5, 'tSSSmmSSSt'), 6, 'ttSSSSSStt')
  };
  // level rows, one fixed tone, one pixel per row when there's room, and
  // hair (not more forehead) where a turned face's top edge climbs
  for (var fk in FACES) { FACES[fk].level = true; FACES[fk].lit = true; FACES[fk].snap = true; FACES[fk].above = 'H'; }
  var PRI = 'Emwb'; // features that must survive squashing, most important first
  // head sides: short faded hair runs forward above and behind the ear,
  // so skin shows only on the cheek and jaw (a bare slab read as bald)
  var HEAD_R = ['HHHHHHHHH', 'hHHHHHHHH', 'Shhhhhhhh', 'SShhhhhhh', 'SSShhhhhh',
                'SSSShhhhh', 'tSSSSShhh', 'ttSSSSShh', 'tttSSSSss'];
  var HEAD = {
    r: HEAD_R, l: rev(HEAD_R),
    b: ['HHHHHHHHHH', 'HHHHHHHHHH', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'shhhhhhhhs', 'ssssssssss'],
    t: 'H', d: 's'
  };
  // the sides of the head take the light step when lit, so turned to the
  // right his cheek never merges with the (fixed-tone) face into one slab
  HEAD.r.side = true; HEAD.l.side = true;
  // hair tops are combed: light with darker streaks running front to back
  var CROWN = { all: 'h', t: ['HHHhHHHHhHH'], f: 'H', d: 'h' };
  var QUIFF_A = { all: 'H', t: ['HHhHHHhHH'], f: ['GHHHGHHHH', 'HHHHHHHHH'], d: 'h' };
  var QUIFF_B = { all: 'H', t: ['HhHHHhH'], f: ['HHGHHHG', 'HHHHHHH'], d: 'h' };
  var EAR_L = { all: 'S', l: 's' }, EAR_R = { all: 'S', r: 's' };
  var TEE = {
    f: ['TnnnnnnT', 'TnnnnnnT', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT'],
    all: 'T', t: 'T', d: 'T'
  };
  TEE.f.level = true;               // keep the round neckline one level row (no 1-px drip under the chin)
  var SHORTS = { all: 'U', r: ['UUAAUU', 'UUAAUU'], l: ['UUAAUU', 'UUAAUU'], t: 'j', d: 'U' };   // the waist ledge stays at the base step
  var ARM = { all: ['TT', 'TT', 'SS', 'SS', 'SS'], t: 'T', d: 'S' };
  var SHOE = { all: 'K', f: ['KKK', 'ggg'], b: ['KKK', 'ggg'], l: ['KKKK', 'gggg'], r: ['KKKK', 'gggg'], d: 'g' };

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
  // s = optional [sx, sy, sz] scale (squash and stretch), applied in the child's own frame
  function child(par, x, y, z, rx, ry, rz, s) {
    var t = mulV(par.m, [x, y, z]), m = mulM(par.m, rot(rx || 0, ry || 0, rz || 0));
    if (s) m = mulM(m, [s[0], 0, 0, 0, s[1], 0, 0, 0, s[2]]);
    return { m: m, t: [t[0] + par.t[0], t[1] + par.t[1], t[2] + par.t[2]] };
  }
  function toWorld(xf, p) { var v = mulV(xf.m, p); return [v[0] + xf.t[0], v[1] + xf.t[1], v[2] + xf.t[2]]; }
  function project(p) { // world → screen (art px) + depth (bigger = closer)
    return { x: OX + p[0], y: OY - (p[1] * CP - p[2] * SP), z: p[1] * SP + p[2] * CP };
  }

  // ---------- frame buffer ----------
  // kind: 0 empty · 1 Hendrik (+ what he holds) · 2 shadow · 4 overlay
  //       5 scenery (stand, boards, bar, couch, kite) · 7 water
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.title = 'Hendrik — click to change what he’s doing';
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:' + W * SCALE + 'px;height:' + H * SCALE + 'px;' +
    'z-index:60;image-rendering:pixelated;will-change:transform;pointer-events:none;' +
    'cursor:var(--cursor-hand,pointer);';
  var ctx = canvas.getContext('2d');
  var img = ctx.createImageData(W, H), buf = img.data;
  var zb = new Float32Array(W * H), kind = new Uint8Array(W * H);
  var KIND = 1;

  function clear() { buf.fill(0); zb.fill(-1e9); kind.fill(0); }
  function solid(k) { return k === 1 || k === 5 || k === 7; }
  function put(x, y, z, c, a, k) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x;
    if (z <= zb[i]) return;
    zb[i] = z; kind[i] = k;
    var o = i * 4;
    buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = a;
  }
  // 2D overlay pixel (no depth test). Overlays pass behind Hendrik and what
  // he holds, so notes, lines and spray never tint him with blended colours.
  function dot(x, y, c, a) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    var i = y * W + x, o = i * 4, k = Math.min(1, a);
    if (kind[i] === 1) return;
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
  // When the face is drawn smaller than its texel grid (mid-squash), look
  // across the texels this pixel covers and keep the most important feature.
  function texelPri(spec, u, v, hu, hv) {
    var n = spec.length, m = spec[0].length;
    var r0 = Math.max(0, Math.floor(v * n - hv)), r1 = Math.min(n - 1, Math.floor(v * n + hv));
    var c0 = Math.max(0, Math.floor(u * m - hu)), c1 = Math.min(m - 1, Math.floor(u * m + hu));
    var best = null, bp = 99;
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      var ch = spec[r].charAt(c), pi = PRI.indexOf(ch);
      if (pi >= 0 && pi < bp) { bp = pi; best = ch; }
    }
    return best || spec[Math.min(n - 1, (v * n) | 0)].charAt(Math.min(m - 1, (u * m) | 0));
  }
  function pick(tex, k) {
    if (typeof tex === 'string' || typeof tex === 'function' || Array.isArray(tex)) return tex;
    return tex[k] !== undefined ? tex[k] : tex.all;
  }
  function face(xf, o, ua, va, ul, vl, n, spec) {
    if (spec == null) return;
    var wn = norm(mulV(xf.m, n));                               // normalised: the root may be squashed
    var nx = wn[0], ny = wn[1] * CP - wn[2] * SP, nz = wn[1] * SP + wn[2] * CP;
    if (nz <= 0.02) return;                                     // facing away
    var lum = AMB + DIF * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    var band = lum < BAND_LO ? 0 : lum < BAND_HI ? 1 : 2;
    if (spec.lit) band = 1;                                     // the face keeps one tone in every pose
    if (spec.side && band === 1) band = 2;                      // a lit head side reads a step above the face
    var p0 = project(toWorld(xf, o));
    var pu = project(toWorld(xf, [o[0] + ua[0] * ul, o[1] + ua[1] * ul, o[2] + ua[2] * ul]));
    var pv = project(toWorld(xf, [o[0] + va[0] * vl, o[1] + va[1] * vl, o[2] + va[2] * vl]));
    var ax = pu.x - p0.x, ay = pu.y - p0.y, bx = pv.x - p0.x, by = pv.y - p0.y;
    var det = ax * by - ay * bx;
    if (det > -1e-4 && det < 1e-4) return;
    var x0 = Math.max(0, Math.floor(Math.min(p0.x, pu.x, pv.x, pu.x + bx))), x1 = Math.min(W - 1, Math.ceil(Math.max(p0.x, pu.x, pv.x, pu.x + bx)));
    var y0 = Math.max(0, Math.floor(Math.min(p0.y, pu.y, pv.y, pu.y + by))), y1 = Math.min(H - 1, Math.ceil(Math.max(p0.y, pu.y, pv.y, pu.y + by)));
    var dzu = pu.z - p0.z, dzv = pv.z - p0.z;
    // the face keeps its texel rows level on screen and samples features with priority
    var lev = !!spec.level, lvl = false, hu = 0, hv = 0, snap = false, rowTop = 0;
    if (lev) {
      var tm = spec[0].length, tn = spec.length;
      lvl = bx * bx < 0.15 * by * by;
      var lu = lvl ? Math.abs(ax) : Math.hypot(ax, ay), lv = lvl ? Math.abs(by) : Math.hypot(bx, by);
      hu = lu < 0.97 * tm ? (tm / lu - 1) / 2 + 0.02 : 0;
      hv = lv < 0.97 * tn ? (tn / lv - 1) / 2 + 0.02 : 0;
      // narrower than its texel columns: lose whole columns at the edges,
      // the far (turned-away) edge first, never one from the middle
      var xl = Math.ceil(Math.min(p0.x, pu.x) - 0.5), ncol = Math.floor(Math.max(p0.x, pu.x) - 0.5) - xl + 1;
      var drop = lvl && ncol < tm ? tm - ncol : 0;
      // When there is room for every row, each texel row gets exactly one
      // pixel row, hung from the lower (near) end of the sloping top edge:
      // the forehead is never cut and the eyes are always 1x2. Turned, the
      // top edge climbs toward the far side; that wedge takes spec.above.
      snap = !!spec.snap && lvl && by > 0 && lv >= tn - 0.5;
      if (snap) rowTop = Math.ceil(p0.y + Math.max(0, ay) - 0.5);
    }
    for (var y = y0; y <= y1; y++) {
      var dy = y + 0.5 - p0.y;
      for (var x = x0; x <= x1; x++) {
        var dx = x + 0.5 - p0.x;
        var s = (dx * by - dy * bx) / det, q = (ax * dy - ay * dx) / det;
        if (s < -0.02 || q < -0.02 || s > 1.02 || q > 1.02) continue;
        s = s < 0 ? 0 : s > 0.9999 ? 0.9999 : s;
        q = q < 0 ? 0 : q > 0.9999 ? 0.9999 : q;
        var key = null;
        if (lev) {
          var qs = lvl ? clamp((dy - 0.5 * ay) / by, 0, 0.9999) : q;
          if (snap) {
            var r = y - rowTop;
            if (r < 0 && spec.above) key = spec.above;
            qs = (clamp(r, 0, tn - 1) + 0.5) / tn;
          }
          if (key) { /* the wedge above the forehead */ }
          else if (drop > 0) {
            var jc = clamp(x - xl, 0, ncol - 1);
            if (ax < 0) jc = ncol - 1 - jc;
            var lo = dzu > 0 ? Math.ceil(drop / 2) : Math.floor(drop / 2);
            key = texelPri(spec, (jc + lo + 0.5) / tm, qs, 0, hv);
          } else key = texelPri(spec, s, qs, hu, hv);
        } else key = texel(spec, s, q);
        var ramp = RAMP[key];
        if (!ramp) continue;
        put(x, y, p0.z + dzu * s + dzv * q, ramp[band], 255, KIND);
      }
    }
  }
  function box(xf, x0, y0, z0, x1, y1, z1, tex) {
    var sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    face(xf, [x0, y1, z1], [1, 0, 0], [0, -1, 0], sx, sy, [0, 0, 1], pick(tex, 'f'));
    face(xf, [x1, y1, z0], [-1, 0, 0], [0, -1, 0], sx, sy, [0, 0, -1], pick(tex, 'b'));
    face(xf, [x1, y1, z1], [0, 0, -1], [0, -1, 0], sz, sy, [1, 0, 0], pick(tex, 'r'));
    face(xf, [x0, y1, z0], [0, 0, 1], [0, -1, 0], sz, sy, [-1, 0, 0], pick(tex, 'l'));
    face(xf, [x0, y1, z0], [1, 0, 0], [0, 0, 1], sx, sz, [0, 1, 0], pick(tex, 't'));
    face(xf, [x0, y0, z1], [1, 0, 0], [0, 0, -1], sx, sz, [0, -1, 0], pick(tex, 'd'));
  }
  // blob contact shadow, cast a little away from the light, with a denser core
  function shadow(cx, rx, ry) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var e = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (e > 1) continue;
      put(OX + cx + 1 + x, OY + y, -1e8, SHADOW, e < 0.4 ? 200 : 140, 2);
    }
  }
  // A soft dark halo one pixel round every solid shape. On the plain page it
  // is invisible (about 1.05:1), but over the lit homepage mosaic tiles it
  // keeps his shadow-side fills from melting into a bright tile. Halo pixels
  // stay kind 0, so they never catch the mouse.
  function halo() {
    for (var i = 0; i < W * H; i++) {
      if (kind[i] !== 0 || buf[i * 4 + 3] !== 0) continue;
      var x = i % W, y = (i / W) | 0;
      if ((x > 0 && solid(kind[i - 1])) || (x < W - 1 && solid(kind[i + 1])) ||
          (y > 0 && solid(kind[i - W])) || (y < H - 1 && solid(kind[i + W]))) {
        var o = i * 4; buf[o] = 6; buf[o + 1] = 5; buf[o + 2] = 9; buf[o + 3] = 150;
      }
    }
  }
  function line2d(a, b, c, alpha) {
    var n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) | 0;
    for (var i = 0; i <= n; i++) dot(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, c, alpha);
  }
  function glyph(rows, x, y, c, a) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) if (rows[j][i] === '#') dot(x + i, y + j, c, a);
  }
  var NOTE = ['.##', '.#.', '##.', '##.'], NOTE2 = ['.###', '.#.#', '##.#', '##.#'];
  var Z3 = ['###', '..#', '.#.', '###'], Z4 = ['####', '..#.', '.#..', '####'];
  var WAVE = ['#.', '.#', '.#', '#.'], WAVE_L = ['.#', '#.', '#.', '.#'];

  // ---------- Hendrik ----------
  function hendrik(root, p) {
    var lA = child(root, -1.9, 4.8, 0, p.lA[0], p.lA[1], p.lA[2]);
    box(lA, -1.3, -3.0, -1.3, 1.3, 0.3, 1.3, 'S');          // bare shin
    box(lA, -1.6, -4.8, -1.9, 1.6, -2.8, 2.5, SHOE);         // chunky sneaker
    var lB = child(root, 1.9, 4.8, 0, p.lB[0], p.lB[1], p.lB[2]);
    box(lB, -1.3, -3.0, -1.3, 1.3, 0.3, 1.3, 'S');
    box(lB, -1.6, -4.8, -1.9, 1.6, -2.8, 2.5, SHOE);
    box(root, -4.3, 4.6, -2.8, 4.3, 7.0, 2.8, SHORTS);       // board shorts, orange stripe on the sides
    box(root, -4, 6.8, -2.5, 4, 14.2, 2.5, TEE);             // crew-neck tee
    var aA = child(root, -5, 13.8, 0, p.aA[0], p.aA[1], p.aA[2]);
    box(aA, -1, -5.8, -1, 1, 0, 1, ARM);
    var aB = child(root, 5, 13.8, 0, p.aB[0], p.aB[1], p.aB[2]);
    box(aB, -1, -5.8, -1, 1, 0, 1, ARM);
    var head = child(root, 0, 14.8 + p.bob, 0, p.head[0], p.head[1], p.head[2]);   // on a short neck: the shoulder tops show
    box(head, -5, 0, -4.5, 5, 9.0, 4.5, { f: FACES[p.face], r: HEAD.r, l: HEAD.l, b: HEAD.b, t: HEAD.t, d: HEAD.d });
    box(head, -6, 3.4, -0.9, -5, 6, 0.9, EAR_L);
    box(head, 5, 3.4, -0.9, 6, 6, 0.9, EAR_R);
    box(head, -5.5, 7.1, -5, 5.5, 9.2, 2.6, CROWN);          // crown and short sides, low at the back
    box(head, -5.0, 9.0, -3.6, 4.2, 10.3, 1.4, QUIFF_A);     // quiff in stepped clumps: a back step,
    box(head, -4.6, 9.25, 1.4, 3.6, 11.7, 5.0, QUIFF_A);     // the front volume (its overhang clears the forehead),
    box(head, -4.4, 11.7, 1.6, 1.6, 13.7, 5.8, QUIFF_B);     // a clump on top of it
    box(head, -4.2, 13.7, 3.0, 0.8, 15.1, 6.4, QUIFF_B);     // and a crest swept up, forward and to his right
    box(root, -1.7, 13.6, -1.7, 1.7, 14.9, 1.7, 'S');          // neck
    if (p.phones) {                                          // dark over-ear headphones, band behind the quiff
      box(head, -6.4, 10.5, -3.6, 6.4, 11.9, -2.6, 'N');
      box(head, -6.4, 6.0, -3.6, -5.6, 10.5, -2.6, 'N');
      box(head, 5.6, 6.0, -3.6, 6.4, 10.5, -2.6, 'N');
      box(head, -6.8, 3.0, -2.2, -5.4, 6.4, 1.2, { all: 'N', l: 'A', t: 'A' });   // cups: the flat site accent
      box(head, 5.4, 3.0, -2.2, 6.8, 6.4, 1.2, { all: 'N', r: 'A', t: 'A' });
    }
    return { head: head, aA: aA, aB: aB };
  }

  // ---------- state ----------
  var state = { elapsed: 0, x: 0, y: 0 };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (saved && typeof saved.elapsed === 'number') state = saved;
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

  var mouse = null, moving = false, dir = 1, sd = 1, kd = 1, yaw = -0.45, t = 0, last = 0;
  var current = null, poof = 0, boxX = 0, boxY = 0;
  // hop: crouch on the ground, then a stretched take-off, an arc, and touch-down
  var HOP = 0.36, HOP_GROUND = 0.1, HOP_UP = 3.2;
  var hopT = 0, settle = 0, chasing = false;

  function activityIndex() {
    var i = 0;
    for (var k = 0; k < ACTIVITIES.length; k++) if (state.elapsed >= ACTIVITIES[k].at) i = k;
    return i;
  }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function pose() {
    var blink = (t % 3.7) < 0.13;
    return { x: 0, y: 0, rx: 0, rz: 0, yaw: yaw, sq: 1, bob: 0,
      head: [0, 0, 0], aA: [0, 0, -0.12], aB: [0, 0, 0.12], lA: [0, 0, 0], lB: [0, 0, 0],
      face: blink ? 'blink' : 'smile', phones: false };
  }
  function hopPose(p) {
    if (hopT < HOP_GROUND) { p.sq = 0.86; p.aA = [0, 0, -0.3]; p.aB = [0, 0, 0.3]; return; }
    var u = (hopT - HOP_GROUND) / (HOP - HOP_GROUND);
    p.y += HOP_UP * 4 * u * (1 - u);
    p.sq = u < 0.22 ? 1.12 : u < 0.78 ? 1 : 1.05;
    p.aA = [0.2, 0, -0.6]; p.aB = [0.2, 0, 0.6];             // arms flick out
    p.lA = [0.35, 0, 0]; p.lB = [0.35, 0, 0];                 // feet trail
  }
  function idle(p) {
    if (settle > 0) p.sq = 0.92;
    else p.bob = (t % 2.8) < 1.4 ? 0 : 1 / CP;                // a slow 1-px breath
  }
  function lookAtCursor(p) {
    if (!mouse) return;
    var look = clamp((mouse.x - state.x) / 150, -1.1, 1.1);
    if (Math.abs(look) < 0.5) look = look < 0 ? -0.5 : 0.5;
    p.head[1] = clamp(look - p.yaw, -0.6, 0.6);
    p.head[0] = clamp((mouse.y - (state.y - 50)) / 360, -0.12, 0.12);
  }
  function hopping() { return hopT > 0; }
  // snap the root to whole pixels so textures don't crawl on sub-pixel motion;
  // squash and stretch keep his volume (sx = sz = 1/sqrt(sy))
  function rootOf(p) {
    var w = 1 / Math.sqrt(p.sq);
    return child(WORLD, Math.round(p.x), Math.round(p.y * CP) / CP, 0, p.rx, p.yaw, p.rz, [w, p.sq, w]);
  }
  function contact(p, r) { shadow(0, Math.max(3, Math.round(r - Math.max(0, p.y) * 0.7)), 2); }

  // ---------- activities ----------
  function drawWalk() {
    var p = pose();
    if (hopping()) hopPose(p); else { lookAtCursor(p); idle(p); }
    contact(p, 6);
    hendrik(rootOf(p), p);
  }

  function drawPodcast() {
    var p = pose();
    p.phones = true;
    var talking = ((t / 2.4) | 0) % 3 !== 2;
    if (talking && ((t * 7) | 0) % 3 !== 0) p.face = 'talk';
    var hop = hopping();
    if (hop) {                                                  // the mic hand stays up at his chest mid-hop
      hopPose(p);
      p[dir > 0 ? 'aA' : 'aB'] = [-1.25, 0, dir > 0 ? 0.35 : -0.35];
    } else {
      idle(p); p.bob = 0;
      p.head[0] = 0.05 + (talking ? 0.04 * Math.sin(t * 9) : 0);
      p.aA = [-0.4, 0, -1.0 - 0.3 * Math.sin(t * 3.1)];         // talking with his free hand
    }
    contact(p, hop ? 6 : 7);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    if (hop) {                                                  // on the move he takes the mic off the stand
      var hm = child(dir > 0 ? parts.aA : parts.aB, 0, -6.0, 0, -0.6, 0, 0);   // the near hand
      box(hm, -0.5, -0.4, -0.5, 0.5, 1.4, 0.5, 'M');
      box(hm, -1.2, 1.4, -1.2, 1.2, 3.8, 1.2, { all: 'k', t: 'Z', d: 'N' });
    }
    if (!hop) {                                                 // mic on a stand, just under his mouth
      KIND = 5;
      box(root, 4.4, 0, 4.4, 8.4, 0.8, 8.4, 'M');
      box(root, 5.9, 0.8, 5.9, 6.9, 13.4, 6.9, 'M');
      box(root, 3.6, 12.6, 5.9, 6.9, 13.4, 6.9, 'M');
      box(root, 1.2, 12.2, 5.2, 3.8, 15.4, 7.8, { all: 'k', f: ['kkk', 'kkk', 'NNN'], l: ['kkk', 'kkk', 'NNN'], r: ['kkk', 'kkk', 'NNN'], t: 'Z', d: 'N' });
      KIND = 1;
    }
    if (talking && !hop) {                                      // voice on his free side, in the page's ink
      var c = project(toWorld(parts.head, [-5, 3, 4]));
      for (var i = 0; i < 2; i++) {
        var ph = (t * 1.6 + i / 2) % 1;
        glyph(WAVE_L, c.x - 3 - ph * 7, c.y - 3 - ph * 2, PAL.D, (1 - ph) * 0.6);
      }
    }
  }

  function drawSurf(dt) {
    sd += (dir - sd) * (1 - Math.exp(-dt * 5));
    var swell = Math.sin(t * 2.6) * 0.7;
    var p = pose();
    p.yaw = 0; p.y = 3.4 + swell; p.rx = 0.18; p.rz = -sd * 0.12;
    p.lA = [0.05, 0, -0.42]; p.lB = [-0.05, 0, 0.42];
    var fwd = sd > 0 ? 'aB' : 'aA', back = sd > 0 ? 'aA' : 'aB';
    p[fwd] = [-0.3, 0, dir * (1.1 + 0.1 * Math.sin(t * 2))];      // front arm low and forward
    p[back] = [0.2, 0, -dir * (2.2 + 0.1 * Math.sin(t * 2 + 1))];  // back arm up behind
    p.head[1] = sd * 0.6; p.head[0] = -0.18; p.head[2] = sd * 0.12;   // the body leans, the face stays upright
    var root = rootOf(p);
    KIND = 5;
    box(root, -8.6, -1, -2.6, 8.6, 0, 2.6, { all: 'C', t: function (u, v) { return v > 0.4 && v < 0.6 ? 'O' : 'C'; }, d: 'c' });
    box(root, 8.6, -1, -1.6, 10.2, 0, 1.6, 'C');
    KIND = 1;
    hendrik(root, p);
    // a small oval of sea that rises into a breaking wave behind him
    KIND = 7;
    for (var xi = -18; xi < 18; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 18, 2)));
      var d = -xi * sd;
      var crest = d > 4 ? Math.min(10, (d - 4) * 1.3) * e * (0.92 + 0.08 * Math.sin(t * 3)) : 0;
      var h = (2 + 0.6 * Math.sin(xi / 4 + t * 4)) * e + crest;
      box(WORLD, xi, -1.2, -5.6 * e, xi + 2, h, 0.8 + 2.4 * e + crest * 0.25,
        { all: 'B', t: crest > 7 ? 'f' : 'a', f: function (u, v) { return v < 0.14 ? 'a' : 'B'; } });
      if (crest > 6) box(WORLD, sd > 0 ? xi + 2 : xi - 3, h - 1.6, -4 * e, sd > 0 ? xi + 5 : xi, h + 0.5, 0.4, { all: 'f', d: 'B' });
    }
    KIND = 1;
    for (var s2 = 0; s2 < 5; s2++) {                            // spray: short dashes trailing him
      var sp = (t * 1.4 + s2 / 5) % 1, sx = OX - dir * (9 + s2 * 1.4) - dir * sp * 4, sy = OY - 9 - sp * 5 + (s2 % 2) * 2;
      dot(sx, sy, PAL.f, (1 - sp) * 0.9); dot(sx - dir, sy, PAL.f, (1 - sp) * 0.5);
    }
  }

  function drawSax() {
    var p = pose();
    var hop = hopping();
    if (hop) hopPose(p);
    else { p.rx = -0.08; p.rz = 0.07 * Math.sin(t * 2.8); p.y = -1.1 * Math.abs(Math.sin(t * 2.8)); p.head[0] = 0.1; }
    p.aA = [-1.1, 0, 0.8]; p.aB = [-1.3, 0, -0.6];
    contact(p, 7);
    var root = rootOf(p);
    hendrik(root, p);
    // a tilted alto: neck at his mouth, body across his front, bell flaring out past his hip
    var sax = child(root, 2.2, 10.6, 5.8, 0, 0, 0.42);
    box(sax, -0.8, -4.6, -0.8, 0.8, 3.6, 0.8, 'Y');
    box(sax, -0.7, -6.0, -0.9, 3.8, -4.6, 0.9, 'y');
    box(sax, 2.0, -4.6, -1.0, 4.0, -1.2, 1.0, 'Y');
    box(sax, 0.8, -1.2, -2.4, 5.6, 0.8, 2.4, { all: 'Y', t: ['yyyyy', 'yqqqy', 'yqqqy', 'yyyyy'] });
    box(sax, -0.4, 3.6, -0.4, 0.4, 5.4, 0.4, 'Y');
    box(root, -0.5, 15.6, 4.4, 0.5, 17.2, 6.0, 'y');         // the brass neck runs on into his mouth
    if (!hop) {
      var b = project(toWorld(sax, [3, 0.2, 0]));
      for (var n = 0; n < 3; n++) {
        var ph = (t * 0.55 + n / 3) % 1;
        glyph(n === 1 ? NOTE2 : NOTE, b.x + 2 + n * 3 + Math.sin(ph * 6 + n) * 2, b.y - 5 - ph * 13, n === 1 ? PAL.l : PAL.D, (1 - ph) * 0.85);
      }
    }
  }

  function lerp3(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  // a frame at a world point that keeps the root's orientation (props that stay upright in his hand)
  function at(par, wp, rx) { return { m: mulM(par.m, rot(rx || 0, 0, 0)), t: wp }; }
  var SHAKE_UP = [-0.9, 0, 1.25], POUR = [-2.6, 0, 0.4], TIP = 1.9;
  function drawCocktail() {
    var p = pose();
    var hop = hopping();
    // loop (3.4 s): a beat with the shaker up, shake for a second, a quick
    // swing down, a long pour while the drink rises, then swing back up
    var ph = t % 3.4, sh = 0, tip = 0, pouring = false;
    if (hop) { hopPose(p); p.aB = [-0.3, 0, 0.5]; }
    else {
      p.aA = [-0.9, 0, 0.35]; p.head[0] = 0.08;
      if (ph < 0.2) p.aB = SHAKE_UP;
      else if (ph < 1.2) { sh = Math.sin(t * 17) * 0.3; p.aB = [SHAKE_UP[0] + sh, 0, SHAKE_UP[2]]; }
      else if (ph < 1.32) { var k1 = (ph - 1.2) / 0.12; p.aB = lerp3(SHAKE_UP, POUR, k1); tip = TIP * k1; }
      else if (ph < 2.9) { p.aB = POUR; tip = TIP; pouring = ph > 1.34 && ph < 2.7; }
      else { var k2 = (ph - 2.9) / 0.5; p.aB = lerp3(POUR, SHAKE_UP, k2); tip = TIP * (1 - k2); }
    }
    contact(p, hop ? 6 : 10);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    var shaker = at(root, toWorld(parts.aB, [0, -6.0, 0]), tip + sh * 0.4);
    box(shaker, -1.1, -0.6, -1.1, 1.1, 3.2, 1.1, { all: 'z', l: 'Z', t: 'Z', f: ['zZz', 'NNN', 'zZz', 'zZz'] });
    box(shaker, -0.8, 3.2, -0.8, 0.8, 4.4, 0.8, 'Z');
    box(shaker, -0.4, 4.4, -0.4, 0.4, 5.0, 0.4, 'z');
    if (!hop) {                                               // the bar: counter, light top, a highball and a bottle
      KIND = 5;
      box(root, -9, 0, 3.4, 9, 5.2, 7.6, 'R');
      box(root, -9.8, 5.2, 2.8, 9.8, 6.2, 8.2, { all: 'u', t: 'u' });
      var level = pouring ? 0.25 + 0.75 * Math.min(1, (ph - 1.34) / 1.2) : ph < 1.34 ? 0.25 : 1;
      var fill = 6.2 + Math.round(3.6 * level);               // the drink rises while he pours
      box(root, 5.8, 6.2, 6.0, 8.2, fill, 8.4, { all: 'd', t: 'l' });
      if (fill < 10.2) box(root, 5.8, fill, 6.0, 8.2, 10.2, 8.4, { all: 'w', t: null });
      box(root, -7.8, 6.2, 4.4, -5.2, 10.4, 7.0, 'x');
      box(root, -7.0, 10.4, 5.2, -6.0, 12.4, 6.2, 'x');
      KIND = 1;
      if (sh > 0) { var c = project(toWorld(shaker, [0, 2, 0])); glyph(WAVE, c.x + 3, c.y - 3, PAL.D, 0.7); }
      if (pouring) {                                          // the pour, from the shaker's mouth into the glass
        var m0 = project(toWorld(shaker, [0, 5.0, 0])), g0 = project(toWorld(root, [7.0, 10.2, 7.2]));
        line2d(m0, g0, PAL.l, 0.9);
      }
    }
  }

  function drawKite(dt) {
    kd += (dir - kd) * (1 - Math.exp(-dt * 4));
    var bob = Math.sin(t * 2.4) * 0.5;
    var p = pose();
    p.yaw = 0; p.y = 2.4 + bob; p.rz = kd * 0.26;
    p.lA = [0, 0, -0.3]; p.lB = [0, 0, 0.3];
    p.aA = [-0.3, 0, kd * 1.7]; p.aB = [-0.3, 0, kd * 1.7];
    p.head[1] = kd * 0.45; p.head[0] = -0.08; p.head[2] = -kd * 0.26;   // lean into the pull, face upright
    var root = rootOf(p);
    KIND = 5;
    box(root, -5.6, -1, -2.1, 5.6, 0, 2.1, { all: 'N', t: 'M', d: 'N' });   // a mauve-grey plank under white sneakers
    KIND = 1;
    var parts = hendrik(root, p);
    var bar = child(kd > 0 ? parts.aB : parts.aA, 0, -6.2, 0, 0, 0, 0);
    box(bar, -0.5, -0.5, -3.6, 0.5, 0.5, 3.6, { all: 'M', l: 'D', r: 'D' });
    // a small oval of choppy sea with scattered whitecaps
    KIND = 7;
    var tick = (t * 6) | 0;
    for (var xi = -16; xi < 16; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 16, 2)));
      var h = (1.3 + 0.5 * Math.sin(xi / 3 + t * 6)) * e;
      (function (xc) {
        box(WORLD, xc, -1.2, -5.6 * e, xc + 2, h, 0.8 + 2.4 * e + (Math.sin(xc * 1.3 + t * 3) > 0 ? 0.6 : 0), {
          all: 'B', f: function (u, v) { return v < 0.2 ? 'a' : 'B'; },
          t: function (u, v) { return Math.abs(xc + 1) > 6 && ((xc * 3 + ((v * 4) | 0) * 7 + tick) % 9) === 0 ? 'f' : 'a'; }   // whitecaps clear of his feet
        });
      })(xi);
    }
    // the kite: one solid orange canopy with a pale leading edge; it arcs over when he turns
    KIND = 5;
    var kx = kd * 10.4, ky = 28 + 4 * (1 - kd * kd) + Math.sin(t * 1.3) * 1;
    var kite = child(WORLD, kx, ky, -5, 0, 0, Math.sin(t * 1.3) * 0.08 - (kd * 0.25));
    for (var i = 0; i < 7; i++) {
      var sx = (i - 3) * 2.3, sy = -0.45 * (i - 3) * (i - 3);
      box(kite, sx - 1.2, sy, -1.3, sx + 1.2, sy + 1.3, 1.3, { all: 'O', t: 'C', d: 'O' });
    }
    KIND = 1;
    var b1 = project(toWorld(bar, [0, 0, -3.6])), b2 = project(toWorld(bar, [0, 0, 3.6]));
    var k1 = project(toWorld(kite, [-8, -5.8, 0])), k2 = project(toWorld(kite, [8, -5.8, 0]));
    line2d(b1, k1, PAL.D, 0.45); line2d(b2, k2, PAL.D, 0.45);
    for (var s = 0; s < 5; s++) {
      var sp = (t * 2.2 + s / 5) % 1, sx2 = OX - dir * (7 + s * 1.5 + sp * 4), sy2 = OY - 2 - sp * 4 - (s % 3);
      dot(sx2, sy2, s % 2 ? PAL.f : PAL.a, (1 - sp) * 0.9); dot(sx2 - dir, sy2, PAL.f, (1 - sp) * 0.45);
    }
  }

  function drawSleep() {
    shadow(0, 15, 2);
    KIND = 5;                                                 // the couch
    box(WORLD, -11.2, 0.8, -4, 11.2, 4, 4, { all: 'V', t: 'V', f: ['VVVVVVVVVVVVVVVVVVVVVV', 'VVVVVVVVVVVVVVVVVVVVVV', 'vvvvvvvvvvvvvvvvvvvvvv'] });
    box(WORLD, -11.2, 4, -4, 11.2, 16.4, -1.8, { all: 'v', t: 'V', f: 'V' });
    box(WORLD, -14, 0.8, -4, -11.2, 9.6, 4, { all: 'v', t: 'V', f: 'V' });
    box(WORLD, 11.2, 0.8, -4, 14, 9.6, 4, { all: 'v', t: 'V', f: 'V' });
    box(WORLD, -13, 0, 2.4, -12, 0.8, 3.4, 'N'); box(WORLD, 12, 0, 2.4, 13, 0.8, 3.4, 'N');
    KIND = 1;
    // Hendrik out cold on his side, head propped on the armrest, under a throw
    var p = pose();
    p.face = 'sleep'; p.yaw = 0;
    p.aB = [0, 0.93, -1.57]; p.aA = [0, 0, 0];
    var breathe = (t % 3) < 1.5 ? 0 : 1;
    var root = child(WORLD, 13.0, 9.2, 0.5, 0, 0, Math.PI / 2);
    hendrik(root, p);
    box(WORLD, -1.4, 3.6, -2.4, 9.2, 13.4 + breathe, 3.4, {
      all: 'I', l: 'i',
      f: function (u, v) { return v < 0.12 ? 'O' : 'I'; },  // an orange hem along the throw's top edge
      t: 'I'
    });
    var hp = project([-9, 15, 0]);
    for (var z = 0; z < 3; z++) {
      var ph = (t * 0.32 + z / 3) % 1;                        // each z fades in above his head, then drifts off
      glyph(ph < 0.5 ? Z3 : Z4, hp.x + ph * 7 + z, hp.y - 7 - ph * 12, PAL.D, Math.min(1, ph * 4) * (1 - ph) * 0.7);
    }
  }

  var DRAW = { walk: drawWalk, podcast: drawPodcast, surf: drawSurf, sax: drawSax, cocktail: drawCocktail, kite: drawKite, sleep: drawSleep };

  // ---------- loop ----------
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!(dt > 0)) return;
    t += dt;
    state.elapsed += dt;

    var act = ACTIVITIES[activityIndex()];
    if (current !== act.id) { if (current) poof = 0.4; current = act.id; hopT = 0; }

    // follow the cursor (asleep, he stays on his couch); on foot he only
    // travels while he is in the air, so each hop carries him forward.
    // Hysteresis: a chase starts only once the cursor has gone 30 px from his
    // spot and then runs until he is back within 6 px, so reading-style
    // cursor drift doesn't set off a hop on every nudge.
    moving = false;
    var inView = keepInView();
    if (mouse && act.speed > 0 && inView) {
      var off = act.off || OFFSET_X;
      var tx = mouse.x + off * (mouse.x > window.innerWidth - 160 ? -1 : 1);
      var ty = Math.min(window.innerHeight - 6, mouse.y + OFFSET_Y);
      var dx = tx - state.x, dy = ty - state.y, d = Math.hypot(dx, dy);
      if (d > (chasing ? 6 : 30)) {
        moving = chasing = true;
        if (Math.abs(dx) > 3) dir = dx > 0 ? 1 : -1;
        var glide = act.hop ? (hopT < HOP_GROUND ? 0 : HOP / (HOP - HOP_GROUND)) : 1;
        var stepLen = Math.min(d, act.speed * glide * dt * (d > 300 ? 1.5 : 1));
        state.x += dx / d * stepLen; state.y += dy / d * stepLen;
      } else chasing = false;
    } else chasing = false;
    if (act.hop && (moving || hopT >= HOP_GROUND)) {          // an airborne hop always lands
      hopT += dt;
      if (hopT >= HOP) { if (moving) hopT -= HOP; else { hopT = 0; settle = 0.14; } }
    } else hopT = 0;
    if (settle > 0) settle -= dt;

    // at rest he stands three-quarter on (so his sides show), turned toward the cursor
    var target = 0;
    if (act.hop) {
      if (moving) target = dir * 0.75;
      else if (mouse) target = (mouse.x < state.x ? -1 : 1) * clamp(0.45 + Math.abs(mouse.x - state.x) / 400, 0.45, 0.7);
      else target = -0.45;
      if (!moving && act.id === 'sax') target = clamp(target + 0.3, -0.62, 0.62); // keep the 10-px face readable
    }
    yaw += (target - yaw) * (1 - Math.exp(-dt * 7));

    clear();
    KIND = 1;
    DRAW[act.id](dt);
    halo();
    if (poof > 0) {                                           // a few squares, not a sparkle
      poof -= dt;
      var k = 1 - poof / 0.4, rad = 4 + k * 10;
      for (var a = 0; a < 6; a++) {
        var ax = Math.round(OX + Math.cos(a * 1.047) * rad), ay = Math.round(OY - 11 + Math.sin(a * 1.047) * rad * 0.6);
        var al = poof / 0.4 * 0.8;
        dot(ax, ay, PAL.D, al); dot(ax + 1, ay, PAL.D, al); dot(ax, ay + 1, PAL.D, al); dot(ax + 1, ay + 1, PAL.D, al);
      }
    }
    ctx.putImageData(img, 0, 0);

    boxX = Math.round(state.x - OX * SCALE);
    boxY = Math.round(state.y - OY * SCALE);
    canvas.style.transform = 'translate(' + boxX + 'px,' + boxY + 'px)';
  }

  // The canvas box is bigger than Hendrik and sits next to the cursor, so it
  // only takes the mouse over Hendrik himself — never over scenery or water.
  function overPet(cx, cy) {
    var lx = ((cx - boxX) / SCALE) | 0, ly = ((cy - boxY) / SCALE) | 0;
    if (lx < 0 || ly < 0 || lx >= W || ly >= H) return false;
    return kind[ly * W + lx] === 1;
  }
  window.addEventListener('mousemove', function (e) {
    mouse = { x: e.clientX, y: e.clientY };
    canvas.style.pointerEvents = overPet(e.clientX, e.clientY) ? 'auto' : 'none';
  });
  window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse = null; });
  window.addEventListener('pagehide', save);
  canvas.addEventListener('click', function () {
    // asleep → wake up and start the day again; otherwise skip ahead
    var idx = activityIndex();
    state.elapsed = ACTIVITIES[idx].id === 'sleep' ? 0 : ACTIVITIES[idx + 1].at;
    save();
  });

  function start() {
    document.body.appendChild(canvas);
    last = performance.now();
    requestAnimationFrame(frame);
    setInterval(save, 1000);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
