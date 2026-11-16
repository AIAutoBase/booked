import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../server.mjs';

let server, base;
before(async () => {
  server = await start({ port: 0, dbPath: ':memory:' });
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const slots = async (date) =>
  (await fetch(`${base}/api/slots?date=${date}`)).json();

const book = (body) => fetch(`${base}/api/bookings`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const ana = (slotId) =>
  ({ slotId, name: 'Ana', email: 'ana@example.com' });

test('lists eight free hourly slots for a date', async () => {
  const res = await fetch(`${base}/api/slots?date=2027-01-04`);
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.equal(list.length, 8);
  assert.deepEqual(list[0], {
    id: '2027-01-04T09',
    start: '09:00',
    end: '10:00',
    booked: false,
  });
});

test('invalid date is rejected', async () => {
  const res = await fetch(`${base}/api/slots?date=2027-02-30`);
  assert.equal(res.status, 400);
});

test('booking a free slot returns 201', async () => {
  const res = await book(ana('2027-01-05T10'));
  assert.equal(res.status, 201);
  assert.ok((await res.json()).id);
  const s = (await slots('2027-01-05'))
    .find((x) => x.id === '2027-01-05T10');
  assert.equal(s.booked, true);
});

test('booking the same slot twice returns 409', async () => {
  assert.equal((await book(ana('2027-01-06T11'))).status, 201);
  assert.equal((await book(ana('2027-01-06T11'))).status, 409);
});

test('missing or invalid fields return 400', async () => {
  const noEmail = { slotId: '2027-01-07T09', name: 'Ana' };
  const badEmail = { ...noEmail, email: 'nope' };
  const badHour = { ...ana('2027-01-07T08') };
  assert.equal((await book(noEmail)).status, 400);
  assert.equal((await book(badEmail)).status, 400);
  assert.equal((await book(badHour)).status, 400);
});

test('a slotId that is not a string returns 400', async () => {
  const res = await book(ana(['2027-01-09T09']));
  assert.equal(res.status, 400);
});

test('cancelling frees the slot', async () => {
  const res = await book(ana('2027-01-08T12'));
  const { id } = await res.json();
  const del = await fetch(`${base}/api/bookings/${id}`,
    { method: 'DELETE' });
  assert.equal(del.status, 204);
  const s = (await slots('2027-01-08'))
    .find((x) => x.id === '2027-01-08T12');
  assert.equal(s.booked, false);
});

test('start rejects when the port is taken', async () => {
  const port = server.address().port;
  await assert.rejects(start({ port, dbPath: ':memory:' }),
    { code: 'EADDRINUSE' });
});

test('cancelling an unknown booking returns 404', async () => {
  const res = await fetch(`${base}/api/bookings/999999`,
    { method: 'DELETE' });
  assert.equal(res.status, 404);
});
