# Idea: The block teaches its way out — speaker-explicit, state-aware, segment-loud remedies; a research window that closes in the void

> Evidence: walk #2 (2026-10-27, /tmp/gate-recheck — cold agent, v4 example
> schema, local unreleased tree); memory observation #970.

## Pain

A cold agent in a fresh gated repo was set up to fail by the block's own copy. It self-declared `execute the spec` **twice** — bolded, then bare "in case the markdown bolding broke its literal match" — because `say … — human words only` (gate.ts:79) reads as an instruction to the agent with a style note, and the refusal was **silent**, so it guessed formatting; it offloaded change creation to the human because the create remedy left `--schema <schema-name>` unresolved while exactly one schema (`spec`) was resolvable; and it overgeneralized one blocked compound (`python3 --version` inside a read-only chain) into "every shell call is refused" because **no segment was named**. Worse: the same agent ran an entire unaccounted research phase — `web_explore` ×2, `resolve-library-id`, `query-docs` (an 83-line grammar pull, the investigate artifact's substance) — because the research window fires only on a **focused** change's schema (gate.ts ~392–405), and the block itself advertises the escape: *"research without a focused change stays free — clear the focus"* (gate.ts:142). The teeth held everywhere — fail-closed, zero unlocks, Fix #2 validated at the enforcement level — but the copy and the window's trigger did not.

## Questions

What-questions (Requirements' input):

1. No-change research: hard **block** with create/declare remedies (mirroring the mutation block), or **record-only** pass with a debt line in `bare-work.md` — which fits "never permission; always accounting"?
2. What defines a *gated repo* for the research window — project-local `openspec/` presence (`hasActiveChanges`-style state-awareness), or any resolvable schema? (Schemas in the global home resolve **everywhere**; keying on them blocks research machine-wide.)
3. Does the *"clear the focus"* escape line die everywhere, or survive only where the gate is inert?
4. Segment feedback: name **every** mutating segment in a refused compound, or just the first offender? Does the block gain a standing "read-only commands still pass" line?
5. With no change on disk, does the human's declare still buy one free mutation, or should the remedy steer straight to `create`?

How-might-we questions (Research's input):

1. How might the latch answer an assistant-message declare attempt — can the extension observe assistant text at the tool-call boundary at all, and if not, what can the *next* boundary's block say so the agent stops guessing?
2. How might every block site (unaccounted mutation, research window, phase gate, approval-touch) share one state-aware remedy ladder without duplicating `blockUnaccounted`'s state machine?
