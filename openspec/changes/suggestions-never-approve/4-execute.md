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
- [x] feat(gate): next — the uniform step act for verb-less schemas
      hash: 93bc012

## Slice 2 — no surface names approve for a step

- [x] State-aware BLOCK_UNAPPROVED / BLOCK_ARCHIVE — gated: declared verb, else next; legacy: approve verbatim
      started_at: 14:18 · ended_at: 14:24 · total: 6m · check: gated blocks advance by next/verb and never name approve; no-schema change keeps the byte-matched approve copy · paths: src/gate.ts
- [x] `blockArtifactApproval` verb-less branch → `pios-gate next ${slug}`
      started_at: 14:24 · ended_at: 14:26 · total: 2m · check: phase-gate copy test asserts the next remedy · paths: src/gate.ts, test/phasegate.test.ts
- [x] Tests: gated blocks never name approve and the remedy runs; legacy blocks byte-identical
      started_at: 14:26 · ended_at: 14:33 · total: 7m · check: 162/162, lint holds, try.sh 11/11 · paths: test/approval.test.ts
      catch #2: vocabulary law caught 'rung' in a new comment (self-enforcing law, red-green); catch #3: writeChangeMeta is a set-only merge — a reused slug leaked granted: brief across tests; per-test slugs
- [x] Docs: README command table + suggestion-law paragraph; CHANGELOG Unreleased
      started_at: 14:33 · ended_at: 14:36 · total: 3m · check: table gains next row; touch-guard list gains next · paths: README.md, CHANGELOG.md
- [ ] fix(gate): step suggestions speak the schema's act — verb, else next
      hash: 483cddb

## Slice 3 — gate-owned help *(human ruling 2026-11-04: "No debt, fix now")*

- [x] Bare `pios-gate`, `help`, `--help`, `-h` print the gate's own usage — never openspec's banner; unknown verbs keep the passthrough
      started_at: 14:52 · ended_at: 14:58 · total: 6m · check: all four forms exit 0 with gate usage, no forward; unknown verb still execs openspec · paths: bin/pios-gate.js, test/pios-wrapper.test.ts
- [x] README help row; debt entry retired as fixed (same-day, human ruling cited)
      started_at: 14:58 · ended_at: 15:01 · total: 3m · check: catch #4 closed in openspec/learnings/debt.md · paths: README.md, openspec/learnings/debt.md
      catch #4: bare ./bin/pios-gate answered as openspec — tripped live by the human during validation; first routed to debt, overruled, fixed in-scope
- [ ] feat(gate): help — the gate introduces itself
      hash:
- [ ] Human validation

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

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:54:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:54:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-04T13:54:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-04T13:54:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T13:55:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T13:55:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T13:55:36Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T13:55:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:55:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:55:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:56:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:56:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:57:23Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T13:57:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:57:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:57:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:57:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:57:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:58:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:59:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:59:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:59:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T13:59:34Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T14:00:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T14:00:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:00:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:00:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:01:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:01:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-04T14:01:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-04T14:01:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:01:11Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:01:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:01:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:01:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:02:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:02:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:02:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:02:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:03:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:03:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:16:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:16:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:16:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:16:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:26:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:26:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:26:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:26:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:29:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:29:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:29:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:29:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/.gitignore · at 2026-11-04T14:29:54Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/.gitignore · at 2026-11-04T14:29:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:32:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:32:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T14:38:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T14:38:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T14:38:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T14:38:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:38:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T14:38:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:38:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:38:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:39:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:39:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:39:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T14:39:30Z
