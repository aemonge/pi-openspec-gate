# Idea: The ledger must see every segment of work

Two accounting leaks, both proven in the live classifier. **Hole A —
preemption:** read-only escapes (`git status`, `openspec list`, `graphify
query`) are matched anywhere *before* the mutating scan, so `git status; npm
install` classifies read-only — the install ran, no receipt exists, the
ledger is blind. **Hole B — one verb launders the rest:** the generic
read-only pattern needs a single anchored verb, so `ls; bash ./script.sh`
passes — the script's effects escape accounting entirely. Both are
double-entry bugs: work happened and nothing recorded it. Neither is a
security question — whether a call may run at all belongs to APPA
(pi-openappa), whose policy layer owns adversarial commands. This gate owns
one thing: no mutation off the books.

## Direction

Two moves, cheapest first. (1) **Reorder:** mutating-anywhere beats
read-only-anywhere — one line, closes Hole A outright. (2) **Conjunction:**
quote-aware split on `;` `&&` `||` `|` `&` `\n`, every segment must
independently classify read-only (mutating patterns first, verb anchored at
segment start), else the whole command attributes. Honest-assistant bar:
classify honest compound commands honestly; unknown verbs and unknown
grammar (`$(…)`, heredocs) attribute — a receipt line, never a denial.
Attribute-cheap is the bias: over-recording costs one line, under-recording
costs the ledger.

## Constraints

Accounting only: allow/deny, adversarial construction, result filtering are
APPA's forever (law of disjoint questions); the gate's block is "unaccounted
— here are the remedies," never "not allowed." The `&`-vs-`2>&1` redirect
overlap must not shred honest redirects into fake segments. Fail-safe for
unknown tools/segments is inviolable. Scope ceiling: classifier + tests.

## Children

This change — promoted to ramona-plan after human approval
2026-10-19T09:18:56Z (self-descending, gate-approval precedent).
