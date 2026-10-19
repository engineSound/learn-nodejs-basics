// Learner profile and adaptive next step, derived from the event log.
// Rules: docs/SHARED-FORMAT.md, section 5. learn-rust/app/src/profile.rs implements the
// same rules; docs/fixtures/ keeps the two in step.
import fs from 'node:fs';

const DAY = 86_400_000;
const SESSION_GAP = 30 * 60_000;
export const REVIEW_DAYS = [1, 3, 7, 16, 35];
const STRUGGLE_RUNS = 4; // solved on run 4 or later = struggled
const WARMUP_RUNS = 3;   // this many runs on an unsolved lesson = offer a drill
const START = '<!-- profile:start -->';
const END = '<!-- profile:end -->';

const ms = ts => Date.parse(ts);
const iso = t => new Date(t).toISOString();
const day = ts => ts.slice(0, 10);
const round2 = x => Math.round(x * 100) / 100;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const isRun = e => e.kind === 'pass' || e.kind === 'fail';

/**
 * @param lessons [{ id, title, concepts, kind: 'core'|'drill'|'stretch', for: core id|null }] in lesson order
 * @param events  all events, oldest first
 * @param now     ISO timestamp
 */
export function buildProfile(track, lessons, events, now) {
  const nowMs = ms(now);
  const childrenOf = id => lessons.filter(l => l.kind !== 'core' && l.for === id);

  // Own runs for every item; review schedule for core lessons, where a run on one of
  // the lesson's drills or stretches also counts as a review once the lesson is due.
  const info = lessons.map(l => {
    const own = new Set([l.id]);
    const children = l.kind === 'core' ? new Set(childrenOf(l.id).map(c => c.id)) : new Set();
    const st = { lesson: l, solved: false, step: 0, due: null, lapsed: false, runs: 0, firstPass: null, firstPassTs: null, lastRunTs: null, feedback: null };
    for (const e of events) {
      if (e.kind === 'feedback' && own.has(e.lesson_id)) st.feedback = e.payload?.difficulty ?? null;
      if (!isRun(e)) continue;
      const t = ms(e.ts);
      const mine = own.has(e.lesson_id);
      if (!mine && !children.has(e.lesson_id)) continue;
      if (mine) { st.runs++; st.lastRunTs = e.ts; }
      if (!st.solved) {
        if (mine && e.kind === 'pass') {
          st.solved = true;
          st.firstPass = st.runs;
          st.firstPassTs = e.ts;
          st.step = 0;
          st.due = t + REVIEW_DAYS[0] * DAY;
        }
      } else if (l.kind === 'core' && t >= st.due) {
        if (e.kind === 'pass') {
          st.step = st.lapsed ? 0 : Math.min(st.step + 1, REVIEW_DAYS.length - 1);
          st.lapsed = false;
          st.due = t + REVIEW_DAYS[st.step] * DAY;
        } else {
          st.lapsed = true;
        }
      }
    }
    return st;
  });
  const byId = new Map(info.map(s => [s.lesson.id, s]));
  const reviewed = s => s.lesson.kind === 'core' && s.solved;

  const score = s => {
    if (!s.runs) return null;
    if (!s.solved) return 0.2;
    const base = s.firstPass === 1 ? 0.7 : s.firstPass <= 3 ? 0.6 : 0.5;
    const step = reviewed(s) ? s.step : 0;
    return Math.max(0, Math.min(1, base + 0.1 * step - (s.lapsed ? 0.2 : 0)));
  };
  const concepts = [];
  for (const s of info) {
    for (const name of s.lesson.concepts || []) {
      let c = concepts.find(c => c.name === name);
      if (!c) concepts.push(c = { name, scores: [], lessons: [] });
      c.lessons.push(s.lesson.id);
      if (score(s) !== null) c.scores.push(score(s));
    }
  }

  const counts = new Map();
  for (const e of events) {
    if (e.kind !== 'fail' || !e.payload) continue;
    for (const what of [...(e.payload.errors || []), ...(e.payload.failing || [])]) counts.set(what, (counts.get(what) || 0) + 1);
  }
  const recurring = [...counts]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))
    .slice(0, 5)
    .map(([what, count]) => ({ what, count }));

  let sessions = 0, spanMs = 0, start = null, prev = null;
  for (const e of events) {
    const t = ms(e.ts);
    if (prev === null || t - prev > SESSION_GAP) {
      if (prev !== null) spanMs += prev - start;
      sessions++;
      start = t;
    }
    prev = t;
  }
  if (prev !== null) spanMs += prev - start;
  const days = new Set(events.map(e => day(e.ts)));
  let cursor = days.has(day(now)) ? nowMs : nowMs - DAY;
  let streak = 0;
  while (days.has(day(iso(cursor)))) { streak++; cursor -= DAY; }

  const feedback = { easy: 0, right: 0, hard: 0 };
  for (const e of events) {
    const d = e.kind === 'feedback' ? e.payload?.difficulty : null;
    if (d in feedback) feedback[d]++;
  }
  const solvedRuns = info.filter(s => s.lesson.kind === 'core' && s.solved).map(s => s.firstPass).sort((a, b) => a - b);
  const mid = solvedRuns.length >> 1;
  const median = !solvedRuns.length ? null : solvedRuns.length % 2 ? solvedRuns[mid] : (solvedRuns[mid - 1] + solvedRuns[mid]) / 2;

  const lessonOut = info.map(s => ({
    id: s.lesson.id,
    title: s.lesson.title,
    kind: s.lesson.kind,
    for: s.lesson.for ?? null,
    status: s.solved ? 'solved' : s.runs ? 'started' : 'new',
    runs: s.runs,
    first_pass_run: s.firstPass,
    feedback: s.feedback,
    review_step: reviewed(s) ? s.step : null,
    due: reviewed(s) ? iso(s.due) : null,
    due_now: reviewed(s) && nowMs >= s.due,
  }));

  return {
    generated_at: now,
    track,
    sessions: { count: sessions, streak_days: streak, minutes_total: Math.round(spanMs / 60_000), last_ts: events.length ? events[events.length - 1].ts : null },
    pace: { median_runs_to_solve: median, feedback },
    lessons: lessonOut,
    concepts: concepts.map(c => ({
      name: c.name,
      mastery: c.scores.length ? round2(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) : null,
      lessons: c.lessons,
    })),
    recurring,
    next: chooseNext(lessonOut, byId, childrenOf),
  };
}

