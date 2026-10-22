# Plan: mission schema adoption in this repo

> Estimate: 1–2h · high
> Evidence: mission schema already drafted, loads clean (`openspec schemas` verified); adoption points grepped — two code references, one config, one README, tests
> Human wait: `openspec new change smoke --schema mission` in this repo, then archive it — the full walk on the new default
> Parent idea: none

## Acceptance

- `openspec/config.yaml` default: `schema: mission`
- Gate remedy text says `--schema mission`; `pendingReport` counter follows `5-execution.md`
- `openspec/schemas/ramona-plan/` and `ramona-idea/` deleted from the repo; archive untouched (history keeps its names)
- README rewritten around the mission story: rungs, grants, two lanes, protocol block + skill, memory-instruments law
- CHANGELOG entry citing all three changes
- Protocol skill content finalized (vocabulary matches shipped behavior)
- `openspec schemas` shows only `mission` (project); `openspec new change smoke --schema mission` scaffolds and validates
- `just test`, `just lint`, `just build` green; `graphify update .` run (graph cites schema paths)

## Scope

`openspec/config.yaml`, `src/gate.ts` remedy line, `bin/gate-lib.js` counter, README.md, CHANGELOG.md, skills content, schema dir deletions, graphify refresh.

## Exclusions

- Gate mechanics (phase-gates slice); memory instruments (their slice)
- Global sync (done by you by hand); galactica mirrors; archive migrations
