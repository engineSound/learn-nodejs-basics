import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumTo, countOver } from './exercise.js';

test('sum to four is ten', () => {
  assert.equal(sumTo(4), 10);
});

test('sum to zero is zero', () => {
  assert.equal(sumTo(0), 0);
});

test('counts readings above the limit', () => {
  assert.equal(countOver([18, 25, 31, 22], 21), 3);
});

test('a reading equal to the limit does not count', () => {
  assert.equal(countOver([21, 21], 21), 0);
});
