// The tutor: hints, step-through visuals of the learner's own code and newly generated drills from Claude, adapted to the learner's profile.
// Prompts live in docs/tutor/ (shared with learn-rust). Rules: docs/SHARED-FORMAT.md, section 6.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import { runLesson, runSnippet } from './runner.js';
import { visualProblems } from './visuals.js';

export const MODEL = 'claude-opus-5-5';
const MAX_TOKENS = 16000;
const ATTEMPTS = 2;

export class TutorError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

let sdk = null;
let client = null;
let fake = null;

/** Tests pass an object with the same `beta.messages.create` shape as the SDK client. */
export function setClientForTests(c) { fake = c; }

async function getClient() {
  if (fake) return fake;
  if (!client) {
    try {
      sdk = (await import('@anthropic-ai/sdk')).default;
    } catch {
      throw new TutorError('The tutor needs the Anthropic SDK: run `npm install @anthropic-ai/sdk` in this repo, then restart.', 503);
    }
    // Only the API key: an ANTHROPIC_AUTH_TOKEN left in the shell (other tools set one) would be sent too and get rejected.
    client = new sdk({ apiKey: process.env.ANTHROPIC_API_KEY || null, authToken: null });
  }
  return client;
}

// ---------- the API key ----------

const fromEnvFile = new Set();

/** Load .env into process.env. Its values win over the shell's, so an old exported key can't shadow it. */
export function loadEnvFile(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; } // no .env: the tutor stays off unless the key is set elsewhere
  for (const [k, v] of Object.entries(util.parseEnv(text))) {
    if (!v.trim()) continue;
    process.env[k] = v.trim();
    fromEnvFile.add(k);
  }
}

/**
 * Why a key was rejected, without revealing it: where it came from, its prefix and last 4 characters
 * (as console.anthropic.com shows them), and the usual mix-ups. Same wording in learn-rust.
 */
export function keyProblem(apiMessage) {
  const key = process.env.ANTHROPIC_API_KEY || '';
  const where = fromEnvFile.has('ANTHROPIC_API_KEY') ? '.env' : 'your shell environment (not .env)';
  const lines = [`The API key was rejected${apiMessage ? ` ("${apiMessage}")` : ''}.`];
  if (!key) return 'No API key is set. Put ANTHROPIC_API_KEY in .env, then restart.';
  lines.push(`The app used the key from ${where}: ${key.slice(0, 12)}…${key.slice(-4)} (${key.length} characters).`);
  if (!fromEnvFile.has('ANTHROPIC_API_KEY')) lines.push('Put your key in .env (it wins over the shell), or remove the old `export ANTHROPIC_API_KEY` from your shell profile.');
  if (key.startsWith('sk-ant-oat')) lines.push('This is a Claude subscription login token, not an API key. Create an API key at console.anthropic.com → API keys.');
  else if (!key.startsWith('sk-ant-api')) lines.push('That doesn\'t look like an Anthropic API key (they start with sk-ant-api). Check for a stray character or a different value.');
  const base = process.env.ANTHROPIC_BASE_URL;
  if (base && !/^https:\/\/api\.anthropic\.com\/?$/.test(base)) lines.push(`Requests go to ${base} (ANTHROPIC_BASE_URL${fromEnvFile.has('ANTHROPIC_BASE_URL') ? ' in .env' : ' in your shell'}), not api.anthropic.com: remove it.`);
  if (lines.length === 2) lines.push('If those characters match a key at console.anthropic.com → API keys, check that it is active; otherwise paste the key into .env again, then restart.');
  return lines.join(' ');
}

export async function tutorStatus() {
  if (fake) return { enabled: true, reason: null };
  try {
    await import('@anthropic-ai/sdk');
    return { enabled: true, reason: null };
  } catch {
    return { enabled: false, reason: 'run `npm install @anthropic-ai/sdk` and put ANTHROPIC_API_KEY in .env, then restart.' };
  }
}

/** One request to Claude; returns the text of the reply. */
async function ask({ system, messages, effort, schema }) {
  const c = await getClient();
  let response;
  try {
    response = await c.beta.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // a declined request is re-run on Anthropic's recommended fallback model
      output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
      system,
      messages,
    });
  } catch (err) {
    if (sdk && err instanceof sdk.AuthenticationError) throw new TutorError(keyProblem(err.error?.error?.message), 401);
    if (sdk && err instanceof sdk.RateLimitError) throw new TutorError('The tutor is rate-limited right now. Try again in a minute.', 429);
    if (sdk && err instanceof sdk.APIError) throw new TutorError(`The Claude API returned an error (${err.status ?? 'network'}): ${err.message}`);
    throw err;
  }
  if (response.stop_reason === 'refusal') throw new TutorError('The tutor declined this request.');
  if (response.stop_reason === 'max_tokens') throw new TutorError('The tutor ran out of room before finishing. Try again.');
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('');
}

