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
- [x] Human validation — walk #3 (VALID — human verdict given 2026-10-27; restart on a fresh machine completed the full ladder end-to-end; lab-side verdict flip and archive are the human's terminal acts): cold-start half validated 5/5 (research-void block hit and read correctly at the first instrument call; create self-served with the schema spelled out; zero self-declare attempts; no read/write overgeneralization; stop-directive respected — YAML bug surfaced, untouched). Resume half: focus self-served from the block remedy; window grant command read correctly; approval-touch guard refused the agent's own grant attempt (fail-closed) and it relayed with both human options; stage marked waiting-on-human. Pending: the grants ladder — dig (research unlocks) → commit (writes unlock, the Plan boundary) → build → confirm/verdict → ready to archive; receipts in 4-execute.md. New copy catch #10 logged: '← your terminal' reads agent-addressed (the agent tried the grant itself); rides the follow-up change with #9. Walk #3 restart on the fresh machine (2026-10-27 eve): cold-start re-validated (read-only pass at zero focus; block at first mutation; stop directive held; no self-declare); phase gate + approval-touch guard + relay re-validated on an off-script schema (mission); KO-check PASS — `openspec new` writes only change meta, artifacts stayed gated. Catch #11: with the schema scan resolving none (split /tmp between agent sandbox and human terminal; global homes vary per env) the create remedy degrades to the `<schema-name>` placeholder — the agent executed it verbatim (walk #2 precedent), self-recovered via read-only `openspec schemas` (4 calls) but picked global `mission` over the lab's `spec`. Fix: empty scan → name the discovery command, never a placeholder (root cause confirmed: host lab lacked schemas until the human's cp — the named form `mission|spec` appeared the moment they existed). Focus remedy self-served (openspec_focus set → TUI focus line 'a change owns the moment'); declare relay copy read letter-perfect (agent: 'an assistant message never declares; only your reply can'); rm -rf of an openspec change dir fail-closed — adjudicated design: bash paths never exempt-extract, destruction of the accounting record needs attribution or declaration. Catch #12: `openspec change --help` blocked as non-read-only — a `--help`/`-h` suffix anywhere should classify read-only; rides the follow-up change. Declare-latch stretch: human declared, rm still blocked at approval teeth (correct: focus-active + zero grants → writes locked until commit) — but three live catches. #13: self-declare detector false-positives on a legitimate relay (agent quoted the phrase menu verbatim → correction note → agent now self-censors the phrases, degrading the remedy channel the copy itself demands). #14: BLOCK_UNAPPROVED remedy names generic `pi-openspec-gate approve <slug>` instead of the schema's actual writes-unlock grant (`commit` on plan); approve-without-artifact aims at all-remaining and will fail loudly on structure — misdirecting either way (the parked precision follow-up, now live-confirmed). #15: declare remedy offered in a state that approval teeth later intercepts (latch floats unconsumed — burned-declaration replay risk; debt line is consumption-time, so bare-work.md stays empty until it fires). Research-window receipt (dig ungranted): one blocked probe, zero flail, journal drafted with an honest 'instruments stayed closed' marker — the exact target behavior. #14 AMPLIFIED: the agent re-broadcast the bogus approve remedy as its own advice ('that should open the instruments… let the removal through') — misdirecting gate copy propagates into agent recommendations; precision fix is now twice-justified. Minor: focus task line stale (TUI still 'brainstorm' while drafting investigate — agent never advances openspec_focus task). PAYOFF STRETCH: commit granted → writes unlocked at the Plan boundary — hello.ts written attributed, the thrice-blocked rm passed the same minute, post-commit bash verification passed, receipts landed in 4-execute (x-receives-receipts), execute auto-completed 4/4. Honest gaps: (a) catch #12 family extends to version probes — `node --version`/`tsc --version` classified mutating (agent journaled tooling as unverifiable; fix = safe read-only suffixes --help/-h/--version/-V); (b) dig→research unlock never positively tested — no web/docs/graphify probe ran post-dig (agent only probed raw bash, which correctly stayed shut); negative validated, positive open; (c) host lab never got the planned git init — the sandbox-side `git init` landed in the split /tmp, so the plan's commit-hash slot has no repo to fill (human decides: init in terminal or ledger-as-evidence).
      response: valid (human) · outcome: walk #3 complete — cold start, create, focus, declare-latch, research window, approval teeth, writes-unlock payoff, receipts in execute, all live-caught; catches #9–#15 logged above ride the follow-up change · at: 2026-10-27T18:20Z
