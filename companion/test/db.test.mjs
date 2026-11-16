import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../db.mjs';

const S = '2027-01-04T09';

test('book returns an id, shown only for its date', () => {
  const db = openDb(':memory:');
  const id = db.book(S, 'Ann', 'a@b.co');
  assert.equal(typeof id, 'number');
  assert.ok(db.bookedSlotIds('2027-01-04').has(S));
  assert.equal(db.bookedSlotIds('2027-01-05').size, 0);
});

test('same slot twice throws TAKEN', () => {
  const db = openDb(':memory:');
  db.book(S, 'Ann', 'a@b.co');
  assert.throws(() => db.book(S, 'Bo', 'b@b.co'),
    (e) => e.code === 'TAKEN');
});

test('cancel frees the slot; unknown id is false', () => {
  const db = openDb(':memory:');
  const id = db.book(S, 'Ann', 'a@b.co');
  assert.equal(db.cancel(id), true);
  assert.equal(db.bookedSlotIds('2027-01-04').size, 0);
  assert.equal(db.cancel(999), false);
  assert.equal(typeof db.book(S, 'Bo', 'b@b.co'), 'number');
});
