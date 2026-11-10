# Brainstorm

> Spec: go-walk · consult `openspec/learnings/` before drafting

## Pain

The gate's vocabulary makes the human carry grammar the echo already speaks. A full walk demands four schema-declared verbs (`open`, `dig`, `commit`, `build`) plus the slug on every command — and humans guess: one lab agent already misnamed a rung's act ("grant dig" for brainstorm), and Ramona pressed `next` twice against undrafted artifacts asking why nothing happened. The human's hands want two words: aim once, then advance — `pios-gate <slug>` and `pios-gate go` — with `list` for the cockpit and `confirm` kept full-word at the verdict boundary. Declared verbs are ceremony without payload now that the teaching echo names each act better than the input ever did.

## Questions

- What is the resolution rule for a bare one-arg call (`gate verbs → declared verbs → existing change name → passthrough verbatim`), and once declared verbs die, does it collapse to three tiers cleanly?
- Where does terminal focus live (openspec-root state file?), when does it die (archive?), and how do terminal focus and session focus render side by side without merging the two authorities?
- What is `go`'s full state ladder — stamp / refuse-undrafted / refuse-unverified / archive-only-after-confirm — and which refusals keep the verdict wall intact?
- Does `list` replace `pending` as the cockpit (with `pending` kept as alias), and what happens to openspec's own `list` passthrough?
- What is the removal contract for `x-grant` in schemas already in the wild — silent ignore, or loud error — and what exactly dies with the verbs (vocabulary map, `grantHint`, verb-shadow checks, tests, RESERVED_WORDS)?

## Direction

One mutable hunch: `go`/`focus`/`list` are thin aliases over the existing law — nothing about checks, stamps, or human-terminal enforcement changes; the verbs die by silent ignore (old schemas never break); and the echo remains the only teacher the human needs. The walk's whole vocabulary: `<slug>`, `go`, `list`, `confirm`.
