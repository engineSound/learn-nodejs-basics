import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const run = () => execFileSync(process.execPath, ['exercise.js'], { cwd: import.meta.dirname, encoding: 'utf8' }).split('\n').filter(Boolean);

test('the program prints two lines', () => {
  assert.equal(run().length, 2);
});

test('the first line is Hub starting', () => {
  assert.equal(run()[0], 'Hub starting');
});

test('the second line counts devices', () => {
  assert.equal(run()[1], '3 devices online');
});
