# Execute

> Spec: suggestions-never-approve · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — `next`: the uniform act

- [x] `grantHint` fallback → `pios-gate next ${slug}`; cockpit, inspect, in-sequence error inherit
      started_at: 13:41 · ended_at: 13:43 · total: 2m · check: contract test asserts verb/next, never approve · paths: bin/gate-lib.js
- [x] `pios-gate next <slug>` command — first ungranted in declared sequence, loud refusals, bin header line
      started_at: 13:43 · ended_at: 13:47 · total: 4m · check: walk/undrafted/no-schema/ungated/all-granted refusals live in wrapper tests · paths: bin/pios-gate.js
- [x] RESERVED_WORDS += `next` (src + bin twins); APPROVAL_TOUCH_RESERVED += `next`
      started_at: 13:47 · ended_at: 13:49 · total: 2m · check: schema declaring x-grant-verb next throws on both parsers; touch guard blocks the invocation · paths: src/schema.ts, bin/gate-lib.js, src/gate.ts
- [x] Tests: grantHint fallback, next stamps/refuses (all-granted, legacy ×2), reserved-word validation, touch guard
      started_at: 13:49 · ended_at: 14:12 · total: 23m · check: 159/159, lint holds, try.sh 11/11 · paths: test/pios-wrapper.test.ts, test/schema.test.ts, test/gate.test.ts
      catch #1: suite was already red on main — 8 stale tests from 3a08b97's schema v4 rewrite (mission retired, six-verb spec gone) repaired to v4 in-scope; caught at first npm test
- [ ] feat(gate): next — the uniform step act for verb-less schemas
      hash:

## Slice 2 — no surface names approve for a step

- [ ] State-aware BLOCK_UNAPPROVED / BLOCK_ARCHIVE — gated: declared verb, else next; legacy: approve verbatim
      started_at: · ended_at: · total: · check: · paths:
- [ ] `blockArtifactApproval` verb-less branch → `pios-gate next ${slug}`
      started_at: · ended_at: · total: · check: · paths:
- [ ] Tests: gated blocks never name approve and the remedy runs; legacy blocks byte-identical
      started_at: · ended_at: · total: · check: · paths:
- [ ] Docs: README command table + gate-verb row; CHANGELOG Unreleased
      started_at: · ended_at: · total: · check: · paths:
- [ ] fix(gate): step suggestions speak the schema's act — verb, else next
      hash:

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T13:40:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T13:41:32Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T13:41:32Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:41:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:42:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:42:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-11-04T13:42:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-11-04T13:42:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:42:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:42:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:43:00Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:43:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:43:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:44:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:44:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:45:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:45:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:46:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:46:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:47:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T13:47:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:48:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T13:48:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:48:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:48:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:48:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:48:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:49:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:49:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:49:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T13:49:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:49:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:49:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:50:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:50:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:51:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:51:31Z
