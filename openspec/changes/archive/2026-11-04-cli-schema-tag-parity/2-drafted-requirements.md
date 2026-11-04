# Requirements — drafted: one schema, one truth at the CLI

## Done when

- `schemaIsGated` is true for the shipped `spec` schema on the CLI side — `bin/gate-lib.js` parses artifact-level `x-requires-approval`.
- `artifactForGrantVerb` resolves every verb the schema declares (`propose`, `draft`, `research`, `refine`, `plan`, `execute`) — verb dispatch never reaches the verbatim `openspec` fallback when the change's schema resolves.
- `pios-gate grant <slug> <step-id>` grants exactly one step on a gated schema.
- `pios-gate approve <slug>` on a gated schema refuses, naming the per-step surface — per the human ruling of 2026-10-23: approve is artifact-by-artifact; a single approve for all steps is unacceptable.
- `pios-gate approve <slug> <step-id>` grants exactly that step — a scoped approval never approves more than its scope, and a test pins the fail-open regression observed live on 2026-10-23.
- A verb that matches no artifact on a resolved schema fails loudly with its own error — never a silent `openspec` passthrough.
- Tests pin the three live symptoms (verb dispatch, grant on a gated schema, scoped vs. bulk approve) using the shipped `openspec/schemas/spec/schema.yaml` as fixture.
- Final, human-verified: a live walk in the human's terminal — `pios-gate propose <slug>` grants one step, `inspect` shows it granted, `pending` reports honestly.

## Scope

- `bin/gate-lib.js`: artifact-level `x-requires-approval` and `x-grant-verb`, plus the section-level tags the CLI's checks consume (the exact list confirmed by Research).
- `bin/pios-gate.js`: verb dispatch with loud failure, `grant` on gated schemas, `approve` semantics per the ruling.
- Tests run against the shipped `spec` schema as fixture — the schema file itself is untouched.

## Out of Scope

- Legacy `approve` on ungated schemas — behavior unchanged.
- The vocabulary rename (engine copy, protocol block, skill) — `terminal-only-approvals`' slice.
- A repair command for corrupted metas — the documented hand-stamp remains the remedy, including this session's two accidental whole-change stamps.
- Gates for spanned agents — `gate-spanned-agents`' slice.
- The `openspec` CLI itself — only the wrapper's dispatch is ours.

## Guardrails

- Never bulk: no single command grants more than one step on a gated schema.
- Fail closed: when a schema's gates cannot be determined, grant-shaped commands refuse with the schema named — never fall back to legacy whole-change approval.
- No silent fall-through to verbatim `openspec` for grant-shaped input once change and schema resolve.
- Existing meta stamps are never rewritten — set-only write semantics preserved.
- Behavior parity is the requirement; whether `bin` and `src` share one parser or stay duplicated with parity tests is Research's to steer — the schema file is the single source of truth either way.
