import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting } from './exercise.js';

test('says hello to Sam', () => {
  assert.equal(greeting('Sam'), 'Hello, Sam!');
});

test('works for any name', () => {
  assert.equal(greeting('Ada Lovelace'), 'Hello, Ada Lovelace!');
});

test('returns the text instead of printing it', () => {
  assert.equal(typeof greeting('Sam'), 'string');
});
