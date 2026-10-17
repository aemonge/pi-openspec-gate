# Live protocol evidence — Step 9 human validation

Full five-leg protocol, 2026-10-17T08:32–08:56Z, host session
`01a148f9-e006-739e-acdc-b4959660aca8` (project cwd). Focus set at 08:34:11Z →
`enforce-openspec-ladder-in-pi` task 9. Run continued outside devbox at ~08:47Z
(read-only mounts on ~/.pi/agent/npm lifted), enabling the global-copy sync that
unblocked the inherit leg. Probe files under /tmp left in place (ephemeral);
receipts in 4-tasks.md, facts in session jsonl files.

## Leg results — all five PASS live

| leg | probe | verdict | evidence |
|-----|-------|---------|----------|
| 1 block | `echo … > /tmp/gate-close-block.txt` in-session, no focus | **PASS** — blocked, exact BLOCK_MESSAGE (bash.write-redirect-or-inplace), 08:32:26Z; file absent | blocked fact in session |
| 2 declare | fresh `pi -p` child, user message "do it — … touch /tmp/gate-close-declare.txt …" | **PASS** — mutation ran; debt lines in openspec/bare-work.md at 08:33:55Z (×2, Finding A) | declared facts in child `01a148fe…` |
| 3 attribute | focus via openspec_focus tool → `write /tmp/gate-close-attribute.txt` | **PASS** — proceeded under focus; receipt `gate-attributed · tool: write · … 08:34:19Z` in 4-tasks.md | attributed facts |
| 4 exempt | write + rm under `openspec/**` with focus active | **PASS** — exempt-before-focus: fact `ladder-artifacts` / `**/openspec/**`, not attributed; rm also exempt; file removed | exempt facts 08:35:52Z |
| 5 inherit | persistent subagent session `gate-inherit-probe` (runner @mjakl/pi-subagent) mutates /tmp under inherited parent focus | **PASS** — child ran `touch /tmp/gate-close-inherit.txt`; child session `subagent.90855a12…` holds inherited facts (`parentSessionId: 01a148f9…, change, taskId 9`) + attributed facts; receipt 08:56:01Z | child session + 4-tasks.md |

Manual-env variant also PASS (08:54:56Z, receipt + inherited facts in child
`01a1491…`): delegation env → parent session file → inherited focus → attributed
mutation.

## Finding A — gate registered twice per session (operational, unresolved by choice)

Every pass verdict fires twice (facts/receipts/debt lines ×2; blocks ×1,
short-circuit). Cause: global npm package (`npm:@aemonge-dev/pi-openspec-gate`
in settings) + project extension (`.pi/extensions/pi-openspec-gate` → repo
symlink; import proven via marker 08:42Z, reverted). Harmless to verdicts, noisy
to accounting. Remedy is a host choice: keep exactly one load source.

## Finding B — inherit was broken live; three stacked causes, all resolved

1. **Filename pattern (gate bug):** pi writes `<ISO-timestamp>_<sessionId>.jsonl`;
   `findSessionFile` matched only exact `<sessionId>.jsonl` — no parent file ever
   found on a real host. Fixed in src/focus.ts (exact OR `_<id>.jsonl` suffix).
2. **Wrong root (gate bug):** `ctx.sessionManager.getSessionDir()` returns the
   child's own per-cwd directory, one level below the sessions root; the gate
   scanned it for subdirectories and always missed. Diagnosed via temporary
   sessionDir probe (08:53Z, reverted). Fixed in src/gate.ts: candidate roots =
   [sessionDir, dirname(sessionDir), default], first hit wins.
3. **Ephemeral delegation (runner semantics, not a bug):** @mjakl/pi-subagent
   sets `PI_SUBAGENT_DELEGATION` only for persistent session children
   (runner.ts: `session?.created ? {…} : undefined`). Ephemeral children carry
   no origin by design — inheritance therefore requires a `session` handle on
   the delegation. Documented here; no gate change needed.

Regression coverage: inherit test now uses the real layout (timestamped file,
child dir ≠ parent dir, child's own getSessionDir). Suite 44/44.

Deployment: repo + global npm copy both carry v0.1.3 (version bumped; global
synced in place after devbox mounts were lifted — direct edit had been EROFS
inside devbox; `pi install ./` had not refreshed it). If v0.1.3 is published,
`pi install npm:@aemonge-dev/pi-openspec-gate` makes the sync official; the
double registration (Finding A) should be resolved in the same pass.

## Accounting of this run (receipts in 4-tasks.md, ×2 per Finding A)

08:34:19 write attribute-probe · 08:35:59 bash exempt rm · 08:36:06 subagent
inherit#1 (blocked → investigation) · 08:38:35–55 fix#1 edits (src/focus.ts,
test) · 08:39:07 edit global copy EROFS-failed (attributed, did not land) ·
08:39:50 subagent inherit#2 (blocked) · 08:41:27 package.json 0.1.3 · 08:41:30
pi install ./ · 08:42:28/08:44:25 index.ts marker add+revert (net zero) ·
08:47:40s cp focus.ts+package.json → global (outside devbox) · 08:49–08:52
subagent inherit#3/#4 (blocked → root cause #2) · 08:53:31 gate.ts probe edit ·
08:54:36 fix#2 gate.ts + test + cp → global · 08:54:56 manual-env inherit PASS ·
08:56:01 persistent-session inherit PASS.

## Verdict requested from the human

block ✓ · declare ✓ · attribute ✓ · exempt ✓ · inherit ✓ (live, both manual-env
and persistent-session paths). Two gate bugs found and fixed with regression
coverage; one runner semantic documented; global deployment synced; Finding A
(single load source) awaiting host decision. Validate to close Step 9, or rule
otherwise.
