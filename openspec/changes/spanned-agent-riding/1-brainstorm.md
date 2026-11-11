# Brainstorm

> Spec: spanned-agent-riding · consult `openspec/learnings/` before drafting

## Pain

npm:pi-subagents spawns ungated in the default path: `registerRequiredChildExtensions`
(fail-closed admission) and `registerSubagentCapabilityCeiling` are claimed by no
installed package — a spawned agent inherits nothing and is accounted by nothing.
Four gaps were named in the retired idea (killed from the bench 2026-11-04, text in
git history). Graduated from the debt ledger when debt died (post-delivery, 2026-11-11).

## Questions

- What does the gate inherit across a spawn — the aim, the exemptions, the
  declaration latch — and what must stay session-bound?
- Does fail-closed admission belong in the gate or in pi-subagents?
