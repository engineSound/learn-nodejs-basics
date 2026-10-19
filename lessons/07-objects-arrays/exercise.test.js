import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describe, withDefaults } from './exercise.js';

test('an online device says so', () => {
  assert.equal(describe({ name: 'hall', online: true }), 'hall is online');
});

test('a device without online is offline', () => {
  assert.equal(describe({ name: 'attic' }), 'attic is offline');
});

test('settings override the defaults', () => {
  assert.deepEqual(withDefaults({ interval: 10 }), { unit: 'C', interval: 10 });
});

test('the settings object is not changed', () => {
  const settings = { unit: 'F' };
  withDefaults(settings);
  assert.deepEqual(settings, { unit: 'F' });
});
