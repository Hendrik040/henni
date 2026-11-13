// Behaviour check for Henni on his own: node tools/outing-test.mjs pet.js
// He is mostly off on his own (roaming with pauses, a Club-Mate break, cartwheels, a backflip, a dance)
// and visits the cursor now and then; wherever he stops, he keeps clear of text. Fakes the page, the
// clock, Math.random and a block of text, then reads where he is from the canvas position, what he
// thinks from the thought bubble and his saved state.
import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const OX = 64, OY = 82, SCALE = 3;

function boot({ saved = {}, rand = 0.1, text = null } = {}) {
  let cb = null, now = 0, st = { elapsed: 5, x: 600, y: 500, wait: 30, arrived: true, ...saved };
  const said = [], wl = {}, cl = {};
  const canvases = [];
  const mkCanvas = () => {
    const c = { width: 0, height: 0, style: {}, title: '', img: null, setAttribute() {}, addEventListener(t, f) { cl[t] = f; } };
    const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData(i) { c.img = i; } };
    c.getContext = () => ctx; canvases.push(c); return c;
  };
  const mk = () => {
    let text = '';
    return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {},
      get textContent() { return text; }, set textContent(v) { text = v; if (this.className === 'kt-pet-thought') said.push(v); } };
  };
  const window = { innerWidth: 1200, innerHeight: 800, scrollY: 0, matchMedia: q => ({ matches: q.includes('pointer: fine') }),
    addEventListener(t, f) { (wl[t] ||= []).push(f); } };
  const document = { title: 'Test', hidden: false, documentElement: { scrollHeight: 4000 }, createElement: t => t === 'canvas' ? mkCanvas() : mk(),
    body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {}, querySelector: () => null,
    elementFromPoint: (x, y) => ({ closest: () => (text && x >= text[0] && x <= text[2] && y >= text[1] && y <= text[3] ? {} : null) }) };
  const ss = { getItem: () => JSON.stringify(st), setItem: (k, v) => { st = JSON.parse(v); } };
  const R = Array.isArray(rand) ? rand : [rand];
  let ri = 0;
  Math.random = () => R[ri++ % R.length];
  new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', 'location', src)(
    window, document, ss, { now: () => now }, f => { cb = f; return 1; }, f => { globalThis.__save = f; return 0; }, { hostname: 'example.com', pathname: '/' });
  const main = canvases[0];
  const api = {
    said,
    move(x, y) { (wl.mousemove || []).forEach(f => f({ clientX: x, clientY: y })); },
    pos() { const m = /translate\((-?\d+)px,(-?\d+)px\)/.exec(main.style.transform || ''); return m ? [+m[1] + OX * SCALE, +m[2] + OY * SCALE] : null; },
    state() { globalThis.__save(); return st; },
    click() { cl.click && cl.click({ clientX: -999, clientY: -999 }); },
    // the bounding box of everything drawn on the main canvas this frame (him, shadow, props)
    bbox() {
      const img = main.img;
      if (!img) return null;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < img.width * img.height; i++) if (img.data[i * 4 + 3] > 200) {
        const x = i % img.width, y = (i / img.width) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return x1 < 0 ? null : { w: x1 - x0 + 1, h: y1 - y0 + 1 };
    },
    // run s seconds; mouse is [x, y], a function of time, or null; onFrame(t) sees every frame
    step(s, mouse, onFrame) {
      const end = now + s * 1000;
      while (now < end) {
        now += 1000 / 60;
        if (mouse) {                                            // like a browser: mousemove only when the mouse moves
          const m = typeof mouse === 'function' ? mouse(now / 1000) : mouse;
          if (!api.last || m[0] !== api.last[0] || m[1] !== api.last[1]) { api.move(m[0], m[1]); api.last = m; }
        }
        cb(now);
        if (onFrame) onFrame(now / 1000);
      }
    }
  };
  return api;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// the longest stretch (seconds) he stays on one spot at least `away` px from `from`, sampling every frame
