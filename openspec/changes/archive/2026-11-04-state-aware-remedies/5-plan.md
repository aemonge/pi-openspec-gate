# Plan

## Estimate

2–4 h of implementation-shaped work including tests and docs · high confidence (the walk supplied the spec; the suite pinned it) — actual: ~50 min session time, gate disarmed by human ruling at idea stage.

## Skills

bare — the implementing agent is the gate's own authoring session; no external skill applies, the source and its tests were the skill.

## Workflow

Block void research (Research's third alternative): walk #2 demonstrated void research is work; the other two lost because record-only leaves the demonstrated hole open and quotas are permission-shaped, not accounting-shaped.

## Steps

1. Capture the offending bash segment in the classifier (`offender`, truncated 60).
2. Add `scanSchemaNames` (schema.ts) — resolvable schema names, cached per root.
3. Add the `self-declare.v1` fact (facts.ts) and assistant-phrase noticing in the `message_end` latch; one-shot correction note via `withDeclareNote`.
4. Rework `blockUnaccounted`: headline/lead options, schemas-named create line, why-line, speaker-explicit declare line; parameterize for the research-void headline.
5. Make the research window state-aware: `researchCallMatches` hoisted, void branch blocks with the shared builder; retire the "clear the focus" escape line.
6. Tests: builder variants, compound why-line, self-declare notice (one-shot), research-void ×3 states (changes exist, zero changes, no local openspec).
7. Docs: README block copy + research-window section, example README, CHANGELOG Unreleased.
8. Verify: `npm test` 155/155, `just lint`, `./example/try.sh` 11/11.

## Verification

- `npm test` → 155 pass, 0 fail; `just lint` → "vocabulary law holds"; `./example/try.sh` → "passed: 11 failed: 0".
- Human validation: walk #3 — a fresh cold-agent session (new /tmp project, local tree installed, same dice-roller prompt) meets the claim: research blocked with remedies at first instrument call, self-declare impossible by copy and corrected by note if attempted, schema named in create, offender named in compound blocks, ladder walked to verdict. This is the one human-only act.

## History

- Walk #2 record: memory observation #970 (2026-10-27). Gate disarmed by human at idea stage, host-level; repo config.json unchanged (`enabled: true`) — the act and its mechanism recorded here and in CHANGELOG Unreleased.
