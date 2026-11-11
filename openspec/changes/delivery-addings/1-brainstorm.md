# Brainstorm

> Spec: delivery-addings · consult `openspec/learnings/` before drafting

## Pain

Execution is where reality contradicts the plan: implementing surfaces
bugs, tech debt, and small enhancements the plan could not have named.
Today the only law-abiding exits are (a) routing findings to
`openspec/learnings/debt.md` — they leave the flow entirely — or (b)
opening a whole new spec for what may be a twelve-line fix, and the
agent is eager to do (b) because nothing teaches it otherwise. The
human experienced both on the first live walkthrough: governance
demanded paperwork for a greeting script, and post-delivery findings
had no home inside the change that produced them.

## Questions

- Should the `execute` instruction and template teach a **delivery
  addings loop**: findings surfaced mid-execution become appended H2
  slices (same checkbox + commit-hash law as plan-born slices), the
  plan gains a one-line "Delivery addings" amendment so execute still
  mirrors it, and the Human-validation verdict simply waits until the
  addings are done — no new spec, no engine change?
- Where is the line against scope abuse: an "adding" must trace to
  something the implementation surfaced (bug / debt / enhancement
  observed while delivering), not a dressed-up new feature — what
  wording enforces that without a gate?
- Post-close findings keep the debt.md → follow-up-change lifecycle:
  confirm the two-lifecycle split (addings = pre-verdict, same spec;
  follow-ups = post-archive, new spec) and where each is taught?
- The schema instruction's goal-line wording ("The one-line Goal lives
  in .openspec.yaml (meta goal:)") led an agent to write a nested
  `meta:\n goal:` block — openspec wants a flat top-level `goal:`.
  Fix the wording in the same breath (schema text change → v7)?

<!-- Direction (optional, free): teaching-only — execute instruction +
4-execute template wording, one README line at most, schema v7 for the
goal-line fix. No gates, no keys, no engine. -->
