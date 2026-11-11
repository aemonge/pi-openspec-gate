# Execute

> Spec: grant-ref-aliases · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — the alias law, its wording, its proof

- [x] `artifactForRef(schema, ref)` in `bin/gate-lib.js` — exact word id first, then 1-based row (`^\d+$`), then `generates` stem or with `.md` (suffix match)
      started_at: 2026-11-10T08:40:12Z · ended_at: 2026-11-10T08:41:05Z · total: 1m · check: ✓ · paths: bin/gate-lib.js
- [x] canonicalize at the top of `grantArtifact` — bare refs and the artifact half of `artifact/section` paths — before any matching or stamping
      started_at: 2026-11-10T08:41:05Z · ended_at: 2026-11-10T08:41:30Z · total: <1m · check: ✓ · paths: bin/gate-lib.js
- [x] wording states the forms: both grant usage lines, the help block, the doc comment
      started_at: 2026-11-10T08:42:20Z · ended_at: 2026-11-10T08:43:10Z · total: 1m · check: ✓ · paths: bin/pios-gate.js
- [x] wrapper test: row number and filename stamp canonical ids; unknown row stays loud (`no artifact '9'`); alias of an already-granted artifact hits the canonical already-granted branch
      started_at: 2026-11-10T08:43:40Z · ended_at: 2026-11-10T08:44:30Z · total: 1m · check: ✓ · paths: test/pios-wrapper.test.ts
- [x] `just lint` and `npm test` green
      started_at: 2026-11-10T08:45:50Z · ended_at: 2026-11-10T08:51:23Z · total: 6m · check: ✓ vocabulary law holds · 170 pass (slice-1 tree); first full-suite run caught a real bug — `pendingAct` read pre-stamp meta and re-offered the just-granted artifact; fixed to take the granted set · paths: bin/gate-lib.js, bin/pios-gate.js, test/pios-wrapper.test.ts
  - [x] fix(cli): grant reads the refs the cockpit prints
        hash: fb373b3

## Slice 2 — the gate teaches at every transition

- [x] extract the per-change next-act computation in `gate-lib.js` into one helper reused by `showReport` and `pendingReport` — no third copy
      started_at: 2026-11-10T08:44:00Z · ended_at: 2026-11-10T08:44:45Z · total: 1m · check: ✓ `pendingAct` + `completionLine`, sentence-level parity with the old copies · paths: bin/gate-lib.js
- [x] grant success echo carries the act while the change is incomplete; the completed echo adds the verdict teaching when a verdict line is declared
      started_at: 2026-11-10T08:45:00Z · ended_at: 2026-11-10T08:45:40Z · total: <1m · check: ✓ · paths: bin/gate-lib.js, bin/pios-gate.js
- [x] `pios-gate act <slug>` — one line, the act; gate-owned verb (never passthrough); unknown change exits 2; legacy changes point at approve/confirm; `act` added to RESERVED_WORDS in both mirrors
      started_at: 2026-11-10T08:45:40Z · ended_at: 2026-11-10T08:46:20Z · total: <1m · check: ✓ · paths: bin/pios-gate.js, bin/gate-lib.js, src/schema.ts
- [x] wrapper tests: echo suffix mid-flow, act output mid-flow and completed, act on unknown change, act never forwards
      started_at: 2026-11-10T08:46:30Z · ended_at: 2026-11-10T08:47:10Z · total: 1m · check: ✓ · paths: test/pios-wrapper.test.ts
- [x] `just lint` and `npm test` green
      started_at: 2026-11-10T08:47:20Z · ended_at: 2026-11-10T08:51:35Z · total: 4m · check: ✓ vocabulary law holds · 172 pass, 0 fail · paths: bin/gate-lib.js, bin/pios-gate.js, src/schema.ts, test/pios-wrapper.test.ts
  - [x] feat(cli): the gate names the next act at every transition
        hash: 095d205

<!-- gate receipts land here while work runs; per-Slice H2s mirror the Plan's H3s -->

- receipts:
  - 2026-11-10T08:40:12Z · edit · bin/gate-lib.js · artifactForRef + canonicalization (slice 1)
  - 2026-11-10T08:42:20Z · edit · bin/pios-gate.js · grant usage/help/doc wording (slice 1)
  - 2026-11-10T08:43:40Z · edit · test/pios-wrapper.test.ts · alias test (slice 1)
  - 2026-11-10T08:44:00Z · edit · bin/gate-lib.js · pendingAct/completionLine, echo returns, report rewiring, RESERVED_WORDS (slice 2)
  - 2026-11-10T08:45:00Z · edit · bin/pios-gate.js · doGrant echo, act verb, imports (slice 2)
  - 2026-11-10T08:45:20Z · edit · src/schema.ts · RESERVED_WORDS mirror (slice 2)
  - 2026-11-10T08:46:30Z · edit · test/pios-wrapper.test.ts · teaching tests (slice 2)
  - 2026-11-10T08:45:50Z · bash · just lint, npm test · first run: 2 fail (stale-meta bug + wrong regex) — both fixed
  - 2026-11-10T08:48:10Z · bash · just lint, npm test · 172 pass, 0 fail
  - 2026-11-10T08:50:40Z · bash · just lint, npm test at slice-1 tree · 170 pass, 0 fail
  - 2026-11-10T08:51:23Z · git · commit fb373b3 fix(cli): grant reads the refs the cockpit prints
  - 2026-11-10T08:51:35Z · git · commit 095d205 feat(cli): the gate names the next act at every transition

- [x] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-10T11:53:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T11:53:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:49Z

  gate-attributed · tool: bash · paths: — · at 2026-11-10T12:03:50Z
