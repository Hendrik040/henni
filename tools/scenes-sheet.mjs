// Timeline frames of the new scenes. usage: node scenes-sheet.mjs <pet.js> <out.png>
import fs from 'fs';
import zlib from 'zlib';
const [, , PET, OUT] = process.argv;
const src = fs.readFileSync(PET, 'utf8');
const BG = [19, 17, 24], Z = +(process.env.Z || 4), GAP = 6;   // Z even, so the 2x overlay lands on whole pixels

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(b) { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function boot(saved) {
  let cb = null, now = 0;
  const listeners = {}, canvases = [];
  const mkCanvas = () => {
    const c = { width: 0, height: 0, style: {}, title: '', captured: null, setAttribute() {}, addEventListener() {} };
    const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData(img) { c.captured = img; } };
    c.getContext = () => ctx; canvases.push(c); return c;
  };
  const window = { innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener(t, f) { (listeners[t] ||= []).push(f); } };
  const document = { createElement: tag => tag === 'canvas' ? mkCanvas() : { style: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, textContent: '' }, body: { appendChild() {} }, addEventListener() {} };
  const sessionStorage = { getItem: () => JSON.stringify(saved), setItem() {} };
  new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', src)(
    window, document, sessionStorage, { now: () => now }, f => { cb = f; return 1; }, () => 0);
  return {
    move(x, y) { (listeners.mousemove || []).forEach(f => f({ clientX: x, clientY: y })); },
    until(sec) { while (now < sec * 1000) { now += 1000 / 60; cb(now); } },
    frame() {
      const m = canvases[0].captured, o = canvases[1] && canvases[1].captured;
      return { w: m.width, h: m.height, data: Uint8ClampedArray.from(m.data), ov: o ? { w: o.width, h: o.height, data: Uint8ClampedArray.from(o.data) } : null };
    },
  };
}
const rows = [];
// mouse: [x,y] or a function of time returning [x,y]
function scene(saved, mouse, times) {
  const p = boot(saved), row = [];
  let tcur = 0, last = null;
  for (const tm of times) {
    while (tcur < tm) {
      tcur = Math.min(tm, tcur + 1 / 60);
      if (mouse) {                                               // like a browser: mousemove only when the mouse moves
        const m = typeof mouse === 'function' ? mouse(tcur) : mouse;
        if (!last || m[0] !== last[0] || m[1] !== last[1]) { p.move(m[0], m[1]); last = m; }
      }
      p.until(tcur);
    }
    row.push(p.frame());
  }
  for (let i = 0; i < row.length; i += 5) rows.push(row.slice(i, i + 5));
}
const park = [562, 466];
const swing = tt => (Math.floor(tt / 2) % 2 ? [80, 466] : [1150, 466]);
const which = (process.env.ONLY || 'arrival,podcast,cocktail,coding,ski').split(',');
if (which.includes('arrival')) scene({ elapsed: 0, x: 600, y: 500, wait: 29.5, arrived: false }, null, [0.8, 1.3, 1.8, 2.4, 3.0, 3.6]);
if (which.includes('podcast')) { const PX = +(process.env.PX || 600); scene({ elapsed: 81, x: PX, y: 500 }, [PX - 38, 466], process.env.CT ? process.env.CT.split(',').map(Number) : [0.8, 1.6, 2.5, 3.2, 3.9, 5.0, 7.0]); }
if (which.includes('cocktail')) scene({ elapsed: 216, x: 600, y: 500 }, park, process.env.CT ? process.env.CT.split(',').map(Number) : [1.5, 3.6, 5.4, 7.6, 10.4, 11.9, 13.8, 16.9, 20.0, 22.6, 24.8, 26.3]);
if (which.includes('coding')) scene({ elapsed: 36, x: 600, y: 500 }, park, process.env.CT ? process.env.CT.split(',').map(Number) : [2.5, 6.0, 10.0, 14.0]);
if (which.includes('ski')) scene({ elapsed: 276, x: 600, y: 500 }, swing, [0.6, 1.2, 1.5, 1.8, 2.3, 4.6, 5.0, 5.3, 8.4, 9.2, 12.1, 12.4, 15.7, 16.0]);
if (which.includes('walk')) scene({ elapsed: 10, x: 600, y: 500 }, swing, process.env.CT ? process.env.CT.split(',').map(Number) : [1.0, 1.5, 3.0]);
if (which.includes('surf')) scene({ elapsed: 126, x: 600, y: 500 }, swing, [1.0, 1.6, 2.2]);
// outings, with Math.random pinned so each is the one asked for (it also fixes where he walks to)
const CT = process.env.CT ? process.env.CT.split(',').map(Number) : null;
const outing = (r, times, kind) => { Math.random = () => r; scene({ elapsed: 10, x: 600, y: 500, free: 0, outIn: 20, outNow: kind }, park, CT || times); };
if (which.includes('mate')) outing(0.1, [2.0, 5.35, 5.95, 7.05, 9.0, 9.55, 10.05, 12.05, 18.05, 54.05, 54.65], 'mate');
if (which.includes('wheel')) outing(0.6, [0.8, 1.5, 1.61, 1.72, 1.83, 1.93, 2.04, 2.15, 4.2, 4.6, 5.2], 'wheel');
if (which.includes('flip')) outing(0.6, [0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.6, 6.0], 'flip');
if (which.includes('roam')) outing(0.3, [1, 3, 5, 7, 9, 11, 13, 15], 'roam');
if (which.includes('dance')) outing(0.9, [5.3, 5.5, 5.7, 6.0, 6.4, 7.0, 8.5, 12.8, 13.4], 'dance');
const fw = Math.max(...rows.flat().map(f => f.w)), fh = Math.max(...rows.flat().map(f => f.h));
const cols = Math.max(...rows.map(r => r.length)), cw = fw * Z, ch = fh * Z;
const SW = cols * (cw + GAP) + GAP, SH = rows.length * (ch + GAP) + GAP;
const out = new Uint8ClampedArray(SW * SH * 4);
for (let i = 0; i < SW * SH; i++) { out[i * 4] = 40; out[i * 4 + 1] = 36; out[i * 4 + 2] = 48; out[i * 4 + 3] = 255; }
rows.forEach((row, r) => row.forEach((f, c) => {
  const ox = GAP + c * (cw + GAP), oy = GAP + r * (ch + GAP);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const sx = Math.floor(x / Z), sy = Math.floor(y / Z), di = ((oy + y) * SW + ox + x) * 4;
    let rgb = BG;
    if (sx < f.w && sy < f.h) { const si = (sy * f.w + sx) * 4, a = f.data[si + 3] / 255; rgb = [0, 1, 2].map(k => Math.round(f.data[si + k] * a + BG[k] * (1 - a))); }
    if (f.ov) {
      const qx = Math.floor(x * f.ov.w / (f.w * Z)), qy = Math.floor(y * f.ov.h / (f.h * Z));   // overlay may be finer than the frame
      if (qx < f.ov.w && qy < f.ov.h) { const oi = (qy * f.ov.w + qx) * 4, a = f.ov.data[oi + 3] / 255; if (a) rgb = [0, 1, 2].map(k => Math.round(f.ov.data[oi + k] * a + rgb[k] * (1 - a))); }
    }
    out[di] = rgb[0]; out[di + 1] = rgb[1]; out[di + 2] = rgb[2];
  }
}));
fs.writeFileSync(OUT, png(SW, SH, out));
console.log('wrote', OUT, SW + 'x' + SH);
