// Learning history: an append-only JSON Lines file (format: docs/SHARED-FORMAT.md).
import fs from 'node:fs';
import path from 'node:path';

const MAX_CODE = 64 * 1024;

export function appendEvent(file, event) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const full = {
    ts: new Date().toISOString(),
    track: null,
    lesson_id: null,
    concept: null,
    kind: null,
    duration_ms: null,
    payload: null,
    ...event,
  };
  fs.appendFileSync(file, JSON.stringify(full) + '\n');
  return full;
}

/** All events, oldest first. Lines that aren't valid JSON are skipped. */
export function readEvents(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const events = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { /* a torn last line after a crash */ }
  }
  return events;
}

/** The payload recorded for a test run. */
export function runPayload(result, code) {
  return {
    passed: result.passed,
    failed: result.failed,
    total: result.total,
    failing: result.tests.filter(t => !t.ok).map(t => t.name),
    errors: result.compileErrors.map(e => e.code || e.title),
    timed_out: result.timedOut,
    code: code.length > MAX_CODE ? code.slice(0, MAX_CODE) : code,
  };
}

/** Per-lesson summary shown in the UI. */
export function lessonStats(events, lessonId) {
  const runs = events.filter(e => e.lesson_id === lessonId && (e.kind === 'pass' || e.kind === 'fail'));
  const firstPass = runs.findIndex(e => e.kind === 'pass');
  const last = runs[runs.length - 1];
  return {
    runs: runs.length,
    first_pass_run: firstPass < 0 ? null : firstPass + 1,
    last_result: last ? last.kind : null,
    last_ts: last ? last.ts : null,
    best_passed: runs.reduce((best, e) => Math.max(best, e.payload?.passed ?? 0), 0),
    total: runs.reduce((max, e) => Math.max(max, e.payload?.total ?? 0), 0) || null,
  };
}
