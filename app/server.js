// learn-nodejs web app. No dependencies: only Node's built-in modules.
// Start with `npm start`, then open http://localhost:3002.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listLessons, loadLesson } from './lessons.js';
import { runLesson, runSnippet } from './runner.js';
import { appendEvent, readEvents, runPayload, lessonStats } from './history.js';
import { buildProfile, profileMarkdown, writeProgress } from './profile.js';
import { loadEnvFile, tutorStatus, hint, visualizeRun, generateDrill, drillTarget, learnerSection, setClientForTests } from './tutor.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LESSONS = path.join(ROOT, 'lessons');
const WORK = path.join(ROOT, 'data', 'work');
const EVENTS = process.env.LEARN_EVENTS || path.join(ROOT, 'data', 'events.jsonl');
const PROGRESS = process.env.LEARN_PROGRESS || path.join(ROOT, 'PROGRESS.md');
const DATA = path.join(ROOT, 'data');

// ANTHROPIC_API_KEY for the tutor lives in .env (gitignored); see .env.example.
loadEnvFile(path.join(ROOT, '.env'));

// Development only: LEARN_FAKE_TUTOR=<module> replaces the Claude client (default export), for UI checks without a key.
if (process.env.LEARN_FAKE_TUTOR) setClientForTests((await import(path.resolve(process.env.LEARN_FAKE_TUTOR))).default);
const PUBLIC = path.join(ROOT, 'app', 'public');
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY = 256 * 1024;

