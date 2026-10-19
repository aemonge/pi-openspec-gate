import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const WRAPPER = join(import.meta.dirname, '..', 'bin', 'pios-gate');
const ALIAS = join(import.meta.dirname, '..', 'bin', 'pi-openspec-gate');

type Repo = { dir: string; fakeDir: string; log: string };

/** temp repo with openspec/changes/ and a fake openspec on PATH */
function makeRepo(): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'pios-repo-'));
  const fakeDir = join(dir, 'fakebin');
  mkdirSync(join(dir, 'openspec', 'changes'), { recursive: true });
  mkdirSync(fakeDir, { recursive: true });
  // fake openspec: records argv, exits with FAKE_EXIT (default 0)
  writeFileSync(join(fakeDir, 'openspec'), '#!/bin/sh\necho "$@" >> "$CALL_LOG"\nexit "${FAKE_EXIT:-0}"\n', { mode: 0o755 });
  return { dir, fakeDir, log: join(dir, 'fakebin', 'calls.log') };
}

function run(repo: Repo, args: string[], fakeExit = 0): { status: number; stdout: string; called: boolean } {
  const result = spawnSync(
    WRAPPER,
    args,
    {
      cwd: repo.dir,
      env: { ...process.env, PATH: `${repo.fakeDir}:${process.env.PATH}`, CALL_LOG: repo.log, FAKE_EXIT: String(fakeExit) },
      encoding: 'utf8',
    },
  );
  return { status: result.status ?? -1, stdout: result.stdout + result.stderr, called: existsSync(repo.log) };
}

function change(repo: Repo, slug: string, meta?: string): void {
  mkdirSync(join(repo.dir, 'openspec', 'changes', slug), { recursive: true });
  if (meta) writeFileSync(join(repo.dir, 'openspec', 'changes', slug, '.openspec.yaml'), meta);
}

test('wrapper: passthrough execs openspec verbatim, exit code intact', () => {
  const repo = makeRepo();
  try {
    const ok = run(repo, ['list', '--json']);
    assert.equal(ok.status, 0);
    assert.equal(readFileSync(repo.log, 'utf8').trim(), 'list --json');

    const fail = run(repo, ['show', 'nope'], 3);
    assert.equal(fail.status, 3);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: approve/confirm are gate-owned, never forwarded', () => {
  const repo = makeRepo();
  try {
    change(repo, 'x', 'status: proposed\n');
    const approved = run(repo, ['approve', 'x']);
    assert.equal(approved.status, 0);
    assert.match(approved.stdout, /approved x · at/);
    assert.equal(run(repo, ['confirm', 'x']).status, 0);
    assert.equal(existsSync(repo.log), false, 'fake openspec must never see approve/confirm');
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'x', '.openspec.yaml'), 'utf8');
    assert.match(meta, /status: approved/);
    assert.match(meta, /validated_at:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: pending reports what needs the human', () => {
  const repo = makeRepo();
  try {
    change(repo, 'needs-approve', 'status: proposed\ncreated_by: assistant\n');
    change(repo, 'needs-confirm', 'status: approved\n\napproved_at: 2026-10-19T10:00:00Z\n');
    writeFileSync(
      join(repo.dir, 'openspec', 'changes', 'needs-confirm', '4-tasks.md'),
      '# Tasks\n\n- [x] Step 1 — done\n- [ ] Step 2 — Human validation — live proof response: · outcome:\n',
    );
    const out = run(repo, ['pending']);
    assert.equal(out.status, 0);
    assert.match(out.stdout, /needs-approve\s+proposed\s+needs approve/);
    assert.match(out.stdout, /needs-confirm\s+approved\s+needs confirm/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: usage errors exit 2 without forwarding', () => {
  const repo = makeRepo();
  try {
    assert.equal(run(repo, ['approve']).status, 2);
    assert.equal(run(repo, ['approve', 'no-such-change']).status, 2);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: missing openspec binary exits 127', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pios-empty-'));
  try {
    mkdirSync(join(dir, 'openspec', 'changes'), { recursive: true });
    const emptyBin = join(dir, 'emptybin');
    mkdirSync(emptyBin);
    const result = spawnSync(WRAPPER, ['list'], {
      cwd: dir,
      env: { PATH: emptyBin, HOME: dir },
      encoding: 'utf8',
    });
    assert.equal(result.status, 127);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('wrapper: survives npm global-bin symlinks (link farm layout)', () => {
  // npm links global bins as symlinks: <prefix>/bin/pios-gate →
  // …/node_modules/<pkg>/bin/pios-gate. dirname "$0" through the link
  // points at the link farm — the .ts companion is in the package copy.
  const dir = mkdtempSync(join(tmpdir(), 'pios-npm-layout-'));
  try {
    const pkgBin = join(dir, 'lib', 'node_modules', '@aemonge-dev', 'pi-openspec-gate', 'bin');
    const linkDir = join(dir, 'bin');
    mkdirSync(pkgBin, { recursive: true });
    mkdirSync(linkDir, { recursive: true });
    const fakeDir = join(dir, 'fakebin');
    mkdirSync(fakeDir);
    writeFileSync(join(fakeDir, 'openspec'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    // package copy: the real shims + the real .ts companions
    const repoBin = join(import.meta.dirname, '..', 'bin');
    for (const f of ['gate-lib.js', 'pi-openspec-gate', 'pi-openspec-gate.js', 'pios-gate', 'pios-gate.js']) {
      copyFileSync(join(repoBin, f), join(pkgBin, f));
    }
    // npm-style symlinks
    symlinkSync(join(pkgBin, 'pios-gate'), join(linkDir, 'pios-gate'));
    symlinkSync(join(pkgBin, 'pi-openspec-gate'), join(linkDir, 'pi-openspec-gate'));
    mkdirSync(join(dir, 'openspec', 'changes'), { recursive: true });

    const viaLink = (name: string, args: string[]) =>
      spawnSync(join(linkDir, name), args, {
        cwd: dir,
        env: { ...process.env, PATH: `${fakeDir}:${process.env.PATH}` },
        encoding: 'utf8',
      });
    const pending = viaLink('pios-gate', ['pending']);
    assert.equal(pending.status, 0, `pios-gate through npm link: ${pending.stderr}`);
    assert.match(pending.stdout, /nothing pending/);
    const usage = viaLink('pi-openspec-gate', ['--help']);
    assert.notEqual(usage.status, 0); // usage error — but NOT MODULE_NOT_FOUND
    assert.doesNotMatch(usage.stderr, /Cannot find module/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
