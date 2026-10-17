# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

> Amended 2026-10-13 (human ruling: plans as boilerplates, rethink applied —
> cockpit is a downstream reader, gate is self-contained and owns its
> classifier). Steps re-derived below; original Step 1 receipt preserved in
> History.

## Task 1 — ladder-gate accounting extension live

> Execution: enforce-openspec-ladder-in-pi

- [x] Step 1 — Pin extension API facts: tool_call block contract, append/read
      entries, subagent parent linkage, install path
      start: 2026-10-13T15:41Z · elapsed: ~12m ·
      check: all four contracts pinned from /usr/lib/pi/docs/extensions.md +
      installed package types + @mjakl/pi-subagent source · paths:
      /usr/lib/pi/docs/extensions.md (tool_call → {block:true,reason}; handler
      failure blocks as fail-safe; annotations via pi.getAllTools(); user
      extensions dir loads subdir/index.ts via jiti) ·
      @earendil-works/pi-coding-agent 1.2.0 dist/core/session-manager.d.ts
      (pi.appendEntry(customType,data) → CustomEntry outside LLM context;
      ctx.sessionManager.getEntries()/getBranch() read them) ·
      pi-vimux-starship packages/status/src/active-work.ts (focus fact =
      galactica-status.openspec-focus.v1, data {mode:'task',change,taskId} |
      {mode:'none'}) · @mjakl/pi-subagent runner.ts + delegation-metadata.ts
      (child pi gets env PI_SUBAGENT_DELEGATION={childSessionId,parentSessionId,
      agent,handle}; parent session file resolvable under
      ~/.pi/agent/sessions/*/ — inheritance path confirmed)
- [x] Step 2 — Scaffold ~/projects/pi-openspec-gate/ (installable; project
      install → .pi/extensions/pi-openspec-gate → ../.. — agent-dir
      ~/.pi/agent/extensions is a read-only mount on this host, project
      .pi/extensions/ is the documented pi-native path)
      start: 2026-10-13T15:45Z · elapsed: ~8m ·
      check: pi -p -a reloads clean · LIVE PROOF: real session asked to write
      /tmp/gate-probe-test.txt with no focus → BLOCKED-BY-GATE, file absent ·
      paths: package.json · index.ts · config.json · src/ · .pi/extensions/
- [x] Step 3 — Classifier module, exported (annotations → bash verb-scan →
      unknown = mutating)
      start: 2026-10-13T15:46Z · elapsed: ~5m (incl. fixes: git read verbs,
      **/-in-comment parsing bug) · check: unit checks pass (11/11) ·
      paths: src/classifier.ts · test/classifier.test.ts
- [x] Step 4 — Exemption matcher (path-prefix config) + exempt-fact recording
      start: 2026-10-13T15:47Z · elapsed: ~4m · check: exempt write leaves fact
      with category + paths (protocol test) · paths: src/exemptions.ts ·
      src/paths.ts · src/config.ts · test/exemptions.test.ts
- [x] Step 5 — tool_call handler: classify → exempt / attribute / block with
      reason + all three remedies
      start: 2026-10-13T15:48Z · elapsed: ~4m · check: block copy byte-exact
      vs Execution artifact (asserted in test) + live block at 15:53Z ·
      paths: src/gate.ts · src/facts.ts · test/gate.test.ts
- [x] Step 6 — Declaration path: Human "do it" → one debt line, mutation proceeds
      start: 2026-10-13T15:50Z · elapsed: ~1m · check: exactly one line
      (`bare — do it · at <UTC>` in openspec/bare-work.md) + latch consumed
      (second mutation blocks) — deterministic; live declare lands in Step 8
      protocol · paths: src/gate.ts · src/attribution.ts · test/gate.test.ts
