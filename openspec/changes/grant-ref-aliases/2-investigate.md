# Investigate

> Spec: grant-ref-aliases · aim at the Brainstorm's Questions

## Findings

- Ref resolution today is exact word id only — `bin/gate-lib.js:575` (`a.id === artifactRef`) for bare refs, `:540` (`a.id === sectionPath.artifactId`) for `artifact/section` paths; anything else bounces `no artifact '<ref>' in schema <name>`. Live-caught on `fix-vpn-dns-mullvad-mesh`: `2` and `2-investigate` rejected, `investigate` refused correctly (undrafted).
- The cockpit teaches the aliases it then rejects — `showReport` (`bin/gate-lib.js:729`) prints rows as 1-based position + word id + numbered filename (`2 investigate 2-investigate.md`).
- Precedent for file-shaped refs exists: `artifactForFilename` (`bin/gate-lib.js:418`, mirrored at `src/schema.ts:451`) matches `generates` by basename. Its only consumer is the receipt lander (`src/gate.ts:633`) matching real tool-call paths — never human refs, so aliasing cannot touch it.
- Meta integrity is the hard constraint: `granted_${id}` stamps, `allArtifactsGranted`, and `showReport`'s `approved.has(a.id)` all speak word ids. An alias stamped raw (`granted: brainstorm,2`) desyncs every reader — canonicalization must precede all matching and stamping.
- All human-facing grant surfaces funnel through `grantArtifact`: `grant`, `approve <slug> <artifact>`, `next` (already canonical), declared verbs (already canonical). One canonicalization at its top covers everything.
- Validation facts that bound the alias space: duplicate artifact ids throw (`duplicate artifact id`), but duplicate `generates` is NOT validated; `x-grant-verb` must be one word (`WORD_ID`), and `WORD_ID` allows digits — so `id: 2` and `x-grant-verb: 2` both parse clean today.
- The sequence law (requires-approval/written must reference strictly earlier artifacts) bounds the worst alias failure: after a schema reorder, a stale row number can only ever stamp a sequence-legal step, and the success line echoes the canonical id (`granted m1 · plan`). The echo is the guard.
- No migration hazard: raw-alias stamps cannot exist in any existing meta — alias refs always bounced before this fix. Canonicalization is purely additive.
- Edge behaviors kept loud, not defended: `0`/out-of-range rows fall through to `no artifact '<ref>'`; full subpath refs (`specs/2-idea`) collide with `artifact/section` parsing and report `no artifact 'specs'` — stem-only refs are the documented form; case-sensitive `.md` stem; no trimming (the error echoes the typed ref verbatim).
- stardeck's cockpit (`packages/status/src/active-work.ts`) renders session-declared focus (`galactica-status.openspec-focus.v1` entries) and never parses change meta — zero interface with grant refs. Its `› brainstorm` lag on `fix-vpn-dns-mullvad-mesh` was session focus discipline, not data staleness; no coupling to fix or migrate.

## Options

- **Canonicalize in `grantArtifact`** — one new resolver, `artifactForRef(schema, ref)`: exact word id first, then 1-based row (`^\d+$`), then generated file (stem or with `.md`, suffix match for subpath `generates`); applied to bare refs and the artifact half of section paths before any matching or stamping. Schema-data-derived, CLI-only, `src/schema.ts` mirror untouched. Chosen.
- **Display-only fix** — stop printing row numbers and numbered filenames so the cockpit names only word ids. Rejected: hides the artifact's real name on disk and the row pointer humans already use, to spare the parser.
- **Tighten validation alongside** — reject all-digit artifact ids and grant verbs (`duplicate-generates` check too). Rejected for this change: independent of the alias bug, touches the mirror contract and every schema's validity; its own change.

## Alternatives

- Resolver in the CLI layer (`pios-gate.js` `doGrant`) — what it is: keep `gate-lib` refs raw. The trade-off: four surfaces funnel through `grantArtifact`; the law would be duplicated per surface and drift. Pick-when: `gate-lib` grows a second consumer that must not see aliasing.
- stardeck reads gate meta to render approval truth — what it is: cockpit shows stage from `granted:` instead of declared focus. The trade-off: merges the two state stores; displayed truth races declared focus and the renderer starts inferring. Pick-when: you want a truth-first cockpit — as its own stardeck change, not a side effect here.
- Gate auto-advances session focus on grant — what it is: grants carry a focus update. The trade-off: grants are terminal-only and live outside any session; the CLI cannot reach session focus state without a channel pi does not expose. Pick-when: grants move into session tools, which the human-terminal law forbids.
