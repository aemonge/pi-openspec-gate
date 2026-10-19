# Idea: Classify every bash segment, not the whole string

The bash read-only scan is whole-string: one anchored verb at `^` passes the
entire command. Proven live in the `ungate-research-instruments` session —
`which graphify; graphify --version` passed because `which` anchored at the
start, though the second segment (`graphify --version`) is unknown and must
be fail-safe. Any read-only verb can thus launder an arbitrary tail through
`;`, `&&`, `||`, or `|`. The gap was seen, proven, and deferred by design:
"per-segment lands as its own change" — this is that change.

## Direction

Split the command on `;`, `&&`, `||`, and `|` before classification; every
segment must independently classify read-only for the whole to pass. Splitting
respects quoting (a `;` inside quotes is data, not a separator). One unknown
segment fails the whole command safe — no partial credit. Powershell rides the
same segment logic through its existing parity path.

## Constraints

Classifier behavior only — no permission/trust vocabulary, no renderer
concerns, no new tools. Fail-safe semantics for unknown segments are
inviolable. Scope ceiling: this repo's classifier and its tests.

## Children

None yet — no ramona-plan descends from this idea until a human approves it.
