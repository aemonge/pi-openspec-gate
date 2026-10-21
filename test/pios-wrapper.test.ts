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
    assert.match(out.stdout, /needs-confirm\s+approved\s+1 open steps/);
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

// ── phase gates: the five grants ─────────────────────────────────────────

const GATED_SCHEMA = `name: gated
version: 1
artifacts:
  - id: idea
    generates: 1-idea.md
    x-grant-verb: propose
  - id: proposition
    generates: 2-proposition.md
    x-grant-verb: deal
    x-requires-approval: [idea]
    x-lines: [Claim]
  - id: proposal
    generates: 3-proposal.md
    x-grant-verb: plan
    x-requires-approval: [proposition]
    x-sections: [Done when]
  - id: plan
    generates: 4-plan.md
    x-grant-verb: order
    x-requires-approval: [proposal]
  - id: execution
    generates: 5-execution.md
    x-grant-verb: execute
    x-requires-approval: [plan]
`;

function gatedRepo(): Repo {
  const repo = makeRepo();
  mkdirSync(join(repo.dir, 'openspec', 'schemas', 'gated'), { recursive: true });
  writeFileSync(join(repo.dir, 'openspec', 'schemas', 'gated', 'schema.yaml'), GATED_SCHEMA);
  change(repo, 'm1', 'schema: gated\nstatus: proposed\n');
  return repo;
}

function draft(repo: Repo, slug: string, file: string, content: string): void {
  writeFileSync(join(repo.dir, 'openspec', 'changes', slug, file), content);
}

test('grants: the full five-rung walk stamps in order and completes the ladder', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'pain and direction');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: you will enjoy this\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    assert.equal(run(repo, ['deal', 'm1']).status, 1, 'in sequence: deal before propose fails');
    assert.match(run(repo, ['deal', 'm1']).stdout, /in sequence/);

    const p = run(repo, ['propose', 'm1']);
    assert.equal(p.status, 0);
    assert.match(p.stdout, /granted m1 · idea/);

    const again = run(repo, ['propose', 'm1']);
    assert.equal(again.status, 1);
    assert.match(again.stdout, /already granted/);

    assert.equal(run(repo, ['deal', 'm1']).status, 0);
    assert.equal(run(repo, ['plan', 'm1']).status, 0);
    assert.equal(run(repo, ['order', 'm1']).status, 0);

    const done = run(repo, ['execute', 'm1']);
    assert.equal(done.status, 0);
    assert.match(done.stdout, /ladder complete — status: approved/);

    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /phases_approved: idea,proposition,proposal,plan,execution/);
    assert.match(meta, /status: approved/);
    assert.match(meta, /granted_execution:/);
    assert.equal(existsSync(repo.log), false, 'grants never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: structure refusal — a Claim-less proposition will not stamp', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\nno claim line\n');
    assert.equal(run(repo, ['propose', 'm1']).status, 0);
    const deal = run(repo, ['deal', 'm1']);
    assert.equal(deal.status, 1);
    assert.match(deal.stdout, /missing declared structure: Claim/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: you approve what you read — undrafted rungs refuse', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    assert.equal(run(repo, ['propose', 'm1']).status, 0);
    const deal = run(repo, ['deal', 'm1']);
    assert.equal(deal.status, 1);
    assert.match(deal.stdout, /2-proposition.md not drafted yet/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: approve <slug> <rung> canonical form and big-bang on gated schemas', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    draft(repo, 'm1', '3-proposal.md', '## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');
    assert.equal(run(repo, ['approve', 'm1', 'idea']).status, 0);
    assert.equal(run(repo, ['approve', 'm1', 'proposition']).status, 0);

    const bang = run(repo, ['approve', 'm1']);
    assert.equal(bang.status, 0);
    assert.match(bang.stdout, /all rungs · ladder complete/);
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /phases_approved: idea,proposition,proposal,plan,execution/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('cockpit: pending shows rung marks and the next grant; show is verbose', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    run(repo, ['propose', 'm1']);
    const pending = run(repo, ['pending']);
    assert.match(pending.stdout, /\[gated\] ✓◻···/);
    assert.match(pending.stdout, /read 2-proposition\.md → grant: pios-gate deal m1/);

    const show = run(repo, ['inspect', 'm1']);
    assert.match(show.stdout, /mission: m1 · schema: gated/);
    assert.match(show.stdout, /structure ✓/);
    assert.match(show.stdout, /next human act: read 2-proposition\.md/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: focus teaches, ungated schema refuses verbs politely', () => {
  const repo = makeRepo();
  try {
    change(repo, 'legacy', 'status: proposed\n');
    const focus = run(repo, ['focus']);
    assert.equal(focus.status, 0);
    assert.match(focus.stdout, /session instrument/);
    const verb = run(repo, ['grant', 'legacy', 'a']);
    assert.equal(verb.status, 1); // grant refused, not a usage error
    assert.match(verb.stdout, /schema declares no gates/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});
