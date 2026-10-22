# Execution: mission schema adoption

> Estimate: 1–2h · high, confirmed. Human wait: smoke mission on the new default, then archive it.
> Parents: mission-schema change; depends on phase-gates landing first (remedy text and counter ship together).

## Skills

bare — adoption is mechanical: config, remedy line, counter, docs, deletions. The schema itself is already authored and verified.

## Workflow

> Adopt-last: the schema ships first as draft, the mechanism lands, then the repo flips its default — no moment exists where the repo demands what the gate can't enforce.

## Steps

1. Flip `openspec/config.yaml` to `schema: mission`; fix gate remedy + counter filename
2. Delete `openspec/schemas/ramona-plan/`, `openspec/schemas/ramona-idea/` (archive untouched)
3. README rewrite: mission story, grants table, two-lane map, memory law, protocol block/skill mention
4. CHANGELOG entry; skills content final pass matching shipped verbs
5. Verify: `openspec schemas`, `openspec new change smoke --schema mission` + validate + archive; `just test`, `just lint`, `just build`; `graphify update .`

## Verification

- Suite green; fresh smoke mission walks create→draft→grant→archive on the new default
- `openspec schemas` lists mission only; archive intact

## Safety & authority

None beyond repo edits and the normal release flow.

## History

- 2026-10-20: schema co-authored and synced to ~/.config/openspec by the Human (rm ramona-*, cp mission, config flip).
