import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile, keyProblem, setClientForTests, hint, visualizeRun, toVisual, generateDrill, learnerSection, drillTarget, describeResult, MODEL, TutorError } from './tutor.js';
import { loadLesson } from './lessons.js';
import { runLesson } from './runner.js';
import { buildProfile } from './profile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A stand-in for the SDK client: records requests, replies with canned text. */
function fakeClient(replies) {
  const requests = [];
  return {
    requests,
    beta: { messages: { create: async req => {
      requests.push(JSON.parse(JSON.stringify(req)));
      const next = replies.shift();
      return typeof next === 'object' ? next : { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: next }] };
    } } },
  };
}

function context(dir) {
  return {
    docsDir: path.join(ROOT, 'docs'), trackName: 'Node.js', learner: 'Professional Java developer.',
    profileMarkdown: '<!-- profile:start -->\n## Learner profile\nNext: something\n<!-- profile:end -->',
    lessonsDir: path.join(dir, 'lessons'), dataDir: path.join(dir, 'data'), track: 'nodejs', idPrefix: 'node',
  };
}

const parent = (() => {
  const l = loadLesson(path.join(ROOT, 'test-fixtures', 'lessons'), '04-active-devices');
  return { id: l.meta.id, slug: l.slug, title: l.meta.title, concepts: l.meta.concepts, body: l.body };
})();

const goodDrill = {
  title: 'Totals without surprises',
  slug: 'Totals Without Surprises',
  concepts: ['array-methods', 'equality', 'not-a-concept-here'],
  minutes: 8,
  targets: 'Empty arrays and reduce: #1 mistake so far.',
  explanation: '# Drill: totals\n\n- reduce needs a start value\n\n## Exercise\nTwo functions.',
  starter: "export function total(xs) {\n  throw new Error('TODO: total');\n}\nexport function count(xs) {\n  throw new Error('TODO: count');\n}\n",
  tests: "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { total, count } from './exercise.js';\n" +
    "test('total adds numbers', () => assert.equal(total([1, 2]), 3));\n" +
    "test('total of nothing is 0', () => assert.equal(total([]), 0));\n" +
    "test('count counts', () => assert.equal(count([5, 6, 7]), 3));\n",
  solution: 'export const total = xs => xs.reduce((a, b) => a + b, 0);\nexport const count = xs => xs.length;\n',
};

test('learnerSection reads only the learner\'s own description', () => {
  const text = '# Progress\n\n## Learner\n- Java pro\n- likes short sessions\n\n<!-- profile:start -->\nX\n<!-- profile:end -->\n\n## Log\n';
  assert.equal(learnerSection(text), '- Java pro\n- likes short sessions');
  assert.equal(learnerSection('# nothing'), '(not written yet)');
});

test('hint: one request with the profile, the code and the test result; no solution format', async () => {
  const fake = fakeClient(['Look at what `Number("")` returns.']);
  setClientForTests(fake);
  const result = { passed: 1, failed: 1, total: 2, tests: [{ name: 'skips blanks', ok: false, message: '0 !== undefined' }], compileErrors: [], timedOut: false };
  const text = await hint(context(os.tmpdir()), { title: 'T', lesson: 'Lesson text', file: 'exercise.js', code: 'MY CODE', result, question: '' });
  assert.equal(text, 'Look at what `Number("")` returns.');
  const req = fake.requests[0];
  assert.equal(req.model, MODEL);
  assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(req.fallbacks, 'default');
  assert.deepEqual(req.output_config, { effort: 'medium' });
  assert.match(req.system, /Professional Java developer\./);
  assert.match(req.system, /Next: something/);
  assert.doesNotMatch(req.system, /profile:start/);
  assert.match(req.messages[0].content, /MY CODE/);
  assert.match(req.messages[0].content, /FAILED skips blanks/);
  setClientForTests(null);
});

test('a refusal becomes a clear error', async () => {
  setClientForTests(fakeClient([{ stop_reason: 'refusal', content: [] }]));
  await assert.rejects(hint(context(os.tmpdir()), { title: 'T', lesson: '', file: 'f', code: '', result: null, question: 'q' }), TutorError);
  setClientForTests(null);
});

test('generateDrill: verifies, then saves a drill the app can load (solution kept out of lessons/)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-gen-test-'));
  const fake = fakeClient([JSON.stringify(goodDrill)]);
  setClientForTests(fake);
  const made = await generateDrill(context(dir), { parent, existing: '(none)', target: '- E0308 ×3' });
  assert.equal(made.slug, '04g-totals-without-surprises');
  assert.equal(made.id, 'node-04g-totals-without-surprises');
  assert.equal(made.attempts, 1);
  const req = fake.requests[0];
  assert.equal(req.output_config.effort, 'high');
  assert.equal(req.output_config.format.type, 'json_schema');
  assert.match(req.messages[0].content, /E0308 ×3/);
  assert.match(req.messages[0].content, /exercise\.test\.js/);

  const saved = loadLesson(path.join(dir, 'lessons'), made.slug);
  assert.equal(saved.meta.kind, 'drill');
  assert.equal(saved.meta.for, parent.id);
  assert.deepEqual(saved.meta.concepts, ['array-methods']);
  assert.equal(saved.meta.targets, 'Empty arrays and reduce: 1 mistake so far.');
  assert.match(saved.starter, /TODO: total/);
  assert.ok(!fs.existsSync(path.join(dir, 'lessons', made.slug, 'solution.js')));
  assert.ok(fs.existsSync(path.join(dir, 'data', 'solutions', made.slug, 'exercise.js')));

  // A second drill with the same slug gets its own folder.
  setClientForTests(fakeClient([JSON.stringify(goodDrill)]));
  const again = await generateDrill(context(dir), { parent, existing: '', target: '' });
  assert.equal(again.slug, '04g-totals-without-surprises-2');
  setClientForTests(null);
});

