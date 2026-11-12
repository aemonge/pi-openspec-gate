# eospec

openspec, extended. Two halves, one package:

**The watcher** — a Pi extension that accounts every mutating tool call.
Each call lands in exactly one of four buckets:

- **allowed by path** — `openspec/**`, `docs/**`, `skills/**` are drafting
  ground: they pass, recorded
- **attributed** — the room is aimed at a change (the `openspec/.focus`
  snapshot); the call proceeds and a receipt (tool · paths · UTC) lands in
  that change's sidecar (`.ledger`) — artifacts stay prose
- **declared** — you say a phrase the schema declares; the shipped `spec`
  schema declares two doors: **"start the spec"** — run the ceremony
  (create, aim, draft — that part needs no declaration) — and
  **"skip the spec"** — land the next mutation as declared work, one
  debt line in `openspec/bare-work.md`
- **refused** — with a stop directive and the exact remedy for this state:
  aim a change, create one, or wait for your phrase

It never judges quality — only that nothing happens silently. Read-only
commands pass; memory writes are bookkeeping, not work; research tools
open only when the schema's approval window says so.

**The CLI** — three words over openspec's `new`/`archive`:

```sh
eospec focus <change>   # aim the room at a change
eospec focus            # the room + every change, one line each
eospec approve          # approve the next pending step of the aim
eospec close            # tick-checked close: validate, archive, release
eospec -- <args>        # everything after -- is openspec, verbatim
```

Anything else — `new`, `archive`, `validate`, typos — runs openspec
verbatim, exit code intact. `approve` and `close` are human-terminal:
the watcher refuses any assistant tool call that names them.

## The room file

`openspec/.focus` — one active change per room, flat yaml:

```yaml
# one active change per room — eospec writes, verbs refresh
change: rebuild
artifact-name: 4-execute.md
artifact-idx: 4/5
task: 4/12
next-step: eospec approve
```

The law: `next-step` names the human's verb, always — `eospec approve`
while anything pends, `eospec close` once all are granted; the draft
rhythm and the verdict reminder live in the CLI echo and close's
refusal. The `task:` line exists only when the artifact has checkboxes
(no empty counters). The all-granted name follows the walk (the final
artifact) while the counter follows the checkboxes (the completing
artifact). The
watcher re-renders on every gate-side touch; verbs re-render; `close`
deletes it. A snapshot, never the truth — the change's meta, the
schema, and the artifact files decide.

## Schemas

Changes declare a schema; the schema declares the human gates as data
(`x-` tags), and the gate enforces them: approve step N before step N+1
drafts, sections present at stamp time, receipts flowing into the
change's sidecar (`.ledger`), one human-verdict line closing the walk. The shipped
example is [`example/openspec/schemas/spec`](example/openspec/schemas/spec)
— five steps (brainstorm → investigate → plan → execute →
post-delivery — the fifth conditional: it exists only when the
verdict's `surfaced:` line routes findings to it), strict at the
two boundaries humans own: spend at plan, judge at the verdict. Copy it
as your starting point and edit the yaml; the engine hardcodes nothing.
Findings surfaced while delivering become appended slices in the same
ledger (the small ones) or route `→ post-delivery` in the verdict's
`surfaced:` line (the too-big ones, designed inside the change) — a
closed change's follow-ups open their own change.

## Install

```bash
pi install npm:@aemonge-dev/pi-openspec-gate        # the watcher (personal)
pi install -l npm:@aemonge-dev/pi-openspec-gate     # …or project-scoped
npm install -g @aemonge-dev/pi-openspec-gate        # the eospec bin
```

## Config (`config.json` beside `index.ts`)

```json
{
  "enabled": true,
  "exempt": [
    { "prefix": "**/openspec/**", "category": "openspec-artifacts" },
    { "prefix": "**/docs/**", "category": "documentation" },
    { "prefix": "**/skills/**", "category": "declared-skills" }
  ],
  "accountingTools": ["work_focus", "openspec_focus", "stage", "subject",
                      "mem_save", "mem_update", "mem_delete",
                      "mem_save_prompt", "mem_session_summary",
                      "mem_session_end", "mem_capture_passive"],
  "readOnlyTools": [],
  "approval": { "enforce": true, "humanGateSteps": true,
                "archiveGuard": true, "stampCreations": true,
                "phaseGates": true },
  "unlocks": {
    "research": {
      "tools": ["web_explore", "web_search", "web_fetch", "resolve-library-id", "query-docs"],
      "commands": ["graphify"]
    }
  }
}
```

Exemptions are path-scoped, never fuzzy. `accountingTools` are
instruments that pass ungated — bookkeeping about the work, never the
work. `readOnlyTools` merges over the built-in research set.

## Facts (session entries; any reader may consume, the gate never renders)

| Fact | Meaning |
|---|---|
| `gate.blocked` | refused: tool, paths, basis, UTC |
| `gate.declared` | a human phrase consumed one mutation |
| `gate.attributed` | mutation attributed to the aimed change |
| `gate.exempt` | path-allowed pass with category + paths |
| `gate.inherited` | subagent inherited the parent's aim |
| `gate.instrument` | allowlisted instrument passed |
| `gate.unapproved` | unapproved-change refusal |
| `gate.human-gate` | human-validation flip checked |
| `gate.creation-stamped` | witnessed creation stamped |
| `gate.phase-gate` | artifact gate: missing approval / sections |
| `gate.self-declare` | assistant phrase noticed, not latched |
| `gate.pause` | the pause permit's lifecycle |

## Try it

```sh
./example/try.sh        # or: just try
```

A self-verifying walkthrough in a scratch repo: the refusals first, then
the full four-step lifecycle to `status: approved`, the verdict tick,
and the close — asserting every step.

## Development

```bash
just lint      # vocabulary law + doc↔CLI parity
just test      # full suite (node:test, no deps)
just build     # loader smoke + pack contents
just publish <version>   # gates → bump+commit+tag → npm publish → global install
```

The full ledger — every change ever built, with receipts — lives in
`openspec/changes/archive/`, and [CHANGELOG.md](CHANGELOG.md) is its
front door.

## License

MIT
