import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, 'public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

function validSlot(s) {
  if (typeof s !== 'string') return false;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})$/.exec(s);
  return !!m && validDate(m[1]) && m[2] >= '09' && m[2] <= '16';
}

const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function send(res, code, body) {
  const has = body !== undefined;
  const type = { 'content-type': 'application/json' };
  res.writeHead(code, has ? type : {});
  res.end(has ? JSON.stringify(body) : undefined);
}

// Collect raw bytes, decode once: a character split across
// chunks stays whole. Over 100 KB: keep draining, then reject,
// so the caller can still answer 400.
export function readBody(req) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size <= 1e5) parts.push(c);
    });
    req.on('end', () => size > 1e5
      ? reject(new Error('body too large'))
      : resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });
}

function serveFile(res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return send(res, 400, { error: 'bad path' });
  }
  if (rel.includes('\0')) {
    return send(res, 400, { error: 'bad path' });
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(pub, '.' + path.sep + rel);
  if (!file.startsWith(pub + path.sep)) {
    return send(res, 404, { error: 'not found' });
  }
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error: 'not found' });
    const type = types[path.extname(file)]
      || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type });
    res.end(buf);
  });
}

function slotsFor(db, date) {
  const taken = db.bookedSlotIds(date);
  const slots = [];
  for (let h = 9; h <= 16; h++) {
    const hh = String(h).padStart(2, '0');
    const id = `${date}T${hh}`;
    slots.push({
      id,
      start: `${hh}:00`,
      end: `${String(h + 1).padStart(2, '0')}:00`,
      booked: taken.has(id),
    });
  }
  return slots;
}

async function createBooking(db, req, res) {
  let b;
  try {
    b = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: 'bad json' });
  }
  const { slotId, name, email } = b || {};
  if (!validSlot(slotId)
    || typeof name !== 'string'
    || name.length < 1 || name.length > 100
    || typeof email !== 'string' || !validEmail(email)) {
    return send(res, 400, { error: 'invalid fields' });
  }
  try {
    return send(res, 201, { id: db.book(slotId, name, email) });
  } catch (e) {
    if (e.code !== 'TAKEN') throw e;
    return send(res, 409, { error: 'taken' });
  }
}

export async function start({ port, dbPath }) {
  const db = openDb(dbPath);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const p = url.pathname;
      if (req.method === 'GET' && p === '/api/slots') {
        const date = url.searchParams.get('date');
        if (!validDate(date)) {
          return send(res, 400, { error: 'bad date' });
        }
        return send(res, 200, slotsFor(db, date));
      }
      if (req.method === 'POST' && p === '/api/bookings') {
        return await createBooking(db, req, res);
      }
      const m = /^\/api\/bookings\/(\d+)$/.exec(p);
      if (req.method === 'DELETE' && m) {
        return db.cancel(Number(m[1]))
          ? send(res, 204)
          : send(res, 404, { error: 'not found' });
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        return serveFile(res, p);
      }
      send(res, 404, { error: 'not found' });
    } catch (e) {
      send(res, 500, { error: 'server error' });
    }
  });
  await new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(port, ok);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  await start({ port, dbPath: 'booked.db' });
  console.log(`Booked on http://localhost:${port}`);
}
