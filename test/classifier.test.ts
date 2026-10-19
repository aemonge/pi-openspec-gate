import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifyMutation } from '../src/classifier.ts';

test('annotations: readOnlyHint true is not mutating', () => {
  const verdict = classifyMutation('mcp__x__query', { q: 'SELECT 1' }, { readOnlyHint: true });
  assert.equal(verdict.mutating, false);
  assert.equal(verdict.basis, 'annotations.readOnlyHint');
});

test('known read-only tools pass', () => {
  for (const tool of ['read', 'grep', 'find', 'ls']) {
    const verdict = classifyMutation(tool, {});
    assert.equal(verdict.mutating, false, tool);
  }
});

test('edit and write are mutating', () => {
  assert.equal(classifyMutation('edit', { path: '/a' }).mutating, true);
  assert.equal(classifyMutation('write', { path: '/a' }).mutating, true);
});

test('bash write redirect mutates', () => {
  const verdict = classifyMutation('bash', { command: 'echo hi > out.txt' });
  assert.equal(verdict.mutating, true);
  assert.equal(verdict.basis, 'bash.write-redirect-or-inplace');
});

test('bash git commit mutates', () => {
  assert.equal(classifyMutation('bash', { command: 'git commit -m x' }).mutating, true);
});

test('bash read-only verbs pass', () => {
  for (const command of ['pwd', 'ls -la', 'cat a.txt', 'git status', 'openspec list --json']) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, false, command);
  }
});

test('bash unknown verb is mutating (fail-safe)', () => {
  const verdict = classifyMutation('bash', { command: 'frobnicate --widget x' });
  assert.equal(verdict.mutating, true);
  assert.equal(verdict.basis, 'bash.unknown=fail-safe');
});

test('unknown tool is mutating (fail-safe)', () => {
  const verdict = classifyMutation('subagent', { calls: [] });
  assert.equal(verdict.mutating, true);
  assert.match(verdict.basis, /tool\.unknown=fail-safe/);
});

test('openspec creation is never gated', () => {
  const verdict = classifyMutation('bash', { command: 'openspec new change my-slice --schema ramona-plan' });
  assert.equal(verdict.mutating, false);
  assert.equal(verdict.creation, true);
});

test('openspec archive is a mutation', () => {
  assert.equal(classifyMutation('bash', { command: 'openspec archive my-change' }).mutating, true);
});

test('bash with empty command is mutating (fail-safe)', () => {
  const verdict = classifyMutation('bash', {});
  assert.equal(verdict.mutating, true);
});

test('research instruments pass without focus', () => {
  for (const tool of [
    'web_explore',
    'web_search',
    'web_fetch',
    'resolve-library-id',
    'query-docs',
    'lsp_diagnostics',
    'mem_search',
    'mem_context',
    'mem_get_observation',
    'mem_timeline',
    'mem_stats',
    'mem_list_projects',
    'mem_current_project',
    'mem_doctor',
    'mem_review',
  ]) {
    const verdict = classifyMutation(tool, {});
    assert.equal(verdict.mutating, false, tool);
    assert.equal(verdict.basis, 'tool.known-read-only', tool);
  }
});

test('memory writes stay fail-safe mutating', () => {
  for (const tool of ['mem_save', 'mem_update', 'mem_delete', 'mem_save_prompt']) {
    const verdict = classifyMutation(tool, {});
    assert.equal(verdict.mutating, true, tool);
    assert.match(verdict.basis, /tool\.unknown=fail-safe/, tool);
  }
});

test('lsp_fix is input-aware: preview passes, write mutates', () => {
  assert.equal(classifyMutation('lsp_fix', {}).mutating, false);
  assert.equal(classifyMutation('lsp_fix', { write: false }).mutating, false);
  assert.equal(classifyMutation('lsp_fix', { path: '/a' }).basis, 'tool.lsp-fix-preview');
  const written = classifyMutation('lsp_fix', { path: '/a', write: true });
  assert.equal(written.mutating, true);
  assert.equal(written.basis, 'tool.lsp-fix-write');
});

