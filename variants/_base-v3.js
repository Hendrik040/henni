/* ═══════════════════════════════════════════════════════════════
   krackedtools.dev — site pet: a voxel Hendrik that follows the cursor.

   He is a small 3D model built from textured blocks (head with nose and
   ears, swept-up quiff, hoodie with the hood down, sleeves, jeans,
   sneakers), rendered every frame by a tiny z-buffered software
   rasterizer at ~1 art pixel per voxel and scaled up pixel-sharp — so he
   stays pixel art but turns, leans and catches light in 3D. Light comes
   from the top-left like the homepage tiles; shadows fall toward the
   site's mauve; a lit contour and depth creases keep him readable on
   the dark page.

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
    { id: 'walk',     at: 0,   speed: 150 },
    { id: 'podcast',  at: 35,  speed: 70 },
    { id: 'surf',     at: 80,  speed: 240, off: 58 },
    { id: 'sax',      at: 125, speed: 80 },
    { id: 'cocktail', at: 170, speed: 70 },
    { id: 'kite',     at: 215, speed: 300 },
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

  // ---- Light: key from the top-left (like the homepage tiles), shadows toward mauve ----
  var L = norm([-0.6, 0.65, 0.75]);
  var AMB = 0.46, DIF = 0.78;       // bands: top 1.1, lit side ~1.0, front 0.8–0.9, shadow side 0.5
  var TINT = [30, 23, 38];          // what shadow falls toward (site mauve, not black)
  var GLOW = { L: 1, l: 1, A: 1 };  // accent orange always renders true (#ff570a)
  var EDGE = [6, 5, 9];             // outline = the homepage tiles' cast-shadow colour

  // ---- Palette: site tokens + Hendrik ----
  var PAL = {
    S: [250, 202, 178], s: [226, 164, 142], t: [214, 160, 134],   // skin, shade, stubble
    E: [27, 23, 32], w: [246, 242, 234], m: [141, 89, 87],        // eyes (ink), teeth, mouth
    b: [150, 104, 76],                                            // brows
    H: [214, 174, 118], h: [160, 120, 80], G: [240, 216, 172],    // ash-honey hair, roots, pale tips
    O: [70, 63, 84], o: [56, 50, 68], q: [44, 39, 53], p: [86, 78, 102], // charcoal-mauve hoodie
    D: [236, 233, 241], L: [255, 87, 10], l: [255, 160, 87],      // ink, accent orange set
    P: [70, 86, 122], Q: [88, 108, 150], W: [236, 233, 241], K: [190, 186, 200], // denim, worn denim, sneakers, soles
    C: [255, 224, 194], A: [255, 160, 87],                        // pale orange, drink
    Y: [226, 170, 70], y: [178, 124, 48], k: [110, 78, 34],       // brass
    z: [200, 204, 214], Z: [236, 238, 244],                       // shaker steel
    R: [63, 59, 70], r: [48, 44, 53], U: [149, 144, 155],         // bar
    V: [104, 98, 112], v: [84, 79, 92], u: [124, 118, 132],       // couch
    B: [52, 92, 120], a: [88, 132, 156], f: [236, 233, 241],      // slate water, light water, foam
    M: [50, 47, 54], n: [216, 214, 224]                           // hardware dark, light grey
  };

  // ---- Textures (rows top→bottom; side faces read front→back) ----
  function rev(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }
  function swap(rows, i, row) { var c = rows.slice(); c[i] = row; return c; }
  // forehead, brows, 1x2 eyes, nose shade, wide closed smile, stubble jaw
  var FACE = ['hSSSSSSh', 'SbbSSbbS', 'SSESSESS', 'SSESSESS', 'SSSssSSS', 'SmSSSSmS', 'SSmmmmSS', 'SttttttS'];
  var FACES = {
    smile: FACE,
    blink: swap(swap(FACE, 2, 'SSSSSSSS'), 3, 'SssSSssS'),
    talk: swap(swap(FACE, 5, 'SmwwwwmS'), 6, 'SSmmmmSS'),
    sleep: swap(swap(swap(swap(FACE, 2, 'SSSSSSSS'), 3, 'SEESSEES'), 5, 'SSSSSSSS'), 6, 'SSSmmSSS')
  };
  for (var fk in FACES) { FACES[fk].level = true; FACES[fk].lit = 0.85; }
  var PRI = 'Emwb'; // features that must survive minification, most important first
  var HEAD_R = ['HHHHHHHH', 'ShhhhhhH', 'SShhhhhh', 'SSSSsshh', 'SSSSsshh', 'SSSSSShh', 'tSSSSSSh', 'ttSSSSSS'];
  var HEAD = {
    r: HEAD_R, l: rev(HEAD_R),
    b: ['HHHHHHHH', 'HHHGHHHH', 'HHHHHHHH', 'hHHHHHHh', 'hhhhhhhh', 'hhhhhhhh', 'shhhhhhs', 'ssssssss'],
    t: 'H', d: 's'
  };
  var HAIR = { all: 'H', t: ['GHGHHGHG', 'HHGHGHHH', 'GHHGHHGH'], f: ['GHHGHHGH', 'hhhhhhhh'], b: 'h' };
  var TUFT = { all: 'H', t: ['GHG', 'HGH', 'GHG'], f: ['GHG', 'HGH', 'HHh'] };
  var NOSE = { all: 'S', d: 's', r: 's' }, EAR_L = { all: 'S', l: 's' }, EAR_R = { all: 'S', r: 's' };
  var TORSO = {
    f: ['oOOOOOOo', 'OOOOOOOO', 'OOOOOlLO', 'OOOOOLlO', 'OOOOOOOO', 'OooooooO', 'OoOOOOoO', 'OoOOOOoO', 'qqqqqqqq'],
    b: ['OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'OOOOOOOO', 'qqqqqqqq'],
    l: ['qqqq', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'qqqq'],
    r: ['qqqq', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'qqqq'],
    t: 'O', d: 'o'
  };
  var HOOD = { all: 'p', f: 'o', d: 'o' };
  var SLEEVE = ['OOO', 'OOO', 'OOO', 'OOO', 'OOO', 'OOO', 'qqq', 'SSS', 'SSS'];
  var ARM = { f: SLEEVE, b: SLEEVE, l: SLEEVE, r: SLEEVE, t: 'O', d: 'S' };
  var LEG = { all: 'P', f: ['PPP', 'PQP', 'PQP', 'PPP', 'PPP', 'PPP'], d: 'P' };
  var SHOE = { f: ['WWW', 'KKK'], b: ['WWW', 'KKK'], l: ['WWWW', 'KKKK'], r: ['WWWW', 'KKKK'], t: 'W', d: 'K' };

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

  // ---------- frame buffer ----------
  // kind: 0 empty · 1 Hendrik (+ what he holds) · 2 shadow · 3 his outline · 4 overlay
  //       5 scenery (bar, couch, boards, stand, kite) · 6 scenery outline · 7 water
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.title = 'Hendrik — click to change what he’s doing';
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:' + W * SCALE + 'px;height:' + H * SCALE + 'px;' +
    'z-index:60;image-rendering:pixelated;will-change:transform;pointer-events:none;' +
    'cursor:var(--cursor-hand,pointer);';
  var ctx = canvas.getContext('2d');
  var img = ctx.createImageData(W, H), buf = img.data, src = new Uint8ClampedArray(W * H * 4);
  var zb = new Float32Array(W * H), kind = new Uint8Array(W * H), part = new Uint16Array(W * H);
  var KIND = 1, partId = 0;

  function clear() { buf.fill(0); zb.fill(-1e9); kind.fill(0); part.fill(0); partId = 0; }
  function solid(k) { return k === 1 || k === 5 || k === 7; }
  function put(x, y, z, r, g, b, a, k) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x;
    if (z <= zb[i]) return;
    zb[i] = z; kind[i] = k; part[i] = partId;
    var o = i * 4;
    buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = a;
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
        var c = PAL[key];
        if (!c) continue;
        var sh = GLOW[key] ? 1 : shade, r, g, b;
        if (sh >= 1) { r = Math.min(255, c[0] * sh); g = Math.min(255, c[1] * sh); b = Math.min(255, c[2] * sh); }
        else { var tk = 1 - sh; r = c[0] * sh + TINT[0] * tk; g = c[1] * sh + TINT[1] * tk; b = c[2] * sh + TINT[2] * tk; }
        put(x, y, p0.z + dzu * s + dzv * q, r, g, b, 255, KIND);
      }
    }
  }
  function box(xf, x0, y0, z0, x1, y1, z1, tex) {
    partId++;
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
      put(OX + cx + 2 + x, OY + y, -1e8, EDGE[0], EDGE[1], EDGE[2], e < 0.4 ? 190 : 130, 2);
    }
  }
  // Lit contour on top/left edges (like the tiles' lit faces) and darker
  // creases where one part passes in front of another (sleeve over torso,
  // chin over collar, hem over legs). Water is left soft.
  function edges() {
    src.set(buf);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = y * W + x, k = kind[i];
      if (k !== 1 && k !== 5) continue;
      var o = i * 4, f = 1;
      var nb0 = y > 0 ? i - W : -1, nb1 = x > 0 ? i - 1 : -1, nb2 = x < W - 1 ? i + 1 : -1;
      for (var n = 0; n < 3; n++) {
        var j = n === 0 ? nb0 : n === 1 ? nb1 : nb2;
        if (j >= 0 && (kind[j] === 1 || kind[j] === 5) && part[j] !== part[i] && zb[j] - zb[i] > 0.35) f = 0.72;
      }
      var r = src[o] * f, g = src[o + 1] * f, b = src[o + 2] * f;
      if ((nb0 < 0 || !solid(kind[nb0])) || (nb1 < 0 || !solid(kind[nb1]))) {
        r += (255 - r) * 0.2; g += (224 - g) * 0.2; b += (194 - b) * 0.2;
      }
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b;
    }
  }
  function outline() {
    var mark = [];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = y * W + x, k = kind[i];
      if (solid(k) || k === 3 || k === 6) continue;
      var a = x > 0 ? kind[i - 1] : 0, b = x < W - 1 ? kind[i + 1] : 0, c = y > 0 ? kind[i - W] : 0, d = y < H - 1 ? kind[i + W] : 0;
      if (a === 1 || b === 1 || c === 1 || d === 1) mark.push(i, 3);
      else if (solid(a) || solid(b) || solid(c) || solid(d)) mark.push(i, 6);
    }
    for (var n = 0; n < mark.length; n += 2) {
      var o = mark[n] * 4;
      buf[o] = EDGE[0]; buf[o + 1] = EDGE[1]; buf[o + 2] = EDGE[2]; buf[o + 3] = 255; kind[mark[n]] = mark[n + 1];
    }
  }
  function finish() { edges(); outline(); }
  function line2d(a, b, c, alpha) {
    var n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) | 0;
    for (var i = 0; i <= n; i++) dot(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, c, alpha);
  }
  function glyph(rows, x, y, c, a) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) if (rows[j][i] === '#') dot(x + i, y + j, c, a);
  }
  var NOTE = ['.##', '.#.', '##.', '##.'], NOTE2 = ['.####', '.#..#', '.#..#', '##.##', '##.##'];
  var Z3 = ['###', '.#.', '###'], Z4 = ['####', '..#.', '.#..', '####'], Z5 = ['#####', '...#.', '..#..', '.#...', '#####'];
  var WAVE = ['#.', '.#', '.#', '#.'], WAVE_L = ['.#', '#.', '#.', '.#'];

  // ---------- Hendrik ----------
  function hendrik(root, p) {
    box(root, -4, 8, -2, 4, 17, 2, TORSO);
    box(root, -3.6, 12.5, -3.6, 3.6, 17.6, -2, HOOD);     // hood down on his back
    box(root, -4, 15.6, -2.6, -2.4, 17.4, 0.6, HOOD);     // hood edges over the shoulders
    box(root, 2.4, 15.6, -2.6, 4, 17.4, 0.6, HOOD);
    var head = child(root, 0, 17, 0, p.head[0], p.head[1], p.head[2]);
    box(head, -4, 0, -4, 4, 8.6, 4, { f: FACES[p.face], r: HEAD.r, l: HEAD.l, b: HEAD.b, t: HEAD.t, d: HEAD.d });
    box(head, -0.5, 3.2, 4, 0.5, 4.3, 5, NOSE);
    box(head, -5, 2.2, -1.5, -4, 5.4, 0.5, EAR_L);
    box(head, 4, 2.2, -1.5, 5, 5.4, 0.5, EAR_R);
    box(head, -4, 8.6, -4, 4, 9.6, 1.2, HAIR);            // crown, flatter toward the back
    box(head, -4, 8.6, 1.2, 4, 10.2, 3.4, HAIR);          // front volume
    box(head, -2.8, 9.2, 0, 2.6, 12.4, 4, TUFT);          // swept-up quiff
    box(head, -4, 9.2, -1.4, -1.4, 11, 3, TUFT);          // side tufts
    box(head, 1.8, 9.2, -1.4, 4, 11.2, 3, TUFT);
    if (p.phones) {                                        // over-ear headphones, band over the quiff
      box(head, -5.2, 12.4, -1, 5.2, 13.4, 1, { all: 'M', t: 'n' });
      box(head, -5.2, 6.5, -1, -4.2, 12.4, 1, 'M');
      box(head, 4.2, 6.5, -1, 5.2, 12.4, 1, 'M');
      box(head, -6.6, 1.8, -2, -4, 7, 2, { all: 'L', l: 'l', t: 'l', d: 'M' });
      box(head, 4, 1.8, -2, 6.6, 7, 2, { all: 'L', r: 'l', t: 'l', d: 'M' });
    }
    var aA = child(root, -5.5, 16.5, 0, p.aA[0], p.aA[1], p.aA[2]);
    box(aA, -1.5, -9, -1.5, 1.5, 0, 1.5, ARM);
    var aB = child(root, 5.5, 16.5, 0, p.aB[0], p.aB[1], p.aB[2]);
    box(aB, -1.5, -9, -1.5, 1.5, 0, 1.5, ARM);
    var lA = child(root, -2, 8, 0, p.lA[0], p.lA[1], p.lA[2]);
    box(lA, -1.5, -6, -1.5, 1.5, 0, 1.5, LEG); box(lA, -1.5, -8, -1.5, 1.5, -6, 2.8, SHOE);
    var lB = child(root, 2, 8, 0, p.lB[0], p.lB[1], p.lB[2]);
    box(lB, -1.5, -6, -1.5, 1.5, 0, 1.5, LEG); box(lB, -1.5, -8, -1.5, 1.5, -6, 2.8, SHOE);
    return { head: head, aA: aA, aB: aB };
  }

  // ---------- state ----------
  var state = { elapsed: 0, x: 0, y: 0 };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (saved && typeof saved.elapsed === 'number') state = saved;
  } catch (e) { /* storage blocked: start fresh */ }
  if (!state.x) { state.x = window.innerWidth - 140; state.y = window.innerHeight - 40; }

  var mouse = null, moving = false, dir = 1, sd = 1, kd = 1, yaw = -0.45, walkPhase = 0, t = 0, last = 0;
  var current = null, poof = 0, boxX = 0, boxY = 0;

  function activityIndex() {
    var i = 0;
    for (var k = 0; k < ACTIVITIES.length; k++) if (state.elapsed >= ACTIVITIES[k].at) i = k;
    return i;
  }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function pose() {
    var blink = (t % 3.7) < 0.13;
    return { x: 0, y: 0, rx: 0, rz: 0, yaw: yaw,
      head: [0, 0, 0], aA: [0, 0, -0.13], aB: [0, 0, 0.13], lA: [0, 0, 0], lB: [0, 0, 0],
      face: blink ? 'blink' : 'smile', phones: false };
  }
  function walkCycle(p, amount) {
    var s = Math.sin(walkPhase) * amount;
    p.lA[0] = 0.75 * s; p.lB[0] = -0.75 * s; p.aA[0] = -0.6 * s; p.aB[0] = 0.6 * s;
    p.y += Math.abs(Math.cos(walkPhase)) * 0.9 * amount;
  }
  function lookAtCursor(p) {
    if (!mouse) return;
    var look = clamp((mouse.x - state.x) / 150, -1.1, 1.1);
    if (Math.abs(look) < 0.5) look = look < 0 ? -0.5 : 0.5;
    p.head[1] = clamp(look - p.yaw, -0.6, 0.6);
    p.head[0] = clamp((mouse.y - (state.y - 66)) / 360, -0.12, 0.12);
  }
  // snap the root to whole pixels so textures don't crawl on sub-pixel motion
  function rootOf(p) { return child(WORLD, Math.round(p.x), Math.round(p.y * CP) / CP, 0, p.rx, p.yaw, p.rz); }

  // ---------- activities ----------
  function drawWalk() {
    var p = pose();
    if (moving) walkCycle(p, 1); else lookAtCursor(p);
    shadow(0, 7, 2);
    hendrik(rootOf(p), p);
    finish();
  }

  function drawPodcast() {
    var p = pose();
    p.phones = true;
    var talking = ((t / 2.4) | 0) % 3 !== 2;
    if (talking && ((t * 7) | 0) % 3 !== 0) p.face = 'talk';
    if (moving) walkCycle(p, 1);
    else {
      p.head[0] = 0.05 + (talking ? 0.04 * Math.sin(t * 9) : 0);
      p.aA = [-0.5, 0, -1.05 - 0.3 * Math.sin(t * 3.1)];        // talking with his free hand
    }
    shadow(2, 9, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    if (moving) {                                              // hand mic on the walk
      var hm = child(dir > 0 ? parts.aA : parts.aB, 0, -9.4, 0.6, 0, 0, 0);
      box(hm, -0.7, -1, -0.7, 0.7, 2, 0.7, 'M');
      box(hm, -1.2, 2, -1.2, 1.2, 4.4, 1.2, { all: 'K', t: 'n', d: 'L' });
    } else {                                                   // mic on a stand beside his mouth
      KIND = 5;
      box(root, 7.5, 0, -1, 12.5, 1, 4, 'M');
      box(root, 9.5, 1, 1, 10.5, 15.5, 2, { all: 'K', f: 'n' });
      box(root, 5, 15.5, 1, 10.5, 16.5, 2, 'K');
      box(root, 5, 15.5, 2, 6, 16.5, 4.5, 'K');
      box(root, 3.6, 16.5, 3.6, 6.6, 21.5, 6.6, { all: 'K', f: ['KnK', 'nKn', 'KnK', 'LLL', 'MMM'], t: 'n', d: 'M' });
      KIND = 1;
    }
    finish();
    if (talking && !moving) {                                  // voice on his free side
      var c = project(toWorld(parts.head, [-2.5, 1.5, 4]));
      for (var i = 0; i < 2; i++) {
        var ph = (t * 1.6 + i / 2) % 1;
        glyph(WAVE_L, c.x - 4 - ph * 8, c.y - 3 - ph * 3, PAL.l, 1 - ph);
      }
    }
  }

  function drawSurf(dt) {
    sd += (dir - sd) * (1 - Math.exp(-dt * 5));
    var swell = Math.sin(t * 2.6) * 0.9;
    var p = pose();
    p.yaw = 0; p.y = 4.4 + swell - 0.5; p.rx = 0.22; p.rz = -sd * 0.14;
    p.lA = [0.06, 0, -0.45]; p.lB = [-0.06, 0, 0.45];
    var fwd = sd > 0 ? 'aB' : 'aA', back = sd > 0 ? 'aA' : 'aB';
    p[fwd] = [-0.35, 0, dir * (1.05 + 0.1 * Math.sin(t * 2))];  // front arm low and forward
    p[back] = [0.25, 0, -dir * (2.2 + 0.1 * Math.sin(t * 2 + 1))]; // back arm up behind
    p.head[1] = sd * 0.75;
    var root = rootOf(p);
    KIND = 5;
    box(root, -11, -1, -3.2, 11, 0, 3.2, { all: 'C', t: function (u, v) { return v > 0.4 && v < 0.6 ? 'L' : 'C'; }, d: 'l' });
    box(root, 11, -1, -2, 13, 0, 2, 'C');
    KIND = 1;
    hendrik(root, p);
    // a small oval patch of sea that rises into a breaking wave behind him
    KIND = 7;
    for (var xi = -22; xi < 22; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 22, 2)));
      var d = -xi * sd;
      var crest = d > 5 ? Math.min(13, (d - 5) * 1.6) * e * (0.92 + 0.08 * Math.sin(t * 3)) : 0;
      var h = (2.4 + 0.8 * Math.sin(xi / 4 + t * 4)) * e + crest;
      box(WORLD, xi, -1.5, -7 * e, xi + 2, h, 1 + 3 * e + crest * 0.3,
        { all: 'B', t: crest > 9 ? 'f' : 'a', f: function (u, v) { return v < 0.12 ? 'a' : 'B'; } });
      if (crest > 7) box(WORLD, sd > 0 ? xi + 2 : xi - 4, h - 2, -5 * e, sd > 0 ? xi + 6 : xi, h + 0.6, 0.5, { all: 'f', d: 'B' });
    }
    KIND = 1;
    finish();
    for (var s2 = 0; s2 < 6; s2++) {                            // spray: short dashes trailing him
      var sp = (t * 1.4 + s2 / 6) % 1, sx = OX - dir * (10 + s2 * 1.5) - dir * sp * 4, sy = OY - 12 - sp * 6 + (s2 % 2) * 2;
      dot(sx, sy, PAL.f, 1 - sp); dot(sx - dir, sy, PAL.f, (1 - sp) * 0.6);
    }
  }

  function drawSax() {
    var p = pose();
    if (moving) walkCycle(p, 1);
    else { p.rx = -0.1; p.rz = 0.07 * Math.sin(t * 2.8); p.y = -0.4 * Math.abs(Math.sin(t * 2.8)); p.head[0] = 0.12; }
    p.aA = [-1.0, 0, 0.62]; p.aB = [-0.75, 0, -0.35];
    shadow(1, 8, 2);
    var root = rootOf(p);
    hendrik(root, p);
    // a tilted alto: neck at his mouth, body down to the hip, bell flaring out
    var sax = child(root, 2.6, 12.2, 5.6, 0, 0, 0.32);
    box(sax, -1.1, -5.5, -1.1, 1.1, 4.2, 1.1, { all: 'Y', f: ['YY', 'kY', 'YY', 'Yk', 'YY', 'kY', 'YY', 'YY'] });
    box(sax, -1.1, -7.6, -1.1, 4.2, -5.5, 1.1, 'y');
    box(sax, 2.2, -5.5, -1.5, 5.2, -0.6, 1.5, 'Y');
    box(sax, 1.3, -0.6, -2.4, 6.1, 0.8, 2.4, { all: 'y', t: ['yyyy', 'ykky', 'ykky', 'yyyy'] });
    box(sax, -0.6, 4.2, -0.6, 0.6, 6.4, 0.6, 'Y');
    box(root, -0.5, 18.2, 3.6, 0.5, 19.2, 6, 'M');
    finish();
    if (!moving) {
      var b = project(toWorld(sax, [3.7, 1, 0]));
      for (var n = 0; n < 3; n++) {
        var ph = (t * 0.55 + n / 3) % 1;
        glyph(n === 1 ? NOTE2 : NOTE, b.x + 2 + n * 3 + Math.sin(ph * 6 + n) * 2, b.y - 5 - ph * 16, n === 1 ? PAL.l : PAL.D, 1 - ph);
      }
    }
  }

  function drawCocktail() {
    var p = pose();
    var sh = Math.sin(t * 17) * (moving ? 0.15 : 0.3);
    if (moving) { walkCycle(p, 1); p.aB = [-1.5 + sh, 0, 0.2]; p.aA = [-1.1, 0, -0.35]; }
    else { p.aB = [-2.75 + sh, 0, 0.22]; p.aA = [-0.75, 0, -0.12]; p.head[0] = 0.08; }
    shadow(0, moving ? 7 : 12, 2);
    var root = rootOf(p);
    var parts = hendrik(root, p);
    var shaker = child(parts.aB, 0, -10, 0, sh * 0.6, 0, 0);
    box(shaker, -1.4, -5, -1.4, 1.4, 0.4, 1.4, { all: 'z', l: 'Z', t: 'Z', f: ['zZz', 'zZz', 'MMM', 'zZz', 'zZz'] });
    box(shaker, -1, -6.4, -1, 1, -5, 1, 'Z');
    box(shaker, -0.5, -7.2, -0.5, 0.5, -6.4, 0.5, 'z');
    if (!moving) {                                            // the bar: counter, light top, orange strip, brass rail
      KIND = 5;
      box(root, -11, 0, 3.4, 11, 9, 8.6, { all: 'R', f: ['RRRRRRRRRRR', 'LLLLLLLLLLL', 'RRRRRRRRRRR', 'RRRRRRRRRRR', 'RRRRRRRRRRR', 'rrrrrrrrrrr'] });
      box(root, -12, 9, 2.6, 12, 10.2, 9.6, { all: 'U', t: 'K' });
      box(root, -10, 1.4, 8.6, 10, 2.2, 9.6, 'y');
      // a highball with an orange drink, straw and a twist; a bottle
      box(root, -9, 10.2, 5, -6, 15.2, 8, { all: 'w', f: ['ww', 'AA', 'AA', 'AA', 'AA'], l: ['ww', 'AA', 'AA', 'AA', 'AA'], r: ['ww', 'AA', 'AA', 'AA', 'AA'], t: 'A' });
      box(root, -7.2, 14.5, 6.2, -6.4, 18, 7, 'L');
      box(root, -6.2, 14, 7.2, -5, 15.4, 8.4, 'C');
      box(root, 7, 10.2, 5.2, 8.8, 15.4, 7, 'y');
      box(root, 7.5, 15.4, 5.7, 8.3, 17.8, 6.5, 'y');
      box(root, 7.4, 17.8, 5.6, 8.4, 18.6, 6.6, 'L');
      KIND = 1;
    }
    finish();
    if (!moving) {
      var c = project(toWorld(shaker, [0, -2.5, 0]));
      if (sh > 0) glyph(WAVE, c.x + 4, c.y - 2, PAL.D, 0.8);
      var st = project(toWorld(shaker, [0, -7.2, 0]));
      if (sh > 0.25) { dot(st.x + 2, st.y - 2, PAL.l, 0.9); dot(st.x - 1, st.y - 3, PAL.l, 0.7); }
    }
  }

  function drawKite(dt) {
    kd += (dir - kd) * (1 - Math.exp(-dt * 4));
    var bob = Math.sin(t * 2.4) * 0.6;
    var p = pose();
    p.yaw = 0; p.y = 3 + bob - 0.4; p.rz = kd * 0.28;
    p.lA = [0, 0, -0.3]; p.lB = [0, 0, 0.3];
    p.aA = [-0.25, 0, kd * 1.9]; p.aB = [-0.25, 0, kd * 1.9];
    p.head[1] = kd * 0.5; p.head[0] = -0.2;
    var root = rootOf(p);
    KIND = 5;
    box(root, -7, -1, -2.6, 7, 0, 2.6, { all: 'M', t: function (u) { return u < 0.15 || u > 0.85 ? 'C' : 'L'; }, d: 'L' });
    KIND = 1;
    var parts = hendrik(root, p);
    var bar = child(parts.aB, 0, -9.6, 0, 0, 0, 0);
    box(bar, -0.5, -0.5, -4.5, 0.5, 0.5, 4.5, { all: 'M', l: 'L', r: 'L' });
    // small oval of choppy sea with scattered whitecaps
    KIND = 7;
    var tick = (t * 6) | 0;
    for (var xi = -20; xi < 20; xi += 2) {
      var e = Math.sqrt(Math.max(0, 1 - Math.pow((xi + 1) / 20, 2)));
      var h = (1.6 + 0.6 * Math.sin(xi / 3 + t * 6)) * e;
      (function (xc) {
        box(WORLD, xc, -1.5, -7 * e, xc + 2, h, 1 + 3 * e + (Math.sin(xc * 1.3 + t * 3) > 0 ? 0.8 : 0), {
          all: 'B', f: function (u, v) { return v < 0.2 ? 'a' : 'B'; },
          t: function (u, v) { return ((xc * 3 + ((v * 5) | 0) * 7 + tick) % 9) === 0 ? 'f' : 'a'; }
        });
      })(xi);
    }
    // the kite: one solid orange canopy with a pale leading edge; it arcs over when he turns
    KIND = 5;
    var kx = kd * 13, ky = 35 + 5 * (1 - kd * kd) + Math.sin(t * 1.3) * 1.2;
    var kite = child(WORLD, kx, ky, -6, 0, 0, Math.sin(t * 1.3) * 0.08 - (kd * 0.25));
    for (var i = 0; i < 7; i++) {
      var sx = (i - 3) * 2.9, sy = -0.55 * (i - 3) * (i - 3);
      box(kite, sx - 1.5, sy, -1.6, sx + 1.5, sy + 1.6, 1.6, { all: 'L', t: 'C', d: 'y' });
    }
    KIND = 1;
    finish();
    var b1 = project(toWorld(bar, [0, 0, -4.5])), b2 = project(toWorld(bar, [0, 0, 4.5]));
    var k1 = project(toWorld(kite, [-10, -7.4, 0])), k2 = project(toWorld(kite, [10, -7.4, 0]));
    line2d(b1, k1, PAL.n, 0.55); line2d(b2, k2, PAL.n, 0.55);
    for (var s = 0; s < 7; s++) {
      var sp = (t * 2.2 + s / 7) % 1, sx2 = OX - dir * (8 + s * 1.6 + sp * 5), sy2 = OY - 3 - sp * 5 - (s % 3);
      dot(sx2, sy2, s % 2 ? PAL.f : PAL.a, 1 - sp); dot(sx2 - dir, sy2, PAL.f, (1 - sp) * 0.5);
    }
  }

  function drawSleep() {
    shadow(0, 18, 3);
    KIND = 5;                                                 // the couch
    box(WORLD, -14, 1, -5, 14, 5, 5, { all: 'V', t: 'V', f: ['uuuuuuuuuuuuuuuuuuuuuuuuuuuu', 'VVVVVVVVVVVVVvVVVVVVVVVVVVVV', 'VVVVVVVVVVVVVvVVVVVVVVVVVVVV', 'vvvvvvvvvvvvvvvvvvvvvvvvvvvv'] });
    box(WORLD, -14, 5, -5, 14, 17, -2.2, { all: 'v', t: 'u', f: ['uuuuuuuuuuuuuu', 'VVVVVVVVVVVVVV', 'VVVVVVVVVVVVVV', 'VVVVVVVVVVVVVV'] });
    box(WORLD, -17.5, 1, -5, -14, 11, 5, { all: 'v', t: 'u', f: 'V' });
    box(WORLD, 14, 1, -5, 17.5, 11, 5, { all: 'v', t: 'u', f: 'V' });
    box(WORLD, -16, 0, 3, -15, 1, 4, 'M'); box(WORLD, 15, 0, 3, 16, 1, 4, 'M');
    KIND = 1;
    // Hendrik out cold on his side, head propped on the armrest, under a blanket
    var p = pose();
    p.face = 'sleep'; p.yaw = 0;
    p.aB = [0, 0.93, -1.57]; p.aA = [0, 0, 0];
    p.lA = [0.1, 0, 0]; p.lB = [-0.05, 0, 0];
    var breathe = (t % 3) < 1.5 ? 0 : 1;
    var root = child(WORLD, 13.5, 10, 0.5, 0, 0, Math.PI / 2 - 0.12);
    hendrik(root, p);
    box(WORLD, -3.8, 4.6, -2.4, 11.2, 13.6 + breathe, 3.2, {
      all: 'C', l: 'l',
      f: function (u) { return u > 0.62 && u < 0.72 ? 'L' : 'C'; },
      t: function (u) { return u > 0.62 && u < 0.72 ? 'L' : 'C'; }
    });
    finish();
    var hp = project([-12, 18, 0]);
    for (var z = 0; z < 3; z++) {
      var ph = (t * 0.32 + z / 3) % 1;
      glyph(ph < 0.33 ? Z3 : ph < 0.66 ? Z4 : Z5, hp.x + ph * 9 + z, hp.y - 3 - ph * 16, PAL.D, (1 - ph) * 0.7);
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
    if (current !== act.id) { if (current) poof = 0.4; current = act.id; }

    // follow the cursor (asleep, he stays on his couch)
    moving = false;
    if (mouse && act.speed > 0) {
      var off = act.off || OFFSET_X;
      var tx = mouse.x + off * (mouse.x > window.innerWidth - 160 ? -1 : 1);
      var ty = Math.min(window.innerHeight - 6, mouse.y + OFFSET_Y);
      var dx = tx - state.x, dy = ty - state.y, d = Math.hypot(dx, dy);
      if (d > 6) {
        var stepLen = Math.min(d, act.speed * dt * (d > 300 ? 1.8 : 1));
        state.x += dx / d * stepLen; state.y += dy / d * stepLen;
        walkPhase += stepLen / 7;
        moving = true;
        if (Math.abs(dx) > 3) dir = dx > 0 ? 1 : -1;
      }
    }
    // at rest he stands three-quarter on (so his sides show), turned toward the cursor
    var target = 0;
    if (act.id === 'walk' || act.id === 'podcast' || act.id === 'sax' || act.id === 'cocktail') {
      if (moving) target = dir * 0.85;
      else if (mouse) target = (mouse.x < state.x ? -1 : 1) * clamp(0.45 + Math.abs(mouse.x - state.x) / 400, 0.45, 0.7);
      else target = -0.45;
      if (!moving && act.id === 'sax') target += 0.35;
    }
    yaw += (target - yaw) * (1 - Math.exp(-dt * 7));

    clear();
    KIND = 1;
    DRAW[act.id](dt);
    if (poof > 0) {                                           // a few squares on the 7px grid, not a sparkle
      poof -= dt;
      var k = 1 - poof / 0.4, rad = 4 + k * 12;
      for (var a = 0; a < 6; a++) {
        var ax = Math.round(OX + Math.cos(a * 1.047) * rad), ay = Math.round(OY - 14 + Math.sin(a * 1.047) * rad * 0.6);
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
