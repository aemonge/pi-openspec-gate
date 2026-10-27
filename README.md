# pi-openspec-gate

Declared-work gate for Pi: accounting at the tool-call boundary. Every mutating
tool call is exactly one of:

- **exempt** — path-scoped (`openspec/**`, docs, skills), always recorded
- **attributed** — the session's openspec focus names an active change; a
  receipt (tool · paths · UTC) lands in that change's `5-execution.md`
- **declared** — the human says a phrase a schema declares (`x-declares`,
  e.g. the shipped `mission` schema declares "action the mission" /
  "execute the mission"); one visible debt line in
  `openspec/bare-work.md`, then it proceeds (one-shot latch)
- **blocked** — visible, byte-stable, state-aware: a stop directive, then
  only remedies that are real in this state

```text
⛔ unaccounted mutation — no active change
   stop:    this refusal is final — do not retry, do not investigate; act on one remedy or relay them to the human
   focus:   openspec_focus → action: set, change: <slug>   (a change that exists in openspec/changes/)
   create:  openspec new change <slug> --schema <schema-name>
   declare: say "action the spec" · "execute the spec" — human words only; recorded as declared work, proceeds
```

Never permission, never a renderer, never a prompt: another layer owns
trust; this gate owns declaredness. `unknown = mutating` is a fail-safe,
not a judgment. Change entry (`openspec new` / `init`) is never gated.
Subagents inherit the parent's focus — federated accounting. Memory tools
are instruments: ungated, recorded, never blocked. Blocks are state-aware:
the stop directive opens every one, each remedy names its exact instrument,
the focus line disappears when no change exists to focus, the declare line
names the exact `x-declares` phrases and appears only when a schema
declares any — a human's words only (assistant text never latches; the
built-in "do it" alias is retired) — and subagent sessions get a
relay-upward line.

## The shipped `mission` schema

One human-validatable value slice as a five-step flow — **idea →
proposition → proposal → plan → execution**. Approvals flow down step by
step; evidence flows up inside each; the claim born at step 2 (`Claim:`
one testable, falsifiable sentence) is judged by step 5's final
Human-validation checkbox.

The schema declares the gates; the gate enforces them:

```yaml
name: mission
version: 1
x-declares: [action the mission, execute the mission, action the job, execute the job]
artifacts:
  - id: proposition
    generates: 2-proposition.md
    x-grant-verb: deal
    x-requires-approval: [idea]
    x-lines: [Claim]
  - id: execution
    generates: 5-execution.md
    x-grant-verb: execute
    x-requires-approval: [plan]
    x-verdict-line: Human validation
    x-receives-receipts: true
    x-completes: approved
    x-unlocks-source: true
```

