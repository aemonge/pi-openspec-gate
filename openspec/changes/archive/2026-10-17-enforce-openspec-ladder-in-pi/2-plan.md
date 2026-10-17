# Plan: Enforce the ladder in Pi

> Amendment (2026-10-13, human ruling): the original artifacts are boilerplates —
> rethink applied. Dependency arrow inverted: the cockpit (a future
> derived-cockpit-status) is a downstream READER of focus + titles + gate facts;
> it never gates and the gate never depends on it. The gate is self-contained
> and owns its mutation classifier.

> Estimate: 2–4 h · medium confidence
> Evidence: Pi hook API documented — tool_call may return {block: true, reason}, handler failure blocks as fail-safe; gate mechanics proven live by pi-openappa (trust domain — we copy the mechanics, never the vocabulary)
> Parent idea: reshape-ramona-planning-into-durable-ladder
> Human wait: evidence review of one full gate protocol, then your reply

## Done when

- Every mutating call (classifier: annotations → bash verb-scan → unknown = mutating) requires the openspec focus to name an active change; otherwise it is blocked, visibly, with reason + remedies
- The block message carries paste-ready remedies — focus existing, create new, or your "do it" — never a bare denial
- Your "do it" (or equivalent instruction) is recorded as one visible debt line (`bare — <your words> · at <UTC>`) and the mutation proceeds
- Exemptions are path-scoped only — `**/openspec/**`, declared skills dirs, `**/docs/**` — from an explicit config list; every exempted write is recorded as an exempt fact with paths (the guarantee is *nothing unrecorded*, not *nothing malicious* — malice is appa's domain)
- Subagent sessions run the gate and inherit the parent's active change (federated inheritance)
- Gate events (blocked / declared / attributed / exempt) are facts via appendEntry — renderers (a future cockpit) read them; the gate never renders
- The gate owns and exports the mutation classifier (annotations → bash verb-scan → unknown = mutating): fail-safe semantics are a gating concern, not a display heuristic; a future cockpit imports from the gate, never the reverse
- Attributions append paths + timing receipts to the focused change's 4-tasks.md
- No waiver store, no trust states, no approvals — permission vocabulary is forbidden (appa territory; law of disjoint questions)
- Light-change creation flow exists (later slice): creating a change is never blocked

## Scope

- One Pi extension under the agents contract's authority model
- Reads: openspec focus state (session entry store, `openspec list --json` fallback) + attribution writes to the focused change's 4-tasks.md
- Classifier owned and exported by this gate — single source of truth at the enforcement point

## Exclusions

- No openspec CLI changes; no server-side anything; not a security boundary
- No rendering, no Work feed — a future cockpit is the reader/renderer of focus, titles, and gate facts; the gate never depends on a renderer
