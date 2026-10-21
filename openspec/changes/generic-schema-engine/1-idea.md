# Idea: the engine owns mechanism, the schema owns every step

> Parent: none

As a human grantor of missions I need one gate engine that enforces
whatever flow a schema declares — any rung count, any verbs, gates
between an artifact's own sections — so mission, three-rung errands,
and future schemas ride the same teeth, and the shipped five-rung
ladder is the first example, not the law.

Today the engine is mostly schema-driven but the residue is mission
everywhere: five grant verbs are mapped positionally to rungs 1–5 in
code (`GRANT_VERBS` in src/schema.ts, duplicated in bin/gate-lib.js) —
a three-rung schema gets wrong verbs, a seven-rung schema runs out; the
approval-touch regex names those same five verbs, so a schema-declared
verb (`x-grant-verb: kickoff`) would slip past the guard when the
assistant attempts it as a tool call; attribution receipts land in a
hardcoded `4-tasks.md`, already drifted from the schema's
`5-execution.md` — filenames in code rot; block remedies pick verbs
positionally; `pending` assumes the last artifact is the ledger and
regex-hunts "Human validation"; the protocol block injected into every
conversation teaches "the five grants"; sections cannot carry gates
at all — an artifact whose sections One/Two/Three must fill in order,
holding the next artifact until complete, is inexpressible; and the
point where coding may begin is hardcoded as full ladder completion,
so a schema whose final rung is a plan — meant to hold every line of
source until that plan is granted — cannot say so. The live
proof: this session's installed gate still says "action the job" —
installed drift is the same disease.

The direction: one generic engine whose entire flow vocabulary is read
from schema `x-` tags, validated loudly, with zero hardcoded steps.
Artifacts gain `x-grant-verb`, `x-verdict-line`, `x-receives-receipts`,
`x-completes`, and `x-unlocks-source` (the grant that begins source
work — absent the tag, ladder completion unlocks, today's behavior;
research, reading, memory, and openspec/** drafting stay available
while locked); sections become gatable nodes one level deep
(`x-requires-written`, `x-requires-approval` between an artifact's own
sections) with id-path grant addressing (`grant <slug> some/one`) and
artifact grants refusing while gated sections remain; grants become
id-addressed with verbs as declared aliases; the approval-touch guard
and the protocol block stop naming verbs and lengths and guard/teach
the generic surface; the mission schema survives untouched as shipped
data. Hard limits: openspec itself must keep loading schemas unmodified
(it strips x- fields silently; the gate is their loud validator); the
accounting core — exempt, attributed, declared, blocked — is untouched;
section recursion is one level (H2) in v1; the gate checks form only
(heading exists, grant present) — whether a section is any good stays
the Human's judgment; and graphify-out/** gains no exemption — the
developer refreshes the graph before invoking agents, agents inherit
it read-only (simplicity wins). Research that must write — notes,
examples, experiment outputs — is not an escape hatch: schemas
decompose, a Research artifact carries the results as content (its
sections declare them) and the artifacts that follow read them across
the flow; nothing leaves the ladder, the tree stays locked, and no
scratch exemption exists.
