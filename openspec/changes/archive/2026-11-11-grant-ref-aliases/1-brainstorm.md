# Brainstorm

> Spec: grant-ref-aliases · consult `openspec/learnings/` before drafting

## Pain

The cockpit prints artifacts as numbered rows with numbered files — `2 investigate 2-investigate.md` — but `pios-gate grant` accepts only the declared word id. A human reads the inspect table, types `2` or `2-investigate`, and is told `no artifact '2' in schema spec`: the front door rejects the very names it displays. Live-caught 2026-11-10 on change `fix-vpn-dns-mullvad-mesh` (three attempts, one per form).

## Questions

- Should a grant ref resolve what inspect shows — row number, generated filename (stem or with extension) — and the section path's artifact half too?
- Where does canonicalization belong so meta stamps (`granted_investigate`, `granted: idea,proposition`) stay word-id-shaped whatever the human typed?
- Which wording must change (usage line, help block, doc comment) so the ref grammar is stated once, honestly?

<!-- Direction (optional, free): one resolver, `artifactForRef(schema, ref)`, canonicalizing at the top of `grantArtifact`; CLI-only, so the src/schema.ts mirror is untouched. -->
