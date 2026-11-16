# Booked — contract between the parts

Both workers build against this file. Do not change it without the orchestrator.

## Rules
- Node 22+ built-ins only. No npm dependencies. ES modules (`.mjs`).
- A date is `YYYY-MM-DD` and must be a real calendar date (2027-02-30 is invalid).
- Each date has 8 one-hour slots, 09:00–17:00. Slot id: `<date>T<HH>` with HH 09..16, e.g. `2027-01-04T09`.

## `companion/db.mjs` (worker: db)
```
openDb(path: string) -> Db          // ':memory:' allowed; creates tables if missing
db.bookedSlotIds(date: string) -> Set<string>
db.book(slotId, name, email) -> number   // new booking id
   // throws Error with err.code === 'TAKEN' when the slot is already booked
   // (enforced by a UNIQUE constraint on slot_id, not by a pre-check)
db.cancel(id: number) -> boolean    // true if a row was deleted
```
Table `bookings(id INTEGER PRIMARY KEY, slot_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL)`. Uses `node:sqlite` (`DatabaseSync`).

## `companion/server.mjs` + `companion/public/index.html` (worker: api)
```
export async function start({ port, dbPath }) -> http.Server   // resolves once listening
```
- `node companion/server.mjs` runs `start({ port: Number(process.env.PORT) || 3000, dbPath: 'booked.db' })`.
- `GET /api/slots?date=` → 200 `[{id, start:'HH:00', end:'HH:00', booked}]` · 400 bad date.
- `POST /api/bookings` JSON `{slotId, name, email}` → 201 `{id}` · 400 invalid/missing field (slotId must be a valid slot id, name 1–100 chars, email `x@y.z`) · 409 slot taken.
- `DELETE /api/bookings/:id` → 204 · 404.
- Any other path: serve files from `companion/public/`; unknown → 404.
- `index.html`: date picker, list of slots, a form (name, email) to book a free slot, plain JS `fetch`, no framework.

Tests that define "done": `node --test companion/test/*.test.mjs`.
