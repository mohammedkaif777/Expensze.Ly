import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from '../src/utils/constants.js';

test('DEFAULT_CATEGORIES contains expected categories', () => {
  assert.ok(DEFAULT_CATEGORIES.includes('Food'));
  assert.ok(DEFAULT_CATEGORIES.includes('Housing'));
  assert.ok(DEFAULT_CATEGORIES.includes('Subscriptions'));
  assert.ok(DEFAULT_CATEGORIES.length >= 11);
});

test('DEFAULT_CATEGORIES has no duplicates', () => {
  const unique = new Set(DEFAULT_CATEGORIES);
  assert.equal(unique.size, DEFAULT_CATEGORIES.length);
});