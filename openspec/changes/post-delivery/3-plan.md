# Plan

> Spec: post-delivery · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

6–10 h estimate, revised 8–12 h after the debt ruling — one schema
entry plus template, one parse line, three predicate sites, two
room-law functions, the debt kill (binary routing grammar, four
orphaned items graduating into parked changes), walkthrough and docs
across example + README; test suite exists to extend
(schema/gate/focus/example). Consulted estimation.md: absent — first
entry owed after delivery.

## Skills

bare — no skill matches TypeScript schema/engine work; the repo's own
laws (vocabulary, parity, mirror) are enforced by `just lint` and
parity-lint, which are the effective skill here.

## Workflow

A — optional-when-empty (2-investigate.md Alternatives), because the
human's room law rules that the room never demands work that doesn't
exist: `x-optional: true` on the fifth artifact, and grant/room/close
skip it while no file exists, block hard once findings surface. B lost:
zero engine surgery is bought with a permanent empty-artifact demand —
the exact ceremony tax the pain names. Committed sub-routes: the fifth
drafts only after the verdict (`requires: [execute]` +
`x-requires-approval: [execute]`); the verdict stays on execute (single
`x-verdict-line`); single receipt bearer — receipts keep landing in
execute, the change's receipt stream; debt.md stays the post-close home
(complement, not replace); the all-granted name/idx mismatch fixes by
following the walk, not the receipts (rides Slice 2). Debt dies (human ruling): the verdict
routing grammar is binary — `slice` · `→ post-delivery`; deferral walks
through the fifth (route: park — open a parked change stub, the stub
commit satisfies the hash law); post-close findings open their own
change, parked when not walked now, declared-work door for the tiny;
the killing slice carries debt.md's four orphans into parked changes
(rides Slice 4).

## Slices

### Slice 1 — the schema learns the fifth step — tolerable end to end

amendment 2026-11-11: the walkthrough test pins four-step completion,
so the predicates land with the schema — old Slice 3 merged here (the
schema cannot commit while the suite is red); the rest renumbers.
Verdict-first is a data dependency: the fifth reads the verdict line,
and approve-on-execute precedes the tick.

- [ ] parser: `x-optional` + `x-requires-verdict` parse lines +
      artifact type fields (bin/gate-lib.js schema mirror,
      SECTION_KEYS block)
- [ ] schema.yaml: fifth entry — id `post-delivery`, generates
      `5-post-delivery.md`, requires `[execute]`,
      `x-requires-approval: [execute]`, `x-optional: true`,
      `x-requires-verdict: true`, template + instruction carrying the
      slices-boundary sentence and the binary routing grammar
- [ ] template `5-post-delivery.md` — batch form: one H2 per finding,
      from · why here · route · risk, tasks + commit + hash law each,
      closing human-validation checkbox
- [ ] 4-execute.md wording: the routing grammar goes binary — `slice` ·
      `→ post-delivery` — mid-size pre-close findings name the fifth;
      post-close findings open their own change (parked stub or
      declared-work door); debt.md unmentioned
- [ ] example copy mirrors (example/openspec/schemas/spec)
- [ ] schema.test.ts: parses x-optional · x-requires-verdict · five
      artifacts · strict chain · flags fail loudly
- [ ] allArtifactsGranted (both parsers): `optional && file-absent`
      satisfies
- [ ] renderRoom pending-find: same predicate (empty fifth never owns
      the room's next-step)
- [ ] eospec close: ungranted filter learns the predicate (file check
      needs root + slug)
- [ ] pendingAct + pendingReport: verify optional-absent never owns the
      echo and renders `·` (no code change where already honest)
- [ ] watcher: `x-requires-verdict` on the fifth — drafting refuses
      until the bearer's verdict line is ticked (close's regex reused)
- [ ] gate.test.ts: no findings → close passes; file on disk → walk
      demands the fifth
- [ ] phasegate.test.ts: unticked verdict blocks the fifth's draft;
      ticked opens it

commit: feat(schema): the post-delivery artifact — conditional fifth step
      hash:
