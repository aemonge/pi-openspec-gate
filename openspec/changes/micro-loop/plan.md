# micro-loop

## Goal

Replace the 5-gate spec ladder with a single-artifact micro loop — draft
plan.md → `eospec approve` → code (+ `.ledger` receipts) → verify →
`eospec close` — so a dozen mini-plans a day cost zero ceremony. One hard
gate (approve) opens coding; accounting never sleeps.

## Questions & Decisions

- Public surface micro-only (human ruling 2026-11-19): this repo ships
  micro as its only schema — openspec/schemas/spec/ deleted, config.yaml
  → micro, example/ + README re-demonstrate on micro. User-global
  schema copies in other repos (~/.local/share) are untouched. Engine
  keeps its data-driven x- machinery (micro rides it; ladder paths
  idle) — the engine diet stripping multi-artifact machinery is the
  next mini-plan, not this one.
- Close law → plan.md carries `- [ ] Hands-on validation` (x-verdict-line):
  close refuses until the human ticks it (or replies VALID); `--force`
  skips all checks.
- Slice gating → opt-in: slices are `###` headings under Tasks; the marker
  line `slice-gates: true` enables per-slice pausing; `eospec approve`
  advances one slice, `--all` approves all.
- Declare phrases → keep both ("start the spec" / "skip the spec") in
  micro's x-declares.
- Conversation instruments → `ask_user_question` (and future question/
  memory-write instruments) classify read-only by default. Live-caught
  today: the gate blocked a question to the human — friction with zero
  safety benefit.

- Declared door overrides draft teeth (live-caught 2026-11-19: your
  "skip the spec" latched while micro-loop was aimed-draft and the wall
  swallowed it — branch order runs approval teeth before the declared
  check, and the block never named the door). Micro law: a human
  declaration lands exactly one mutation as bare work even in draft
  state — debt line, fact, visible; approve/close/pause/resume stay
  untouchable, verdict flips stay human-only. Draft blocks name the
  declare remedy; the self-declare note only rides states where
  declaring can help.

(Veto any decision by editing this section — the plan re-opens.)

## Tasks

### Slice: schema + plan model
- [ ] micro schema + template finalized (staged in this change — approving
      confirms them)
- [ ] src/plan.ts + bin/gate-lib.js twin: parse checkboxes, slices,
      slice-gates marker; completion = every checkbox ticked except the
      verdict line; counts for the room snapshot and CLI list
- [ ] openspec/config.yaml → schema: micro + question-first context
      (explore → ask → small plan → checks)
- [ ] delete openspec/schemas/spec/ (the 5-artifact ladder); gitignore
      the room snapshot (openspec/.focus is session state, not repo)

### Slice: watcher micro states
- [ ] micro state machine in gate.ts: draft (block source mutations, teach
      plan+approve) / coding (attributed + .ledger receipt) / verifying
      (all tasks ticked: lock source, allow verification verbs + plan.md)
      / slice-pause (touched-files summary + approve·--all remedy)
- [ ] verification verbs anchored (npm|pnpm|yarn|bun test / run
      lint·typecheck·check, cargo/go/just/make test·check) — pass in
      verifying as attributed receipts
- [ ] conversation instruments read-only by default (ask_user_question)
- [ ] archive-guard slug fix — `--help 2>&1` made the guard read slug `2`
      (live-caught today)
- [ ] micro block copy: the walk line, draft/verifying/slice-pause blocks;
      subagent relay + approval-touch guards untouched
- [ ] room snapshot (.focus) renders micro states: next-step law
      (approve → close) and task counts

### Slice: CLI + rules + docs + tests
- [ ] eospec new <slug> (auto-slug when omitted, auto-focus) · focus:
      numbered active list with [n/m tasks] (+TTY picker) · approve:
      plan.md exists + ≥1 unchecked task, slice advance, --all · close:
      tasks+verdict ticked or --force → archive → clear aim
- [ ] absorb the bootstrap (bin/eospec.js, declared work): slice
      advance, --all, micro close law, focus + room micro rendering
      (smoke-caught: re-approve echoes "approved" mid-coding; the room
      says close while tasks are open)
- [ ] human verbs receipt too: approve (and slice advances) append a
      `human-approve` line, close a `human-close` line, to the change's
      .ledger — the human's acts leave the same trail as the agent's
- [ ] AGENTS.md (repo root): question-first micro-loop rules
- [ ] example/ re-demonstrates micro: schema swap, try.sh micro
      lifecycle walkthrough, VALIDATION.md, example.test.ts rewrite
- [ ] README.md: micro loop replaces the multi-gate walkthrough;
      CHANGELOG v1.5.0 entry (micro ships, spec ladder retired)
- [ ] tests: micro schema parse (both twins), plan parser, watcher state
      transitions (draft→coding→verifying, slice-pause, verification
      verbs), CLI verbs, contract twins stay agreed

## Verification

- [ ] npm test green — full suite
- [ ] just lint green — vocabulary law + doc↔CLI parity
- [ ] example walkthrough (micro lifecycle) passes — try.sh green
- [ ] Hands-on validation
