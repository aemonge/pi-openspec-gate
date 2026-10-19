# Plan: Segment-conjunction classification

> Estimate: 1–2 h · medium-high confidence
> Evidence: both holes reproduced against live classifier today; reorder is
> one line, splitter is ~40 lines, matrix is enumerable.
> Parent idea: per-segment-bash-classification (approved 2026-10-19T09:18:56Z)
> Human wait: validate the behavior-change list below (previously-passing
> compounds that now attribute) — it is the intended ruling.

## Acceptance

- Reorder: mutating-anywhere beats read-only-anywhere (Hole A closed).
- Conjunction: quote-aware split on `;` `&&` `||` `|` `&` `\n`; every
  segment must independently classify read-only or creation; one unclean
  segment fails the whole command safe (Hole B closed).
- Segment grammar: leading `VAR=value` assignments stripped before verb
  anchor (ergonomics, not trust); unquoted `#` skips to newline; empty
  segments ignored; `\` escapes next char (continuations).
- Tripwire: any segment containing `$(`, backtick, `<(`, `>(`, `<<`, or
  unbalanced quotes → whole command fail-safe (new basis
  `bash.grammar=fail-safe`) — a receipt, never a denial.
- Creation: `openspec new|init` classifies creation only when every segment
  is clean-or-creation (compound laundering closed).
- `&` never splits when part of redirect grammar (`2>&1`, `&>`, `>&`).
- Matrix green: clean compounds pass (`git status && git diff`,
  `graphify query a; graphify path b`, `grep x 2>&1`); laundering fails
  (`git status; npm install`, `ls; bash x.sh`, `which graphify; graphify
  --version`, `git log; rm -rf b/`); existing single-command behaviors
  unchanged; powershell rides the same splitter, no regression.
- Full suite green; existing classifier tests reconciled only where they
  assert the now-ruled behavior change.

## Scope

- `src/classifier.ts` (splitter + segment verdict + creation guard).
- `test/classifier.test.ts` (matrix).

## Exclusions

- APPA territory: adversarial construction, allow/deny, result filtering.
- find/`sort -o`/awk argument-guards (verb-set surgery — follow-up slice).
- Powershell-native grammar beyond the shared splitter.