/** The adaptive next step (SHARED-FORMAT.md, section 5). */
function chooseNext(lessons, byId, childrenOf) {
  const pick = (l, kind, reason) => ({ kind, lesson_id: l.id, title: l.title, reason });
  const core = lessons.filter(l => l.kind === 'core');
  // Never-run first, then the one run longest ago; ties keep lesson order.
  const freshest = items => items.slice().sort((a, b) => cmp(byId.get(a.id).lastRunTs ?? '', byId.get(b.id).lastRunTs ?? ''))[0];

  // 1. Reviews: most overdue first, practised with a drill when there is one.
  const due = core.filter(l => l.due_now).sort((a, b) => cmp(a.due, b.due));
  if (due.length) {
    const l = due[0];
    const drill = freshest(childrenOf(l.id).filter(c => c.kind === 'drill'));
    return drill
      ? pick(drill, 'review', `review of "${l.title}", due since ${day(l.due)}`)
      : pick(l, 'review', `due since ${day(l.due)}`);
  }

  // 2. React to the most recently solved core lesson, unless the learner has moved on.
  const solved = core.filter(l => l.status === 'solved').sort((a, b) => cmp(byId.get(a.id).firstPassTs, byId.get(b.id).firstPassTs));
  const last = solved[solved.length - 1];
  if (last && !core.slice(core.indexOf(last) + 1).some(l => l.runs > 0)) {
    const kids = childrenOf(last.id).map(c => lessons.find(x => x.id === c.id));
    const struggled = last.feedback === 'hard' || (last.feedback !== 'easy' && last.first_pass_run >= STRUGGLE_RUNS);
    const breezed = last.feedback === 'easy';
    const drill = kids.find(k => k.kind === 'drill' && k.status !== 'solved');
    const stretch = kids.find(k => k.kind === 'stretch' && k.status !== 'solved');
    if (struggled && drill) return pick(drill, 'drill', `extra practice: "${last.title}" was hard`);
    if (breezed && stretch) return pick(stretch, 'stretch', `"${last.title}" was easy, so here's a harder one`);
  }

  // 3. The current lesson: offer a warm-up drill after several unsuccessful runs.
  const current = core.find(l => l.status !== 'solved');
  if (current) {
    const drill = childrenOf(current.id).map(c => lessons.find(x => x.id === c.id)).find(k => k.kind === 'drill' && k.status !== 'solved');
    if (current.runs >= WARMUP_RUNS && drill) return pick(drill, 'drill', `warm-up: "${current.title}" has taken ${current.runs} runs so far`);
    return pick(current, 'lesson', current.runs ? 'in progress' : 'next new lesson');
  }

  const dues = core.map(l => l.due).filter(Boolean).sort();
  return { kind: 'done', lesson_id: null, title: null, reason: dues.length ? `all lessons solved; next review ${day(dues[0])}` : 'all lessons solved' };
}

