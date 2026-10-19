# Idea: The lint law lags the ruling

The justfile's `lint` recipe still bans `approv` in `src/ test/ config.json
index.ts`, but the human ruling of 2026-10-17 ("some teeth") sanctioned
'approv' as accounting vocabulary — `src/approval.ts` shipped in 0.2.0 under
that ruling. Result: `just lint` fails today, and since `just publish` runs
`lint` first, the 0.2.0 release was never published (registry sits at 0.1.2)
and the global install the human relies on for terminal approval has gone
stale/missing. The vocabulary law exists to keep permission words out of the
gate; it must track the sanctioned set, not freeze it.

## Direction

Update the `lint` grep to the current sanctioned vocabulary: `waiver`,
`sanitiz`, `trust` stay forbidden; `approv` is removed. No behavior change
anywhere else — one recipe, one pattern.

## Constraints

Scope ceiling: the `justfile` lint recipe and its test coverage (if any).
No source changes, no new vocabulary rulings.

## Children

`lint-vocabulary-law` — this change is its own ramona-plan (mechanical fix,
no separate parent idea needed).
