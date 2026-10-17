# Execution: Ungate the cockpit focus instruments

> Parent plan: this change · Estimate: ~30m

## Steps

1. Config: parse accountingTools (frozen string list); absent = none
2. Gate: allowlisted tool names pass with an instrument fact, before any
   classification
3. Tests: allowlisted passes + unknown still blocks + back-compat config +
   repo-config integration
4. Suite + vocabulary sweep + jiti smoke load + commit; live proof lands in
   the human happy-path session (the focus tools finally breathe)

## Verification

- Deterministic: instrument fact shape, fail-safe intact, back-compat
- Human: interactive session — set work focus, watch it pass recorded,
  then mutations attribute under the focused change (first live attribute
  and inherit legs)

## Safety

- Accounting only: the list names instruments, never grants file writes
- Entry-store tools only; anything touching files stays fully gated
