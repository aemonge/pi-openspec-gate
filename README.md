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

## Install

```bash
pi install npm:@aemonge-dev/pi-openspec-gate            # personal
pi install -l npm:@aemonge-dev/pi-openspec-gate         # project-scoped
```

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
instruments.

## Facts (session entries; any reader may consume, the gate never renders)

| Fact | Meaning |
|---|---|
| `pi-openspec-gate.blocked.v1` | blocked: tool, paths, basis, UTC |
| `pi-openspec-gate.declared.v1` | a human declaration consumed one mutation |
| `pi-openspec-gate.attributed.v1` | mutation attributed to the focused change |
| `pi-openspec-gate.exempt.v1` | path-exempt pass with category + paths |
| `pi-openspec-gate.inherited.v1` | subagent inherited the parent's focus |
| `pi-openspec-gate.instrument.v1` | allowlisted accounting tool passed |

## License

MIT
