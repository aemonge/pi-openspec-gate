#!/bin/sh
# try.sh — the example walkthrough on the v4 spec schema.
#
# Builds a scratch repo from this example, runs the negatives first, then
# walks the four-grant lifecycle — open → dig → commit → build — and the
# verdict lifecycle to ready-to-archive. This directory is never modified.
# Every grant below is what a HUMAN types in their terminal — that is the
# point of the gate.
#
#   ./example/try.sh          (or: just try)
#   GATE=/path/to/pios-gate ./example/try.sh    # override the binary
set -u

HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$HERE/.." && pwd)
GATE=${GATE:-"$ROOT/bin/pios-gate"}
if [ ! -x "$GATE" ]; then
  echo "gate not found: $GATE  (set GATE=/path/to/pios-gate)" >&2
  exit 2
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT INT TERM
mkdir -p "$WORK/openspec/changes/hello-gate"
cp -r "$HERE/openspec/schemas" "$WORK/openspec/schemas"
printf 'schema: spec\nstatus: proposed\n' > "$WORK/openspec/changes/hello-gate/.openspec.yaml"
cd "$WORK" || exit 2

pass=0
fail=0
ok() { echo "  ✓ $1"; pass=$((pass + 1)); }
bad() { echo "  ✗ $1"; fail=$((fail + 1)); }

expect() {
  want=$1; shift
  out=$("$GATE" "$@" 2>&1); status=$?
  printf '$ pios-gate %s\n%s\n\n' "$*" "$out"
  if [ "$status" -ne 0 ]; then bad "exit $status, expected success ('$want')"; return; fi
  case $out in *"$want"*) ok "$want" ;; *) bad "success but no '$want' in output" ;; esac
}

expect_fail() {
  want=$1; shift
  out=$("$GATE" "$@" 2>&1); status=$?
  printf '$ pios-gate %s   ← refusal expected\n%s\n\n' "$*" "$out"
  if [ "$status" -eq 0 ]; then bad "exit 0, expected refusal ('$want')"; return; fi
  case $out in *"$want"*) ok "refused: $want" ;; *) bad "refused but without '$want'" ;; esac
}

C=openspec/changes/hello-gate

# md <file> <H1 title> [H2 sections…]
md() {
  f=$1; t=$2; shift 2
  { printf '# %s\n' "$t"; for s in "$@"; do printf '\n## %s\n' "$s"; done; } > "$C/$f"
}

echo '1 ── sequence: declaration sequence is grant sequence'
expect_fail 'in sequence' dig hello-gate

echo '2 ── you approve what you read'
expect_fail 'not drafted yet' open hello-gate
md 1-brainstorm.md Brainstorm Pain Questions
expect 'granted hello-gate · brainstorm' open hello-gate

echo '3 ── the journal is free: investigate needs no shape, only substance'
printf '# Investigate\n\nFindings: the gate reads only x- tags.\nNo alternatives needed — direct route.\n' > "$C/2-investigate.md"
expect 'granted hello-gate · investigate' dig hello-gate

echo '4 ── the contract is hard: every declared section at stamp time'
md 3-plan.md Plan Estimate Skills
expect_fail 'missing declared structure: Workflow' commit hello-gate
md 3-plan.md Plan Estimate Skills Workflow Slices Verification History
expect 'granted hello-gate · plan' commit hello-gate

echo '5 ── the cockpit names the next human act'
printf '# Execute\n\n- [ ] Human validation — response: · outcome:\n' > "$C/4-execute.md"
expect 'grant: pios-gate build' pending hello-gate

echo '6 ── completion: the last grant stamps the change approved'
expect 'all artifacts granted — status: approved' build hello-gate

echo '7 ── the verdict lifecycle: confirm, tick, ready'
expect 'needs confirm (verdict open)' pending hello-gate
expect 'confirmed hello-gate' confirm hello-gate
printf '# Execute\n\n- [x] Human validation — response: looks right · outcome: pass\n' > "$C/4-execute.md"
expect 'ready to archive?' pending hello-gate

echo '8 ── the final state on disk'
echo '── .openspec.yaml:'
cat "$C/.openspec.yaml"
echo '── inspect:'
"$GATE" inspect hello-gate

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
