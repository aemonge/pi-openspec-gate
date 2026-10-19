# Plan: Pin findSessionFile with direct tests

> Estimate: 15–30 min · high confidence
> Evidence: fix + integration test already green since 3cba431; only direct
> unit coverage of the lookup's four outcomes is missing.
> Parent idea: none (self-parented; drift story in 1-idea.md)
> Human wait: approve this change; publish-day live check rides the batch.

## Acceptance

- New `test/focus.test.ts` with tempdir fixtures, repo conventions
  (node:test + assert):
  1. timestamped `<ISO>_<id>.jsonl` resolves;
  2. exact `<id>.jsonl` (legacy/test layout) still resolves;
  3. wrong sessionId → undefined;
  4. missing/nonexistent sessions root → undefined (fail-open).
- Existing integration test (`gate.test.ts` inherit case) untouched and
  green — it remains the chain-level proof.
- `just test` green (57 + new).
- No source files modified (zero-diff on `src/`).

## Scope

- `test/focus.test.ts` only.

## Exclusions

- No runtime/source changes — the fix ships as 0.2.0.
- No version bump (tests add no behavior; human may overrule at publish).
- Ephemeral-subagent delegation: out of scope (upstream feature request).
- Publish + live verify: publish-day checklist (dispatch named-session
  subagent in a focused gated repo → assert `inherited.v1` in its session
  file + attribution to the parent's change).
