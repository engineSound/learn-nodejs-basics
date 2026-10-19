import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeDeviceNames } from './exercise.js';

const devices = () => [
  { name: 'porch light', status: 'online' },
  { name: 'garage door', status: 'offline' },
  { name: 'attic fan', status: 'online' },
];

test('keeps only online devices, as names', () => {
  assert.deepEqual(activeDeviceNames(devices()).length, 2);
});

test('sorts the names alphabetically', () => {
  assert.deepEqual(activeDeviceNames(devices()), ['attic fan', 'porch light']);
});

test('does not change the array it was given', () => {
  const input = devices();
  activeDeviceNames(input);
  assert.deepEqual(input, devices());
});

test('no devices means no names', () => {
  assert.deepEqual(activeDeviceNames([]), []);
});
