# Plan: Track the sanctioned vocabulary in lint

> Estimate: 10–20 min · high confidence
> Evidence: `just lint` fails today on `test/approval.test.ts` and
> `config.json` — the exact words the 2026-10-17 ruling sanctioned.
> Parent idea: none (self-parented mechanical fix; see 1-idea.md)
> Human wait: run `just lint && just test` from their terminal after the fix
> lands, then `just publish 0.2.0` when ready to ship.

## Acceptance

- `just lint` passes with `src/approval.ts`, `test/approval.test.ts`, and
  `config.json`'s `approval` section present.
- A canary check confirms the law still bites: `waiver`, `sanitiz`, `trust`
  remain forbidden (e.g. `echo trust > /tmp/canary && grep -riE
  'waiver|sanitiz|trust' src/` style spot check, or a negative fixture).
- `just test` green (57/57 baseline).
- Human-verified: human runs `just lint` in their terminal — green.

## Scope

- `justfile` `lint` recipe pattern only: `waiver|approv|sanitiz|trust` →
  `waiver|sanitiz|trust`.

## Exclusions

- No publishing in this change (`just publish 0.2.0` is the human's terminal
  act — npm auth lives there, per the 0.1.2 ledger).
- No reinstallation of the global bin (human's npm environment).
- No vocabulary additions or subtractions beyond the ruled sanction.
