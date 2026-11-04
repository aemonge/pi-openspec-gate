# Plan

> Spec: suggestions-never-approve · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

2–3 h including tests and docs · high confidence — every mechanism was read and pinned this session: `grantArtifact`'s reuse path (bin/gate-lib.js:516-615), the five suggestion surfaces, RESERVED_WORDS enforcement (src/schema.ts:76-79), the touch-guard alternation (src/gate.ts:219-222), and the two hard-coded block sites whose guards already read change meta. Same shape as the shipped cli-schema-tag-parity and state-aware-remedies changes.

## Skills

bare — the gate's own authoring session; the source and its suite are the skill. Nothing external qualifies for engine-internal TS/JS vocabulary work.

## Workflow

**Built-in `next` verb + verb-preferred suggestions** (Investigate's first option). `pios-gate next <slug>` grants the first ungranted artifact in declaration order; suggestions say the declared verb when the schema declares one, `next` when it doesn't; approve is named only where it is true (legacy whole-change stamp).

The other options lost: **fail verb-less gated schemas loudly** demands vocabulary from the engine's data (breaks the zero-flow-knowledge stance), invalidates installed schemas, and still leaves the hard-coded approve lines to fix; **suggestions always `next`** suppresses the schema's own voice — vocabulary from data, not code, is the engine's own law (grantVerbVocabulary). The alternatives lost: canonical `grant` fallback needs two tokens and artifact ids from the human — no uniform one-word act (her words, 2026-11-04: "or simply 'next'"); state-aware-blocks-only leaves the cockpit — the surface humans actually read — naming the wrong word; single-name gate-only CLI is a published-surface change far bigger than this pain, recorded as its own future question.

Two rulings this plan pins: the unapproved-source and archive blocks become state-aware **here** — both guards already resolve change meta at their block sites (gate.ts:527-528, 640-644), so the gated/legacy branch is local, and only the remedy's command line changes; the broader speaker/state copy reform stays in state-aware-remedies' scope. And yes — `next` joins both reserved surfaces (Q4): a schema may never declare a verb named `next` (RESERVED_WORDS), and an assistant may never invoke it (approval-touch guard).

## Slices

### Slice 1 — `next`: the uniform act

- [ ] `grantHint` fallback → `pios-gate next ${slug}` (bin/gate-lib.js:494); cockpit `pendingReport`, `showReport`, and the in-sequence grant error inherit it at their call sites
      started_at: · ended_at: · total: · check: · paths:
- [ ] `pios-gate next <slug>` command (bin/pios-gate.js, beside `grant`): resolve schema, refuse non-gated (grantArtifact's own line already says `use: pios-gate approve ${slug}` — the legacy truth), find first id where `!approved.has(a.id)` in declaration order, loud refusal when all granted, then `doGrant` unchanged
- [ ] RESERVED_WORDS += `next` (src/schema.ts:76) — a schema declaring `x-grant: next` fails validation loudly
- [ ] APPROVAL_TOUCH_RESERVED alternation += `next` (src/gate.ts:219) — tool-call invocations block like approve/confirm/grant
- [ ] bin header comment gains the `pios-gate next <slug>` line
- [ ] Tests: grantHint fallback (TS↔JS contract), next stamps first ungranted, next refuses all-granted, next refuses legacy schema with the approve line, reserved-word validation rejects `x-grant: next`, touch guard blocks `pios-gate next`
- [ ] Commit: `feat(gate): pios-gate next — the uniform step act for verb-less schemas`
      hash:
- [ ] Human validation

### Slice 2 — no surface names approve for a step

- [ ] State-aware blocks: `BLOCK_UNAPPROVED` / `BLOCK_ARCHIVE` gated branch builds the remedy from the change's own act — first ungranted artifact's declared verb, else `pios-gate next ${slug}`; legacy branch keeps the approve lines verbatim (constants stay the legacy variants; gated variants are builders)
- [ ] `blockArtifactApproval` verb-less branch → `pios-gate next ${slug}` (src/gate.ts:135) — `missing[0]` is the first ungranted precedent, which is exactly what `next` grants
- [ ] Tests: on a gated change neither block names approve and the remedy runs (verb when declared, next when not); on a legacy change the approve remedy is byte-identical to today's EXPECTED constants
- [ ] Docs: README command table gains `next` and the gate-verb row reads "declared verb, else next"; CHANGELOG Unreleased
- [ ] Commit: `fix(gate): step suggestions speak the schema's act — verb, else next`
      hash:
- [ ] Human validation

### Slice 3 — gate-owned help *(added 2026-11-04, human ruling: "no debt, fix now")*

- [ ] Bare `pios-gate`, `help`, `--help`, `-h` print the gate's own usage — never openspec's banner under the gate's name; unknown verbs keep the documented passthrough
- [ ] Tests: all four forms exit 0 with gate usage, no passthrough; README table row; debt entry retired as fixed
- [ ] Commit: `feat(gate): help — the gate introduces itself`
      hash:
- [ ] Human validation

## Verification

- `npm test` → all pass (155 baseline + new); `just lint` → "vocabulary law holds"; `./example/try.sh` → 11/11.
- Human validation (one act, Slice 1's ledger line): in the terminal, on a verb-less gated scratch change, `pios-gate next <slug>` stamps the first rung — and no suggestion or block on a gated change says approve. approve appears only where the schema is legacy. Only a human reply ticks it.

## History

- Drafted 2026-11-04, investigate granted 12:57:54Z. Evidence session: all five suggestion surfaces and both hard-coded blocks read at main @ b1796ca.
