# Brainstorm

> Spec: rebuild · consult `openspec/learnings/` before drafting

## Pain

Three generations of invented vocabulary ("the walk", aim/go/done, cockpit,
ledger, instruments) accumulated across iterations, and every generation
half-migrated the docs: the README teaches eight deleted commands, the
tool's own `status` output advertises a deleted verb (`pios-gate next`),
a ghost `mission` schema section survives in the README, and finished
changes sat unarchived for days. The gate also writes raw meta keys into
openspec's `.openspec.yaml` (`granted`, `status`, `approved_at`, …) that
openspec flags as unrecognized on every archive. The human's ruling: redo
from scratch — no one is using this, so nothing needs compatibility.

## Questions

- Final verb set (rulings 2026-11-11): three words. `focus <change>`
  sets the aim; bare `focus` prints the focused change and every change's
  pending state — the list is absorbed here, `status`/`list` die as
  separate words. `approve` is ONE command: approves the next pending
  step and names the new next — one press, one step, no named stamps, no
  separate advance verb. `close` is the guarded archive: refuses on
  unapproved artifacts or an unticked verdict, then execs `openspec
  archive` and releases focus. openspec's own `status`/`archive` remain
  raw passthrough — they speak openspec task state, not approval state
  (evidence: archive printed "Task status: No tasks" while two changes
  awaited human validation).
- Name (ruling 2026-11-11): the CLI is `eospec` — short, typeable,
  honestly positioned as extended openspec. npm package renamed to match
  (breaking, fine). `pi-openspec-gate` branding retires everywhere:
  package name, fact names, README title, install lines.
- Passthrough law (ruling 2026-11-11): the three verbs are the gate's
  whole surface; every other first word execs openspec verbatim, exit
  code intact — no allowlist to maintain, nothing to drift. `eospec --
  <args>` is the documented escape hatch: after `--`, openspec verbatim,
  bypassing even bare-change-name interception. `--help` is rewritten
  honest: the three verbs, the passthrough law, the hatch — never
  openspec's banner under the gate's name (the 2026-11-04 ruling,
  restated for eospec).
- `openspec/.focus` (rulings 2026-11-11, refined same day): one file,
  flat yaml, five-field rich snapshot — `change:` the aimed slug ·
  `artifact-name:` the current step's file (e.g. `4-execute`) ·
  `artifact-idx:` walk position (`4/4`) · `task:` checkbox progress
  inside the current artifact (`4/12`, counted from the artifact file —
  same semantics as openspec's own "Task status", so one word keeps one
  meaning) · `next-step:` the rendered act (e.g. `eospec approve`). Two
  progress axes on purpose: walk position and within-step progress.
  Authority law: the file is a rendered snapshot, never the
  decision-truth — `x-` meta + schema + artifact files stay the only
  truth; the human's own comment is the design: "one active change per
  room — [the gate] writes, verbs refresh". Every gate-side writer
  refreshes it (verbs on every invocation, extension stamps after
  writing meta), so a stale snapshot self-heals on the next gate touch.
  Single store: the file is the only focus truth; the session focus tool
  becomes a view of it or dies; subagent inheritance comes free by
  reading the same file; cost: two terminals in one repo share one aim,
  last aim wins. Plan-level edge cases: ungated rooms (artifact fields
  empty), no focus (file absent), close deletes the file.
- Example schema impact (scoped 2026-11-11): the spec schema's SHAPE
  survives untouched — four artifacts, the x- tag vocabulary, templates,
  and the declare-phrase mechanism are data, not commands. Touchpoints:
  example/try.sh (binary name `pios-gate`→`eospec`, assertions on
  teaching strings `→ pios-gate go`/`→ pios-gate done` at L77/L83);
  example/README.md (vocabulary, the printf meta keys `status:`→
  `x-status:`, the mission-era checklist item); schema.yaml instruction
  prose (two "grant" wordings at L49/L73 become approval wording);
  x-declares phrases (pending ruling); schema version bump 5→6 since
  its teaching text changes. Nothing structural.
  Prompting/variables refactor added (human challenge 2026-11-11,
  confirmed by inspection): nothing in src/ or bin/ reads `instruction:`
  or `description:` — the only parser mention is a yaml note about
  skipping block scalars — so the schema's per-artifact prose prompts
  nobody. Investigate must check whether openspec itself renders those
  fields, then plan rules: keep as human-facing schema docs, or delete.
  `<!-- slug -->` in four templates is a pseudo-variable nothing
  substitutes (drafted files keep it literally) — either the gate fills
  it at creation stamp or the pretense dies. Template authoring comments
  (`<!-- two to four sentences, observed, no solutions -->`) are live
  hints — they stay.
- Gate meta keys rename to `x-` namespace (`x-granted`, `x-status`,
  `x-approved`, `x-validated`) so openspec stops warning — any key openspec
  must not touch that we missed?
- Fact names (`pi-openspec-gate.blocked.v1` …) rename plain (`gate.blocked`
  …); keep the per-event split or collapse events?
- The declare phrases ("action the spec" / "execute the spec") — keep, or
  reword while everything breaks anyway?
- Doc↔CLI parity lint: parse the README command fence and the teaching
  strings in output, diff against the verbs the bin actually answers, fail
  `just lint` on drift in either direction. Scope: which files count as
  "docs" for this lint?
- CHANGELOG compresses pre-history to one paragraph; README carries
  current truth only — confirm, and decide what happens to the archived
  change ledger (stays as-is? referenced from where?)

<!-- Direction (optional, free): two equal halves — the watcher (extension)
buckets every mutating tool call as allowed-by-path / attributed /
declared / blocked, facts renamed plain; the CLI is the three-verb approval
surface above (name pending human pick) openspec stays the foundation (new/archive/file layout);
we own commands, output, docs, config keys, meta keys. Dictionary words
only — no invented nouns anywhere, enforced by the parity lint. -->