const INFO = { track: 'nodejs', title: 'Node.js Basics', accent: '#0f6fbf' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const workPath = lesson => path.join(WORK, lesson.slug, lesson.file);

function savedCode(lesson) {
  try { return fs.readFileSync(workPath(lesson), 'utf8'); } catch { return null; }
}

function saveCode(lesson, code) {
  fs.mkdirSync(path.dirname(workPath(lesson)), { recursive: true });
  fs.writeFileSync(workPath(lesson), code);
}

const profileOf = events => buildProfile(INFO.track, listLessons(LESSONS), events, new Date().toISOString());

/** History stats for one lesson plus its review schedule from the profile. */
function statsFor(events, profile, lessonId) {
  const p = profile.lessons.find(l => l.id === lessonId);
  return { ...lessonStats(events, lessonId), review_step: p?.review_step ?? null, due: p?.due ?? null, due_now: p?.due_now ?? false };
}

/** After a run or reset: refresh the generated profile block in PROGRESS.md. */
function refreshProgress(lessonId) {
  const events = readEvents(EVENTS);
  const profile = profileOf(events);
  try { writeProgress(PROGRESS, profileMarkdown(profile)); } catch (err) { console.error('could not update PROGRESS.md:', err.message); }
  return { stats: statsFor(events, profile, lessonId), next: withSlug(profile.next) };
}

/** The profile's next step plus the lesson folder (slug) the UI needs to open it. */
function withSlug(next) {
  const lesson = next.lesson_id && listLessons(LESSONS).find(l => l.id === next.lesson_id);
  return { ...next, slug: lesson ? lesson.slug : null };
}

const DIFFICULTIES = new Set(['easy', 'right', 'hard']);

/** What the tutor needs to know about the learner (system prompt). */
function tutorContext(profile) {
  let progress = '';
  try { progress = fs.readFileSync(PROGRESS, 'utf8'); } catch { /* none yet */ }
  return {
    docsDir: path.join(ROOT, 'docs'),
    trackName: 'Node.js',
    learner: learnerSection(progress),
    profileMarkdown: profileMarkdown(profile),
    lessonsDir: LESSONS,
    dataDir: DATA,
    track: INFO.track,
    idPrefix: 'node',
  };
}

function parseJson(text) {
  try { return JSON.parse(text || '{}'); } catch { throw Object.assign(new Error('Body must be JSON'), { status: 400 }); }
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Code is too large'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (req.method === 'GET' && p === '/api/info') return send(res, 200, { ...INFO, tutor: await tutorStatus() });
  if (req.method === 'GET' && p === '/api/lessons') {
    const events = readEvents(EVENTS);
    const profile = profileOf(events);
    return send(res, 200, listLessons(LESSONS).map(l => ({ ...l, stats: statsFor(events, profile, l.id) })));
  }
  if (req.method === 'POST' && p === '/api/snippet') {
    const { code = '' } = parseJson(await readBody(req));
    return send(res, 200, await runSnippet(String(code)));
  }
  if (req.method === 'GET' && p === '/api/history') {
    const events = readEvents(EVENTS).filter(e => e.kind !== 'lesson_open').slice(-300).reverse();
    return send(res, 200, events.map(e => ({ ...e, payload: e.payload && { ...e.payload, code: undefined } })));
  }
  if (req.method === 'GET' && p === '/api/profile') {
    const profile = profileOf(readEvents(EVENTS));
    return send(res, 200, { profile, markdown: profileMarkdown(profile), next: withSlug(profile.next) });
  }

  const m = /^\/api\/lessons\/([^/]+)(\/code|\/run|\/feedback|\/hint|\/visualize|\/drill|\/log)?$/.exec(p);
  if (m) {
    const lesson = loadLesson(LESSONS, decodeURIComponent(m[1]));
    if (!lesson) return send(res, 404, { error: 'No such lesson' });
    const action = m[2] || '';
    if (req.method === 'GET' && action === '') {
      const saved = savedCode(lesson);
      appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'lesson_open' });
      const events = readEvents(EVENTS);
      const stats = statsFor(events, profileOf(events), lesson.meta.id);
      return send(res, 200, { slug: lesson.slug, meta: lesson.meta, body: lesson.body, file: lesson.file, code: saved ?? lesson.starter, saved: saved !== null, stats });
    }
    if (req.method === 'PUT' && action === '/code') {
      saveCode(lesson, await readBody(req));
      return send(res, 200, { saved: true });
    }
    if (req.method === 'DELETE' && action === '/code') {
      fs.rmSync(workPath(lesson), { force: true });
      appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'reset' });
      return send(res, 200, { code: lesson.starter, ...refreshProgress(lesson.meta.id) });
    }
    if (req.method === 'POST' && action === '/run') {
      const code = await readBody(req);
      saveCode(lesson, code);
      const result = await runLesson(lesson, code);
      const allPass = result.total > 0 && result.failed === 0 && result.compileErrors.length === 0 && !result.timedOut;
      appendEvent(EVENTS, {
        track: INFO.track,
        lesson_id: lesson.meta.id,
        kind: allPass ? 'pass' : 'fail',
        duration_ms: result.durationMs,
        payload: runPayload(result, code),
      });
      return send(res, 200, { ...result, ...refreshProgress(lesson.meta.id) });
    }
    if (req.method === 'POST' && action === '/feedback') {
      const difficulty = (await readBody(req)).trim();
      if (!DIFFICULTIES.has(difficulty)) return send(res, 400, { error: 'Rate it easy, right or hard' });
      appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'feedback', payload: { difficulty } });
      return send(res, 200, refreshProgress(lesson.meta.id));
    }
    if (req.method === 'POST' && action === '/log') {
      const { kind, payload = {} } = parseJson(await readBody(req));
      if (kind === 'hint') {
        const level = Number.isInteger(payload.level) ? payload.level : null;
        appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'hint', payload: { source: 'lesson', level, question: null } });
      } else if (kind === 'predict') {
        appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'predict', payload: { question: Number(payload.question) || null, correct: payload.correct === true } });
      } else {
        return send(res, 400, { error: 'Only hint and predict can be logged' });
      }
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && action === '/hint') {
      const { code = '', question = '' } = parseJson(await readBody(req));
      saveCode(lesson, code);
      const result = await runLesson(lesson, code);
      const events = readEvents(EVENTS);
      const text = await hint(tutorContext(profileOf(events)), {
        title: lesson.meta.title, lesson: lesson.body, file: lesson.file, code, result, question,
      });
      appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'hint', payload: { source: 'tutor', question: question.trim() || null } });
      return send(res, 200, { hint: text });
    }
    if (req.method === 'POST' && action === '/visualize') {
      const { code = '' } = parseJson(await readBody(req));
      saveCode(lesson, code);
      const result = await runLesson(lesson, code);
      if (result.total > 0 && !result.failed && !result.timedOut && !result.compileErrors.length) return send(res, 400, { error: 'Every check passes now: nothing to trace.' });
      if (result.timedOut) return send(res, 400, { error: 'Your code runs forever, so there is nothing to trace yet. Look for a loop that never ends.' });
      const made = await visualizeRun(tutorContext(profileOf(readEvents(EVENTS))), { title: lesson.meta.title, lesson: lesson.body, file: lesson.file, code, result });
      appendEvent(EVENTS, { track: INFO.track, lesson_id: lesson.meta.id, kind: 'hint', payload: { source: 'visual', question: null } });
      return send(res, 200, made);
    }
    if (req.method === 'POST' && action === '/drill') {
      const all = listLessons(LESSONS);
      const parentId = (lesson.meta.kind || 'core') === 'core' ? lesson.meta.id : lesson.meta.for;
      const parentRef = all.find(l => l.id === parentId);
      if (!parentRef) return send(res, 400, { error: 'This exercise has no core lesson to practise.' });
      const parent = loadLesson(LESSONS, parentRef.slug);
      const children = all.filter(l => l.for === parentId);
      const existing = [parent, ...children.map(c => loadLesson(LESSONS, c.slug))]
        .map(l => `### ${l.meta.title} (${l.meta.kind || 'core'})\n\n\`\`\`\n${l.starter}\n\`\`\``).join('\n\n');
      const events = readEvents(EVENTS);
      const profile = profileOf(events);
      const made = await generateDrill(tutorContext(profile), {
        parent: { id: parent.meta.id, slug: parent.slug, title: parent.meta.title, concepts: parent.meta.concepts || [], body: parent.body },
        existing,
        target: drillTarget(profile, { id: parent.meta.id, title: parent.meta.title, concepts: parent.meta.concepts || [] }, events, [parentId, ...children.map(c => c.id)]),
      });
      appendEvent(EVENTS, { track: INFO.track, lesson_id: made.id, kind: 'generated', payload: { for: parentId, targets: made.targets, attempts: made.attempts } });
      return send(res, 200, { ...made, ...refreshProgress(made.id) });
    }
    return send(res, 405, { error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    const file = p === '/' ? 'index.html' : p.slice(1);
    const full = path.join(PUBLIC, file);
    if (full.startsWith(PUBLIC + path.sep) && fs.existsSync(full) && fs.statSync(full).isFile()) {
      return send(res, 200, fs.readFileSync(full), TYPES[path.extname(full)] || 'application/octet-stream');
    }
  }
  return send(res, 404, { error: 'Not found' });
}

http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error(err);
    if (!res.headersSent) send(res, err.status || 500, { error: err.message });
  });
}).listen(PORT, HOST, () => {
  console.log(`${INFO.title} running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
