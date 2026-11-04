# Brainstorm

> Spec: pause-window · consult `openspec/learnings/` before drafting

## Pain

When the human wants the agent to run free for a bounded stretch — a long
refactor, a bulk rename, a generated-code sweep — every mutation still
renegotiates with the human, and the only outs today are host-level:
disarming `config.json` (session-wide, remembered, easy to forget
re-armed) or a `--i-am-the-human` flag per call. There is no time-boxed,
session-scoped suspension. Requested live (2026-11-04): a `pios-gate
pause 30m` — and an in-session `/pios-gate pause 30m` — where the word
is **pause, never stop**: the command must take a duration
(`X{h,m,s}`), so the gate always returns by itself.

## Questions

1. Which teeth yield during a pause — the mutation classifier, approval
   teeth, phase gates, research window, humangate, archive guard, all of
   them — or a declared subset? Does the approval-touch guard itself
   yield (can an assistant then stamp a grant?), or do grants stay
   human-terminal even while paused — pause suspends the teeth, not the
   meaning of approve?
2. Who may pause: is the terminal command human-only like every grant
   surface (the touch guard learns `pause`), with the in-TUI `/pios-gate
   pause` form latched the way `VALID` is — a literal human message,
   never assistant text?
3. Where does the permit live: session-scoped (dies with the session,
   cannot be smuggled across sessions or into a subagent), and what does
   a restart mid-pause do — resume expired, or forget the pause?
4. The word is the law: bare `pause` (no duration) refuses; what is the
   ceiling (a max bound so "pause 999h" cannot be a stop in disguise)?
   Can a running pause be ended early (`resume`), extended, or stacked?
5. Does the cockpit announce the pause (`paused · 23m left`) and do
   receipts keep landing for paused work, so the ledger records the
   stretch instead of losing the story?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
Direction: pause is a human act with a mandatory duration — the duration
IS the feature, and the permit lives in the session like the validation
latch. While paused the teeth stand down but grants stay human-terminal;
the cockpit shows the remaining time and the gate resumes itself, no
remember-to-re-arm. Receipts keep landing throughout, so pausing is
visible in the ledger, never silent.
