// Behaviour check for Henni's podcast guests: node tools/guests-test.mjs variants/bh-ink.js
// Fakes the page, the clock, the proxy and pet-guests.js, then checks who walks into the studio,
// what their tag says, that clicking them opens their episode, and that the studio copes without guests.
import fs from 'fs';
const SRC = process.argv[2] || 'variants/big-hoodie.js';
const src = fs.readFileSync(SRC, 'utf8');
const CAT = JSON.parse(fs.readFileSync('guests/merge-guests.json', 'utf8'));
const JESSE_YELLOW = ['#c9a136', '#e9c453', '#f2d77a'];

// every guest gets a plain look; Jesse gets his real one, so his glasses can be found on screen
function bundle() {
  const looks = {};
  for (const g of CAT.guests) looks[g.id] = () => ({ ramps: {} });
  new Function('ktGuest', fs.readFileSync('guests/jesse-vincent.js', 'utf8'))((id, f) => { looks[id] = f; });
  return { looks, catalogue: CAT };
}
const settled = v => ({ then: (ok, bad) => { try { return settled(ok ? ok(v) : v); } catch (e) { return bad ? settled(bad(e)) : failed(e); } } });
const failed = e => ({ then: (ok, bad) => (bad ? settled(bad(e)) : failed(e)) });

function boot({ path = '/', elapsed = 81, seen, guests = bundle(), jev = null, host = 'localhost' } = {}) {
  let cb = null, now = 0, saved = { elapsed, x: 600, y: 500, wait: 30, arrived: true, seen };
  const win = {}, doc = {}, canvases = [], tags = [], opened = [], calls = [];
  const on = (o, t, f) => ((o[t] ||= []).push(f));
  const mkCanvas = () => {
    const c = { width: 0, height: 0, style: {}, title: '', captured: null, setAttribute() {}, addEventListener: (t, f) => on(c, '_' + t, f) };
    c.getContext = () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData(img) { c.captured = img; } });
    canvases.push(c); return c;
  };
  const els = [];
  const mk = () => {
    let text = '';
    const el = { style: {}, setAttribute() {}, appendChild() {}, addEventListener: (t, f) => on(el, '_' + t, f),
      get textContent() { return text; }, set textContent(v) { text = v; if (el.className === 'kt-pet-tag') tags.push(v); } };
    els.push(el); return el;
  };
  const window = Object.assign(win, { innerWidth: 1200, innerHeight: 800, scrollY: 0, ktPetGuests: guests || undefined,
    matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener: (t, f) => on(win, t, f), open: (u, w) => { opened.push(u); return null; } });
  const document = Object.assign(doc, { title: 'Test', hidden: false, documentElement: { scrollHeight: 4000 },
    createElement: t => (t === 'canvas' ? mkCanvas() : mk()), body: { appendChild() {} }, head: { appendChild() {} },
    addEventListener: (t, f) => on(doc, t, f), querySelectorAll: () => [], querySelector: () => null });
  const ss = { getItem: () => JSON.stringify(saved), setItem: (k, v) => { saved = JSON.parse(v); } };
  const fetch = (url, opt) => { calls.push(JSON.parse(opt.body)); return jev ? settled({ json: () => jev }) : failed(new Error('offline')); };
  new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', 'location', 'fetch', src)(
    window, document, ss, { now: () => now }, f => { cb = f; return 1; }, f => { globalThis.__save = f; return 0; }, { hostname: host, pathname: path }, fetch);
  const fire = (o, t, e) => (o[t] || []).forEach(f => f(e));
  const pet = {
    get saved() { globalThis.__save(); return saved; }, tags, opened, calls, win,
    el: cls => els.find(e => e.className === cls),
    sendHome() { fire(els.find(e => e.className === 'kt-pet-bubble'), '_click', { stopPropagation() {} }); },
    move(x, y) { fire(win, 'mousemove', { clientX: x, clientY: y, target: {} }); },
    step(s) { const end = now + s * 1000; while (now < end) { now += 1000 / 60; cb(now); } },
    hoverCard(id) { const a = { href: 'https://www.youtube.com/watch?v=' + id }; fire(doc, 'mouseover', { target: { closest: s => (s.includes('podcast-entry') ? a : null) } }); },
    leaveCards() { fire(doc, 'mouseover', { target: { closest: () => null } }); },
    // client point of the first on-screen pixel with one of these colours
    find(hexes) {
      const c = canvases[0], img = c.captured, m = /translate\((-?\d+)px,(-?\d+)px\)/.exec(c.style.transform || '');
      const want = hexes.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
      for (let i = 0; i < img.width * img.height; i++) {
        const d = img.data, o = i * 4;
        if (d[o + 3] && want.some(w => w[0] === d[o] && w[1] === d[o + 1] && w[2] === d[o + 2]))
          return { x: +m[1] + (i % img.width) * 3 + 1, y: +m[2] + Math.floor(i / img.width) * 3 + 1 };
      }
      return null;
    },
    click(pt) { fire(win, 'mousemove', { clientX: pt.x, clientY: pt.y, target: {} }); fire(canvases[0], '_click', { clientX: pt.x, clientY: pt.y }); },
  };
  pet.move(562, 466);                                    // park the cursor where he already stands: still at once
  return pet;
}
const answer = (guests, extra = {}) => ({ ok: true, mock: false, model: 'jev-1.14.0', ms: 120, tokens: 1500, activity: 'podcast', confidence: 0.9,
  probabilities: { podcast: 0.9 }, engagement: 2, skimming: 0.1, finished: 0.1, idle: 0.1, night_owl: 0, guest: Object.keys(guests)[0], guests, ...extra });
