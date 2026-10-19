# Idea: Cover the inheritance lookup that drifted

The focus-inheritance fix exists and works — `findSessionFile` gained the
`_<sessionId>.jsonl` suffix fallback plus a timestamped-fixture integration
test in `3cba431` (0.2.0). But a live bug report landed 2026-10-19 anyway:
sessions under pi-reconcile showed delegation entries and parent focus facts
yet zero `pi-openspec-gate.inherited.v1`. Root cause was not the code — it
was drift: `just lint` had wedged `just publish`, so `~/.pi/agent/npm` kept
running 0.1.2, whose lookup is exact-name only. The fix never reached the
runtime that exhibited the bug. Two lessons: the lookup has no direct unit
tests (only the integration path exercises it), and "unpublished fix" is
indistinguishable from "no fix" at runtime.

## Direction

Add direct unit coverage for `findSessionFile` with tempdir fixtures:
timestamped name resolves; exact/legacy name still resolves; wrong sessionId
→ undefined; missing sessions root → undefined — fail-open contract pinned.
No runtime changes. The live verification (named-session subagent inherits +
attributes in a gated repo) becomes a publish-day checklist step, not a
code change. Version: no bump — 0.2.0 is the fix release; tests add no
behavior (human may overrule).

## Constraints

Scope ceiling: one new test file. No source edits. Extending
PI_SUBAGENT_DELEGATION to ephemeral subagent calls is out of scope forever
(that is a @mjakl/pi-subagent feature request). Publishing stays deferred to
the human's terminal act.

## Children

`focus-inheritance-coverage` — self-parented mechanical slice.
