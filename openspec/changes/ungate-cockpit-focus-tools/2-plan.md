# Plan: Ungate the cockpit focus instruments

> Parent idea: this change · Estimate: ~30m · high confidence

## Done when

- Tools named in config `accountingTools` pass ungated and leave a
  `pi-openspec-gate.instrument.v1` fact (tool + UTC) — nothing unrecorded
- Unknown tools NOT on the list still block (fail-safe untouched)
- Config without `accountingTools` behaves exactly as before
- `grep -riE 'waiver|approv|sanitiz|trust' src/` still zero
- Suite green including the new instrument tests

## Scope

- src/facts.ts (new fact type), src/config.ts (parse the list),
  src/gate.ts (carve-out before classification), config.json (default list
  from observed sessions: work_focus, openspec_focus, stage, subject)

## Exclusions

- mem_* and any stateful external-store tools: separate ruling, not this
  change (they may write outside the session entry store)
- readOnlyHint annotations on the status package: human side, other repo
- No behavior changes to block/attribute/exempt/declare paths
