# eospec

openspec, extended. The **micro loop**: one change, one `plan.md`, one
human approve before code. Two halves, one package:

**The watcher** — a Pi extension that accounts every mutating tool call.
Each call lands in exactly one of four buckets:

- **allowed by path** — `openspec/**`, `docs/**`, `skills/**` are
  drafting and exploration ground: reads, research, and docs passes are
  never gated; writes there pass, recorded
- **attributed** — the room is aimed at an approved change (the
  `openspec/.focus` snapshot); the call proceeds and a receipt
  (tool · paths · UTC) lands in that change's sidecar (`.ledger`)
- **declared** — the human says a phrase the schema declares;
  **"skip the spec"** lands exactly one bare mutation as declared work,
  one debt line in `openspec/bare-work.md` — even behind a draft wall;
  **"start the spec"** asks for the ceremony. Assistant text never
  declares — it relays the phrases upward
- **refused** — with a stop directive and the exact remedies for this
  state: finish the plan, wait for the approve, run the checks, or
  close

It never judges quality — only that nothing happens silently.
`approve` and `close` are human-terminal: no tool call may name them,
and the verdict line (`- [ ] Hands-on validation`) is the human's tick
or a literal `VALID` reply.

**The CLI** — the loop's verbs, run by the human in their terminal:

```sh
eospec new [slug]        # birth a mini-plan — timestamped slug, auto-focus
eospec focus <change>    # aim the room at a change
eospec focus             # the room: every change [n/m tasks], a TTY picks
eospec approve [--all]   # the one gate — draft → coding (slices: advance/all)
eospec close [--force]   # tasks + verdict ticked — validate, archive, release
eospec archive <change>  # openspec archive, plus the fence: aim released
eospec -- <args>         # everything after -- is openspec, verbatim
```

Anything else — `validate`, `list`, typos — runs openspec verbatim,
exit code intact.

## The micro loop

One schema ships: **`micro`**. One artifact: `plan.md` — seven sections,
the agile spine:

```markdown
## Goal                   ← 2–3 lines: what lands, for whom
## Estimate               ← range · confidence — honest sizing, not hope
## Skills                 ← what this walk loads; `none — why` allowed, absent not
## Approach               ← method: + architecture: — naming the paradigm is the win
## Questions & Decisions  ← every ambiguity resolved BEFORE approval
## Tasks                  ← ### Slice — <the acceptance>; 1–3, mandatory
## Verification           ← ACs as prose, instructions, then the human pass
```

The four states, all derived — never stored prose:

| state | law |
|---|---|
| **draft** | source mutations locked — finish `plan.md`, the human runs `eospec approve` |
| **coding** | mutations attribute + receipt to `.ledger`; the agent ticks tasks as they land; one commit per step, hash pasted into the step's slot — the law binds plan-gated coding only, bare work stays one mutation |
| **verifying** | every task ticked — source re-locks; verification commands (test · lint · typecheck) pass receipted until the human validates |
| **slice pause** | `slice-gates: true` in the plan pauses at slice boundaries — `eospec approve` advances, `--all` unlocks all |

The declared door overrides the draft wall: the human's phrase lands
one mutation as bare work, debt line and all — live-caught when a
latched *"skip the spec"* died silently behind the old teeth.

The plan is shape, not process: the gate teaches what an artifact must
contain — acceptance-titled slices, a commit per step, a tick-free
Verification — never which skills to load or when to brainstorm; that
choice stays with the human and their skills. And the hands-on pass
needs no file entry: a literal `VALID` reply latches one verdict flip —
ticking plan.md stays the optional path.

Large planning lives in Jira; openspec here is optimized for many
small, rapid iterations — a dozen mini-plans a day, zero ceremony
between thinking steps.

## The room file

`openspec/.focus` — one active change per room, flat yaml:

```yaml
# one active change per room — eospec writes, verbs refresh
change: rebuild-search
artifact-name: plan.md
artifact-idx: 1/1
task: 2/3
next-step: eospec close
```

`next-step` names the human's verb, always: `eospec approve` while
drafting or at a slice boundary, `eospec close` once coding is done.
The `task:` counter reads plan.md with the verdict line excluded — the
human's act is never counted. A snapshot, never the truth: the change's
meta, the schema, and plan.md decide.

## Schemas

The schema declares the gates as data (`x-` tags) and the engine
enforces them — the micro schema is the shipped example:

```yaml
artifacts:
  - id: plan
    generates: plan.md
    x-sections: [Goal, Estimate, Skills, Approach,
                 Questions & Decisions, Tasks, Verification]
    x-unlocks: [writes]        # approve opens coding
    x-completes: approved
    x-verdict-line: Hands-on validation
```

Copy `openspec/schemas/micro` as your starting point and edit the yaml;
the engine hardcodes nothing and stays schema-agnostic — user-global
schemas elsewhere keep working. Findings surfaced mid-delivery become
appended slices (re-approve) or fresh mini-plans (close, then new).

## Spawning children — the admission contract

Subagents are only as gated as their spawner makes them. A child
spawned through pi's native delegation is accounted: the gate reads
`PI_SUBAGENT_DELEGATION` and relays its blocks upward instead of
pressing a child that cannot aim, approve, or close. A spawner that does
NOT set that environment spawns an unaccounted child — the admission
hooks a compliant spawner must claim are `registerRequiredChildExtensions`
(fail-closed admission: a child inherits the gate or does not spawn) and
`registerSubagentCapabilityCeiling` (a ceiling on what a child may do).
Neither is claimed by any installed package today, so the native path is
the only path, and it is gated.

Revisit trigger: gate-side admission (refusing an unaccounted child
regardless of spawner) needs a child-parentage signal from pi core —
when pi exposes it, the gate grows the teeth; until then, the contract
above is the law. Install `npm:pi-subagents` (or any spawner) only after
it claims both hooks.

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
work. `readOnlyTools` merges over the built-in set (conversation
instruments like `ask_user_question` are read-only by default).
`unlocks.research` names the capability class for schemas that declare
`x-unlocks: [research]` — micro declares none: research is never gated.

## Facts (session entries; any reader may consume, the gate never renders)

| Fact | Meaning |
|---|---|
| `gate.blocked` | refused: tool, paths, basis, UTC |
| `gate.declared` | a human phrase consumed one mutation |
| `gate.attributed` | mutation attributed to the aimed change |
| `gate.exempt` | path-allowed pass with category + paths |
| `gate.inherited` | subagent inherited the parent's aim |
| `gate.instrument` | allowlisted instrument passed |
| `gate.unapproved` | draft/verifying/slice refusal |
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
the full micro lifecycle — draft, approve, slice pause, tick, verdict,
close — asserting every step.

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
