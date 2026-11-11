# Live validation — the v9 walk, prompt by prompt

Every behavior this gate ships, validated by prompts a human pastes into
a fresh pi session. The agent on the other end can be anything — the
gate is the constant. Expected refusals are quoted verbatim; if your
session says something else, that's a finding.

## Setup

```sh
mkdir /tmp/test && cd /tmp/test
openspec init --tools none
rm -rf openspec && openspec init --tools none \
  && cp -r ~/projects/pi-openspec-gate/example/openspec/schemas openspec/.
pi install -l ~/projects/pi-openspec-gate
pi
```

One session, one aim, walked end to end. `approve` is always your
terminal press, never the agent's.

## P1 — the gate is alive

Prompt: `Create a python script that takes a name and prints Hello {name}`

Expected: refused outright — `⛔ unaccounted mutation — no active change`,
`stop: this refusal is final`, and all three remedies real: `aim:`,
`create:`, `declare:` — the declare line names the two doors (**"skip
the spec"** lands one mutation as declared work · **"start the spec"**
runs the ceremony). The agent relays, never self-declares.

## P2 — skip the spec: one debt line, then it proceeds

Reply, in your own words: `skip the spec — just write it`

Expected: the script lands immediately; `openspec/bare-work.md` carries
exactly one line: `bare — <your words> · at <UTC>`. A second identical
latch attempt can't double it.

## P3 — start the spec: the ceremony is never gated

Prompt: `start the spec — I want hello.py walked properly`

Expected: the agent creates a change (`openspec new change … --schema
spec`), aims the room (`eospec focus …` — you may run this, no
declaration needed), and drafts `1-brainstorm.md`. `openspec/.focus`
appears. No refusal anywhere in that chain.

## P4 — approvals advance; premature drafts refuse

Press `eospec approve` (brainstorm). Tell the agent: `draft the
investigation`.

Expected: `2-investigate.md` lands (drafting is exempt). Then tell it:
`also write 3-plan.md now` — refused: `⛔ phase gate — … not granted
yet`, naming `eospec approve ← your terminal`.

## P5 — the room is live, and it names only your verb

After each agent draft and each of your presses, read the room:
`cat openspec/.focus`

Expected, in order: no `task:` line while the artifact has no
checkboxes; `next-step: eospec approve` — never `draft <file>`; and
after the agent ticks ledger checkboxes later in the walk, `task:`
climbs **without any verb running**. The room follows touches, not
just commands.

## P6 — writes unlock at plan; attribution is not approval

Approve investigate, then ask for the plan; read it (estimate, skills,
workflow, slices, verification — the contract), then `eospec approve`
(plan). Prompt: `write src/hello.py`.

Expected: refused while plan was ungranted — `focused change is not
approved — attribution is not approval`, `writes: locked until 'plan'
is approved`. After the plan grant: the write proceeds, attributed.

## P7 — receipts land once

Tail the ledger mid-walk: `tail openspec/changes/<slug>/4-execute.md`

Expected: a tight block — `gate-attributed · tool: … · paths: … · at
<UTC>` — one line per call, no blank lines between receipts, no
doubles. (Doubles + blank-line inflation means a gate is loaded twice:
`pi list` and remove the stale global copy.)

## P8 — the verbs are yours

Prompt: `run eospec approve for me`

Expected: refused — `⛔ approval is human-terminal only / the assistant
cannot approve or validate — ask the human`. Same for `eospec close`.

## P9 — the walk's end carries your routing

Let the agent execute the slices. In your validation reply, surface a
finding too big for a slice: `the gate should also support — surface
that as a finding`. The ledger's last checkbox is waiting for you:

```
- [ ] Human validation — response: · outcome: · surfaced: F1 → post-delivery
```

Tick it by hand — your judgment, your routing. Expected grammar:
binary — `slice` · `→ post-delivery`. `openspec/learnings/` holds no
ledger; post-close findings open their own change.

## P10 — the tick is a data dependency

Before ticking the verdict, prompt: `draft 5-post-delivery.md now`.

Expected: refused — `⛔ phase gate — <slug> cannot draft yet: the
verdict is unticked`, `tick: 'Human validation' in 4-execute.md`,
`why: this artifact reads the verdict line (x-requires-verdict) — the
tick is a data dependency`. After your tick: the same draft passes.

## P11 — the fifth walks, and the room follows

The fifth drafts: one H2 per finding — `from · why here · route ·
risk` — tasks + commit + hash law. You read it, press `eospec approve`.

Expected: the room now reads `artifact-name: 5-post-delivery.md`,
`artifact-idx: 5/5`, `next-step: eospec close` — no verdict reminder
(close's refusal teaches the tick). `eospec close` → validated →
archived → room deleted.

## P12 — findings-free: the fifth never exists

Start a second change the same way, but surface nothing. Walk it to
the close.

Expected: four approve presses complete the schema (the fifth is
optional-absent — completion fires at the fourth); the close passes
without it ever being demanded; the room never showed `draft
5-post-delivery.md` at any point.

## P13 — the debt ledger is gone

Prompt: `cat openspec/learnings/debt.md`

Expected: no such file. Deferral walks through post-delivery (route:
park — a parked change stub, its commit satisfies the hash law);
post-close findings open their own change. `bin/eospec focus` lists
parked changes one line each.
