# micro-plan-agile

## Goal

The micro plan artifact grows the agile spine it lost in the pivot: Estimate, Skills,
Approach (method + architecture), mandatory acceptance-titled slices, a commit per
step, and explicit human validation instructions — one file, one approve, still
zero-bureaucracy. Ships as micro v2 in both schema copies, the README's micro
section, AGENTS.md, and the walkthrough fixtures. The gate teaches artifact shape
only; process choice stays with the human and their skills (superpowers).

## Estimate

one session · high — coding done; the slice + re-validation remain

## Skills

none — the gate's own tests and walkthrough carried the evidence; the KO
hunt stayed systematic by habit

## Approach

method: dogfooded micro loop — draft, gate, slice-append on findings
architecture: stdlib-first, single module (bash + node:test, zero deps)

## Questions & Decisions

- Commit granularity → one commit per checkbox **step**; steps are the atom — no commit economy
- Size token in Goal → superseded: a real `## Estimate` section (range · confidence) — the miss, restored
- Slices optional → **mandatory**: every plan carries ≥1 `### Slice — <the acceptance>`; no slices, no goals to code
- Methodology + Architecture → one `## Approach` section, two labeled lines (`method:` · `architecture:`) — two H2s for two words is ceremony
- `architecture:` optional → omitting it consciously takes the documented simple
  default (stdlib-first, single module); naming a paradigm (or a comma-list of mixed
  ones) is the awareness win — no code is architecture-free, only unaware
- Skills → section may be empty; **choosing is mandatory** — a deliberate "none — why"
  beats an absent section; picking the skill per plan is a powerful decision
- Acceptance criteria → listed once as **prose bullets in Verification** (tick-free),
  echoed as slice titles in Tasks: build order up top, proof below; no AC checkboxes —
  they would count as agent work and could self-lock before the human pass
- Rootless territory → **KO #1, live-caught at /tmp/valitaino/bare**: the gate is
  installed globally and branch 4 blocks mutations even with NO openspec root — the
  model says rootless means ungated. Fix: rootless mutating calls pass (rooms keep
  their walls); lands in this walk via the appended slice
- Verdict-flip guard vs batch edits → **KO #2, live-caught on this plan itself**: the
  human-gate guard reads the single-edit payload shape (`oldText`/`newText`/`content`
  at top level); a batch `edits[]` payload computes post-state as `disk + newline` —
  pure pre-state. The guard missed the agent's accidental verdict tick (it landed)
  and then blocked the untick repair (the pre-state carried the tick). Fix: fold
  `edits[]` into post-state (sequential oldText→newText over disk) before
  flipsVerdictLine; tests fire both shapes. The published v1.15.0 ships the identical
  hole — version bump on release
- Validation law (generalized) → every artifact's validation is a **production smoke
  test + human manual walkthrough** — prompt ladders for gates, UI walkthroughs with
  attention points for UIs, API/BE smoke for backends — never `diff` / `git diff`;
  lands in schema ×2, templates ×2, README, AGENTS.md, and example VALIDATION.md
- Commit law scoping → binds plan-gated coding only; bare "skip the spec" work stays
  one mutation + one debt line, no commit ritual
- Workflow neutrality → the gate enforces **artifact shape**, never process: no
  mandated brainstorming, TDD, or skill loading — that choice is the human's
  (superpowers skills compose on top; the gate never fights them)
- VALID law → the Spec verdict already answers to a literal `VALID` reply (one-flip
  latch, human-reply only — nobody enters openspec files; `src/gate.ts:130`); slices
  get the same latch — a human `VALID` advances the boundary, same relay law → teeth
  in the follow-up walk; file-ticking stays the optional path, never the law
- Scratch territory → `openspec/changes/<slug>/scratch/` flows **today** via the
  `openspec/**` exempt — per-change experiments live beside the plan, die at archive;
  `**/.tmp/**` becomes one shipped exempt rule (enumerable-path tools; bash stays
  declare-door — fail-safe is never path-exempt); **whitelist mentality kept**: a
  deny-`src/` blacklist would let every unaccounted mutation outside `src/` flow
  (`~/.bashrc`, credentials, stray deletes) — the exact hole the fail-safe closes;
  territory is shaped per-repo in exempt config data
- Bare door → already folder-agnostic: the latch lands exactly one mutation anywhere;
  scratch investigation is drafting freedom, not bare work — the two compose without
  touching the latch; and with no openspec root there is no schema, no gate, no
  ceremony at all — by design
- Enforcement teeth → the scratch rule + slice-VALID latch land together in a
  **follow-up mini-iteration** (gate behavior, not artifact shape); this walk stays artifact-shaped
- KO #5, proven by the docs → the lab rooms were never gated: `pi install -l`
  writes a project declaration, and pi loads project packages **only after project
  trust is granted** — `pi -p` probes never grant it, so the gate skipped in every
  /tmp room post-remove (docs/packages.md). Honest corrections: Phase 1's silence
  validated the gate's ABSENCE, not the rootless fix (still unit-pinned, live proof
  owed); the only pre-remove refusal came from the global npm copy. Un-block: one
  interactive `pi` in the room grants trust, then the ladder runs truly armed
- Structure law bites its author → approve refused this plan for missing the three
  sections it just made mandatory — the dogfood working, no fix needed; the spine is
  now folded into this plan and the walk continues
