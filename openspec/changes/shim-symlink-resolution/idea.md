# Idea: A bin that npm installs must run where npm puts it

npm global installs link bins as symlinks: `~/.npm-global/bin/pios-gate` →
`…/node_modules/@aemonge-dev/pi-openspec-gate/bin/pios-gate`. The shims
compute their companion `.ts` via `dirname "$0"` — through a symlink that is
the link farm, not the package dir, so the first real global install
(2026-10-19, "added 1 package") died with `Cannot find module
'…/bin/pios-gate.ts'`. The bug was invisible until now because 0.1.2's bin
predated the shims; every test invoked the repo files directly. A surface
that only works from its source directory is not an installed surface.

## Direction

Shims resolve `$0` through symlinks (`readlink -f` with a plain-`$0`
fallback) before locating the `.ts`; a test replicates npm's link layout so
the class of bug cannot ship silently again. Both bins get the fix — the
permanent alias must mean permanently working.

## Constraints

Shims only; no .ts logic, no gate/classifier behavior, no publish.
Assistant sandbox cannot see ~/.npm-global (npm masking, ledger precedent)
— install verification is the human's terminal act.

## Children

This change — self-parented ramona-plan (mechanical fix).
