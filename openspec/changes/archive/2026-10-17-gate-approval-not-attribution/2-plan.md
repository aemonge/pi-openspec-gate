# Plan: Gate on approval, not attribution

> Estimate: 2–3 h · medium-high confidence
> Evidence: the 2026-10-16 incident (assistant self-minted a change post-block)
> and the 2026-10-17 live protocol (attribution machinery works end-to-end; the
> hole is that nothing marks a change as human-approved).
> Parent idea: gate-approval-not-attribution (this change)
> Human wait: `pi-openspec-gate approve gate-approval-not-attribution` from your
> terminal — the dogfood proof — before this change is archived.

## Doctrine note (amendment, not a break)

"No approvals" in the original ladder plan meant: no *permission* vocabulary —
appa owns permission. Approval here is **accounting of a human act**, the same
law as the "do it" declaration latch: persistent, per-change, human-terminal
only. The gate still owns declaredness; this makes *who ruled* part of the
declared record instead of silently absent.

## Done when

- `.openspec.yaml` of a change carries `status:` (proposed|approved) — set to
  `proposed` automatically when the gate witnesses an assistant-side
  `openspec new change` (with `created_by: assistant` audit stamp); human
  terminal creations are unstamped by definition (the gate never saw them)
- Source mutations under a focused but **unapproved** change are blocked with
  an exact copy carrying the terminal remedy — attribution alone no longer
  satisfies the gate
- `openspec/**` stays exempt: docs drafting (ideas, plans, tasks prose) is
  never blocked — the ladder stays enterable by the assistant, approval gates
  *execution*, not drafting
- Approval/validation are reachable **only** from the human terminal via
  `pi-openspec-gate approve|validate <slug>` (bin script shipped in this repo);
  any tool-call attempt to invoke them is blocked first, before exemption,
  declaration, or any other path could reach them
- `[ ]→[x]` flips on lines containing "Human validation" require a permit:
  a recorded `validated:` timestamp in the change meta, or the human's literal
  one-shot "VALID" reply (same latch mechanics as "do it")
- `openspec archive <slug>` of an unapproved change is blocked unless the
  command carries `--i-am-the-human`
- New facts: `unapproved.v1`, `humangate.v1`, `creation-stamped.v1` — facts,
  never renders; a future cockpit may read them
- Config section `approval: {enforce, humanGateSteps, archiveGuard,
  stampCreations}` — repo config ships all true; absent section = feature off
  (backward compatible for other installs)
- Deterministic suite green including byte-exact block-copy assertions; no
  waiver/trust vocabulary anywhere in src/

## Scope

- The gate repo only: src/approval.ts (meta read/stamp), bin/pi-openspec-gate
  (human-terminal CLI), gate.ts decision-order inserts, config.ts section,
  tests, README, version 0.2.0
- Decision order after this change:
  instruments → approval-touch guard → human-gate flip guard → archive guard →
  exempt → (focus: unapproved? block) → attribute → declared → block

## Exclusions

- No openspec CLI modifications (approve stays our bin script)
- No cryptography, no auth — friction + audit, on-record and visible
- No changes to user repos' workflows beyond the new optional meta fields
- The current session's already-loaded gate instance is grandfathered (old
  code runs until restart); enforcement is live for sessions started after
  deploy
