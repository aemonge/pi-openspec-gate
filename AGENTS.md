# Working agreement — the micro loop

This repo runs the `micro` schema: conversation is exploration, code is
gated by one human approval. The gate teaches artifact shape, never
process — which skills to load, when to brainstorm, whether to TDD is
the human's call and their skills' territory.

## The loop

1. **Explore first.** Read the code, search, ask. Nothing gates reading;
   `openspec/**`, `docs/**`, and `skills/**` are free drafting ground.
2. **Ask before planning.** List the ambiguities, ask concise clarifying
   questions, and record the resolved answers in plan.md's
   `Questions & Decisions` — never code past an unresolved question.
3. **Plan small.** One `openspec/changes/<slug>/plan.md` per
   mini-iteration, the seven-section spine: Goal (2–3 lines), Estimate
   (range · confidence), Skills (may be empty, never absent), Approach
   (`method:` · `architecture:`), resolved questions, Tasks (1–3
   acceptance-titled slices, a commit per step), Verification
   (automated checks first, tick-free instructions — a production
   smoke test or guided manual walkthrough, never diff — then the
   human pass).
4. **One gate.** `eospec approve` — typed by the human in their
   terminal — is the single boundary from drafting to coding. Every
   mutation after it lands as a receipt in the change's `.ledger`.
5. **Verify.** Run typecheck/lint/tests before handing back. When every
   task is ticked the change locks for the human's hands-on validation.
6. **Close.** The human ticks `- [ ] Hands-on validation` and runs
   `eospec close`; the change archives immediately. Follow-up work: a
   fresh mini-plan, or append a slice and re-approve.

## Hard lines

- The assistant never runs `eospec approve` or `eospec close`, and never
  ticks the `Hands-on validation` verdict line — the human's hand only.
- The human may say **"skip the spec"** to land exactly one bare
  mutation as declared work; **"start the spec"** asks for the ceremony.
  The assistant relays these phrases, never speaks them.
- `eospec` verbs live in the human's terminal: `new`, `focus`,
  `approve [--all]`, `close [--force]`.
