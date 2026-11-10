# Plan

> Spec: go-walk · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

120–160 changed lines across six files. Slice 1 (walk surface): ~70–90 — `bin/pios-gate.js` (dispatch rework, focus, `go`, `list`), `bin/gate-lib.js` (focus read/write helpers), `test/pios-wrapper.test.ts` (+~50). Slice 2 (verb kill): ~50–70 — `bin/gate-lib.js` + `src/schema.ts` (silent-ignore, removals), `openspec/schemas/spec/schema.yaml` (strip `x-grant`, bump to v5), `test/vocabulary.test.ts`, README + help text. Confidence: high — every removal target was enumerated in investigate; `go` is dispatch over `grantArtifact`, not new logic.

## Skills

bare — plain-JS CLI surgery inside this repo's own law again; no sanctioned skill covers it.

## Workflow

Route: direct — the investigate Options winner (thin aliases over the existing law). None of the Alternatives picked: `ok`-naming lost (human ruling 2026-11-10 picked `go`), shared focus store lost (human authority ≠ agent authority), loud `x-grant` error lost (breaks schema v4 consumers mid-flight; silent ignore never punishes). Teaching lines do all naming; the CLI learns no stage names.

## Slices

### Slice 1 — the walk surface: `<slug>` aims, `go` advances, `list` watches

- [ ] terminal focus: `<slug>` and `focus <slug>` write the root state file (`openspec/.focus`, one line, per room); bare `focus` prints the current focus; stale focus (archived/missing change) refuses with `focus is stale — pios-gate <slug>`
      started_at: · ended_at: · total: · check: · paths:
- [ ] `go`: no focus → refuse; resolve focused change → first ungranted artifact → the exact `grantArtifact` checks → stamp; ladder tail: all-granted-but-unverified refuses pointing at `confirm`, validated executes the openspec archive flow (guard hatch honored) — the verdict wall stays intact
      started_at: · ended_at: · total: · check: · paths:
- [ ] `list` renders the cockpit (`pendingReport`); `pending` stays as alias; openspec's own `list` remains reachable via direct `openspec list`
      started_at: · ended_at: · total: · check: · paths:
- [ ] resolution order for one-arg calls: gate verbs → existing change name (focus) → passthrough verbatim; unknown single args still forward; bare `pios-gate` still prints usage
      started_at: · ended_at: · total: · check: · paths:
- [ ] `go` and `focus` join RESERVED_WORDS in both mirrors; help block and doc comment rewritten to the four-word walk (`<slug> · go · list · confirm`)
      started_at: · ended_at: · total: · check: · paths:
- [ ] wrapper tests: focus set/show/stale; `go` ladder — stamp, undrafted refusal, unverified refusal, archive after confirm; `list` cockpit output; bare-slug resolution and passthrough intact; `go` never forwards
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(cli): the two-word walk — <slug> aims, go advances
        hash:

### Slice 2 — the verbs die by silent ignore

- [ ] `parseSchemaYaml` (both mirrors): accept `x-grant`/`x-grant-verb` and silently ignore; remove `grantVerbVocabulary`, verb-shadow validation, `artifactForGrantVerb`, declared-verb branch from the dispatch
      started_at: · ended_at: · total: · check: · paths:
- [ ] `grantHint` always names `go`; `approve`'s gated-schema refusal points at `go` instead of listing verbs
      started_at: · ended_at: · total: · check: · paths:
- [ ] the example loses its verbs: `openspec/schemas/spec/schema.yaml` strips the four `x-grant` lines and bumps to version 5; README and doc comment updated to the go walk
      started_at: · ended_at: · total: · check: · paths:
- [ ] vocabulary verb-walk tests become go-walk tests; rung semantics survive in artifact descriptions and instructions untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] `just lint` and `npm test` green
      started_at: · ended_at: · total: · check: · paths:
  - [ ] feat(cli): verbs die — the echo names every act, go performs it
        hash:

## Verification

Deterministic: `just lint` (vocabulary law holds) · `npm test` (wrapper + schema suites green; grants never forward) · a fixture walk presses `go` through all four rungs of a gated schema and archives only after `confirm` · a legacy schema carrying `x-grant` parses clean with no verbs resolving. The one human-only act: from the repo bin, `pios-gate grant go-walk 4` — the row alias stamps execute on this very change (the declared verbs are already dead by then, which is the point).

## History

<!-- commit subjects land after the slice commits -->
