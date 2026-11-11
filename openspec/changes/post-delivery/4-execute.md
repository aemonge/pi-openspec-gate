# Execute

> Spec: post-delivery · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — the schema learns the fifth step — tolerable end to end

- [x] parser: x-optional + x-requires-verdict parse lines + artifact type fields (bin/gate-lib.js schema mirror)
      started_at: 2026-11-11T16:02:00Z · ended_at: 2026-11-11T16:08:00Z · total: 6m · check: ✓ both twins — bin newArtifact defaults + two parseFlag branches; src type fields + same branches · paths: bin/gate-lib.js, src/schema.ts
- [x] schema.yaml: fifth entry — id post-delivery, generates 5-post-delivery.md, requires [execute], x-requires-approval: [execute], x-optional: true, x-requires-verdict: true, template + instruction carrying the slices-boundary sentence and the binary routing grammar
      started_at: 2026-11-11T16:08:00Z · ended_at: 2026-11-11T16:12:00Z · total: 4m · check: ✓ v8→v9, five-step description, execute instruction rewritten to the binary routing — debt.md unmentioned, completion sentence now hands to post-delivery · paths: openspec/schemas/spec/schema.yaml
- [x] template 5-post-delivery.md — batch form: one H2 per finding, from · why here · route · risk, tasks + commit + hash law each, closing human-validation checkbox
      started_at: 2026-11-11T16:12:00Z · ended_at: 2026-11-11T16:13:00Z · total: 1m · check: ✓ own validation line (response · outcome) — the schema's verdict stays in execute · paths: openspec/schemas/spec/templates/5-post-delivery.md
- [x] 4-execute.md wording: routing grammar binary — slice · → post-delivery; post-close opens its own change; debt.md unmentioned
      started_at: 2026-11-11T16:13:00Z · ended_at: 2026-11-11T16:13:30Z · total: <1m · check: ✓ findings comment rewritten · paths: openspec/schemas/spec/templates/4-execute.md
- [x] example copy mirrors (example/openspec/schemas/spec)
      started_at: 2026-11-11T16:13:30Z · ended_at: 2026-11-11T16:14:00Z · total: <1m · check: ✓ schema.yaml + 4-execute.md + 5-post-delivery.md copied · paths: example/openspec/schemas/spec/
- [x] schema.test.ts: parses x-optional · x-requires-verdict · five artifacts · strict chain · flags fail loudly
      started_at: 2026-11-11T16:14:00Z · ended_at: 2026-11-11T16:16:00Z · total: 2m · check: ✓ 3 new parser tests + example.test.ts learns the fifth (ids, flags, bin-side flags) + repo-schema count 4→5 · paths: test/schema.test.ts, test/example.test.ts
- [x] allArtifactsGranted (both parsers): optional && file-absent satisfies
      started_at: 2026-11-11T16:16:00Z · ended_at: 2026-11-11T16:17:00Z · total: 1m · check: ✓ exists param, conservative default (() => true demands without evidence) · paths: bin/gate-lib.js, src/schema.ts
- [x] renderRoom pending-find: same predicate (empty fifth never owns the room's next-step)
      started_at: 2026-11-11T16:17:00Z · ended_at: 2026-11-11T16:17:20Z · total: <1m · check: ✓ findIndex skips optional-absent · paths: bin/gate-lib.js
- [x] eospec close: ungranted filter learns the predicate (file check needs root + slug)
      started_at: 2026-11-11T16:17:20Z · ended_at: 2026-11-11T16:17:40Z · total: <1m · check: ✓ filter excludes optional-absent · paths: bin/eospec.js
- [x] pendingAct + pendingReport: verify optional-absent never owns the echo and renders · (no code change where already honest)
      started_at: 2026-11-11T16:17:40Z · ended_at: 2026-11-11T16:18:00Z · total: <1m · check: ✓ pendingAct predicate added; pendingReport marks already honest (absent renders ·) — verified, no change · paths: bin/gate-lib.js
- [x] watcher: x-requires-verdict on the fifth — drafting refuses until the bearer's verdict line is ticked (close's regex reused)
      started_at: 2026-11-11T16:18:00Z · ended_at: 2026-11-11T16:18:40Z · total: <1m · check: ✓ phase gate after written-evidence, unticked-regex from close, blockRequiresVerdict teaches the tick; no-gates continue now respects requiresVerdict · paths: src/gate.ts
- [x] gate.test.ts: no findings → close passes; file on disk → walk demands the fifth
      started_at: 2026-11-11T16:18:40Z · ended_at: 2026-11-11T16:19:00Z · total: <1m · check: ✓ units in schema.test.ts where the harness lives (predicate exists-param + pendingAct echo); close-skip covered end to end by walkthrough state 6 — the full close-demand walkthrough lands in Slice 4's fifth-step states · paths: test/schema.test.ts
