# Idea: memory instruments — session memory is never gated

> Parent idea: none

As a human owner of the session memory I need every memory write to pass
the gate ungated while still being recorded, so that capture never
silently disappears behind a block.

Today every Engram write verb — mem_save, mem_update, mem_delete,
mem_save_prompt, mem_session_summary, mem_session_end, mem_capture_passive
— is an unknown tool, and unknown is mutating by fail-safe, so whenever no
change is focused the write blocks. The worst part is silent: the
lifecycle verbs fire automatically at session end and passive-capture
moments, so blocked calls eat memory without anyone ever seeing a block.
A path exemption cannot fix this — memory tools carry no file paths, and
Engram writes `.engram/` behind the tool boundary — and the class is wrong
anyway: memory is bookkeeping about the work, not work on the product.

The direction: memory writes are instruments, like the cockpit's focus and
stage tools. The seven write verbs join `accountingTools`; every call
passes ungated and lands as an instrument fact — visible in the ledger,
never a block, never a receipt (memory is the ledger's sibling, not its
payload). Memory reads are already known read-only and stay as they are.
Hard limits: config and tests only — no classifier change (the fail-safe
stays untouched for genuinely unknown tools), no schema change, and
"never gated" stays literal: no focus, declaration, or approval may ever
be required to remember.
