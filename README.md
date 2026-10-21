# pi-openspec-gate

Ladder gate for Pi: accounting at the tool-call boundary. Every mutating
tool call is exactly one of:

- **exempt** — path-scoped (`openspec/**`, docs, skills), always recorded
- **attributed** — the session's openspec focus names an active change; a
  receipt (tool · paths · UTC) lands in that change's `5-execution.md`
- **declared** — the human says "action the mission" / "execute the
  mission" (legacy: "…the job", "do it"); one visible debt line in
  `openspec/bare-work.md`, then it proceeds (one-shot latch)
- **blocked** — visible, byte-stable, with paste-ready remedies

```text
⛔ unaccounted mutation — no active change
   focus:   set the focus fact via your cockpit/status tool
   create:  openspec new change <slug> --schema mission
   or say "action the mission" / "execute the mission" — recorded as declared work, proceeds
```

Never permission, never a renderer: another layer owns trust; this gate
owns declaredness. `unknown = mutating` is a fail-safe, not a judgment.
Ladder entry (`openspec new` / `init`) is never gated. Subagents inherit
the parent's focus — federated accounting. Memory tools are instruments:
ungated, recorded, never blocked.

## The mission schema

One human-validatable value slice as a five-rung ladder — **idea →
proposition → proposal → plan → execution**. Approvals flow down rung by
rung; evidence flows up inside each; the claim born at rung 2 (`Claim:`
one testable, falsifiable sentence) is judged by rung 5's final
Human-validation checkbox.

The schema declares the gates; the gate enforces them:

```yaml
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
`x-grant-verb`, `x-sections` (bare or rich, gating a rung’s own sections
with `x-requires-written` / `x-requires-approval`), `x-verdict-line`,
`x-receives-receipts`, `x-completes`, `x-unlocks-source` — is documented in
the shipped skill (`skills/mission-protocol.md`). Verbs, filenames,
verdicts, and unlock points are schema data; the engine hardcodes none of
them.

## Phase gates

Creating rung N+1's artifact blocks until rung N bears a human grant, and
declared sections/lines must exist at birth. The first rung drafts free;
existing files stay editable (receipts flow). `status: approved` is
written only when the ladder completes — attribution is still not
approval.

```sh
pios-gate grant <slug> <artifact-id>   # canonical: id or artifact/section path
pios-gate <verb> <slug>                # an x-grant-verb the schema declares
pios-gate approve <slug> [rung]        # canonical alias; no rung = big-bang
pios-gate confirm <slug>               # permits the declared verdict-line flip
pios-gate pending                      # the cockpit — every mission, next acts
pios-gate inspect <slug>               # one mission, verbose (rungs, stamps, structure)
pios-gate focus                        # teaching: focus is a session instrument
pios-gate <anything else>              # exec openspec verbatim, exit code intact
```

Grants are strictly next-rung-only, you approve what you read (undrafted
rungs refuse), and the grant itself refuses to stamp artifacts missing
declared structure or carrying ungranted gated sections. Any tool-call
attempt on the grant surface — approve, confirm, grant, or any verb the
schemas declare — is itself blocked: approval is a human act.

```json
"approval": { "enforce": true, "humanGateSteps": true,
              "archiveGuard": true, "stampCreations": true,
              "phaseGates": true }
```

## The bridge teaches itself

A `context` handler injects the mission protocol block before every LLM
call — the law rides the package, versioned with the teeth, so
instructions can never drift from enforcement. The full manual ships as a
skill (`skills/mission-protocol.md`).

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
    { "prefix": "**/openspec/**", "category": "ladder-artifacts" },
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
| `pi-openspec-gate.phasegate.v1` | rung gate: missing-approval / missing-sections |

## Development

```bash
just lint      # vocabulary law: permission words stay out of the gate
just test      # full suite (node:test, no deps)
just build     # loader smoke + packed-artifact gates
just publish <version>   # gates → bump+commit+tag → npm publish → global install
```

The shipped `mission` example in one sentence: a mission is born free (idea), commits to a
falsifiable claim (proposition), is signed as a deal (proposal), exposes
its method and knowledge (plan), and earns its debrief (execution) — where
the human's verdict upholds or refutes the claim it opened with. Write your own ladder the same way: declare it. The full
ledger — every change ever built, with receipts — lives in
`openspec/changes/archive/`, and [CHANGELOG.md](CHANGELOG.md) is its
human-readable front door.

## License

MIT
