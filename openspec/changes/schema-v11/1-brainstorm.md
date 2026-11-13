# Brainstorm

> Spec: schema-v11 · consult `openspec/learnings/` before drafting

## Pain

Walks here start in conversation — research happens before any spec exists — and the retro-drafted Brainstorm must then pretend questions are open that the conversation already answered, while the findings it harvested wait homeless until Investigate. A Slice's title names a topic, not a promise, so the per-slice human validation re-derives "done" from implementation checkboxes and the verdict sums impressions. Interface agreements — function signatures, arg/return shapes, JSON contracts — are pinned nowhere in the flow and drift into code comments after the fact.

## Questions

**retro drafting**
- answered — Is new engine machinery needed to make retro drafts honest? — No: the Brainstorm drafts free (no x-requires-approval, no at-birth section check) and Investigate is free-form, so the doctrine rides instructions and templates (read 2026-11-13: src/gate.ts phase-gates, schema.yaml).
- open — Which pins must move with the wording — schema.test.ts's brainstorm-section pin, example.test.ts's parser mirrors, the vocabulary lint's scope?

**slice acceptance**
- answered — Do Slices need an `ac:` field or section? — No: the Slice title states its acceptance — outcome-shaped like the commit subject; title = acceptance = commit subject, one sentence at three altitudes, carried into Execute's mirror for free (read 2026-11-13: gate-edges 3-plan.md/4-execute.md).
- open — Does Execute need its own wording so the mirrored title reads as the acceptance the human validation checks, or does the mirror law already carry it?
- open — Does post-delivery's finding-title law already satisfy the same outcome discipline, or does it need the clause echoed?

**contracts**
- answered — Do interface agreements need a new section? — No: Plan is declared "the only home for implementation thinking"; one clause pins signatures and JSON shapes under the Slice that delivers them, referenced by Execute, matched by code (read 2026-11-13: schema.yaml plan instruction).

**ship shape**
- open — What exactly moves: both schema copies (openspec/ + example/) in byte parity, version 10 → 11, the two templates' comment blocks merged (the example copy currently stacks two), the investigate retro-journal sentence — and does the README's walk section need the doctrines named?
- open — Does "the common case" overclaim in a shipped example where cold-start specs are equally normal, and what wording keeps it honest?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
One schema-data walk, v10 → v11 — both copies in parity, no src/ keys, no new sections. Investigate gains the retro-journal sentence; Plan gains title-as-acceptance and contracts-home; Execute and post-delivery only if the read says the law doesn't already carry the discipline. The strictness walls stay untouched: brainstorm drafts free, research windows and approval teeth unchanged.
