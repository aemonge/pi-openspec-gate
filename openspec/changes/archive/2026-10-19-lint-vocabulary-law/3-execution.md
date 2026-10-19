# Execution: Track the sanctioned vocabulary in lint

> Estimate: 10–20 min · high confidence, confirmed from plan. Human wait:
> fresh `just lint` run in the human terminal after Step 2.
> Parents: lint-vocabulary-law (self-parented).

## Skills

bare — single-line grep pattern edit in a justfile; no domain skill informs
it (optional candidate skill to author later: "vocabulary-law ledger" — a
doc mapping each sanctioned/forbidden word to its ruling date, so lint and
docs never drift again).

## Workflow

> Straight edit-and-verify: the failing recipe is the spec, the ruling is the
> authority, the canary proves the law still bites.

## Steps

1. Edit `justfile` lint pattern: drop `approv` from the forbidden set.
2. Run `just lint` (expect green) and `just test` (expect 57/57).
3. Canary: verify the law still rejects forbidden words — temp-copy a
   forbidden word into a src file, expect grep hit, revert.
4. Receipt: append attribution to 4-tasks.md; hand off to human for their
   terminal `just lint` + optional `just publish 0.2.0`.

## Verification

- Deterministic: `just lint` exit 0; `just test` 57/57; canary blocks.
- Human validation: human runs `just lint` — green, one line reported.

## Safety & authority

- Mutation scope: `justfile` only (gated — attributed to this change).
- No npm credentials touched; publish stays in the human's terminal.
- Fail-safe unchanged: unknown tools still fail-safe; no classifier edits.

## History

Declared 2026-10-19 after live proof: `just lint` failed on
`test/approval.test.ts:1` and `config.json:6` with the 0.2.0 tree.
