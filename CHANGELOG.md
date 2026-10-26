# Changelog

The archive (`openspec/changes/archive/`) is the source of truth — every
entry below cites the changes that produced it. Dates are release dates.

## Unreleased

- **Promptless and vocabulary-free** — the `context` handler and its
  injected protocol block are gone, and the shipped skill
  (`skills/mission-protocol.md`) no longer ships: the package injects
  nothing into LLM context, and block reasons carry their own remedies.
  The declaration latch's vocabulary moves to data — top-level
  `x-declares` per schema (union across resolvable schemas joins the
  built-in alias "do it"), and the block remedy names no schema.
  Vocabulary sweep across the engine: `MissionSchema`→`Schema`,
  `PhaseArtifact`→`Artifact`, `ladderComplete`→`allArtifactsGranted`,
  `grantRung`→`grantArtifact`, the `rung:` fact key→`artifact:`, and
  the `phases_approved` meta key→`granted` (breaking: rename the key in
  existing change meta). The grep-proof law now forbids
  mission|ladder|rung across src/, bin/, index.ts, and `just lint`
  pins the same statically. Dependency graphs hardened:
  `x-requires-approval` accepts multi-dependency lists (artifact N
  requiring both earlier artifacts blocks until each is granted), and
  self- or forward-references now fail loudly at parse (declaration
  sequence is grant sequence — previously a silent deadlock) on both
  parsers. New evidence gate: artifact-level `x-requires-written` —
  creation blocks until the listed artifacts' files exist (evidence, not
  approval; enforced by the extension at birth and fail-safe at stamp
  time when declared evidence vanishes), with the same earlier-artifact
  validation and bin≡src mirror; `schemaIsGated` now counts written-only
  gates. Ships `example/` — a self-contained starter (its own three-
  artifact schema exercising every tag) with `example/try.sh`, a self-
  verifying walkthrough (negatives first, then the full lifecycle;
  `just try`), pinned by `test/example.test.ts` and shipped in the npm
  tarball. Real-schema interop: the short `x-grant` tag is accepted as
  an alias of `x-grant-verb` (both on one artifact fails loudly), and
  schemas resolve from openspec's global home
  (`~/.local/share/openspec/schemas/`, XDG data) as well as the config
  dir — the shipped example now carries the real spec schema (v3,
  seven artifacts ending in `learnings`/`learn`) and its walkthrough
  runs it end to end. **Capability unlocks**: `x-unlocks: [research, writes]`
  — the schema declares WHEN a capability opens (which grant), config
declares WHAT it means (`unlocks.research` tools + bash command verbs;
  `writes` = all non-exempt mutations, no config needed); the legacy
  `x-unlocks-source: true` folds into `[writes]`; unknown capabilities and
  both-forms-at-once fail loudly on both parsers; the extension enforces
  the research window (research instruments block until the declaring
  artifact is granted; idle, unfocused research stays free) and the
  writes boundary (`writesUnlocked`, monotonic). The example now ships
  the **v4 spec schema** — brainstorm (open) → investigate (dig, unlocks
  research, journal free) → plan (commit, unlocks writes, six declared
  sections) → execute (build, receipts, verdict) — with slice-anatomy
templates (checkpoint → hash-evidenced commit → final human verdict,
  `surfaced:` routed to learnings), and `pios-gate pending` counts
  ticked commits without a hash as visible debt.

## 0.6.0 — 2026-10-23

- **The CLI reads the gates the schema declares — one schema, one truth** —
  the un-indented YAML block-list style parses on BOTH sides (bin and
  extension: the phase gates had been silently inert for the spec
  schema — caught live by the new parity pin on its maiden run);
  grant-shaped verbs resolve or fail loudly and never fall through to
  verbatim `openspec`; bare `approve` refuses on gated schemas (per-step
  only — human ruling 2026-10-23) and a scoped intent never approves
  more than its scope — the fail-open observed live 2026-10-23, pinned
  dead; shipped-schema symptom pins and bin ≡ src parity tests close
  the fixture-≠-shipped gap.
  [cli-schema-tag-parity](openspec/changes/cli-schema-tag-parity)

## 0.5.1 — 2026-10-21

- **Generic schema engine** — all flow knowledge moves from code to
  schema `x-` tags: `x-grant-verb` (verbs from data; positional grants
  removed), `x-verdict-line`, `x-receives-receipts`, `x-completes`,
  `x-unlocks-source`, and rich `x-sections` entries gating a rung's own
  sections (`x-requires-written` / `x-requires-approval`, sub-grants
  addressed as `artifact/section`); the canonical grant is id-addressed
  (`pios-gate grant <slug> <rung>`); the approval-touch guard covers the
  reserved surface plus every schema-declared verb; receipts land in the
  declared artifact; source unlocks at the declared rung; the protocol
  block, README, and skill teach the generic law with mission as the
  shipped example; a grep-proof test keeps the vocabulary out of engine
  code forever.
  [generic-schema-engine](openspec/changes/generic-schema-engine)
- **Quest-walk hardening** — live /tmp/test validation by the human:
  headings match case-insensitively (prose, not ids), the structure
  block says "phase gate" (the 'rung' sweep completed), the protocol
  block teaches agents to STOP and report anomalous blocks instead of
  debugging the engine, and wrapper `--help` reads the manual
  (read-only). [generic-schema-engine](openspec/changes/generic-schema-engine)

- Open receipt: focus-inheritance live proof — dispatch a named-session
  subagent in a focused gated repo and confirm
  `pi-openspec-gate.inherited.v1` + attribution (deferred from
  [2026-10-19-focus-inheritance-coverage](openspec/changes/archive/2026-10-19-focus-inheritance-coverage),
  archived with step 3 open by design).
- **Memory instruments** — all Engram write verbs pass ungated but
  recorded; lifecycle capture (session summaries, passive capture) is
  never silently eaten again.
  [memory-instruments](openspec/changes/memory-instruments)
- **Phase gates** — schema-declared human gates (`x-requires-approval`,
  `x-sections`, `x-lines`) enforced at the tool-call boundary; the five
  grants (propose/deal/plan/order/execute), the pending cockpit,
  `inspect`, strict next-rung-only ordering, structure-refusing stamps,
  cumulative `phases_approved` meta, `phasegate.v1` facts, the mission
  declaration latch, and the self-teaching protocol block + skill.
  [phase-gates](openspec/changes/phase-gates)
- **The mission schema** — one five-rung ladder (idea → proposition →
  proposal → plan → execution) replacing ramona-idea/ramona-plan; the
  claim born at rung 2, judged at rung 5's last checkbox.
  [mission-schema](openspec/changes/mission-schema)

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
