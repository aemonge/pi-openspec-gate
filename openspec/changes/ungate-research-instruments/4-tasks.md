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
- [x] Step 5 — Publish + pi install refresh
      check: npm publish 0.1.2 (auth-dependent) ·
      pi install npm:@aemonge-dev/pi-openspec-gate · installed
      classifier.ts shows read set · paths: none (repo unchanged)
      outcome: DONE 2026-10-15 · registry shows 0.1.2 (`npm view` …
      '0.1.2') · `pi install npm:@aemonge-dev/pi-openspec-gate@0.1.2`
      refreshed the store (changed 1 package) · npm test fixed for
      node24/devbox (9024ee8), 44/44 green · publish executed from human
      terminal (devbox pi subprocess cannot see npm credentials — sandbox
      hides home dotfiles; repo dirs shared) · caveat: pi-web-agent
      postinstall (patch-jiti-compat.mjs) blocked by allowScripts — if
      web_explore misbehaves after restart, `npm install-scripts approve
      @demigodmode/pi-web-agent`.
- [x] Step 6 — Human live validation (restart Pi; research-only session;
      web_explore + graphify query pass without focus)
      outcome: VALID 2026-10-15 · fresh session, no focus, no declaration:
      web_explore passed 3× (one transient search-backend error mid-run,
      not a gate block) · response: human "Great!!"

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

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:14:34Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:14:34Z
