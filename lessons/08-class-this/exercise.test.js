import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Thermostat } from './exercise.js';

test('the constructor stores the target', () => {
  assert.equal(new Thermostat(20).target, 20);
});

test('raise adds to the target', () => {
  const t = new Thermostat(20);
  t.raise(1.5);
  assert.equal(t.target, 21.5);
});

test('a reading below the target needs heat', () => {
  const t = new Thermostat(20);
  assert.equal(t.needsHeat(19), true);
  assert.equal(t.needsHeat(20), false);
});
