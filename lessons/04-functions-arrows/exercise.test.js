import { test } from 'node:test';
import assert from 'node:assert/strict';
import { area, toSeconds } from './exercise.js';

test('area multiplies width and height', () => {
  assert.equal(area(3, 4), 12);
});

test('area of a line is zero', () => {
  assert.equal(area(5, 0), 0);
});

test('two minutes are 120 seconds', () => {
  assert.equal(toSeconds(2), 120);
});
