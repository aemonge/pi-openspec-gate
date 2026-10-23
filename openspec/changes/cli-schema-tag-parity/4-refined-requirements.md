# Requirements — refined: capture the style, pin the parity, keep the wall standing

> Deltas recorded from the drafted sheet — steering by Research (3-research.md) and the human's **A1 ruling**, terminal 2026-10-23. Questions retired: *parser consolidation* (two parsers stay) and *parity scope* (the capture rule, not tag mappings).

## Done when

> Delta: criteria 1–2 sharpened by F1/F4 (indent rule, not tags); the test criterion hardened into parity assertions; new both-styles criterion; the final criterion is now the claim Tasks judges.

- The pending-block capture in `bin/gate-lib.js` accepts un-indented YAML block sequences — `x-requires-approval:` at indent 2, `- idea` at the entry dash level — disambiguating list items from new artifacts by the `id:` key form. The shipped `spec` schema parses with `schemaIsGated` true and every declared verb reachable.
- Both list styles parse for every `x-` tag — flow (`[a, b]`) and un-indented block — verified against both shipped schemas, used as fixtures unchanged.
- `pios-gate grant <slug> <step>` grants exactly one step on a gated schema.
- Bare `pios-gate approve <slug>` on a gated schema refuses, naming the per-step surface (human ruling 2026-10-23); `approve <slug> <step-id>` grants exactly that step — a scoped approval never approves more than its scope.
- When a schema's gates cannot be determined (parse failure), grant-shaped commands refuse with the schema named — and a test pins the observed fail-open: legacy whole-change approval can never result from a parse gap.
- A verb that matches no artifact on a resolved schema fails loudly with its own error — never a silent `openspec` passthrough.
- Tests pin the three live symptoms against the shipped `spec` schema, **plus parity assertions: bin-parse ≡ src-parse over `spec` and `mission`** — drift fails loudly from now on.
- **Final, human-verified — the claim Tasks judges:** the repaired CLI walks a real gated flow end-to-end — a verb grant stamps exactly one step, `inspect` shows it granted, `pending` tells the truth, and no command approves more than its scope. Target walk: this change's own remaining steps.

## Scope

> Delta: the parity question is closed — two parsers stay (A1); the fix is the capture rule, not tag mapping; the proven side is untouched.

- `bin/gate-lib.js`: the pending-block capture rule — strictly-deeper items, plus same/shallower entries that are not `id:` artifact starts.
- `bin/pios-gate.js`: verb-path loud failure; `grant`/`approve` semantics per the ruling; no silent fall-through for grant-shaped input on resolvable changes.
- Tests: the symptom pins and the parity assertions.
- Untouched: `src/schema.ts`, the schema files, the shims.

## Out of Scope

> Delta: none to the fences; the extraction is now explicitly future work.

- Legacy `approve` on ungated schemas — behavior unchanged.
- The vocabulary rename — `terminal-only-approvals`' slice.
- Spanned-agent gates — `gate-spanned-agents`' slice.
- A meta repair command — the documented hand-stamp remains the remedy.
- Parser extraction / shared core (O2/A2) — its own future slice, triggered by any drift the parity tests catch.
- The `openspec` CLI itself — only the wrapper's dispatch is ours.

## Guardrails

> Delta: the consolidation clause is replaced by the A1 ruling; fail-closed is sharpened to the named regression.

- Never bulk: no single command grants more than one step on a gated schema.
- Fail closed on undeterminable gates — the legacy-approve fallback is the named regression to pin; it must never fire on a parse gap again.
- No silent fall-through to verbatim `openspec` for grant-shaped input once change and schema resolve.
- Existing meta stamps are never rewritten — set-only write semantics preserved.
- Two parsers by design (A1): parity is pinned by tests, not structure; `src/schema.ts` is not touched by this slice.
