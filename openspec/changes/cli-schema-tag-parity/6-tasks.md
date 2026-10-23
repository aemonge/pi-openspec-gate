# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Red: the shipped spec schema fails through the bin parser

> Spec: cli-schema-tag-parity

- [ ] Step 1 — Add failing tests: parse `openspec/schemas/spec/schema.yaml` through `bin/gate-lib.js` — `schemaIsGated` true, `artifactForGrantVerb('propose')` → `idea`, `x-requires-approval`/`x-sections` block lists populated, mission flow lists unchanged
      start: — · elapsed: — · check: suite red for exactly the diagnosed reasons
      paths: test/schema.test.ts
      commit: — · cli-schema-tag-parity: Task 1 Step 1 — red tests [x]

## Task 2 — Capture rule: un-indented block lists are captured

> Spec: cli-schema-tag-parity

- [ ] Step 1 — Generalize the pending-block capture in `bin/gate-lib.js`: an entry `- <content>` at any indent is a block item unless its content is an `id:`-headed artifact entry; `sectionsKeyIndent` stays the boundary for `x-sections` chunk sub-keys only
      start: — · elapsed: — · check: Task 1's parse criteria green
      paths: bin/gate-lib.js
      commit: — · cli-schema-tag-parity: Task 2 Step 1 — capture rule [x]

## Task 3 — Loud grant-shaped dispatch

> Spec: cli-schema-tag-parity

- [ ] Step 1 — Verb vocabulary from resolvable schemas (cached per root) in `bin/pios-gate.js`; vocabulary commands grant the matching step or fail loudly — never passthrough; foreign commands keep verbatim `openspec` exec
      start: — · elapsed: — · check: vocabulary never reaches the fallback; passthrough test green
      paths: bin/pios-gate.js, bin/gate-lib.js
      commit: — · cli-schema-tag-parity: Task 3 Step 1 — loud dispatch [x]

## Task 4 — Per-step approve on gated schemas

> Spec: cli-schema-tag-parity

- [ ] Step 1 — Bare `approve <slug>` refuses on gated schemas (usage names verbs + `grant <slug> <step>`); `approve <slug> <step-id>` = single-step grant; ungated schemas unchanged
      start: — · elapsed: — · check: ruling behavior pinned; ungated legacy test green
      paths: bin/pios-gate.js
      commit: — · cli-schema-tag-parity: Task 4 Step 1 — per-step approve [x]

## Task 5 — Pins: symptoms, fail-open regression, parity assertions

> Spec: cli-schema-tag-parity

- [ ] Step 1 — Symptom trio on a spec-schema fixture in a temp repo (verb grants; `grant` single-step; bare approve refuses) + fail-open regression (a parse gap can never yield a whole-change stamp) + parity: bin-parse ≡ src-parse over `spec` and `mission`
      start: — · elapsed: — · check: all pins green
      paths: test/pios-wrapper.test.ts, test/schema.test.ts
      commit: — · cli-schema-tag-parity: Task 5 Step 1 — pins and parity [x]

## Task 6 — Full suite green

> Spec: cli-schema-tag-parity

- [ ] Step 1 — `npm test` — every test green, no skips; `./bin/pios-gate inspect gate-spanned-agents` unchanged-truthful
      start: — · elapsed: — · check: exit 0
      paths: —
      commit: — · cli-schema-tag-parity: Task 6 Step 1 — suite green [x]

## Task 7 — Human validation — the healed walk

> Spec: cli-schema-tag-parity

- [ ] Human validation — the live proof of the claim: `pios-gate propose gate-spanned-agents` in your terminal — the exact command that opened this saga — stamps exactly the idea step; `inspect` shows it granted; `pending` tells the truth
      response: — · outcome: — · at: —
