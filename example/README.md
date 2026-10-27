# The example — a strong starting point for testing the gate

A self-contained, self-verifying walkthrough of `pi-openspec-gate`, built
on the **v4 `spec` schema** — four steps, strictness at the two
boundaries humans own (spend at Plan, judge at the verdict):

| # | artifact | verb (`x-grant`) | gates declared |
|---|---|---|---|
| 1 | `1-brainstorm.md` | `open` | `x-sections: [Pain, Questions]` — drafts free, first grant |
| 2 | `2-investigate.md` | `dig` | requires `brainstorm` · `x-unlocks: [research]` — **no structure: the journal is free** |
| 3 | `3-plan.md` | `commit` | requires `investigate` · `x-unlocks: [writes]` — **the docs→code boundary** · six declared sections |
| 4 | `4-execute.md` | `build` | requires `plan` · `x-receives-receipts` · `x-completes: approved` · `x-verdict-line: Human validation` — no fixed sections |

Plus schema-level `x-declares: [action the spec, execute the spec]`.

**The research window**: with a change focused on this schema, research
instruments (web/docs tools, and bash verbs named in config — `graphify`
by default here) block until `dig` is granted; research without a focused
change stays free. **The ledger anatomy** (in the templates, ungated):
per-Slice checkpoint checkboxes with timing slots → a Commit checkbox
whose `hash:` slot is the receipt (a tick without a hash is not done) →
one final, flip-guarded Human validation carrying `surfaced:` routing
to `openspec/learnings/debt.md`. Learnings live OUTSIDE the flow —
topic-keyed files every step reads, any change may append.

## Run it (nothing in this directory is modified)

```sh
./example/try.sh          # from the repo/package root — or: just try
```

The script builds a scratch repo, runs the **negatives first** (grant
sequence, approve-what-you-read, structure refusal), then walks the full
seven-grant lifecycle to `status: approved` and `ready to archive?` —
asserting every step. Exit 0 = the gate works.

## Use it in your own repo

```sh
cp -r example/openspec/schemas/spec  your-repo/openspec/schemas/spec
mkdir -p your-repo/openspec/changes
printf 'schema: spec\nstatus: proposed\n' > your-repo/openspec/changes/my-change/.openspec.yaml
```

Schemas resolve project-local first (`<repo>/openspec/schemas/`), then
openspec's global home (`~/.local/share/openspec/schemas/`), then
`~/.config/openspec/schemas/` — so if the schema already lives in your
global home, the copy step is optional. Dependencies must point to
earlier artifacts (declaration sequence is grant sequence); self- or
forward-references fail loudly at parse.

## Test the extension side live (the tool-call gate)

The walkthrough above exercises the terminal CLI. The session gate is
the other half:

```sh
cd your-repo
pi install -l /path/to/pi-openspec-gate    # local, unreleased tree
pi                                        # start a session
```

In-session checklist:

1. `write src/anything.ts` with no focus → blocked with all three remedies
2. Say a phrase the schema `x-declares` (the example schema: **"action the
   spec"** / **"execute the spec"** — human words only) → exactly one
   mutation proceeds, one debt line in `openspec/bare-work.md`
3. Set the focus (`openspec_focus`) on your change → mutations attributed;
   receipts land in the `x-receives-receipts` artifact when declared
4. Try `bash: pios-gate propose my-change` → **approval-touch blocked** —
   every declared verb joins the guarded surface, grants are yours
5. Create `2-drafted-requirements.md` while `idea` is ungranted →
   phase-gate block naming the exact terminal command; grant it in your
   terminal, watch the same call pass

The full harness proof is `npm test` — it drives the real gate handler
against this schema, the shipped schemas, and the CLI end to end.
