# Proposal: the engine keeps only mechanism

> Estimate: 1–2 focused sessions · high confidence
> Evidence: cheap — residue enumerated to file:line (GRANT_VERBS ×2, touch regex, remedy picker, 4-tasks.md, Human-validation regex, last-artifact guess, PROTOCOL_BLOCK); risky — the JS twin gate-lib.js must mirror schema.ts, and the stale global install until republished
> Human wait: read + grant the remaining rungs, then judge the claim live on a custom schema (VALID); finally upgrade the global gate install — the drift cure
> Parent: none

## Done when

- grep-clean: engine source carries no step names, verbs, lengths, or
  unlock points — `GRANT_VERBS` gone from src/schema.ts and
  bin/gate-lib.js, the five verbs gone from the approval-touch regex
  and remedy picker, `4-tasks.md` and `Human validation` gone from src/
- a test-borne custom schema — three rungs, its own `x-grant-verb`s,
  section gates, early `x-unlocks-source`, `x-verdict-line`,
  `x-receives-receipts` — enforces end-to-end: blocks before grants,
  drafts after, sub-grants by id-path (`some/one`), receipts land in
  the declared artifact, code unlocks at the declared rung
- the shipped mission schema, restated with explicit tags, keeps
  today's behavior where tags are absent (ladder completion unlocks;
  bare-string sections mean structure only) — existing tests pass
  unchanged
- the protocol block and README teach the generic surface: no verb
  lists, no ladder lengths
- Human-verified (final): on a live custom schema, the Human watches
  blocks, grants, and the unlock hold — and replies VALID

## Scope

src/schema.ts (vocabulary, section nodes, loud validation), src/gate.ts
(generic guard, id-addressed remedies, unlock check, verdict line),
src/attribution.ts (declared receipt target), bin/gate-lib.js and
bin/pios-gate.js (id-addressed grants, id-path sub-grants, declared
verbs as aliases), index.ts (schema-agnostic protocol block),
openspec/schemas/mission/schema.yaml (declare explicitly what it
implied), README.md and skills/ (engine vs example split), test/
(custom-schema enforcement suite), CHANGELOG, version 0.5.0, publish
and global reinstall.

## Out of Scope

The accounting core (exempt / attributed / declared / blocked).
Section recursion beyond one H2 level. graphify-out exemptions
(developer-owned, ruled). Scratch or temp exemptions (rejected —
research decomposes into artifacts). The openspec CLI itself (it keeps
stripping x- fields silently). Cross-schema semantics for projects
mixing schemas. Anything rendered.

## Guardrails

Source unlocks at the execution rung per the schema. Ladder entry
(openspec new / init) stays never-gated. Approval stays human-only:
the touch guard covers grant / approve / confirm plus every
schema-declared verb. Meta stays CSV-compatible — `phases_approved`
appends `some/one` paths; old installs ignore unknown keys. Risks
accepted: section checks are form-only (heading present, not content);
a mid-flight heading rename can confuse gate state — remedy shown, the
Human re-grants. Ruling requested at the plan rung: multiple
`x-unlocks-source` artifacts → any granted one unlocks.