test('generateDrill: a drill that fails its checks is sent back once with the reason', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-gen-test-'));
  const broken = { ...goodDrill, solution: 'export const total = () => 0;\nexport const count = xs => xs.length;\n' };
  const fake = fakeClient([JSON.stringify(broken), JSON.stringify(goodDrill)]);
  setClientForTests(fake);
  const made = await generateDrill(context(dir), { parent, existing: '', target: '' });
  assert.equal(made.attempts, 2);
  const retry = fake.requests[1].messages;
  assert.equal(retry.length, 3);
  assert.equal(retry[1].role, 'assistant');
  assert.match(retry[2].content, /solution does not pass the tests/);
  assert.match(retry[2].content, /FAILED total adds numbers/);
  setClientForTests(null);
});

test('generateDrill: gives up after two bad drills; tests that check nothing are rejected', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-gen-test-'));
  const toothless = { ...goodDrill, starter: goodDrill.solution };
  setClientForTests(fakeClient([JSON.stringify(toothless), 'not json']));
  await assert.rejects(generateDrill(context(dir), { parent, existing: '', target: '' }), /couldn't produce a drill/);
  assert.ok(!fs.existsSync(path.join(dir, 'lessons')));
  setClientForTests(null);
});

test('drillTarget summarises the learner\'s difficulties with this lesson', () => {
  const lessons = [{ id: parent.id, title: parent.title, concepts: parent.concepts, kind: 'core', for: null }];
  const ev = (kind, payload) => ({ ts: '2026-10-01T09:00:00.000Z', lesson_id: parent.id, kind, payload });
  const events = [ev('fail', { passed: 1, total: 3, failing: ['average of an empty array is null'], errors: [] }),
    ev('fail', { passed: 1, total: 3, failing: ['average of an empty array is null'], errors: [] })];
  const profile = buildProfile('nodejs', lessons, events, '2026-10-01T10:00:00.000Z');
  const target = drillTarget(profile, parent, events, [parent.id]);
  assert.match(target, /2 runs, not solved yet/);
  assert.match(target, /average of an empty array is null ×2/);
  assert.match(target, /arrays 0\.20/);
  assert.equal(describeResult(null), 'Not run yet.');
});

/** A reply in visual-schema.json's shape: every field present, "" and 0 meaning "not set". */
function traceReply({ call = "greeting('Sam')", prints = 'Hello Sam', arrowTo = 'r', line = 2 } = {}) {
  const box = (id, inn, title, value, state = '') => ({ id, in: inn, title, value, tag: '', sub: '', state });
  const step = (line, say, set, arrows = [], extra = {}) => ({ line, say, rule: '', error: '', set, drop: [], arrows, ...extra });
  return JSON.stringify({
    title: 'What your greeting() does with "Sam"',
    intro: 'Watch the text being built.',
    regions: [{ id: 'fn', label: 'Inside greeting(name)', kind: '' }, { id: 'out', label: 'Console', kind: 'output' }],
    scenario: {
      name: 'Your code with "Sam"',
      code: "export function greeting(name) {\n  return 'Hello ' + name;\n}\nconsole.log(greeting('Sam'));",
      steps: [
        step(4, 'The test calls greeting("Sam").', [box('n', 'fn', 'name', '"Sam"', 'active')]),
        step(line, 'Your code joins "Hello " and the name: no comma, no "!".', [box('r', 'fn', 'result', '"Hello Sam"', 'bad')], [{ from: 'n', to: arrowTo, label: '+', state: 'bad', style: '' }]),
        step(0, 'The test wanted "Hello, Sam!".', [box('o', 'out', '', 'Hello Sam')], [], { error: 'Expected "Hello, Sam!", got "Hello Sam"', rule: 'Template literals: `Hello, ${name}!`' }),
      ],
    },
    check: { call, prints },
  });
}

