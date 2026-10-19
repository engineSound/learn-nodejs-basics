// Runs a lesson's tests against the learner's code in a throwaway copy of the lesson.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const TIMEOUT_MS = 10_000;
const MAX_OUTPUT = 200_000;

export async function runLesson(lesson, code) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-node-'));
  try {
    fs.cpSync(lesson.dir, tmp, { recursive: true });
    const pkg = path.join(tmp, 'package.json');
    if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, '{"type":"module"}\n');
    fs.writeFileSync(path.join(tmp, lesson.file), code);

    const started = Date.now();
    const { output, timedOut } = await exec(process.execPath, ['--test', '--test-reporter=tap'], tmp);
    const clean = output.split(tmp + path.sep).join('').split(tmp).join('.');
    return summarize(parseTap(clean), clean, Date.now() - started, timedOut);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function exec(cmd, args, cwd, timeoutMs = TIMEOUT_MS) {
  return new Promise(resolve => {
    // NODE_TEST_CONTEXT would make a nested `node --test` report to a parent runner instead of printing TAP.
    const { NODE_TEST_CONTEXT, NODE_OPTIONS, ...env } = process.env;
    const child = spawn(cmd, args, { cwd, env });
    let output = '';
    let timedOut = false;
    const add = chunk => { if (output.length < MAX_OUTPUT) output += chunk; };
    child.stdout.on('data', add);
    child.stderr.on('data', add);
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.on('close', exitCode => { clearTimeout(timer); resolve({ output, timedOut, exitCode }); });
  });
}

/** Parse top-level results from `node --test --test-reporter=tap`. */
export function parseTap(text) {
  const tests = [];
  let cur = null;
  let yaml = null;
  for (const line of text.split(/\r?\n/)) {
    const m = /^(not ok|ok) \d+ - (.*?)(\s+#\s*(SKIP|TODO).*)?$/.exec(line);
    if (m) {
      cur = { name: m[2], ok: m[1] === 'ok', message: '' };
      tests.push(cur);
      yaml = null;
    } else if (cur && line === '  ---') {
      yaml = [];
    } else if (cur && yaml && line === '  ...') {
      cur.message = yamlField(yaml, 'error') ?? '';
      if (!cur.ok) {
        const expected = yamlField(yaml, 'expected');
        const actual = yamlField(yaml, 'actual');
        if (expected !== null || actual !== null) { cur.expected = expected ?? ''; cur.actual = actual ?? ''; }
      }
      yaml = null;
    } else if (yaml) {
      yaml.push(line);
    }
  }
  return tests;
}

/** One field of the TAP YAML block, as display text (single-line or indented block). */
function yamlField(lines, name) {
  const i = lines.findIndex(l => l.startsWith(`  ${name}:`));
  if (i < 0) return null;
  const value = lines[i].slice(`  ${name}:`.length).trim();
  if (value && value !== '|-' && value !== '|') {
    // Single-quoted YAML strings are JavaScript strings: show them with double quotes.
    const quoted = /^'(.*)'$/.exec(value);
    return quoted ? JSON.stringify(quoted[1].replace(/''/g, "'")) : value;
  }
  const out = [];
  for (const l of lines.slice(i + 1)) {
    if (!l.startsWith('    ') && l.trim() !== '') break;
    out.push(l.slice(4));
  }
  return out.join('\n').trim();
}

/** Run a small example from a lesson (```run blocks) as an ES module, with a short timeout. */
export async function runSnippet(code) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-snippet-'));
  try {
    const file = path.join(tmp, 'snippet.mjs');
    fs.writeFileSync(file, code);
    const { output, timedOut, exitCode } = await exec(process.execPath, [file], tmp, 5_000);
    const clean = output.split(file).join('snippet.mjs');
    return { output: clean, ok: exitCode === 0 && !timedOut, errors: [], timedOut };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function summarize(tests, output, durationMs, timedOut) {
  // A failing "test" named after a test file means the file didn't load (syntax error etc).
  const compileErrors = tests
    .filter(t => !t.ok && /\.test\.[cm]?js$/.test(t.name))
    .map(t => ({ code: null, title: 'Your code doesn’t load', message: t.message || output.slice(0, 4000) }));
  const real = tests.filter(t => !/\.test\.[cm]?js$/.test(t.name));
  const passed = real.filter(t => t.ok).length;
  return {
    passed,
    failed: real.length - passed,
    total: real.length,
    tests: real,
    compileErrors,
    timedOut,
    durationMs,
    output: output.trim(),
  };
}
