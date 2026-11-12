# Execute

> Spec: gate-edges · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — stage-zero research flows as fact

- [x] `src/gate.ts`: the `research-void` branch writes the fact and returns undefined (pass); the void block copy (`research window closed — no active change`) and its builder call retire; the aimed-without-research-grant branch keeps its teeth (that window still means "work the ladder")
      started_at: 2026-11-12T13:39:00Z · ended_at: 2026-11-12T13:42:00Z · total: 3m · check: void branch = fact+pass; aimed branch byte-identical · paths: src/gate.ts
- [x] `openspec/schemas/spec/schema.yaml`: brainstorm takes `x-unlocks: [research]`; schema version bumped per house convention
      started_at: 2026-11-12T13:42:00Z · ended_at: 2026-11-12T13:44:00Z · total: 2m · check: v9→v10; flow description now names research at brainstorm · paths: openspec/schemas/spec/schema.yaml
- [x] `src/gate.test.ts`: void-block pins die; pins assert pass-plus-fact (inside a root, no aim) and pass-silent (no root); the aimed-early block still blocks
      started_at: 2026-11-12T13:44:00Z · ended_at: 2026-11-12T13:46:00Z · total: 2m · check: 192/192 green; pass-silent (no root) was already pinned in phasegate.test.ts:109 · paths: test/phasegate.test.ts
- [x] CHANGELOG line under Unreleased
      started_at: 2026-11-12T13:46:00Z · ended_at: 2026-11-12T13:47:00Z · total: 1m · check: Unreleased section opened; renamed to 1.3.0 at release slice · paths: CHANGELOG.md
- [x] `just lint` and `npm test` green
      started_at: 2026-11-12T13:46:00Z · ended_at: 2026-11-12T13:47:00Z · total: 1m · check: parity holds (6 verbs, 12 facts); vocabulary law holds; 192 pass / 0 fail · paths: test/, src/
  - [ ] feat(gate): research flows as fact — the wall retires at stage zero
        hash:

## Slice 2 — the receipt sidecar

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

## Slice 3 — the post-archive landing

- [ ] `bin/eospec.js`: the `openspec archive` passthrough releases the aim when the room names the archived change (the close unlink law, mirrored); close already releases — output now also teaches the commit verbatim (`git add -A && git commit -m "chore(openspec): <slug> archived"`)
      started_at: · ended_at: · total: · check: · paths:
- [ ] wrapper tests: bare archive releases a matching aim and keeps a foreign one; the teaching line renders on close and archive; passthrough argv untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line; `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] fix(cli): archive releases the aim and teaches its commit
        hash:

## Slice 4 — the spawner contract

- [ ] README: a "spawning children" section — the admission contract (the two hooks a spawner must claim), the `PI_SUBAGENT_DELEGATION` relay law, and the revisit trigger (gate-side admission when pi exposes child-parentage)
      started_at: · ended_at: · total: · check: · paths:
- [ ] CHANGELOG line; `just lint` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] docs(readme): the spawner contract — what a child-spawner must claim
        hash:

## Slice 5 — release

- [ ] CHANGELOG: the four edges consolidated under the version header; `package.json` bumped (minor — the wall retired is a behavior change)
      started_at: · ended_at: · total: · check: · paths:
- [ ] README walk section mentions the sidecar and the taught commit
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] chore(release): v1.3.0 — four edges ship
        hash:

<!-- gate receipts land here while work runs; per-Slice H2s mirror the Plan's H3s -->
<!-- findings surfaced while delivering? append the small ones as new Slices here —
     same tasks + commit-hash law; one-line amendment in the Plan's Slices; the
     verdict waits until they land. surfaced: routes binary — slice ·
     → post-delivery (the fifth designs the too-big ones inside this change;
     deferred parks through it). Post-close findings open their own change. -->

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:47:31Z
