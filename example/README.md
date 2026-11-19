# The example — a strong starting point for testing the gate

A self-contained, self-verifying walkthrough of eospec, built on the
**`micro` schema** — the zero-bureaucracy loop this package ships: one
change, one `plan.md`, one human approve before code.

The walk is three words: `eospec new`, `eospec approve` at the gate,
`eospec close` after your hands-on pass.

| law | what enforces it |
|---|---|
| one plan | `artifacts: [plan]` — `generates: plan.md`, the whole mini-iteration |
| sections at birth | `x-sections: [Goal, Questions & Decisions, Tasks, Verification]` |
| the docs→code boundary | `x-unlocks: [writes]` — approve opens coding |
| completion | `x-completes: approved` — one grant completes the schema |
| the human's act | `x-verdict-line: Hands-on validation` — untickable by the agent |

Plus schema-level `x-declares: [start the spec, skip the spec]` — two
doors: "start the spec" runs the ceremony (create, aim, draft — that
part needs no phrase); "skip the spec" lands exactly one mutation as
declared work, even behind a draft wall.

The states are derived, never stored: **draft** (source locked, plan
free) → **coding** (receipts flow to `.ledger`) → **verifying** (all
tasks ticked: source re-locks, verification commands pass) → your
hands-on pass → **close** archives immediately. Optional slice pausing:
`slice-gates: true` in the plan, `eospec approve` advances, `--all`
unlocks all.

```sh
./example/try.sh        # the self-verifying walkthrough
```

See [VALIDATION.md](VALIDATION.md) for the prompt-by-prompt live
validation, and the repo README for the full law.
