# Investigate

> Spec: suggestions-never-approve · aim at the Brainstorm's Questions

## Findings

- **Four surfaces emit an `approve` suggestion for a step.** Sources (main @ 2026-11-04):
  `grantHint()` in `bin/gate-lib.js:494` — fallback `` `pios-gate approve ${slug} ${artifactId}` ``
  when the artifact declares no `x-grant` verb; consumed by `pendingReport()` (line 679, the
  cockpit's "next:" line) and `showReport()` (line 737, "next human act"). `blockArtifactApproval()`
  in `src/gate.ts:134` — same fallback in the phase-gate block when the missing precedent has no
  verb. `BLOCK_UNAPPROVED` (`src/gate.ts:129`) and `BLOCK_ARCHIVE` (`src/gate.ts:123`) hard-code
  `approve: pi-openspec-gate approve <slug>` regardless of the change's schema.
- **The hard-coded approve lines are dead remedies on gated schemas.** Human ruling 2026-10-23,
  enforced in `bin/pios-gate.js:127-139`: on a gated schema `approve` refuses — "approve is
  per-step" — and exits 1. So the unapproved-source block's suggestion fails when run, on exactly
  the schemas the gate is most active in. Observed live 2026-11-04: `pios-gate approve
  agency-feui-reshape` offered to the human of a gated change (her words: "its not approve …
  should be open, dig/investigate, plan, code/run/execute. Or simply 'next'").
- **The verb mechanism already works when declared.** With `x-grant` present, `grantHint` says
  `pios-gate <verb> <slug>` and the CLI resolves the verb against the change's schema
  (`bin/pios-gate.js:145-175`). The wrong word appears only through the verb-less fallback —
  making approve the *default* vocabulary of every verb-less gated schema.
- **`grantArtifact()` grants by artifact id with structure checks** (`bin/gate-lib.js:575-615`):
  sequence check (predecessor granted), gated-section check, structure check before stamping.
  A built-in "grant the first ungranted artifact" verb reuses this path unchanged — same safety,
  one resolution step on top (find first id where `!approved.has(a.id)` in declaration order).
- **Reserved-word surface already exists for this.** `RESERVED_WORDS` (`src/schema.ts:76-79`)
  bars schemas from shadowing CLI words; `APPROVAL_TOUCH_RESERVED` + `scanGrantVerbs`
  (`src/gate.ts:218-239`) extend the touch guard to every declared verb. A new built-in verb must
  join both — `next` in RESERVED_WORDS, and in the touch-guard's reserved alternation — or an
  assistant could invoke it across the tool boundary.
- **The gate's own walk validated the read-then-grant cadence this session** (2026-11-04):
  `dig` refused with "2-investigate.md not drafted yet — you approve what you read" until the
  draft existed; batch-granting three rungs in one terminal line was refused at the second. The
  cadence — draft, human reads, human grants — is the invariant the remedy copy must respect.
- **CLI identity (raised by the human during investigate review, 2026-11-04):** `pios-gate` is
  today "openspec as a feature extension" — unknown argv execs `openspec` verbatim
  (`bin/pios-gate.js:194-200`), and the wrapper header sells that as the contract. The wrapping
  reaches past the bin: the mutation classifier normalizes `pios-gate`/`pi-openspec-gate` to
  `openspec` before segmentation (`test/classifier.test.ts:317-326`, per the 2026-10-19
  pios-gate-cli plan), and `ARCHIVE_PATTERN` (`src/gate.ts:237`) keys on `openspec archive`.
  There is no `help` command (it falls through to `openspec help`) and no completion anywhere —
  the wrapper's own header comment is the only command documentation. README:109 states the
  passthrough line as the last row of the command table.
- **A second bin shares the stage:** `pi-openspec-gate` is a permanent legacy alias for two
  commands only (approve|validate, `bin/pi-openspec-gate.js`), kept "for every receipt and
  remedy line ever written". Single-name would mean retiring or freezing it — a published-surface
  decision (package 0.7.x, `files`/`bin` in package.json:16-19).
- **Verb-less schemas make completions interesting:** grant verbs are schema data
  (`scanGrantVerbs`, cached per root), so a completion script can enumerate static commands plus
  the verbs each repo's schemas actually declare — dynamic vocabulary, not a hardcoded list.

## Options

- **Built-in `next` verb + verb-preferred suggestions** — `pios-gate next <slug>` grants the
  first ungranted artifact in declaration order; every suggestion surface says the declared verb
  when one exists, `next` otherwise. Covers verb-less schemas, keeps flavored vocabulary where a
  schema declares it, one new reserved word, touch-guard extension, and state-aware rewrites of
  the unapproved/archive blocks (they already resolve the schema at their block sites, so the
  gated/legacy branch is local).
- **Fail verb-less gated schemas loudly** — validation error: every gated schema must declare an
  `x-grant` per artifact. No new verb, but it breaks the engine's "zero flow knowledge" stance
  (the engine would demand vocabulary), invalidates existing installed schemas, and still leaves
  the hard-coded approve lines in the unapproved/archive blocks to fix.
- **Suggestions always `next`** — ignore declared verbs in suggestion copy; the verb remains a
  terminal alias. Simplest copy rule, but it suppresses the schema's own voice (the flavored
  vocabulary a schema author chose) and makes every suggestion identical regardless of schema.

## Alternatives

- **Canonical `grant` as the fallback** — what it is: the verb-less fallback becomes
  `pios-gate grant <slug> <artifactId>` (already shipped, no new verb). Trade-off: two-token
  suggestions and the human must know artifact ids; no uniform one-word act. Pick-when: adding a
  reserved verb is judged too much surface for the cure.
- **State-aware blocks only, cockpit keeps approve fallback** — what it is: fix
  `BLOCK_UNAPPROVED`/`BLOCK_ARCHIVE` with the schema-resolved remedy but leave `grantHint` as is.
  Trade-off: the cockpit — the surface humans actually read — keeps naming the wrong word.
  Pick-when: the cockpit's copy is deemed someone else's slice.
- **Single-name gate-only CLI (no passthrough)** — what it is: `pios-gate` stops exec'ing
  `openspec`; its surface is the gate's own (pending · inspect · focus · grant · approve ·
  confirm · next-to-be · declared verbs · a real `help`), openspec commands stay `openspec`.
  Trade-off: the classifier's pios-gate→openspec normalization and `ARCHIVE_PATTERN`'s reach
  must be re-derived (retire normalization; archive stays typed as `openspec archive`),
  RESERVED_WORDS must decide whether openspec's verbs stay reserved (habit-collision: a human
  typing `pios-gate archive foo` would otherwise hit a schema-declared verb), and the legacy
  alias question must be answered. Pick-when: honest help + completions are judged worth a
  published-surface change.
