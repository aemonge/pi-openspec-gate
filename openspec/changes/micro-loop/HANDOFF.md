# HANDOFF — micro-loop awaits its verdict

Code-complete, tested, mostly committed. Three human acts remain (~2 min).
Everything below is also in the session memory (id 1003).

## State

- Every plan.md task is ticked; the change sits in **verifying**
  (`x-verifying` stamped 15:39:05Z): source mutations locked,
  verification verbs and this directory flow, everything else refuses
  with the exact remedy. The lock refused three probes during wrap-up —
  including the author's own bash tick (bash is never path-exempt) and
  a piped evidence run (the refinement that fixes piped verification
  is in the working tree, not yet loaded by a running session).
- Verdict line `- [ ] Hands-on validation` (plan.md) — **unticked,
  human-only**.

## Evidence (this session, on the record)

- `npm test` → **211/211** (micro states, doors split, verifying
  memory, ceremony arms nothing, twins, parity, walkthrough 18/18
  inside).
- `just lint` → parity (8 verbs, 12 facts) + vocabulary law hold.
- Runtime imports of gate/focus/schema clean under type-stripping.

## Uncommitted (working tree, ready — commit lands post-close)

- `src/classifier.ts` — verifying refinement: a compound passes the
  lock when every segment is verification-anchored OR non-mutating
  (reads flow with the checks: `npm test | grep x` ✓, `git push` ✗).
  Live-caught while validating this change.
- `test/micro.test.ts` — tests regrouped into their describes.
- `openspec/changes/micro-loop/plan.md` — door-discipline tasks ticked,
  refinement task ticked.

## When you're back (~2 min)

1. `npm test` → expect 211/211 (includes the refinement).
2. Tick `- [ ] Hands-on validation` in plan.md (your hand — or reply
   `VALID` in the session; the latch ticks exactly that line).
3. `./bin/eospec close` → validated → archived to
   `openspec/changes/archive/2026-11-19-micro-loop/` → room released.
4. Your terminal: `git add -A && git commit -m "feat: the micro loop —
   one plan.md, one approve, receipts on everything"` (commits are
   never gated in your terminal; the working tree carries the
   refinement).

## Known follow-ups (documented, not done)

- **gate.ts:967 type narrowing** — the negated `!focusIsActive(…)`
  predicate narrows `focus` to `undefined`, making `focus.change` a
  type-level impossibility (LSP 2339). Runtime unaffected (strip-types;
  211/211). One-line fix queued for a fresh mini-plan: inline the disk
  check (`!existsSync(join(root, 'changes', focus.change))`) instead of
  the negated predicate.
- **`npm i -D @types/node`** — silences the recurring LSP cascade
  (2591 node:* imports + 7006 implicit-any handler params). Dev-only,
  zero runtime impact; needs your word (no deps without asking).
- **`.gitignore`**: add `openspec/.focus` (sandbox denied the write).
- **Engine diet**: strip the multi-artifact ladder machinery
  (`x-requires-*`, grantArtifact walk) once micro has proven itself —
  its own mini-plan.
- **Lab**: `/tmp/sup` replay after a pi restart (loads this tree):
  Phase 4 must hold the draft wall with no latch to spend; "start the
  spec" must arm nothing.
