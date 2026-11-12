# Investigate

> Spec: gate-edges · aim at the Brainstorm's Questions

## Findings

### post-archive gap

- The aim dies properly only through `close`: on a successful `openspec
  archive` it unlinks the room file (`unlinkSync(focusPath(root))`,
  `bin/eospec.js` close branch). A bare `openspec archive` — the wrapper
  passthrough — releases nothing; the focus dangles and every mutation
  hits `blockUnaccounted` with the dangling remedy (`src/gate.ts:84,103`).
- Bash is **never** path-exempt by construction: `matchExemption`
  early-returns for bash/shell before any path comparison
  (`src/exemptions.ts` — "tools without enumerable target paths are never
  path-exempt"). The brainstorm's old question — do bash-extracted
  relative paths match `**/openspec/**` — is answered: never, whatever
  the path shape. The exemption belongs to edit/write tools only.
- Writes unlock at the plan grant (`x-unlocks: [writes]`,
  `openspec/schemas/spec/schema.yaml:84`); before that, the commit is the
  human's terminal by law — and the human confirmed the fast track
  (copy-paste) is a feature, not a gap (2026-11-12).
- Approvals persist per change (`.openspec.yaml`: `x-status`, `x-granted`,
  `x-granted_<id>`, `x-validated` — `src/approval.ts`); focus is a
  separate axis (room file + session facts, `src/focus.ts`). Focus
  switches never reset a ladder — verified live during the 2026-11-12
  board merge.

### receipt sidecar

- The bearer law: `x-receives-receipts: true` sits on the execute artifact
  (`schema.yaml:118`) — execute is declared "The ledger — per-Slice
  checkpoints, hash-evidenced commits, receipts, and the final human
  verdict" (`schema.yaml:88`). `receiptArtifactFor(schema)` resolves it
  (`src/schema.ts:485`); an undeclared schema lands receipts as facts only
  (`src/gate.ts:830-834`).
- Every attributed call fires `FACT.attributed` +
  `appendAttributionReceipt` (`src/gate.ts:822-835`). The 2026-11-11
  post-delivery walk shipped dedupe (same line never repeats,
  `lastNonEmptyLine`, `src/attribution.ts:64`) and the tight block —
  volume was quiet-receipts' ask; placement was never addressed.
- The verdict tick is a `- [x] Human validation` flip in the same file
  (`x-verdict-line: Human validation`, `schema.yaml:120`), human-gated by
  the 0.7 flip guard (`src/gate.ts`) and required unticked→blocked by
  `close`. So execute is three documents in one: slice journal, receipt
  log, verdict wall. That conflation is the pain — ruled out of the
  artifacts entirely (2026-11-12: the trail should not live in prose).
- The human's framing (carried from the killed spec): a per-change sidecar
  also makes multi-hopping clean — each change's trail stays on disk in
  its own dir, so aiming around the board never cross-contaminates and
  never loses a receipt. Approvals already have this property; receipts
  are the last artifact-bound residue.

### spanned agents

- No live hole: `pi-subagents` is absent from the installed tree
  (`~/.pi/agent/npm/node_modules`, `settings.json` — verified
  2026-11-12). Native delegation is gated: `parseDelegationEnv` reads
  `PI_SUBAGENT_DELEGATION` and `blockUnaccounted` switches its remedies to
  relay-upward for children (`src/gate.ts`).
- The retired idea (killed from the bench 2026-11-04, text in git
  history) named four gaps and two admission hooks —
  `registerRequiredChildExtensions`, `registerSubagentCapabilityCeiling`
  — claimed by no installed package.
- Ruled onto the board for strength, not for here: the gate protects
  whoever installs the package (2026-11-12). The investigation therefore
  prices *where* admission lives, not *whether*.

### stage-zero research

- Current law: the window check runs only inside an openspec root
  (`if (!paused && approval.phaseGates && openspecRoot &&
  researchCallMatches(...))`, `src/gate.ts:557`). Outside any root,
  instruments pass already — the wall only exists at
  root-without-aim (the `research-void` branch) and at
  aim-without-research-grant (the `capabilityUnlocked` check;
  `x-unlocks: [research]` sits on investigate, `schema.yaml:60`; grants
  are monotonic, `src/schema.ts:504`).
- Pure reads bypass the window entirely (`if (!verdict.mutating)`
  short-circuit, `src/gate.ts:552`) — the instrument list is the only
  read class the wall ever touched (`config.json unlocks.research`:
  web_explore, web_search, web_fetch, resolve-library-id, query-docs;
  command: graphify).
- The 2026-10-27 wall exists because a cold agent ran a whole research
  phase in the void (the block comment carries the incident). Ruled
  2026-11-12, option B: the gate fences writes, reads flow recorded —
  the teeth retire, the fact trail stays; config-scoped strictness is a
  named escape hatch, deliberately not built now.

## Alternatives

### post-archive commit — where does it legally land?

- **A1 — explicit human step, formalized.** The close/archive output
  teaches the commit verbatim ("commit on your terminal: git add -A &&
  git commit …"); the gate grows no window. Trade-off: zero new law,
  zero new state — but the walk never commits its own receipts. Pick
  when: the fast-track doctrine stays absolute.
- **A2 — unlocked post-archive window.** Close/archive releases the aim
  and opens a short, event-scoped write window (pause-latch shape,
  reborn for commits). Trade-off: the walk commits its own trail, at the
  price of a second time-boxed mechanism to maintain and test. Pick
  when: assistant-side commits are the wanted end state.
- **A3 — gate-owned commit.** `eospec close` shells the commit itself
  after archiving (gate-side, like creation stamping; argv-hygiene
  precedent exists in the wrapper). Trade-off: deterministic commits,
  no window state — but the gate takes over a human ritual and must
  never mis-fire message or paths. Pick when: commits should be
  uniform and human-free.

### receipt trail — where does it live?

- **B1 — per-change sidecar.** `changes/<slug>/.ledger`, written by the
  gate beside the artifacts; `close` summarizes it into the archive.
  Trade-off: multi-hop clean, artifacts pure — but a new filename
  convention and a close behavior to define. Pick when: the trail
  follows the change (the human's framing).
- **B2 — central trail.** One `openspec/.ledger` for the whole board.
  Trade-off: single-stream grep, cheapest render — but hops mix into one
  stream and per-change provenance needs prefixes. Pick when: a single
  audit stream matters more than per-change purity.
- **B3 — bearers stay, ticks move.** Receipts move to a sidecar; the
  verdict tick stays in execute (the human ticks where the verdict
  lives). Trade-off: smallest migration — but execute stays a mixed
  document. Pick when: the verdict's home must not move.
  (B1+B3 compose: sidecar for receipts, tick stays — the questions list
  already suspected this split.)

### spanned-agent admission — where does fail-closed live?

- **C1 — gate-side admission.** The gate detects child contexts lacking
  delegation accounting and refuses/relays regardless of spawner.
  Trade-off: strength stops depending on third-party cooperation — but
  the gate grows spawn-awareness it can only partially verify. Pick
  when: strength must be unconditional.
- **C2 — spawner-side contract.** Document the hooks a spawner must
  claim (`registerRequiredChildExtensions`,
  `registerSubagentCapabilityCeiling`); the gate stays spawn-agnostic.
  Trade-off: the gate stays minimal — but the fence waits on a package
  that may never ship. Pick when: the ecosystem cooperates.
- **C3 — record and watch.** Keep the relay law; revisit the day
  pi-subagents appears in any install. Trade-off: zero code, honest
  today — the hole stays open on paper. Pick when: spawner installs
  remain hypothetical.

### stage-zero research — the mechanical shape of option B

- **D1 — minimal retirement.** The void branch stops blocking: write the
  `research-void` fact, pass. Brainstorm takes `x-unlocks: [research]`
  so aimed searches attribute from step one. Trade-off: smallest diff —
  facts-only accounting must feel honest enough on its own. Pick when:
  the ruling's letter is enough (named escape hatch stays unbuilt).
- **D2 — config-scoped now.** Ship `approval.voidResearch: fact|block`
  immediately so hard-fence installs keep today's wall. Trade-off: both
  laws live, more surface, more tests — built without a request, which
  the ruling declined. Pick when: multi-user demand exists today (it
  does not).
