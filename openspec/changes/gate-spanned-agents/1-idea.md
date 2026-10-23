# Idea: The gate must ride spanned agents — npm:pi-subagents included

## Pain

The gate's law ends at the session boundary. A `subagent` launch hands work to a child that may never load pi-openspec-gate, and pi-subagents' two enforcement seams — `registerRequiredChildExtensions` (fail-closed admission: any launch that cannot load the extension fails) and `registerSubagentCapabilityCeiling` (restricting allowedAgents/allowedTools) — are claimed by no installed gate package. Non-native runner types such as npm:pi-subagents therefore spawn ungated in the default path, and no denyExtensions ceiling from any other extension masks this. The four gaps stay open not because something suppresses the gates, but because the seams are simply unclaimed — nothing fails closed.

## Questions

- Which seam claims enforcement first: required child extensions (fail closed at admission) or the capability ceiling (deny ungated runner types) — and which of the two is the correct home for gating npm:pi-subagents itself?
- Is the launch act itself a gated mutation in the parent session (attribution to a focused change), beyond whatever the child inherits?
- What exactly does a child inherit — the change focus, the debt latch, or only the gate extension — and where do child receipts land?
- When a runner cannot load the extension (external CLI profile, remote machine), does the launch block, or proceed as visible declared debt?
- What must the gate do when pi-subagents is absent or older than these seams — degrade to recording launches, or refuse spawning entirely?
- Which tests pin each gap closed (admission failure for ungated runners, ceiling enforcement, the npm:pi-subagents case)?
