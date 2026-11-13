// node --test jev/jev-proxy.test.mjs  (no network: Jev is stubbed)
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { describe as describeVisit, questions, decide, limiter, loadCatalogue, createHandler } from './jev-proxy.mjs';

const cat = loadCatalogue();
const live = cat.guests.filter(g => g.live).map(g => g.id);
const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

test('unknown episode, path, read pages and odd time zones never reach the state', () => {
  const d = describeVisit({ episode: 'notAnEpisode', path: '/evil.html', read: ['/', '/nope.html', 42], tz: 'Europe/Berlin; DROP' }, cat);
  assert.equal(d.facts.episode, null);
  assert.equal(d.facts.path, null);
  assert.deepEqual(d.facts.read, ['/']);
  assert.equal(d.facts.tz, null);
  assert.equal(JSON.stringify(d.state).includes('evil'), false);
});

test('a time zone longer than 40 characters is dropped', () => {
  assert.equal(describeVisit({ tz: 'America/' + 'A'.repeat(40) }, cat).facts.tz, null);
  assert.equal(describeVisit({ tz: 'Asia/Tokyo' }, cat).facts.tz, 'Asia/Tokyo');
});

test('known fields are described in words for Jev', () => {
  const d = describeVisit({ episode: '9hoqdnYBKUQ', tz: 'Asia/Tokyo', read: ['/podcasts.html'], path: '/' }, cat);
  assert.match(d.state.podcast_episode_in_view, /Kent C\. Dodds/);
  assert.match(d.state.visitor_time_zone, /Asia\/Tokyo/);
  assert.deepEqual(d.state.recently_read, ['Podcasts — The New Engineering']);
});

test('next_guest offers exactly the live guests', () => {
  const q = questions(cat, seeded(7));
  assert.equal(q.next_guest.type, 'choice');
  assert.deepEqual(Object.keys(q.next_guest.criteria).sort(), [...live].sort());
  assert.ok(q.next_activity, 'the existing questions stay');
  assert.match(q.next_guest.instructions, /closest to what this visitor is reading/);
  assert.equal(q.guest_fits.type, 'noul', 'a companion yes/no says whether any guest fits at all');
});

test('guest options are shuffled per call', () => {
  const a = Object.keys(questions(cat, seeded(1)).next_guest.criteria).join();
  const b = Object.keys(questions(cat, seeded(2)).next_guest.criteria).join();
  assert.notEqual(a, b);
});

test('mock ranks the hovered episode guest first', async () => {
  const out = await decide({ episode: '9hoqdnYBKUQ', kind: 'podcasts' }, '', { cat });
  assert.equal(out.mock, true);
  assert.equal(out.guest, 'kent-c-dodds');
  const ranked = Object.entries(out.guests).sort((x, y) => y[1] - x[1]).map(x => x[0]);
  assert.equal(ranked[0], 'kent-c-dodds');
  assert.equal(ranked.length, live.length);
});

test('mock ranks the page guest first on an episode post', async () => {
  const out = await decide({ path: '/posts/the-merge-cua-can-your-agent-finish-the-job.html', kind: 'post' }, '', { cat });
  assert.equal(out.guest, 'francesco-bonacci');
});

test('mock with no context ranks the newest guest first', async () => {
  const out = await decide({ kind: 'home', path: '/' }, '', { cat });
  assert.equal(out.guest, live[0]);
  assert.ok(out.guest_fits < 0.3, 'nothing ties the home page to a guest');
});

test('a real answer maps next_guest into guests', async () => {
  let sent = null;
  const fetch = async (url, init) => {
    sent = JSON.parse(init.body);
    const probs = Object.fromEntries(live.map(id => [id, id === 'jesse-vincent' ? 0.7 : 0.3 / (live.length - 1)]));
    return { ok: true, json: async () => ({ model: 'jev-1.14.0', usage: { input_tokens: 900 },
      answers: { next_activity: { choice: 'podcast', confidence: 0.9, probabilities: { podcast: 0.9 } },
        next_guest: { choice: 'jesse-vincent', confidence: 0.6, probabilities: probs }, guest_fits: { type: 'noul', noul: 0.82 } } }) };
  };
  const out = await decide({ kind: 'post' }, 'k', { cat, fetch, rand: seeded(3) });
  assert.ok(sent.questions.next_guest, 'the guest question is in the same call');
  assert.equal(out.guest, 'jesse-vincent');
  assert.equal(out.guests['jesse-vincent'], 0.7);
  assert.equal(out.activity, 'podcast');
  assert.equal(out.guest_fits, 0.82);
});

test('one visitor gets at most 12 calls a minute', () => {
  let now = 0;
  const lim = limiter({ perMin: 12, daily: 1000, now: () => now });
  for (let i = 0; i < 12; i++) assert.equal(lim.allow('1.2.3.4'), true);
  assert.equal(lim.allow('1.2.3.4'), false);
  assert.equal(lim.allow('5.6.7.8'), true, 'other visitors are unaffected');
  now += 61000;
  assert.equal(lim.allow('1.2.3.4'), true, 'the window slides');
});

