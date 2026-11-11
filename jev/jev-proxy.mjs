// Henni's Jev brain: a tiny proxy between pet.js and TypeSafe's Jev.
//
//   node jev/jev-proxy.mjs        → http://localhost:8787/decide
//   node --test jev/jev-proxy.test.mjs
//
// The browser sends a small snapshot of the visit (no typed text). The proxy
// owns the API key and the fixed questions, so the key never reaches the page
// and nobody can use it to ask questions of their own. The key is read from
// TYPESAFE_API_KEY in the environment, or in a .env file in the working directory
// or at the repo root (re-read on every request, so adding it needs no restart).
// Without a key, past the daily cap, the proxy answers from simple rules and marks
// the answer "mock": true.
//
// It also picks Henni's podcast guests: guests/merge-guests.json lists The Merge
// guests, and a next_guest question rides along in the same call. Hosted on
// Railway (jev/deploy.sh); it binds 0.0.0.0 there. Browsers may call it from the
// origins in JEV_ORIGINS (comma-separated; defaults to krackedtools.dev and localhost).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || (process.env.RAILWAY_ENVIRONMENT ? '0.0.0.0' : '127.0.0.1');
const ROOT = path.join(HERE, '..');
const MODEL = process.env.JEV_MODEL || 'jev-latest';
const ORIGINS = process.env.JEV_ORIGINS ? process.env.JEV_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://localhost:8000', 'https://krackedtools.dev', 'https://www.krackedtools.dev'];
const ACTIVITIES = ['walk', 'coding', 'podcast', 'surf', 'sax', 'cocktail', 'ski', 'kite', 'sleep'];

