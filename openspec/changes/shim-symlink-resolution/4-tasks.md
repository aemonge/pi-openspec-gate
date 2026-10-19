# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x] Complete.

## Task 1 — shims survive the link farm

> Execution: shim-symlink-resolution

- [x] Step 1 — Resolve `$0` through symlinks in both shims; add npm-layout
      symlink test (link-dir → package-copy, invoke through links)
      check: npm-layout test green; direct repo invocation unchanged ·
      paths: bin/pi-openspec-gate · bin/pios-gate · test/pios-wrapper.test.ts
      · done 2026-10-19 — scope grew on live evidence: symlink fix alone
      hit ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING (node forbids
      type-stripping under node_modules) — no npm-installed bin of this
      package has EVER run (the 2026-10-17 SyntaxError fix fixed repo-local
      only). Wrappers rewritten as plain JS (bin/gate-lib.js shared core;
      .ts wrappers removed), shims exec the .js with readlink -f
      resolution; npm-layout test copies the real bin set through real
      symlinks and invokes the shims
- [x] Step 2 — Suite + lint green
      check: `just test` + `just lint` · paths: — · done 2026-10-19 — 84/84
      (83 + npm-layout link-farm test), lint holds; shim comments state
      the node_modules constraint for the next reader
- [ ] Step 3 — Human validation — reinstall from terminal
      (`npm install -g ~/projects/pi-openspec-gate`), then `pios-gate
      pending` and `pi-openspec-gate --help` both answer response:
      <!-- original reply --> · outcome: <!-- VALID --> · at: <!-- UTC -->

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:13:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:13:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate · at 2026-10-19T12:13:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate · at 2026-10-19T12:13:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate · at 2026-10-19T12:13:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate · at 2026-10-19T12:13:49Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-10-19T12:15:00Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/gate-lib.js · at 2026-10-19T12:15:00Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-10-19T12:15:17Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pios-gate.js · at 2026-10-19T12:15:17Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate.js · at 2026-10-19T12:15:24Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-openspec-gate/bin/pi-openspec-gate.js · at 2026-10-19T12:15:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:15:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:15:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:15:53Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:15:53Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:16:45Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T12:16:45Z
