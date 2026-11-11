# Brainstorm

> Spec: post-delivery · consult `openspec/learnings/` before drafting

## Pain

The spec walk ends at execute: verdict ticked, change closed, archived.
But execution is exactly where reality surfaces findings — bugs, tech
debt, enhancements the plan could not have named. The addings loop
(schema v7) handles the small ones: they become slices in the same
ledger, and the verdict waits. What it did not solve is the missing
middle: findings too big for slices — a bug that needs real design, a
feature chunk, a refactor with its own risk — which today either bloat
execute against its mirror law, fall into `openspec/learnings/debt.md`
and die quietly, or trigger a full new spec whose ceremony outweighs
the work. The human named the missing piece: a fifth artifact after
delivery, so post-delivery work gets designed and approved inside the
change that surfaced it.

## Questions

- **Name and shape**: what is the fifth artifact — follow-ups, addings,
  debrief? One standing artifact per change (drafted only when findings
  exist), or a batch artifact carrying multiple findings, each with its
  own mini-contract and commit law?
- **Position and gates**: does it require execute's verdict
  (x-requires-approval: [execute]) — so the walk stays strict: nothing
  post-delivery happens until the human has judged the delivery? Does
  x-completes: approved MOVE from execute to the fifth artifact,
  changing when a change becomes closable — or does execute keep
  completing and the fifth artifact gate the close itself?
- **The slices boundary**: what wording separates an adding (a slice in
  execute) from a follow-up (this artifact)? Traceability to something
  the implementation surfaced, versus designed work — where is the
  line drawn and who draws it?
- **The two-lifecycle split**: does this artifact replace the
  debt.md → follow-up-change path for mid-size findings, or complement
  it (debt stays for post-close findings, this artifact covers
  pre-close)? What happens to a finding that arrives after close?
- **Engine surface**: everything built in the rebuild assumes four
  artifacts — room file (artifact-idx 5/5), completion lines, close
  semantics, the walk line in every block, parity lint, try.sh, example
  README. Which of those must move for a fifth artifact, and what is
  the honest cost? Can the artifact be pure schema data (one more
  entry, conditional on findings existing), or does close/validation
  need engine work?
- **Drafting legality**: the artifact drafts only when findings exist —
  how does a "conditional artifact" avoid demanding its file when
  nothing surfaced (the room file's next-step must stay truthful for
  the empty case)?
- **Room-file law** (human ruling): next-step shows only the human's
  verb — `eospec approve` while any artifact pends, `eospec close` once
  all are granted — never a `draft <file>` step, never a verdict
  reminder (close's refusal already teaches the tick); and the `task:`
  line is omitted entirely when the artifact has no checkboxes. Rides
  this change's plan (renderRoom moves for idx anyway), or its own?

<!-- Direction (optional, free): schema-data first — prefer one
conditional artifacts: entry over engine surgery; if close semantics
must move, say so loudly and price it. The walk line, room file, and
parity lint all learn the fifth step or none of this ships. The room
file simplifies in the same breath (human ruling): next-step names only
the human verb — approve while anything pends, close once all are
granted — and the task: line vanishes when empty; the counter's
checkbox sum (tasks + commits + verdict per artifact file) is the
honest 1/12 → 12/12 climb, verified against the ledger shapes. -->