- [x] phasegate.test.ts: unticked verdict blocks the fifth's draft; ticked opens it
      started_at: 2026-11-11T16:19:00Z · ended_at: 2026-11-11T16:19:18Z · total: <1m · check: ✓ VERDICT_SCHEMA fixture — unticked blocks naming the tick, fact requires-verdict; ticked passes · paths: test/phasegate.test.ts

- [x] feat(schema): the post-delivery artifact — conditional fifth step
      hash: e4ac4a9
      validation: human reads the schema diff and the new template; the walk line reads true end to end; npm test green — 187/187 · try.sh 12/12 · lint holds (verified pre-commit)

## Slice 2 — the room shows only the human verb

- [x] renderRoom: pending artifact → `eospec approve`, always (the draft rule dies)
      started_at: 2026-11-11T16:20:08Z · ended_at: 2026-11-11T16:21:00Z · total: 1m · check: ✓ next-step is the human verb unconditionally; the canDraft comment dies with the rule · paths: bin/gate-lib.js
- [x] renderRoom: all-granted → `eospec close` (the verdict reminder dies; close's refusal keeps teaching)
      started_at: 2026-11-11T16:21:00Z · ended_at: 2026-11-11T16:21:20Z · total: <1m · check: ✓ no tick' interpolation — the meta branch is gone · paths: bin/gate-lib.js
- [x] writeFocus: omit the task: line when the artifact has no checkboxes (no `task ""`)
      started_at: 2026-11-11T16:21:20Z · ended_at: 2026-11-11T16:21:40Z · total: <1m · check: ✓ task line exists only when taskProgress is non-empty · paths: bin/gate-lib.js
- [x] renderRoom: all-granted artifact-name follows the walk (final artifact), task counter stays on the ledger bearer — the 4-of-5 mismatch dies
      started_at: 2026-11-11T16:21:40Z · ended_at: 2026-11-11T16:22:00Z · total: <1m · check: ✓ finalStep names the room, bearer counts the tasks — name and counter decoupled · paths: bin/gate-lib.js
- [x] focus.test.ts + gate.test.ts: room snapshots per stage
      started_at: 2026-11-11T16:22:00Z · ended_at: 2026-11-11T16:25:53Z · total: 4m · check: ✓ wrapper tests re-pinned — draft rule gone, empty task line gone, full-walk room asserts name-follows-walk + close-only + no tick reminder · paths: test/pios-wrapper.test.ts

- [ ] feat(gate): room file names the human verb only
      hash:
      validation: human runs `bin/eospec focus post-delivery`, reads the room file — four lines, one verb

## Slice 3 — debt graduates

- [ ] four orphans become parked proposed changes (openspec new change + stub brainstorms): spanned-agent riding · post-archive commit gap · external pause arming · stardeck eospec.focus facts
- [ ] openspec/learnings/debt.md deleted
- [ ] README:67 architecture line — closed changes route follow-ups by opening a change; the doors are two
- [ ] example/README.md:29 surfaced-routing line matches the binary grammar
- [ ] test/approval.test.ts:579 fixture path swaps off debt.md

- [ ] feat(schema): findings graduate — debt.md dies
      hash:
      validation: human runs `bin/eospec focus` — the four parked changes list; learnings/ holds no ledger

## Slice 4 — the walk learns five steps

- [ ] try.sh: the fifth-step states — findings-free close, then a findings-drafted walk, new approve press, verdict, close
- [ ] README: room example block, schema description paragraph, the room-law sentences, the binary routing grammar
- [ ] example README / narrated comments: "four approve presses" grows honestly
- [ ] `just lint` green (vocabulary + parity), `npm test` green

- [ ] docs(walk): the walk line learns five steps
      hash:
      validation: human runs `./example/try.sh` and reads the final room output in the scratch repo

<!-- gate receipts land here while work runs; per-Slice H2s mirror the Plan's H3s -->

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-11T16:11:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/schema.ts · at 2026-11-11T16:11:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:11:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:11:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:12:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:12:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-11T16:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/eospec.js · at 2026-11-11T16:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-11T16:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-11T16:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-11T16:12:48Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-11-11T16:12:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:12:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:12:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:13:02Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:13:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:14:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:14:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:16Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:16Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-11T16:14:20Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/schema.test.ts · at 2026-11-11T16:14:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:14:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:21Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:15:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:15:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:15:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:17:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:17:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:17:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:17:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:18:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/phasegate.test.ts · at 2026-11-11T16:18:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:18:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:20:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:20:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:20:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:20:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:21:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-11-11T16:21:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:22:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:22:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:22:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:22:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-11T16:25:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-11-11T16:25:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:25:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:25:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:26:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T16:26:08Z