post-commit human validation: read the schema diff and the new template;
      the walk line must read true end to end; `npm test` green

### Slice 2 — the room shows only the human verb

- [ ] renderRoom: pending artifact → `eospec approve`, always (the
      `draft <file>` rule dies)
- [ ] renderRoom: all-granted → `eospec close` (the verdict reminder
      dies; close's refusal keeps teaching)
- [ ] writeFocus: omit the `task:` line when the artifact has no
      checkboxes (no `task ""`)
- [ ] renderRoom: all-granted `artifact-name` follows the walk (final
      artifact), task counter stays on the ledger bearer — the 4-of-5
      mismatch dies
- [ ] focus.test.ts + gate.test.ts: room snapshots per stage

commit: feat(gate): room file names the human verb only
      hash:
post-commit human validation: run `bin/eospec focus post-delivery`, read
      the room file — four lines, one verb

### Slice 3 — receipts land once; the room refreshes on touches

amendment 2026-11-11: two findings surfaced while delivering — (a) the
receipt ledger doubles every mutation (the dev machine loads the
gate twice: the published global copy AND this repo as a project
package — the rebuild's own archive carries the same doubles) and the
appends inflate blank lines; (b) the room file only re-renders on CLI
verbs, but the 1.0 contract promises re-render on every gate-side
touch — the human read a stale room mid-walk (task "", draft 4/4).

- [ ] attribution: dedupe identical last-line receipts and debt lines
      (double-load defense); receipts append as a tight block — one
      separating blank line, no per-line inflation
- [ ] watcher: the aimed change's room file re-renders on attributed
      mutations and on exempt touches inside changes/<aimed>/ (the
      1.0 contract: every gate-side touch)
- [ ] gate.test.ts: same receipt twice → one line; different at → two;
      watcher touch refreshes the room (task count climbs)
- [ ] this ledger's receipt spam deduped by hand when the fix lands

commit: fix(gate): receipts land once; the room refreshes on touches
      hash:
post-commit human validation: run a bash mutation mid-walk, read the
      ledger — one tight receipt block, no doubles; read .focus after a
      ledger tick — task climbs without a verb

### Slice 4 — debt graduates

- [ ] four orphans become parked proposed changes
      (openspec new change + stub brainstorms): spanned-agent riding ·
      post-archive commit gap · external pause arming · stardeck
      eospec.focus facts
- [ ] openspec/learnings/debt.md deleted
- [ ] README:67 architecture line — closed changes route follow-ups by
      opening a change; the doors are two
- [ ] example/README.md:29 surfaced-routing line matches the binary
      grammar
- [ ] test/approval.test.ts:579 fixture path swaps off debt.md

commit: feat(schema): findings graduate — debt.md dies
      hash:
post-commit human validation: `bin/eospec focus` lists the four parked
      changes; learnings/ holds no ledger

### Slice 5 — the walk learns five steps

- [ ] try.sh: the fifth-step states — findings-free close, then a
      findings-drafted walk, new approve press, verdict, close
- [ ] README: room example block, schema description paragraph, the
      room-law sentences, the binary routing grammar
- [ ] example README / narrated comments: "four approve presses" grows
      honestly
- [ ] `just lint` green (vocabulary + parity), `npm test` green

commit: docs(walk): the walk line learns five steps
      hash:
post-commit human validation: run `./example/try.sh` and read the final
      room output in the scratch repo

## Verification

Deterministic: `just lint` (vocabulary law + parity law) · `npm test`
(node --test over test/*.test.ts) · `./example/try.sh` (full lifecycle
in a scratch repo) · `bin/eospec focus post-delivery` snapshot reads
four lines and one verb. Then the ONE human-only act: tick
`Human validation` in 4-execute.md — only a human reply ticks it.

## History

evidence 2026-11-11 — investigation receipts in 2-investigate.md; engine
read verified at bin/gate-lib.js:106-162 (room), :508-529 (predicates),
:590-634 (grant), bin/eospec.js:177-215 (close), tools/parity-lint.mjs,
example/try.sh; no code written yet.
