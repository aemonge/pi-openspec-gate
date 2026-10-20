# Idea: phase gates — each job rung approved before the next drafts

> Parent idea: none

As a human owner of every job I approve each phase of the ladder as it is
drafted, so that collaboration happens rung by rung instead of once, after
the whole job already exists.

Today the gate has exactly one approval, and it sits after the full
four-artifact ladder is drafted: `openspec/**` is exempt, so idea, plan,
execution and tasks all appear without a single human checkpoint, and the
one `pios-gate approve` is all-or-nothing. The human's first look at the
direction is also their last — a misdirection found in the plan means
unwinding artifacts that were never reviewed, and the schema's `requires:`
chain (each phase building on an approved predecessor) has no mechanical
carrier at all.

The direction: gates become declarations the schema owns and teeth the
gate owns. A schema marks each artifact with `x-requires-approval:` naming
the human approvals that must precede its drafting, and `x-sections:`
naming the headings it may not be born without; the gate reads both and
enforces at the tool-call boundary — creating an artifact whose approvals
are missing blocks with the exact terminal remedy, and creating one
without its declared sections blocks naming them. The human terminal gains
`pios-gate approve <slug> <phase>` (next rung in schema order, never a
skip; the command itself refuses to stamp an artifact missing declared
sections) writing a cumulative `phases_approved:` record into the change
meta; only a completed ladder writes `status: approved`, leaving the
source-mutation teeth untouched. Hard limits: enforcement lives entirely
in this package — the mechanism ships tested against fixture schemas,
while this repo's own schema renames to `job` and adopts the tags in its
own slice; the global openspec CLI stays untouched (it silently strips
unknown `x-` fields, so the gate validates its own tags, loudly); the
first rung stays free (ladder entry), existing files stay editable
(in-flight jobs grandfathered, receipts keep flowing); and this is still
accounting at the tool-call boundary, never permission, never a renderer.
