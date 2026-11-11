import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
let cb = null, now = 0, saved = { elapsed: 10, x: 600, y: 500 }, captured = null, scheduled = 0;
const els = [];
const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData(i) { captured = i; } };
const canvas = { width: 0, height: 0, style: {}, setAttribute() {}, addEventListener() {}, getContext: () => ctx };
const mk = () => { const l = {}; const e = { style: {}, setAttribute() {}, appendChild() {}, addEventListener(t, f) { l[t] = f; }, fire(t) { l[t] && l[t]({ stopPropagation() {} }); } }; els.push(e); return e; };
const window = { innerWidth: 1200, innerHeight: 800, matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener() {} };
const document = { createElement: t => t === 'canvas' ? canvas : mk(), body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {} };
const ss = { getItem: () => JSON.stringify(saved), setItem: (k, v) => { saved = JSON.parse(v); } };
new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', src)(window, document, ss, { now: () => now }, f => { cb = f; scheduled++; return 1; }, () => 0);
const step = s => { const end = now + s * 1000; while (now < end) { now += 1000 / 60; const before = scheduled; cb(now); if (scheduled === before) return 'stopped'; } return 'running'; };
step(1);
els[0].fire('click');                                 // the bubble
const r1 = step(1.5), mid = saved.leaving;
const r2 = step(3);
console.log({ midLeaving: mid, finalHome: saved.home, leaving: saved.leaving, loop: r2, canvasHidden: canvas.style.visibility });
