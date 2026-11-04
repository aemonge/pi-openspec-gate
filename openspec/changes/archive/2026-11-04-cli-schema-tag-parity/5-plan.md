# Plan: heal the CLI's reading of the gates the schema declares

## Estimate

2–4 hours of agent work — capture rule ~15 lines in `bin/gate-lib.js`, grant-shaped dispatch + approve semantics ~30 lines in `bin/pios-gate.js`, tests ~200 lines (symptom trio, parity assertions, fail-open regression). Confidence: high on the mechanics (F1–F8 fully diagnosed); medium on test-fixture knock-ons — the loud-failure rule must not break genuine passthrough, and the existing wrapper tests pin today's behavior.

## Skills

`bare — no qualifying skill in this package; work proceeds on repo knowledge verified this session` (node ≥22.19 ESM, `node:test`, the two parsers, the dispatch order).

## Workflow

**Committed: A1 — minimal capture fix + symptom tests, hardened by the parity assertions the refined sheet pins.** It fixes the diagnosed mechanism where it lives, leaves the live-proven extension side standing, and converts silent drift into loud CI failure.

- **A2 lost:** structural one-truth re-validates the enforcement half to fix the reporting half — regression surface lands on the gate's teeth — and widens the merge surface for `terminal-only-approvals` and `gate-spanned-agents`, both queued behind this slice. Deferred as its own future slice, triggered if the parity tests ever fire.
- **A3 lost:** zero cure — bare `approve` stays fail-open and every gated walk hand-stamps; priced only to show the cost of nothing.

## Steps

1. **Red first.** Add failing tests parsing the shipped `openspec/schemas/spec/schema.yaml` through `bin/gate-lib.js`: `schemaIsGated` true, `artifactForGrantVerb('propose')` → `idea`, `x-sections`/`x-requires-approval` block lists populated, flow-style lists (mission) unchanged. Watch them fail.
2. **Fix the capture rule** (`gate-lib.js`, pending-block capture): an entry `- <content>` at any indent is a pending block item **unless** its content parses as an `id:` artifact entry — the strictly-deeper rule generalizes; `sectionsKeyIndent` stays the boundary for `x-sections` sub-key chunks only.
3. **Loud grant-shaped dispatch** (`pios-gate.js`): build the verb vocabulary from resolvable schemas (cached per root, mirroring `scanGrantVerbs`). If the command is in that vocabulary: resolve the change's schema — grant the matching step, or fail loudly (`pios-gate: '<verb>' is not declared by <schema-name>…`); **never** passthrough. Foreign commands keep verbatim `openspec` exec (existing passthrough test stays green).
4. **Approve semantics** (`pios-gate.js`): gated schema + bare `approve` → refuse, usage names the verbs and `grant <slug> <step>`; `approve <slug> <step-id>` → single-step grant via `doGrant`; ungated schemas keep legacy behavior unchanged.
5. **Pins:** symptom trio on a spec-schema fixture in a temp repo; the fail-open regression (parse gap can never yield a whole-change stamp); parity assertions bin-parse ≡ src-parse over `spec` and `mission`.
6. **Full suite green:** `npm test`.
7. **Ledger + self-verification walk:** receipts land in `6-tasks.md`; the human grants the remaining steps of this very flow through the healed verb path.

Source work begins at the flow's unlock — the tasks step's grant — or the human's literal declaration. Steps 1–6 are source mutations; they wait for it.

## Verification

Deterministic: `npm test` — new pins and parity assertions green, passthrough test untouched; `./bin/pios-gate inspect gate-spanned-agents` unchanged-truthful.

Human validation (the one human-only act): after the fix lands, grant this flow's remaining steps through the healed verb path — `pios-gate plan cli-schema-tag-parity` — then `execute` — and watch `inspect` show each step granted and `pending` tell the truth. The claim, judged by Tasks.

## History

Intended commit subject: `fix(gate-lib): capture un-indented block lists; loud grant-shaped dispatch; per-step approve on gated schemas — A1` · prices as of 2026-10-23 (research, this session).