function longestStay(api, secs, mouse, from = [-1e4, -1e4], away = 0) {
  let best = 0, since = 0, at = null;
  api.step(secs, mouse, tt => {
    const p = api.pos();
    if (dist(p, from) < away) { at = null; return; }
    if (at && dist(p, at) < 1) best = Math.max(best, tt - since); else { at = p; since = tt; }
  });
  return best;
}

const fails = [];
const check = (name, ok, got) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' → ' + JSON.stringify(got))); if (!ok) fails.push(name); };
const park = [300, 600], spot = [338, 634];                     // where he stands when the cursor rests at park
const roam = tt => [200 + 400 * (1 + Math.sin(tt * 0.7)), 140];  // the cursor wandering along the top, never over him
const MIX = [0.13, 0.57, 0.91, 0.34, 0.72, 0.05, 0.48, 0.86, 0.21, 0.65, 0.39, 0.77];   // a spread of "random" numbers
const TEXT = [250, 250, 700, 800];                              // a column of text on the left of a 1200 × 800 window
// how much of a box (w × h, bottom-centred on his feet) lies over TEXT, as the page would measure it
function over(p, w, h) {
  let hit = 0;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
    const x = p[0] - w / 2 + w * (i + 0.5) / 5, y = p[1] - h + h * (j + 0.5) / 4;
    if (x >= TEXT[0] && x <= TEXT[2] && y >= TEXT[1] && y <= TEXT[3]) hit++;
  }
  return hit / 20;
}
// the spots where he stood still for at least `min` seconds
function stops(api, secs, mouse, min = 1.2) {
  const out = []; let at = null, since = 0;
  api.step(secs, mouse, tt => {
    const p = api.pos();
    if (at && dist(p, at) < 1) { if (tt - since >= min && !out.some(o => dist(o, at) < 1)) out.push(at); }
    else { at = p; since = tt; }
  });
  return out;
}

