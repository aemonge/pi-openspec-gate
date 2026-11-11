# Investigate

> Spec: post-delivery · aim at the Brainstorm's Questions

## Findings

- **Completion is already position-independent** — `grantArtifact`
  stamps completion when *every* schema artifact is granted
  (`allArtifactsGranted`, bin/gate-lib.js:508, used at :616);
  `x-completes: approved` on execute only names the stamped status
  (:618-620). A fifth artifact needs no `x-completes` move: approving
  execute simply stops completing until the fifth is granted too. The
  strict-walk question reduces to the requires chain — the fifth
  mirrors execute's pair (`requires: [execute]` +
  `x-requires-approval: [execute]`), pure schema data.
- **The verdict stays where it is** — `schemaVerdictLine` reads
  whichever artifact carries `x-verdict-line` (:520-523); close's tick
  check reads the receipt bearer (bin/eospec.js:190-199). Keeping it on
  execute means the human judges the delivery before any post-delivery
  work — the brainstorm's strict leaning, no engine.
- **The name/idx mismatch is real** — the all-granted room branch prints
  `artifact-name` from the receipt bearer but `artifact-idx` from
  `length/length` (bin/gate-lib.js:125-128): with five artifacts the
  room would say `4-execute.md` beside `5/5`. The name should follow the
  walk (the last artifact), not the receipts.
- **Exactly one receipt bearer exists** — `receiptArtifactFor` returns
  the first `x-receives-receipts` (:516-518); the room's task counter
  reads the current artifact file (:107 taskProgress) while
  pendingReport's open-counter and unhashed-commit scan read the bearer
  (:650-661). The fifth's work rides the same law: its commits are
  hash-checked wherever they are ticked; receipts landing in execute
  post-approval stay consistent (the ledger is the change's receipt
  stream). A second receiver would be new engine surface with no
  visible need yet.
- **The room law is two functions** — `renderRoom` + `writeFocus`
  (bin/gate-lib.js:106-162) own every field the human ruled on: the
  `draft <file>` rule (:139-144), the `task ''` fallback (:155-156),
  the verdict reminder (:131). No other reader of those fields exists —
  `readRoomFocus` greps only `change:` (src/focus.ts:69-80). The CLI
  echo (`pendingAct`, `completionLine`, actHint) is separate and keeps
  teaching: it is how the human hears *why* close refused.
- **Conditional legality has a three-site shape** — an optional
  artifact that blocks only when its file exists is one predicate in
  three places: `allArtifactsGranted` (:508-510), renderRoom's
  pending-find (:120), close's ungranted filter (bin/eospec.js:183-188).
  The parser reads x- keys explicitly (bin/gate-lib.js:~175
  SECTION_KEYS), so `x-optional` needs its own parse line — schema
  declares, engine enforces, nothing hardcoded.
- **Parity and the example learn the fifth step together** — try.sh
  narrates the four-step lifecycle (example/try.sh:3-5, states 1-6) and
  the shipped example schema is a full copy
  (example/openspec/schemas/spec); parity-lint scans try.sh verbs and
  source teaching strings (tools/parity-lint.mjs) — no new verbs, but
  the walk line, the README room example, and the example copy all move
  in the same slice, or none of this ships (the direction's own law).

## Options

- **When the fifth may draft**: after the verdict
  (`x-requires-approval: [execute]` — nothing post-delivery before the
  human judged delivery) versus after execute's grant but before the
  verdict (findings are freshest at append time; the human would start
  designing before judging). The strict-walk leaning in the brainstorm
  favors verdict-first; the choice is one yaml line.
- **The slices boundary wording**: an *adding* is traceable to a
  surfaced fact and lands as an execute slice under the mirror law; a
  *follow-up* needs its own design — risk, route, verification — that
  the plan never named. One sentence in the fifth's template
  instruction carries the line; who draws it stays the human at
  validation (the verdict's `surfaced:` already routes the small ones).
- **The two-lifecycle split**: complement, not replace — debt.md stays
  the post-close home and its own promotion rule (graduate to a named
  change); the fifth takes pre-close findings too big for slices. The
  verdict's `surfaced:` routing is unchanged.
- **Receipts during the fifth's work**: keep the single bearer
  (receipts append to execute — the change's receipt stream) versus
  second-receiver support (engine work, no demonstrated need).

## Alternatives

- **A — optional-when-empty**: `x-optional: true` on the fifth; grant,
  room, and close skip it while no file exists, and it blocks hard the
  moment findings surface (file on disk = the walk demands it).
  · Trade-off: three engine sites learn one predicate plus one parse
  line; the empty case closes cleanly with no stub.
  · Pick-when: the room must never demand work that doesn't exist —
  the human's room-law ruling points here.
- **B — always-drafted fifth**: the artifact drafts every change, even
  as two lines (`no findings — nothing post-delivery`), and approve
  walks it like any step.
  · Trade-off: zero engine surgery, but a ceremony tax on every
  findingless change — an empty artifact demanded forever.
  · Pick-when: engine simplicity outranks the empty-case tax.
