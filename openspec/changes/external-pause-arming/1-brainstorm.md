# Brainstorm

> Spec: external-pause-arming · consult `openspec/learnings/` before drafting

## Pain

The pause permit lives in session state (dies with the session, by law); arming
it from a terminal (`pios-gate pause 30m` reaching the live session) needs pi to
expose the session id/file to extensions. Until then the CLI teaches and the
in-session reply arms (2026-11-04, polishment Slice 1). The same channel would
let a cockpit show the countdown. Graduated from the debt ledger when debt died
(post-delivery, 2026-11-11).

## Questions

- What session-identity API would pi need to expose for external arming —
  and is the ask already tracked upstream?
- Without it, is the teach-and-arm split the honest terminal state?
