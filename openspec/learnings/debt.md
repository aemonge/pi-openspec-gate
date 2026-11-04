# Debt

Surfaced bugs, errors, and deferred work — routed here by change verdicts,
read by every step.

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
