# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — splitter

> Execution: per-segment-bash-classification

- [x] Step 1 — Implement `splitSegments()` in classifier.ts: quote/escape
      scan, `;` `&&` `||` `|` `&` `\n` separators, redirect-aware `&`
      (`2>&1` `&>` `>&` never split), `#`-to-newline comments, `\`-escape
      consumption, empty segments dropped; exported for tests
      check: splitter unit tests green (every trap in plan) ·
      paths: src/classifier.ts · test/classifier.test.ts · done 2026-10-19 —
      6 splitter tests: separators, quote opacity, redirect-`&`, word-start
      `#` (mid-word `a#b` stays data), tripwires incl. quoted-data negative,
      continuations

## Task 2 — conjunction verdict

> Execution: per-segment-bash-classification

- [x] Step 2 — Rewire `bashVerdict()`: split → per segment (mutating
      patterns first, then verb anchored after VAR= stripping, else
      fail-safe) → conjunction; creation requires all segments
      clean-or-creation; tripwires (`$(` backtick `<(` `>(` `<<` unbalanced
      quotes) → `bash.grammar=fail-safe`
      check: Hole A cases (`git status; npm install`) + Hole B cases
      (`ls; bash x.sh`, `which graphify; graphify --version`) now
      fail-safe · paths: src/classifier.ts · done 2026-10-19 — plus TWO
      discoveries mid-implementation: (a) hole A variant — old anywhere-
      escapes preempted even the redirect scan, `git status > out.txt`
      passed read-only; fixed via two-tier patterns (OPERATOR tier: redirects/
      in-place checked in every segment; COMMAND tier: only when the verb
      did not anchor read-only — preserves `graphify query "install flow"`
      and `git log --grep rm`, which the naive reorder broke); (b) lint law
      bit this change's own comment ("never trust") — rephrased
- [x] Step 3 — Matrix + reconcile existing tests; full suite + lint green
      check: `just test` + `just lint` · paths: test/classifier.test.ts ·
      done 2026-10-19 — 75/75 (61 → 75: 14 new), lint holds; zero existing
      tests needed reconciliation (all pre-existing assertions were
      single-segment); new: conjunction matrix, two-tier data-vs-command
      cases, creation conjunction both ways, newline separation,
      env-prefix strip
- [ ] Step 4 — Human validation — human reviews the newly-attributing
      compound list and rules on it response: <!-- original reply --> ·
      outcome: <!-- VALID --> · at: <!-- UTC -->

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:26:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:26:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:26:46Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:26:46Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:27:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:27:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:29:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:29:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/classifier.test.ts · at 2026-10-19T09:29:16Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/classifier.test.ts · at 2026-10-19T09:29:16Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/classifier.test.ts · at 2026-10-19T09:29:34Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/test/classifier.test.ts · at 2026-10-19T09:29:34Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:30:33Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/src/classifier.ts · at 2026-10-19T09:30:33Z