test('past the daily cap, real Jev calls stop', () => {
  let now = Date.UTC(2026, 10, 10, 12);
  const lim = limiter({ perMin: 99, daily: 2, now: () => now });
  assert.equal(lim.spend(), true);
  assert.equal(lim.spend(), true);
  assert.equal(lim.spend(), false);
  now += 24 * 3600 * 1000;
  assert.equal(lim.spend(), true, 'the cap resets the next UTC day');
});

// the HTTP handler, on a real local server; Jev itself is stubbed
async function serve(opts) {
  const server = http.createServer(createHandler({ log: () => {}, ...opts }));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/decide`;
  const post = (body, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain', ...headers }, body });
  return { post, close: () => new Promise(r => server.close(r)) };
}
const okDecide = async (raw, key) => ({ ok: true, mock: !key, activity: 'walk', guest: null, guests: {} });

test('the handler shares answers only with the site', async () => {
  const s = await serve({ lim: limiter(), apiKey: () => 'k', decide: okDecide });
  const ok = await s.post('{}', { Origin: 'https://krackedtools.dev' });
  const evil = await s.post('{}', { Origin: 'https://evil.example' });
  await s.close();
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://krackedtools.dev');
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
});

test('the per-visitor limit follows x-real-ip, not a forged x-forwarded-for', async () => {
  const s = await serve({ lim: limiter({ perMin: 12, daily: 99 }), apiKey: () => 'k', decide: okDecide });
  const codes = [];
  for (let i = 0; i < 13; i++) codes.push((await s.post('{}', { 'X-Real-IP': '9.9.9.9', 'X-Forwarded-For': `10.0.0.${i}` })).status);
  await s.close();
  assert.deepEqual(codes.slice(0, 12), Array(12).fill(200));
  assert.equal(codes[12], 429);
});

test('past the daily cap the handler answers without Jev', async () => {
  const keys = [];
  const s = await serve({ lim: limiter({ perMin: 99, daily: 1 }), apiKey: () => 'k', decide: async (raw, key) => { keys.push(key); return okDecide(raw, key); } });
  await s.post('{}'); const r = await (await s.post('{}')).json();
  await s.close();
  assert.deepEqual(keys, ['k', '']);
  assert.equal(r.mock, true);
});

test('bad bodies are refused: bad json 400, oversized 413', async () => {
  const s = await serve({ lim: limiter(), apiKey: () => 'k', decide: okDecide });
  const bad = await s.post('{nope');
  const big = await s.post('{"title":"' + 'x'.repeat(5000) + '"}').catch(() => ({ status: 'reset' }));
  await s.close();
  assert.equal(bad.status, 400);
  assert.equal(big.status, 413);
});

test('failures never leak details to the caller', async () => {
  const s = await serve({ lim: limiter(), apiKey: () => 'k', decide: async () => { throw new Error('upstream said: secret-ish text'); } });
  const r = await s.post('{}'); const body = await r.text();
  await s.close();
  assert.equal(r.status, 502);
  assert.equal(body.includes('secret'), false);
});

// POST /site: the homepage's questions, on the same server
test('/site answers with the site judge and shares the daily cap with Henni', async () => {
  const keys = [];
  const server = http.createServer(createHandler({ log: () => {}, lim: limiter({ perMin: 99, daily: 2 }), apiKey: () => 'k',
    decide: async (raw, key) => { keys.push('decide:' + key); return { ok: true, mock: !key }; },
    site: async (raw, key) => { keys.push('site:' + key); return { ok: true, mock: !key, persona: { top: 'developer' } }; } }));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: 'https://krackedtools.dev' }, body });
  const a = await post('/site', '{}'), b = await post('/decide', '{}'), c = await (await post('/site', '{}')).json();
  const big = await post('/site', '{"x":"' + 'y'.repeat(8000) + '"}');
  const tooBig = await post('/site', '{"x":"' + 'y'.repeat(13000) + '"}').catch(() => ({ status: 'reset' }));
  await new Promise(r => server.close(r));
  assert.equal(a.headers.get('access-control-allow-origin'), 'https://krackedtools.dev');
  assert.deepEqual(keys.slice(0, 3), ['site:k', 'decide:k', 'site:']);
  assert.equal(c.mock, true);
  assert.equal(big.status, 200, 'a site snapshot may be larger than a Henni one');
  assert.equal(tooBig.status, 413);
});

test('the site judge describes a visit from ids only, in words', async () => {
  const { judge } = await import('./site.mjs');
  const fs = await import('node:fs');
  const id = JSON.parse(fs.readFileSync(new URL('./site/catalogue.json', import.meta.url), 'utf8')).assets.find(a => a.kind === 'post').id;
  const r = await judge({ arrival: { source: 'github' }, sections: { writing: 40 }, reached: ['writing'], dwell: { [id]: 30, 'post:not-on-the-page': 50 }, hovered: ['<script>'], clicked: [], pace: 40, hour: 10, page_s: 90 }, '');
  assert.equal(r.mock, true);
  assert.equal(r.saw.arrival.came_from, 'GitHub');
  assert.equal(r.saw.items_spent_time_on.length, 1, 'unknown ids never reach Jev');
  assert.equal(r.saw.items_hovered, undefined);
});