openspec strips unknown `x-` fields silently (non-strict schema); the gate
is their only consumer and validates them loudly. Schemas without tags get
no phase gates — legacy single-approve behavior. The vocabulary in full —
`x-declares` (the human's declaration phrases), `x-grant` / `x-grant-verb`
(the same tag, short and long form; both on one artifact fails loudly),
`x-requires-approval` (grants), `x-requires-written` (evidence: the listed
artifacts' files must be on disk before this one drafts — existence, not
approval), `x-unlocks` (capability classes this grant opens: `research`,
`writes`; `x-unlocks-source: true` is the legacy alias for `[writes]`),
`x-sections` (bare or rich, gating an artifact’s own sections
with `x-requires-written` / `x-requires-approval`), `x-verdict-line`,
`x-receives-receipts`, `x-completes` — is data; the
engine hardcodes none of it. Schemas resolve project-local first
(`<repo>/openspec/schemas/`), then openspec's global home
(`~/.local/share/openspec/schemas/`), then `~/.config/openspec/schemas/`.
Dependencies point to earlier artifacts only (declaration sequence is
grant sequence); self- or forward-references fail loudly at parse. Verbs,
filenames, verdicts, unlock points, and declaration phrases are schema
data.

## Phase gates

Creating artifact N+1 blocks until artifact N bears a human grant, and
declared sections/lines must exist at birth. Evidence dependencies
(`x-requires-written`) gate creation on file existence — no grant needed,
only the listed artifacts on disk — and a grant refuses to stamp if
declared evidence vanished after its own grant. The first artifact
drafts free; existing files stay editable (receipts flow). `status:
approved` is written only when every artifact is granted — attribution
is still not approval.

```sh
pios-gate grant <slug> <artifact-id>   # canonical: id or artifact/section path
pios-gate <verb> <slug>                # an x-grant-verb the schema declares
pios-gate approve <slug> [artifact-id] # canonical stamp (gated schemas: per-step only)
pios-gate confirm <slug>               # permits the declared verdict-line flip
pios-gate pending                      # the cockpit — every change, next acts
pios-gate inspect <slug>               # one change, verbose (artifacts, stamps, structure)
pios-gate focus                        # teaching: focus is a session instrument
pios-gate <anything else>              # exec openspec verbatim, exit code intact
```

Grants are strictly next-artifact-only, you approve what you read
(undrafted artifacts refuse), and the grant itself refuses to stamp
artifacts missing declared structure or carrying ungranted gated
sections. Any tool-call attempt on the grant surface — approve, confirm,
grant, or any verb the schemas declare — is itself blocked: approval is a
human act. **The research window**: when a focused change's schema
declares `x-unlocks: [research]` on an artifact, research instruments
block until that artifact is granted — the schema declares *when*, the
config declares *what* (tools + bash command verbs; web/docs tools by
default, `graphify` here). Research without a focused change is never
gated.

```json
"approval": { "enforce": true, "humanGateSteps": true,
              "archiveGuard": true, "stampCreations": true,
              "phaseGates": true },
"unlocks": {
  "research": {
    "tools": ["web_explore", "web_search", "web_fetch", "resolve-library-id", "query-docs"],
    "commands": ["graphify"]
  }
}
```

## No prompts

The extension injects nothing into LLM context: no `context` handler, no
protocol block, no shipped skills. Every remedy the gate needs rides its
own block reasons; every flow word it acts on comes from schema `x-` tags
in data. Enforce first, explain in the README — the teaching can never
drift from the teeth because the teeth are all there is.

## Try it — the shipped example

```sh
./example/try.sh        # or: just try
```

A self-verifying walkthrough in a scratch repo: the negatives first
(grant sequence, approve-what-you-read, structure refusal), then the
four-grant lifecycle of the v4 `spec` schema (open → dig → commit →
build) to `status: approved`, confirm, and `ready to archive?` —
asserting every step. Copy `example/openspec/schemas/spec` into your
repo as the starting point. See `example/README.md`.

## Install

```bash
pi install npm:@aemonge-dev/pi-openspec-gate            # personal
pi install -l npm:@aemonge-dev/pi-openspec-gate         # project-scoped
npm install -g @aemonge-dev/pi-openspec-gate             # pios-gate + alias
```

The extension (session gate) and the terminal CLI are one package, two
installs — run both and you're fully installed.

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
  "readOnlyTools": []
}
```

Exemptions are path-scoped only, never fuzzy. `accountingTools` names
instruments that pass ungated — the gate never gates its own layer, and
memory writes are instruments: bookkeeping about the work, never the work.
`readOnlyTools` merges over the built-in research set — the escape hatch
for new research tools without a package release.

## Facts (session entries; any reader may consume, the gate never renders)

| Fact | Meaning |
|---|---|
| `pi-openspec-gate.blocked.v1` | blocked: tool, paths, basis, UTC |
| `pi-openspec-gate.declared.v1` | a human declaration consumed one mutation |
| `pi-openspec-gate.attributed.v1` | mutation attributed to the focused change |
| `pi-openspec-gate.exempt.v1` | path-exempt pass with category + paths |
| `pi-openspec-gate.inherited.v1` | subagent inherited the parent's focus |
| `pi-openspec-gate.instrument.v1` | allowlisted instrument passed |
| `pi-openspec-gate.unapproved.v1` | unapproved change blocked |
| `pi-openspec-gate.humangate.v1` | human-validation flip checked |
| `pi-openspec-gate.creation-stamped.v1` | witnessed creation stamped proposed |
| `pi-openspec-gate.phasegate.v1` | artifact gate: missing-approval / missing-sections |

## Development

```bash
just lint      # vocabulary law: permission + flow words stay out of the gate
just test      # full suite (node:test, no deps)
just build     # loader smoke + packed-artifact gates
just publish <version>   # gates → bump+commit+tag → npm publish → global install
```

The shipped `mission` example in one sentence: a mission is born free (idea), commits to a
falsifiable claim (proposition), is signed as a deal (proposal), exposes
its method and knowledge (plan), and earns its debrief (execution) — where
the human's verdict upholds or refutes the claim it opened with. Write your own schema the same way: declare it. The full
ledger — every change ever built, with receipts — lives in
`openspec/changes/archive/`, and [CHANGELOG.md](CHANGELOG.md) is its
human-readable front door.

## License

MIT
