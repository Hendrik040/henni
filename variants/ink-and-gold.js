/* ═══════════════════════════════════════════════════════════════
   krackedtools.dev — site pet, variant "Ink & Gold".

   The same voxel Hendrik (same rig, same size) in a casual tee and
   jeans, drawn in the site's own ink: page #131118, paper #26212f, mid
   #5e5672, ink-soft #b3abc2 and white ink #ece9f1. His golden quiff and
   peach face are the only warm masses on him, and the site orange
   #ff570a appears on exactly one element per scene: his over-ear
   headphone cups (walking, podcasting, playing sax, asleep), the board
   rail (surf), the drink he mixes and carries (cocktail) or the kite
   canopy.

   He is still a real 3D model: textured boxes rendered by a tiny
   z-buffered software rasterizer, about one voxel per art pixel, scaled
   up pixel-sharp. Light comes from the top-left like the homepage tiles.
   Every face picks its colour from a short hand-made ramp by how much
   light it gets (shadow / lit / top) instead of multiplying RGB, so a
   frame uses fewer than 20 colours. Where one part passes in front of
   another, an ink-soft crease draws the edge. His dark fills get a 1-px
   outline, white ink where the light hits his top and left edges (like
   the lit edges of the homepage tiles) and ink-soft on the bottom and
   right; never around the face or the hair. Scenery stays quieter, with
   a mauve line and no lit edge. Overlays (notes, voice, Z's, spray)
   always pass behind him, and the frame is only rasterized again when
   the 10 fps pose clock ticks or his turn or stride changes.

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
  var ACTIVITIES = [
    { id: 'walk',     at: 0,   speed: 120 },
    { id: 'podcast',  at: 35,  speed: 70 },
    { id: 'surf',     at: 80,  speed: 200, off: 58 },
    { id: 'sax',      at: 125, speed: 80 },
    { id: 'cocktail', at: 170, speed: 70 },
    { id: 'kite',     at: 215, speed: 220 },
    { id: 'sleep',    at: 260, speed: 0 }
  ];

  // ---- Render target ----
  var W = 72, H = 64;               // art pixels (≈ one voxel per pixel)
  var SCALE = 3;                    // CSS px per art pixel
  var OX = 36, OY = 55;             // art pixel under his feet
  var PITCH = 0.38;                 // camera looks down ~22°
  var CP = Math.cos(PITCH), SP = Math.sin(PITCH);
  var OFFSET_X = 38, OFFSET_Y = 34; // where his feet go relative to the cursor
  var STORE = 'kt-pet';

  // ---- Light: key from the top-left, like the homepage tiles ----
  var L = norm([-0.6, 0.65, 0.75]);
  var AMB = 0.46, DIF = 0.78;       // bands: top 1.1, lit side ~1.0, front 0.8–0.9, shadow side 0.5
  var THR = 0.45;                   // a crease needs the neighbouring part this much closer (voxels)

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

  // ---------- palette: every colour is registered once and flagged by contrast ----------
  // A fill below 3:1 on the page (#131118) is "dark": it gets the ink-soft outline.
  var COLS = [], DARK = [];
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  var LBG = lum([19, 17, 24]);
  function col(h) {
    var c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    for (var i = 0; i < COLS.length; i++) if (COLS[i][0] === c[0] && COLS[i][1] === c[1] && COLS[i][2] === c[2]) return i;
    var lc = lum(c);
    COLS.push(c); DARK.push((Math.max(lc, LBG) + 0.05) / (Math.min(lc, LBG) + 0.05) < 3 ? 1 : 0);
    return COLS.length - 1;
  }
  // site ink
  var PAPER = col('#26212f'), MID = col('#5e5672'), SOFT = col('#b3abc2'), INK = col('#ece9f1');
  var SCEN = col('#7d7492'), CAST = col('#060509'), EYE = col('#1b1720'), ORANGE = col('#ff570a');
  // Ramps: [one step down (roots, hems, lines), shadow side (≤0.6), lit front (0.7–0.9), top (≥1.0), highlight].
  // A key's offset moves along its ramp; 'line' is the crease colour when two light parts meet.
  function ramp(hs, line) { return { s: hs.map(col), line: line }; }
  var RAMPS = {
    // light peach skin: still the brightest mass on him, 15.8 L* above the hair midtone
    skin:  ramp(['#c99a85', '#e4bba5', '#f8d6c1', '#ffe8da', '#ffe8da'], col('#c99a85')),
    // stubble: one golden-grey step 8.7 L* under the skin, enough to show at 3x without reading
    // as shadow (2-step ramp, so it adds a single colour)
    stub:  ramp(['#c99a85', '#c99a85', '#d9c0a7', '#f8d6c1', '#f8d6c1'], col('#c99a85')),
    // sandy gold, like his hair in daylight: 0.82x the chroma of a saturated gold at the same lightness
    hair:  ramp(['#684825', '#a07741', '#d1ac6b', '#ebd299', '#f7e9c0'], col('#684825')),
    tee:   ramp(['#26212f', '#3a3346', '#5e5672', '#7d7492', '#7d7492'], SOFT),
    // jeans: the lit front sits a clear step above the paper shadow side, so the legs read as volumes
    jean:  ramp(['#26212f', '#26212f', '#4a4259', '#5e5672', '#5e5672'], SOFT),
    shoe:  ramp(['#5e5672', '#5e5672', '#b3abc2', '#ece9f1', '#ece9f1'], MID),
    gear:  ramp(['#26212f', '#26212f', '#5e5672', '#b3abc2', '#b3abc2'], SOFT),
    prop:  ramp(['#26212f', '#26212f', '#26212f', '#b3abc2', '#ece9f1'], SOFT),
    cloth: ramp(['#3a3346', '#3a3346', '#5e5672', '#b3abc2', '#b3abc2'], SOFT),
    steel: ramp(['#5e5672', '#5e5672', '#b3abc2', '#ece9f1', '#ece9f1'], MID),
    // Downwell's rule, "blue only for water", in the homepage mosaic's own Golden Gate teal
    // (its brightest tiles measure about #40606a-#4d7876)
    water: ramp(['#1c2d35', '#1c2d35', '#2b4954', '#4d7884', '#a6c8cc'], -1)
  };
  var MATS = [];
  for (var rk in RAMPS) { RAMPS[rk].id = MATS.length; MATS.push(RAMPS[rk]); }
  // texel keys → ramp (+ offset, or a fixed step) or one flat colour
  var KEY = {
    S: { r: 'skin' }, s: { r: 'skin', o: -1 }, t: { r: 'stub' },
    E: { c: EYE }, m: { c: EYE }, w: { c: INK }, b: { r: 'hair', fix: 1 },
    H: { r: 'hair' }, h: { r: 'hair', o: -1 }, G: { r: 'hair', o: 1 },
    T: { r: 'tee' }, q: { r: 'tee', o: -1 }, I: { c: SOFT },
    J: { r: 'jean' }, c: { r: 'jean', o: 1 },
    N: { r: 'shoe' }, n: { r: 'shoe', o: -1 },
    A: { c: ORANGE }, M: { r: 'gear' },
    P: { r: 'prop' }, p: { r: 'prop', o: -1 },
    K: { r: 'steel' }, D: { c: INK },
    Y: { r: 'hair' }, y: { r: 'hair', o: -1 }, C: { r: 'cloth' },
    B: { r: 'water' }, a: { r: 'water', o: 1 }, f: { c: INK }
  };
  for (var kk in KEY) if (KEY[kk].r) KEY[kk].R = RAMPS[KEY[kk].r];
  var GLYPH = COLS[SOFT], GLYPH_HI = COLS[INK];          // overlays: notes, waves, z's

  // ---- Textures (rows top→bottom; side faces read front→back) ----
  function rev(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }
  function swap(rows, i, row) { var c = rows.slice(); c[i] = row; return c; }
  // forehead with faded temples, golden-brown brows, 1x2 eyes, an upturned toothy grin (dark corners
  // raised a row above the teeth, a soft peach lower lip; a dark lip under the teeth read as a shout),
  // stubble on the jaw
  var FACE = ['hSSSSSSh', 'SbbSSbbS', 'SSESSESS', 'SSESSESS', 'SSSSSSSS', 'SmSSSSmS', 'tmwwwwmt', 'ttsssstt'];
  var FACES = {
    smile: FACE,
    blink: swap(swap(FACE, 2, 'SSSSSSSS'), 3, 'SEESSEES'),
    talk: swap(swap(swap(FACE, 5, 'SSSSSSSS'), 6, 'tSmwwmSt'), 7, 'ttSmmStt'),
    sleep: swap(swap(swap(swap(swap(FACE, 2, 'SSSSSSSS'), 3, 'SEESSEES'), 5, 'SSSSSSSS'), 6, 'tSSSSSSt'), 7, 'ttSmmStt')
  };
  for (var fk in FACES) { FACES[fk].level = true; FACES[fk].lit = 0.85; }
  var PRI = 'Emwb'; // features that must survive minification, most important first
  var HEAD_R = ['HHHHHHHH', 'SHHHHHHH', 'SShhhhhh', 'SSSSSShh', 'SSSSSShh', 'SSSSSShh', 'tSSSSShh', 'ttSSSSSs'];
  var HEAD = {
    r: HEAD_R, l: rev(HEAD_R),
    b: ['HHHHHHHH', 'HHHHHHHH', 'hhhhhhhh', 'hhhhhhhh', 'hhhhhhhh', 'hhhhhhhh', 'shhhhhhs', 'ssssssss'],
    t: 'H', d: 's'
  };
  var CAP_T = ['HGHHHGHH'];                                   // sheen lines combed front to back
  var CROWN = { all: 'H', t: CAP_T };
  var FRONT = { all: 'H', t: CAP_T };
  var QUIFF = { all: 'H', t: 'G' };
  var NOSE = { all: 'S', d: 's', r: 's' };
  var BAND = 'I';
  // orange cups with grey tops that continue the band: facing the camera, both cups showed at once
  // and pushed the orange to 6% of him; with grey tops it stays at or under 4% at every turn
  var CUP_L = { all: 'A', r: 'M', b: 'M', t: 'M' }, CUP_R = { all: 'A', l: 'M', b: 'M', t: 'M' };
  // short-sleeve tee: a darker crew-neck U under the chin, sleeves to the elbow; no collar points, no chest mark
  // the top face is one step down, level with the lit front, so the shoulders never read as padded;
  // a 1-px hem at the waist keeps tee and jeans two garments, not one grey onesie
  var TORSO = {
    f: ['TTTTTTTT', 'TqTTTTqT', 'TTqqqqTT', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT', 'qqqqqqqq'],
    t: 'q', all: 'T'
  };
  var SLEEVE = ['TTT', 'TTT', 'TTT', 'TTT', 'qqq', 'SSS', 'SSS', 'SSS', 'SSS'];
  var ARM = { all: SLEEVE, t: 'T', d: 'S' };
  var LEG = { all: ['JJJ', 'JJJ', 'JJJ', 'JJJ', 'JJJ', 'JJJ', 'ccc'], d: 'J' };
  var SHOE = { all: ['NNNN', 'nnnn'], f: ['NNN', 'nnn'], b: ['NNN', 'nnn'], t: 'N', d: 'n' };

  // ---------- frame buffer ----------
  // kind: 0 empty · 1 Hendrik (+ what he holds) · 2 shadow · 3 his outline · 4 overlay
  //       5 scenery (couch, bar, boards, stand, kite) · 6 scenery outline · 7 water
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.title = 'Hendrik — click to change what he’s doing';
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:' + W * SCALE + 'px;height:' + H * SCALE + 'px;' +
    'z-index:60;image-rendering:pixelated;will-change:transform;pointer-events:none;' +
    'cursor:var(--cursor-hand,pointer);';
  var ctx = canvas.getContext('2d');
  var img = ctx.createImageData(W, H), buf = img.data;
  var N = W * H;
  var zb = new Float32Array(N), kind = new Uint8Array(N), grp = new Uint16Array(N);
  var cix = new Uint8Array(N), mat = new Int8Array(N), stp = new Int8Array(N), dk = new Uint8Array(N);
  var isFace = new Uint8Array(N), alpha = new Uint8Array(N), mark = new Int16Array(N);
  var KIND = 1, partId = 0, curFace = 0, groups = {};

  function clear() {
    buf.fill(0); zb.fill(-1e9); kind.fill(0); grp.fill(0); isFace.fill(0); mat.fill(-1);
    partId = 0; groups = {};
  }
  function solid(k) { return k === 1 || k === 5 || k === 7; }
  function put(x, y, z, ci, mi, si, k) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x;
    if (z <= zb[i]) return;
    zb[i] = z; kind[i] = k; grp[i] = partId; cix[i] = ci; mat[i] = mi; stp[i] = si;
    dk[i] = DARK[ci]; isFace[i] = curFace; alpha[i] = 255;
  }
  function dot(x, y, c, a) { // 2D overlay pixel (no depth test), drawn after the passes
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    var i = y * W + x, o = i * 4, k = Math.min(1, a);
    var ba = buf[o + 3] / 255, na = k + ba * (1 - k);
    buf[o] = (c[0] * k + buf[o] * ba * (1 - k)) / na;
    buf[o + 1] = (c[1] * k + buf[o + 1] * ba * (1 - k)) / na;
    buf[o + 2] = (c[2] * k + buf[o + 2] * ba * (1 - k)) / na;
    buf[o + 3] = na * 255;
    if (!solid(kind[i]) && kind[i] !== 3) kind[i] = 4;
  }

  // ---------- textured box rasterizer ----------
  function texel(spec, u, v) {
    if (typeof spec === 'string') return spec;
    if (typeof spec === 'function') return spec(u, v);
    var row = spec[Math.min(spec.length - 1, (v * spec.length) | 0)];
    return row.charAt(Math.min(row.length - 1, (u * row.length) | 0));
  }
  // When a texture is drawn smaller than its texel grid, look across the
  // texels this pixel covers and keep the most important feature (eyes,
  // mouth) so it never drops out.
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
    var wn = mulV(xf.m, n);
    var nx = wn[0], ny = wn[1] * CP - wn[2] * SP, nz = wn[1] * SP + wn[2] * CP;
    if (nz <= 0.02) return;                                     // facing away
    var shade = Math.min(1.1, Math.round((AMB + DIF * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])) * 10) / 10);
    if (spec.lit) shade = Math.max(shade, spec.lit);            // the face never drops into deep shadow
    var band = shade <= 0.6 ? 0 : shade <= 0.9 ? 1 : 2;         // which ramp step this face gets
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
    // faces: keep texel rows level on screen and sample features with priority
    var lev = !!spec.level, lvl = false, hu = 0, hv = 0;
    if (lev) {
      var tm = spec[0].length, tn = spec.length;
      lvl = bx * bx < 0.15 * by * by;
      var lu = lvl ? Math.abs(ax) : Math.hypot(ax, ay), lv = lvl ? Math.abs(by) : Math.hypot(bx, by);
      hu = lu < 0.97 * tm ? (tm / lu - 1) / 2 + 0.02 : 0;
      hv = lv < 0.97 * tn ? (tn / lv - 1) / 2 + 0.02 : 0;
    }
    for (var y = y0; y <= y1; y++) {
      var dy = y + 0.5 - p0.y;
      for (var x = x0; x <= x1; x++) {
        var dx = x + 0.5 - p0.x;
        var s = (dx * by - dy * bx) / det, q = (ax * dy - ay * dx) / det;
        if (s < -0.02 || q < -0.02 || s > 1.02 || q > 1.02) continue;
        s = s < 0 ? 0 : s > 0.9999 ? 0.9999 : s;
        q = q < 0 ? 0 : q > 0.9999 ? 0.9999 : q;
        var key;
        if (lev) {
          var qs = lvl ? clamp((dy - 0.5 * ay) / by, 0, 0.9999) : q;
          key = texelPri(spec, s, qs, hu, hv);
        } else key = texel(spec, s, q);
        var K = KEY[key];
        if (!K) continue;
        if (K.R) {
          var R = K.R, si = K.fix !== undefined ? K.fix : clamp(1 + band + (K.o || 0), 0, R.s.length - 1);
          put(x, y, p0.z + dzu * s + dzv * q, R.s[si], R.id, si, KIND);
        } else put(x, y, p0.z + dzu * s + dzv * q, K.c, -1, 0, KIND);
      }
    }
  }
  // Every box is its own part for creases unless it names a group
  // (head + nose; all hair; the headphones) so seams inside a group stay clean.
  function box(xf, x0, y0, z0, x1, y1, z1, tex, g) {
    if (g) { if (!groups[g]) groups[g] = ++partId; } else ++partId;
    var keep = partId;
    if (g) partId = groups[g];
    var sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    face(xf, [x0, y1, z1], [1, 0, 0], [0, -1, 0], sx, sy, [0, 0, 1], pick(tex, 'f'));
    face(xf, [x1, y1, z0], [-1, 0, 0], [0, -1, 0], sx, sy, [0, 0, -1], pick(tex, 'b'));
    face(xf, [x1, y1, z1], [0, 0, -1], [0, -1, 0], sz, sy, [1, 0, 0], pick(tex, 'r'));
    face(xf, [x0, y1, z0], [0, 0, 1], [0, -1, 0], sz, sy, [-1, 0, 0], pick(tex, 'l'));
    face(xf, [x0, y1, z0], [1, 0, 0], [0, 0, 1], sx, sz, [0, 1, 0], pick(tex, 't'));
    face(xf, [x0, y0, z1], [1, 0, 0], [0, 0, -1], sx, sz, [0, -1, 0], pick(tex, 'd'));
    partId = keep;
  }
  // contact shadow in the tiles' cast-shadow colour, a little away from the light
  function shadow(cx, rx, ry) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var e = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (e > 1) continue;
      var px = OX + cx + 2 + x, py = OY + y;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      var i = py * W + px;
      if (kind[i] !== 0) continue;
      kind[i] = 2; cix[i] = CAST; alpha[i] = e < 0.45 ? 200 : 140; zb[i] = -1e8;
    }
  }
  function neighbour(i, x, y, n) { // 0 up · 1 left · 2 right · 3 down
    return n === 0 ? (y > 0 ? i - W : -1) : n === 1 ? (x > 0 ? i - 1 : -1) : n === 2 ? (x < W - 1 ? i + 1 : -1) : (y < H - 1 ? i + W : -1);
  }
  // Ink passes: creases where a part passes in front of another, a lit
  // top-left edge on the light materials, then the selective outline.
  function finish() {
    var x, y, i, n, j;
    mark.fill(-1);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      var k = kind[i];
      if ((k !== 1 && k !== 5) || isFace[i]) continue;
      for (n = 0; n < 3; n++) {
        j = neighbour(i, x, y, n);
        if (j < 0 || (kind[j] !== 1 && kind[j] !== 5) || grp[j] === grp[i] || zb[j] - zb[i] <= THR) continue;
        if (dk[i] !== dk[j]) continue;                          // light against dark already reads
        var lc = dk[i] ? SOFT : (mat[i] >= 0 ? MATS[mat[i]].line : -1);
        if (lc < 0) continue;
        mark[i] = lc; break;
      }
    }
    for (i = 0; i < N; i++) if (mark[i] >= 0) { cix[i] = mark[i]; dk[i] = 0; mat[i] = -1; }
    // lit edge: his light materials step up one ramp step where the top or left side meets the page
    // (his alone: scenery keeps its quieter top and mauve line, so the props never shout as loud as he does)
    mark.fill(-1);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (kind[i] !== 1 || dk[i] || mat[i] < 0 || isFace[i]) continue;
      var up = neighbour(i, x, y, 0), lf = neighbour(i, x, y, 1);
      if ((up >= 0 && solid(kind[up])) && (lf >= 0 && solid(kind[lf]))) continue;
      var R = MATS[mat[i]], si = Math.min(R.s.length - 1, stp[i] + 1);
      if (R.s[si] !== cix[i] && !DARK[R.s[si]]) mark[i] = R.s[si];
    }
    for (i = 0; i < N; i++) if (mark[i] >= 0) cix[i] = mark[i];
    // selective outline: 1 px only next to fills below 3:1 (water: only the line on top).
    // His own outline is sel-out: white ink where the top-left light hits (his top and left
    // edges, like the lit edges of the homepage tiles), ink-soft on the bottom and right.
    // Scenery gets a quieter mauve line so he stays the focal point.
    mark.fill(-1);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (solid(kind[i])) continue;
      var hit = 0, litE = 0;
      for (n = 0; n < 4; n++) {
        j = neighbour(i, x, y, n);
        if (j < 0 || !solid(kind[j]) || !dk[j]) continue;
        if (kind[j] === 7 && n !== 3) continue;                   // water: only its top contour is drawn
        if (kind[j] === 1) { hit = 3; if (n >= 2) litE = 1; continue; }   // he is right of / below this pixel
        if (hit !== 3) hit = 6;
      }
      if (hit) mark[i] = hit * 2 + litE;
    }
    for (i = 0; i < N; i++) if (mark[i] > 0) {
      kind[i] = mark[i] >> 1; alpha[i] = 255;
      cix[i] = kind[i] === 3 ? ((mark[i] & 1) ? INK : SOFT) : SCEN;
    }
    // resolve to RGBA
    for (i = 0; i < N; i++) {
      var o = i * 4;
      if (kind[i] === 0) { buf[o + 3] = 0; continue; }
      var c = COLS[cix[i]];
      buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = kind[i] === 2 ? alpha[i] : 255;
    }
  }
  // lines and glyphs pass behind him: never blended over his pixels or his outline
  function inkDot(x, y, c, a) {
    var rx = Math.round(x), ry = Math.round(y);
    if (rx >= 0 && ry >= 0 && rx < W && ry < H && (kind[ry * W + rx] === 1 || kind[ry * W + rx] === 3)) return;
    dot(x, y, c, a);
  }
  function line2d(a, b, c, al) {
    var n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) | 0;
    for (var i = 0; i <= n; i++) inkDot(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, c, al);
  }
  // pageOnly: the glyph shows only on the open page (never on him, his outline or the scenery)
  function glyph(rows, x, y, c, a, pageOnly) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      if (rows[j][i] !== '#') continue;
      var gx = Math.round(x + i), gy = Math.round(y + j);
      if (pageOnly && gx >= 0 && gy >= 0 && gx < W && gy < H && kind[gy * W + gx] !== 0 && kind[gy * W + gx] !== 2) continue;
      inkDot(gx, gy, c, a);
    }
  }
  var NOTE = ['.##', '.#.', '##.', '##.'], NOTE2 = ['.####', '.#..#', '.#..#', '##.##', '##.##'];
  var Z3 = ['###', '.#.', '###'], Z4 = ['####', '..#.', '.#..', '####'], Z5 = ['#####', '...#.', '..#..', '.#...', '#####'];
  var WAVE = ['#.', '.#', '.#', '#.'], WAVE_L = ['.#', '#.', '#.', '.#'];

  // ---------- Hendrik ----------
  function hendrik(root, p) {
    // breathing: the upper body rises one pixel and settles again
    var up = p.br ? child(root, 0, 1 / CP, 0, 0, 0, 0) : root;
    box(up, -4, 8, -2, 4, 17, 2, TORSO, 'torso');
    var head = child(up, 0, 17, 0, p.head[0], p.head[1], p.head[2]);
    box(head, -4, 0, -4, 4, 8.6, 4, { f: FACES[p.face], r: HEAD.r, l: HEAD.l, b: HEAD.b, t: HEAD.t, d: HEAD.d }, 'head');
    box(head, -0.5, 3.2, 4, 0.5, 4.3, 5, NOSE, 'head');
    // golden quiff: short sides, a crown flat toward the back, three clumps stepping up and forward, swept to his right
    box(head, -4, 8.6, -4, 4, 9.8, 0.5, CROWN, 'hair');
    box(head, -4, 8.6, 0.5, 4, 10.6, 4, FRONT, 'hair');
    box(head, -3.6, 10, -1, 3.2, 11.8, 4.4, QUIFF, 'hair');
    box(head, -3.0, 11.4, 0.2, 2.0, 13.4, 4.8, QUIFF, 'hair');
    box(head, -2.4, 13, 1.6, 0.4, 14.8, 5.2, QUIFF, 'hair');
    // over-ear headphones: band over the crown behind the quiff, slim bars, orange cups over the ears
    // (off in the sea, where the scene's one orange moves to the board or the kite)
    if (p.phones !== false) {
      box(head, -4, 9.8, -2.8, 4, 10.6, -1.8, BAND, 'phones');
      box(head, -4.5, 5.6, -2.6, -4, 10.2, -1.8, BAND, 'phones');
      box(head, 4, 5.6, -2.6, 4.5, 10.2, -1.8, BAND, 'phones');
      box(head, -5.6, 2.2, -1.6, -4, 5.6, 1.4, CUP_L, 'phones');
      box(head, 4, 2.2, -1.6, 5.6, 5.6, 1.4, CUP_R, 'phones');
    }
    var aA = child(up, -5.5, 16.5, 0, p.aA[0], p.aA[1], p.aA[2]);
    box(aA, -1.5, -9, -1.5, 1.5, 0, 1.5, ARM, 'armA');
    var aB = child(up, 5.5, 16.5, 0, p.aB[0], p.aB[1], p.aB[2]);
    box(aB, -1.5, -9, -1.5, 1.5, 0, 1.5, ARM, 'armB');
    var lA = child(root, -2, 8, 0, p.lA[0], p.lA[1], p.lA[2]);
    box(lA, -1.5, -6, -1.5, 1.5, 1, 1.5, LEG, 'legA'); box(lA, -1.5, -8, -1.5, 1.5, -6, 2.8, SHOE, 'legA');
    var lB = child(root, 2, 8, 0, p.lB[0], p.lB[1], p.lB[2]);
    box(lB, -1.5, -6, -1.5, 1.5, 1, 1.5, LEG, 'legB'); box(lB, -1.5, -8, -1.5, 1.5, -6, 2.8, SHOE, 'legB');
    return { head: head, aA: aA, aB: aB, up: up };
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

  var mouse = null, moving = false, dir = 1, sd = 1, kd = 1, yaw = -0.45, walkPhase = 0, t = 0, tp = 0, last = 0;
  var current = null, poof = 0, boxX = 0, boxY = 0, lastKey = '';

  function activityIndex() {
    var i = 0;
    for (var k = 0; k < ACTIVITIES.length; k++) if (state.elapsed >= ACTIVITIES[k].at) i = k;
    return i;
  }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function pose() {
    var blink = Math.round(tp * 10) % 37 === 0;               // one 0.1 s pose step every 3.7 s
    return { x: 0, y: 0, rx: 0, rz: 0, yaw: yaw, br: !moving && (tp % 2.4) >= 1.2,
      head: [0, 0, 0], aA: [0, 0, -0.13], aB: [0, 0, 0.13], lA: [0, 0, 0], lB: [0, 0, 0],
      face: blink ? 'blink' : 'smile' };
  }
  // walk in 8 stepped poses per stride (contact, pass, contact, pass + in-betweens)
  function walkCycle(p, amount) {
    var w = Math.round(walkPhase / (Math.PI / 4)) * (Math.PI / 4);
    var s = Math.sin(w) * amount;
    p.lA[0] = 0.7 * s; p.lB[0] = -0.7 * s; p.aA[0] = -0.5 * s; p.aB[0] = 0.5 * s;
    p.y += Math.abs(Math.cos(w)) * 0.9 * amount;
  }
  // turn the head toward the cursor, but never so far that the 8-px face folds away
  function lookAtCursor(p) {
    if (!mouse) return;
    var look = clamp((mouse.x - state.x) / 150, -0.6, 0.6);
    if (Math.abs(look) < 0.4) look = look < 0 ? -0.4 : 0.4;
    p.head[1] = clamp(look - p.yaw, -0.5, 0.5);
    p.head[0] = clamp((mouse.y - (state.y - 66)) / 360, -0.12, 0.12);
  }
  // snap the root to whole pixels and the turn to small steps, so textures don't crawl
  function rootOf(p) { return child(WORLD, Math.round(p.x), Math.round(p.y * CP) / CP, 0, p.rx, Math.round(p.yaw / 0.05) * 0.05, p.rz); }

  // ---------- activities ----------
  function drawWalk() {
    var p = pose();
    if (moving) walkCycle(p, 1); else lookAtCursor(p);
    shadow(0, 7, 2);
    hendrik(rootOf(p), p);
    finish();
  }

  // Props that stand beside him are mirrored to the side he turns away from (ms = -1 when the
  // cursor is on his right, as it is near the right edge of the window), so his voice, free hand
  // and shaker always face the room. Decided by the cursor side, not the current turn, so nothing
  // jumps sides halfway through a turn.
  function facingRight() { return !!(mouse && mouse.x > state.x); }
  function mbox(xf, ms, x0, y0, z0, x1, y1, z1, tex, g) {
    if (ms > 0) box(xf, x0, y0, z0, x1, y1, z1, tex, g); else box(xf, -x1, y0, z0, -x0, y1, z1, tex, g);
  }

  function drawPodcast() {
    var p = pose();
    var talking = ((tp / 2.4) | 0) % 3 !== 2;
    if (talking && ((tp * 5) | 0) % 3 !== 0) p.face = 'talk';
    var near = dir > 0 ? 'aB' : 'aA';                         // the arm on the travelling side holds the mic out front
    var ms = facingRight() ? -1 : 1, free = ms > 0 ? 'aA' : 'aB';
    if (moving) { walkCycle(p, 1); p[near] = [-1.35, 0, 0]; }
    else {
      p.head[0] = 0.05 + (talking ? 0.04 * Math.sin(tp * 6) : 0);
      p[free] = [-0.9, 0, -ms * (0.4 + 0.2 * Math.sin(tp * 2.2))];   // talking with his free hand, at chest height
    }
    shadow(2, 9, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    if (moving) {                                              // hand mic on the walk, held upright in front of him
      var hm = child(parts[near], 0, -9.2, 0.4, 1.35, 0, 0);
      box(hm, -0.6, -1.2, -0.6, 0.6, 1.6, 0.6, 'P', 'hmic');
      box(hm, -1.1, 1.6, -1.1, 1.1, 4, 1.1, { all: 'K', t: 'D' }, 'hmic');                  // silver grille on a dark handle
    } else {                                                   // mic on a stand, its L-boom reaching in front of his chin
      KIND = 5;
      mbox(root, ms, 8, 0, -0.5, 12.5, 1, 4, 'P', 'stand');
      mbox(root, ms, 9.8, 1, 1.4, 10.6, 16, 2.2, 'K', 'stand');
      mbox(root, ms, 9.8, 15.6, 2.2, 10.6, 16.4, 6.2, 'K', 'stand');
      mbox(root, ms, 4.0, 15.6, 5.4, 10.6, 16.4, 6.2, 'K', 'stand');
      // a light steel capsule in front of the lower cheek (reads on the dark tee), grille cap on top
      mbox(root, ms, 1.8, 15.2, 4.8, 4.4, 18.8, 7.2, { all: 'K', f: ['DDD', 'KKK', 'KKK', 'PPP'], t: 'D' }, 'mic');
      KIND = 1;
    }
    finish();
    if (talking && !moving) {                                  // voice on his free side
      var c = project(toWorld(parts.head, [-2.5 * ms, 1.5, 4]));
      for (var i = 0; i < 2; i++) {
        var ph = (tp * 1.2 + i / 2) % 1;
        glyph(ms > 0 ? WAVE_L : WAVE, c.x - ms * (4 + ph * 8) - (ms > 0 ? 0 : 1), c.y - 3 - ph * 3, GLYPH, 0.75 * (1 - ph));
      }
    }
  }

  function drawSurf() {
    var swell = Math.sin(tp * 2.2) * 0.9;
    var p = pose();
    p.br = false; p.phones = false;
    p.yaw = 0; p.y = 5.2 + swell - 0.5; p.rx = 0.22; p.rz = -sd * 0.14;
    p.lA = [0.06, 0, -0.45]; p.lB = [-0.06, 0, 0.45];
    var fwd = sd > 0 ? 'aB' : 'aA', back = sd > 0 ? 'aA' : 'aB';
    p[fwd] = [-0.35, 0, dir * (1.05 + 0.1 * Math.sin(tp * 2))];  // front arm low and forward
    p[back] = [0.25, 0, -dir * (2.2 + 0.1 * Math.sin(tp * 2 + 1))]; // back arm up behind
    p.head[1] = sd * 0.6;
    var root = rootOf(p);
    KIND = 5;
    // a pale board with an orange rail along its front: the scene's one accent
    // (1.6 voxels thick, so the rail stays one unbroken line instead of jet-like dashes)
    box(root, -11, -1.6, -3.2, 11, 0, 3.2, { all: 'P', f: 'A' }, 'board');
    box(root, 11, -1.6, -2, 13, 0, 2, 'P', 'board');
    KIND = 1;
    hendrik(root, p);
    // a small oval patch of sea that rises into a breaking wave behind him
    KIND = 7;
    for (var xi = -22; xi < 22; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 22, 2)));
      var d = -xi * sd;
      var crest = d > 5 ? Math.min(13, (d - 5) * 1.6) * e * (0.92 + 0.08 * Math.sin(tp * 3)) : 0;
      var h = (2.4 + 0.8 * Math.sin(xi / 4 + tp * 3)) * e + crest;
      // teal water: the flat sea stays a shallow strip under the board, the wave face catches light
      // under its lip, and foam sits only on the lip itself (white crest tops read as snow)
      box(WORLD, xi, -1.5, -7 * e, xi + 2, h, Math.abs(xi + 1) < 12 && crest < 1 ? Math.min(2.4, 1 + 3 * e) : 1 + 3 * e + crest * 0.3,
        { all: 'B', t: crest > 3 ? 'a' : 'B', f: crest > 3 ? WAVEFACE : 'B' });
      if (crest > 7) box(WORLD, sd > 0 ? xi + 2 : xi - 4, h - 2, -5 * e, sd > 0 ? xi + 6 : xi, h + 0.6, 0.5, { all: 'f', d: 'B' });
    }
    KIND = 1;
    finish();
    for (var s2 = 0; s2 < 5; s2++) {                            // spray: short dashes trailing him
      var sp = (tp * 1.2 + s2 / 5) % 1, sx = OX - dir * (10 + s2 * 1.5) - dir * sp * 4, sy = OY - 12 - sp * 6 + (s2 % 2) * 2;
      inkDot(sx, sy, GLYPH_HI, 0.8 * (1 - sp)); inkDot(sx - dir, sy, GLYPH_HI, (1 - sp) * 0.5);
    }
  }

  function drawSax() {
    var p = pose();                                           // headphones on: the scene's one orange
    if (moving) walkCycle(p, 1);
    else { p.rx = -0.1; p.rz = 0.06 * Math.sin(tp * 2.2); p.y = -0.4 * Math.abs(Math.sin(tp * 2.2)); p.head[0] = 0.12; p.br = false; }
    p.aA = [-1.0, 0, 0.62]; p.aB = [-0.75, 0, -0.35];
    shadow(1, 8, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    // a tilted silver alto: neck at his mouth, body down to the hip, bell flaring out
    var sax = child(parts.up, 2.6, 12.2, 5.6, 0, 0, 0.32);
    box(sax, -1.1, -5.5, -1.1, 1.1, 4.2, 1.1, { all: 'Y', f: ['YY', 'yY', 'YY', 'Yy', 'YY', 'yY', 'YY', 'YY'] }, 'sax');
    box(sax, -1.1, -7.6, -1.1, 4.2, -5.5, 1.1, 'Y', 'sax');
    box(sax, 2.2, -5.5, -1.5, 5.2, -0.6, 1.5, 'Y', 'sax');
    box(sax, 1.3, -0.6, -2.4, 6.1, 0.8, 2.4, { all: 'G', t: ['GGGG', 'GEEG', 'GEEG', 'GGGG'] }, 'sax');   // bright rim, dark opening
    box(sax, -0.6, 4.2, -0.6, 0.6, 6.4, 0.6, 'P', 'sax');
    finish();
    if (!moving) {
      var b = project(toWorld(sax, [3.7, 1, 0]));
      for (var n = 0; n < 3; n++) {
        var ph = (tp * 0.45 + n / 3) % 1;
        glyph(n === 1 ? NOTE2 : NOTE, b.x + 2 + n * 3 + Math.sin(ph * 6 + n) * 2, b.y - 5 - ph * 16, n === 1 ? GLYPH_HI : GLYPH, 0.8 * (1 - ph));
      }
    }
  }

  // a highball with an orange drink (the cocktail scene's one accent): white rim, orange drink, steel
  // base and a white straw; a 1-px martini V read as an orange stick at 3x. Corner at (0, 0, 0).
  var HIGHBALL_SIDE = ['DDD', 'AAA', 'AAA', 'AAA', 'KKK'];
  function highball(xf) {
    box(xf, 0, 0, 0, 3, 5.4, 2.8, { all: HIGHBALL_SIDE, b: 'K', t: 'A', d: 'K' }, 'glass');
    box(xf, 1.8, 5.4, 1, 2.6, 7.8, 1.8, 'D', 'glass');
  }

  function drawCocktail() {
    var p = pose();
    p.phones = false;                                         // the drink on the bar carries the orange
    // Between shakes the shaker stands on the counter under his camera-side hand. Every 3.2 s he
    // lifts it out to the side at shoulder height, clear of his face and body, and shakes it for
    // about a second (calm, not a constant buzz; it rocks on the 10 fps pose clock). Held overhead
    // it read as a torch, at the ear as a phone, and centred on the chest as a white shirt.
    var cyc = tp % 3.2, shaking = cyc >= 0.6 && cyc < 1.6;
    var sh = shaking ? (Math.round(tp * 10) % 2 ? 1 : -1) : 0;
    var near = facingRight() ? 'aA' : 'aB', far = near === 'aB' ? 'aA' : 'aB', side = near === 'aB' ? 1 : -1;
    var lead = dir > 0 ? 'aB' : 'aA';                         // walking: the arm on the travelling side carries a drink
    if (moving) { walkCycle(p, 1); p[lead] = [-1.25, 0, (lead === 'aB' ? 1 : -1) * 0.12]; }
    else {
      p[near] = shaking ? [-0.95 - sh * 0.08, 0, side * 1.3] : [-1.0, 0, side * 0.08];
      p[far] = [-0.62, 0, -side * 0.06];                      // other hand below the counter
      p.head[0] = 0.08;
    }
    shadow(0, moving ? 7 : 12, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    // shaking: out to the side in his fist, rocking; resting: standing on the counter under his hand;
    // walking: he carries the finished drink out in front on the travelling side, clear of his face
    // (a steel shaker carried there merged with his arm or read as a phone)
    var hand = toWorld(parts[moving ? lead : near], [0, -8.6, 0]), shaker = null;
    if (moving) {
      KIND = 5;                                               // a prop, like the glass on the bar: never part of his hit area
      var gc = mulV(root.m, [-1.5, -2.6, -1.4]);              // centred on his fist
      highball({ m: root.m, t: [hand[0] + gc[0], hand[1] + gc[1], hand[2] + gc[2]] });
      KIND = 1;
    } else {
      if (shaking) shaker = { m: mulM(root.m, rot(Math.PI, 0, sh * 0.22)), t: [hand[0], hand[1] - 2, hand[2]] };
      else shaker = { m: mulM(root.m, rot(Math.PI, 0, 0)), t: [hand[0], toWorld(root, [0, 10.6, 0])[1], hand[2]] };
      box(shaker, -1.4, -5, -1.4, 1.4, 0.4, 1.4, { all: 'K', f: ['KDK', 'KDK', 'PPP', 'KDK', 'KDK'] }, 'shaker');
      box(shaker, -1, -6.4, -1, 1, -5, 1, 'K', 'shaker');
      box(shaker, -0.5, -7.2, -0.5, 0.5, -6.4, 0.5, 'K', 'shaker');
    }
    if (!moving) {                                            // the bar: dark counter with a mid top, steel rail, a highball and a bottle
      KIND = 5;
      box(root, -11, 0, 3.4, 11, 9, 8.6, 'P', 'bar');
      box(root, -12, 9, 2.6, 12, 10.2, 9.6, 'q', 'top');
      box(root, -10, 1.4, 8.6, 10, 2.2, 9.6, 'K', 'rail');
      // the drink at the far end from the shaker hand, so the two never crowd each other
      highball(child(root, side > 0 ? -10 : 7, 10.2, 5.6, 0, 0, 0));
      // a bottle in steel with a dark label, at the back of the counter on the shaker side
      mbox(root, side, 9, 10.2, 3.6, 10.8, 15.4, 5.4, { all: 'K', f: ['KK', 'KK', 'PP', 'PP', 'KK'] }, 'bottle');
      mbox(root, side, 9.5, 15.4, 4.1, 10.3, 17.8, 4.9, 'K', 'bottle');
      KIND = 1;
    }
    finish();
    if (!moving && shaking) {                                  // shake marks hugging the shaker, on the open page only
      var c = project(toWorld(shaker, [0, -3, 0])), cx = Math.round(c.x), cy = Math.round(c.y);
      var ma = sh > 0 ? 0.8 : 0.5;
      glyph(WAVE_L, cx - 5, cy - 2, GLYPH, ma, true); glyph(WAVE, cx + 4, cy - 2, GLYPH, ma, true);
    }
  }

  function drawKite() {
    var bob = Math.sin(tp * 2) * 0.6;
    var p = pose();
    p.br = false; p.phones = false;
    p.yaw = 0; p.y = 3 + bob - 0.4; p.rz = kd * 0.28;
    p.lA = [0, 0, -0.3]; p.lB = [0, 0, 0.3];
    p.aA = [-0.25, 0, kd * 1.9]; p.aB = [-0.25, 0, kd * 1.9];
    p.head[1] = kd * 0.5; p.head[0] = -0.2;
    var root = rootOf(p);
    KIND = 5;
    box(root, -7, -1, -2.6, 7, 0, 2.6, { all: 'P', t: function (u) { return u < 0.15 || u > 0.85 ? 'p' : 'P'; } }, 'kboard');
    KIND = 1;
    var parts = hendrik(root, p);
    var bar = child(parts.aB, 0, -9.6, 0, 0, 0, 0);
    box(bar, -0.5, -0.5, -4.5, 0.5, 0.5, 4.5, { all: 'K', l: 'P', r: 'P' });
    // small oval of choppy sea with scattered whitecaps
    KIND = 7;
    var tick = (tp * 5) | 0;
    for (var xi = -20; xi < 20; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 20, 2)));
      var h = (1.6 + 0.6 * Math.sin(xi / 3 + tp * 5)) * e;
      (function (xc) {
        box(WORLD, xc, -1.5, -7 * e, xc + 2, h, 1 + 3 * e + (Math.sin(xc * 1.3 + tp * 3) > 0 ? 0.8 : 0), {
          all: 'B',
          t: function (u, v) { return ((xc * 3 + ((v * 5) | 0) * 7 + tick) % 11) === 0 ? 'f' : 'B'; }
        });
      })(xi);
    }
    // the kite: a canopy arc in ink with an orange top (the scene's one accent); it arcs over when he turns
    KIND = 5;
    var kx = kd * 13, ky = 35 + 5 * (1 - kd * kd) + Math.sin(tp * 1.3) * 1.2;
    var kite = child(WORLD, kx, ky, -6, 0, 0, Math.sin(tp * 1.3) * 0.08 - (kd * 0.25));
    for (var i = 0; i < 7; i++) {
      var sx = (i - 3) * 2.9, sy = -0.55 * (i - 3) * (i - 3);
      box(kite, sx - 1.5, sy, -1.6, sx + 1.5, sy + 1.6, 1.6, { all: 'P', t: 'A' }, 'kite');
    }
    KIND = 1;
    finish();
    var b1 = project(toWorld(bar, [0, 0, -4.5])), b2 = project(toWorld(bar, [0, 0, 4.5]));
    var k1 = project(toWorld(kite, [-10, -7.4, 0])), k2 = project(toWorld(kite, [10, -7.4, 0]));
    line2d(b1, k1, GLYPH, 0.5); line2d(b2, k2, GLYPH, 0.5);
    for (var s = 0; s < 6; s++) {
      var sp = (tp * 1.8 + s / 6) % 1, sx2 = OX - dir * (8 + s * 1.6 + sp * 5), sy2 = OY - 3 - sp * 5 - (s % 3);
      inkDot(sx2, sy2, GLYPH_HI, 0.8 * (1 - sp)); inkDot(sx2 - dir, sy2, GLYPH, (1 - sp) * 0.5);
    }
  }

  function drawSleep() {
    shadow(0, 18, 3);
    KIND = 5;                                                 // the couch
    box(WORLD, -14, 1, -5, 14, 5, 5, { all: 'P', f: ['PPPPPPPPPPPPPIPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPIPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPIPPPPPPPPPPPPPP'] }, 'seat');
    box(WORLD, -14, 5, -5, 14, 17, -2.2, { all: 'P', f: ['PPPPPPPIPPPPPPPIPPPPPPP'] }, 'back');
    box(WORLD, -17.5, 1, -5, -14, 11, 5, { all: 'p', t: 'P', f: 'P' }, 'armL');
    box(WORLD, 14, 1, -5, 17.5, 11, 5, { all: 'p', t: 'P', f: 'P' }, 'armR');
    box(WORLD, -16, 0, 3, -15, 1, 4, 'p'); box(WORLD, 15, 0, 3, 16, 1, 4, 'p');
    KIND = 1;
    // Hendrik out cold on his side, head propped on the armrest, under a blanket
    var p = pose();
    p.face = 'sleep'; p.yaw = 0; p.br = false;                // dozed off with his headphones on
    p.aB = [0, 0.93, -1.57]; p.aA = [0, 0, 0];
    p.lA = [0.1, 0, 0]; p.lB = [-0.05, 0, 0];
    var breathe = (tp % 3) < 1.5 ? 0 : 1;
    var root = child(WORLD, 13.5, 10, 0.5, 0, 0, Math.PI / 2 - 0.12);
    hendrik(root, p);
    box(WORLD, -3.8, 4.6, -2.4, 11.2, 13.6 + breathe, 3.2, {
      all: 'C',
      f: function (u) { return u > 0.62 && u < 0.72 ? 'I' : 'C'; },
      t: function (u) { return u > 0.62 && u < 0.72 ? 'I' : 'C'; }
    }, 'blanket');
    finish();
    var hp = project([-12, 18, 0]);
    for (var z = 0; z < 3; z++) {
      var ph = (tp * 0.3 + z / 3) % 1;
      glyph(ph < 0.33 ? Z3 : ph < 0.66 ? Z4 : Z5, hp.x + ph * 9 + z, hp.y - 3 - ph * 16, GLYPH, (1 - ph) * 0.7);
    }
  }


  function WAVEFACE(u, v) { return v < 0.3 ? 'a' : 'B'; }   // the rising crest catches light just under its lip

  var DRAW = { walk: drawWalk, podcast: drawPodcast, surf: drawSurf, sax: drawSax, cocktail: drawCocktail, kite: drawKite, sleep: drawSleep };

  // ---------- loop ----------
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!(dt > 0)) return;
    t += dt;
    tp = Math.floor(t * 10) / 10;                              // poses step at 10 fps; movement stays smooth
    state.elapsed += dt;

    var act = ACTIVITIES[activityIndex()];
    if (current !== act.id) { if (current) poof = 0.4; current = act.id; }

    // follow the cursor (asleep, he stays on his couch)
    moving = false;
    var inView = keepInView();
    if (mouse && act.speed > 0 && inView) {
      var off = act.off || OFFSET_X;
      var tx = mouse.x + off * (mouse.x > window.innerWidth - 160 ? -1 : 1);
      var ty = Math.min(window.innerHeight - 6, mouse.y + OFFSET_Y);
      var dx = tx - state.x, dy = ty - state.y, d = Math.hypot(dx, dy);
      if (d > 6) {
        var stepLen = Math.min(d, Math.min(300, act.speed * (d > 300 ? 1.5 : 1)) * dt);
        state.x += dx / d * stepLen; state.y += dy / d * stepLen;
        walkPhase += stepLen / 7;
        moving = true;
        if (Math.abs(dx) > 3) dir = dx > 0 ? 1 : -1;
      }
    }
    // at rest he stands three-quarter on (so his sides show), turned toward the cursor;
    // walking he turns only ~35° so his 8-px face stays readable
    var target = 0;
    if (act.id === 'walk' || act.id === 'podcast' || act.id === 'sax' || act.id === 'cocktail') {
      if (moving) target = dir * 0.6;
      else if (mouse) target = (mouse.x < state.x ? -1 : 1) * clamp(0.45 + Math.abs(mouse.x - state.x) / 400, 0.45, 0.6);
      else target = -0.45;
      // playing, and behind the bar, he turns more toward the room (either way, so the face never folds)
      if (!moving && (act.id === 'sax' || act.id === 'cocktail')) target *= 0.45;
    }
    yaw += (target - yaw) * (1 - Math.exp(-dt * 7));
    // the surfboard and the kite swing round smoothly when he changes direction
    sd += (dir - sd) * (1 - Math.exp(-dt * 5));
    kd += (dir - kd) * (1 - Math.exp(-dt * 4));
    if (poof > 0) poof -= dt;

    // Rasterize only when something visible changed. Poses step at 10 fps and the turn in
    // 0.05-rad steps, so most display frames (60-120 a second) reuse the last image.
    var key = act.id + '|' + tp + '|' + Math.round(yaw / 0.05) + '|' + moving + '|' + dir + '|' +
      Math.round(walkPhase / (Math.PI / 4)) + '|' + Math.round(sd * 20) + '|' + Math.round(kd * 20) + '|' +
      (poof > 0 ? Math.round(poof * 30) : 0);
    if (key !== lastKey) {
      lastKey = key;
      clear();
      KIND = 1;
      DRAW[act.id]();
      if (poof > 0) {                                         // a few squares on the 7px grid, not a sparkle (behind him, like every overlay)
        var k = 1 - poof / 0.4, rad = 4 + k * 12;
        for (var a = 0; a < 6; a++) {
          var ax = Math.round(OX + Math.cos(a * 1.047) * rad), ay = Math.round(OY - 14 + Math.sin(a * 1.047) * rad * 0.6);
          var al = poof / 0.4 * 0.7;
          inkDot(ax, ay, GLYPH, al); inkDot(ax + 1, ay, GLYPH, al); inkDot(ax, ay + 1, GLYPH, al); inkDot(ax + 1, ay + 1, GLYPH, al);
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    boxX = Math.round(state.x - OX * SCALE);
    boxY = Math.round(state.y - OY * SCALE);
    canvas.style.transform = 'translate(' + boxX + 'px,' + boxY + 'px)';
  }

  // The canvas box is bigger than Hendrik and sits next to the cursor, so it
  // only takes the mouse over Hendrik himself — never over scenery or water.
  function overPet(cx, cy) {
    var lx = ((cx - boxX) / SCALE) | 0, ly = ((cy - boxY) / SCALE) | 0;
    if (lx < 0 || ly < 0 || lx >= W || ly >= H) return false;
    var k = kind[ly * W + lx];
    return k === 1 || k === 3;
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
