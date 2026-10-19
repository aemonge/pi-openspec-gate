# Idea: One command for the whole ladder — pios-gate

The human juggles two CLIs that nearly collide: `openspec` for spec work,
`pi-openspec-gate` for approval acts — and `validate` means opposite things
to each (structure lint vs human-gate permit). Worse, the approval surface
keeps drifting out of reach: the global install vanished once (2026-10-19)
and the human hit `command not found` mid-approval. A human-facing surface
that can silently disappear, and a vocabulary that collides with the tool it
extends, are design flaws — not ops accidents.

## Direction

One bin, `pios-gate`, the gate as a feature extension of openspec.
Gate-owned verbs — `approve`, `confirm` (the renamed `validate`, killing the
collision), `pending` (what needs the human, one command) — plus verbatim
exec passthrough of every other argv to `openspec`, exit code intact.
Reserved verbs never forward; a passthrough loop is a bug. Package identity
stays `@aemonge-dev/pi-openspec-gate` (no migration event, drift answered by
not fragmenting); the old bin remains a permanent alias. The gate's own
patterns grow the name: approval-touch blocks `pios-gate approve|confirm`
from assistant bash; the classifier normalizes a leading wrapper token to
`openspec` so passthrough reads/creations classify exactly like bare
openspec. The creation-stamp interplay fix rides along (no more pre-created
dir making `openspec new` cry "already exists").

## Constraints

Approval stays out-of-band: `pios-gate approve` is a human-terminal surface,
blocked from assistant tooling by pattern. Passthrough is `exec`, never
interpretation — no arg rewriting. The `pi-openspec-gate` alias never
deletes (remedy copy and receipts reference it; deleting working aliases is
never the work). `pending` is a human-terminal cockpit — the "never renders"
law governs sessions, not the human's own terminal. Scope ceiling: bin,
package.json, gate patterns, classifier normalization, stamp fix, tests,
README. Version 0.3.0 proposed; final number ruled at publish.

## Children

This change — promoted to ramona-plan by human ruling 2026-10-19 ("OK,
let's go!" on the locked design; self-descending, gate-approval precedent).
