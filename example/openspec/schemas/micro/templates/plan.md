# <!-- slug -->

## Goal

<2–3 lines: what this mini-iteration delivers, and why now.>

## Estimate

<range · confidence — honest sizing, not hope.>

## Skills

<!-- the skills this walk loads — empty allowed, absent not; record the
     choice, even: none — why -->

## Approach

<!-- method: the way this walk works
     architecture: the paradigm in play — omitting it consciously takes the
     simple default (stdlib-first, single module); mixed goes comma-listed -->

## Questions & Decisions

<!-- every ambiguity resolved BEFORE approval: `- <question> → <decision>` -->
<!-- open questions go back to the human — never into code -->

## Tasks

<!-- 1–3 mandatory slices, each titled by its acceptance:
     ### Slice — <the acceptance> -->
<!-- steps are checkbox lines, each carrying its commit line + hash slot:
     - [ ] step: ...
       commit: feat(scope): what lands (hash: ____) -->
<!-- one commit per step — binds plan-gated coding only; bare work stays one
     mutation. `slice-gates: true` pauses coding at slice boundaries —
     eospec approve advances, eospec approve --all approves every slice -->

### Slice — <the acceptance>

- [ ] first small step
  commit: feat(scope): what lands (hash: ____)

## Verification

<!-- automated checks first; then the acceptance criteria as tick-free prose
     bullets echoing the slice titles; then explicit human validation
     instructions — a production smoke test / guided manual walkthrough in
     the human environment (a prompt ladder for gates, a UI walkthrough for
     interfaces, API smoke for backends) — never diff/git-diff, and prose
     never checkboxes: a checkbox here counts as work and could self-lock
     the change before the human pass -->

- [ ] typecheck / lint / tests pass

- <acceptance one — the observable proof>
- <acceptance two — the observable proof>

<explicit validation instructions — what to open, what to expect. prose only;
 the human judges, then answers VALID or ticks the verdict below>

- [ ] Hands-on validation
