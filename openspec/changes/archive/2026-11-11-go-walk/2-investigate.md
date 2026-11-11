# Investigate

> Spec: go-walk · aim at the Brainstorm's Questions

## Findings

- Today's one-arg law: the CLI's final passthrough forwards **all** argv unconditionally (`spawnSync('openspec', passthroughArgs)`), and the declared-verb branch requires two args — so `pios-gate lab-run` lands on openspec and answers `unknown command 'lab-run'` (live-caught in the deck-lab, 2026-11-10), and `pios-gate list` renders openspec's own change list ("No tasks" — it cannot count spec-schema artifacts).
- The resolution order to build: **gate verbs → existing change name (focus) → passthrough verbatim** — killing declared verbs collapses today's four tiers to three; unknown single args keep forwarding with exit code intact, so nothing outside the gate's surface changes.
- Terminal focus needs a new store: a state file in the openspec root (one active change per room), written by `<slug>`/`focus <slug>`, read by `go`/`list`/`ko`-surfaces. It must die with its change: `go`/`list` on a stale focus refuse with `focus is stale — pios-gate <slug>`. It is the **human's** authority; the agent's session focus (`openspec_focus`) stays a separate store — never merged, never written by the CLI.
- `go`'s ladder is `next` wearing the focus: resolve focused change → first ungranted artifact → the exact `grantArtifact` checks (drafted, structure, sequence) → stamp. Context-stacked tail: all-granted-but-unverified refuses pointing at `confirm`; **archive fires only after validation**, executing the same openspec archive flow the human would run (guard hatch honored) — the verdict wall stays intact.
- Surfaces already in place that `go` rides on: `grantArtifact` (all checks), `pendingAct`/`completionLine` (the echoes), `writeChangeMeta` (stamps). Zero new truth — `go` is dispatch, not logic.
- `list`: gate-own as the cockpit (`pendingReport` output — grants, next acts, verdict states), keep `pending` as an alias so existing muscle survives; openspec's own list remains reachable via direct `openspec list`. `list` is already in RESERVED_WORDS, so no schema verb can shadow it.
- Verb-kill contract: `parseSchemaYaml` keeps accepting `x-grant`/`x-grant-verb` but **silently ignores** them — schema v4 consumers never break mid-flight; loud errors would punish schemas already in the wild. What dies: `grantVerbVocabulary`, verb-shadow validation, `artifactForGrantVerb`, the verb branch of `grantHint` (always the `go` form now), `approve`'s per-step verb listing, the vocabulary verb-walk tests, and the four `x-grant` lines in the spec example schema. `RESERVED_WORDS` gains `go` and `focus` (`list` already sits there); the package description's "flow vocabulary is schema data" stays true — sections, gates, unlocks, verdict, declares remain data; only the naming-per-rung tag dies.
- Echo consequence: with verbs gone, every hint line reads `read X → pios-gate go`; `approve`'s gated-schema refusal stops listing verbs and points at `go`.
- Three live catches from the lab walk feed the tests: bare-slug unknown (now passthrough, then focus), openspec's blind task count (why our cockpit must be gate-owned), and the agent misnaming a rung's act (why the echo, not memory, must name acts).

## Options

- **Thin aliases over the existing law** — `<slug>`/`focus` write the root state file; `go` dispatches to `grantArtifact` through `next`'s resolution; `list` renders `pendingReport` under a new name with `pending` as alias; `x-grant` dies by silent ignore. Chosen: zero new truth, three new words, one removed tag.
- **Keep declared verbs alongside `go`** — verbs stay optional schema data for authors who want named rungs. Rejected: two grammars means two teachings and a permanently longer mental model for zero gained capability — the echo already names each act.
- **Bake terminal focus into the extension's session store** — one focus everywhere. Rejected: the human's terminal authority and the agent's session declaration are different lifetimes and different owners; merging them lets either side clobber the other.

## Alternatives

- `ok` as the advancer instead of `go` — what it is: a judgment-named twin of the same dispatch. The trade-off: pure word-choice; `go` was the human's ruling (2026-11-10) and reads as motion. Pick-when: the walk's ergonomics should emphasize approval over advancement.
- Reuse the session focus store for `go` — what it is: no new state file. The trade-off: an agent's `openspec_focus` would silently re-aim the human's `go`; stale-by-design beats shared-by-accident. Pick-when: single-operator rooms where human and agent are provably the same will.
- Loud parse error on legacy `x-grant` — what it is: force migration to the verb-less schema. The trade-off: schema v4 consumers break at the release instant instead of never. Pick-when: a major-version boundary where breakage is announced and paid.
