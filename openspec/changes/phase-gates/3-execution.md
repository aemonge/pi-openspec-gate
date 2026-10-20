# Execution: phase gates

> Estimate: 3–5h · medium-high, confirmed from plan. Human wait: the fixture-mission grant walk.
> Parents: phase-gates change; ships with mission-schema in the same release train.

## Skills

bare — pi's ExtensionAPI surface (context events, tool_call handler) and openspec's schema/meta formats were verified directly against installed sources this session; no external knowledge informs this slice. (Candidate: a pi-extension-internals skill, authored when a second extension is built.)

## Workflow

> Reader-first: the schema reader is the single source every guard, CLI verb, and cockpit view consumes — build it once, then hang the surfaces off it.

## Steps

1. `src/schema.ts`: schema resolution (project-local → global) + x-tag parsing + loud validation
2. `src/approval.ts`: `phases_approved` cumulative meta + grant→rung mapping; `src/gate.ts`: the two guards before the exempt check (precedent: human-gate flip guard), `phasegate.v1` facts, latch phrases
3. `bin/gate-lib.js` + `bin/pios-gate.js`: grant verbs, approve/confirm/pending/show/focus; section checker shared with the guard (contract-tested)
4. Protocol block via `context` handler in `index.ts`; skill file(s) under `skills/`
5. `config.json`: `approval.phaseGates: true` default for this repo
6. Tests: guard allow/block matrix, CLI verb matrix, meta writer, schema resolution + failure loudness, fixture mission schema, TS↔JS contract
7. README + CHANGELOG; `just lint`, `just test`, `just build`

## Verification

- Full suite green; lint green; packed-artifact gates green
- Human walk: create a fixture mission, draft rungs, watch wrong-order drafts block with remedies, grant rung by rung, big-bang a second fixture, confirm VALID latch on a Human-validation flip

## Safety & authority

npm publish remains your terminal act; nothing here touches trust or permissions — declaredness only.

## History

- 2026-10-20: full design co-authored in-conversation; extension API + openspec sources verified live.
