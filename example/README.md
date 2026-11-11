# The example — a strong starting point for testing the gate

A self-contained, self-verifying walkthrough of eospec, built on the
**v5 `spec` schema** — four steps, strictness at the two boundaries
humans own (spend at plan, judge at the verdict). The walk is three
words: aim once (`eospec focus lab-run`), `eospec approve` at each step,
`eospec close` after your verdict:

| # | artifact | gates declared |
|---|---|---|
| 1 | `1-brainstorm.md` | `x-sections: [Pain, Questions]` — drafts free, first approval |
| 2 | `2-investigate.md` | requires `brainstorm` · `x-unlocks: [research]` — **no structure: the journal is free** |
| 3 | `3-plan.md` | requires `investigate` · `x-unlocks: [writes]` — **the docs→code boundary** · six declared sections |
| 4 | `4-execute.md` | requires `plan` · `x-receives-receipts` · `x-completes: approved` · `x-verdict-line: Human validation` — no fixed sections |

Plus schema-level `x-declares: [start the spec, skip the spec]` — two
doors: "start the spec" runs the ceremony; "skip the spec" lands one
mutation as declared work.

**The research window**: with a change aimed on this schema, research
instruments (web/docs tools, and bash verbs named in config — `graphify`
by default here) block until the investigate step is approved; research
with no aimed change blocks too inside any repo with a local
`openspec/` — the same state-aware remedies (focus → create → declare) —
because void research is unaccounted work. **The ledger anatomy** (in
the templates, ungated): per-Slice checkpoint checkboxes with timing
slots → a Commit checkbox whose `hash:` slot is the receipt (a tick
without a hash is not done) → one final, flip-guarded Human validation
carrying `surfaced:` routing to `openspec/learnings/debt.md`. Learnings
live OUTSIDE the flow — topic-keyed files every step reads, any change
may append.

## Run it (nothing in this directory is modified)

```sh
./example/try.sh          # from the repo/package root — or: just try
```

The script builds a scratch repo, runs the **refusals first** (an
undrafted-approval refusal, a structure refusal, the verdict wall), then
walks the full lifecycle — aim once, four `approve` presses — to
`status: approved`, and the close to validated + archived — asserting
every step. Exit 0 = the gate works.

## Use it in your own repo

```sh
cp -r example/openspec/schemas/spec  your-repo/openspec/schemas/spec
mkdir -p your-repo/openspec/changes
printf 'schema: spec\nx-status: proposed\n' > your-repo/openspec/changes/my-change/.openspec.yaml
```

Schemas resolve project-local first (`<repo>/openspec/schemas/`), then
openspec's global home (`~/.local/share/openspec/schemas/`), then
`~/.config/openspec/schemas/` — so if the schema already lives in your
global home, the copy step is optional. Dependencies must point to
earlier artifacts (declaration sequence is approval sequence); self- or
forward-references fail loudly at parse.

## Test the watcher live (the tool-call gate)

The walkthrough above exercises the terminal CLI. The session gate is
the other half:

```sh
cd your-repo
pi install -l /path/to/eospec    # local, unreleased tree
pi                               # start a session
```

In-session checklist:

1. `write src/anything.ts` with no aim → refused with all three remedies
2. Say a phrase the schema `x-declares` — **"start the spec"** runs the
   ceremony (create, aim, draft — never gated); **"skip the spec"**
   lands exactly one mutation as declared work (human words only) → one
   debt line in `openspec/bare-work.md`
3. Aim your change (`eospec focus my-change`) → mutations attributed;
   receipts land in the `x-receives-receipts` artifact while work runs
4. Try `bash: eospec approve` → **refused** — approval is human-terminal,
   stamps are yours
5. Create `2-investigate.md` while `brainstorm` is unapproved →
   phase-gate block naming the exact terminal command; approve it in your
   terminal, watch the same call pass
