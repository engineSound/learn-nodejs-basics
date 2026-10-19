import { test } from 'node:test';
import assert from 'node:assert/strict';
import { status, isValid } from './exercise.js';

test('charging wins over everything', () => {
  assert.equal(status(5, true), 'charging');
});

test('under twenty is low', () => {
  assert.equal(status(19, false), 'low');
});

test('a level of zero is low, not ignored', () => {
  assert.equal(status(0, false), 'low');
});

test('only whole numbers from 0 to 100 are valid', () => {
  assert.equal(isValid(0), true);
  assert.equal(isValid(100), true);
  assert.equal(isValid(101), false);
  assert.equal(isValid('50'), false);
  assert.equal(isValid(50.5), false);
});
