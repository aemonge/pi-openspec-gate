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
- [ ] Step 5 — Publish + pi install refresh
      check: npm publish 0.1.2 (auth-dependent) ·
      pi install npm:@aemonge-dev/pi-openspec-gate · installed
      classifier.ts shows read set · paths: none (repo unchanged)
- [ ] Step 6 — Human live validation (restart Pi; research-only session;
      web_explore + graphify query pass without focus)
      outcome: pending · response: pending
