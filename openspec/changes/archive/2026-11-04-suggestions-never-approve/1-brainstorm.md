# Brainstorm

> Spec: suggestions-never-approve · consult `openspec/learnings/` before drafting

## Pain

The gate's own suggestion surfaces tell the human to `approve` a step of a gated flow. Observed live (2026-11-04): on a focused gated change the remedy said `pios-gate approve <slug>` — the wrong word (approve means completing a change, not advancing a step) and, on the unapproved-source and archive blocks, a remedy the CLI refuses ("approve is per-step", human ruling 2026-10-23), so the suggestion exits non-zero when run. The engine's grantHint falls back to approve for any artifact without a declared x-grant verb, making the wrong word the default for every verb-less schema.

## Questions

1. Should `next` be a built-in reserved verb — `pios-gate next <slug>` grants the first ungranted artifact in declaration order — so every gated schema has a uniform human act even with no declared verbs? Or should verb-less gated schemas be invalid instead?
2. When an artifact declares a verb, should suggestions prefer it (`pios-gate dig <slug>`) with `next` as the uniform fallback, or always say `next`?
3. Do the unapproved-source and archive blocks become state-aware here (gated → declared-verb/next remedy; legacy → approve), or is that left to state-aware-remedies?
4. Does the approval-touch guard need `next` added to the reserved surface so an assistant cannot invoke it?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
Direction: approve keeps its one true meaning — the legacy whole-change stamp. `next` becomes the uniform act; declared verbs are the flavored act; suggestions say the verb when the schema declares one and `next` when it doesn't. The engine never names approve for a step.
