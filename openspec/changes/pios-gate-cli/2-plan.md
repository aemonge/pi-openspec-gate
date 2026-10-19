# Plan: pios-gate — wrapper, patterns, pending

> Estimate: 2–3 h · medium-high confidence
> Evidence: wrapper is thin (dispatch + exec); the risky part is gate
> integration (normalization, touch pattern, stamp timing) — all
> unit-testable without spawning real pi sessions.
> Parent idea: pios-gate-cli (self-parented, human-ruled design)
> Human wait: approve from terminal, then validate the live dogfood
> (`pios-gate approve …` through the new bin after publish).

## Acceptance

- `bin/pios-gate` sh shim + `bin/pios-gate.ts`:
  - `pios-gate approve <slug>` — identical behavior to the old bin's approve
  - `pios-gate confirm <slug>` — the old validate, renamed
  - `pios-gate pending` — lists changes needing the human: slug, status,
    created_by, approved/validated presence, task counts
  - anything else → `exec openspec <argv>` verbatim; exit code propagates;
    reserved verbs never forward (fail loud, not "unknown command")
- `package.json` ships both bins; old bin untouched, still works.
- Classifier: a leading `pios-gate`/`pi-openspec-gate` token normalizes to
  `openspec` before segmentation — `pios-gate list` reads, `pios-gate new
  change x` creations, `pios-gate archive y` mutations classify exactly like
  their bare forms (tests prove each).
- Gate patterns: APPROVAL_TOUCH blocks `pios-gate approve|confirm` (and path
  forms `bin/pios-gate(.ts)`) from assistant bash, byte-exact copy.
- Stamp interplay fixed: witnessing a creation no longer pre-creates the
  change dir; the stamp lands after the call completes (dir exists check),
  so `openspec new` scaffolds cleanly. Test proves no pre-created empty dir.
- README approval section documents the pios-gate surface + confirm rename.
- Full suite + lint green; version 0.3.0 (proposed; ruled at publish).

## Scope

- `bin/pios-gate`, `bin/pios-gate.ts`, `package.json`
- `src/classifier.ts` (normalization), `src/gate.ts` (touch pattern, stamp
  timing), `test/classifier.test.ts`, `test/gate.test.ts`, new
  `test/pios-wrapper.test.ts`, `README.md`

## Exclusions

- No new npm package, no deprecation release (package identity unchanged).
- No ephemeral-subagent delegation (upstream).
- No powershell work beyond what normalization inherits.
- Publish + live dogfood stay the human's terminal acts.
