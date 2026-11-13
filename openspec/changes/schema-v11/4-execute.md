# Execute

> Spec: schema-v11 · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — both schema.yaml copies carry the v11 doctrines in byte parity

- [x] live `openspec/schemas/spec/schema.yaml`: `version: 10 → 11`; brainstorm
      instruction gains the answered/open split + first-class retro clause;
      investigate instruction gains the retro-journal sentence; plan instruction
      gains title-as-acceptance + contracts-home; execute instruction gains the
      mirrored-title clause — every `'` in new text `''`-escaped
      started_at: 2026-11-13T10:21:30Z · ended_at: 2026-11-13T10:23:40Z · total: 2m ·
      check: five instruction deltas + version, one edit call; `openspec schemas`
      parses v11 (real YAML) · paths: openspec/schemas/spec/schema.yaml
- [x] mirror the file byte-identical into `example/openspec/schemas/spec/schema.yaml`
      started_at: 2026-11-13T10:23:45Z · ended_at: 2026-11-13T10:23:50Z · total: 1m ·
      check: `diff -qs` reports identical · paths: example/openspec/schemas/spec/schema.yaml
  - [x] feat(schema): v11 — retro drafts, slice acceptance, contracts home
        hash: 8ad5dd9

## Slice 2 — every template pair ends byte-identical with the v11 hints where drafting happens

- [x] `1-brainstorm.md` both copies: the two stacked comment blocks merge into one
      carrying identity + the open/answered convention
      started_at: 2026-11-13T10:23:55Z · ended_at: 2026-11-13T10:24:05Z · total: 1m ·
      check: example copy's stacked pair replaced by the same merged block ·
      paths: openspec/schemas/spec/templates/1-brainstorm.md, example/…/1-brainstorm.md
- [x] `2-investigate.md` both copies: the hint comment gains the retro-journal line
      started_at: 2026-11-13T10:24:05Z · ended_at: 2026-11-13T10:24:15Z · total: 1m ·
      check: retro line sits before the Suggested shapes ·
      paths: openspec/schemas/spec/templates/2-investigate.md, example/…/2-investigate.md
- [x] `3-plan.md` both copies: the Slices comment gains title-STATES-acceptance +
      contracts-pin lines; the example slice reads `### Slice 1 — <the acceptance in one line>`
      started_at: 2026-11-13T10:24:15Z · ended_at: 2026-11-13T10:24:30Z · total: 1m ·
      check: `diff -rq` over both template dirs — all five pairs identical ·
      paths: openspec/schemas/spec/templates/3-plan.md, example/…/3-plan.md
  - [x] docs(schema): templates carry the v11 doctrines where drafting happens
        hash: eb080f4

## Slice 3 — CHANGELOG records the law and the gates go green

- [x] `CHANGELOG.md`: `## Unreleased` entry — retro drafts, titled acceptance, pinned
      contracts; instructions and templates only, walls untouched
      started_at: 2026-11-13T10:24:35Z · ended_at: 2026-11-13T10:24:45Z · total: 1m ·
      check: Unreleased opened above 1.3.0 · paths: CHANGELOG.md
- [x] `just lint` (vocabulary + parity) and `npm test` green — the real-YAML parse and
      the walkthrough are the deterministic proof of the escaping and the shape
      started_at: 2026-11-13T10:24:45Z · ended_at: 2026-11-13T10:25:10Z · total: 1m ·
      check: parity holds (7 verbs, 12 facts); vocabulary law holds; 194 pass / 0 fail
      (schema suites, real-YAML `openspec schemas`, example walkthrough markers) ·
      paths: test/, src/, bin/
  - [x] docs(changelog): schema v11 recorded — retro drafts, titled acceptance, pinned contracts
        hash: 9f3fe17

## Slice 4 — the registry remembers which artifact's verdict closed each spec *(surfaced at delivery: grants were per-artifact but validation was one change-level stamp written only at close, and approve granted the bearer past an open tick)*

- [x] `bin/eospec.js`: the unticked-verdict check becomes one shared law — approve
      refuses the bearer while its verdict tick is open (the tick is the approve-key);
      close hoists the bearer and stamps `x-validated_<id>` beside `x-validated`
      started_at: 2026-11-13T10:40:00Z · ended_at: 2026-11-13T10:47:00Z · total: 7m ·
      check: `verdictUnticked` helper; close stamp mirrors the `x-granted_<id>` shape ·
      paths: bin/eospec.js
- [x] `example/try.sh`: the walkthrough pins the wall — approve refuses the open tick
      in both lifecycles, close's guard re-pinned via a post-grant re-open, the
      registry check reads the archived meta (step 8's cat now shows the real final
      state, not a silent missing-file error)
      started_at: 2026-11-13T10:47:00Z · ended_at: 2026-11-13T10:53:00Z · total: 6m ·
      check: passed 23 / failed 0; archived meta shows `x-validated_execute` ·
      paths: example/try.sh
- [x] `test/example.test.ts` + `CHANGELOG.md`: markers `not approved — tick` and
      `registry: x-validated_execute stamped`, passed-pin 21 → 23; Unreleased entry
      carries the registry law
      started_at: 2026-11-13T10:53:00Z · ended_at: 2026-11-13T10:55:00Z · total: 2m ·
      check: markers assert presence; pin matches the counted reality ·
      paths: test/example.test.ts, CHANGELOG.md
  - [x] fix(cli): the verdict registry remembers per artifact — approve refuses an open tick
        hash: c2846ec

## Slice 5 — close lints the ledger's own three walls before it stamps *(surfaced at delivery: the ledger laws — hash law, mirror law, the verdict's uniqueness and place — were prose-only, the confusion driver; the fuzzy prose rules stay out, they need declared shapes to lint honestly)*

- [x] `bin/eospec.js`: `ledgerOffenses` — a commit tick without a hash beneath it,
      slices mirroring the plan one-for-one, exactly one schema-declared verdict line
      last in the countable checkboxes; close refuses with each offense naming its
      line, before any stamp
      started_at: 2026-11-13T11:05:00Z · ended_at: 2026-11-13T11:15:00Z · total: 10m ·
      check: the grep-proof law caught the hardcoded verdict name and the word 'order'
      — the lint reads the schema, the engine stays wordless · paths: bin/eospec.js
- [x] `example/try.sh` + `test/example.test.ts` + `CHANGELOG.md`: the walkthrough
      breaks a hash and close refuses it (`not closed — the ledger owes its own
      laws`), passed-pin 23 → 24; Unreleased entry carries the lint law
      started_at: 2026-11-13T11:15:00Z · ended_at: 2026-11-13T11:25:00Z · total: 10m ·
      check: 24/24 walkthrough, parity holds, 194/194 green ·
      paths: example/try.sh, test/example.test.ts, CHANGELOG.md
  - [x] feat(cli): close lints the ledger — hash law, mirror law, verdict last
        hash: dc866e4
- [x] `bin/eospec.js`: the slice-title capture stops at the heading line — JS negated
      classes cross newlines, so the mirror check swallowed checkbox prose until the
      next amendment paren; the dry-run against this ledger caught it pre-verdict
      started_at: 2026-11-13T11:35:00Z · ended_at: 2026-11-13T11:40:00Z · total: 5m ·
      check: lint dry-run clean — 5 slices mirrored, verdict last · paths: bin/eospec.js
  - [x] fix(cli): the slice-title capture stops at the heading line — negated classes cross newlines
        hash: 422922a

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-13T11:18:51Z