test('visualizeRun: the trace is checked on the real code, and a wrong claim is sent back once', async () => {
  const lesson = loadLesson(path.join(ROOT, 'test-fixtures', 'lessons'), '01-first-function');
  const code = "export function greeting(name) {\n  return 'Hello ' + name;\n}\n";
  const result = await runLesson(lesson, code);
  const client = fakeClient([traceReply({ prints: 'Hello, Sam!' }), traceReply()]);
  setClientForTests(client);
  try {
    const made = await visualizeRun(context(os.tmpdir()), { title: lesson.meta.title, lesson: lesson.body, file: lesson.file, code, result });
    assert.equal(made.attempts, 2);
    assert.deepEqual(made.verified, { call: "greeting('Sam')", prints: 'Hello Sam' });
    const sc = made.visual.scenarios[0];
    assert.equal(sc.group, 'Your code');
    assert.equal(sc.steps.length, 3);
    assert.equal(sc.steps[2].line, undefined, 'line 0 means no line');
    assert.equal(sc.steps[0].rule, undefined, 'empty strings are dropped');
    assert.deepEqual(sc.steps[0].set[0], { id: 'n', in: 'fn', title: 'name', value: '"Sam"', state: 'active' });
    assert.equal(made.visual.regions[0].kind, undefined);

    const [first, retry] = client.requests;
    assert.equal(first.model, MODEL);
    assert.equal(first.output_config.effort, 'medium');
    assert.equal(first.output_config.format.type, 'json_schema');
    assert.ok(first.output_config.format.schema.properties.check);
    const prompt = first.messages[0].content;
    assert.ok(prompt.includes("return 'Hello ' + name;") && prompt.includes('FAILED'), 'sends their code and the failing tests');
    assert.ok(!prompt.includes('```visual'), 'the lesson text is sent without its visual blocks');
    const sentBack = retry.messages.at(-1).content;
    assert.ok(sentBack.includes('really printed') && sentBack.includes('Hello Sam'), sentBack);
  } finally {
    setClientForTests(null);
  }
});

test('visualizeRun: a visual the player cannot show is never returned', async () => {
  const client = fakeClient([traceReply({ arrowTo: 'nowhere' }), traceReply({ line: 9 })]);
  setClientForTests(client);
  try {
    await assert.rejects(
      visualizeRun(context(os.tmpdir()), { title: 'T', lesson: '# L', file: 'exercise.js', code: "export function greeting(name) {\n  return 'Hello ' + name;\n}\n", result: null }),
      e => e instanceof TutorError && /couldn't trace/.test(e.message),
    );
    assert.match(client.requests[1].messages.at(-1).content, /arrow n → nowhere points at a missing box/);
  } finally {
    setClientForTests(null);
  }
});

test('visualizeRun: code that does not load is traced to its real error', async () => {
  const client = fakeClient([traceReply({ call: '', prints: 'SyntaxError' })]);
  setClientForTests(client);
  try {
    const made = await visualizeRun(context(os.tmpdir()), { title: 'T', lesson: '# L', file: 'exercise.js', code: 'export function greeting(name) {\n  return name +;\n}\n', result: null });
    assert.deepEqual(made.verified, { call: '', prints: 'SyntaxError' });
  } finally {
    setClientForTests(null);
  }
});

test('toVisual turns the schema answer into a spec visual.js can play', () => {
  const v = toVisual(JSON.parse(traceReply()));
  assert.deepEqual(Object.keys(v), ['title', 'intro', 'regions', 'scenarios']);
  assert.deepEqual(v.regions, [{ id: 'fn', label: 'Inside greeting(name)' }, { id: 'out', label: 'Console', kind: 'output' }]);
  assert.deepEqual(v.scenarios[0].steps[1].arrows, [{ from: 'n', to: 'r', label: '+', state: 'bad' }]);
});

test('.env wins over an old key in the shell, and a rejected key is explained without revealing it', () => {
  const saved = { key: process.env.ANTHROPIC_API_KEY, base: process.env.ANTHROPIC_BASE_URL };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-env-'));
  try {
    delete process.env.ANTHROPIC_BASE_URL;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-oat01-old-shell-token-xyz';
    assert.match(keyProblem('invalid x-api-key'), /your shell environment \(not \.env\).*subscription login token/);

    const real = 'sk-ant-api03-' + 'A'.repeat(80) + 'Wxyz';
    fs.writeFileSync(path.join(dir, '.env'), `# my key\nANTHROPIC_API_KEY="${real}"\n`);
    loadEnvFile(path.join(dir, '.env'));
    assert.equal(process.env.ANTHROPIC_API_KEY, real);
    const msg = keyProblem('invalid x-api-key');
    assert.match(msg, /rejected \("invalid x-api-key"\)\. The app used the key from \.env: sk-ant-api03…Wxyz \(97 characters\)\./);
    assert.ok(!msg.includes('A'.repeat(10)), 'never shows the key');
    assert.match(msg, /console\.anthropic\.com/);

    process.env.ANTHROPIC_BASE_URL = 'http://localhost:9999';
    assert.match(keyProblem(''), /Requests go to http:\/\/localhost:9999 \(ANTHROPIC_BASE_URL in your shell\)/);
  } finally {
    for (const [k, v] of [['ANTHROPIC_API_KEY', saved.key], ['ANTHROPIC_BASE_URL', saved.base]]) if (v === undefined) delete process.env[k]; else process.env[k] = v;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
