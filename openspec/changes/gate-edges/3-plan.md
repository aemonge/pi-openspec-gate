# Plan

> Spec: gate-edges · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

180–260 changed lines across ~12 files. Stage-zero (Slice 1): ~40–60 — `src/gate.ts` (the void branch becomes fact+pass; the void block copy dies), `openspec/schemas/spec/schema.yaml` (brainstorm takes `x-unlocks: [research]`, version bump), `src/gate.test.ts` void pins, CHANGELOG. Sidecar (Slice 2): ~80–120 — `src/attribution.ts` (append target becomes `changes/<slug>/.ledger`), `src/gate.ts` (receipt target resolution simplifies), `src/schema.ts` + `schema.yaml` (`x-receives-receipts` retires), `bin/eospec.js` (close names the receipt count), tests, parity lint, README. Post-archive (Slice 3): ~30–50 — `bin/eospec.js` (archive passthrough releases the aim; the commit teaching line), `test/pios-wrapper.test.ts`. Contract (Slice 4): ~20–30 — README only. Release (Slice 5): version + CHANGELOG. Confidence: high — every target was enumerated in investigate; all four edges are law removal or law relocation, not new mechanisms.

## Skills

bare — gate-law surgery in this repo's own TypeScript again; no sanctioned skill covers it.

## Workflow

Committed routes, exactly one per edge:

- **Edge A → A1, explicit human step, formalized.** The close/archive output teaches the commit verbatim; the archive passthrough releases the aim (the dangling fix is hygiene inside A1, not a window). A2 lost: it rebirths a time-boxed latch — the species of mechanism buried with the pause spec (2026-11-12). A3 lost: the gate owning a human ritual must never mis-fire a message or a path, and the fast-track doctrine already makes the human terminal sovereign.
- **Edge B → B1+B3, composed.** Per-change `changes/<slug>/.ledger` receives receipts; the verdict tick stays in execute (`x-verdict-line` untouched). B2 lost: one central stream breaks the per-change purity that motivated the sidecar (multi-hop). Pure B3 lost: execute stays a mixed document — the compose is the pair investigate flagged.
- **Edge C → C2, spawner-side contract, documented.** README names the admission contract (`registerRequiredChildExtensions`, `registerSubagentCapabilityCeiling`, the `PI_SUBAGENT_DELEGATION` relay law). C1 lost: child-parentage detection needs a signal pi does not expose — the same upstream wall that buried the pause spec; revisit when it opens. C3 alone lost: it is C2 minus the documentation, and the ruling (keep for strength) is only served by publishing the contract.
- **Edge D → D1, minimal retirement.** The void branch writes `research-void` and passes; brainstorm takes `x-unlocks: [research]`. D2 lost: a config knob built without a request, declined by ruling (2026-11-12).

## Slices

### Slice 1 — stage-zero research flows as fact

- [ ] `src/gate.ts`: the `research-void` branch writes the fact and returns undefined (pass); the void block copy (`research window closed — no active change`) and its builder retire; the aimed-without-grant branch keeps its teeth (that window still means "work the ladder")
      started_at: · ended_at: · total: · check: · paths:
- [ ] `openspec/schemas/spec/schema.yaml`: brainstorm takes `x-unlocks: [research]`; schema version bumped per house convention
      started_at: · ended_at: · total: · check: · paths:
- [ ] `src/gate.test.ts`: void-block pins die; pins assert pass-plus-fact (inside a root, no aim) and pass-silent (no root); the aimed-early block still blocks
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line under Unreleased
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(gate): research flows as fact — the wall retires at stage zero
        hash:

### Slice 2 — the receipt sidecar

- [ ] `src/attribution.ts`: `appendAttributionReceipt` targets `changes/<slug>/.ledger` (mkdir-safe, same dedupe + tight block); undeclared-schema fallback behavior retires with the bearer concept
      started_at: · ended_at: · total: · check: · paths:
- [ ] `src/gate.ts`: the receipt call passes the sidecar path; `receiptArtifactFor` loses its `x-receives-receipts` duty (verdict-line duty untouched)
      started_at: · ended_at: · total: · check: · paths:
- [ ] `src/schema.ts` + `schema.yaml`: `x-receives-receipts` retires from the parser key lists and the spec schema; version bumped; `x-verdict-line` and the execute verdict law untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] `bin/eospec.js`: close names the sidecar (receipt count) in its output; the tick law still reads execute
      started_at: · ended_at: · total: · check: · paths:
- [ ] tests: receipts land in `.ledger` and never in `4-execute.md`; dedupe holds across touches; close summary renders; parity lint vocabulary updated; README receipt section rewritten
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line; `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(gate): receipts land in a per-change sidecar — artifacts stay prose
        hash:

### Slice 3 — the post-archive landing

- [ ] `bin/eospec.js`: the `openspec archive` passthrough releases the aim when the room names the archived change (the close unlink law, mirrored); close already releases — output now also teaches the commit verbatim (`git add -A && git commit -m "chore(openspec): <slug> archived"`)
      started_at: · ended_at: · total: · check: · paths:
- [ ] wrapper tests: bare archive releases a matching aim and keeps a foreign one; the teaching line renders on close and archive; passthrough argv untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line; `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] fix(cli): archive releases the aim and teaches its commit
        hash:

### Slice 4 — the spawner contract

- [ ] README: a "spawning children" section — the admission contract (the two hooks a spawner must claim), the `PI_SUBAGENT_DELEGATION` relay law, and the revisit trigger (gate-side admission when pi exposes child-parentage)
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line; `just lint` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] docs(readme): the spawner contract — what a child-spawner must claim
        hash:

### Slice 5 — release

- [ ] CHANGELOG: the four edges consolidated under the version header; `package.json` bumped (minor — the wall retired is a behavior change)
      started_at: · ended_at: · total: · check: · paths:
- [ ] README walk section mentions the sidecar and the taught commit
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] chore(release): v1.3.0 — four edges ship
        hash:

## Verification

Deterministic: `just lint` (vocabulary + parity hold) · `npm test` (gate, wrapper, schema suites green) · a fixture walk: inside a root with no aim, a research call passes leaving a `research-void` fact; with gate-edges aimed at brainstorm, the same call attributes; receipts append to `.ledger` while `4-execute.md` stays untouched; a bare `openspec archive` releases a matching aim. The one human-only act: the walk's own archival commit — by the law this walk ships, it lands on your terminal; close teaches it and you watch the teaching work.

## History

<!-- commit subjects land after the slice commits -->
