// Behaviour check for Henni's outings: node tools/outing-test.mjs pet.js
// Now and then he stops following the cursor and goes his own way: a Club-Mate break on a crate,
// cartwheels, or a dance. Fakes the page, the clock and Math.random, then reads where he is from
// the canvas position, what he thinks from the thought bubble and his saved state.
import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const OX = 64, OY = 82, SCALE = 3;

function boot({ saved = {}, rand = 0.1 } = {}) {
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
    body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {}, querySelector: () => null };
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

// 1. a Club-Mate break: he leaves the cursor, sits on his crate for most of a minute, then comes back
{
  const h = boot({ saved: { free: 40, outIn: 45 }, rand: 0.1 });
  h.step(4, park);
  check('follows the cursor before his break', dist(h.pos(), spot) < 8, h.pos());
  let far = 0;
  h.step(10, park, () => { far = Math.max(far, dist(h.pos(), spot)); });
  check('after a while he stops following and walks off on his own', far > 150, far);
  check('says what he is up to', h.said.includes('Club-Mate break'), h.said);
  const stay = longestStay(h, 50, roam, spot, 100);
  check('sits in one spot for most of a minute while the cursor wanders', stay > 40, stay);
  const mid = h.state();
  check('his day waits while he is off on his own', mid.elapsed < 30 && (mid.done || []).join() === 'walk', { elapsed: mid.elapsed, done: mid.done });
  let back = 1e9;
  h.step(20, park, () => { back = Math.min(back, dist(h.pos(), spot)); });
  check('afterwards he follows the cursor again', back < 8, back);
  const after = h.state();
  check('the next outing is a minute or two away', after.free < 25 && after.outIn >= 60 && after.outIn <= 120, { free: after.free, outIn: after.outIn });
}
// 2. cartwheels: somewhere along the way he is sideways, wider than he is tall
{
  const h = boot({ saved: { free: 44.5, outIn: 45 }, rand: 0.6 });
  let sideways = false, standW = 0, standH = 0;
  h.step(1, park, () => { const b = h.bbox(); if (b) { standW = b.w; standH = b.h; } });
  h.step(15, park, () => { const b = h.bbox(); if (b && b.w > b.h + 4) sideways = true; });
  check('cartwheels: says so', h.said.includes('watch this'), h.said);
  check('cartwheels: he goes over sideways', sideways && standH > standW, { sideways, standW, standH });
}
// 3. a dance: he picks a spot and dances there for a few seconds
{
  const h = boot({ saved: { free: 44.5, outIn: 45 }, rand: 0.9 });
  h.step(1, park);
  const stay = longestStay(h, 15, park, spot, 100);
  check('dance: says so', h.said.includes('this is my song'), h.said);
  check('dance: dances on a spot of his own for a few seconds', stay > 5, stay);
}
// 4. clicking him ends the outing and skips ahead, as a click always does
{
  const h = boot({ saved: { free: 44.5, outIn: 45 }, rand: 0.1 });
  h.step(14, park);
  check('a click: he is off on his break first', dist(h.pos(), spot) > 100, h.pos());
  h.click();
  let back = 1e9;
  h.step(8, park, () => { back = Math.min(back, dist(h.pos(), spot)); });
  const s = h.state();
  check('a click ends the break: he follows again', back < 8, back);
  check('a click skips ahead in his day', s.elapsed >= 35 && s.elapsed < 50, s.elapsed);
}
// 5. pinned, he stays where he was put
{
  const h = boot({ saved: { free: 100, outIn: 45, pinned: true, x: 700, y: 600 } });
  const p0 = h.pos() || [700, 600];
  h.step(12, park);
  check('pinned: no outings', !h.said.includes('Club-Mate break') && dist(h.pos(), [700, 600]) < 2, { said: h.said, pos: h.pos(), p0 });
}
// 6. settled into a sit-down scene, he isn't pulled away from it
{
  const h = boot({ saved: { elapsed: 36, free: 20, outIn: 45, x: 338, y: 634 } });
  h.step(40, park);
  const s = h.state();
  check('coding at his desk: no outing, and no time counted toward one', !h.said.includes('Club-Mate break') && s.free < 22, { said: h.said, free: s.free });
}
// 7. on a board or asleep, no outings
for (const [name, elapsed] of [['surfing', 126], ['asleep', 366]]) {
  const h = boot({ saved: { elapsed, free: 100, outIn: 45 } });
  h.step(10, roam);
  check(name + ': no outings', !h.said.some(x => ['Club-Mate break', 'watch this', 'this is my song'].includes(x)), h.said);
}

// 8. the lab can ask for a particular outing straight away
{
  const h = boot({ saved: { outNow: 'dance' }, rand: 0.1 });
  h.step(1, park);
  check('lab: an outing on request, right away', h.said.includes('this is my song'), h.said);
}

process.exit(fails.length ? 1 : 0);
