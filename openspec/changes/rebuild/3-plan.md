# Plan

> Spec: rebuild · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

420–620 changed lines across ~18 files, nine slices. Confidence: medium —
the CLI/meta/docs sweeps are pinned site-by-site in the Investigate
journal; the focus-file redesign touches `src/focus.ts` and session-side
code verified at the consumer level but not at every call site, so its
slice carries the widest error bars.

## Skills

bare — plain-JS/TS CLI surgery in this repo's own law; the installed
skills target Rust, Python, and data work; nothing qualifies.

## Workflow

Route: direct — the Investigate journal pinned every site and the
Brainstorm committed every route; nothing contested remained (and its
Alternatives section manufactured none). Committed with this plan,
vetoable only before the approve:

- Option resolutions: `instruction:`/`description:` KEEP as human-facing
  schema docs (verification of openspec rendering cannot change the
  keep); `<!-- slug -->` MADE REAL — the gate fills it at creation
  stamp; session focus tool becomes a THIN VIEW of `.focus`; fact names
  RENAMED FLAT to `gate.<event>`, no collapse (blocked / attributed /
  exempt / declared have distinct consumers).
- Declare phrases KEPT: "action the spec" / "execute the spec".
- Lint scope: README fence, example/README, try.sh assertions, and gate
  teaching strings — diffed against the bin's actual verbs and the
  facts.ts-declared types, failing on drift in both directions.
- CHANGELOG: pre-history compressed to one paragraph; the archive ledger
  stays as-is, referenced from the README.
- Master-plan law: anything genuinely new surfacing mid-execution lands
  in `openspec/learnings/debt.md` — this change forks nothing.
- Slice 1 changes verbs in place in `bin/pios-gate.js` so every
  intermediate tree stays green; the file/package rename lands with
  Slice 5's package cut.

## Slices

### Slice 0 — housekeeping: the board-drain, committed

- [ ] stage and commit the two archive moves and the scratch-change
      deletion currently sitting dirty in git
  - [ ] chore(openspec): archive go-walk and grant-ref-aliases
        hash:

### Slice 1 — the CLI: three verbs, honest passthrough

- [ ] rewrite the CLI in place: `focus <change>` (aim; prints the act),
      bare `focus` (focused change + one line per change — no `[spec]`
      noise, single "approved"), `approve` (stamp next pending step,
      name the new next, one press one step), `close` (tick-check →
      meta stamps → `openspec archive` → focus file deleted), `--`
      escape hatch, honest help — human-terminal set: approve, close
- [ ] gate-lib surgery: kill the dead-verb emitter (`bin/gate-lib.js:101`),
      the stale completion string (`:628`), the approved·approved double
      print (`:615`/`:641`); teaching strings emit `eospec approve`/`close`
- [ ] wrapper tests migrated to the new verbs
- [ ] `just lint` and `npm test` green
  - [ ] feat(cli)!: eospec — three verbs, honest passthrough
        hash:

### Slice 2 — the focus file

- [ ] rich flat yaml snapshot (`change`, `artifact-name`, `artifact-idx`,
      `task`, `next-step`) written by every gate-side writer — verbs on
      invocation, extension stamps after meta writes; deleted by close;
      ungated rooms leave artifact fields empty; no focus leaves no file
- [ ] tests: five fields, self-heal on touch, edge cases
  - [ ] feat(focus): the room file — one yaml snapshot, verbs refresh
        hash:

### Slice 3 — the watcher

- [ ] `src/facts.ts`: twelve types renamed `gate.<event>`
- [ ] `src/focus.ts`: `galactica-status.openspec-focus.v1` brand dies →
      eospec entry type; the tool becomes a thin view of `.focus`
- [ ] approve-era commentary swept: `src/config.ts:55`,
      `src/gate.ts:148,156,205`, `legacyNeed` (`bin/gate-lib.js:631`)
  - [ ] feat(watch)!: plain facts, one focus store
        hash:

### Slice 4 — meta keys

- [ ] `writeChangeMeta`/`readChangeMeta` and every reader move to
      `x-granted`, `x-status`, `x-approved`, `x-validated`,
      `x-validated_at`, `x-created_by` — no migration (no users)
- [ ] example printf updated to `x-status:`
- [ ] proof: an `openspec archive` of a scratch change prints no
      unrecognized-key warning
  - [ ] feat(meta)!: x- namespaced change meta
        hash:

### Slice 5 — package

- [ ] package.json: name `@aemonge-dev/eospec`, bin `eospec`,
      description rewritten; file rename `bin/pios-gate.js` →
      `bin/eospec.js`; justfile publish/install targets and install
      lines follow
  - [ ] chore!: eospec package
        hash:

### Slice 6 — docs

- [ ] README rewritten: current truth only — two halves, install, three
      verbs + passthrough + `--`, config, facts, the real spec schema
- [ ] CHANGELOG compressed: one pre-history paragraph + the 1.0 entry
- [ ] example/README rewritten (mission-era checklist item dies);
      schema.yaml v6 (approval prose, eospec branding, declare phrases
      kept); `<!-- slug -->` filled by the creation stamp; try.sh on
      eospec with new assertions
  - [ ] docs!: current truth only
        hash:

### Slice 7 — the parity lint

- [ ] `just lint` parses the README fence, example/README, try.sh
      assertions, and teaching strings in bin/src; diffs against the
      verbs the bin answers and the fact types declared; fails on drift
      in both directions; all green
  - [ ] feat(lint): doc↔cli parity law
        hash:

### Slice 8 — release

- [ ] version 1.0.0, tag, `just publish`
  - [ ] chore(release): 1.0.0
        hash:

## Verification

Deterministic: `just lint` (vocabulary law + the new parity law) ·
`npm test` (wrapper suite green on the new verbs) · `try.sh` green
end-to-end on eospec · an archive of this very change prints no
unrecognized-key warning (Slice 4's fix proving itself) · `focus`
output shows single "approved", one line per change. The one
human-only act: tick 'Human validation' in 4-execute.md, then close
(today's spelling: `pios-gate done`; after Slice 1: `eospec close`).

## History

Commit subjects land during execute.
