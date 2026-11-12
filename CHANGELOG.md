# Changelog

The archive (`openspec/changes/archive/`) is the source of truth — every
change that built this package is there, with receipts.

## Unreleased

- **stage-zero research flows as fact** — the 2026-10-27 wall retires:
  research instruments with no aimed change pass, recorded as
  `research-void` facts — the gate fences writes, reads flow recorded.
  Brainstorm joins `x-unlocks: [research]`, so aimed searches attribute
  from step one (schema v10). The aimed-but-ungranted window keeps its
  teeth.

## 1.2.0 — 2026-11-11

- **post-delivery** — the walk's fifth artifact, conditional: when a
  delivery surfaces findings too big for execute's slices, the verdict's
  `surfaced:` line routes them (`slice · → post-delivery`) and the
  fifth designs them inside the change that surfaced them — tick-first
  (`x-requires-verdict`), skipped entirely when no findings exist
  (`x-optional`). Schema v9.
- **the room law** — `next-step` names the human's verb only (approve
  while anything pends, close when all are granted); the `task:` line
  exists only when there are checkboxes; the all-granted name follows
  the walk, the counter follows the receipts. The room re-renders on
  every gate-side touch, not just verbs.
- **receipts land once** — identical receipts and debt lines dedupe
  (double-loaded gates land one line); receipts append as a tight
  block, no blank-line inflation.
- **debt.md dies** — deferral walks through post-delivery (route: park);
  post-close findings open their own change; the doors are two.

## 1.1.0 — 2026-11-11

- **the package name is restored**: `@aemonge-dev/pi-openspec-gate`
  ships the eospec CLI — the tool is eospec, the package keeps its name
  (1.0.0 shipped briefly as `@aemonge-dev/eospec`; that name is retired).
  Nothing else changes: same three verbs, same room file, same facts.

## 1.0.0 — 2026-11-11

The rebuild. Everything below arrived in one change
([rebuild](openspec/changes/archive/)):

- **eospec** — the CLI: one bin, `eospec`. The verb zoo
  (`go`/`done`/`list`/`grant`/`next`/`confirm`/`inspect`/`act`/`approve`
  as a stamp) is gone; three words answer: `focus` (aim the room; bare
  form prints every change, one line each), `approve` (the next pending
  step, one press one step), `close` (tick-checked validate + archive +
  aim release). Everything else — and anything after `--` — execs
  openspec verbatim, exit code intact. (1.0.0 briefly shipped under the
  package name `@aemonge-dev/eospec`; 1.1.0 restored
  `@aemonge-dev/pi-openspec-gate`.)
- **the room file** — `openspec/.focus` is the single focus store: one
  flat-yaml snapshot (change, artifact-name, artifact-idx, task,
  next-step), re-rendered by every gate-side touch, deleted by close,
  self-healing on the next verb. The gate prefers it over any session
  fact; the session-focus entry type unbrands to `eospec.focus`.
- **plain facts** — twelve session fact types unbrand:
  `pi-openspec-gate.<event>.v1` → `gate.<event>`.
- **x- meta** — every gate-owned key moves under the x- namespace
  (`x-status`, `x-granted`, `x-granted_<artifact>`, `x-approved_at`,
  `x-validated`, `x-validated_at`, `x-created_by`); openspec's
  unrecognized-key warning on archive is gone. No migration: no users.
- **breaking** — schemas relying on any pre-1.0 verb, fact name, meta
  key, or the old package name must move; nothing ships compatibility.
  The status package must write `eospec.focus` for session focus to
  read again (the room file works regardless).

## Pre-history (as @aemonge-dev/pi-openspec-gate, v0.x — 2026-10 → 2026-11)

Three generations of vocabulary came and went: mission schemas with
grant verbs, a per-artifact stamp surface, then a four-word walk. Each
renamed the world and half-migrated the docs; the archive ledger holds
every change that built them, and none of their command names survive
into 1.0.
