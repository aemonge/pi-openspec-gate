# Investigate

> Spec: rebuild · aim at the Brainstorm's Questions

## Findings

All facts from direct file reads 2026-11-11 (this session) unless marked
live-caught in the human's terminal.

### The CLI (half one: maintain the focus snapshot, guard approvals)

- The bin answers exactly: `list`, `pause`/`resume` (teach-only, no
  state), bare `act`, `go`, `done`, aim-by-bare-change-name; every other
  word execs openspec verbatim, exit code intact — `bin/pios-gate.js`,
  read end-to-end.
- The file's own header claims the older verbs "keep answering …
  undocumented compatibility" — no such handlers exist; the body
  contradicts it ("the teacher is gone with the verbs").
- Dead verb in live teaching: `bin/gate-lib.js:101` —
  `readFocus(root) === slug ? 'pios-gate go' : \`pios-gate next ${slug}\``
  — `next` has had no handler since 0.9.0. Live-caught 2026-11-11: the
  `status` row for docs-walk-parity advertised `pios-gate next
  docs-walk-parity`.
- Double-print: `status: approved` + suffix renders "approved · approved
  2026-11-11T07:39:45Z" — `approvedSuffix` (`bin/gate-lib.js:615`)
  appended after `status.padEnd(10)` in `pendingReport` rows (`:641`).
- `completionLine` appends `→ pios-gate done` — `bin/gate-lib.js:628`.
- Human-terminal set today: `go` and `done` refuse tool-call invocations
  (bin/pios-gate.js usage block). Rename map: go→approve, done→close,
  slug→focus, list→absorbed into bare `focus`.
- Bare `act` is the renderer relay; the cockpit contract is documented at
  `src/focus.ts:5`.

### The watcher (half two: accounting)

- Twelve fact types, all branded `pi-openspec-gate.*.v1` —
  `src/facts.ts:7-18` (blocked, declared, attributed, exempt, inherited,
  instrument, unapproved, humangate, creation-stamped, phasegate,
  self-declare, pause). The README Facts table documents ten;
  `self-declare` and `pause` are undocumented there.
- Foreign brand: the session-focus fact type is
  `galactica-status.openspec-focus.v1` — `src/focus.ts:21` — a namespace
  from another project living in this repo.
- Session focus (pi-session facts via `src/focus.ts`) and repo focus
  (the `.focus` file via `writeFocus`/`readFocus`) are two independent
  stores; the CLI branches on "focus is stale — pios-gate \<slug\>" when
  they disagree (go/done/act in bin/pios-gate.js).
- Config surface: `enabled`, `exempt[]`, `accountingTools`,
  `readOnlyTools`, `approval{enforce, humanGateSteps, archiveGuard,
  stampCreations, phaseGates}`, `pauseCeiling`, `unlocks.research{tools,
  commands}` — `src/config.ts:27-50`; approval defaults all-off when the
  block is absent (`:72`).
- Approve-era leftovers in code commentary: "legacy behavior"
  `src/config.ts:55`; "legacy whole-change stamp" `src/gate.ts:148,156`;
  "the built-in alias is retired" `src/gate.ts:205`; `legacyNeed`
  `bin/gate-lib.js:631`.

### Meta keys (openspec's boundary)

- The gate writes `status`, `granted`, `granted_<artifact>`,
  `approved_at`, `validated`, `validated_at`, `created_by` into
  `.openspec.yaml`; openspec warns "Unrecognized key name(s) … Known
  keys: schema, created, goal, affected_areas, initiative, skip_specs,
  retire_capabilities … prefix a key with x-" on every archive —
  live-caught in the human's terminal on both 2026-11-11 archives.
- Meta is the decision-truth the CLI reads (granted set, approved_at,
  validated) via `readChangeMeta`/`grantedSet` (gate-lib).
- `example/README.md` ships the raw key in its copy-paste:
  `printf 'schema: spec\nstatus: proposed\n'`.

### Docs (README / CHANGELOG)