const jesseFirst = answer({ 'jesse-vincent': 0.7, 'tanner-linsley': 0.2, 'allie-laabs': 0.1 });
const fails = [];
const check = (name, ok, got) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' → ' + JSON.stringify(got))); if (!ok) fails.push(name); };
const tag = id => { const g = CAT.guests.find(x => x.id === id); return g.name + ' · ' + CAT.episodes[g.episodes[0]].tag; };

let p = boot({ jev: jesseFirst });
p.step(6);
check('Jev’s pick walks in first, in their own look', !!p.find(JESSE_YELLOW) && p.tags[0] === tag('jesse-vincent'), { tags: p.tags, glasses: !!p.find(JESSE_YELLOW) });
check('the snapshot carries path, tz and read', p.calls.length > 0 && p.calls[0].path === '/' && typeof p.calls[0].tz === 'string' && Array.isArray(p.calls[0].read), p.calls[0]);
const pt = p.find(JESSE_YELLOW);
if (pt) p.click(pt);
check('clicking a guest opens their episode', p.opened[0] === 'https://www.youtube.com/watch?v=aB2dVA-Y7CQ', p.opened);
p.step(22);
check('the next guest is someone else', p.tags.length >= 2 && p.tags[1] !== p.tags[0], p.tags);
check('a guest who stayed is marked seen', (p.saved.seen || []).includes('jesse-vincent'), p.saved.seen);

p = boot({ path: '/posts/the-merge-cua-can-your-agent-finish-the-job.html', jev: jesseFirst });
p.step(6);
check('an episode post brings its own guest first', p.tags[0] === tag('francesco-bonacci'), p.tags);

p = boot({ jev: null });
p.step(6);
check('without Jev the newest guest comes first', p.tags[0] === tag('allie-laabs'), p.tags);

p = boot({ path: '/podcasts.html', elapsed: 40, jev: jesseFirst });
p.step(1); p.hoverCard('9hoqdnYBKUQ'); p.step(7);
check('resting on a podcast card opens the studio with that guest', p.tags[0] === tag('kent-c-dodds'), p.tags);

p = boot({ path: '/podcasts.html', elapsed: 40, jev: jesseFirst });
p.step(1); p.hoverCard('IsRRQ7wxzuY'); p.step(12);
check('a model-review card means Henni records solo', p.tags.length === 0 && (p.saved.done || []).includes('podcast'), { tags: p.tags, done: p.saved.done });

p = boot({ jev: jesseFirst });
p.step(5.5); p.move(1000, 200); p.step(3); p.move(962, 166); p.step(8);
check('a guest cut off early walks in first next time', p.tags.length >= 2 && p.tags[0] === p.tags[1], p.tags);
check('and is not marked seen', !(p.saved.seen || []).includes('jesse-vincent'), p.saved.seen);

p = boot({ jev: jesseFirst, seen: CAT.guests.map(g => g.id) });
p.step(6);
check('once everyone has been on, the lineup starts over', p.tags.length === 1, p.tags);

let threw = null;
try { p = boot({ guests: null, jev: jesseFirst }); p.step(10); } catch (e) { threw = e.message; }
check('without the guest file the studio runs solo, no errors', !threw && p.tags.length === 0, { threw, tags: p && p.tags });

p = boot({ path: '/podcasts.html', elapsed: 81, jev: jesseFirst });
p.step(9); p.hoverCard('9hoqdnYBKUQ'); p.step(8);
check('a card rested on while the studio runs brings its guest in through the door', p.tags[0] === tag('jesse-vincent') && p.tags[1] === tag('kent-c-dodds'), p.tags);

p = boot({ elapsed: 112, jev: jesseFirst });
p.step(15);
check('no guest starts when the slot is nearly over', p.tags.length === 0 && !(p.saved.seen || []).length, { tags: p.tags, seen: p.saved.seen });

const broken = bundle(); broken.looks['allie-laabs'] = () => ({ ramps: {}, hair: [[0, 0, 0, 1, 1, 1]] });
threw = null;
try { p = boot({ guests: broken, jev: null }); p.step(12); } catch (e) { threw = e.message; }
check('a look that breaks while drawing is dropped, Henni keeps going', !threw, threw);

const late = bundle();
p = boot({ guests: null, jev: jesseFirst });
p.step(1.5); p.win.ktPetGuests = late; p.step(24);
check('a guest file that arrives late still brings guests', p.tags.length >= 1, p.tags);

p = boot({ jev: jesseFirst });
p.step(3.9);
const tagEl = p.el('kt-pet-tag'), thoughtEl = p.el('kt-pet-thought');
check('the tag and Henni’s thought never show at once', tagEl.style.display === 'block' && thoughtEl.style.display !== 'block', { tag: tagEl.style.display, thought: thoughtEl.style.display });
p.sendHome(); p.step(4);
check('sending Henni home takes the tag with him', tagEl.style.display !== 'block', tagEl.style.display);

process.exit(fails.length ? 1 : 0);
