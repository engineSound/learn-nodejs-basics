import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalMinutes, countdownLabel } from './exercise.js';

test('two hours fifteen is 135 minutes', () => {
  assert.equal(totalMinutes(2, 15), 135);
});

test('zero hours is just the minutes', () => {
  assert.equal(totalMinutes(0, 7), 7);
});

test('the label puts the number first', () => {
  assert.equal(countdownLabel(30), '30 seconds left');
});
