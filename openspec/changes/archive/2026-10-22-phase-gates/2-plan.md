# Plan: phase gates — rung grants, declared gates, verbose cockpit

> Estimate: 3–5h · medium-high confidence (mechanisms all verified against extension API + openspec CLI source)
> Evidence: context/context_with_system events verified in pi's ExtensionAPI; x- tag stripping verified in openspec's schema zod; gate-lib/approval contract-test pattern already proven
> Human wait: walk one fixture mission with the grant verbs — propose→deal→plan→order→execute — watching blocks and stamps
> Parent idea: none

## Acceptance

- Schema reader: resolves the change's schema (project-local, then global `~/.config/openspec/schemas/`), reads `x-requires-approval`, `x-sections`, `x-lines`; unknown references fail loudly as facts, never silently
- Session guard: creating rung N+1's artifact (schema `generates` filename, file absent) while its `x-requires-approval` rungs aren't in `phases_approved` → block, byte-stable remedy quoting the exact grant command
- Session guard: creating an artifact missing declared `x-sections`/`x-lines` → block naming them; existing files stay editable
- Meta: cumulative `phases_approved:` flat key; granting the last rung writes `status: approved` (source teeth unchanged)
- CLI: `propose · deal · plan · order · execute <slug>` grants (next-rung-only, refuse to stamp artifacts missing declared sections/lines); `approve <slug> [rung]` canonical + big-bang; `confirm`; `pending` cockpit upgrade; new `show <slug>` verbose mission state (rungs, stamps, section presence, receipts count, next act); `focus` teaching verb; gate-owned verbs never forwarded; everything else execs openspec verbatim
- Protocol block: `context` event injects the mission protocol (story, grants are human-terminal, never invoke approve/confirm, remedies); a shipped skill carries the full manual (`**/skills/**` already exempt)
- Latch: "action the mission" / "execute the mission" recognized; "job" and "do it" remain legacy aliases
- Legacy: `approval` teeth, humangate, archive guard, stamping unchanged; config without `approval.phaseGates` behaves exactly as 0.3.1; schemas without x- tags get no phase gates
- Facts: `pi-openspec-gate.phasegate.v1` (reason: missing-approval | missing-sections) and grant stamps recorded
- `just test` and `just lint` green; TS↔JS contract tests for the shared section/grant logic

## Scope

`src/` (schema reader, guard in gate.ts, phases meta in approval.ts), `bin/` (pios-gate.js verbs, gate-lib.js grants/pending/show), `config.json` (`approval.phaseGates`), skill + context block, `test/`, README, CHANGELOG.

## Exclusions

- No openspec CLI changes; no schema-content changes (mission-schema slice owns adoption)
- No freeze-on-approved-rungs (reopen can be a later slice); no sub-rung gates
- Memory instruments ride their own slice