test('config readOnlyTools override passes (merged over built-ins)', () => {
  const extra = new Set(['my_probe']);
  const verdict = classifyMutation('my_probe', {}, undefined, extra);
  assert.equal(verdict.mutating, false);
  assert.equal(verdict.basis, 'tool.config-read-only');
  // absent from the set: still fail-safe
  assert.equal(classifyMutation('other_probe', {}, undefined, extra).mutating, true);
});

test('bash stderr/stdout silencing is not a write', () => {
  for (const command of [
    'cat a.txt 2>/dev/null',
    'ls x 2>&1',
    'grep x y >/dev/null',
    'find . -name f &>/dev/null',
    'grep x y 2>>/dev/null',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, false, command);
  }
});

test('bash redirects to real sinks still mutate', () => {
  for (const command of [
    'echo hi > out.txt',
    'echo hi >> out.txt',
    'cat a 2> err.txt',
    'cat a &> both.txt',
    'cat a 2>> err.log',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, true, command);
    assert.equal(verdict.basis, 'bash.write-redirect-or-inplace', command);
  }
});

test('graphify read verbs pass (query text cannot trip mutating patterns)', () => {
  for (const command of [
    'graphify query "how does install flow work"',
    'graphify path AuthModule Database --graph graphify-out/graph.json',
    'graphify explain SwinTransformer --graph graphify-out/graph.json',
    'graphify hook status',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, false, command);
  }
});

test('graphify mutating verbs stay gated', () => {
  for (const command of ['graphify update .', 'graphify add https://x.dev', 'graphify watch .', 'graphify .']) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, true, command);
  }
});

test('powershell routes through the bash verb scan', () => {
  const read = classifyMutation('powershell', { command: 'cat file.txt' });
  assert.equal(read.mutating, false);
  const unknown = classifyMutation('powershell', { command: 'Remove-Item x' });
  assert.equal(unknown.mutating, true);
  assert.equal(unknown.basis, 'bash.unknown=fail-safe');
});

test('unknown tools stay fail-safe mutating (codename probe)', () => {
  const verdict = classifyMutation('codemode', { code: 'return 1' });
  assert.equal(verdict.mutating, true);
  assert.match(verdict.basis, /tool\.unknown=fail-safe/);
});

// ——— segment splitter (per-segment-bash-classification) —————————————————

import { splitSegments } from '../src/classifier.ts';

test('splitter: separators produce segments', () => {
  const { segments, grammarUnsafe } = splitSegments('a; b && c || d | e\nf & g');
  assert.deepEqual(segments, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  assert.equal(grammarUnsafe, false);
});

test('splitter: quotes are opaque', () => {
  const { segments, grammarUnsafe } = splitSegments('echo "a; b" \'c | d\'');
  assert.deepEqual(segments, ['echo "a; b" \'c | d\'']);
  assert.equal(grammarUnsafe, false);
});

test('splitter: redirect grammar never splits (&, 2>&1, &>)', () => {
  for (const command of ['grep x y 2>&1', 'find . -name f &>/dev/null', 'a >&2']) {
    const { segments, grammarUnsafe } = splitSegments(command);
    assert.equal(segments.length, 1, command);
    assert.equal(grammarUnsafe, false, command);
  }
  // but backgrounding & separates
  assert.deepEqual(splitSegments('a & b').segments, ['a', 'b']);
});

test('splitter: word-start # comments skip to newline', () => {
  assert.deepEqual(splitSegments('ls # ; rm -rf /').segments, ['ls']);
  // mid-word # is data, not a comment
  assert.deepEqual(splitSegments('echo a#b; rm x').segments, ['echo a#b', 'rm x']);
});

test('splitter: tripwires mark grammar unsafe', () => {
  for (const command of [
    'echo $(date)',
    'echo `date`',
    'cat <(ls)',
    'cmd >(tee x)',
    'cat <<EOF',
    "echo 'unterminated",
  ]) {
    const { grammarUnsafe } = splitSegments(command);
    assert.equal(grammarUnsafe, true, command);
  }
  // quoted tripwire characters are data
  assert.equal(splitSegments("awk '{print $1}' f").grammarUnsafe, false);
});

test('splitter: backslash escapes (continuations)', () => {
  const { segments, grammarUnsafe } = splitSegments('cat a \\\n b');
  assert.equal(segments.length, 1); // the escaped newline does not split
  assert.equal(grammarUnsafe, false);
});

// ——— conjunction verdict ——————————————————————————————————————————————

test('conjunction: clean compounds pass', () => {
  for (const command of [
    'git status && git diff',
    'ls | grep foo',
    'cat a; cat b',
    'graphify query x; graphify path y',
    'grep x y 2>&1',
    'FOO=1 git status',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, false, command);
  }
});

test('conjunction: hole A closed — mutating beats read-only-anywhere', () => {
  for (const command of [
    'git status; npm install',
    'git log; rm -rf build/',
    'openspec list; sed -i s/a/b/ f',
    'git status > out.txt', // hole A variant: escape preempted the redirect scan
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, true, command);
  }
});

test('conjunction: read-verb arguments are data, not commands', () => {
  for (const command of [
    'graphify query "how does install flow work"',
    'git log --grep rm',
    'cat install-flow.txt',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, false, command);
  }
});

test('conjunction: hole B closed — one clean verb no longer launders', () => {
  for (const command of [
    'ls; bash ./evil.sh',
    'which graphify; graphify --version',
    'cat a; frobnicate --widget x',
  ]) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, true, command);
    assert.equal(verdict.basis, 'bash.unknown=fail-safe', command);
  }
});

