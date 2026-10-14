# Idea: Ungate the cockpit focus instruments

> Parent: enforce-openspec-ladder-in-pi (validated 2026-10-14, gate-lab)
> Evidence: 13 blocked facts in --tmp-gate-lab-- / --tmp-playground--
> sessions: work_focus, openspec_focus, stage, subject — all fail-safed as
> mutating; one declaration consumed by work_focus instead of the intended
> write (declared.v1, 2026-10-14T13:40:57Z).

The ladder's own instrument panel cannot operate under the ladder's guard.
Those tools only append session entries — accounting, not work. The gate
must never gate its own instruments; the law of disjoint questions cuts
both ways.

## Outcome

- Entry-store cockpit tools pass ungated, recorded as instrument facts
- The allowlist is gate config (enablement is config, not policy)
- Companion action, human side: the status package should also declare
  readOnlyHint on these tools (belt and suspenders, separate repo)
