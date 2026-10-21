# Execution

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Vocabulary: the twin learns the x- tags

> Mission: generic-schema-engine

- [x] Step 1 — schema.ts parses x-grant-verb, x-verdict-line, x-receives-receipts, x-completes, x-unlocks-source, rich x-sections entries; loud validation; GRANT_VERBS and rungForGrantVerb deleted start: 10:12Z · elapsed: 5m · check: schema tests green (parse, aliases, loud validation) · paths: src/schema.ts
- [x] Step 2 — gate-lib.js mirrors the vocabulary exactly, twin stays behaviorally identical start: 10:17Z · elapsed: 4m · check: contract tests green; pending runs · paths: bin/gate-lib.js

## Task 2 — Teeth: the guard forgets the five verbs

> Mission: generic-schema-engine

- [x] Step 3 — gate.ts approval-touch guard = approve|grant|confirm + declared verbs; remedies id-addressed; unlock = any granted x-unlocks-source, ladder completion when absent; verdict-line reads the tag start: 10:21Z · elapsed: 8m · check: touch-guard fixture blocks reserved + declared verbs, passes validate · paths: src/gate.ts
- [x] Step 4 — grantRung accepts id-paths (some/one) into phases_approved; artifact grant refuses while gated sections incomplete; receipt target = x-receives-receipts artifact (absent → x-completes); 4-tasks.md literal leaves attribution.ts start: 10:29Z · elapsed: 3m · check: vocabulary walk stamps build/alpha, build/beta; receipts follow the declared artifact · paths: src/gate.ts, src/attribution.ts

## Task 3 — CLI: verbs arrive by name, not position

> Mission: generic-schema-engine

- [x] Step 5 — pios-gate grant <slug> <artifact-id> (id-paths included); declared verbs resolve as schema aliases; positional verbs and their help text removed; pending/inspect read tags instead of last-artifact guesses and the Human validation regex start: 10:32Z · elapsed: 3m · check: CLI walk grants by alias (dream-up) and id-path · paths: bin/pios-gate.js, bin/gate-lib.js

## Task 4 — Teaching: the law stops naming steps

> Mission: generic-schema-engine

- [x] Step 6 — PROTOCOL_BLOCK rewritten schema-agnostic: no verb lists, no lengths; block reasons carry specifics start: 10:35Z · elapsed: 2m · check: grep-proof covers index.ts · paths: index.ts
- [x] Step 7 — mission schema restated with explicit tags: x-grant-verb per rung, x-verdict-line + x-receives-receipts + x-completes + x-unlocks-source on execution; templates unchanged; behavior byte-identical start: 10:37Z · elapsed: 2m · check: openspec loads it; existing tests pass · paths: openspec/schemas/mission/schema.yaml
- [x] Step 8 — README documents engine + x- vocabulary table with mission as worked example; skills go generic law + pointer start: 10:39Z · elapsed: 5m · check: no five-verb lists outside the example data · paths: README.md, skills/mission-protocol.md

## Task 5 — Proof: the suite guards the claim

> Mission: generic-schema-engine

- [x] Step 9 — custom-schema suite (three rungs, custom verbs, section gates, early unlock, verdict line, receipt target, id-path sub-grants, grant-refuses-missing-structure, absent-tag legacy) + grep-proof test failing on any of the five verbs, GRANT_VERBS, 4-tasks.md, Human validation in engine code start: 10:44Z · elapsed: 9m · check: npm test 123/123 green · paths: test/

## Task 6 — Release: the drift cure

> Mission: generic-schema-engine

- [-] Step 10 — CHANGELOG, version 0.5.0, just lint && npm test, just publish 0.5.0 including the global reinstall start: 10:40Z · elapsed: 1m · check: lint ✓ · test 123/123 ✓ · build ✓ · pack 0.5.0 ✓ — npm publish blocked ENEEDAUTH: human runs npm login, then just publish 0.5.0 (recipe resumes; version already bumped), then git commit + tag v0.5.0 (the resume path skips npm version) · paths: CHANGELOG.md, package.json, justfile artifacts
  note: the old installed gate wrote this session's receipts to hardcoded 4-tasks.md (in this change dir) — the exact drift this step cures; left as the honest record
  note: after merge, the developer refreshes graphify (developer-owned act, per ruling)
  note: validation find (13:27Z, the human's live /tmp/test walk): 'rung' still
    leaked from engine copy — phase-gate block, CLI messages, protocol block —
    swept to neutral (phase gate / artifact); grep-proof extended to forbid
    'rung' in the CLI layer; 123/123 green. The schema owns the metaphor now.
  note: validation find #2 (15:09Z, the human's quest walk): the structure block
    still said 'rung gate' and heading matching was case-sensitive — a schema
    declaring lowercase ids (design) deadlocked against naturally-cased
    headings (## Design). Both fixed in the twins; headings now match
    case-insensitively (prose, not ids); grep-proof forbids 'rung gate';
    124/124 green.
  note: validation find #3 (15:20Z): `pios-gate --help` classified as
    mutation when unfocused (live-caught in the quest walk) — help flags
    join the read-only cockpit anchor; 125/125 green. Also verified: the
    agent's 'section write not blocked' report was the design, not drift
    (drafts free, grants gated — enforcement lives in grantRung).
- [x] Step 11 — Human validation — on a live custom schema, the Human watched blocks name declared verbs, granted by alias and id-path (quest: begin/forge), watched the section gate refuse out-of-order sub-grants, and replied VALID response: "OK - VALID" · outcome: VALID · at: 2026-10-21T15:45:00Z
