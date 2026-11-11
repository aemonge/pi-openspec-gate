#!/bin/sh
# try.sh — the example walkthrough on the v9 spec schema.
#
# Builds a scratch repo from this example, runs the negatives first, then
# walks a findings-free lifecycle — aim once, four approve presses, the
# fifth never exists, the close skips it — and then a second delivery
# whose verdict routes a finding to the fifth artifact: ticked, drafted,
# approved, closed. This directory is never modified.
# Every approve below is what a HUMAN types in their terminal — that is
# the point of the gate.
#
#   ./example/try.sh          (or: just try)
#   GATE=/path/to/eospec ./example/try.sh    # override the binary
set -u

HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$HERE/.." && pwd)
GATE=${GATE:-"$ROOT/bin/eospec"}
if [ ! -x "$GATE" ]; then
  echo "gate not found: $GATE  (set GATE=/path/to/eospec)" >&2
  exit 2
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT INT TERM
mkdir -p "$WORK/openspec/changes/hello-gate"
cp -r "$HERE/openspec/schemas" "$WORK/openspec/schemas"
printf 'schema: spec\nx-status: proposed\n' > "$WORK/openspec/changes/hello-gate/.openspec.yaml"
cd "$WORK" || exit 2

pass=0
fail=0
ok() { echo "  ✓ $1"; pass=$((pass + 1)); }
bad() { echo "  ✗ $1"; fail=$((fail + 1)); }

expect() {
  want=$1; shift
  out=$("$GATE" "$@" 2>&1); status=$?
  printf '$ eospec %s\n%s\n\n' "$*" "$out"
  if [ "$status" -ne 0 ]; then bad "exit $status, expected success ('$want')"; return; fi
  case $out in *"$want"*) ok "$want" ;; *) bad "success but without '$want'" ;; esac
}

expect_fail() {
  want=$1; shift
  out=$("$GATE" "$@" 2>&1); status=$?
  printf '$ eospec %s   ← refusal expected\n%s\n\n' "$*" "$out"
  if [ "$status" -eq 0 ]; then bad "exit 0, expected refusal ('$want')"; return; fi
  case $out in *"$want"*) ok "refused: $want" ;; *) bad "refused but without '$want'" ;; esac
}

C=openspec/changes/hello-gate

# md <file> <H1 title> [H2 sections…]
md() {
  f=$1; t=$2; shift 2
  { printf '# %s\n' "$t"; for s in "$@"; do printf '\n## %s\n' "$s"; done; } > "$C/$f"
}

echo "1 ── aim, and the walk refuses what isn't there"
expect 'focused hello-gate · next: awaiting draft of 1-brainstorm.md' hello-gate
expect_fail 'not drafted yet' approve
expect_fail 'not closed' close hello-gate
md 1-brainstorm.md Brainstorm Pain Questions
expect 'approved hello-gate · brainstorm' approve

echo '2 ── the journal is free: investigate needs no shape, only substance'
printf '# Investigate\n\nFindings: the gate reads only x- tags.\nNo alternatives needed — direct route.\n' > "$C/2-investigate.md"
expect 'approved hello-gate · investigate' approve

echo '3 ── the contract is hard: every declared section at stamp time'
md 3-plan.md Plan Estimate Skills
expect_fail 'missing declared structure: Workflow' approve
md 3-plan.md Plan Estimate Skills Workflow Slices Verification History
expect 'approved hello-gate · plan' approve

echo '4 ── the room view names the next human act'
printf '# Execute\n\n- [ ] Human validation — response: · outcome:\n' > "$C/4-execute.md"
expect '→ eospec approve' focus

echo '5 ── completion: the last approve stamps the change approved'
expect 'all steps approved — status: approved' approve

echo '6 ── the close: tick the verdict, then close'
expect '— eospec close' focus
expect_fail 'not closed — tick' close
printf '# Execute\n\n- [x] Human validation — response: looks right · outcome: pass\n' > "$C/4-execute.md"
expect 'closed hello-gate · validated · archiving' close

echo '7 ── a second delivery: findings route to the fifth artifact'
C2=openspec/changes/hello-two
mkdir -p "$WORK/openspec/changes/hello-two"
printf 'schema: spec\nx-status: proposed\n' > "$C2/.openspec.yaml"
printf '# Brainstorm\n\n## Pain\n\n## Questions\n' > "$C2/1-brainstorm.md"
printf '# Investigate\n' > "$C2/2-investigate.md"
printf '# Plan\n\n## Estimate\n\n## Skills\n\n## Workflow\n\n## Slices\n\n## Verification\n\n## History\n' > "$C2/3-plan.md"
printf '# Execute\n\n- [ ] feat(walk): the finding surfaces\n      hash: abc1234\n- [ ] Human validation — response: · outcome: · surfaced: F1 → post-delivery\n' > "$C2/4-execute.md"
expect 'focused hello-two' hello-two
expect 'approved hello-two · brainstorm' approve
expect 'approved hello-two · investigate' approve
expect 'approved hello-two · plan' approve
expect 'all steps approved — status: approved' approve
expect_fail 'not closed — tick' close
printf '# Execute\n\n- [x] feat(walk): the finding surfaces\n      hash: abc1234\n- [x] Human validation — response: yes · outcome: pass · surfaced: F1 → post-delivery\n' > "$C2/4-execute.md"
printf '# Post-delivery\n\n## F1 — the walk needs a fifth step\n\n- from: slice 4 review\n- why here: the routing law needs its own risk pass\n- route: the fifth artifact designs it\n- risk: the walk grows ceremony\n\n- [x] design the fifth artifact\n- [x] feat(walk): post-delivery — the conditional fifth\n      hash: def5678\n\n- [x] Human validation — response: yes · outcome: pass\n' > "$C2/5-post-delivery.md"
expect '→ eospec approve' focus
expect 'approved hello-two · post-delivery · all steps approved — status: approved' approve
expect 'closed hello-two · validated · archiving' close

echo '8 ── the final state on disk'
echo '── .openspec.yaml:'
cat "$C/.openspec.yaml"
echo '── room:'
"$GATE" focus

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
