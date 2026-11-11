# Brainstorm

> Spec: quiet-receipts · consult `openspec/learnings/` before drafting

## Pain

The receipt ledger drowns the walk: receipts fire for every attributed
call — including read-ish bash (`npm test`, `cat`, probes) — so a heavy
delivery turn appends dozens of `gate-attributed · tool: bash · paths:
—` lines the human hand-prunes before close. The post-delivery walk
(2026-11-11) shipped the dedupe (doubles die) and the tight block
(blank-line inflation dies), but not the volume: one line per call is
one line too many for calls that carried no work. Surfaced live by the
human — "I had like a ton of log at the 4th artifact that I had to
remove."

## Questions

- What earns a receipt — mutations with extracted paths only, or every
  attributed call? Where does the line sit for bash without inspectable
  content?
- Should read-classified calls (the classifier's own verdict) land as
  receipts, facts-only, or nothing?
- Does the tight block stay, or do receipts move to a sidecar file the
  close summarizes into the ledger?