- KO #4, proven by the ladder → `eospec new` swallows `--schema`: the bin reads the
  room's config.yaml (upstream init defaults `spec-driven`) and never parses the flag,
  so walk-1 was born spec-driven, focus reported `no gates`, and every Phase 2 wall
  was paper (probes 3–6 landed). Cut 1: room config says spec-driven; cut 2: walk-1's
  birthmark says spec-driven. Open suspect: probe #1 landed pre-change — one live
  probe (`pi -p "write probe.py"` in the focused room) discriminates armed-but-cascaded
  vs never-armed. Fix shape: honor `--schema` at birth (explicit beats room default)
  + lab guide pins the room to micro. Phase 1 (bare, KO #1's grave) validated live:
  gate loaded, rootless silent, hello.py lands
- History → stays dead; git is the history
- CLI teeth for the step-commit hash law → deferred; this walk refines the artifact, docs, and tests (surface it if the walk proves the need)

## Tasks

### Slice 1 — the micro schema speaks agile: v2 in both copies, byte parity

- [x] step: `openspec/schemas/micro/schema.yaml` — 7 sections (Goal, Estimate, Skills,
      Approach, Questions & Decisions, Tasks, Verification), instruction carries the
      shape laws (acceptance-titled mandatory slices, commit-per-step scoped to
      plan-gated coding, contracts-home, validation instructions as prose, architecture
      default, skills-choosing law), **both `description:` fields re-enumerate the
      spine**, `version: 2`
      commit: feat(schema): micro v2 — the agile spine
- [x] step: mirror byte-identical into `example/openspec/schemas/micro/schema.yaml`
      commit: chore(schema): mirror micro v2 to the example

### Slice 2 — the docs teach the same laws: templates, README, AGENTS.md

- [x] step: `templates/plan.md` ×2 — the 7 sections shaped (slice = acceptance title,
      step = commit line + hash slot, Skills = "none — why" allowed, architecture
      default named, Verification = AC prose bullets + explicit instructions, then the
      verdict; a comment warns instructions stay tick-free)
      commit: docs(schema): the micro plan template grows its spine
- [x] step: README micro section — section list, the step-commit law and its bare-work
      scoping, the yaml block, the shape-not-process stance
      commit: docs(readme): the micro loop, agile edition
- [x] step: AGENTS.md — the loop mechanics stay; section list becomes 7; one clause:
      process guidance (brainstorming, TDD, skills) belongs to the human's skills,
      the gate only shapes artifacts
      commit: docs(agents): the working agreement speaks v2

### Slice 3 — the tests tell the truth: pins, fixtures, gates green

- [x] step: section pins move to the 7-section list (schema.test, example.test, micro.test
      fixtures); walkthrough fixtures gain slices + steps (passed-count moves)
      commit: test(micro): pins and fixtures speak v2
- [x] step: `just lint` + `npm test` green; `diff` both schema copies clean; dry-run the
      walkthrough markers
      commit: chore(gate): micro v2 green

## Verification

- [x] typecheck / lint / tests pass (`just lint`, `npm test`, `./example/try.sh` marker count)

Automated checks above; the hands-on pass below is yours.

Validation instructions — the prompt ladder in your own terminal, never `diff` /
`git diff`: two territories under /tmp/valitaino — bare (no openspec, no gate →
mutations land free) and gated (openspec + schemas + local install → the correct
refusal at every state) — walked end to end with fresh `pi -p` probes, then judged:
would you write a dozen of these a day?

- [x] Hands-on validation

### Slice — the gate governs rooms only: rootless pass-through, guard sight, smoke-walk law

- [x] step: src/gate.ts — the human-gate guard folds batch `edits[]` payloads into
  post-state (editPostState per edit over disk, then flipsVerdictLine); tests fire
  both shapes: single-edit tick → blocked, batch tick → blocked, batch prose edit →
  flows
  commit: fix(gate): the flip guard sees batch edits
- [x] step: src/gate.ts — rootless mutating calls pass (no openspec root → no teeth;
  rooms keep their walls); test pins the bare-territory walk
  commit: fix(gate): rootless territory is ungated
- [x] step: the validation law in artifact wording — schema instruction ×2, templates
  ×2, README, AGENTS.md: validation instructions are production smoke tests + guided
  manual walkthroughs (prompt ladders, UI walkthroughs, BE smoke), never diffs;
  example VALIDATION.md gains the bare-territory P0 probe
  commit: docs(schema): validation walks, never diffs
- [x] step: `just lint` + `npm test` + walkthrough green; re-run the bare probe —
  hello.py lands
  commit: chore(gate): rootless + smoke-walk law green

### Slice — KO #4: the birth certificate honors its name

- [x] step: `bin/eospec.js` — `new` parses `--schema <name>` (explicit beats the
  room config default) and stamps the born change's meta with the declared schema —
  upstream scaffolders ignore the flag (walk-1 born spec-driven, KO #4); vocabulary
  test pins both births: flag wins, room default when absent
  commit: fix(gate): --schema honored at change birth
- [x] step: VALIDATION.md P3 teaches the birth law — the change is born with the
  declared schema (`schema: micro` in the birthmark), whatever the room default
  commit: docs(example): the lab room is born micro
- [x] step: `just lint` + `npm test` green; the human re-ladders the gated room —
  walls arm, latch disciplines, structure law bites
  commit: chore(gate): the birth law green