// ---------- prompts ----------

const render = (template, vars) => template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : `{{${k}}}`));
const readPrompt = (docsDir, name) => fs.readFileSync(path.join(docsDir, 'tutor', name), 'utf8');

/** The "## Learner" section of PROGRESS.md: the learner's own description. */
export function learnerSection(progressText) {
  const lines = String(progressText || '').split('\n');
  const start = lines.findIndex(l => l.trim() === '## Learner');
  if (start < 0) return '(not written yet)';
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (l.startsWith('## ') || l.startsWith('<!--')) break;
    out.push(l);
  }
  return out.join('\n').trim() || '(not written yet)';
}

function systemPrompt(ctx) {
  return render(readPrompt(ctx.docsDir, 'system.md'), {
    track_name: ctx.trackName,
    learner: ctx.learner,
    profile: ctx.profileMarkdown.split('\n').filter(l => !l.startsWith('<!--')).join('\n'),
  });
}

/** Plain-text summary of a run result for the prompt. */
export function describeResult(r) {
  if (!r) return 'Not run yet.';
  if (r.timedOut) return 'The run timed out.';
  if (r.compileErrors.length) return 'It does not compile/load yet:\n\n' + r.compileErrors.map(e => `${e.code ? e.code + ' ' : ''}${e.title}\n${e.message}`).join('\n\n');
  const lines = [`${r.passed} of ${r.total} tests pass.`];
  for (const t of r.tests.filter(t => !t.ok)) lines.push(`- FAILED ${t.name}${t.message ? `: ${t.message.split('\n').slice(0, 6).join(' / ')}` : ''}`);
  return lines.join('\n');
}

// ---------- hints ----------

/**
 * @param ctx { docsDir, trackName, learner, profileMarkdown }
 * @param hintInput { title, lesson, file, code, result, question }
 */
export async function hint(ctx, { title, lesson, file, code, result, question }) {
  const user = render(readPrompt(ctx.docsDir, 'hint.md'), {
    title, lesson, file, code, result: describeResult(result),
    question: question && question.trim() ? question.trim() : '(No question: they pressed "Hint".)',
  });
  return (await ask({ system: systemPrompt(ctx), messages: [{ role: 'user', content: user }], effort: 'medium' })).trim();
}

// ---------- "Show me what my code does": a visual of the learner's own failing run ----------

/** The lesson text without its ```visual blocks (they are long; the first one is sent as the style example). */
export function splitVisuals(body) {
  const visuals = [...String(body).matchAll(/```visual\n([\s\S]*?)\n```/g)].map(m => m[1]);
  return { text: String(body).replace(/\n?```visual\n[\s\S]*?\n```\n?/g, '\n'), example: visuals[0] || null };
}

/** The first scenario of a lesson visual, as a compact style example. */
function exampleOf(json) {
  try {
    const spec = JSON.parse(json);
    return JSON.stringify({ title: spec.title, regions: spec.regions, scenarios: spec.scenarios.slice(0, 1).map(({ check, ...sc }) => sc) });
  } catch { return '(none)'; }
}

/** Schema answer → the visual spec visual.js plays ("" and 0 mean "not set"). */
export function toVisual(reply) {
  const keep = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''));
  const steps = (reply.scenario?.steps || []).map(s => keep({
    line: s.line > 0 ? s.line : '',
    say: s.say, rule: s.rule, error: s.error,
    set: (s.set || []).map(keep),
    drop: s.drop || [],
    arrows: (s.arrows || []).map(keep),
  }));
  return {
    title: reply.title,
    intro: reply.intro,
    regions: (reply.regions || []).map(keep),
    scenarios: [{ name: reply.scenario?.name || 'Your code', group: 'Your code', code: reply.scenario?.code || '', steps }],
  };
}

const flat = s => String(s).trim().split(/\s+/).join(' ');

