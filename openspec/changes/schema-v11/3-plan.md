# Plan

> Spec: schema-v11 · consult `openspec/learnings/estimation.md` and `skills.md` — neither exists yet (learnings/ is empty; first schoolings may come from this walk)

## Estimate

80–120 changed lines across 9 files: 2 × `schema.yaml` (four instruction blocks + `version: 11`), 2 × `1-brainstorm.md` (merged comment), 2 × `2-investigate.md` (retro hint line), 2 × `3-plan.md` (Slices comment + example slice title), `CHANGELOG.md` (Unreleased entry). No `src/`, no tests. Confidence: high — every target enumerated in investigate with file:line sources; the only failure mode found is real-YAML `''`-escaping, caught deterministically by `npm test`'s `openspec schemas` parse.

## Skills

bare — house schema-data doctrine editing (markdown + the yaml single-quote dialect); no sanctioned skill covers it, none qualifies.

## Workflow

direct, because trivial — every route converged with file:line and web evidence in investigate; no genuine alternatives existed to choose between. The exact instruction wording is the one previewed and reviewed in conversation (2026-11-13) and journaled in investigate's external-practice check; the byte-parity diff is the review artifact at slice validation.

## Slices

### Slice 1 — both schema.yaml copies carry the v11 doctrines in byte parity

- [ ] live `openspec/schemas/spec/schema.yaml`: `version: 10 → 11`; brainstorm instruction gains the answered/open split + first-class retro clause (overclaim softened: "a first-class case, not a fudge"); investigate instruction gains the retro-journal sentence; plan instruction gains title-as-acceptance (inside the Slices parenthetical) + the contracts-home sentence; execute instruction gains the mirrored-title clause after the mirror sentence — every `'` in new text `''`-escaped
      started_at: · ended_at: · total: · check: · paths:
- [ ] mirror the file byte-identical into `example/openspec/schemas/spec/schema.yaml`
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(schema): v11 — retro drafts, slice acceptance, contracts home
        hash:

### Slice 2 — every template pair ends byte-identical with the v11 hints where drafting happens

- [ ] `1-brainstorm.md` both copies: the two stacked comment blocks merge into one carrying identity + the open/answered convention
      started_at: · ended_at: · total: · check: · paths:
- [ ] `2-investigate.md` both copies: the hint comment gains the retro-journal line
      started_at: · ended_at: · total: · check: · paths:
- [ ] `3-plan.md` both copies: the Slices comment gains title-STATES-acceptance + contracts-pin lines; the example slice reads `### Slice 1 — <the acceptance in one line>`
      started_at: · ended_at: · total: · check: · paths:
  - [ ] docs(schema): templates carry the v11 doctrines where drafting happens
        hash:

### Slice 3 — CHANGELOG records the law and the gates go green

- [ ] `CHANGELOG.md`: `## Unreleased` entry — retro drafts, titled acceptance, pinned contracts; instructions and templates only, walls untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` (vocabulary + parity) and `npm test` green — the real-YAML parse and the walkthrough are the deterministic proof of the escaping and the shape
      started_at: · ended_at: · total: · check: · paths:
  - [ ] docs(changelog): schema v11 recorded — retro drafts, titled acceptance, pinned contracts
        hash:

### Slice 4 — the registry remembers which artifact's verdict closed each spec *(surfaced at delivery: grants were per-artifact but validation was one change-level stamp written only at close, and approve granted the bearer past an open tick)*

### Slice 5 — close lints the ledger's own three walls before it stamps *(surfaced at delivery: the ledger laws — hash law, mirror law, the verdict's uniqueness and place — were prose-only, the confusion driver; the fuzzy prose rules stay out, they need declared shapes to lint honestly)*

## Verification

Deterministic: `diff` of the two `schema.yaml` copies empty · `diff` of each of the three template pairs empty · `just lint` holds vocabulary and parity · `npm test` green — schema suites (section pins untouched), the `openspec schemas` real-YAML parse, and the example walkthrough with all markers. The one human-only act: the verdict at execute — you judge each slice by its title alone (byte-parity diffable, hints readable, gates green) and tick; the commits are the walk's own by the law this plan binds.

## History

<!-- commit subjects land after the slice commits -->
