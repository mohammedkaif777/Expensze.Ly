import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asyncHandler } from '../src/utils/asyncHandler.js';

test('asyncHandler catches rejected promises and passes to next', async () => {
  let nextCalledWith = null;
  const next = (err) => {
    nextCalledWith = err;
  };

  const handler = asyncHandler(async () => {
    throw new Error('boom');
  });

  await handler({}, {}, next);
  assert.equal(nextCalledWith.message, 'boom');
});

test('asyncHandler does not call next on success', async () => {
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const handler = asyncHandler(async (req, res) => {
    res.statusCode = 200;
    res.json({ ok: true });
  });

  await handler({}, { statusCode: 0, json: () => {} }, next);
  assert.equal(nextCalled, false);
});