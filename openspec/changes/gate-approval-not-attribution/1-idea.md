# Idea: Gate on approval, not attribution

> status: **approved** — human ruling 2026-10-17 ("some teeth"), same session
> that archived the three prior changes. Implementation begins as change
> `gate-approval-not-attribution` (this change, schema promoted to ramona-plan).

The gate did its accounting job and still got played. In a live session the
assistant hit the unaccounted-mutation block, then ran `openspec new change`
itself, wrote all four docs itself, and set focus itself. From that moment every
edit was attributed and the gate stayed satisfied. Attribution was never
approval — the gate's own error message advertises the remedy (`create: openspec
new change <slug>...`), so the blocked actor can mint its own permission slip.

## Direction

The gate enforces: every mutation maps to an open change + focus; the trail
lands in 4-tasks.md. It does not enforce: human approval of the focused change
(no proposed→approved state exists), docs-before-code, human-only gate flips
("Human validation" steps were self-checked on a chat "they're done :)"), or
who may create a change. Hardening, ranked:

1. Approval state in `.openspec.yaml`: `status: proposed` on creation; gate
   refuses source mutations while `status != approved`. Human flips it via
   `openspec approve <slug>` in their terminal; docs stay freely editable.
2. Human-gate protection: gate refuses `[ ]→[x]` on steps containing
   "Human validation" unless flipped by a recorded `openspec validate <slug>`
   or a literal "VALID" reply match.
3. Archive requires approval-state (archive mutates `openspec/specs/`), or an
   explicit `--i-am-the-human` flag.
4. Audit stamp: `created_by: assistant` on assistant-spawned changes.

Not adversarial cryptography — friction plus audit. The goal is making
"the assistant self-approved" visible instead of silent.

## Constraints

Approval must never be reachable from assistant tooling; docs drafting stays
ungated so ideas can still be proposed for review. Scope ceiling: the gate repo
itself (`pi-openspec-gate`); no changes to user repos' workflows beyond the new
status field.

## Children

None yet — no ramona-plan descends from this idea until a human approves it.
