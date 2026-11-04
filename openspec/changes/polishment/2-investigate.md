# Investigate

> Spec: polishment · aim at the Brainstorm's Questions

## Findings

**Pause — the permit home already exists.** The gate keeps in-memory,
per-session state inside `createGate`'s closure: `state.validationPermit`
is latched true by the human's literal VALID reply (message_end,
VALID_PATTERN ≤200 chars, src/gate.ts ~505-515) and consumed by exactly
one verdict-line flip. A pause permit is the same shape: latch on the
human's act, tick a clock, die with the session — never persisted, never
smuggled across sessions or into a fresh restart. That matches the
retired pause-window brainstorm's law: session-scoped, forced-duration.

**The teeth map — five block sites, one guard.** (1) the unaccounted
mutation block (no active change); (2) approval teeth 2a (focused,
writes locked — src/gate.ts ~628-652); (3) phase gates 0.9 (creating
gated artifacts out of sequence); (4) research window (web/docs tools
before `dig`); (5) archive guard 0.8. Above them all runs the
approval-touch guard — `APPROVAL_TOUCH_RESERVED` + declared verbs
(src/gate.ts ~219-234), documented "blocked before all else". Pause
design fork this creates: the touch guard must run BEFORE the pause
check (pause never lets an assistant stamp approve/confirm/grant/next),
while the five teeth yield. Attribution and receipts are not teeth —
they keep landing during a pause, so the ledger records the stretch.

**The unaccounted fork is the real design question.** Receipts need a
landing place: attribution lands in the focused change's
x-receives-receipts artifact; facts land in the session journal. With
no focus, a paused mutation has nowhere to be receipted — yield it and
the work goes ungoverned, refuse it and "run free" still demands a
focused change. Three shapes: (A) pause requires a focused change —
teeth yield, receipts land, unaccounted still refuses; (B) record-only
mode — blocks become facts of kind `paused`, everything passes; (C)
timer-limited disarm — `enabled:false` with an expiry, smallest diff,
but loses receipts-per-mutation entirely.

**Who may pause.** Terminal `pios-gate pause 30m` is human-terminal
like every grant surface (`pause` joins RESERVED_WORDS +
APPROVAL_TOUCH_RESERVED — an assistant tool call never pauses). The
in-session form the human asked for (`/pios-gate pause 30m`) is the
VALID-latch shape: a literal human message matching the duration
pattern latches the permit; assistant text never does. `resume` ends
it early; the ceiling is config (`approval.pauseCeiling`, default
capped well below "stop in disguise" — e.g. 4h).

**Focus-lifecycle gap (a): post-archive dangling focus.** Live today:
`openspec archive` moved suggestions-never-approve; the session focus
pointed at it; `focusIsActive` found no change dir → every mutation
refused "no active change" until focus was manually re-aimed. The
archive flow and the focus entry never shake hands.

**Focus-lifecycle gap (b): bash paths miss the docs exemption.** Live
today: the edit tool wrote `openspec/learnings/debt.md` freely (absolutepath
matched `**/openspec/**`), but `git add openspec/learnings/debt.md`
was teeth-blocked — bash-extracted relative paths never get joined
with cwd before exemption matching, so the docs exemption is mute for
bash-originated mutations entirely.

**Catch #5: `--i-am-the-human` breaks at the last hop.** Live today
(human terminal): `pios-gate archive <slug> --i-am-the-human` — the
hook sees ARCHIVE_FLAG and steps aside, then the passthrough execs
`openspec` with the flag verbatim → "error: unknown option". The
guard's own escape hatch cannot survive its exec. Fix candidate: the
wrapper strips known gate-side flags before `spawnSync` (or accepts an
env form the CLI never sees).

**Bench cleanup — done at batch birth.** Archive/kill of the five
stale changes landed in commit 3dfae5f (fossils' archive pending the
two plain commands above — human terminal, no flag).

## Options

- **Permit in session state, checked at tool_call, touch guard first**
  — the VALID-latch pattern with a clock: latch by terminal verb or
  in-session message, `expiresAt` checked before the five teeth,
  touch guard and receipts untouched. Covers "run free" inside a
  focused change; unaccounted stays refused (shape A).
- **Record-only pause (shape B)** — blocks degrade to facts; the
  cockpit shows the pause; maximal freedom, weakest story (blocks
  exist to be felt — a pause that only re-labels them is a counter).
- **Timer-limited disarm (shape C)** — config `enabled` flips false
  until `expiresAt`; smallest diff; but every mutation loses its
  receipt landing, and the host-level disarm it duplicates is already
  today's too-broad tool.

## Alternatives

- **Repo-file permit** — what it is: `.openspec/pause` with an expiry
  stamp, read by every session. Trade-off: survives restarts, leaks
  across sessions and machines, invites a file the assistant could
  edit. Pick-when: the human wants pause to outlive the session — the
  retired brainstorm explicitly forbids that.
- **Pause without a ceiling** — what it is: bare `pause` legal, or
  hours-long caps. Trade-off: stop in disguise; the retired
  brainstorm's own law says the duration IS the feature. Pick-when:
  never, unless the human renames the feature.
- **Strip flags in the hook instead of the wrapper** — what it is:
  gate.ts rewrites the command before classification. Trade-off: the
  hook mutating the command string muddies the exec-never-interprets
  law; the wrapper owns the exec boundary. Pick-when: the wrapper
  proves too thin to hold the strip (it isn't — it already owns argv).
