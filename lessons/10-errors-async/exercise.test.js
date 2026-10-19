import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, safeLevel } from './exercise.js';

test('a whole number parses', () => {
  assert.equal(parseLevel('42'), 42);
});

test('text that is not a whole number throws with the text in the message', () => {
  assert.throws(() => parseLevel('lots'), { message: 'bad level: lots' });
  assert.throws(() => parseLevel('4.5'), { message: 'bad level: 4.5' });
});

test('safeLevel awaits the reading and parses it', async () => {
  assert.equal(await safeLevel(async () => '7'), 7);
});

test('safeLevel returns -1 when parsing fails', async () => {
  assert.equal(await safeLevel(async () => 'x'), -1);
});

test('safeLevel returns -1 when reading fails', async () => {
  assert.equal(await safeLevel(async () => { throw new Error('offline'); }), -1);
});
