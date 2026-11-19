#!/bin/sh
# try.sh — the example walkthrough on the micro schema.
#
# Builds a scratch repo from this example, runs the refusals first, then
# walks two lifecycles: a findings-free mini-plan (draft → approve → tick
# → verdict → close) and a slice-gated one (approve opens slice 1, the
# boundary pauses, approve advances, close ends it). This directory is
# never modified. Every approve below is what a HUMAN types in their
# terminal — that is the point of the gate.
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
printf 'schema: micro\nx-status: proposed\n' > "$WORK/openspec/changes/hello-gate/.openspec.yaml"
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

# plan <task-line> — a minimal valid micro plan with one open task line
plan() {
  { printf '# hello-gate\n\n## Goal\n\nPrint hello, fast.\n\n'
    printf '## Questions & Decisions\n\n- which name? → the argument\n\n'
    printf '## Tasks\n\n%s\n\n## Verification\n\n- [ ] checks pass\n- [ ] Hands-on validation\n' "$1"
  } > "$C/plan.md"
}

echo "1 ── the gate refuses what isn't there"
expect 'focused hello-gate' hello-gate
expect_fail 'not drafted yet' approve
plan '- [ ] write src/hello.py'
expect 'approved hello-gate · plan · coding open — 2 task(s)/2' approve

echo '2 ── the room view names the counts and your verb'
expect '[0/2 tasks] · coding' focus

echo '3 ── re-approve reports the walk, it does not re-stamp'
expect 'coding open — 0/2 tasks done' approve

echo '4 ── the close waits for the tasks'
expect_fail '2 task(s) open' close
sed -i 's/- \[ \] write src\/hello.py/- [x] write src\/hello.py/' "$C/plan.md"
sed -i 's/- \[ \] checks pass/- [x] checks pass/' "$C/plan.md"

echo '5 ── the close waits for your verdict'
expect_fail "tick 'Hands-on validation'" close
sed -i 's/- \[ \] Hands-on validation/- [x] Hands-on validation/' "$C/plan.md"
expect 'closed hello-gate · validated · archiving' close

echo '6 ── archived with receipts, the room released'
ARCH=$(ls -d "$WORK"/openspec/changes/archive/*hello-gate 2>/dev/null | head -1)
grep -q 'x-validated' "$ARCH/.openspec.yaml" && ok 'x-validated stamped' || bad 'x-validated missing'
grep -q 'human-approve' "$ARCH/.ledger" && ok 'ledger: human-approve first' || bad 'ledger: human-approve missing'

echo '7 ── slice gates: approve opens one slice at a time'
C2=openspec/changes/hello-sliced
mkdir -p "$C2"
printf 'schema: micro\nx-status: proposed\n' > "$C2/.openspec.yaml"
{ printf '# hello-sliced\n\n## Goal\n\nTwo slices, gated.\n\n'
  printf '## Questions & Decisions\n\n## Tasks\n\nslice-gates: true\n\n'
  printf '### Slice: one\n\n- [ ] first\n\n### Slice: two\n\n- [ ] second\n\n'
  printf '## Verification\n\n- [ ] checks pass\n- [ ] Hands-on validation\n'
} > "$C2/plan.md"
expect 'focused hello-sliced' hello-sliced
expect 'approved hello-sliced · plan · coding open — 3 task(s)/3' approve
grep -q 'x-slice: 1' "$C2/.openspec.yaml" && ok 'x-slice: 1 stamped' || bad 'x-slice: 1 missing'
sed -i 's/- \[ \] first/- [x] first/' "$C2/plan.md"

echo '8 ── the boundary pauses, and names the next slice'
expect "slice 'Slice: one' done" focus

echo '9 ── approve advances the slice'
expect "slice 'Slice: two' unlocked" approve
grep -q 'x-slice: 2' "$C2/.openspec.yaml" && ok 'x-slice: 2 stamped' || bad 'x-slice: 2 missing'

echo '10 ── the walk ends the same way'
sed -i 's/- \[ \] second/- [x] second/' "$C2/plan.md"
sed -i 's/- \[ \] checks pass/- [x] checks pass/' "$C2/plan.md"
sed -i 's/- \[ \] Hands-on validation/- [x] Hands-on validation/' "$C2/plan.md"
expect 'closed hello-sliced · validated · archiving' close
expect 'nothing pending' focus

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
