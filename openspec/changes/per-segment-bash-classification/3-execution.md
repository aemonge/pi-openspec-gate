# Execution: Segment-conjunction classification

> Estimate: 1–2 h · medium-high confidence, confirmed from plan. Human wait:
> validate the behavior-change list (compounds that newly attribute).
> Parents: per-segment-bash-classification (idea, self-promoted).

## Skills

bare — hand-rolled conservative scanner + regex matrix; the traps are
enumerated in the plan (no domain skill; candidate later: "shell segment
grammar ledger" documenting every separator/tripwire decision with cases).

## Workflow

> Splitter first with its own unit tests, then the verdict rewire, then the
> matrix — the scanner must be right before anything trusts it.

## Steps

1. Splitter: quote/escape-aware `splitSegments()` with `#`-comments,
   VAR=prefix marking, empty-segment drop, redirect-aware `&`; unit tests
   for every trap in the plan.
2. Rewire `bashVerdict()`: per-segment (mutating-patterns → verb anchor →
   fail-safe), creation conjunction, `bash.grammar=fail-safe` tripwire;
   export splitter for tests.
3. Matrix: all plan cases + existing suite reconciled with receipts noting
   the ruling.
4. Full suite + lint green; receipts; hand the behavior-change list to the
   human for validation.

## Verification

- Deterministic: splitter unit tests; matrix green; `just test` all green;
  `just lint` green.
- Human validation: the human reviews the newly-attributing compound list
  and rules VALID (or amends).

## Safety & authority

- Mutation scope: classifier + its tests (gated, attributed to this change).
- Accounting-only vocabulary; no permission words (lint law).
- Fail-safe for unknown segments/grammar is inviolable.

## History

Declared 2026-10-19; idea refined in-session from security framing to
accounting framing (APPA boundary), approved 09:18:56Z.
