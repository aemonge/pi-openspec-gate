# Execution: memory instruments

> Estimate: 20–40m · high, confirmed from plan. Human wait: fresh unfocused session post-update, mem_save passes as instrument.
> Parents: memory-instruments change; ships in the next pi-openspec-gate release.

## Skills

bare — the accountingTools semantics are fully specified in src/config.ts and the README; no external knowledge informs this slice. (Candidate later: an engram-internals skill, not needed here.)

## Workflow

> Config-first: the designed lever needs zero code — tests prove the behavior, the release delivers it.

## Steps

1. Edit `config.json`: append the seven write verbs to `accountingTools`
2. Add `test/instruments.test.ts`: each verb → passes + FACT.instrument recorded; `mem_hypothetical` → still mutating (fail-safe untouched)
3. Run `just test` and `just lint`
4. `just publish <version>` — your terminal; the release carries the fix

## Verification

- Full `node --test` suite green, lint green
- Post-release smoke (human): unfocused session, `mem_save` passes, session entries show `pi-openspec-gate.instrument.v1`

## Safety & authority

None beyond the normal release flow — npm publish is your terminal act.

## History

- 2026-10-20 session: "memories should never be gated" ruled in-conversation; idea + plan drafted and approved through the ladder.