/** Run the claimed call on the learner's real code; null when the claim holds, else what really happened. */
async function checkClaim(code, check) {
  const prints = flat(check?.prints || '');
  if (!prints) return 'check.prints is empty.';
  const call = String(check.call || '').trim();
  const r = await runSnippet(call ? `${code}\n;console.log(${call});\n` : code);
  const out = flat(r.output);
  if (r.timedOut) return `Running \`${call}\` on their code timed out.`;
  if (r.ok && !call) return 'Their code loads fine, so check.call must make the call the failing test makes.';
  if (r.ok ? out === prints || out.endsWith(' ' + prints) : prints.length >= 3 && out.includes(prints)) return null;
  return `Running ${call ? `\`console.log(${call})\`` : 'their code'} really printed:\n\n${r.output.trim().slice(0, 1500)}\n\nbut check.prints says "${check.prints}". Trace their code again: the visual must show what really happens.`;
}

/**
 * Ask Claude for a step-through visual of the learner's code on the first failing test,
 * then check it: its structure (as visual.js will play it) and its claim (run on the real code).
 *
 * @param ctx   { docsDir, trackName, learner, profileMarkdown }
 * @param input { title, lesson, file, code, result }
 * @returns { visual, verified: { call, prints }, attempts }
 */
export async function visualizeRun(ctx, { title, lesson, file, code, result }) {
  const { text, example } = splitVisuals(lesson);
  const user = render(readPrompt(ctx.docsDir, 'visual.md'), {
    title, lesson: text.trim(), file, code, result: describeResult(result),
    example: example ? exampleOf(example) : '(this lesson has none)',
    call_rule: 'a JavaScript expression that calls their code the way the failing test does (the app runs `console.log(<call>)` after their module; `await` is allowed)',
    compile_word: 'load',
  });
  const schema = JSON.parse(readPrompt(ctx.docsDir, 'visual-schema.json'));
  const messages = [{ role: 'user', content: user }];
  let problem = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const reply = await ask({ system: systemPrompt(ctx), messages, effort: 'medium', schema });
    let parsed = null;
    try { parsed = JSON.parse(reply); } catch { problem = 'The reply was not valid JSON.'; }
    if (parsed) {
      const visual = toVisual(parsed);
      const shape = visualProblems(visual);
      problem = shape.length ? 'The visualizer cannot play it:\n- ' + shape.slice(0, 8).join('\n- ') : await checkClaim(code, parsed.check);
      if (!problem) return { visual, verified: { call: String(parsed.check.call || '').trim(), prints: parsed.check.prints.trim() }, attempts: attempt };
    }
    messages.push({ role: 'assistant', content: reply });
    messages.push({ role: 'user', content: `The app checked this visual and it failed:\n\n${problem}\n\nReturn a corrected visual in the same format.` });
  }
  throw new TutorError(`The tutor couldn't trace your code reliably (${problem.split('\n')[0]}). Try again, or ask a question instead.`);
}

// ---------- generated drills ----------

const oneLine = s => String(s).replace(/\s+/g, ' ').replace(/ #/g, ' ').trim();

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 5).join('-') || 'drill';
}

function checkShape(d) {
  for (const k of ['title', 'slug', 'explanation', 'starter', 'tests', 'solution', 'targets']) {
    if (typeof d?.[k] !== 'string' || !d[k].trim()) return `field "${k}" is missing or empty`;
  }
  if (!Array.isArray(d.concepts)) return 'field "concepts" must be a list';
  return null;
}

/** Run the drill's tests against its starter (must fail) and its solution (must pass). */
async function verify(drill, explanation) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-gen-'));
  try {
    fs.writeFileSync(path.join(dir, 'lesson.md'), explanation);
    fs.writeFileSync(path.join(dir, 'exercise.js'), drill.starter);
    fs.writeFileSync(path.join(dir, 'exercise.test.js'), drill.tests);
    const lesson = { dir, file: 'exercise.js' };
    const starter = await runLesson(lesson, drill.starter);
    if (starter.compileErrors.length || starter.timedOut) return `The starter code does not load: ${describeResult(starter)}`;
    if (starter.total < 2) return `Only ${starter.total} test(s) ran; write at least 2.`;
    if (starter.passed === starter.total) return 'Every test already passes against the starter code, so the tests check nothing.';
    const solved = await runLesson(lesson, drill.solution);
    if (solved.compileErrors.length || solved.timedOut || solved.failed || solved.total !== starter.total) {
      return `The solution does not pass the tests: ${describeResult(solved)}`;
    }
    return null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Ask Claude for a drill aimed at the learner's difficulties, verify it, and save it
 * as lessons/<NN>g-<slug>/ (kind: drill, for: the core lesson).
 *
 * @param ctx  { docsDir, trackName, learner, profileMarkdown, lessonsDir, dataDir, track: 'nodejs', idPrefix: 'node' }
 * @param plan { parent: { id, slug, title, concepts, body }, existing: string, target: string }
 * @returns { slug, id, title, targets, attempts }
 */
export async function generateDrill(ctx, plan) {
  const { parent } = plan;
  const user = render(readPrompt(ctx.docsDir, 'drill.md'), {
    target: plan.target,
    parent_title: parent.title,
    parent_id: parent.id,
    parent_concepts: parent.concepts.join(', '),
    parent_lesson: parent.body,
    existing: plan.existing || '(none)',
    conventions: readPrompt(ctx.docsDir, `conventions-${ctx.track}.md`),
  });
  const schema = JSON.parse(readPrompt(ctx.docsDir, 'drill-schema.json'));
  const messages = [{ role: 'user', content: user }];
  let problem = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const text = await ask({ system: systemPrompt(ctx), messages, effort: 'high', schema });
    let drill = null;
    try { drill = JSON.parse(text); } catch { problem = 'The reply was not valid JSON.'; }
    if (drill) problem = checkShape(drill) || (await verify(drill, drill.explanation));
    if (!problem) return save(ctx, plan, drill, attempt);
    messages.push({ role: 'assistant', content: text });
    messages.push({ role: 'user', content: `The app checked this drill and it failed:\n\n${problem}\n\nReturn a corrected drill in the same format.` });
  }
  throw new TutorError(`The tutor couldn't produce a drill that passed its checks (${problem}). Try again.`);
}

