# Execution: pios-gate — wrapper, patterns, pending

> Estimate: 2–3 h · medium-high confidence, confirmed from plan. Human wait:
> terminal approve before source edits; live dogfood after publish.
> Parents: pios-gate-cli (self-parented).

## Skills

bare — thin CLI dispatch, one classifier rewrite rule, pattern extension;
the stamp-timing change is the only subtle piece (candidate skill to author
later: "wrapper normalization ledger" — every command form and its
classification, machine-checked).

## Workflow

> Wrapper first (it is pure addition, no gate risk), then the gate grows the
> name with tests proving equivalence, then stamp timing, then docs.

## Steps

1. `bin/pios-gate` shim + `bin/pios-gate.ts`: dispatch approve/confirm
   (reuse the old bin's logic via shared src module if clean) + `pending`
   (read `openspec/changes/*/.openspec.yaml` + task counts) + exec
   passthrough with exit-code propagation. Wrapper tests with a fake
   `openspec` on PATH (records argv, exits 0/3).
2. Classifier normalization + tests: every wrapper form classifies like its
   bare openspec form (list read, new/init creation, archive mutation,
   update mutation).
3. Gate patterns: APPROVAL_TOUCH extension (`pios-gate(.ts)? …
   approve|confirm`, path forms included) + byte-exact block tests.
4. Stamp timing: move the creation stamp to after-call (no pre-create);
   test: witnessed creation leaves no empty dir; stamped when dir exists.
5. package.json bins + README approval section; full suite + lint; version
   0.3.0; receipts; hand to human.

## Verification

- Deterministic: wrapper tests (dispatch, passthrough verbatim, exit codes,
  reserved verbs never forward), classifier equivalence tests, touch-pattern
  tests, stamp tests, `just test` + `just lint` green.
- Human validation: after publish + reload, human runs `pios-gate pending`
  and the first live `pios-gate approve …` (dogfood: the surface approving
  its own birth change's successor).

## Safety & authority

- Mutation scope: bin, package.json, classifier, gate, tests, README — all
  attributed to this change, which must be approved first (teeth).
- Accounting-only vocabulary (lint law); `confirm` is not a permission word.
- Approval stays out-of-band: touch pattern extension is the enforcement.

## History

Declared 2026-10-19 after brainstorm rulings: package unchanged, bin
`pios-gate` (9 chars, self-decoding, everything free on npm), `validate`→
`confirm`, permanent alias, `pending` in, stamp fix in. Prior name
candidates `pig`/`pog` rejected (meme-adjacent / taken).