- [x] Step 7 — Federated inheritance (subagent inherits parent's active change)
      + attribution appender (paths + timing into focused change's 4-tasks.md)
      start: 2026-10-13T15:50Z · elapsed: ~2m · check: child mutation passes
      under inherited focus + receipt line present in 4-tasks.md (deterministic
      suite 25/25) · paths: src/focus.ts · src/attribution.ts · src/gate.ts ·
      test/gate.test.ts · live inherit lands in Step 8 protocol
- [x] Step 8 — Vocabulary sweep (grep -riE 'waiver|approv|sanitiz|trust' src/ =
      zero) + reload + observation protocol
      start: 2026-10-13T15:53Z · elapsed: interrupted (session close) ·
      check: live block ✓ at 15:53Z · remaining: vocabulary sweep, live
      declare/attribute/exempt/inherit protocol, freeze · paths: —
      receipt: live protocol 2026-10-14 — sweep clean · block PASS fresh-session probe · declare PASS twice in bare-work.md · exempt PASS after config-root fix · attribute and inherit deterministic-only, no focus writer on host · suite green including new config path test
- [x] Step 9 — Human validation — evidence review of one full protocol (block →
      declare → attribute → exempt → inherit) response: human ordered archive
      after evidence review ("Archive (since they done)", 2026-10-17) ·
      outcome: accepted — all five legs live-PASS 08:32–08:56Z; two gate bugs
      found & fixed (findSessionFile filename pattern, session_start root
      resolution) + runner ephemeral-delegation semantic documented;
      evidence: live-protocol-evidence.md · at: 2026-10-17T09:0xZ

## History

- 2026-10-13 · original Step 1 (verify cockpit import surface) executed and
  completed with outcome ABSENT → STOP, per pre-amendment execution artifact.
  Receipt: start 2026-10-13T15:09Z · ~5m · paths checked: ~/.pi/agent/extensions/
  (only pi-web-agent) · ~/.pi/agent/npm/node_modules/** (no package named
  derived-cockpit-status; nearest @aemonge-dev/pi-vimux-starship@0.2.1/packages/
  status publishes galactica.work + galactica-status.openspec-focus.v1 but no
  gate-grade classifier and is not an importable surface of that name) ·
  galactica openspec trees (change artifacts only, no built extension).
  Superseded by amendment above at human ruling; the stop was correct under the
  pre-amendment plan.

- 2026-10-14 · block-copy remedy 1 amended per human ruling: the referenced
  `openspec focus set` command never existed in the openspec CLI; copy now
  names the status-tool focus fact. Trio synced (3-execution.md, src/gate.ts,
  test/gate.test.ts), suite green, fresh-session block re-verified.

- 2026-10-17 · Step 9 evidence run (this session, receipts above): full live
  protocol — block PASS (08:32Z), declare PASS (08:33Z), attribute PASS
  (08:34Z), exempt PASS (08:35Z, exempt-before-focus confirmed live), inherit
  PASS live (08:56Z, persistent-session subagent; manual-env variant PASS
  08:54Z). Inherit required two gate fixes found by the live run:
  findSessionFile now matches pi's `<timestamp>_<id>.jsonl` names, and
  session_start resolves the parent across candidate roots (getSessionDir()
  returns the child's own per-cwd dir). Runner note: @mjakl/pi-subagent sets
  the delegation env only for persistent session children — ephemeral
  delegations carry no origin by design. Suite 44/44 with realistic-layout
  regression. Repo + global copy both at v0.1.3 (global synced in place once
  devbox ro-mounts were lifted; publish + reinstall recommended to make it
  official). Open host decision: gate double-registered (global package +
  project symlink) → pass-side facts/receipts ×2. Full evidence:
  live-protocol-evidence.md. Step 9 awaits human verdict.

  gate-attributed · tool: write · paths: /tmp/gate-close-attribute.txt · at 2026-10-17T08:34:19Z

  gate-attributed · tool: write · paths: /tmp/gate-close-attribute.txt · at 2026-10-17T08:34:19Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:35:59Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:35:59Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:36:06Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:36:06Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:38:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:38:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:38:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:38:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-10-17T08:38:55Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-10-17T08:38:55Z

  gate-attributed · tool: edit · paths: /home/aemonge/.pi/agent/npm/node_modules/@aemonge-dev/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:39:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/.pi/agent/npm/node_modules/@aemonge-dev/pi-openspec-gate/src/focus.ts · at 2026-10-17T08:39:07Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:39:36Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:39:36Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:39:50Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:39:50Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-17T08:41:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-17T08:41:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:41:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:41:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/index.ts · at 2026-10-17T08:42:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/index.ts · at 2026-10-17T08:42:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/index.ts · at 2026-10-17T08:44:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/index.ts · at 2026-10-17T08:44:25Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:51:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:51:02Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:51:07Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:51:07Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:51:41Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:51:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:53:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:53:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:53:50Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:53:50Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:54:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T08:54:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-10-17T08:54:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/gate.test.ts · at 2026-10-17T08:54:39Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:54:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:54:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:54:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:54:56Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:55:16Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:55:16Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:55:53Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T08:55:53Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:56:01Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T08:56:01Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T09:01:04Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T09:01:08Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T09:01:08Z
