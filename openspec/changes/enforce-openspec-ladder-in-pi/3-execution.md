# Execution: Enforce the ladder in Pi

> Amendment (2026-10-13, human ruling): plans taken as boilerplates, rethink
> applied. The gate is self-contained: it owns its classifier and reads focus
> directly. The cockpit is a downstream reader (focus + titles + gate facts) —
> it never gates, the gate never depends on it. Original Step 1 (verify
> cockpit import surface) executed → surface absent → STOP → superseded by
> this amendment; receipt preserved in 4-tasks.md history.

> Estimate: 2–4 h · medium confidence, confirmed from plan
> Human wait: evidence review of one full gate protocol, then your reply
> Parents: 2-plan (this change) · idea: reshape-ramona-planning-into-durable-ladder

## Skills

- Selected: Pi extension API (`/usr/lib/pi/docs/extensions.md`) — `tool_call` may return `{block: true, reason}`; handler failure blocks as fail-safe; `tool_result` composition; `withFileMutationQueue` for file-mutating tools
- Selected: pi-openappa as the reference gate — proven live; copy the mechanics (hook interception, visible blocks), never the vocabulary (trust, waivers, sanitizers)
- Uncovered → resolved by amendment: focus read-path is the session entry store (`galactica-status.openspec-focus.v1`, the entry type the openspec focus tool already writes — verified present in installed pi-vimux-starship) with `openspec list --json` fallback; exact entry read API pinned in Step 1

## Workflow

> Self-contained accounting: the gate owns its mutation classifier (unknown =
> mutating is a gating fail-safe, not a display heuristic) and exports it for
> any future reader. The gate reads focus directly and emits facts; it never
> renders and never depends on a renderer.

## Steps

1. Pin the extension API facts from /usr/lib/pi/docs/extensions.md: tool_call block contract, append/read entries, subagent parent linkage, install path — receipts recorded
2. Scaffold `~/projects/pi-openspec-gate/` — installable extension project (package.json, src); install/link into `~/.pi/agent/extensions/pi-openspec-gate/`
3. Implement the classifier module (annotations → bash verb-scan → unknown = mutating), exported for reuse; unit checks
4. Implement the exemption matcher — path-prefix list from gate config — plus exempt-fact recording (category + paths, always)
5. Implement the `tool_call` handler: classify → exempt? record + pass : focus names a change? attribute + pass : block with the message below
6. Implement the declaration path: your "do it" writes one debt line and the mutation proceeds
7. Implement federated inheritance (subagent sessions inherit the parent's active change) and the attribution appender (paths + timing receipts into the focused change's 4-tasks.md)
8. Reload Pi, run the observation protocol, fix drift, freeze

Block message (exact copy):

> ⛔ unaccounted mutation — no active change
>    focus:   set the focus fact via your cockpit/status tool
>    create:  openspec new change <slug> --schema ramona-plan
>    or say "do it" — recorded as declared work, proceeds

## Verification

- Deterministic: a blocked call shows reason + all three remedies; an exempted write leaves an exempt fact with paths; "do it" leaves exactly one debt line; a subagent mutation under the parent's focus passes; `grep -riE 'waiver|approv|sanitiz|trust' src/` finds nothing
- Human: evidence review of one full protocol — block → declare → attribute → exempt → inherit — then your reply

## Safety and authority

- Accounting only, law of disjoint questions: appa gates trust, this gates declaredness; overlap test — if it needs approvals, waivers, trust states, or sanitizers, it is rebuilding appa: forbidden
- Exemptions are path-scoped and always recorded; no fuzzy matching, no class-based guessing
- Enablement is extension config, not policy

## History

Snapshot subject: `feat(ladder): ladder-gate accounting extension`

> Amendment (2026-10-14, human ruling): block-copy remedy 1 referenced
> `openspec focus set <change-id>` — a command that never existed in the
> openspec CLI (verified against the /usr/lib/openspec/dist/cli command
> registry: no focus command, no focus-state writer). Copy now names the
> real focus mechanism: the status/cockpit tool that writes the
> openspec-focus fact the gate reads. Trio synced: this artifact,
> src/gate.ts, test/gate.test.ts.
