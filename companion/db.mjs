import { DatabaseSync } from 'node:sqlite';

export function openDb(path) {
  const d = new DatabaseSync(path);
  d.exec(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY,
    slot_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL)`);
  const ins = d.prepare(
    'INSERT INTO bookings (slot_id,name,email,created_at)'
    + ' VALUES (?,?,?,?)');
  const day = d.prepare(
    'SELECT slot_id FROM bookings WHERE slot_id LIKE ?');
  const del = d.prepare('DELETE FROM bookings WHERE id = ?');
  return {
    bookedSlotIds(date) {
      const rows = day.all(date + 'T%');
      return new Set(rows.map((r) => r.slot_id));
    },
    book(slotId, name, email) {
      try {
        const now = new Date().toISOString();
        const r = ins.run(slotId, name, email, now);
        return Number(r.lastInsertRowid);
      } catch (e) {
        if (/UNIQUE/.test(e.message)) {
          const t = new Error('slot taken');
          t.code = 'TAKEN';
          throw t;
        }
        throw e;
      }
    },
    cancel(id) {
      return del.run(id).changes > 0;
    },
  };
}
