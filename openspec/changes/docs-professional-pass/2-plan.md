# Plan: A professional front door

> Estimate: 30–45 min · high confidence
> Evidence: today's install confusion cost hours — the docs assume what the
> afternoon taught; a package at 0.3.1 with five archived changes and no
> changelog reads as a private experiment.
> Parent idea: none (human directive: "do all the docs and things to make
> this super professional", 2026-10-19)
> Human wait: approve; validate the rendered README + CHANGELOG read.

## Acceptance

- `CHANGELOG.md` at repo root: every published version (0.1.0 → 0.3.1) with
  date, one-paragraph highlights, and links to the archived changes that
  produced it — the archive stays the source of truth; the changelog is its
  human-readable front door. Unreleased section notes the
  focus-inheritance live proof as the one open receipt.
- README gains a **Development** section: `just lint` / `just test` /
  `just build` / `just publish <version>`, the ladder in one sentence
  (idea → approve → focus → attribute → validate → archive), and where the
  ledger lives (`openspec/changes/archive/`).
- README top matter polished: one-line CLI mention in the intro so the
  terminal surface is visible before the approval section.
- No source changes; suite + lint green (docs-only, but proven).
- package.json `files` gains CHANGELOG.md (ships in the tarball).

## Scope

- `README.md`, `CHANGELOG.md`, `package.json` (files array only).

## Exclusions

- No CONTRIBUTING.md (README Development section covers it at this size).
- No GitHub metadata changes (topics/description — the human's web UI act).
- No source, bin, or test changes.
