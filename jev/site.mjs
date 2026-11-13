// The krackedtools.dev homepage's Jev questions: who the visitor seems to be and what they care about,
// from where they came from and what they spend time on. jev-proxy.mjs serves this on POST /site.
//
// The browser sends numbers and item ids only (never free text). This module owns the fixed questions
// and the catalogue of the page's items (site/catalogue.json, each tagged by topic with Jev ahead of
// time), turns the numbers into phrases Jev reads well, and returns typed judgments. What the page does
// with them is decided in the page's own script. Without a key it answers from rules ("mock": true).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODEL = process.env.JEV_SITE_MODEL || 'jev-1.14.0';
const S = JSON.parse(fs.readFileSync(path.join(HERE, 'site/schema.json'), 'utf8'));
const CATALOGUE = JSON.parse(fs.readFileSync(path.join(HERE, 'site/catalogue.json'), 'utf8')).assets;
function catalogue() { return CATALOGUE; }
export const SITE_MODEL = MODEL;

const TOPICS = Object.keys(S.topics), FORMATS = Object.keys(S.formats), SECTIONS = Object.keys(S.sections);

// ---- the questions: one judgment each, all in one request ----
function shuffled(obj, rand) {               // Jev leans toward the first option, so the order changes every call
  const e = Object.entries(obj);
  for (let i = e.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [e[i], e[j]] = [e[j], e[i]]; }
  return Object.fromEntries(e);
}
export function questions(rand = Math.random) {
  const q = {};
  for (const t of TOPICS) q['topic_' + t] = {
    type: 'noul', instructions: `The visitor is interested in ${S.topics[t]}`,
    criteria: { true: `Something they spent time on, hovered or clicked is about ${S.topics[t]}, or where they came from points to it`, false: `Nothing they looked at is about ${S.topics[t]}` }
  };
  for (const f of FORMATS) q['format_' + f] = {
    type: 'noul', instructions: `The visitor is drawn to ${S.formats[f]}`,
    criteria: { true: `They spent their time on ${S.formats[f]}`, false: `They passed over ${S.formats[f]} or never reached it` }
  };
  q.persona = { type: 'choice', instructions: 'What kind of visitor is this', criteria: shuffled(S.personas, rand) };
  q.persona_clear = {
    type: 'noul', instructions: 'What the visitor has done so far shows what kind of visitor they are',
    criteria: { true: 'Where they came from or what they spent time on points to one kind of visitor', false: 'They have only just arrived and have not looked at anything in particular' }
  };
  q.intent = { type: 'choice', instructions: 'What is the visitor trying to do on this site', criteria: shuffled(S.intents, rand) };
  q.depth = { type: 'score', instructions: 'How closely the visitor reads', criteria: S.depth };
  q.hurry = {
    type: 'noul', instructions: 'The visitor is in a hurry',
    criteria: { true: 'They scroll fast and stop at very little', false: 'They take their time and stop to read' }
  };
  return q;
}

// ---- the state: only known fields, numbers turned into phrases, titles looked up here ----
const num = (v, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo; };
const span = s => s < 4 ? 'a few seconds' : s < 20 ? 'several seconds' : s < 75 ? 'about a minute' : s < 240 ? 'a few minutes' : 'a long time';

