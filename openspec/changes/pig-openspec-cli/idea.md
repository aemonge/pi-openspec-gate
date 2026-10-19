# Idea: pig-openspec — the gate as an openspec feature extension

Two CLIs that must never collide, do. The human runs `openspec` for spec
work and `pi-openspec-gate` for approval acts, but `validate` means different
things to each (structure lint vs human-gate flip permit) — and the approval
surface keeps drifting out of reach: the global install vanished and the
human hit `command not found` mid-session (2026-10-19), stalling an approval
the gate's own teeth demanded. A human-facing surface that can silently
disappear is a design flaw, not an ops accident.

## Direction

One binary, `pig-openspec` (PI-Gate), behaving as a feature extension of
openspec: gate-owned verbs (`approve`, `confirm` — the renamed gate `validate`
that kills the vocabulary collision) plus transparent passthrough of every
other argv to the real `openspec` CLI, exit code intact. Unknown → openspec.
The gate's own patterns (approval-touch block, creation-stamp witness) grow a
`pig-openspec` alias so the proxy surface is covered by the same teeth.
`pi-openspec-gate` stays as a deprecated alias for one release, then dies.
Passthrough never adds, drops, or rewrites arguments — it is `exec`, not
interpretation.

## Constraints

Approval stays out-of-band: the binary remains a human-terminal surface, and
the approval-touch guard must block `pig-openspec approve` from assistant
bash exactly as it blocks the old name. No passthrough of gate verbs to
openspec (`approve`/`confirm` are ours; a passthrough loop is a bug). Scope
ceiling: bin + gate patterns + package bin field + README; npm name
`pig-openspec` verified unclaimed (2026-10-19).

## Children

None yet — no ramona-plan descends from this idea until a human approves it.
