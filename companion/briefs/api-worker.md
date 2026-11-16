<!-- Exact brief given to the api worker (Claude Sonnet), 2026-11-15, second attempt after automatic worktree isolation was refused. -->
You are the **api** worker on a small app called Booked. Work ONLY inside the git worktree `G:/AI/Claude-Code/book-multi-agent-wt/api` (branch `wt-api`). Use absolute paths or `cd` there first. Never edit files under `G:/AI/Claude-Code/book-multi-agent/` (the main checkout). Another worker builds `companion/db.mjs` at the same time in another worktree, so it does not exist in yours.

Read `companion/CONTRACT.md`; it is the spec. Build `companion/server.mjs` and `companion/public/index.html` exactly as described. Import the db as `import { openDb } from './db.mjs'` and use only the db functions in the contract.

1. To run tests in your worktree, write a throwaway in-memory stand-in `companion/db.mjs` that follows the contract (including throwing `code: 'TAKEN'`). **Do not commit it.**
2. Run `node --test companion/test/api.test.mjs` (tests already exist — do not edit them). Confirm they FAIL first.
3. Write `companion/server.mjs` with `node:http` only. All input validation lives here: real calendar dates, slot hour 09–16, name 1–100 chars, a simple email pattern, invalid JSON → 400. Map the `TAKEN` error → 409. Serve static files from `public/` and refuse path traversal (`/../` must not escape `public`).
4. Write `companion/public/index.html`: plain HTML+JS, no framework, date picker, slot list, booking form; escape user-entered text before inserting it into the page.
5. Code lines ≤ 64 characters (printed in a 6x9 book).
6. Run the API tests — confirm PASS against your stand-in.
7. Delete the stand-in, then commit only `server.mjs` and `public/index.html`: `git commit -m "feat(companion): api server and page"` with a final line `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`.

Reply in under 120 words: commit hash, test result, and anything in the contract that was unclear or that you had to guess.
