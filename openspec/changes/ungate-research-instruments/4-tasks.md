# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

- [x] Step 1 — Classifier read set + phantoms + lsp_fix input-aware
      check: unit tests: research tools pass · mem_save fail-safe ·
      lsp_fix write=false pass / write=true mutating ·
      paths: src/classifier.ts · test/classifier.test.ts
- [x] Step 2 — Bash redirect fix + graphify read verbs + powershell parity
      check: redirect matrix (2>/dev/null, 2>&1, >/dev/null, &>/dev/null
      pass; > f, >> f, 2> f, &> f, 2>> log mutate) · graphify matrix
      (query/path/explain/hook status pass; update/add/watch mutate) ·
      powershell routed like bash · paths: src/classifier.ts ·
      test/classifier.test.ts
      outcome: redirect regex needed one extra benign lookahead
      alternative (`>`), found by test `2>>/dev/null` — regex backtrack
      consumed `2>` and saw `>` ≠ /dev/null; guard closes it.
- [x] Step 3 — Config readOnlyTools + README + default config.json
      check: config parse test · merged set honored in gate pass ·
      paths: src/config.ts · src/gate.ts · config.json · README.md ·
      test/config.test.ts
- [x] Step 4 — Suite green + vocabulary law + version 0.1.2 + commits
      check: node --test 44/44 pass · vocabulary grep zero ·
      feat + chore(release) commits · paths: package.json
      outcome: suite green 44/44 in 0.30s (node v24.19.0; devbox shim
      swallows `--test` with dir arg — explicit file list required);
      `npm test` script left untouched (works outside shim).
- [-] Step 5 — Publish + pi install refresh
      check: npm publish 0.1.2 (auth-dependent) ·
      pi install npm:@aemonge-dev/pi-openspec-gate · installed
      classifier.ts shows read set · paths: none (repo unchanged)
      outcome: v0.1.2 committed and pack-verified (14 files, shasum
      d553f0e6…); publish ENEEDAUTH persists inside the devbox pi
      subprocess even after human npm login — home dotfiles (incl.
      ~/.npmrc token) are not visible to the session's filesystem view
      (same sandboxing as the read-only package store; repo dirs ARE
      shared). npm test script fixed for node 24/devbox: directory arg
      → explicit glob (9024ee8), `npm test` green 44/44 via script.
      Human terminal (outside devbox pi): `just publish 0.1.2` then
      `pi install npm:@aemonge-dev/pi-openspec-gate`, then restart pi.
- [-] Step 6 — Human live validation (restart Pi; research-only session;
      web_explore + graphify query pass without focus)
      outcome: partial, live 2026-10-15 — web_explore ran successfully in
      the still-0.1.1 session via focus attribution (attributed leg
      proven); no-focus leg pending publish+install+restart. Scout
      subagent could not participate: agent-level tool registry for scout
      is read/grep/find/ls only — research instruments not registered at
      the agent layer (separate finding, not a gate issue).
      response: pending restart

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:58:09Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:58:09Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:58:31Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:58:31Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-15T07:59:19Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-15T07:59:19Z

  gate-attributed · tool: web_explore · paths: — · at 2026-10-15T08:03:51Z

  gate-attributed · tool: web_explore · paths: — · at 2026-10-15T08:03:51Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-15T08:05:03Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-15T08:05:03Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-15T08:07:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/package.json · at 2026-10-15T08:07:39Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:07:48Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:07:48Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:11Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:11Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:42Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:08:42Z
