# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — the wrapper surface

> Execution: pios-gate-cli

- [ ] Step 1 — `bin/pios-gate` shim + `bin/pios-gate.ts`: approve/confirm
      dispatch (shared logic with old bin), `pending` (changes needing the
      human: slug, status, created_by, approved/validated, task counts),
      verbatim exec passthrough with exit-code propagation; reserved verbs
      never forward
      check: wrapper tests with fake openspec on PATH (argv recorded, exit
      0/3 propagated) · paths: bin/pios-gate · bin/pios-gate.ts ·
      test/pios-wrapper.test.ts · done 2026-10-19 — 5 tests: verbatim
      passthrough + exit codes, approve/confirm never forwarded + meta
      written, pending report (needs-approve/needs-confirm), usage errors
      exit 2 unforwarded, missing openspec binary exits 127

## Task 2 — the gate grows the name

> Execution: pios-gate-cli

- [ ] Step 2 — Classifier normalization: leading `pios-gate` /
      `pi-openspec-gate` token → `openspec` before segmentation
      check: equivalence tests — `pios-gate list` reads, `pios-gate new
      change x` creation, `pios-gate archive y` mutation, each identical to
      bare form · paths: src/classifier.ts · test/classifier.test.ts ·
      done 2026-10-19 — 11-case matrix incl. path forms (`./bin/pios-gate
      status`), per-segment compounds (`pios-gate list && pios-gate show x`),
      wrapper-as-argument negative (`which pios-gate`), unknown-subcommand
      fail-safe; command patterns now test the normalized body
- [ ] Step 3 — APPROVAL_TOUCH extension: `pios-gate(.ts)? … approve|confirm`
      blocked from assistant bash, path forms included, byte-exact copy
      check: touch-pattern tests green · paths: src/gate.ts ·
      test/approval.test.ts (landed beside the existing touch tests) ·
      done 2026-10-19 — four blocked forms incl. pipes and .ts path
      forms; `pios-gate validate` deliberately NOT touch-guarded (forwards
      to openspec lint — not a human act)
- [ ] Step 4 — Stamp timing: creation stamp lands after the call (no
      pre-created dir breaking `openspec new` scaffolding)
      check: stamp tests — no empty dir on witnessed creation; stamped when
      dir exists · paths: src/gate.ts · test/approval.test.ts (rewrote the
      pre-call stamp test to the new contract) · done 2026-10-19 — stamp
      moved to message_end with dir-exists check; wrapper form witnessed
      too (slug regex covers pios-gate/pi-openspec-gate); no-dir no-stamp
      negative; live proof: this change's own dir was created this session
      via `openspec new` stamp-only, scaffold error gone

## Task 3 — ship shape

> Execution: pios-gate-cli

- [ ] Step 5 — package.json dual bins (old untouched), README approval
      section (pios-gate surface, confirm rename), version 0.3.0, suite +
      lint green
      check: `just test` + `just lint` · paths: package.json · README.md ·
      done 2026-10-19 — 83/83 (75 → 83), lint holds, shim chmod +x
      preserved by git
- [ ] Step 6 — Human validation — after publish + reload: `pios-gate
      pending` answers, and a live `pios-gate approve …` works from the new
      bin (dogfood) response: <!-- original reply --> · outcome:
      <!-- VALID --> · at: <!-- UTC -->

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:46:51Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:46:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:48:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:48:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:48:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:48:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T10:48:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T10:48:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:49:03Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-19T10:49:03Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate · at 2026-10-19T10:49:08Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate · at 2026-10-19T10:49:08Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.ts · at 2026-10-19T10:49:25Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.ts · at 2026-10-19T10:49:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-19T10:49:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-19T10:49:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-10-19T10:49:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-10-19T10:49:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-10-19T10:49:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/README.md · at 2026-10-19T10:49:47Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-10-19T10:50:04Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-10-19T10:50:04Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-10-19T10:50:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/pios-wrapper.test.ts · at 2026-10-19T10:50:19Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:50:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:50:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-19T10:51:21Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-19T10:51:21Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:51:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:51:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:51:41Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:51:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-19T10:51:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-19T10:51:49Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:52:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:52:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:52:42Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T10:52:43Z
