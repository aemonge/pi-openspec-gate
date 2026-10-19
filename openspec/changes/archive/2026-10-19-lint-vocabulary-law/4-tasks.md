# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — lint law tracks the ruling

> Execution: lint-vocabulary-law

- [x] Step 1 — Edit `justfile` lint recipe: pattern
      `waiver|approv|sanitiz|trust` → `waiver|sanitiz|trust` (approv is
      sanctioned per the 2026-10-17 human ruling "some teeth")
      check: `just lint` exit 0 with approval vocabulary present in tree ·
      paths: justfile · done 2026-10-19 — lint green immediately post-edit
- [x] Step 2 — Canary the law still bites: introduce a forbidden word in a
      scratch src file, `just lint` must fail, revert
      check: lint red on canary, green after revert · paths: — (temp file) ·
      done 2026-10-19 — `src/canary-lint-probe.ts` carrying `trust` → exit 1
      with the offending line quoted; removed → "vocabulary law holds", exit 0
- [x] Step 3 — Full suite: `just test` 57/57 green
      check: suite output · paths: — · done 2026-10-19 — tests 57, pass 57,
      fail 0, 447ms
- [x] Step 4 — Human validation — human runs `just lint` in their terminal
      and reports green; optionally proceeds to `just publish 0.2.0` (their
      act alone) response: "It's been validated, shall we do the rest?" ·
      outcome: VALID · at: 2026-10-19T08:56:56Z (meta permit recorded)

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/justfile · at 2026-10-19T08:51:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-openspec-gate/justfile · at 2026-10-19T08:51:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T08:51:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T08:51:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T08:57:46Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T08:57:46Z