// 1. he follows the cursor for a while after he arrives, then is off on his own
{
  const h = boot({ saved: { free: 0, outIn: 10 }, rand: MIX });
  h.step(6, park);
  check('follows the cursor at first', dist(h.pos(), spot) < 8, h.pos());
  let far = 0;
  h.step(14, park, () => { far = Math.max(far, dist(h.pos(), spot)); });
  check('then walks off on his own', far > 150, far);
}
// 2. mostly on his own: with the cursor resting, he is away from it most of the time, but comes back now and then,
//    and something new happens at least every 30 seconds
{
  const h = boot({ saved: { free: 0, outIn: 8 }, rand: MIX });
  let away = 0, near = 0, frames = 0, stuck = 0, since = 0, last = null;
  h.step(240, park, tt => {
    const p = h.pos(), d = dist(p, spot);
    frames++; if (d > 100) away++; if (tt > 30 && d < 8) near++;
    if (tt > 74 && tt < 121) since = tt;                        // the podcast studio: he hosts it where you are (guests come in) — not counted
    else if (last && dist(p, last) < 1) stuck = Math.max(stuck, tt - since); else since = tt;
    last = p;
  });
  check('mostly on his own: away from the resting cursor most of the time', away / frames > 0.5, (away / frames).toFixed(2));
  check('now and then he comes back to the cursor', near > 60, near);
  check('something new at least every 30 seconds (outside the podcast studio)', stuck < 30, stuck.toFixed(1));
  check('says what he is up to now and then', h.said.length >= 3, h.said);
}
// 3. a Club-Mate break: sits on his crate for about 25 seconds while the cursor wanders
{
  const h = boot({ saved: { outNow: 'mate' }, rand: MIX });
  h.step(1, park);
  check('Club-Mate: says so', h.said.includes('Club-Mate break'), h.said);
  const stay = longestStay(h, 45, roam, spot, 100);
  check('Club-Mate: sits in one spot for about 25 seconds', stay > 18 && stay < 32, stay);
}
// 4. cartwheels: somewhere along the way he is sideways, wider than he is tall
{
  const h = boot({ saved: { outNow: 'wheel' }, rand: 0.6 });
  let sideways = false, standW = 0, standH = 0;
  h.step(0.1, park, () => { const b = h.bbox(); if (b) { standW = b.w; standH = b.h; } });
  h.step(15, park, () => { const b = h.bbox(); if (b && b.w > b.h + 4) sideways = true; });
  check('cartwheels: says so', h.said.includes('watch this'), h.said);
  check('cartwheels: he goes over sideways', sideways && standH > standW, { sideways, standW, standH });
}
// 5. a backflip: side-on, he goes over: somewhere mid-air he is upside down or sideways, and lands on his feet
{
  const h = boot({ saved: { outNow: 'flip' }, rand: 0.6 });
  let over = false, tallAgain = false, standH = 0;
  h.step(0.1, park, () => { const b = h.bbox(); if (b) standH = b.h; });
  h.step(12, park, tt => { const b = h.bbox(); if (!b) return; if (b.w > b.h + 2 || b.h < standH * 0.7) over = true; else if (over && b.h > standH * 0.9) tallAgain = true; });
  check('backflip: says so', h.said.includes('backflip!'), h.said);
  check('backflip: goes over and lands on his feet', over && tallAgain, { over, tallAgain, standH });
}
// 6. a dance: he picks a spot and dances there for a few seconds
{
  const h = boot({ saved: { outNow: 'dance' }, rand: 0.9 });
  h.step(1, park);
  const stay = longestStay(h, 15, park, spot, 100);
  check('dance: says so', h.said.includes('this is my song'), h.said);
  check('dance: dances on a spot of his own for a few seconds', stay > 5, stay);
}
// 7. roaming: he walks to a spot, looks around, walks on to another
{
  const h = boot({ saved: { outNow: 'roam' }, rand: MIX });
  const s = stops(h, 20, park);
  check('roaming: stops at two or more spots of his own', s.length >= 2 && dist(s[0], s[s.length - 1]) > 60, s);
}
// 8. wherever he stops on his own, he keeps clear of the text
{
  const h = boot({ saved: { free: 0, outIn: 2 }, rand: MIX, text: TEXT });
  const s = stops(h, 120, [1100, 160], 1.2).filter(p => dist(p, [1138, 194]) > 40);   // not counting a visit to the cursor
  const bad = s.filter(p => over(p, 110, 140) > 0.2);
  check('on his own: never stops over text', s.length >= 3 && bad.length === 0, { stops: s.length, bad });
}
// 9. coding: with the cursor resting on the text, he sets up his desk next to it, clear of the text
{
  const h = boot({ saved: { elapsed: 36, free: 0, outIn: 100 }, rand: MIX, text: TEXT });
  h.step(10, [500, 500]);
  const p = h.pos();
  check('coding: sets up his desk clear of the text', over(p, 340, 250) < 0.2 && dist(p, [538, 534]) < 500, p);
}
// 10. clicking him ends whatever he is doing on his own and skips ahead, as a click always does
{
  const h = boot({ saved: { outNow: 'mate' }, rand: 0.1 });
  h.step(8, park);
  check('a click: he is off on his own first', dist(h.pos(), spot) > 100, h.pos());
  h.click();
  let back = 1e9;
  h.step(8, park, () => { back = Math.min(back, dist(h.pos(), spot)); });
  const st = h.state();
  check('a click brings him back to the cursor', back < 8, back);
  check('a click skips ahead in his day', st.elapsed >= 35 && st.elapsed < 50, st.elapsed);
}
// 11. pinned, he stays where he was put
{
  const h = boot({ saved: { free: 100, outIn: 20, pinned: true, x: 700, y: 600 } });
  h.step(12, park);
  check('pinned: stays put', dist(h.pos(), [700, 600]) < 2, h.pos());
}
// 12. on a board or asleep, nothing of his own
for (const [name, elapsed] of [['surfing', 126], ['asleep', 366]]) {
  const h = boot({ saved: { elapsed, free: 100, outIn: 20 } });
  h.step(10, roam);
  check(name + ': nothing of his own', !h.said.some(x => ['Club-Mate break', 'watch this', 'this is my song', 'backflip!', 'just looking around'].includes(x)), h.said);
}

process.exit(fails.length ? 1 : 0);
