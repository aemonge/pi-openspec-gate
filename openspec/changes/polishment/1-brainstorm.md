# Brainstorm

> Spec: polishment · consult `openspec/learnings/` before drafting

## Pain

Small work paid the full four-artifact ceremony per item, and the cost
showed within one day: the pause feature sat waiting on a stamp, the
post-archive commit gap and the bash-exemption gap sat in debt.md hours
after being found, and the human's instinct — "pack them into one
polishment to avoid bureaucracy specs" — named the real tax. Each item
is individually small (minutes to an hour or two); the ceremony around
each is not.

## Questions

1. Which items ride this batch, and what is the ceiling? Candidates from
   today: **pause** (the time-boxed, session-scoped gate pause — the
   largest item, design seeds already drafted in its retired
   brainstorm), **focus-lifecycle gaps** (post-archive dangling focus;
   bash-staged `openspec/**` paths not matching the docs exemption),
   **bench cleanup** (archive the shipped fossils state-aware-remedies
   and cli-schema-tag-parity; kill pause-window and
   terminal-only-approvals; gate-spanned-agents to debt). Does the batch
   cap at a slice count or an hour budget, or run until the named items
   are done?
2. Where does each item's design live — one shared investigate (the
   gaps share the focus/exemption mechanism; pause has none of it), or
   does each slice carry its own design notes in the plan?
3. Batch hygiene: does the batch have a hard exit — named slices done,
   archive whole — with new finds going back to debt.md instead of
   growing the open batch?
4. Slices stay 1:1 with commits and per-slice human validation; is the
   batch's own verdict then just the final tick over them?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
Direction: one ceremony, many fixes — the batch is the bureaucracy
cure, not a junk drawer. Slices are the items, each with its own commit
and its own human validation; debt.md stays the intake (new finds queue
there, the batch does not grow); the batch archives whole when its
named slices are done. If the batch pattern recurs, the durable cure is
a lighter batch schema — same law, fewer rungs — decided when the
pattern proves out.
