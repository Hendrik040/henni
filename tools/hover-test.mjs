// hover him: the bubble shows, he holds still; leave: after the grace period he follows again
import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
let cb = null, now = 0; const listeners = {}, els = [], canvases = [];
const mk = () => { const e = { style: {}, setAttribute() {}, addEventListener(t, f) { (e.l ||= {})[t] = f; }, appendChild() {}, textContent: '' }; els.push(e); return e; };
const mkCanvas = () => { const c = { width: 0, height: 0, style: {}, setAttribute() {}, addEventListener() {} };
  c.getContext = () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData() {} }); canvases.push(c); return c; };
const window = { innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener(t, f) { (listeners[t] ||= []).push(f); } };
const document = { createElement: t => t === 'canvas' ? mkCanvas() : mk(), body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {} };
const ss = { getItem: () => JSON.stringify({ elapsed: 10, x: 600, y: 500 }), setItem() {} };
new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', src)(window, document, ss, { now: () => now }, f => { cb = f; return 1; }, () => 0);
const box = () => canvases[0].style.transform.match(/-?\d+/g).map(Number);
const move = (x, y) => (listeners.mousemove || []).forEach(f => f({ clientX: x, clientY: y, target: {} }));
const step = (s, at) => { const end = now + s * 1000; while (now < end) { now += 1000 / 60; if (at) move(at[0], at[1]); const f = cb; cb = null; f(now); } };
step(1);
const [bx, by] = box(), onHim = [bx + 64 * 3, by + 55 * 3];
step(0.5, onHim);
const bubble = els.find(e => e.textContent === 'send Henni home');
console.log('bubble shown on hover:', bubble.style.display);
const b0 = box(), t0 = bubble.style.transform; step(2.5, onHim);
console.log('held still while hovering:', JSON.stringify(b0) === JSON.stringify(box()), '| bubble pinned:', t0 === bubble.style.transform);
const far = [bx + 64 * 3, by + 10];            // cursor between him and the bubble, off his pixels
step(0.5, far); console.log('still held during grace:', JSON.stringify(b0) === JSON.stringify(box()), '| bubble:', bubble.style.display);
step(1.5, [150, 150]); console.log('follows again after leaving:', JSON.stringify(b0) !== JSON.stringify(box()), '| bubble:', bubble.style.display);
