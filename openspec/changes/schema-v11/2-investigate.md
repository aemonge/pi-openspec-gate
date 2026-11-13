# Investigate

> Spec: schema-v11 · aim at the Brainstorm's Questions · drafted retroactively — the conversation carried most of this walk; findings below journal it with sources, nothing re-run

## Findings

### which pins must move with v11 — none

- `test/schema.test.ts:270-274` pins the brainstorm sections to `['Pain',
  'Questions']` — v11 changes no `x-sections`, so the pin holds.
- `test/schema.test.ts:296-314` (bin≡src parity) projects ids, gates,
  unlocks, sections, verdict — instruction text is not projected, so
  instruction edits break nothing on either parser.
- The one hard constraint: `test/example.test.ts:62-68` parses the
  shipped schema under **real YAML** (`openspec schemas`) — the
  instructions are single-quoted block scalars, so every apostrophe in
  the new wording must be `''`-escaped (live-caught class: unescaped
  quotes broke `openspec new change` while tests stayed green).
- `example/try.sh:57` (`md()`) writes its own artifact content in the
  walkthrough — it never copies the templates, and its markers assert
  gate refusals, not template text. Template edits cannot break the
  walkthrough.
- Vocabulary lint (`justfile:7-9`) greps `src/ test/ config.json
  index.ts` and `src/ bin/ index.ts config.json` — the `openspec/` and
  `example/` trees sit outside its scope.

### execute — the mirror law carries the title, one clause makes it self-contained

- The execute instruction already says "one H2 per Slice (mirroring the
  Plan's H3s)" and the verdict answers `response · outcome · surfaced`
  (`openspec/schemas/spec/schema.yaml`, execute artifact). Once Plan
  declares the title as the slice's acceptance, the mirrored H2 *is*
  that acceptance in the ledger.
- Decision: one clause in execute's instruction ("the mirrored title is
  the slice's acceptance — the plan declared it; the validation's
  `outcome:` answers it"), no template change — the template comment
  is already at its leanest.

### post-delivery — the law already carries the discipline

- Its H2 names *the finding* (observed, one line), and `route:` names
  the design — the outcome-shaped promise lives there
  (`schema.yaml`, post-delivery instruction; `5-post-delivery.md`
  template). Small findings that append as execute slices inherit the
  slice-title law automatically. No echo needed.

### ship-shape inventory

- Both `schema.yaml` copies (live `openspec/` + shipped `example/`):
  brainstorm retro clause — with "the common case" softened (a shipped
  example must not claim retro drafting is *the* way; wording: "drafted
  retroactively — the conversation already researched —"), investigate
  retro-journal sentence, plan title-as-acceptance + contracts-home
  clauses, `version: 10 → 11`.
- Templates, both copies: `1-brainstorm.md` — one merged comment block
  (the example copy currently stacks two — the only template pair that
  differs today, per `diff -rq`); `2-investigate.md` — retro hint line;
  `3-plan.md` — Slices comment gains title-as-acceptance + contracts
  pin. `4-execute.md`/`5-post-delivery.md` untouched.
- README: no change — its Schemas section documents the *gates*, not
  drafting doctrine (`README.md:84-96`); the example users copy carries
  the doctrines in its instructions.
- CHANGELOG: entry under a new `## Unreleased` (gate-edges consolidated
  into the version header at release — same shape).

### the instructions are the only shape carriers

- `openspec new change` scaffolds no artifact files (observed live,
  2026-11-13: the new change dir held only `.openspec.yaml`) — the
  drafting agent reads the instruction + template as the whole law, and
  the gate checks sections at birth only for approval-gated artifacts.
  The wording must therefore be self-sufficient, not a pointer.

## External practice — the web check (2026-11-13, research window)

**retro drafting — sound, and the honesty markers are the known cure.**
The failure mode is named in the literature: retro documentation
written "as if the development were rational" is the classic fiction
(UWaterloo, *Advice on Documentation: Faking It*); documentation fiction
"wastes developer time and erodes trust" (GM-RKB, *Documentation Fiction
Pattern*); docs fail when they prescribe aspiration instead of
describing state (Adam Ard, *Good Docs Describe, Bad Docs Prescribe*).
Exactly the pretend-open-questions failure v11 kills — the
`answered — <one line · source>` marker makes the retro brainstorm
describe what happened. The intent/describe split is also practiced:
*The Spec That Shrinks* (holdex, 2026) separates unshipped intent from
shipped behavior wired into the PR process — the Plan/Execute
architecture. One honest tension: the describe-not-prescribe school
distrusts intent-first docs generally; the ladder survives it because
Execute converts all prose to the hash-evidenced ledger — the wall keeps
the fiction out, the markers keep the prose honest.

**title-as-acceptance — the mechanical compression of standard agile
practice.** INVEST's Small and Testable (Bill Wake, XP123 2003: above a
certain size "it seems to be too hard to know what's in the story's
scope") backs "can't state it in a title → two slices". Splitting
stories *on acceptance criteria* is named practice (tobeagile 2022:
"if there are multiple acceptance criteria, it usually means the user
wants something different"); good criteria are binary and testable
(Nomad8) — our "observable outcome, checkable by the human"; and the
criteria are "agreed before the work starts rather than argued about at
the review" (anatomyit, 2026) — precisely the gap (the human re-deriving
done from implementation tasks) the titled slice closes.

**contracts home — plan-as-design-doc is Google practice; drift-as-
finding is the conformity rule.** Design Docs at Google
(industrialempathy, 2020) pin the design — APIs included — before code,
reviewed early "when it's easiest to make changes" (Pragmatic Engineer
2022: RFCs carry explicit API sections). Contract-first OpenAPI is
standard doctrine: the spec is the source of truth, server and SDKs
conform, and code-first "works until the annotations drift" (PgBeam,
2026). The kill line for our clause: "a spec written first and then
left to drift is only early documentation" (OneEnv, 2026) — Plan's
"code matches, drift is a finding" is that rule in walk language.

## Alternatives

None genuine — every route converged with evidence above; manufacturing
a loser would be lying, not research.