- Command fence L68–77: `act <slug>`, `inspect`, `grant`, `next`,
  `confirm <slug>`, `focus [slug]`, `approve`, bare `confirm` — none
  answer; the `go` line itself says "(archive after confirm)". Alive in
  that fence: `<slug>`, `go`, `list`, bare `act`.
- Intro L13 cites "the shipped `mission` schema" declaring
  action-the-mission; the block example ten lines above names `spec`.
  §"The shipped `mission` schema" (L47–65) documents a yaml no package
  path ships (root schemas and example schemas each hold only `spec` —
  ls-verified).
- Retired-history prose: L37 ("the built-in 'do it' alias is retired"),
  L70 ("legacy single-approve behavior"), L74 (`x-unlocks-source` legacy
  alias — still real: `src/schema.ts:50,293` folds it into `[writes]`),
  L111 (`approve` documented as a feature).
- §Try it claims negatives "grant sequence, approve-what-you-read,
  structure refusal"; try.sh's actual negatives: undrafted stamp
  refusal, structure refusal, verdict wall.
- CHANGELOG 0.9.0 claims "Kept: … `focus [slug]` (the named aim)" — no
  focus handler exists.
- Install: `pi install npm:@aemonge-dev/pi-openspec-gate` +
  `npm install -g` (alias `pios-gate`); package.json `bin` map:
  `pi-openspec-gate`, `pios-gate`.

### Example & schema

- try.sh: `GATE=${GATE:-"$ROOT/bin/pios-gate"}` (L16); assertions on
  `→ pios-gate go` / `→ pios-gate done` (L77, L83).
- example/README.md: "The walk is two words: aim once
  (`pios-gate lab-run`)"; checklist item 5 drills mission-era artifacts
  ("create `2-drafted-requirements.md` while `idea` is ungranted").
- schema.yaml: `description:` names `pi-openspec-gate` ("x- tags declare
  the human gates that pi-openspec-gate enforces"); "grant" prose L49
  ("the grant that opens them is the human's") and L73 ("This grant is
  the docs→code boundary"); `x-declares: [action the spec, execute the
  spec]` — keep/reword pending ruling.
- `instruction:` and `description:` have no consumer in src/ or bin/
  (rg over both trees; only hit: yaml note `src/schema.ts:16` about
  skipping block scalars). Whether openspec itself renders them — not
  yet verified.
- `<!-- slug -->` sits in all four templates; nothing substitutes it —
  drafted files keep it literally (observed on this session's own two
  drafts).
- Template authoring comments (`<!-- two to four sentences, observed,
  no solutions -->`) are filled during drafting — live hints, not cruft.

### History

- Archive holds 18 changes (2026-10-17 → 2026-11-04) plus today's two
  (`2026-11-11-go-walk`, `2026-11-11-grant-ref-aliases`); CHANGELOG is
  ~19KB carrying three vocabulary generations; the board-drain file
  moves are currently uncommitted in git.

## Options

- **`instruction:`/`description:` fate** — keep as human-facing schema
  documentation (schema authors read schema.yaml; templates carry the
  machine truth) vs delete as unconsumed prose. Hinge: whether openspec
  renders those fields anywhere — verify before plan commits.
- **`<!-- slug -->`** — make it real (the gate substitutes the slug at
  creation stamp; drafted files open pre-named) vs remove the comment.
- **Session focus store** — thin view of `.focus` (tool reads/writes the
  file; one truth; subagents inherit free) vs delete the tool entirely
  (CLI-only focus). Single store is decided; only view-vs-die is open.
- **Fact names** — rename twelve types to plain `gate.<event>` vs
  collapse to fewer events. Note: blocked/attributed/exempt/declared
  have distinct consumers today (receipts, debt line, cockpit), so
  collapsing changes what renderers can distinguish; renaming is
  mechanical.

## Alternatives

None manufactured. The routes the brainstorm committed (three verbs,
unknown-passes-verbatim passthrough, `x-` meta namespace, eospec rename,
single focus store) were chosen with trade-offs recorded there; this
journal supplies only the evidence those routes must cover and the four
genuinely open options above.
