# Idea: The CLI must read the gates the schema declares — one schema, one truth

## Pain

The schema declares its gates, the extension enforces them, and the CLI cannot see them: `bin/gate-lib.js` parses artifacts but not the artifact-level `x-requires-approval` / `x-grant-verb` tags that `src/schema.ts` maps, so the wrapper treats every gated schema as ungated. Three symptoms, all observed live on 2026-10-23: a verb grant falls through to verbatim `openspec` (`error: unknown command 'propose'`), `grant` refuses (`schema declares no gates (spec)`), and a scoped `approve gate-spanned-agents idea` fail-opened into whole-change approval — stamping `status: approved` + `approved_at` with no `phases_approved` and no `granted_idea`, after which `pending` flattered the change with "ready to archive?". A gate whose doctrine is fail-closed approved more than the human asked for.

## Questions

- Parity scope: which tags must gate-lib map — artifact `x-requires-approval` and `x-grant-verb` only, or also section-level `x-requires-written` / `x-requires-approval`, plus `x-verdict-line`, `x-unlocks-source`, `x-completes`, `x-receives-receipts`, `x-lines`?
- Once gates are visible, what may `approve` do on a gated schema — and with an artifact-id, is it always a step grant? (Ruled by the human, terminal 2026-10-23: `approve` stays; it must be artifact-by-artifact; a single bare `approve` that grants all six steps is not acceptable — bare approve refuses on gated schemas.)
- When a schema resolves but a verb matches no artifact, must the wrapper fail loudly instead of silently exec-ing `openspec` verbatim?
- One parser or two: does gate-lib import the engine's parser (or share a module) so parity is structural, or stay duplicated with tests pinning every tag both sides must read?
- Is there a repair path for meta already corrupted by the fail-open (this session's `approved_at`-only stamp), or is the documented hand-fix the remedy?
- Which tests pin the three live symptoms — verb dispatch, grant on a gated schema, scoped approve — plus the fail-open regression (scoped intent never approves the whole change)?
