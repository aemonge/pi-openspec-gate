# Gate law — the openspec declared-work manual

This is the manual for `pi-openspec-gate` and the schemas it enforces.
The gate enforces; this page explains. Both ship in the same package,
versioned together — the teaching can never drift from the teeth.

## The bridge, both directions

A change is the bridge between human and AI. Approvals flow **down**
rung by rung (grants, guardrails, validation); evidence flows **up**
inside every rung (claims, criteria, methods, receipts). Neither side
carries the bridge alone.

## The engine owns mechanism; the schema owns every step

No rung count, verb, filename, verdict line, unlock point, or ladder
length lives in the engine. A schema declares them all:

| tag | declares | when absent |
|---|---|---|
| `x-requires-approval` | which grants precede this rung's drafting | no phase gates (legacy single-approve) |
| `x-sections` / `x-lines` | structure a rung may not be born without | nothing enforced |
| rich `x-sections` entries + `x-requires-written` / `x-requires-approval` | gates between a rung's own sections (one level) | sections are structure only |
| `x-grant-verb` | the human's terminal alias for granting this rung | id-addressed grants only |
| `x-verdict-line` | the checkbox line only a human may tick | no verdict guard |
| `x-receives-receipts` | where attribution receipts land | the completing rung's artifact |
| `x-completes` | the status stamp when the ladder completes | `approved` |
| `x-unlocks-source` | the grant that begins source work | ladder completion unlocks |

openspec strips unknown x- fields silently; the gate validates them
loudly — a typo is a block reason, never a silent no-op. Research that
must write becomes its own artifact on the ladder, read downstream;
nothing leaves the ladder for scratch space.

## Grants (human terminal only)

```
pios-gate grant <slug> <artifact-id>   # canonical — id or artifact/section
pios-gate approve <slug> [rung]        # alias; no rung = big-bang
pios-gate <verb> <slug>                # a verb the schema declares
pios-gate confirm <slug>               # permits the declared verdict flip (or reply: VALID)
pios-gate pending                      # the cockpit — every change, next acts
pios-gate inspect <slug>               # one change, verbose
```

Rules: strictly next-rung-only, never a skip; you approve what you read
(undrafted rungs refuse); declared structure must be present before a
stamp; a rung with gated sections refuses until its sections are
sub-granted (`grant <slug> artifact/section`).

## The shipped example: `mission`

The package ships the `mission` schema — idea → proposition → proposal
→ plan → execution — with its verbs, verdict line, receipt target,
completion stamp, and source unlock all declared in
`schemas/mission/schema.yaml`. Read it as the worked example; write your
own ladder the same way.

## The law (never permission, never a renderer)

- when a change is created or becomes the work: set the cockpit —
  openspec_focus names the change, subject mirrors its title
- every mutation: exempt-recorded · attributed · declared · blocked
- unknown tool = mutating (fail-safe); bash is never path-exempt
- the assistant may NEVER invoke the grant surface — approve, confirm,
  grant, or any verb the schemas declare; approval-touch blocks,
  correctly
- the declared verdict line is the human's verdict — never tick it
- memory tools are instruments: ungated, recorded, never blocked
- declaration latch: the human's literal "action the mission" /
  "execute the mission" ("…the job", "do it" legacy) carries one
  mutation
- facts, not prose: every gate event is a `pi-openspec-gate.*.v1` entry
