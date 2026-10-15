# Plan — ungate research instruments

One slice, six steps, all in this repo. No behavior change to the ladder
law itself: fail-safe stays, permission stays elsewhere.

## Step map

1. **Classifier read set** (`src/classifier.ts`): remove phantoms
   (`skill`, `glob`, `multi_edit`, `applypatch`); add research instruments:
   `web_explore`, `web_search`, `web_fetch`, `resolve-library-id`,
   `query-docs`, `lsp_diagnostics`, and the 9 Engram reads
   (`mem_search`, `mem_context`, `mem_get_observation`, `mem_timeline`,
   `mem_stats`, `mem_list_projects`, `mem_current_project`, `mem_doctor`,
   `mem_review`). Keep `read`, `grep`, `find`, `ls`.
2. **Input-aware `lsp_fix`**: pass when `input.write !== true`
   (basis `tool.lsp-fix-preview`), mutating otherwise.
3. **Bash scan fixes** (same file): redirect alternative becomes
   `/(?<![\d>])(?:\d)?>>?(?!\s*(?:\/dev\/null|&\d))/u`; add
   `BASH_GRAPHIFY_READ_ONLY` checked early (alongside git/openspec
   read-only): `/\bgraphify\s+(?:query|path|explain|hook\s+status)\b/`.
4. **Powershell parity**: route through the same verb scan as bash.
5. **Config** (`src/config.ts`, `config.json`, `README.md`): new
   `readOnlyTools: string[]`, merged in `src/gate.ts` via optional
   `extraReadOnlyTools` param on `classifyMutation` (default set frozen).
6. **Tests + release**: extend `test/classifier.test.ts` (research set,
   lsp_fix matrix, redirect matrix, graphify matrix, powershell routing,
   unknown-still-fail-safe) and `test/config.test.ts` (readOnlyTools
   parse); suite green; version 0.1.2; commits.

## Explicitly out of this slice

- Per-segment bash classification (whole-string read-only match weakness)
  — its own change.
- Engram write tools / `instrumentTools` key — open question Q2.
- `graphify-out/**` path exemption — open question Q1.

## Risks

- Redirect regex lookbehind/lookahead: needs Node ≥ 8 (fine, engines
  `>=22.19.0`); matrix tests pin behavior both directions.
- Early graphify check shadows mutating words inside query strings
  (`graphify query "install flow"`) — intended, mirrors `git log --grep`
  precedent; queries are strings, not commands.
