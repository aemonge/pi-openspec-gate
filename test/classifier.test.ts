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
