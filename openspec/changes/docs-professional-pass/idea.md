# Idea: Docs that carry their own weight

A package at 0.3.1 with five archived changes, real approval teeth, and a
CLI surface reads as a private experiment when its front door is a README
that never mentions how to install the CLI or what changed between
versions. Today's install archaeology (drift, ghost prefix, symlink farm,
node's type-stripping wall) happened partly because the docs described a
reality the package had outgrown. Professional is not decoration: it is
the docs assuming what the package now is.

## Direction

CHANGELOG.md as the human-readable front door to the archive (the archive
stays the source of truth; every entry cites its change dir), a README
Development section that teaches the ladder and the just targets in sixty
seconds, and the CLI visible from the intro. Ship CHANGELOG.md in the
tarball so installed copies carry their own history.

## Constraints

Docs and one package.json files-array entry only. No source, no tests, no
GitHub metadata. The archive is never rewritten to fit the changelog.

## Children

This change — self-parented ramona-plan (human directive 2026-10-19).
