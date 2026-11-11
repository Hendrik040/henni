// Review sheets for The Merge guests: each guest walking in, listening, talking, waving and leaving
// (close-ups at 2x site size), plus the whole studio at site size, next to their reference frames.
//   node tools/guest-sheet.mjs variants/bh-ink.js [slug ...]
// Writes guests/review/<slug>.png and guests/review/index.html (git-ignored).
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
const [, , PET, ...ARGS] = process.argv;
const CHECK = ARGS.includes('--check'), ONLY = ARGS.filter(a => a !== '--check');
const src = fs.readFileSync(PET, 'utf8');
const CAT = JSON.parse(fs.readFileSync('guests/merge-guests.json', 'utf8'));
const DIR = 'guests', OUT = DIR + '/review';
const BG = [19, 17, 24], GAP = 6;

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(b) { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function looksFor(slug) {
  const looks = {};
  new Function('ktGuest', fs.readFileSync(`${DIR}/${slug}.js`, 'utf8'))((id, f) => { looks[id] = f; });
  if (!looks[slug]) throw new Error(`${slug}.js must call ktGuest('${slug}', ...)`);
  // only this guest is on: they walk in first
  return { looks, catalogue: { ...CAT, guests: CAT.guests.map(g => ({ ...g, live: g.id === slug })) } };
}
function boot(guests) {
  let cb = null, now = 0;
  const listeners = {}, canvases = [];
  const mkCanvas = () => {
    const c = { width: 0, height: 0, style: {}, title: '', captured: null, setAttribute() {}, addEventListener() {} };
    c.getContext = () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData(img) { c.captured = img; } });
    canvases.push(c); return c;
  };
  const el = () => ({ style: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, textContent: '' });
  const window = { innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, ktPetGuests: guests, matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener(t, f) { (listeners[t] ||= []).push(f); } };
  const document = { title: 'Review', hidden: false, documentElement: { scrollHeight: 2000 }, createElement: t => (t === 'canvas' ? mkCanvas() : el()), body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {}, querySelector: () => null };
  const saved = { elapsed: 81, x: 600, y: 500, wait: 30, arrived: true };
  new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', 'location', 'fetch', src)(
    window, document, { getItem: () => JSON.stringify(saved), setItem() {} }, { now: () => now }, f => { cb = f; return 1; }, () => 0,
    { hostname: 'review.local', pathname: '/' }, () => ({ then() {} }));
  (listeners.mousemove || []).forEach(f => f({ clientX: 562, clientY: 466, target: {} }));
  return {
    until(sec) { while (now < sec * 1000) { now += 1000 / 60; cb(now); } },
    frame() { const m = canvases[0].captured; return { w: m.width, h: m.height, data: Uint8ClampedArray.from(m.data) }; }
  };
}
// guest time → clock: the studio opens 0.35 s after he stops, the first guest's slot starts 1.35 s later
const T = lt => lt + 1.7;
const CLOSE = [['walk in', 0.45], ['to the chair', 1.2], ['listening', 3.6], ['talking', 6.1], ['waving', 15.5], ['leaving', 16.8]];
function sheet(slug) {
  const p = boot(looksFor(slug)), frames = [];
  for (const [, lt] of CLOSE) { p.until(T(lt)); frames.push({ f: p.frame(), z: 6, crop: [62, 16, 66, 74] }); }
  const q = boot(looksFor(slug)); q.until(T(6.1)); frames.push({ f: q.frame(), z: 3, crop: null });
  const dims = frames.map(({ f, z, crop }) => [(crop ? crop[2] : f.w) * z, (crop ? crop[3] : f.h) * z]);
  const SW = dims.reduce((a, d) => a + d[0] + GAP, GAP), SH = Math.max(...dims.map(d => d[1])) + 2 * GAP;
  const out = new Uint8ClampedArray(SW * SH * 4);
  for (let i = 0; i < SW * SH; i++) out.set([40, 36, 48, 255], i * 4);
  let ox = GAP;
  frames.forEach(({ f, z, crop }, n) => {
    const [cx, cy, cw, ch] = crop || [0, 0, f.w, f.h];
    for (let y = 0; y < ch * z; y++) for (let x = 0; x < cw * z; x++) {
      const si = ((cy + Math.floor(y / z)) * f.w + cx + Math.floor(x / z)) * 4, a = f.data[si + 3] / 255;
      out.set([0, 1, 2].map(k => Math.round(f.data[si + k] * a + BG[k] * (1 - a))).concat(255), ((GAP + y) * SW + ox + x) * 4);
    }
    ox += dims[n][0] + GAP;
  });
  fs.writeFileSync(`${OUT}/${slug}.png`, png(SW, SH, out));
}
// --check: each guest must actually be drawn (a look that fails to build or draw is dropped silently)
function drawn(slug) {
  const a = boot(looksFor(slug)), b = boot(null);
  a.until(T(6.1)); b.until(T(6.1));
  const fa = a.frame().data, fb = b.frame().data;
  for (let i = 0; i < fa.length; i++) if (fa[i] !== fb[i]) return true;
  return false;
}
if (CHECK) {
  const slugs = ONLY.length ? ONLY : fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
  const bad = slugs.filter(s => { try { return !drawn(s); } catch (e) { return true; } });
  if (bad.length) { console.error('not drawn:', bad.join(', ')); process.exit(1); }
  console.log('all drawn:', slugs.length);
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
const slugs = ONLY.length ? ONLY : fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
// contrast of each ramp step on the #131118 page; dark ramps should reach Midnight's lift
// (step 1 ≥ 1.8:1, step 2 ≥ 2.4:1 — Henni's black-hoodie colourway), skin is exempt
const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const cr = h => (lum(h) + 0.05) / (lum('#131118') + 0.05);
function contrast(slug) {
  const looks = looksFor(slug).looks, HH = 12 / Math.cos(0.38);
  const swap = (rows, i, row) => { const c = rows.slice(); c[i] = row; return c; };
  const look = looks[slug]({ HH, STRANDS: ['HhHHHhHHHhHH', 'HhHHHhHHHhHH', 'HHHHHHHHHHHH'], swap, FACE: [] });
  const warn = [];
  for (const [r, hex] of Object.entries(look.ramps || {})) {
    if (r === 'gskin' || hex.length !== 5) continue;
    const c = hex.map(cr);
    if (c[1] < 1.8 || c[2] < 2.4) warn.push(`${r} steps 1/2 at ${c[1].toFixed(2)}/${c[2].toFixed(2)}:1`);
  }
  console.log(warn.length ? `  contrast: lift ${warn.join('; ')}` : '  contrast: ok');
}
for (const s of slugs) { sheet(s); console.log('wrote', `${OUT}/${s}.png`); contrast(s); }
const all = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4));
const rows = CAT.guests.filter(g => all.includes(g.id)).map(g => `<section><h2>${g.name} <small>${g.company}</small></h2>
<img class="ref" src="../research/sheets/${g.id}.png" alt=""><img class="px" src="${g.id}.png?${Date.now()}" alt=""></section>`).join('\n');
fs.writeFileSync(`${OUT}/index.html`, `<!doctype html><meta charset="utf-8"><title>Guest review</title>
<style>body{background:#131118;color:#ece9f1;font:14px ui-monospace,monospace;margin:24px}section{margin:0 0 36px}h2{font-size:16px}small{color:#8a829b}
img{display:block;max-width:100%;margin:8px 0}.ref{max-width:720px}.px{image-rendering:pixelated}</style>
<h1>The Merge guests · review</h1><p>${CLOSE.map(c => c[0]).join(' · ')} · whole studio at site size</p>
${rows}`);
console.log('review page:', `${OUT}/index.html`);
