import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findSessionFile } from '../src/focus.ts';

/** tempdir fixture: sessions root with per-cwd subdirs, pi's real layout. */
function sessionsRoot(): { root: string; dir: (name: string) => string } {
  const root = mkdtempSync(join(tmpdir(), 'focus-sessions-'));
  return { root, dir: (name: string) => join(root, name) };
}

test('findSessionFile: timestamped name resolves (pi real layout)', () => {
  const { root, dir } = sessionsRoot();
  try {
    mkdirSync(dir('--repo--'), { recursive: true });
    writeFileSync(
      join(dir('--repo--'), '2026-10-19T07-28-19-860Z_01a1530f-b193.jsonl'),
      '',
    );
    const found = findSessionFile(root, '01a1530f-b193');
    assert.equal(
      found,
      join(root, '--repo--', '2026-10-19T07-28-19-860Z_01a1530f-b193.jsonl'),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('findSessionFile: exact/legacy name still resolves', () => {
  const { root, dir } = sessionsRoot();
  try {
    mkdirSync(dir('--repo--'), { recursive: true });
    writeFileSync(join(dir('--repo--'), 'parent-1.jsonl'), '');
    assert.equal(findSessionFile(root, 'parent-1'), join(root, '--repo--', 'parent-1.jsonl'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('findSessionFile: wrong sessionId → undefined', () => {
  const { root, dir } = sessionsRoot();
  try {
    mkdirSync(dir('--repo--'), { recursive: true });
    writeFileSync(join(dir('--repo--'), '2026-10-19T08-00-00-000Z_parent-1.jsonl'), '');
    assert.equal(findSessionFile(root, 'parent-2'), undefined);
    // prefix of a real id must not match either (suffix anchor, not contains)
    assert.equal(findSessionFile(root, 'parent'), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('findSessionFile: missing sessions root → undefined (fail-open)', () => {
  assert.equal(findSessionFile(join(tmpdir(), 'focus-no-such-root-xyz'), 'any-id'), undefined);
});
