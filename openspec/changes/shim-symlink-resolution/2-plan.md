# Plan: Shims that survive npm's link farm

> Estimate: 20–40 min · high confidence
> Evidence: live MODULE_NOT_FOUND through `~/.npm-global/bin/pios-gate` —
> node resolved the shim via symlink; `dirname $0` = link dir, .ts absent.
> Parent idea: none (bug fix on pios-gate-cli's freshly shipped surface)
> Human wait: approve; then verify the reinstalled bins from their terminal
> (assistant sandbox cannot see ~/.npm-global — ledger precedent, 0.1.2 era).

## Acceptance

- Both shims (`bin/pi-openspec-gate`, `bin/pios-gate`) resolve `$0` through
  symlinks before computing the script dir:
  `SELF=$(readlink -f "$0" 2>/dev/null || echo "$0")` — repo-local runs
  unchanged (fallback path), npm-global runs land in the package copy.
- New test replicating npm's layout: temp link-dir with symlinks to a
  package-copy dir; invoking through the links executes approve/confirm/
  pending dispatch (no MODULE_NOT_FOUND), passthrough still verbatim.
- Old bin's identical latent bug fixed by the same edit (alias forever must
  mean works forever).
- Full suite + lint green.

## Scope

- `bin/pi-openspec-gate`, `bin/pios-gate`, `test/pios-wrapper.test.ts`.

## Exclusions

- No .ts changes, no gate/classifier changes, no publish (reinstall is the
  human's `npm install -g ~/projects/pi-openspec-gate` again, after merge).
