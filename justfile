# pi-openspec-gate gates and release.

# Static gate: the vocabulary law (permission words are forbidden here).
lint:
    @! grep -riE 'waiver|sanitiz|trust' src/ test/ config.json index.ts
    @echo "vocabulary law holds"

# Full test suite.
test:
    npm test

# Packed-artifact gates: real-loader smoke + pack contents.
build:
    pi -p -a 'Reply with exactly: ALIVE'
    npm pack --dry-run

# Full release: gates, then bump+commit+tag, publish, install, confirm.
publish VERSION: lint test build
    @v=$(node -p 'require("./package.json").version'); \
     if [ "$v" = "{{VERSION}}" ]; then echo "already at {{VERSION}}, resuming"; \
     else npm version {{VERSION}} --message 'chore(release): v%s'; fi
    npm publish --access public
    npm install -g @aemonge-dev/pi-openspec-gate@{{VERSION}}
    pi list
