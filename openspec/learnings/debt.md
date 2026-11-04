# Debt

Surfaced bugs, errors, and deferred work — routed here by change verdicts,
read by every step.

- **2026-11-04 · bare `pios-gate` answers as openspec** — `./bin/pios-gate`
  with no args falls through every handler and execs `openspec` verbatim
  (bin/pios-gate.js tail), so openspec's help banner prints under the
  gate's name; there is no gate-owned `help` and no completions anywhere —
  the bin header comment is the only command documentation. Tripped live
  by the human during suggestions-never-approve validation (catch #4).
  This is the single-name CLI question: the passthrough is the documented
  contract (README last row), and retiring it means re-deriving the
  classifier's pios-gate→openspec normalization, ARCHIVE_PATTERN's reach,
  RESERVED_WORDS' openspec-verb habit-collision, and the legacy
  `pi-openspec-gate` alias — recorded as suggestions-never-approve's
  investigate finding and deferred there, not absorbed. Candidate change:
  honest help + completions on a gate-only surface.
