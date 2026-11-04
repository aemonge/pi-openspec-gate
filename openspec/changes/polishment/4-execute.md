# Execute

> Spec: polishment · state legend: [ ] open · [x] done · ~ skipped

## Slice 0 — bench cleanup *(done at batch birth)*

- [x] Five stale changes resolved: state-aware-remedies + cli-schema-tag-parity archived, pause-window/terminal-only-approvals killed, gate-spanned-agents to debt
      started_at: 15:02 · ended_at: 15:12 · total: 10m · check: bench shows polishment alone · paths: openspec/changes/, openspec/learnings/debt.md
- [x] chore(openspec): bench cleanup — fossils archived (3dfae5f, 567260f, human-run)
      hash: 3dfae5f,567260f
- [x] Human-executed — every cleanup command run in the human's terminal (the guard counts the verdict line; this slice's receipt is the human's own hands)

## Slice 1 — pause: the time-boxed yield

- [x] Verify the session-file channel, then arm the permit: latch on human message, terminal verb, resume, ceiling, reserved surfaces
      started_at: 15:20 · ended_at: 15:34 · total: 14m · check: channel verdict — pi exposes no session-id API, so the terminal verb follows the focus precedent (teaching door) and the chat reply arms; deviation recorded to debt · paths: src/gate.ts, src/config.ts, src/schema.ts, bin/gate-lib.js, bin/pios-gate.js
- [x] The yield: permit after touch guard, before the five teeth; FACT entries; in-session visibility
      started_at: 15:34 · ended_at: 15:38 · total: 4m · check: armed/expired/resumed facts land; touch guard stays absolute; unaccounted stays refused (shape A) · paths: src/gate.ts, src/facts.ts
      catch #6: plan cut — pendingReport countdown is impossible from the CLI (the permit lives in the session; same boundary as arming); visibility is the in-session pause.v1 fact instead · catch #7: external arming (`pios-gate pause` reaching the live session) needs a pi session-id API — parked in debt.md
- [x] Tests: latch grammar, ceiling, expiry, resume, touch guard while paused, unaccounted stays, teaching verb
      started_at: 15:38 · ended_at: 15:44 · total: 6m · check: 166/166, lint holds · paths: test/approval.test.ts, test/schema.test.ts, test/pios-wrapper.test.ts
- [ ] feat(gate): pause — a time-boxed yield with the clock on the wall
      hash:
- [ ] Human validation

## Slice 2 — focus-lifecycle: the fence knows the archive

- [x] Dangling focus names itself in the unaccounted block
      started_at: 15:44 · ended_at: 15:46 · total: 2m · check: focus on a moved change renders the dangling line + re-aim · paths: src/gate.ts
- [x] Bash-exemption task REFRAMED: exemptions.ts excludes bash from path exemptions by construction (documented law), so the live block was correct behavior, not a gap; test pins the law, no code change
      started_at: 15:47 · ended_at: 15:52 · total: 5m · check: bash-staged openspec paths block under unapproved focus, by law · paths: test/approval.test.ts (catch #8: the premise was wrong — matcher law, not bug; premise-built path-join reverted)
- [x] Tests: dangling-focus remedy, bash-never-exempt law, non-openspec bash same block
      started_at: 15:52 · ended_at: 15:55 · total: 3m · check: 168/168, lint holds, try 11/11 · paths: test/approval.test.ts
- [x] fix(gate): the fence knows the archive — dangling focus named, bash law pinned
      hash: 243ff57
- [ ] Human validation

## Slice 3 — the wrapper keeps gate-side flags off openspec's argv

- [x] Passthrough strips `--i-am-the-human` before `spawnSync`
      started_at: 15:57 · ended_at: 15:59 · total: 2m · check: the argv forwards verbatim minus the gate-side flag · paths: bin/pios-gate.js
- [x] Tests: flag stripped, guard still fires without it
      started_at: 15:59 · ended_at: 16:01 · total: 2m · check: 169/169, lint holds · paths: test/pios-wrapper.test.ts
- [x] Docs: README pause row + pause paragraph; CHANGELOG polishment entry
      started_at: 16:01 · ended_at: 16:03 · total: 2m · check: command table + approvals section + Unreleased · paths: README.md, CHANGELOG.md
- [x] fix(gate): the escape hatch survives its own exec
      hash: 468c52d
- [ ] Human validation

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/config.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/config.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/facts.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/facts.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:25:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-04T15:25:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:25:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:25:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:25:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:25:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T15:26:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:26:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:26:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:26:57Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:26:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:27:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:27:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:27:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:28:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:28:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:28:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:28:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:28:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:28:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:29:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:29:04Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:29:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:29:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:29:54Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:29:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:29:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:29:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:30:19Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:30:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:31:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-04T15:31:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:31:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:31:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:31:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:31:46Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:32:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:32:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:32:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:32:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:32:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:32:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:33:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-11-04T15:33:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:33:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:33:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:34:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:34:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:34:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-11-04T15:34:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T15:34:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-04T15:34:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:34:19Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:34:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T15:34:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-11-04T15:34:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-04T15:34:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/CHANGELOG.md · at 2026-11-04T15:34:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:35:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:35:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:35:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:35:28Z
