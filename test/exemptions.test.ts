import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchExemption } from '../src/exemptions.ts';
import { extractPaths } from '../src/paths.ts';

const RULES = [
  { prefix: '**/openspec/**', category: 'openspec-artifacts' },
  { prefix: '**/docs/**', category: 'documentation' },
  { prefix: 'vendor', category: 'vendored' },
];

const CWD = '/work/repo';

test('segment rule matches any depth', () => {
  const verdict = matchExemption('write', ['/work/repo/openspec/changes/x/4-tasks.md'], RULES, CWD);
  assert.equal(verdict.exempt, true);
  assert.equal(verdict.category, 'openspec-artifacts');
});

test('mixed targets are not exempt', () => {
  const verdict = matchExemption(
    'edit',
    ['/work/repo/openspec/a.md', '/work/repo/src/b.ts'],
    RULES,
    CWD,
  );
  assert.equal(verdict.exempt, false);
});

test('plain prefix rule resolves against cwd', () => {
  const verdict = matchExemption('write', ['/work/repo/vendor/lib.js'], RULES, CWD);
  assert.equal(verdict.exempt, true);
  assert.equal(verdict.category, 'vendored');
});

test('segment boundary, not substring', () => {
  // "openspec-ish" is not the segment "openspec"
  const verdict = matchExemption('write', ['/work/repo/openspec-ish/a.md'], RULES, CWD);
  assert.equal(verdict.exempt, false);
});

test('no enumerable targets is never exempt', () => {
  assert.equal(matchExemption('bash', [], RULES, CWD).exempt, false);
  assert.equal(matchExemption('subagent', [], RULES, CWD).exempt, false);
});

test('bash is never path-exempt even with paths', () => {
  assert.equal(matchExemption('bash', ['/work/repo/docs/x'], RULES, CWD).exempt, false);
});

test('extractPaths resolves relative inputs against cwd', () => {
  const paths = extractPaths('write', { path: 'src/a.ts' }, CWD);
  assert.deepEqual(paths, ['/work/repo/src/a.ts']);
});

test('extractPaths collects arrays and deduplicates', () => {
  const paths = extractPaths('edit', { paths: ['b.ts', 'b.ts'], path: '/abs/c.ts' }, CWD);
  assert.deepEqual(paths, ['/abs/c.ts', '/work/repo/b.ts']);
});
