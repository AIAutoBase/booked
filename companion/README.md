# Booked

The companion app for *Mastering Multi-Agent Workflows* by Hector M Diaz.

A small booking app: pick a date, choose a free one-hour slot, book it.
It was built with the method the book teaches: tests and a contract first, two
agents working in parallel in separate git worktrees, then an independent
review by a second tool. `BUILD-LOG.md` records every step, including what
went wrong.

## Run it

Needs Node.js 22 or newer. No packages to install. Same on Windows, macOS and Linux.

```
node companion/server.mjs        # http://localhost:3000
node --test "companion/test/*.test.mjs"   # run the tests
```

Set `PORT` to use another port.

## Known defects (left in on purpose)

Chapter 7 asks you to find these with a reviewer agent before you read on:

1. The booking form shows no message when the request fails on the network.
2. Any server error other than "slot taken" is shown as "check your name and email".
