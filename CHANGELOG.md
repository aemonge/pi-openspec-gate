# Changelog

The archive (`openspec/changes/archive/`) is the source of truth — every
entry below cites the changes that produced it. Dates are release dates.

## Unreleased

- Open receipt: focus-inheritance live proof — dispatch a named-session
  subagent in a focused gated repo and confirm
  `pi-openspec-gate.inherited.v1` + attribution (deferred from
  [2026-10-19-focus-inheritance-coverage](openspec/changes/archive/2026-10-19-focus-inheritance-coverage),
  archived with step 3 open by design).

## 0.3.1 — 2026-10-19

Version-only re-release: 0.3.0's publish succeeded but the release recipe's
own install step raced the registry (ETARGET), and npm refuses republishing
an existing version. Identical content to 0.3.0.

## 0.3.0 — 2026-10-19

The gate becomes an openspec feature extension, and the classifier learns
compound commands.

- **`pios-gate` CLI** — gate-owned `approve`, `confirm` (renamed from
  `validate`, ending the collision with `openspec validate`), and `pending`
  (what needs the human, one command); every other argv execs `openspec`
  verbatim. `pi-openspec-gate` remains a permanent alias.
  [2026-10-19-pios-gate-cli](openspec/changes/archive/2026-10-19-pios-gate-cli)
- **Segment-conjunction classification** — every segment of a compound
  command must classify read-only; mutating-anywhere beats
  read-only-anywhere (no more `git status; npm install` passing); read-verb
  arguments are data, not commands; unknown grammar attributes (a receipt,
  never a denial). [2026-10-19-per-segment-bash-classification](openspec/changes/archive/2026-10-19-per-segment-bash-classification)
- **Focus inheritance fixed** — session files are
  `<timestamp>_<id>.jsonl`; the lookup now resolves both layouts, so
  subagents inherit the parent's openspec focus. Direct unit coverage
  added. [2026-10-19-focus-inheritance-coverage](openspec/changes/archive/2026-10-19-focus-inheritance-coverage)
- **Installed bins actually run** — plain-JS CLI wrappers (node refuses
  type-stripping under `node_modules`) + symlink-resolving shims; npm
  link-farm test. No npm-installed bin of this package had ever executed
  before this. [2026-10-19-shim-symlink-resolution](openspec/changes/archive/2026-10-19-shim-symlink-resolution)
- **Vocabulary law tracks its rulings** — `approv` sanctioned 2026-10-17
  finally removed from `just lint`'s forbidden set, un-wedging
  `just publish`. [2026-10-19-lint-vocabulary-law](openspec/changes/archive/2026-10-19-lint-vocabulary-law)

## 0.2.0 — 2026-10-17 (registry skip)

Approval teeth — attribution is not approval. Proposed → approved states,
human-terminal approval CLI, human-gate flip guard, archive guard,
assistant-creation stamping. The `status: proposed`/`created_by: assistant`
convention and the approval-touch block shipped here.
[2026-10-17-gate-approval-not-attribution](openspec/changes/archive/2026-10-17-gate-approval-not-attribution)

Never published as its own version: `just publish` was wedged by the lint
vocabulary law still banning `approv`. The content shipped within 0.3.0.

## 0.1.2 — 2026-10-15

Research instruments un-gated: graphify's query surface, bash read-only
verb set, redirect-pattern fix (silencing vs real sinks), powershell
parity. [2026-10-17-ungate-research-instruments](openspec/changes/archive/2026-10-17-ungate-research-instruments)

## 0.1.1 — 2026-10-14

Cockpit focus instruments un-gated (`work_focus`, `openspec_focus`,
`stage`, `subject`) — the gate never gates its own instruments.
[2026-10-17-ungate-cockpit-focus-tools](openspec/changes/archive/2026-10-17-ungate-cockpit-focus-tools)

## 0.1.0 — 2026-10-14

Initial package. The ladder gate live end-to-end: exempt / attributed /
declared / blocked with byte-stable copy and three remedies; federated
subagent inheritance; openspec creation never gated.
[2026-10-17-enforce-openspec-ladder-in-pi](openspec/changes/archive/2026-10-17-enforce-openspec-ladder-in-pi)
