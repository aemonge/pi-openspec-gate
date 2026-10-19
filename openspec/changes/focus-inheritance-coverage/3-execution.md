# Execution: Pin findSessionFile with direct tests

> Estimate: 15–30 min · high confidence, confirmed from plan. Human wait:
> approve, then publish-day live check (checklist, no code).
> Parents: focus-inheritance-coverage (self-parented).

## Skills

bare — node:test tempdir fixtures mirroring the existing gate.test.ts
inherit case; no domain skill informs it (candidate to author later:
"version-drift ledger" — a checklist pattern distinguishing repo state from
installed-copies state, what bit us here).

## Workflow

> Read the implementation once, mirror the integration fixture, enumerate
> the four outcomes, run the suite — coverage, not creation.

## Steps

1. Write `test/focus.test.ts`: import `findSessionFile`; tempdir fixtures
   for the four outcomes; teardown with rmSync.
2. Run `just test` — expect 57 + N green; zero source diff
   (`git diff --stat src/` empty).
3. Receipt: attribution appended; publish-day checklist recorded in
   4-tasks.md as the deferred human step.

## Verification

- Deterministic: new tests green; full suite green; `src/` untouched.
- Human validation (deferred to publish day): after `just publish` + reload,
  dispatch a named-session subagent in a focused gated repo; its session
  file must contain `pi-openspec-gate.inherited.v1` and a trivial mutation
  must attribute to the parent's change.

## Safety & authority

- Mutation scope: `test/focus.test.ts` only (gated, attributed).
- No secrets, no network, no runtime behavior change.

## History

Declared 2026-10-19 after live-bug triage: installed 0.1.2
(`~/.pi/agent/npm`) predates the 3cba431 fix; publish was wedged by the
lint failure (fixed this morning, archived as lint-vocabulary-law).
