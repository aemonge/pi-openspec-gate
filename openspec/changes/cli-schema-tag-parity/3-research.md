# Research: one schema, two parsers, one indent convention

## Findings

- **F1 — The mechanism, located.** `bin/gate-lib.js` captures pending block lists only when items sit *strictly deeper* than their key (`indent > sectionsKeyIndent`, ~L209, capture at ~L172–177). The shipped `spec` schema writes block sequences un-indented — `x-requires-approval:` at indent 2, item `- idea` at indent 0 (`openspec/schemas/spec/schema.yaml` L58–59) — so every `x-requires-approval` and `x-sections` block list parses **empty** on the CLI side. The dropped `- idea` lines match no artifact entry (`KEY_LINE` fails) and are silently skipped.
- **F2 — The verb mapping itself is fine and unreachable.** `x-grant-verb` maps correctly (gate-lib.js ~L222–227), but the wrapper's verb path guards on `schemaIsGated` (pios-gate.js ~L141), which is false because every `requiresApproval` set came out empty — the tags are present, the guard just can't see them.
- **F3 — Silent fall-through turns one parse gap into three symptoms.** Dispatch order in `bin/pios-gate.js`: fixed commands → verb path (silently skips on any unmet condition) → `confirm` → verbatim `openspec` exec. Live 2026-10-23: `unknown command 'propose'` (that error is openspec's, not the wrapper's — both PATH and working-tree binaries); `grant` → `schema declares no gates (spec)`; `approve` → gated branch skipped → legacy whole-change stamp (`status: approved` + `approved_at`, no `phases_approved`, no `granted_idea`) — the fail-open.
- **F4 — Mission v1 worked because it never hits the broken path.** The mission schema writes flow lists — `x-requires-approval: [idea]`, `x-sections: [Done when, Scope, Out of Scope, Guardrails]` (mission/schema.yaml L38, L57) — parsed inline by `parseListValue` when the value is non-empty; no pending-block capture involved. The wrapper's live mission-schemag walk (archived live-protocol-evidence, 2026-10-17) passed for this reason. Spec v2 switched to un-indented block style and exposed the rule.
- **F5 — The extension side parses the same file correctly, live-proven.** `src/schema.ts` handled the identical schema: the first live phase-gate firing checked `requirements`' precedent (`idea`) and its declared sections at artifact birth (this flow's `2-drafted-requirements.md`, 2026-10-23 10:35Z).
- **F6 — No test parses a shipped schema through the bin parser.** `test/pios-wrapper.test.ts` builds temp repos with inline fixture metas and a fake `openspec` on PATH; `test/schema.test.ts` covers resolution edges (undefined schema, no-such-schema). Fixture-schema ≠ shipped-schema is the unpinned regression class.
- **F7 — Stamp mechanics make the hand-stamp walk exactly equivalent to a CLI grant.** `PHASES_KEY = 'phases_approved'` (src/approval.ts L24); `grantValues` writes the cumulative comma list plus `granted_<step>` stamps; `readChangeMeta` is line-oriented last-wins (duplicate identical lines are inert — observed when a stamp was pasted twice); `writeChangeMeta` is set-only.
- **F8 — Runtime split constrains the options.** `bin` is plain ESM JS spawned by shell shims; `src` is TypeScript under the Pi runtime; the package ships no build step (`package.json` files: index.ts, src, bin); engines node ≥22.19.0.

## Options

- **O1 — Fix the capture rule; keep two parsers; pin parity with tests.** Teach gate-lib's pending capture the un-indented sequence style (disambiguating list items from new artifacts by the `id:` key form), and add parity tests asserting bin-parse ≡ src-parse over every shipped schema (`spec`, `mission`). Smallest diff; drift stays structurally possible; tests become the guard.
- **O2 — Extract a shared plain-JS parser core.** One module imported by both `bin/gate-lib.js` and `src/schema.ts` (TS re-exports with types). Kills the drift class structurally; medium diff; touches the currently-correct TS side.
- **O3 — bin imports the TS parser directly.** Shims invoke node with strip-types; one parser, no extraction; couples every CLI spawn to a TS runtime flag (`--experimental-strip-types`), no parser move.

## Evidence & prices

*As of 2026-10-23.*

- Live transcript: `unknown command 'propose'` (PATH + working tree, 09:4xZ); `schema declares no gates (spec)` (10:2xZ); two accidental whole-change stamps (09:50:05Z on `gate-spanned-agents`, 10:23:50Z on this change) with `pending` flattering "ready to archive?"; hand-stamp walk passed the extension's phase gate (10:35Z).
- Code: gate-lib.js — indent rule ~L209, `schemaIsGated` guard in pios-gate.js ~L141, verb mapping ~L222–227, dispatch order ~L82–160; src/schema.ts mappings live-verified through the phase gate.
- Schemas: spec v2 block-style un-indented lists vs mission v1 flow lists — the style delta is the trigger.
- Tests: wrapper fixtures inline; zero shipped-schema coverage through the bin parser.
- Prices: O1 ≈ small diff + parity tests; O2 ≈ extraction + both-sides imports + full suite green; O3 ≈ shim change + runtime flag, zero parser movement.

## Alternatives

- **A1 — Minimal capture fix, symptom tests only.** Smallest possible cure; the two-parser drift class survives for the next style delta, pinned only by the three symptom tests. Pick-when release pressure dominates and a pinning follow-up is scheduled immediately after.
- **A2 — Shared parser core (O2) in this slice.** Structural one-truth ends the drift class permanently; the diff touches a currently-correct extension side, so regression risk moves to the safe half of the codebase. Pick-when the drift class must die and the release window tolerates the larger diff.
- **A3 — No code; document the hand-stamp workaround.** Zero risk, zero cure: every spec-flow walk hand-stamps its grants and bare `approve` stays fail-open. Pick-when never, on its own — priced only to show what doing nothing costs.
