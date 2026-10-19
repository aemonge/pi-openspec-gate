# Execution: A professional front door

> Estimate: 30–45 min · high confidence, confirmed from plan. Human wait:
> review the rendered docs; VALID closes.
> Parents: docs-professional-pass (human directive, self-parented).

## Skills

bare — changelog and README writing; no domain skill (candidate later:
"release-notes ledger" — generating changelog entries from archived
4-tasks.md receipts automatically).

## Workflow

> Changelog from the archive (never memory), README from today's lived
> install lessons; both cite their sources.

## Steps

1. CHANGELOG.md: mine `openspec/changes/archive/*/4-tasks.md` + git log for
   per-version highlights; cite archived change dirs per version.
2. README: Development section + intro CLI mention.
3. package.json files += CHANGELOG.md; suite + lint; receipts.

## Verification

- Deterministic: `just test` + `just lint` green; `npm pack --dry-run`
  shows CHANGELOG.md in the tarball.
- Human validation: the human reads the rendered README + CHANGELOG and
  rules (VALID or edits).

## Safety & authority

- Mutation scope: README.md, CHANGELOG.md, package.json files array —
  attributed to this change (approved first).
- Docs-only: no runtime surface touched.

## History

Declared 2026-10-19 by human directive ("do it. Do all the docs and things
to make this super professional"); the CLI-install paragraph landed
separately as declared work (one latch, one mutation — the gate's law).