export function describe(raw, cat = catalogue()) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const byId = new Map(cat.map(a => [a.id, a]));
  // each item is named with what it is about (tagged by Jev ahead of time), so a title alone never has to carry the meaning
  const about = a => { const t = TOPICS.filter(k => ((a.topics || {})[k] || 0) >= 0.6).sort((x, y) => a.topics[y] - a.topics[x]).slice(0, 2).map(k => S.topics[k]); return t.length ? `, about ${t.join(' and ')}` : ''; };
  const name = id => { const a = byId.get(String(id)); return a ? `${(S.kinds[a.kind] || {}).label || a.kind}: ${a.title}${about(a)}` : null; };
  const ids = (list, max) => (Array.isArray(list) ? list : []).map(name).filter(Boolean).slice(0, max);

  const arr = r.arrival && typeof r.arrival === 'object' ? r.arrival : {};
  const source = Object.hasOwn(S.sources, arr.source) ? arr.source : 'direct';
  const campaign = Object.hasOwn(S.sources, arr.campaign) ? arr.campaign : '';
  const hour = Math.floor(num(r.hour, 0, 23)), pace = num(r.pace, 0, 100000), pageS = num(r.page_s, 0, 86400);

  const secs = r.sections && typeof r.sections === 'object' ? r.sections : {};
  const reached = new Set((Array.isArray(r.reached) ? r.reached : []).filter(s => SECTIONS.includes(s)));
  const close = [], glanced = [], past = [], unreached = [];
  for (const s of SECTIONS) {
    const t = num(secs[s], 0, 86400);
    if (t >= 12) close.push(`${S.sections[s]}, for ${span(t)}`);
    else if (t >= 3) glanced.push(S.sections[s]);
    else if (reached.has(s) || t > 0) past.push(S.sections[s]);
    else unreached.push(S.sections[s]);
  }
  const dwell = r.dwell && typeof r.dwell === 'object' ? r.dwell : {};
  const spent = Object.entries(dwell).map(([id, t]) => [name(id), num(t, 0, 86400)]).filter(x => x[0] && x[1] >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, t]) => `${n} (${span(t)})`);

  const state = {
    arrival: {
      came_from: S.sources[source],
      visit: arr.returning ? 'has visited this site before' : 'first visit to this site',
      device: r.device === 'mobile' ? 'phone' : 'desktop or laptop'
    },
    time: {
      time_of_day: hour < 5 ? 'late at night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'late at night',
      on_this_page_for: span(pageS)
    },
    scrolling: pace > 250 ? 'scrolling fast' : pace > 15 ? 'scrolling at a reading pace' : pace > 2 ? 'scrolling slowly' : 'not scrolling'
  };
  if (campaign) state.arrival.followed_a_link_shared_on = S.sources[campaign];
  if (close.length) state.sections_read_closely = close;
  if (glanced.length) state.sections_glanced_at = glanced;
  if (past.length) state.sections_scrolled_past = past;
  if (unreached.length) state.sections_not_reached_yet = unreached;
  if (spent.length) state.items_spent_time_on = spent;
  const hovered = ids(r.hovered, 8), clicked = ids(r.clicked, 6);
  if (hovered.length) state.items_hovered = hovered;
  if (clicked.length) state.links_clicked = clicked;

  // topic evidence in plain numbers, for the rule-based stand-in
  const lean = Object.fromEntries(TOPICS.map(t => [t, 0]));
  const fmt = Object.fromEntries(FORMATS.map(f => [f, 0]));
  const add = (id, w) => { const a = byId.get(String(id)); if (!a) return; for (const t of TOPICS) lean[t] += w * ((a.topics || {})[t] || 0); const f = (S.kinds[a.kind] || {}).format; if (f) fmt[f] += w; };
  for (const [id, t] of Object.entries(dwell)) add(id, Math.min(num(t, 0, 600), 60) / 12);
  for (const id of Array.isArray(r.hovered) ? r.hovered : []) add(id, 1);
  for (const id of Array.isArray(r.clicked) ? r.clicked : []) add(id, 3);
  const secT = Object.fromEntries(SECTIONS.map(s => [s, num(secs[s], 0, 86400)]));
  return { state, facts: { source: campaign || source, hour, pace, pageS, lean, fmt, secT, returning: !!arr.returning } };
}