function save(ctx, plan, drill, attempts) {
  const { parent } = plan;
  const nn = (/^\d+/.exec(parent.slug) || ['00'])[0];
  const base = `${nn}g-${slugify(drill.slug)}`;
  let slug = base;
  for (let i = 2; fs.existsSync(path.join(ctx.lessonsDir, slug)); i++) slug = `${base}-${i}`;
  const concepts = drill.concepts.map(slugify).filter(c => parent.concepts.includes(c));
  const id = `${ctx.idPrefix}-${slug}`;
  const frontMatter = [
    '---',
    `id: ${id}`,
    `track: ${ctx.track}`,
    `title: ${oneLine(drill.title)}`,
    'kind: drill',
    `for: ${parent.id}`,
    `minutes: ${Number.isInteger(drill.minutes) && drill.minutes > 0 ? drill.minutes : 10}`,
    `concepts: [${(concepts.length ? concepts : parent.concepts).join(', ')}]`,
    `prereqs: [${parent.id}]`,
    'contrast: java',
    'edit: exercise.js',
    'generated: true',
    `targets: ${oneLine(drill.targets)}`,
    '---',
    '',
  ].join('\n');
  const dir = path.join(ctx.lessonsDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'lesson.md'), frontMatter + drill.explanation.trim() + '\n');
  fs.writeFileSync(path.join(dir, 'exercise.js'), drill.starter.trimEnd() + '\n');
  fs.writeFileSync(path.join(dir, 'exercise.test.js'), drill.tests.trimEnd() + '\n');
  // The reference solution stays local (data/ is gitignored): the learner never sees it.
  const solDir = path.join(ctx.dataDir, 'solutions', slug);
  fs.mkdirSync(solDir, { recursive: true });
  fs.writeFileSync(path.join(solDir, 'exercise.js'), drill.solution.trimEnd() + '\n');
  return { slug, id, title: oneLine(drill.title), targets: oneLine(drill.targets), attempts };
}

/** What the drill should aim at, from the profile and the latest failures on this lesson. */
export function drillTarget(profile, parent, events, lessonIds) {
  const lines = [];
  const mine = profile.lessons.find(l => l.id === parent.id);
  if (mine) {
    lines.push(`- Their history on "${parent.title}": ${mine.runs} runs, ${mine.first_pass_run ? `solved on run ${mine.first_pass_run}` : 'not solved yet'}${mine.feedback ? `, rated "${mine.feedback}"` : ''}.`);
  }
  const weak = profile.concepts.filter(c => parent.concepts.includes(c.name) && c.mastery !== null).sort((a, b) => a.mastery - b.mastery);
  if (weak.length) lines.push(`- Mastery of this lesson's concepts (0–1): ${weak.map(c => `${c.name} ${c.mastery.toFixed(2)}`).join(', ')}.`);
  if (profile.recurring.length) lines.push(`- Recurring mistakes across all exercises: ${profile.recurring.map(r => `${r.what} ×${r.count}`).join(', ')}.`);
  const fails = events.filter(e => e.kind === 'fail' && lessonIds.includes(e.lesson_id) && e.payload).slice(-3);
  for (const f of fails) {
    const what = [...(f.payload.errors || []), ...(f.payload.failing || [])].slice(0, 4).join('; ');
    if (what) lines.push(`- A recent failing run on this lesson: ${what}.`);
  }
  if (!lines.length) lines.push('- No history on this lesson yet: write a gentle drill covering its main concept.');
  return lines.join('\n');
}
