# Brainstorm

> Spec: gate-edges · consult `openspec/learnings/` before drafting

## Pain

Four live frictions at the gate's edges, ruled onto one walk by the human
(2026-11-12 board merge). Each carries its own history; none is big enough
to want its own ladder, and all four touch the same law surfaces (focus,
facts, receipts, the research window).

**post-archive gap.** After `openspec archive` moves a change, session
focus dangles on the moved change (mutations refused: no active change);
re-aiming makes the archival commit hit the approval teeth (focused, writes
locked) — so the archival commit always lands on the human's terminal.
Also unverified: whether bash-extracted relative paths (e.g.
`git add openspec/changes/`) match the `**/openspec/**` exemption at all.

**receipt sidecar.** Attribution receipts (`gate-attributed · tool: bash ·
…`) and verdict ticks land inside the artifact files themselves —
`x-receives-receipts` names the completing artifact (today `4-execute.md`)
as the bearer — so every heavy walk leaves ledger noise the human
hand-prunes before close. quiet-receipts (killed 2026-11-12) asked about
volume; the human then converged on the deeper question: the trail should
not live in prose artifacts at all. A per-change sidecar also makes
multi-hopping specs clean — aiming around the board never cross-
contaminates artifacts and never loses a receipt.

**spanned agents.** npm:pi-subagents spawns ungated in the default path:
`registerRequiredChildExtensions` (fail-closed admission) and
`registerSubagentCapabilityCeiling` are claimed by no installed package —
a spawned agent inherits nothing and is accounted by nothing. The human
kept this on the board for strength: the gate protects whoever installs
the package, not just this repo. No live hole today (pi-subagents is not
installed; native delegation is gated via `PI_SUBAGENT_DELEGATION`).

**stage-zero research.** Research instruments (`web_search`, `web_fetch`,
`graphify`, …) are blocked everywhere the human actually starts: no change
aimed → `research-void` wall; aimed at brainstorm → shut until
`investigate` carries its grant (`x-unlocks: [research]`). The
explore-then-decide flow — search first, then "spec this" or "understood,
move on" — is illegal on both fronts. Ruled 2026-11-12 (option B): the
gate fences writes, reads flow recorded — the teeth retire, the fact trail
stays.

## Questions

**post-archive gap**
- Where should the post-archive commit legally land — an unlocked window
  after archive, or an explicit human step?
- Do bash-extracted relative paths ever hit the exemption, and should they?

**receipt sidecar**
- Where does the receipt trail live — a sidecar beside the artifacts
  (`changes/<slug>/.ledger`, no gate, not a ladder step) — and who writes it?
- What does `eospec close` do with the sidecar — summarize into the archive,
  or archive verbatim?
- Does `x-receives-receipts` survive as a schema key, or does the sidecar
  make the bearer concept dead weight?
- Do verdict ticks stay in the bearer (the human ticks them there) while
  attribution receipts alone move to the sidecar?

**spanned agents**
- What does the gate inherit across a spawn — the aim, the exemptions, the
  declaration latch — and what must stay session-bound?
- Does fail-closed admission belong in the gate or in pi-subagents?

**stage-zero research**
- Does void research flow with no openspec root at all, or only
  root-without-change (today the window check requires a root)?
- Where does a `research-void` fact land with no change to bear receipts —
  session facts only, and is that accounting honest enough?
- Does brainstorm take `x-unlocks: [research]` so aimed searches attribute
  from step one?
- Does the byte-exact void block copy die outright, or survive behind a
  config-scoped strict mode for hard-fence installs (named escape hatch,
  not built now)?
- Which pins die with the wall — gate.test.ts void-copy pins, parity lint
  vocabulary, CHANGELOG entries?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
One law pass, four edges; slice order decided at plan. Doctrine carried
from the 2026-11-12 rulings: the fast track is the human's terminal (the
gate guards assistant hands only); the board stays lean (three stubs were
buried rather than walked); approvals already persist per change
(`.openspec.yaml`) — the sidecar extends that persistence to receipts;
strictness for hard-fence installs is a named escape hatch, no knob built
without a request.
