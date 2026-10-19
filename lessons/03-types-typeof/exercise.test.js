import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPercent, isNumber } from './exercise.js';

test('full scale is one hundred percent', () => {
  assert.equal(toPercent(255), 100);
});

test('halfway rounds to fifty', () => {
  assert.equal(toPercent(128), 50);
});

test('numbers are numbers', () => {
  assert.equal(isNumber(5), true);
  assert.equal(isNumber(-2.5), true);
});

test('strings and NaN are not numbers', () => {
  assert.equal(isNumber('5'), false);
  assert.equal(isNumber(NaN), false);
  assert.equal(isNumber(null), false);
});