test('conjunction: grammar-unsafe commands attribute (receipt, not denial)', () => {
  const verdict = classifyMutation('bash', { command: 'echo $(date)' });
  assert.equal(verdict.mutating, true);
  assert.equal(verdict.basis, 'bash.grammar=fail-safe');
});

test('conjunction: creation requires every segment clean-or-creation', () => {
  const compound = classifyMutation('bash', {
    command: 'git status && openspec new change z',
  });
  assert.equal(compound.creation, true);
  assert.equal(compound.mutating, false);

  const laundered = classifyMutation('bash', {
    command: 'openspec new change z; rm -rf /tmp/x',
  });
  assert.equal(laundered.mutating, true);
  assert.equal(laundered.creation, false);
});

test('conjunction: newlines separate like ;', () => {
  assert.equal(classifyMutation('bash', { command: 'ls\ncat b' }).mutating, false);
  assert.equal(classifyMutation('bash', { command: 'ls\nrm b' }).mutating, true);
});

test('conjunction: env-prefix stripped for anchoring, verbs still checked', () => {
  assert.equal(classifyMutation('bash', { command: 'LC_ALL=C sort f' }).mutating, false);
  assert.equal(classifyMutation('bash', { command: 'FOO=1 rm x' }).mutating, true);
});

// ——— wrapper normalization (pios-gate-cli) ——————————————————————————————

test('wrapper: pios-gate classifies like bare openspec forms', () => {
  const cases: Array<[string, boolean]> = [
    ['pios-gate list --json', false],
    ['pios-gate show my-change', false],
    ['pios-gate validate my-change', false], // forwards: openspec structure lint
    ['./bin/pios-gate status', false],
    ['pi-openspec-gate list', false],
    ['pios-gate new change my-slice --schema ramona-plan', false], // creation
    ['pios-gate archive my-change', true], // forwards, but mutating verb
    ['pios-gate update', true],
    ['pios-gate frobnicate --x', true], // unknown subcommand fails safe
    ['pios-gate list && pios-gate show x', false], // per-segment normalization
    ['which pios-gate', false], // wrapper as an ARGUMENT, not the verb
  ];
  for (const [command, mutating] of cases) {
    const verdict = classifyMutation('bash', { command });
    assert.equal(verdict.mutating, mutating, command);
  }
  const creation = classifyMutation('bash', { command: 'pios-gate new change z' });
  assert.equal(creation.creation, true, 'wrapper creation is creation');
});
