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
        hash: 85088b4

## Slice 2 — the receipt sidecar

- [x] `src/attribution.ts`: `appendAttributionReceipt` targets `changes/<slug>/.ledger` (mkdir-safe, same dedupe + tight block); undeclared-schema fallback behavior retires with the bearer concept
      started_at: 2026-11-12T13:48:00Z · ended_at: 2026-11-12T13:49:00Z · total: 1m · check: targetFile param gone; the sidecar is appender-owned · paths: src/attribution.ts
- [x] `src/gate.ts`: the receipt call passes the sidecar path; `receiptArtifactFor` loses its `x-receives-receipts` duty (verdict-line duty untouched)
      started_at: 2026-11-12T13:49:00Z · ended_at: 2026-11-12T13:50:00Z · total: 1m · check: receipt call = sidecar, no target; verdict bearer locates via x-verdict-line · paths: src/gate.ts
- [x] `src/schema.ts` + `schema.yaml`: `x-receives-receipts` retires from the parser key lists and the spec schema; version bumped; `x-verdict-line` and the execute verdict law untouched
      started_at: 2026-11-12T13:50:00Z · ended_at: 2026-11-12T13:52:00Z · total: 2m · check: key gone from parse/validation/type/defaults in BOTH mirrors (src + bin); example schema also caught up to v10 (Slice 1 drift absorbed); counter locates via x-completes · paths: src/schema.ts, bin/gate-lib.js, src/focus.ts, bin/eospec.js, openspec/schemas/spec/schema.yaml, example/openspec/schemas/spec/schema.yaml
- [x] `bin/eospec.js`: close names the sidecar (receipt count) in its output; the tick law still reads execute
      started_at: 2026-11-12T13:52:00Z · ended_at: 2026-11-12T13:53:00Z · total: 1m · check: `receipts: N` suffix on both close echoes; unticked check locates via verdict-line · paths: bin/eospec.js
- [x] tests: receipts land in `.ledger` and never in `4-execute.md`; dedupe holds across touches; close summary renders; parity lint vocabulary updated; README receipt section rewritten
      started_at: 2026-11-12T13:53:00Z · ended_at: 2026-11-12T13:55:00Z · total: 2m · check: residual scan = zero references; 192/192 green; parity holds; READMEs (root + example) rewritten · paths: test/*, README.md, example/README.md
- [x] CHANGELOG line; `just lint` and `npm test` green
      started_at: 2026-11-12T13:55:00Z · ended_at: 2026-11-12T13:55:00Z · total: <1m · check: Unreleased carries the sidecar law · paths: CHANGELOG.md
  - [ ] feat(gate): receipts land in a per-change sidecar — artifacts stay prose
        hash: 14713bd

## Slice 3 — the post-archive landing

- [x] `bin/eospec.js`: the `openspec archive` passthrough releases the aim when the room names the archived change (the close unlink law, mirrored); close already releases — output now also teaches the commit verbatim (`git add -A && git commit -m "chore(openspec): <slug> archived"`)
      started_at: 2026-11-12T13:56:00Z · ended_at: 2026-11-12T13:58:00Z · total: 2m · check: archive branch intercepts, filters the gate-side flag like the passthrough, releases on slug match, teaches on success; both close echoes teach · paths: bin/eospec.js
- [x] wrapper tests: bare archive releases a matching aim and keeps a foreign one; the teaching line renders on close and archive; passthrough argv untouched
      started_at: 2026-11-12T13:58:00Z · ended_at: 2026-11-12T14:00:00Z · total: 2m · check: 2 new tests + close-teaching pin; 194/194 green; README verb block teaches the archive surface (parity 7 verbs) · paths: test/pios-wrapper.test.ts, README.md
- [x] CHANGELOG line; `just lint` and `npm test` green
      started_at: 2026-11-12T14:00:00Z · ended_at: 2026-11-12T14:00:00Z · total: <1m · check: Unreleased carries the landing law · paths: CHANGELOG.md
  - [ ] fix(cli): archive releases the aim and teaches its commit
        hash: efb6cb5

## Slice 4 — the spawner contract

- [x] README: a "spawning children" section — the admission contract (the two hooks a spawner must claim), the `PI_SUBAGENT_DELEGATION` relay law, and the revisit trigger (gate-side admission when pi exposes child-parentage)
      started_at: 2026-11-12T14:00:00Z · ended_at: 2026-11-12T14:01:00Z · total: 1m · check: section sits before Schemas; hooks named, relay law named, revisit trigger named · paths: README.md
- [x] CHANGELOG line; `just lint` green
      started_at: 2026-11-12T14:01:00Z · ended_at: 2026-11-12T14:01:00Z · total: <1m · check: parity holds; suite green · paths: CHANGELOG.md
  - [ ] docs(readme): the spawner contract — what a child-spawner must claim
        hash: 60202d3

## Slice 5 — release

- [x] CHANGELOG: the four edges consolidated under the version header; `package.json` bumped (minor — the wall retired is a behavior change)
      started_at: 2026-11-12T14:01:00Z · ended_at: 2026-11-12T14:02:00Z · total: 1m · check: Unreleased → 1.3.0 — 2026-11-12; 1.2.0 → 1.3.0 · paths: CHANGELOG.md, package.json
- [x] README walk section mentions the sidecar and the taught commit
      started_at: 2026-11-12T14:02:00Z · ended_at: 2026-11-12T14:02:00Z · total: <1m · check: already landed — sidecar in the attributed bullet (Slice 2), taught commit in the archive verb line (Slice 3); nothing left to add · paths: README.md
- [x] `just lint` and `npm test` green
      started_at: 2026-11-12T14:02:00Z · ended_at: 2026-11-12T14:02:00Z · total: <1m · check: parity holds (7 verbs, 12 facts); 194/194 · paths: test/, src/
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
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-12T13:50:29Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-12T13:50:41Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/attribution.ts · at 2026-11-12T13:50:50Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-12T13:51:00Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:51:06Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:51:25Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:51:40Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-11-12T13:53:20Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-12T13:53:29Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-12T13:53:29Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/vocabulary.test.ts · at 2026-11-12T13:53:41Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/vocabulary.test.ts · at 2026-11-12T13:53:42Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-12T13:53:49Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/example.test.ts · at 2026-11-12T13:53:49Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/example.test.ts · at 2026-11-12T13:53:50Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-12T13:54:03Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/example/README.md · at 2026-11-12T13:54:09Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T13:54:19Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/focus.ts · at 2026-11-12T13:54:40Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-12T13:54:40Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-12T13:54:40Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:54:47Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:55:12Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:55:40Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:56:35Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:56:48Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-12T13:57:01Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-12T13:57:20Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-12T13:57:22Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T13:57:31Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T13:57:33Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:57:42Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T13:57:44Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-12T13:59:21Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-12T14:00:07Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:00:11Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:00:43Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-12T14:00:57Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-12T14:01:13Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T14:01:18Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:01:20Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:01:48Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T14:01:58Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-11-12T14:01:58Z
  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-12T14:02:06Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:02:10Z
  gate-attributed · tool: bash · paths: — · at 2026-11-12T14:02:33Z
