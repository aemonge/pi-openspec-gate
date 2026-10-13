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
