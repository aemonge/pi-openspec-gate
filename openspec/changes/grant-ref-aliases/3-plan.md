# Plan

> Spec: grant-ref-aliases · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

70–115 changed lines across three files. Slice 1 (aliases): 40–70 — `bin/gate-lib.js` (+~14: resolver + canonicalization), `bin/pios-gate.js` (~4: wording), `test/pios-wrapper.test.ts` (+~30: one test). Slice 2 (teaching): +30–45 — grant echo suffix, the `act` command, tests; the act line is an extraction of what `showReport`/`pendingReport` already compute, not new truth. Confidence: high — every consumer surface was read end-to-end during investigate; no mirror-contract files touched.

## Skills

bare — the change is plain-JS CLI surgery in this repo's own law; no sanctioned skill covers it (the installed skills target Rust, Python, and data work).

## Workflow

Route: direct into `bin/gate-lib.js` — the investigate Options winner (canonicalize in `grantArtifact` via `artifactForRef`), extended by human ruling 2026-11-10 with the teaching slice: the gate names the next act at its own transitions, and `act` exposes it for renderers to relay (stardeck renders placement, never truth). Teaching lines derive at read time, never stored — counters stay the only truth. None of Investigate's Alternatives was picked: CLI-layer resolver lost (duplicates the law across four grant surfaces — drift risk), stardeck truth-rendering lost (different package, its own future change), gate auto-advance of session focus lost (impossible by law — grants are terminal-only, no session channel).

## Slices

### Slice 1 — the alias law, its wording, its proof

- [ ] `artifactForRef(schema, ref)` in `bin/gate-lib.js` — exact word id first, then 1-based row (`^\d+$`), then `generates` stem or with `.md` (suffix match)
      started_at: · ended_at: · total: · check: · paths:
- [ ] canonicalize at the top of `grantArtifact` — bare refs and the artifact half of `artifact/section` paths — before any matching or stamping
      started_at: · ended_at: · total: · check: · paths:
- [ ] wording states the forms: both grant usage lines, the help block, the doc comment
      started_at: · ended_at: · total: · check: · paths:
- [ ] wrapper test: row number and filename stamp canonical ids; unknown row stays loud (`no artifact '9'`); alias of an already-granted artifact hits the canonical already-granted branch
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] fix(cli): grant reads the refs the cockpit prints
        hash:

### Slice 2 — the gate teaches at every transition

- [ ] extract the per-change next-act computation in `gate-lib.js` into one helper reused by `showReport` and `pendingReport` — no third copy
      started_at: · ended_at: · total: · check: · paths:
- [ ] grant success echo carries the act while the change is incomplete: `granted <slug> · <artifact> · at <ts> · next: <act line>`; the completed echo keeps its line and adds the verdict teaching when a verdict line is declared
      started_at: · ended_at: · total: · check: · paths:
- [ ] `pios-gate act <slug>` — one line, the act; gate-owned verb (never passthrough); unknown change exits 2
      started_at: · ended_at: · total: · check: · paths:
- [ ] wrapper tests: echo suffix mid-flow, act output mid-flow and completed, act on unknown change, act never forwards
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(cli): the gate names the next act at every transition
        hash:

## Verification

Deterministic: `just lint` (vocabulary law holds) · `npm test` (wrapper suite green, grants never forward to openspec) · stamped meta reads `granted_plan:` — word-id-shaped, no raw alias key · `node bin/pios-gate.js act grant-ref-aliases` prints the pending act in one line. The one human-only act: from the repo bin, `pios-gate grant grant-ref-aliases 3` — the row-number form stamps plan on this very change, and `inspect` shows `plan ✓`.

## History

<!-- commit subject lands after the slice commits -->
