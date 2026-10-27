# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

> Process record: the human disarmed the gate at idea stage (2026-10-27,
> host-level switch; repo config.json unchanged) and ruled direct
> implementation. Artifacts 2–5 were written as the honest record of that
> ruling; the steps below are real receipts, hashes backfilled in the
> receipts commit. The refined claim is judged by the Human-validation
> checkbox — walk #3, the one human-only act.

## Task 1 — the five remedies close walk #2's catches

> Spec: state-aware-remedies

- [x] Step 1 — classifier captures the offending segment (`offender`, 60-char cap)
      start: 2026-10-27T14:50Z · elapsed: 5m · check: compound `pwd && ls && python3 --version` names the segment
      paths: src/classifier.ts, test/gate.test.ts
      commit: 9a5122a — rides the work commit
- [x] Step 2 — `scanSchemaNames` + schemas-named create remedy (`--schema spec`, never a placeholder when resolvable)
      start: 2026-10-27T14:55Z · elapsed: 6m · check: builder test — single, multi, placeholder states
      paths: src/schema.ts, src/gate.ts, test/gate.test.ts
      commit: 9a5122a — rides the work commit
- [x] Step 3 — speaker-explicit declare copy + assistant-phrase noticing (`self-declare.v1` fact, one-shot correction note)
      start: 2026-10-27T15:00Z · elapsed: 10m · check: self-declare test — latch refuses, note rides one block
      paths: src/gate.ts, src/facts.ts, index.ts, test/gate.test.ts
      commit: 9a5122a — rides the work commit
- [x] Step 4 — research window state-aware: void research blocks with the shared builder; escape line retired
      start: 2026-10-27T15:10Z · elapsed: 8m · check: research-void tests ×3 states; no "clear the focus" anywhere
      paths: src/gate.ts, test/phasegate.test.ts
      commit: 9a5122a — rides the work commit
- [x] Step 5 — docs carry the new law (README block copy + research window, example README, CHANGELOG Unreleased)
      start: 2026-10-27T15:18Z · elapsed: 6m · check: copy matches builder output byte-for-byte in README
      paths: README.md, example/README.md, CHANGELOG.md
      commit: 9a5122a — rides the work commit
- [x] Step 6 — suite green: 155/155, vocabulary law holds, example walkthrough 11/11
      start: 2026-10-27T15:24Z · elapsed: 4m · check: npm test · just lint · ./example/try.sh
      paths: test/
      commit: 9a5122a — rides the work commit
- [ ] Human validation — walk #3: fresh cold agent on the fixed tree meets the refined claim (research blocked with remedies at first instrument; self-declare impossible by copy, corrected by note if attempted; schema named in create; offender named in compounds; ladder to verdict; zero unaccounted mutations)
      response: · outcome: · at:
