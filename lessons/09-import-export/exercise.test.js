import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as exercise from './exercise.js';

test('the hub converts and rounds a reading', () => {
  assert.equal(exercise.hubReading(21.3), 70.3);
});

test('freezing is 32 degrees', () => {
  assert.equal(exercise.hubReading(0), 32);
});

test('the unit is exported', () => {
  assert.equal(exercise.UNIT, '°F');
});
