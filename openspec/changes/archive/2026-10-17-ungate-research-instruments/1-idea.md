# Idea — ungate research instruments

## Problem

The gate's fail-safe (`unknown = mutating`) blocks the very tools that
Ramona's loop endorses during understanding/brainstorming. Live evidence
from a real session running under `NO CODE — NO WRITES — Research only`
(block counter from that one research session: **11 gate blocks**):

1. `web_explore` → blocked (`tool.unknown=fail-safe:web_explore`)
2. `resolve-library-id` (Context7) → blocked (same basis)
3. `mem_search` (Engram read) → blocked — even the memory layer's read path
4. `bash` pipelines silenced with `2>/dev/null` / `2>&1` → blocked
   (`bash.write-redirect-or-inplace`) — `/>>?/` matches **any** `>` char,
   including fd-redirects to `/dev/null` and `2>&1` (hit 6× in one session)
5. `graphify query|path|explain` via bash → blocked
   (`bash.unknown=fail-safe`) — graphify-pi registers no tools; its queries
   are CLI verbs the classifier doesn't know

This contradicts the gate's own mode banner ("Research only") and the
loop's brainstorm/research/learning stages.

## Why it happens

`classifyMutation` decision order: annotations → known sets → bash scan →
fail-safe. Two structural facts found by full inventory:

- **No tool in the installed ecosystem declares annotations** (grep across
  every active package: 0 hits for `annotations`). The `readOnlyHint` path
  is dead code in practice — known-sets + config are *the* mechanism.
- The known sets predate this toolset: they hold phantoms (`skill`, `glob`,
  `multi_edit`, `applypatch` — none exist in Pi 1.2.0) and miss every
  research instrument.

## Full inventory (Pi core 1.2.0 + active packages in settings.json)

| Source | Tool | True nature | Today |
|---|---|---|---|
| core | read, grep, find, ls | read | pass |
| core | bash | scan | verb/redirect bugs |
| core | edit, write | mutate | gated ✓ |
| core | powershell | scan | **fail-safe gap** (not in bash branch) |
| core | codemode | sandbox→can mutate | fail-safe (correct) |
| pi-web-agent | web_explore | read | **blocked** ✗ |
| context7-pi | resolve-library-id, query-docs | read | **blocked** ✗ |
| gentle-engram | mem_search, mem_context, mem_get_observation, mem_timeline, mem_stats, mem_list_projects, mem_current_project, mem_doctor, mem_review | read | **blocked** ✗ (mem_search proven) |
| gentle-engram | mem_save, mem_update, mem_delete, mem_save_prompt, mem_session_summary, mem_capture_passive, mem_suggest_topic_key, mem_pin, mem_unpin, mem_judge, mem_compare, mem_session_start, mem_session_end | write (Engram store, outside repo) | fail-safe (see Q2) |
| pi-lsp | lsp_diagnostics | read | **blocked** ✗ |
| pi-lsp | lsp_fix | mutates files | fail-safe (correct) |
| pi-subagent | subagent | spawns (children run own gate, inherit focus) | fail-safe (correct) |
| graphify-pi | (no tools — skill/CLI) | `graphify query/path/explain` = read; `update/add/watch/merge/hook install/build` = mutate | **read verbs blocked** ✗ |
| status pkg | work_focus, openspec_focus, stage, subject | instruments | pass ✓ (accountingTools) |
| openappa, pi-vim, transcript-ui, notify, image-attachments, themes | (no session tools) | — | — |

## Proposal

1. **Known research instruments pass.** Extend `READ_ONLY_TOOLS`:
   `web_explore`, `web_search`, `web_fetch`, `resolve-library-id`,
   `query-docs`, `lsp_diagnostics`, and the 9 Engram reads. Remove the
   phantom names. Fail-safe stays for genuinely unknown tools.
   `lsp_fix` gets **input-aware** treatment: pass when `input.write !==
   true` (its `write` param defaults to false = preview-only), gate when
   `write: true`. Same input-awareness pattern the bash curl check uses.
2. **Config escape hatch.** `readOnlyTools: string[]` merged into the set
   at load (same pattern as `accountingTools`) — new tools need no package
   release. Documented in README + config.json.
3. **graphify read verbs.** Add `BASH_GRAPHIFY_READ_ONLY`:
   `/\bgraphify\s+(?:query|path|explain|hook\s+status)\b/` (binary at
   `/usr/bin/graphify`, v0.9.85). Mutating verbs
   (`update`, `add`, `watch`, `merge-graphs`, `cluster-only`, `hook
   install`, bare `graphify .`) stay fail-safe/attributed.
4. **Redirect pattern fix.** Replace `/>>?/` alternative with
   `/(?<![\d>])(?:\d)?>>?(?!\s*(?:\/dev\/null|&\d))/u`.
   Benign: `2>/dev/null`, `2>&1`, `>/dev/null`, `&>/dev/null`, `2>>/dev/null`.
   Still gated: `> file`, `>> file`, `2> file`, `&> file`, `2>> log`.
5. **powershell parity.** Route `powershell` through the same
   verb/redirect scan as bash (Windows sessions currently 100% fail-safe).
6. **Tests**: research tools pass without focus; redirect matrix; graphify
   verb matrix; `readOnlyTools` merge; unknown tools still fail-safe;
   powershell scan.
7. **Per-segment classification (noted, next slice).** The bash read-only
   pattern is whole-string: one anchored verb passes the entire command.
   Proven live: `which graphify; graphify --version` passed because `which`
   anchored at `^`, though the second segment is unknown → should be
   fail-safe. Correct model: split on `;`, `&&`, `||`, `|`; every segment
   must classify read-only. Keep this slice minimal (graphify verbs +
   redirect fix); per-segment lands as its own change.

## Non-goals

- No change to the fail-safe for unknown tools.
- No change to permission/trust layers (law of disjoint questions).
- `codemode`, `subagent`, `lsp_fix`, Engram *writes* stay fail-safe
  mutating by default.

## Open questions

- **Q1:** `graphify update .` rebuilds derived artifacts after code
  changes — attributed via focus (current behavior once focus exists) is
  honest; alternatively add `**/graphify-out/**` path exemption. Lean:
  keep attributed.
- **Q2:** Engram *writes* (mem_save etc.) power the loop's learning stage
  and write outside the repo. Option: config key `instrumentTools`
  (pass-ungated, recorded as facts). Default: leave gated, document the
  key as the release valve. 
- **Q3:** `pi-web-search` / `pi-web-kit` present in node_modules but not
  in settings packages — include their tool names (`web_search`,
  `web_fetch`) in the read set preemptively, harmless if unused.