export function loadCatalogue(file = path.join(ROOT, 'guests', 'merge-guests.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
const CAT = loadCatalogue();

// One request, every question up front (TypeSafe's fan-out pattern).
const QUESTIONS = {
  next_activity: {
    type: 'choice',
    instructions: 'Which activity should Henni, the small pet on this website, do next to fit this visitor\'s moment',
    criteria: {
      coding: 'The visitor is reading a technical post about code, code review or AI models',
      podcast: 'The visitor is on the podcasts page or reading a post from The Merge podcast series',
      surf: 'It is daytime and the visitor is scrolling energetically',
      sax: 'It is evening and the visitor is reading slowly and calmly',
      cocktail: 'It is evening or night and the visitor has finished reading or is browsing casually',
      ski: 'It is morning and the visitor is scrolling fast',
      kite: 'It is afternoon and the visitor is skimming',
      sleep: 'It is late at night, or the visitor has been idle for a long time',
      walk: 'The visitor has only just arrived on the page'
    }
  },
  engagement: {
    type: 'score',
    instructions: 'How engaged the visitor is with the page',
    criteria: [
      'Idle or away from the page',
      'Skimming quickly without reading',
      'Reading steadily',
      'Deeply engaged: reading slowly, far into a long page'
    ]
  },
  skimming: { type: 'noul', instructions: 'The visitor is skimming rather than reading' },
  finished: { type: 'noul', instructions: 'The visitor has reached the end of the page' },
  idle: { type: 'noul', instructions: 'The visitor has stopped interacting with the page' },
  night_owl: { type: 'noul', instructions: 'The visitor is browsing late at night' }
};

const liveGuests = cat => cat.guests.filter(g => g.live);
const guestById = (cat, id) => cat.guests.find(g => g.id === id) || null;

// The guest question asks Jev for a judgment (whose conversation is closest to what the visitor
// is reading); Henni's code decides the lineup from it. Options come in a fresh order every call,
// since Jev leans toward whichever comes first, and a companion yes/no says whether any guest
// fits at all, because a Choice always picks something.
export function questions(cat = CAT, rand = Math.random) {
  const live = liveGuests(cat);
  if (live.length < 2) return QUESTIONS;
  const order = live.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return {
    ...QUESTIONS,
    next_guest: {
      type: 'choice',
      instructions: 'Which guest\'s conversation on The Merge podcast is closest to what this visitor is reading or looking at',
      criteria: Object.fromEntries(order.map(g => [g.id, g.about]))
    },
    guest_fits: {
      type: 'noul',
      instructions: 'What this visitor is reading or looking at is about a topic that one of The Merge podcast guests talked about on the show'
    }
  };
}

const num = (v, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo; };
const TZ = /^[A-Za-z]+(?:\/[A-Za-z0-9_+\-]+){0,2}$/;

// Only known fields get through, clamped. Jev is weak at comparing numbers,
// so the numbers become plain phrases here and Jev only reads the phrases.
// Episodes and pages must be on the site's own list; Jev gets their titles from it.
export function describe(raw, cat = CAT) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const hour = Math.floor(num(s.hour, 0, 23)), scroll = num(s.scroll, 0, 100);
  const pageS = num(s.page_s, 0, 86400), siteS = num(s.site_s, 0, 86400), idleS = num(s.idle_s, 0, 86400), speed = num(s.speed, 0, 100000);
  const kind = ['home', 'post', 'podcasts', 'writing', 'other'].includes(s.kind) ? s.kind : 'other';
  const doing = ACTIVITIES.includes(s.doing) ? s.doing : 'walk';
  const done = Array.isArray(s.done) ? s.done.filter(a => ACTIVITIES.includes(a)).slice(-12) : [];
  const known = p => typeof p === 'string' && Object.prototype.hasOwnProperty.call(cat.pages, p);
  const episode = typeof s.episode === 'string' && Object.prototype.hasOwnProperty.call(cat.episodes, s.episode) ? s.episode : null;
  const tz = typeof s.tz === 'string' && s.tz.length <= 40 && TZ.test(s.tz) ? s.tz : null;
  const pagePath = known(s.path) ? s.path : null;
  const read = Array.isArray(s.read) ? s.read.filter(known).slice(-5) : [];
  const pageGuest = pagePath ? cat.guests.find(g => g.pages.includes(pagePath)) : null;
  const ep = episode && cat.episodes[episode], epGuest = ep && ep.guest && guestById(cat, ep.guest);

  const state = {
    page: { kind, title: String(s.title || '').replace(/[^\p{L}\p{N} .,:;'’‘?!&()\-–—|]/gu, ' ').slice(0, 140) },
    time_of_day: hour < 5 ? 'late at night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'late at night',
    position_on_page: scroll < 8 ? 'at the top of the page' : scroll < 45 ? 'in the first half of the page' : scroll < 88 ? 'in the second half of the page' : 'at the end of the page',
    time_on_this_page: pageS < 20 ? 'has only just arrived on the page' : pageS < 90 ? 'about a minute on the page' : pageS < 300 ? 'a few minutes on the page' : 'a long time on the page',
    time_on_the_site: siteS < 90 ? 'new to the site' : siteS < 420 ? 'a few minutes on the site' : 'a long visit',
    activity: idleS > 90 ? 'idle for a long time, no mouse, scroll or key input' : idleS > 25 ? 'paused, no input for a little while' : 'actively using the page',
    scrolling: speed > 250 ? 'scrolling fast' : speed > 15 ? 'scrolling at a reading pace' : speed > 2 ? 'scrolling slowly' : 'not scrolling',   // px/s averaged over ~25 s
    henni: { doing_now: doing, already_did_this_visit: done }
  };
  if (pageGuest) state.page.about_the_merge_episode_with = `${pageGuest.name} (${pageGuest.company})`;
  if (ep) state.podcast_episode_in_view = `"${ep.title}"` + (epGuest ? `, with ${epGuest.name} of ${epGuest.company}` : ', a model review without a guest');
  if (tz) state.visitor_time_zone = `the visitor's time zone is ${tz}`;
  if (read.length) state.recently_read = read.map(p => cat.pages[p]);
  return { facts: { hour, scroll, pageS, siteS, idleS, speed, kind, doing, episode, tz, path: pagePath, read }, state };
}

// Without Jev: the hovered episode's guest, then the page's guest, then newest first.
function mockGuests(f, cat) {
  const live = liveGuests(cat).map(g => g.id);
  if (!live.length) return { guest: null, guest_fits: 0, guests: {} };
  const first = [];
  const epGuest = f.episode && cat.episodes[f.episode].guest;
  if (epGuest && live.includes(epGuest)) first.push(epGuest);
  const pg = f.path && cat.guests.find(g => g.pages.includes(f.path));
  if (pg && live.includes(pg.id) && !first.includes(pg.id)) first.push(pg.id);
  const order = [...first, ...live.filter(id => !first.includes(id))];
  const w = order.map((_, i) => order.length - i + (i < first.length ? order.length : 0)), sum = w.reduce((a, b) => a + b, 0);
  return { guest: order[0], guest_fits: first.length ? 0.9 : 0.1, guests: Object.fromEntries(order.map((id, i) => [id, Math.round(w[i] / sum * 1000) / 1000])) };
}

function mock(f, cat) {
  const p = Object.fromEntries(ACTIVITIES.map(a => [a, 0.02]));
  const pick = f.idleS > 90 || f.hour < 5 || f.hour >= 23 ? 'sleep' : f.kind === 'podcasts' ? 'podcast' : f.kind === 'post' && f.speed < 250 ? 'coding'
    : f.hour >= 18 ? (f.scroll > 80 ? 'cocktail' : 'sax') : f.hour < 12 ? 'ski' : f.speed > 250 ? 'kite' : 'surf';
  p[pick] = 0.84;
  return {
    ok: true, mock: true, model: 'mock', ms: 0, tokens: 0, activity: pick, confidence: 0.8, probabilities: p,
    engagement: f.idleS > 90 ? 0 : f.speed > 250 ? 1 : f.scroll > 60 ? 3 : 2,
    skimming: f.speed > 250 ? 0.9 : 0.1, finished: f.scroll > 88 ? 0.95 : 0.05, idle: f.idleS > 25 ? 0.9 : 0.05, night_owl: f.hour < 5 || f.hour >= 22 ? 0.95 : 0.03,
    ...mockGuests(f, cat)
  };
}

export async function decide(raw, key, opts = {}) {
  const cat = opts.cat || CAT, doFetch = opts.fetch || globalThis.fetch;
  const d = describe(raw, cat);
  if (!key) return mock(d.facts, cat);
  const t0 = Date.now();
  const res = await doFetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, state: d.state, questions: questions(cat, opts.rand) }),
    signal: AbortSignal.timeout(5000)
  });
  const ms = Date.now() - t0;
  if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
  const out = await res.json(), a = out.answers || {}, na = a.next_activity || {}, ng = a.next_guest || {};
  const n = k => (a[k] && typeof a[k].noul === 'number' ? a[k].noul : 0);
  return {
    ok: true, mock: false, model: out.model, ms, tokens: (out.usage && out.usage.input_tokens) || 0,
    activity: na.choice, confidence: na.confidence, probabilities: na.probabilities || {},
    engagement: a.engagement ? a.engagement.score : null,
    skimming: n('skimming'), finished: n('finished'), idle: n('idle'), night_owl: n('night_owl'),
    guest: ng.choice || null, guests: ng.probabilities || {}, guest_fits: a.guest_fits ? n('guest_fits') : null
  };
}