// ---- rule-based stand-in when there is no key ----
const PRIOR = {
  linkedin: { persona: 'recruiter', topics: { background: 0.7 }, intent: 'assess' },
  github: { persona: 'developer', topics: { open_source: 0.7, code_review: 0.5 }, intent: 'learn' },
  x: { persona: 'developer', topics: { agents: 0.4, model_evals: 0.4 }, intent: 'follow' },
  youtube: { persona: 'developer', topics: {}, intent: 'follow', format: 'video' },
  luma: { persona: 'organizer', topics: { community: 0.8 }, intent: 'assess', format: 'events' },
  coderabbit: { persona: 'developer', topics: { code_review: 0.8 }, intent: 'learn' },
  typesafe: { persona: 'developer', topics: { decision_models: 0.85 }, intent: 'learn' },
  hackernews: { persona: 'developer', topics: { model_evals: 0.5, agents: 0.5 }, intent: 'learn' },
  search: { persona: 'developer', topics: {}, intent: 'learn' }
};
export function mock(f) {
  const pr = PRIOR[f.source] || {}, sq = x => 1 - Math.exp(-x / 2.5);
  const topics = Object.fromEntries(TOPICS.map(t => [t, +Math.min(0.97, Math.max((pr.topics || {})[t] || 0.04, sq(f.lean[t]))).toFixed(2)]));
  const formats = Object.fromEntries(FORMATS.map(k => [k, +Math.min(0.97, Math.max(pr.format === k ? 0.7 : 0.05, sq(f.fmt[k] / 2))).toFixed(2)]));
  const P = Object.fromEntries(Object.keys(S.personas).map(p => [p, 0.04]));
  const vote = (p, w) => { P[p] += w; };
  if (pr.persona) vote(pr.persona, 0.5);
  vote('developer', topics.code_review * 0.5 + topics.model_evals * 0.5 + topics.open_source * 0.4);
  vote('engineering_leader', topics.agents * 0.45);
  vote('recruiter', topics.background * 0.6 + sq(f.secT.about / 10) * 0.5);
  vote('organizer', topics.community * 0.6 + formats.events * 0.3);
  vote('founder', sq(f.secT.projects / 25) * 0.3);
  vote('educator', topics.education * 0.9);
  const tot = Object.values(P).reduce((a, b) => a + b, 0);
  for (const k in P) P[k] = +(P[k] / tot).toFixed(3);
  const top = Object.keys(P).sort((a, b) => P[b] - P[a])[0];
  const evidence = Object.values(f.lean).reduce((a, b) => a + b, 0) + (pr.persona ? 2 : 0);
  const I = Object.fromEntries(Object.keys(S.intents).map(k => [k, 0.05]));
  I[f.secT.contact > 6 ? 'contact' : pr.intent || (evidence > 2 ? 'learn' : 'browse')] = 0.75;
  const itop = Object.keys(I).sort((a, b) => I[b] - I[a])[0];
  const depth = f.pace > 250 ? 0.3 : f.pageS > 180 ? 2.6 : f.pageS > 60 ? 1.9 : 1.1;
  return {
    ok: true, mock: true, model: 'rules', ms: 0, tokens: 0, topics, formats,
    persona: { top, confidence: P[top], probabilities: P, clear: +sq(evidence).toFixed(2) },
    intent: { top: itop, probabilities: I },
    depth: { score: depth, probabilities: {} }, hurry: f.pace > 250 ? 0.9 : 0.1
  };
}

export async function judge(raw, key, opts = {}) {
  const d = describe(raw, opts.cat);
  if (!key || (raw && raw.mock === true)) return { ...mock(d.facts), saw: d.state };
  const t0 = Date.now();
  const res = await (opts.fetch || fetch)('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, state: d.state, questions: questions(opts.rand) }),
    signal: AbortSignal.timeout(6000)
  });
  const ms = Date.now() - t0;
  if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
  const out = await res.json(), a = out.answers || {};
  const n = k => (a[k] && typeof a[k].noul === 'number' ? a[k].noul : 0);
  const pe = a.persona || {}, it = a.intent || {}, dp = a.depth || {};
  return {
    ok: true, mock: false, model: out.model, ms, tokens: (out.usage && out.usage.input_tokens) || 0,
    topics: Object.fromEntries(TOPICS.map(t => [t, n('topic_' + t)])),
    formats: Object.fromEntries(FORMATS.map(f => [f, n('format_' + f)])),
    persona: { top: pe.choice || null, confidence: pe.confidence || 0, probabilities: pe.probabilities || {}, clear: n('persona_clear') },
    intent: { top: it.choice || null, probabilities: it.probabilities || {} },
    depth: { score: typeof dp.score === 'number' ? dp.score : 1, probabilities: dp.probabilities || {} },
    hurry: n('hurry'), saw: d.state
  };
}
