# Mission protocol — the openspec ladder manual

This is the manual for `pi-openspec-gate` and the `mission` schema. The
gate enforces; this page explains. Both ship in the same package, versioned
together — the teaching can never drift from the teeth.

## The bridge, both directions

A mission is the bridge between human and AI. Approvals flow **down** rung
by rung (grants, guardrails, validation); evidence flows **up** inside every
rung (claims, criteria, methods, receipts). Neither side carries the bridge
alone.

## The five rungs

| rung | file | lane | carries |
|---|---|---|---|
| idea | `1-idea.md` | AI→H | why: observed pain, chosen direction, hard limits — free, never gated |
| proposition | `2-proposition.md` | AI commits | `Claim:` one testable, falsifiable sentence |
| proposal | `3-proposal.md` | the deal | protocol lines (Estimate · Evidence · Human wait · Parent) + Done when · Scope · Out of Scope · Guardrails |
| plan | `4-plan.md` | the method | Skills (first — declared knowledge, or `bare — <reason>`) · Workflow · Steps · Verification · History |
| execution | `5-execution.md` | the ledger | Task H2s, checkbox steps with receipts, the final Human-validation checkbox |

The claim born at rung 2 is judged by rung 5's last checkbox.

## Grants (human terminal only)

```
pios-gate propose <slug>   # read the idea      → the claim may draft
pios-gate deal <slug>      # read the claim     → the contract may draft
pios-gate plan <slug>      # read the contract  → the method may draft
pios-gate order <slug>     # read the method    → the work order may draft
pios-gate execute <slug>   # read the work order → work begins (ladder complete)
pios-gate approve <slug> [rung]   # canonical / big-bang
pios-gate confirm <slug>   # permits the Human-validation flip (or reply: VALID)
pios-gate pending          # the cockpit — every mission, next acts
pios-gate inspect <slug>   # one mission, verbose
```

Rules: strictly next-rung-only, never a skip; you approve what you read
(undrafted rungs refuse); declared structure must be present before a stamp
(the grant itself refuses). Granting the last rung writes `status: approved`
and source work attributes to the mission with receipts.

## The schema declares, the gate enforces

`x-requires-approval`, `x-sections`, `x-lines` in `schema.yaml` are the
gate's tags. openspec strips them silently; the gate validates them loudly.
A schema without tags gets no phase gates (legacy single-approve behavior).

## The law (never permission, never a renderer)

- when a mission is created or becomes the work: set the cockpit —
  openspec_focus names the change, subject mirrors its title; the footer
  row is the human's glance at the bridge

- every mutation: exempt-recorded · attributed · declared · blocked
- unknown tool = mutating (fail-safe); bash is never path-exempt
- the assistant may NEVER invoke approve/confirm/grant verbs — approval-touch
  blocks, correctly
- Human-validation checkboxes are the human's verdict — never tick them
- memory tools are instruments: ungated, recorded, never blocked
- declaration latch: the human's literal "action the mission" /
  "execute the mission" ("…the job", "do it" legacy) carries one mutation
- facts, not prose: every gate event is a `pi-openspec-gate.*.v1` entry
