# Execution: Shims that survive npm's link farm

> Estimate: 20–40 min · high confidence, confirmed from plan. Human wait:
> terminal reinstall + both-bin smoke.
> Parents: shim-symlink-resolution (self-parented; fix on pios-gate-cli's
> surface, found in live install 2026-10-19).

## Skills

bare — two shell one-liners and one test fixture; no domain skill
(candidate later: "packaging ledger" — npm bin/symlink/files facts so
install-path bugs surface in CI, not in the human's terminal).

## Workflow

> Reproduce the link farm in a fixture, fix the resolution, prove both
> invocation styles still work.

## Steps

1. Fixture test first: temp link-dir + package-copy layout, symlinked bins,
   invoke through links → currently fails MODULE_NOT_FOUND (red), committed
   as the reproduction.
2. Shim fix: `SELF=$(readlink -f "$0" 2>/dev/null || echo "$0")` + dirname
   on SELF, both shims, comments explaining npm's symlink model.
3. Suite + lint; receipts; hand the reinstall command to the human.

## Verification

- Deterministic: npm-layout test green (dispatch through links), direct-run
  tests unchanged, `just test` + `just lint` green.
- Human validation: after `npm install -g ~/projects/pi-openspec-gate`,
  both `pios-gate pending` and `pi-openspec-gate --help` answer from PATH.

## Safety & authority

- Mutation scope: two shims + wrapper test (gated, attributed).
- No permission vocabulary; no runtime source changes beyond the shims.
- Assistant sandbox cannot observe ~/.npm-global — human verifies install.

## History

Declared 2026-10-19 after live install: npm -g "added 1 package", bins
linked, both shims MODULE_NOT_FOUND through the symlink (first npm-global
exposure of the shims; 0.1.2's bin predated them).
