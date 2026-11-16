import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { readBody, start } from '../server.mjs';

test('a character split across chunks survives', async () => {
  const req = new PassThrough();
  const bytes = Buffer.from('{"name":"José"}');
  const cut = bytes.indexOf(0xc3) + 1; // inside "é"
  const p = readBody(req);
  req.write(bytes.subarray(0, cut));
  req.end(bytes.subarray(cut));
  assert.equal(JSON.parse(await p).name, 'José');
});

test('a body over 100 KB gets a 400, not a reset', async () => {
  const server = await start({ port: 0, dbPath: ':memory:' });
  const url = `http://localhost:${server.address().port}`;
  const res = await fetch(`${url}/api/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'x'.repeat(200_000),
  });
  assert.equal(res.status, 400);
  server.close();
});
