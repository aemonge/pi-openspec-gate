# Plan: vocabulary first, teeth second, teaching last

## Skills

- pi-openspec-gate internals, read this session: the TS/JS twin
  (src/schema.ts ↔ bin/gate-lib.js), gate.ts teeth (approval-touch
  regex, remedy picker), attribution.ts single-flight receipt queue
- openspec schema law: non-strict zod strips x- fields silently — the
  gate is their only loud validator
- node:test with --experimental-strip-types: the existing test/ suite
  as the harness pattern
- plain-JS bin constraint: node refuses type-stripping under
  node_modules, bins stay .js
- justfile release flow: lint (vocabulary law) → test → build →
  publish + global install

## Workflow

Vocabulary first (schema.ts + its JS twin, tests riding along), then
the two consumers (gate.ts teeth, pios-gate CLI), then teaching
(protocol block, README, skills) — code before docs because the grep
proof needs the engine clean first.

## Steps

1. src/schema.ts: parse `x-grant-verb`, `x-verdict-line`,
   `x-receives-receipts`, `x-completes`, `x-unlocks-source`; rich
   `x-sections` entries (bare string = structure only; `{id,
   x-requires-written, x-requires-approval}` = sub-gates); loud
   validation — unknown refs, duplicate verbs, self-requires, section
   depth > 1 all throw with the source file named. Delete GRANT_VERBS
   and rungForGrantVerb.
2. bin/gate-lib.js: mirror step 1 exactly (the twin stays
   behaviorally identical; no grant verbs remain).
3. src/gate.ts: approval-touch guard = approve|grant|confirm surface
   plus every verb the resolved schemas declare; remedies id-addressed
   (`approve <slug> <artifact-id>`, declared verb shown when present);
   unlock = any granted `x-unlocks-source` artifact (ruling to strike
   or keep at grant), ladder completion when none declares it;
   verdict-line guard reads `x-verdict-line`, absent tag → no guard.
4. Sub-grants and receipts: grantRung accepts id-paths (`some/one`)
   into the phases_approved CSV; artifact grant refuses while its
   gated sections are unwritten or ungranted; receipt target = the
   artifact bearing `x-receives-receipts` (absent → the `x-completes`
   artifact); the `4-tasks.md` literal leaves src/attribution.ts.
5. bin/pios-gate.js: `grant <slug> <artifact-id>` subcommand
   (id-paths included); declared verbs resolve as aliases through the
   schema; positional verbs and their help text removed; pending and
   inspect read schema tags (verdict line, receipt target, unlock
   state) instead of last-artifact guesses and the "Human validation"
   regex.
6. index.ts: PROTOCOL_BLOCK rewritten schema-agnostic — no verb lists,
   no lengths; block reasons and the skill carry the specifics.
7. openspec/schemas/mission/schema.yaml: restate with explicit tags —
   `x-grant-verb` per rung (propose/deal/plan/order/execute become
   declared data), `x-verdict-line`, `x-receives-receipts`,
   `x-completes`, `x-unlocks-source` on execution. Templates
   unchanged.
8. Docs split: README documents the engine and the x- vocabulary
   table, mission as the worked example; skills go generic law +
   pointer.
9. Tests: custom-schema suite — three rungs, custom verbs, section
   gates, early unlock, verdict line, receipt target, id-path
   sub-grants, grant-refuses-missing-structure, absent-tag legacy;
   existing tests updated to the new parser; a grep-proof test failing
   on any of the five verbs, `GRANT_VERBS`, `4-tasks.md`, or `Human
   validation` appearing in engine code (src/, bin/, index.ts) — the
   claim, self-enforcing.
10. Release: CHANGELOG, 0.5.0, `just lint && npm test`, `just publish
    0.5.0` (includes the global reinstall — the drift cure). After
    merge the developer refreshes graphify (their act, per ruling).

## Verification

- `just lint` — the vocabulary law holds
- `npm test` — full suite green, custom-schema and grep-proof included
- the grep-proof test is the Done-when grep, automated
- manual smoke: a scratch change under a custom schema — watch blocks
  name declared verbs, grant by alias and id-path, unlock at the
  declared rung, receipts land in the declared artifact
- Human validation (concrete): the Human walks the smoke on their own
  terminal, watches blocks/grants/unlock hold, replies VALID

## History

Commit subject `5555fc5 chore(release): v0.4.0`; design trail: the
rulings recorded in 1-idea.md and mission memory (obs #917); no
external prices.
