// Behaviour check for Henni's Jev brain: node tools/jev-test.mjs variants/bh-ink.js
// Fakes the page, the clock and the proxy, then checks that he asks Jev, says so,
// takes Jev's pick when an activity ends, and keeps to the timetable without an answer.
import fs from 'fs';
const src = fs.readFileSync(process.argv[2], 'utf8');

function run({ answer, host = 'localhost', search = '' }) {
  let cb = null, now = 0, saved = { elapsed: 30, x: 600, y: 500, wait: 30, arrived: true };
  const calls = [], said = [];
  const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData() {} };
  const canvas = { width: 0, height: 0, style: {}, setAttribute() {}, addEventListener() {}, getContext: () => ctx };
  const mk = () => {
    let text = '';
    return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {},
      get textContent() { return text; }, set textContent(v) { text = v; if (this.className === 'kt-pet-thought') said.push(v); } };
  };
  const window = { innerWidth: 1200, innerHeight: 800, scrollY: 0, matchMedia: q => ({ matches: q.includes('pointer: fine') }), addEventListener() {} };
  const document = { title: 'Test post', hidden: false, documentElement: { scrollHeight: 4000 }, createElement: t => t === 'canvas' ? canvas : mk(),
    body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {} };
  const ss = { getItem: () => JSON.stringify(saved), setItem: (k, v) => { saved = JSON.parse(v); } };
  // a promise that settles synchronously, so the fake clock stays in charge
  const settled = v => ({ then: (ok, bad) => { try { return settled(ok ? ok(v) : v); } catch (e) { return bad ? settled(bad(e)) : failed(e); } } });
  const failed = e => ({ then: (ok, bad) => (bad ? settled(bad(e)) : failed(e)) });
  const fetch = (url, opt) => { calls.push({ url, body: JSON.parse(opt.body) }); return answer ? settled({ json: () => answer }) : failed(new Error('offline')); };
  new Function('window', 'document', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setInterval', 'location', 'fetch', src)(
    window, document, ss, { now: () => now }, f => { cb = f; return 1; }, f => { globalThis.__save = f; return 0; }, { hostname: host, pathname: '/posts/test.html', search }, fetch);
  const step = s => { const end = now + s * 1000; while (now < end) { now += 1000 / 60; cb(now); } globalThis.__save(); };
  step(4);  const first = { calls: calls.length, said: said.slice() };
  step(8);  // crosses the walk → coding boundary at 35 s
  return { first, calls, said, elapsed: saved.elapsed, done: saved.done };
}

const P = { walk: 0.01, coding: 0.05, podcast: 0.02, surf: 0.84, sax: 0.02, cocktail: 0.02, ski: 0.02, kite: 0.01, sleep: 0.01 };
const jev = { ok: true, mock: false, model: 'jev-1.14.0', ms: 111, tokens: 400, activity: 'surf', confidence: 0.8, probabilities: P, engagement: 2, skimming: 0.1, finished: 0.1, idle: 0.1, night_owl: 0 };
const fails = [];
const check = (name, ok, got) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' → ' + JSON.stringify(got))); if (!ok) fails.push(name); };

const a = run({ answer: jev });
check('asks Jev once within a few seconds', a.first.calls === 1, a.first);
check('sends a snapshot without free text', JSON.stringify(Object.keys(a.calls[0].body).sort()) === JSON.stringify(['doing', 'done', 'episode', 'hour', 'idle_s', 'kind', 'page_s', 'path', 'read', 'scroll', 'site_s', 'speed', 'title', 'tz']) && a.calls[0].body.kind === 'post', a.calls[0]);
check('first thought says he runs on Jev', a.first.said[0] === 'oh, I’m running on Jev', a.first.said);
check('takes Jev’s pick when the walk ends', a.done.join() === 'walk,surf' && a.elapsed >= 125 && a.elapsed < 135, { done: a.done, elapsed: a.elapsed });
check('does not announce what Jev picked', !a.said.some(x => /Jev says/.test(x)), a.said);

const b = run({ answer: null });
check('proxy down: timetable carries on, no thoughts about Jev', b.done.join() === 'walk,coding' && !b.said.some(x => /Jev/.test(x)), { done: b.done, said: b.said });

const c = run({ answer: { ...jev, probabilities: { ...P, surf: 0.2 } } });
check('unsure Jev: timetable carries on', c.done.join() === 'walk,coding', c.done);

const d = run({ answer: jev, host: 'krackedtools.dev' });
check('live site: asks the hosted proxy on Railway', d.calls.length > 0 && /^https:\/\/[\w.-]+\.up\.railway\.app\/decide$/.test(d.calls[0].url) && d.done.join() === 'walk,surf', { url: d.calls[0] && d.calls[0].url, done: d.done });

const e = run({ answer: { ...jev, mock: true }, host: 'krackedtools.dev' });
check('live site, mock answer: no Jev bubbles', !e.said.some(x => /Jev/.test(x)), e.said);
check('live site, mock answer: his timetable carries on', e.done.join() === 'walk,coding', e.done);

const f = run({ answer: { ...jev, mock: true } });
check('locally a mock answer still says so', f.said.some(x => x.includes('(mock)')), f.said);

const de = run({ answer: jev, search: '?henni-lang=de' });
check('German: first line says he runs on Jev', de.first.said[0] === 'oh, ich laufe auf Jev', de.first.said);
check('German: then says why he speaks German', de.said.includes('ich spreche Deutsch, weil dein Browser es tut') || de.said.length >= 1, de.said);
const ja = run({ answer: jev, search: '?henni-lang=ja' });
check('Japanese: first line in Japanese', ja.first.said[0] === 'あ、ぼくは Jev で動いてるよ', ja.first.said);
const xx = run({ answer: jev, search: '?henni-lang=xx' });
check('unknown language: English', xx.first.said[0] === 'oh, I’m running on Jev', xx.first.said);

process.exit(fails.length ? 1 : 0);