const KIND_LABEL = { core: 'lesson', drill: 'drill', stretch: 'stretch' };
const num = n => String(n);

export function profileMarkdown(p) {
  const out = [START, '<!-- Generated by the app from data/events.jsonl. Edits inside this block are overwritten. -->', '## Learner profile', ''];
  out.push(`Updated ${p.generated_at.slice(0, 10)} ${p.generated_at.slice(11, 16)} UTC.`, '');
  const n = p.next;
  const verb = { review: 'review ', drill: 'drill ', stretch: 'stretch ', lesson: '' }[n.kind];
  out.push('**Next:** ' + (n.kind === 'done' ? `${n.reason}.` : `${verb}"${n.title}" (${n.reason}).`), '');
  const s = p.sessions;
  out.push('**Sessions:** ' + (s.count ? `${s.count}, ${s.minutes_total} min in total, streak ${s.streak_days} ${s.streak_days === 1 ? 'day' : 'days'}, last on ${day(s.last_ts)}.` : 'none yet.'), '');
  const f = p.pace.feedback;
  out.push('**Pace:** ' + (p.pace.median_runs_to_solve === null ? 'no lessons solved yet' : `lessons solved in a median of ${num(p.pace.median_runs_to_solve)} ${p.pace.median_runs_to_solve === 1 ? 'run' : 'runs'}`) +
    `; rated too easy ${f.easy}, about right ${f.right}, too hard ${f.hard}.`, '');
  out.push('| Exercise | Kind | Status | Runs | Solved on run | Rated | Review |', '|----------|------|--------|------|---------------|-------|--------|');
  for (const l of p.lessons) {
    const review = l.due_now ? 'due now' : l.due ? `next ${day(l.due)}` : '–';
    out.push(`| ${l.title} | ${KIND_LABEL[l.kind]} | ${l.status} | ${l.runs} | ${l.first_pass_run ?? '–'} | ${l.feedback ?? '–'} | ${review} |`);
  }
  out.push('');
  const practiced = p.concepts.filter(c => c.mastery !== null);
  if (practiced.length) {
    out.push('| Concept | Mastery |', '|---------|---------|');
    for (const c of practiced) out.push(`| ${c.name} | ${c.mastery.toFixed(2)} |`);
  } else {
    out.push('No concepts practiced yet.');
  }
  out.push('');
  out.push('**Recurring mistakes:** ' + (p.recurring.length ? p.recurring.map(r => `\`${r.what}\` ×${r.count}`).join(', ') + '.' : 'none yet.'));
  out.push(END);
  return out.join('\n');
}

/** Replace the generated block in PROGRESS.md (or insert it before "## Log"). */
export function writeProgress(file, markdown) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { /* new file */ }
  const a = text.indexOf(START), b = text.indexOf(END);
  let next;
  if (a >= 0 && b > a) next = text.slice(0, a) + markdown + text.slice(b + END.length);
  else if (text.includes('\n## Log')) next = text.replace('\n## Log', '\n' + markdown + '\n\n## Log');
  else next = text + (text && !text.endsWith('\n') ? '\n' : '') + (text ? '\n' : '') + markdown + '\n';
  if (next !== text) fs.writeFileSync(file, next);
}
