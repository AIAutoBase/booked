# Booked — build log

How the companion app was built with the method in Part II. Times are wall-clock.

## 2026-11-15 — Step 0: orchestrator
- Orchestrator (Claude Opus 5.5, main session) wrote the API tests first (`test/api.test.mjs`, 7 tests) and `CONTRACT.md`, then split the work in two: **db** and **api**.
- Red run before any code: `ERR_MODULE_NOT_FOUND server.mjs` — 0/7 pass.

## 2026-11-15 — Step 1: two workers in parallel
- Tried Claude Code's automatic worktree isolation for both workers: refused on Windows because git reported `G:/...` while the session path was `g:\...` (drive-letter case). Fix: created two worktrees by hand (`git worktree add ../book-multi-agent-wt/db -b wt-db`, same for `api`) and gave each worker its absolute path.
- Worker **db** (Claude Sonnet): `db.mjs` + `test/db.test.mjs`, 3/3 pass, ~19 s. Guessed: `created_at` as ISO string; TAKEN detected by matching `/UNIQUE/` in the SQLite error.
- Worker **api** (Claude Sonnet): `server.mjs` + `public/index.html`, 7/7 pass against its own throwaway stand-in db, ~61 s. Guessed: path traversal → 404; body over 100 KB cut off; non-numeric id → 404.
- Both workers admitted a weak red run: each saw the tests fail only on a missing import, not on behavior.
- Merge: no conflicts (the contract kept them in separate files). Real db + real server together: **10/10 pass** on first run.
- Next: Codex reviews the merged code without being told what to look for.

## 2026-11-15 — Step 2: independent review
- Reviewer: OpenAI Codex CLI 0.167.0, `codex exec -s read-only`, told only "report real defects against CONTRACT.md", not what to expect. 148 s.
- Found 2 important defects, both confirmed by reading the code:
  1. The page kept the previous date's slot buttons when loading a new date failed, so a click could book the wrong day. Fix: clear the list before fetching; catch network errors.
  2. `start()` never rejected when the port was taken (`EADDRINUSE` became an uncaught error). Fix: reject on the server's `error` event. New test `start rejects when the port is already in use` failed first, then passed.
- Neither defect was caught by the two workers' own tests, the tests written first, or the merge run (10/10 green).
- Suite after fixes: 11/11.

## 2026-11-15 — Step 3: by hand
- Opened the page in a browser, booked 09:00 on 2027-03-01: shows "Booked!" and the slot turns "taken". A name with HTML tags was stored as text.
- Gotcha found writing the README: `node --test companion/test/` (bare folder) fails on Node 26; the quoted glob `node --test "companion/test/*.test.mjs"` works in bash, PowerShell and cmd.
## 2026-11-15 — Step 4: findings while writing Part II
- **Second Codex review** (while drafting ch 7; Codex 0.169.0, same prompt as Step 2, on a copy without this log or the briefs): 174 s, 53,529 tokens, 2 minor defects in the page — no message when the booking request fails on the network; any error other than "taken" is shown as "check your name and email". **Left in on purpose** as the ch 7 exercise (see README, "Known defects").
- **Unchecked rule** (found while drafting ch 9): the 64-character line limit was in both worker briefs, but nothing enforced it, and the orchestrator's own `test/api.test.mjs` had 15 lines over it. Fixed: test file rewrapped; new gate `test/width.test.mjs` failed first (2 lines left), then passed.
- **Reverse review** (while drafting ch 10, Claude as reviewer of a Codex-reviewed copy): `POST /api/bookings` with `slotId` sent as an array (`["2027-01-04T09"]`) returned 500 instead of 400 — the regex turned the array into a string, validation passed, SQLite then failed. Fix: `validSlot` rejects non-strings. New test `a slotId that is not a string returns 400` failed first, then passed.
- Suite: 13/13 companion tests (29/29 with the manuscript checker).
## 2026-11-15 — Step 5: findings while writing Part III
- **Claude Code reviewer subagent** (ch 11, `claude --agent reviewer`, Sonnet, $0.133): two server defects no test caught, both confirmed by a probe script: (1) a body over 100 KB reset the connection instead of answering 400; (2) a name like "José" sent in two TCP writes was stored as `Jos��` — each chunk was decoded to text on its own, splitting the bytes of "é". Fix: `readBody` collects bytes and decodes once; over 100 KB it keeps draining and then rejects, so the handler answers 400. New tests in `test/body.test.mjs` failed first (missing export), then passed.
- **Codex review of a new feature** (ch 12, on a scratch copy taken before the fix above, when the suite was 13/13, with the ch 5 "list my bookings by email" route): both `codex review --uncommitted` (93 s) and `codex exec -s read-only` (76 s) flagged that anyone who knows an email can list — and then cancel — that person's bookings. Neither noticed the change shipped with no tests. That route lives only in the chapter's scratch copy, not in this repo.
- Suite: 15/15 companion tests (31/31 with the manuscript checker).
