# Debt

Surfaced bugs, errors, and deferred work — routed here by change verdicts,
read by every step. Promoted items graduate into a named change; the
polishment batch (2026-11-04) carries the pause feature and the two
focus-lifecycle gaps below.

- **Backlog · gate must ride spanned agents** — npm:pi-subagents spawns
  ungated in the default path: `registerRequiredChildExtensions`
  (fail-closed admission) and `registerSubagentCapabilityCeiling` are
  claimed by no installed package; four gaps named in the retired idea
  (openspec/changes/archive — killed from the bench 2026-11-04, text in
  git history). Feature-sized; its own change when it earns one.

- **2026-11-04 · bare `pios-gate` answered as openspec — FIXED same day**
  (`./bin/pios-gate` with no args fell through every handler and exec'd
  `openspec` verbatim: openspec's help banner under the gate's name; no
  gate-owned help anywhere). Tripped live by the human during
  suggestions-never-approve validation (catch #4). First routed here as
  debt; the human overruled — "No debt, fix now" — so it landed as
  suggestions-never-approve Slice 3: bare invocation, `help`, `--help`,
  `-h` print the gate's own usage; unknown verbs keep the documented
  passthrough. Still open from the same investigation thread: shell
  completions, and the full single-name CLI question (classifier
  normalization, ARCHIVE_PATTERN reach, reserved openspec verbs, the
  legacy `pi-openspec-gate` alias).
- **2026-11-04 · post-archive commit gap (open)** — after `openspec archive`
  moved suggestions-never-approve, the session focus dangled on the moved
  change (mutations refused: no active change); re-aiming focus at the
  next change made the archival commit hit the approval teeth (focused,
  writes locked). The archival commit therefore always lands on the
  human's terminal, and the in-session block copy was 0.7.0's legacy
  remedy (installed package — today's state-aware blocks ship at next
  publish). Also worth a look: whether bash-extracted relative paths
  (e.g. `git add openspec/changes/`) match the `**/openspec/**`
  exemption at all — the docs exemption never got a chance to speak.
- **Backlog · external pause arming needs a pi session-id API** — the
  pause permit lives in session state (dies with the session, by law);
  arming it from a terminal (`pios-gate pause 30m` reaching the live
  session) needs pi to expose the session id/file to extensions. Until
  then `pios-gate pause` teaches and the in-session reply arms
  (2026-11-04, polishment Slice 1). Same channel would let a cockpit
  show the countdown.
