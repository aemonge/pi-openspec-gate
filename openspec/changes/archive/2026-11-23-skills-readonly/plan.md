# skills-readonly

## Goal

Classify the `skills` catalog tool read-only: the discovery/brainstorm flow (querying the installed skill catalog while drafting a plan) is currently refused in openspec-rooted rooms without focus, because the fail-safe treats any unknown tool as mutating — and `skills` never joined READ_ONLY_TOOLS. This restores the gate's own law: nothing gates reading.

## Estimate

30–45 min · high confidence (one set entry + comment, one test block, one changelog line)

## Skills

none — the walk touches one Set literal and one test file; the house style sits in situ (classifier.ts's own commented entries, classifier.test.ts's existing blocks); no catalog-discovery skill is needed for a one-name fix

## Approach

method: smallest complete change — one name in classifier.ts's READ_ONLY_TOOLS with a why-comment citing the live-catch, one test block asserting the native call shape passes and an unknown tool still fails safe, one changelog line
architecture: single module, stdlib-first; the set is name-keyed so it covers the native tool and any re-registration under the same name; config readOnlyTools stays the escape hatch for tool names not yet in a release — unchanged here

## Questions & Decisions

- fix layer: built-in classifier set vs config default → built-in READ_ONLY_TOOLS; the code is the shipped truth, config remains for unreleased names
- scope: only `skills` this slice — other meta tools (plan_tracker et al.) earn their own change with their own evidence
- en-route finding: @d3ara1n/pi-scout's claimed pi-model-roles dependency is unverified — out of scope here, noted for the tool-stack survey
- CHANGELOG entry → dropped en route: the log froze at 1.5.0 while ten versions shipped without entries (v1.16.0's release commit touches only package.json + package-lock); the header declares the archive the source of truth — reviving it for one line would fake completeness

## Tasks

### Slice — skills catalog reads pass ungated

- [x] add `skills` to READ_ONLY_TOOLS in src/classifier.ts with a why-comment (catalog discovery/brainstorm — live-caught 2026-11-23: gate refused a `skills` list in its own unfocused repo)
  commit: fix(gate): classify skills catalog reads read-only (hash: 2c2104a)
- [x] test/classifier.test.ts: `skills` (list shape) classifies read-only; unknown tool still mutates (fail-safe regression)
  commit: test(gate): skills read-only assertions (hash: d973343)

## Verification

- [x] npm test

- skills catalog reads classify read-only — a `skills` list in an openspec-rooted room with no focused change answers with the catalog, not the ⛔ block
- the fail-safe is untouched — a tool outside the known sets still classifies mutating

Validation: from the repo root, in a session where the `skills` tool exists and no change is focused (the room aims nothing), invoke `skills` list — expect the catalog to answer, not the refusal; then read one skill to confirm the read path. The human judges, then ticks the verdict below (or replies VALID) and runs eospec close.

- [x] Hands-on validation
