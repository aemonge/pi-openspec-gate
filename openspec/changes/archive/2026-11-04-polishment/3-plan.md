# Plan

> Spec: polishment · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

4–6 h across the three slices including tests and docs · medium-high
confidence — the teeth map and permit home are pinned line-by-line in
the investigate; the one unknown is the CLI→session channel for the
terminal pause verb, and its mechanism already exists (the gate reads
pi session files for focus — Slice 1's first task verifies that path
before building on it).

## Skills

bare — the gate's own authoring session; source, tests, and this
afternoon's live evidence are the skill. Nothing external qualifies.

## Workflow

**Shape A — permit in session state, checked at tool_call, touch guard
first; pause requires a focused change.** The permit is the
VALID-latch pattern with a clock: latched by the human's in-session
message (`pause 30m` — duration grammar `X{h,m,s}`, mandatory) or the
terminal verb (`pios-gate pause 30m`, reaching the session through the
same session-file channel focus already uses); `expiresAt` checked
after the approval-touch guard, before the five teeth; touch guard,
attribution, and receipts untouched — pause never lets an assistant
stamp, and the ledger records the whole stretch. Unaccounted mutations
stay refused: no landing place, no pause. B lost — blocks exist to be
felt, a pause that only re-labels them is a counter. C lost — a
timer-disarm is today's too-broad host disarm with a deadline, and it
drops receipts per mutation. Ceiling is config (`approval.pauseCeiling`,
default 4h); `resume` ends early; the cockpit shows the countdown.

## Slices

### Slice 0 — bench cleanup *(done at batch birth)*

- [x] Five stale changes resolved: state-aware-remedies + cli-schema-tag-parity archived, pause-window/terminal-only-approvals killed, gate-spanned-agents to debt
      started_at: 15:02 · ended_at: 15:12 · total: 10m · check: bench shows polishment alone · paths: openspec/changes/, openspec/learnings/debt.md
- [x] chore(openspec): bench cleanup — fossils archived (3dfae5f, 567260f, human-run)
      hash: 3dfae5f,567260f
- [x] Human validation (the human ran every command)

### Slice 1 — pause: the time-boxed yield

- [ ] Verify the session-file channel (focus.ts mechanics), then arm the permit: latch on human message `pause <X{h,m,s}>`, terminal verb `pios-gate pause <X{h,m,s}>` via that channel; `resume` clears; ceiling config `approval.pauseCeiling` (default 4h); `pause` joins RESERVED_WORDS (both parser twins) + APPROVAL_TOUCH_RESERVED
      started_at: · ended_at: · total: · check: · paths:
- [ ] The yield: permit checked after the touch guard, before the five teeth; touch guard, attribution, receipts, and the unaccounted block untouched; FACT entries for armed/expired/resumed; cockpit `pendingReport` shows `paused · Xm left`
      started_at: · ended_at: · total: · check: · paths:
- [ ] Tests: latch grammar (human yes, assistant no, malformed no), ceiling cap, expiry restores teeth, resume clears, touch guard fires while paused, cockpit countdown, terminal-verb channel
      started_at: · ended_at: · total: · check: · paths:
- [ ] feat(gate): pause — a time-boxed yield with the clock on the wall
      hash:
- [ ] Human validation

### Slice 2 — focus-lifecycle: the fence knows the archive

- [ ] Dangling focus names itself: when the focused change moved to archive, the block remedy says so and names the re-aim, instead of "no active change"
      started_at: · ended_at: · total: · check: · paths:
- [ ] Bash paths join cwd before exemption matching — `git add openspec/…` meets the docs exemption like the edit tool does
      started_at: · ended_at: · total: · check: · paths:
- [ ] Tests: archived-focus remedy, bash exemption match, non-openspec bash paths still mutate normally
      started_at: · ended_at: · total: · check: · paths:
- [ ] fix(gate): the fence knows the archive — dangling focus and bash exemption
      hash:
- [ ] Human validation

### Slice 3 — the wrapper keeps gate-side flags off openspec's argv

- [ ] Passthrough strips known gate-side flags (`--i-am-the-human`) before `spawnSync`
      started_at: · ended_at: · total: · check: · paths:
- [ ] Tests: flag stripped, archive still guarded (unapproved + no flag → block; stripped exec reaches openspec), openspec never sees the option
      started_at: · ended_at: · total: · check: · paths:
- [ ] fix(gate): the escape hatch survives its own exec
      hash:
- [ ] Human validation

## Verification

- `npm test` → all pass (163 baseline + new); `just lint` → "vocabulary law holds"; `./example/try.sh` → 11/11.
- Human validation, per slice in their terminal/session: (1) say `pause 2m` — a previously blocked bash passes, a `pios-gate next` tool call stays blocked, cockpit counts down, teeth return at expiry; (2) archive a scratch change — the next mutation names the dangling focus; `git add` an openspec file passes; (3) `pios-gate archive <unapproved> --i-am-the-human` on a scratch — gate yields, openspec accepts, no unknown-option error. Only a human reply ticks each.

## History

- Drafted 2026-11-04, investigate granted 15:13:32Z. Evidence at main @ 567260f; live catches #1–#5 carried from suggestions-never-approve and today's bench work.
