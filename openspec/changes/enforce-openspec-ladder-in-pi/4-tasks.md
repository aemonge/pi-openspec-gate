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
- [-] Step 8 — Vocabulary sweep (grep -riE 'waiver|approv|sanitiz|trust' src/ =
      zero) + reload + observation protocol
      start: 2026-10-13T15:53Z · elapsed: interrupted (session close) ·
      check: live block ✓ at 15:53Z · remaining: vocabulary sweep, live
      declare/attribute/exempt/inherit protocol, freeze · paths: —
- [ ] Step 9 — Human validation — evidence review of one full protocol (block →
      declare → attribute → exempt → inherit) response: — · outcome: — · at: —

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