// Per-visitor sliding window, plus a daily cap on real Jev calls (UTC days).
export function limiter({ perMin = 12, daily = Number(process.env.JEV_DAILY_CAP) || 25000, now = Date.now } = {}) {
  const hits = new Map();
  let day = -1, spent = 0, pruned = now();
  return {
    allow(ip) {
      const t = now(), list = (hits.get(ip) || []).filter(x => t - x < 60000);
      if (list.length >= perMin) { hits.set(ip, list); return false; }
      list.push(t); hits.set(ip, list);
      if (t - pruned > 60000) { pruned = t; for (const [k, v] of hits) if (!v.length || t - v[v.length - 1] > 60000) hits.delete(k); }
      return true;
    },
    spend() {
      const d = Math.floor(now() / 86400000);
      if (d !== day) { day = d; spent = 0; }
      if (spent >= daily) return false;
      spent++; return true;
    }
  };
}

function apiKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY.trim();
  for (const dir of [process.cwd(), ROOT]) {
    try {
      const m = fs.readFileSync(path.join(dir, '.env'), 'utf8').match(/^\s*TYPESAFE_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
      if (m) return m[1].trim();
    } catch { /* no .env here */ }
  }
  return '';
}

// The HTTP side: CORS for the site only, a per-visitor limit keyed on Railway's X-Real-IP (callers
// can forge X-Forwarded-For), the daily cap, small bodies only, and errors without details.
export function createHandler({ lim = limiter(), apiKey: key = apiKey, decide: ask = decide, log = console.log } = {}) {
  return (req, res) => {
    const origin = req.headers.origin;
    const head = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (ORIGINS.includes(origin)) head['Access-Control-Allow-Origin'] = origin;
    const send = (code, body) => { if (!res.headersSent) { res.writeHead(code, head); res.end(JSON.stringify(body)); } };
    if (req.method === 'OPTIONS') { res.writeHead(204, { ...head, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
    if (req.method === 'GET' && req.url === '/') return send(200, { ok: true, service: 'jev-proxy', key: key() ? 'set' : 'missing (mock answers)' });
    if (req.method !== 'POST' || req.url !== '/decide') return send(404, { ok: false, error: 'not found' });
    const ip = String(req.headers['x-real-ip'] || '').trim() || req.socket.remoteAddress || '?';
    if (!lim.allow(ip)) return send(429, { ok: false, error: 'slow down' });
    let body = '', big = false;
    req.on('data', c => {
      if (big) return;
      body += c;
      if (body.length > 4096) { big = true; send(413, { ok: false, error: 'too big' }); req.resume(); }
    });
    req.on('end', async () => {
      if (big) return;
      let raw;
      try { raw = JSON.parse(body); } catch { return send(400, { ok: false, error: 'bad json' }); }
      try {
        const k = key();
        const out = await ask(raw, k && lim.spend() ? k : '');
        log(new Date().toISOString().slice(11, 19), out.ok ? `${out.mock ? 'mock' : out.model} → ${out.activity} (${Math.round((out.confidence || 0) * 100)}%) · guest ${out.guest} · ${out.ms}ms ${out.tokens}tok` : `error ${out.status}: ${out.error}`);
        send(out.ok ? 200 : 502, out.ok ? out : { ok: false, error: 'jev unavailable' });
      } catch (e) {
        log('error', e.message);
        send(502, { ok: false, error: 'jev unavailable' });
      }
    });
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  http.createServer(createHandler()).listen(PORT, HOST, () => console.log(`jev-proxy on http://${HOST}:${PORT}/decide · key ${apiKey() ? 'set' : 'missing: mock answers'}`));
}
