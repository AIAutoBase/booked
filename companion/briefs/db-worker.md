<!-- Exact brief given to the db worker (Claude Sonnet), 2026-11-15, second attempt after automatic worktree isolation was refused. -->
You are the **db** worker on a small app called Booked. Work ONLY inside the git worktree `G:/AI/Claude-Code/book-multi-agent-wt/db` (branch `wt-db`). Use absolute paths or `cd` there first. Never edit files under `G:/AI/Claude-Code/book-multi-agent/` (the main checkout). Another worker builds `companion/server.mjs` at the same time in another worktree — do not create or touch that file or `companion/public/`.

Read `companion/CONTRACT.md`; it is the spec. Build exactly the `companion/db.mjs` part.

1. Write `companion/test/db.test.mjs` first (node:test, `openDb(':memory:')`) covering: booking returns an id; the booked id shows in `bookedSlotIds(date)` and only for that date; booking the same slot twice throws with `code === 'TAKEN'`; `cancel` returns true and frees the slot; cancel of an unknown id returns false. Run `node --test companion/test/db.test.mjs` — confirm it FAILS (no db.mjs yet).
2. Write `companion/db.mjs` with `node:sqlite` `DatabaseSync`. Small and boring. Detect the taken slot from the UNIQUE constraint error, not with a SELECT first.
3. Code lines ≤ 64 characters (it is printed in a 6x9 book).
4. Run the test again — confirm PASS.
5. Commit in the worktree: `git add companion/db.mjs companion/test/db.test.mjs && git commit -m "feat(companion): db module"` with a final message line `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`.

Reply in under 120 words: commit hash, test result, and anything in the contract that was unclear or that you had to guess.
