# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

- [x] Step 1 — Config: parse accountingTools (frozen list, absent = none)
      check: unit + repo-config integration tests · paths: src/config.ts ·
      config.json
- [x] Step 2 — Gate carve-out: allowlisted instruments pass with
      pi-openspec-gate.instrument.v1 fact, before classification
      check: deterministic suite · paths: src/gate.ts · src/facts.ts
- [x] Step 3 — Tests + sweep + jiti smoke load + commit
      check: suite green incl. instrument tests, vocabulary sweep zero ·
      paths: test/instruments.test.ts
- [ ] Step 4 — Human live validation (happy path): focus set → attributed
      writes → receipts in 4-tasks.md · response: — · outcome: —
