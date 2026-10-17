# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — approval teeth live

> Execution: gate-approval-not-attribution

- [x] Step 1 — src/approval.ts: meta read/parse (flat key: value), stamp
      writer (set-only), shared by gate + bin CLI; bin/pi-openspec-gate
      approve|validate subcommands (idempotent, timestamped, slug-checked)
      check: unit tests (meta roundtrip, set-only, human keys preserved) ·
      paths: src/approval.ts · bin/pi-openspec-gate
- [x] Step 2 — config.ts `approval` section (defaults false when absent) +
      repo config.json ships all true; config test for absent-section legacy
      check: "teeth off (legacy config)" test green; gate normalizes absent
      section at createGate · paths: src/config.ts · config.json
- [x] Step 3 — gate.ts decision-order inserts: approval-touch guard (before
      exempt), unapproved-focus block (+facts), block copies byte-exact,
      tests: unapproved blocks / approved passes / docs exempt regardless /
      touch-guard blocks even piped to a read-only verb
      check: byte-exact copy assertions + 4 behavior tests green; touch guard
      re-verified LIVE in a fresh session 2026-10-17 (exact BLOCK_APPROVAL_
      TOUCH on an assembled approver invocation) · paths: src/gate.ts ·
      test/approval.test.ts
- [x] Step 4 — human-gate flip guard: [x]-flip detection on "Human
      validation" lines (edit old→new + write content), meta `validated`
      permit, one-shot VALID latch (message_end), tests incl. latch consume
      + BLOCK_HUMANGATE copy
      check: flip/permit/latch-consume tests green (regex escape bug caught
      by tests: \[xX\] literal → \[[xX]\] class) · paths: src/gate.ts ·
      test/approval.test.ts
- [x] Step 5 — archive guard (slug extraction, --i-am-the-human escape) +
      creation stamping (witnessed openspec new → status: proposed +
      created_by: assistant, fact), tests
      check: archive guard 3-way test + creation stamp test green ·
      paths: src/gate.ts · test/approval.test.ts
- [x] Step 6 — README approval section, version 0.2.0, full suite green,
      sync both installed copies (repo + global npm), graphify update;
      Human wait: human runs `pi-openspec-gate approve
      gate-approval-not-attribution` from their terminal (dogfood proof —
      the assistant must NOT run it), then fresh-session spot-check: an
      unapproved focused change blocks source mutations with the new copy
      check: README + facts table updated · suite 57/57 (13 new approval
      tests) · both installed copies at 0.2.0 with teeth on · touch-guard
      live-verified · vocabulary note: 'approv' is now sanctioned
      accounting vocabulary per the human ruling of 2026-10-17 ("some
      teeth"); waiver/sanitiz/trust still absent from src/ · remaining:
      the human's terminal approve (dogfood) — then this change can archive
      under its own teeth · at: 2026-10-17T09:4xZ
      fix 13:42Z: bin was extensionless TypeScript — Node cannot type-strip
      without the .ts extension (human hit SyntaxError). Now a sh shim →
      bin/pi-openspec-gate.ts; touch pattern covers .ts/.js forms; test
      extended; 57/57; global copy synced.
      dogfood 11:55Z: human approved from terminal ("approved · at
      2026-10-17T11:55:05Z") · live proof: fresh persistent-session
      subagent inherited focus → mutation attributed + receipt 11:55:56Z,
      no block — approved changes pass the teeth · at: 2026-10-17T11:56Z

## History

- 2026-10-17 · artifacts authored and implemented in one session, immediately
  after the human ruling ("some teeth"). Focus: this change, task 1. All
  mutations attributed + receipted; docs drafted under exemption (drafting
  stayed ungated — by design, verified live: this file was written while the
  change was still `status: proposed`).

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:41:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:41:43Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate · at 2026-10-17T11:41:50Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate · at 2026-10-17T11:41:50Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T11:41:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/gate.ts · at 2026-10-17T11:41:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-17T11:42:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/approval.test.ts · at 2026-10-17T11:42:08Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:42:14Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:42:14Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:42:25Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:42:25Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T11:55:45Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-17T11:55:45Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:55:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-17T11:55:56Z
