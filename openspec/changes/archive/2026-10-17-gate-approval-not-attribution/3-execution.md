# Execution: Gate on approval, not attribution

> Pinned contracts. Block copies are byte-exact and test-asserted; changing a
> copy means changing its test in the same commit.

## Change meta (`.openspec.yaml`)

- Location: `<openspecRoot>/changes/<slug>/.openspec.yaml`; flat `key: value`
  lines; may not exist (treated as `status: absent`)
- Keys read by the gate: `status` (string), `validated` (ISO instant)
- Keys written by the gate: `status: proposed`, `created_by: assistant`
  (creation stamp only, witnessed assistant creations)
- Keys written by the human CLI: `status: approved`, `approved_at`,
  `validated` (+ `validated_at`), preserving all other lines
- `status: approved` is the only passing value; anything else (proposed,
  absent) blocks under `approval.enforce`

## Human-terminal CLI (`bin/pi-openspec-gate`)

- `approve <slug>` — set `status: approved` + `approved_at: <UTC>`
- `validate <slug>` — set `validated: <UTC>` (+ `validated_at`)
- Creates the file if absent (human-created changes without meta can still be
  approved); refuses slugs that don't exist on disk
- Node ≥22.19, `#!/usr/bin/env node --experimental-strip-types`, reuses
  `src/approval.ts` read/write helpers — one meta parser, two surfaces

## Decision order (gate.ts, after instruments)

1. **approval-touch guard** — bash command matching
   `/pi-openspec-gate\s+(approve|validate)\b/` (basename or path) →
   `BLOCK_APPROVAL_TOUCH` + fact `unapproved.v1`? no — fact `humangate.v1` is
   for flips; this guard records fact `unapproved.v1` with
   `kind: 'approval-touch'`. Runs before exempt/declare so no path or latch
   can reach the approver.
2. **human-gate flip guard** (`approval.humanGateSteps`) — edit/write where
   new text matches `/^\s*[-*]\s*\[x\][^\n]*$/im` on a line containing
   `human validation` (case-insensitive) — permit = focused change meta has
   `validated`, or session VALID latch armed (consume). Else
   `BLOCK_HUMANGATE` + fact `humangate.v1`.
3. **archive guard** (`approval.archiveGuard`) — bash matching
   `/\bopenspec\s+archive\b/`: extract slug (next non-flag token); if the
   change exists and `status !== approved` and no `--i-am-the-human` →
   `BLOCK_ARCHIVE` + fact `unapproved.v1` (`kind: 'archive'`).
4. exempt (unchanged; docs drafting stays free)
5. focus active: if `approval.enforce` and meta `status !== approved` →
   `BLOCK_UNAPPROVED` + fact `unapproved.v1` (`kind: 'source-mutation'`);
   else attribute + receipt (unchanged)
6. declared latch → debt line (unchanged)
7. block (unchanged copy)

**Creation stamping** (`approval.stampCreations`): when a tool call classifies
as `creation` (openspec new/init witnessed), serialize a stamp write
(`status: proposed`, `created_by: assistant` — set, never overwrite existing
values) + fact `creation-stamped.v1`. Assistant-origin is derived: the gate
witnessed the tool call; human-terminal creations are invisible to the gate.

**VALID latch**: `message_end`, user role, text ≤200 chars matching
`/\bVALID\b/u` → `state.validationPermit = true`; consumed by the next
human-gate flip guard pass. Independent of the declare latch.

## Block copies (byte-exact)

```
BLOCK_APPROVAL_TOUCH:
⛔ approval is human-terminal only
   the assistant cannot approve or validate — ask the human

BLOCK_HUMANGATE:
⛔ human-validation flip requires a human act
   validate: pi-openspec-gate validate <slug>   ← your terminal
   or reply literally: VALID

BLOCK_ARCHIVE:
⛔ archive requires an approved change
   approve: pi-openspec-gate approve <slug>   ← your terminal
   or pass --i-am-the-human

BLOCK_UNAPPROVED:
⛔ focused change is not approved — attribution is not approval
   approve: pi-openspec-gate approve <slug>   ← your terminal
   docs:    openspec/** stays exempt — drafting is never blocked
```

## Config (config.json)

```json
"approval": { "enforce": true, "humanGateSteps": true,
              "archiveGuard": true, "stampCreations": true }
```

Absent section → all false (legacy behavior). Unknown keys ignored.

## Facts

- `pi-openspec-gate.unapproved.v1` — `{kind: source-mutation|archive|approval-touch, tool, change?, at}`
- `pi-openspec-gate.humangate.v1` — `{tool, paths, permit: 'none'|'meta'|'valid-latch', at}` (permit on pass-through of a permitted flip)
- `pi-openspec-gate.creation-stamped.v1` — `{change, tool, at}`
