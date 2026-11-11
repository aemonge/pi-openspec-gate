# Brainstorm

> Spec: post-archive-commit-gap · consult `openspec/learnings/` before drafting

## Pain

After `openspec archive` moved a change, the session focus dangled on the moved
change (mutations refused: no active change); re-aiming focus made the archival
commit hit the approval teeth (focused, writes locked). The archival commit
therefore always lands on the human's terminal. Also unverified: whether
bash-extracted relative paths (e.g. `git add openspec/changes/`) match the
`**/openspec/**` exemption at all. Surfaced 2026-11-04; graduated from the
debt ledger when debt died (post-delivery, 2026-11-11).

## Questions

- Where should the post-archive commit legally land — an unlocked window after
  archive, or an explicit human step?
- Do bash-extracted relative paths ever hit the exemption, and should they?
