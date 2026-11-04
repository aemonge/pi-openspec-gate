# Research

## Findings

- Walk #2 (2026-10-27, /tmp/gate-recheck, cold GLM-5.3 agent, v4 example schema, unreleased local tree): latch held — self-declare attempts ×2 refused; declare phrases listed and quoted worked (agent picked the semantically right one); writes blocked; relay final message textbook. Five flails, all copy/trigger-caused (memory obs #970).
- The declare line (gate.ts:79) was agent-addressed (`say …`) with an ambiguous qualifier ("human words only") — the agent's own paraphrase was "plain-words declaration"; it retried unbolded "in case the markdown bolding broke its literal match".
- The declare latch hooks `message_end` and checks `message.role !== 'user'` → return — assistant messages ARE observable; noticing them is implementable in-place.
- `researchCallMatches` (gate.ts:174) keys on the config/default tool list (Context7 already in `RESEARCH_TOOLS_DEFAULT`), but the window condition required a FOCUSED change's schema — no change ⇒ no window ⇒ everything free; the block even advertised the escape ("research without a focused change stays free — clear the focus", gate.ts:142).
- The classifier's `bashVerdict` returns per-segment verdicts but exported only `basis` — the offending segment was computed and discarded; carrying it out is a field, not a redesign.
- `findOpenspecRoot` keys on the local `openspec/` directory — a ready-made, project-local definition of "gated repo" (global-home schemas never make a repo gated).
- Gate-off mechanism: the human's kill-switch was host-level (repo config.json unchanged, `enabled: true`) — the ledger records the act, not a config edit.

## Options

- Block copy rewrite in `blockUnaccounted` vs a new block family: rewrite wins — one builder, parameterized headline/lead, keeps one remedy language (the walk's agents read ONE shape).
- Assistant-phrase noticing at `message_end` with a one-shot note on the next block vs a standing warning in every block: one-shot wins — the note rides exactly the block after the attempt, no noise elsewhere.
- Research-void blocking keyed on `findOpenspecRoot` vs schema-declaration presence vs global-home resolution: local-root wins — inert outside openspec repos (global-home resolves everywhere).

## Evidence & prices — as of 2026-10-27

- Full walk #2 transcript (this session): 2 self-declares, 1 offloaded create, 1 overgeneralized "every shell call refused", 4 free research calls (web_explore ×2 infra-dead, resolve-library-id, query-docs 83 lines).
- Test suite before: 149 passing; after the fixes: 155 passing (6 added: speaker copy, schemas/offender/headline builders, compound why-line, self-declare notice, research-void ×3 states).
- Vocabulary law tripped once during implementation ("remedy **ladder**" in a comment) — caught by the grep-proof test, reworded; the law bites its own author's agent.

## Alternatives

- Record-only void research (debt line in `bare-work.md`, never block)
  · lets orientation research flow but leaves the walk-#2 hole open — the agent researched indefinitely, the ledger grew, nothing taught the way out
  · pick when research instruments are reclassified as harmless reads by a future ruling.
- A research quota (N free calls, then block)
  · permission-shaped (counts as budgets), the gate is accounting-shaped; unenforceable per-tool without state
  · pick when the gate gains a quota instrument it does not have.
- Block void research (chosen shape)
  · closes the hole with the same remedy language; costs the 2026-10-17 idle-research ruling — overturn recorded in CHANGELOG
  · pick when void research counts as work, which walk #2 demonstrated.
