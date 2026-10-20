# Plan: memory instruments — session memory is never gated

> Estimate: 20–40m · high
> Evidence: the accountingTools lever already exists and is load-time config; memory reads are already classified read-only in classifier.ts
> Human wait: after updating the installed gate, run a fresh unfocused session — a mem_save must pass and land as an instrument fact
> Parent idea: none

## Acceptance

- `config.json` `accountingTools` gains the seven write verbs: mem_save, mem_update, mem_delete, mem_save_prompt, mem_session_summary, mem_session_end, mem_capture_passive
- Each verb passes ungated and is recorded as `pi-openspec-gate.instrument.v1` — proven by test
- `mem_delete` included: never gated, still recorded
- The fail-safe stays intact — an unknown memory tool (e.g. `mem_hypothetical`) still classifies mutating, proven by test
- `just test` and `just lint` green

## Scope

`config.json`, a new `test/instruments.test.ts`, CHANGELOG entry at release.

## Exclusions

- No classifier change — `READ_ONLY_TOOLS` untouched (reads already sanctioned)
- No `.engram/**` path exemption — memory tools carry no file paths; the wrong mechanism
- No publishing-flow change — rides the normal `just publish` recipe
