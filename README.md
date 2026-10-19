# pi-openspec-gate

Ladder gate for Pi: accounting at the tool-call boundary. Every mutating
tool call is exactly one of:

- **exempt** — path-scoped (`openspec/**`, docs, skills), always recorded
- **attributed** — the session's openspec focus names an active change; a
  receipt (tool · paths · UTC) lands in that change's `4-tasks.md`
- **declared** — the human says "do it"; one visible debt line in
  `openspec/bare-work.md`, then it proceeds (one-shot latch)
- **blocked** — visible, byte-stable, with three paste-ready remedies

```text
⛔ unaccounted mutation — no active change
   focus:   set the focus fact via your cockpit/status tool
   create:  openspec new change <slug> --schema ramona-plan
   or say "do it" — recorded as declared work, proceeds
```

Never permission, never a renderer: another layer owns trust; this gate
owns declaredness (the law of disjoint questions). `unknown = mutating` is
a fail-safe, not a judgment. Ladder entry (`openspec new` / `init`) is
never gated. Subagents inherit the parent's focus — federated accounting.
Terminal surface: `pios-gate` (see [Install](#install) and
[Approval](#approval-attribution-is-not-approval)).

## Install

```bash
pi install npm:@aemonge-dev/pi-openspec-gate            # personal
pi install -l npm:@aemonge-dev/pi-openspec-gate         # project-scoped
```

The extension (session gate) and the terminal CLI are one package, two
installs — `pi install` loads the gate into sessions but puts nothing on
your PATH:

```bash
npm install -g @aemonge-dev/pi-openspec-gate             # pios-gate + the
                                                          # pi-openspec-gate
                                                          # alias, npm-managed
```

Same package, same version; run both and you're fully installed.

## Config (`config.json` beside `index.ts`)

```json
{
  "enabled": true,
  "exempt": [
    { "prefix": "**/openspec/**", "category": "ladder-artifacts" },
    { "prefix": "**/docs/**", "category": "documentation" },
    { "prefix": "**/skills/**", "category": "declared-skills" }
  ],
  "accountingTools": ["work_focus", "openspec_focus", "stage", "subject"]
}
```

Exemptions are path-scoped only, never fuzzy. `accountingTools` names
entry-store instruments that pass ungated — the gate never gates its own
instruments. `readOnlyTools` names additional tools classified read-only at
load, merged over the built-in research set — the escape hatch for new
research tools without a package release:

```json
{ "readOnlyTools": ["my_probe", "team_search"] }
```

## Approval (attribution is not approval)

A focused change only authorizes source mutations when its
`openspec/changes/<slug>/.openspec.yaml` says `status: approved`. The
assistant can draft freely (`openspec/**` stays exempt), but executing code
changes on an unapproved change blocks with the terminal remedy. Approval
lives in the human's terminal only — any tool-call attempt to run the
approver is itself blocked:

```sh
pios-gate approve <slug>     # status: approved  (human terminal)
pios-gate confirm <slug>     # permits Human-validation [x] flips
pios-gate pending            # what needs the human, one command
pios-gate list               # anything else execs openspec verbatim
```

`pios-gate` is the gate as a feature extension of openspec: `approve`,
`confirm`, and `pending` are gate-owned and never forwarded; every other
argv passthroughs to `openspec` untouched — so `pios-gate validate x` is
openspec's structure lint (the reason `validate` was renamed `confirm`).
The old `pi-openspec-gate` bin remains as a permanent alias.

- Assistant-witnessed `openspec new change` creations are stamped
  `status: proposed` + `created_by: assistant` (audit, not permission)
- `[ ]→[x]` on "Human validation" lines needs `validated` in meta or the
  human's literal one-shot `VALID` reply
- `openspec archive` of an unapproved change blocks without `--i-am-the-human`

```json
"approval": { "enforce": true, "humanGateSteps": true,
              "archiveGuard": true, "stampCreations": true }
```

Absent section = all teeth off (legacy behavior).

## Facts (session entries; any reader may consume, the gate never renders)

| Fact | Meaning |
|---|---|
| `pi-openspec-gate.blocked.v1` | blocked: tool, paths, basis, UTC |
| `pi-openspec-gate.declared.v1` | a human declaration consumed one mutation |
| `pi-openspec-gate.attributed.v1` | mutation attributed to the focused change |
| `pi-openspec-gate.exempt.v1` | path-exempt pass with category + paths |
| `pi-openspec-gate.inherited.v1` | subagent inherited the parent's focus |
| `pi-openspec-gate.instrument.v1` | allowlisted accounting tool passed |
| `pi-openspec-gate.unapproved.v1` | unapproved change blocked (source-mutation / archive / approval-touch) |
| `pi-openspec-gate.humangate.v1` | human-validation flip checked (permit: none / meta / valid-latch) |
| `pi-openspec-gate.creation-stamped.v1` | witnessed creation stamped proposed + created_by |

## Development

```bash
just lint      # vocabulary law: permission words stay out of the gate
just test      # full suite (node:test, no deps)
just build     # loader smoke + packed-artifact gates
just publish <version>   # gates → bump+commit+tag → npm publish → global install
```

The ladder in one sentence: an assistant-created change is born
`proposed`; the human approves it from their terminal (`pios-gate
approve`); work attributes to the focused change as receipts in its
`4-tasks.md`; human-validation steps need `pios-gate confirm` (or a
literal `VALID` reply); then it archives. The full ledger — every change
ever built, with receipts — lives in `openspec/changes/archive/`, and
[CHANGELOG.md](CHANGELOG.md) is its human-readable front door.

## License

MIT
