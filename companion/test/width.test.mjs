// Gate: every code line fits a 6x9 printed page (64 chars).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const files = [
  ...['server.mjs', 'db.mjs'].map((f) => join(root, f)),
  join(root, 'public', 'index.html'),
  ...readdirSync(join(root, 'test'))
    .map((f) => join(root, 'test', f)),
];

test('no code line is longer than 64 characters', () => {
  const long = files.flatMap((f) =>
    readFileSync(f, 'utf8').split(/\r?\n/)
      .map((line, i) => ({ f, n: i + 1, len: line.length }))
      .filter((l) => l.len > 64));
  assert.deepEqual(long, []);
});
