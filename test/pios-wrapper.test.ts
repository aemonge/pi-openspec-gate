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
  const dir = mkdtempSync(join(tmpdir(), 'eospec-repo-'));
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
    const ok = run(repo, ['status', '--json']);
    assert.equal(ok.status, 0);
    assert.equal(readFileSync(repo.log, 'utf8').trim(), 'status --json');

    const fail = run(repo, ['show', 'nope'], 3);
    assert.equal(fail.status, 3);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: the escape hatch — everything after -- is openspec, verbatim', () => {
  const repo = makeRepo();
  try {
    const r = run(repo, ['--', 'status', '--json']);
    assert.equal(r.status, 0);
    assert.equal(readFileSync(repo.log, 'utf8').trim(), 'status --json');

    // a change named like nothing special still aims without the hatch
    change(repo, 'x', 'x-status: proposed\n');
    assert.equal(run(repo, ['x']).status, 0);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: approve/close are gate-owned, never forwarded', () => {
  const repo = makeRepo();
  try {
    change(repo, 'x', 'x-status: proposed\n');
    assert.equal(run(repo, ['x']).status, 0);
    const advanced = run(repo, ['approve']);
    assert.equal(advanced.status, 1);
    assert.match(advanced.stdout, /has no gates — eospec close closes it as it stands/);
    const closed = run(repo, ['close']);
    assert.equal(closed.status, 0);
    assert.match(closed.stdout, /closed x · ungated — approved, validated · archiving/);
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'x', '.openspec.yaml'), 'utf8');
    assert.doesNotMatch(meta, /granted:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: the room view reports what needs the human', () => {
  const repo = makeRepo();
  try {
    change(repo, 'needs-approve', 'x-status: proposed\nx-created_by: assistant\n');
    change(repo, 'needs-close', 'x-status: approved\n\nx-approved_at: 2026-10-19T10:00:00Z\n');
    writeFileSync(
      join(repo.dir, 'openspec', 'changes', 'needs-close', '4-tasks.md'),
      '# Tasks\n\n- [x] Step 1 — done\n- [ ] Step 2 — Human validation — live proof response: · outcome:\n',
    );
    const out = run(repo, ['focus']);
    assert.equal(out.status, 0);
    assert.match(out.stdout, /needs-approve\s+proposed\s+aim first — eospec close closes ungated rooms/);
    assert.match(out.stdout, /needs-close\s+approved\s+1 open tasks/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: usage errors exit 2 without forwarding', () => {
  const repo = makeRepo();
  try {
    assert.equal(run(repo, ['close']).status, 1);
    assert.match(run(repo, ['close']).stdout, /nothing aimed/);
    assert.equal(run(repo, ['approve']).status, 1);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: focus on an unknown change exits 2 without forwarding', () => {
  const repo = makeRepo();
  try {
    const r = run(repo, ['focus', 'missing']);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /no such change: missing/);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('wrapper: missing openspec binary exits 127', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eospec-empty-'));
  try {
    mkdirSync(join(dir, 'openspec', 'changes'), { recursive: true });
    const emptyBin = join(dir, 'emptybin');
    mkdirSync(emptyBin);
    const result = spawnSync(WRAPPER, ['focus'], {
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
  // npm links global bins as symlinks: <prefix>/bin/eospec →
  // …/node_modules/<pkg>/bin/eospec. dirname "$0" through the link
  // points at the link farm — the .js companion is in the package copy.
  const dir = mkdtempSync(join(tmpdir(), 'eospec-npm-layout-'));
  try {
    const pkgBin = join(dir, 'lib', 'node_modules', '@aemonge-dev', 'eospec', 'bin');
    const linkDir = join(dir, 'bin');
    mkdirSync(pkgBin, { recursive: true });
    mkdirSync(linkDir, { recursive: true });
    const fakeDir = join(dir, 'fakebin');
    mkdirSync(fakeDir);
    writeFileSync(join(fakeDir, 'openspec'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    // package copy: the real shims + the real .js companions
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
    const room = viaLink('pios-gate', ['focus']);
    assert.equal(room.status, 0, `wrapper through npm link: ${room.stderr}`);
    assert.match(room.stdout, /nothing pending/);
    const usage = viaLink('pi-openspec-gate', ['--help']);
    assert.notEqual(usage.status, 0); // usage error — but NOT MODULE_NOT_FOUND
    assert.doesNotMatch(usage.stderr, /Cannot find module/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── approvals: the walk stamps in declaration order ──────────────────────

const GATED_SCHEMA = `name: gated
version: 1
artifacts:
  - id: idea
    generates: 1-idea.md
  - id: proposition
    generates: 2-proposition.md
    x-requires-approval: [idea]
    x-lines: [Claim]
  - id: proposal
    generates: 3-proposal.md
    x-requires-approval: [proposition]
    x-sections: [Done when]
  - id: plan
    generates: 4-plan.md
    x-requires-approval: [proposal]
  - id: execution
    generates: 5-execution.md
    x-requires-approval: [plan]
`;

function gatedRepo(): Repo {
  const repo = makeRepo();
  mkdirSync(join(repo.dir, 'openspec', 'schemas', 'gated'), { recursive: true });
  writeFileSync(join(repo.dir, 'openspec', 'schemas', 'gated', 'schema.yaml'), GATED_SCHEMA);
  change(repo, 'm1', 'schema: gated\nx-status: proposed\n');
  return repo;
}

function draft(repo: Repo, slug: string, file: string, content: string): void {
  writeFileSync(join(repo.dir, 'openspec', 'changes', slug, file), content);
}

test('approvals: the full five-step walk approves in order and completes the schema', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'pain and direction');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: you will enjoy this\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    const aim = run(repo, ['focus', 'm1']);
    assert.equal(aim.status, 0);
    assert.match(aim.stdout, /focused m1 · next: read 1-idea\.md → eospec approve/);

    let first;
    for (let i = 0; i < 5; i += 1) {
      first = run(repo, ['approve']);
      assert.equal(first.status, 0, `approve #${i + 1}`);
    }
    assert.match(first!.stdout, /approved m1 · execution/);

    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /x-granted: idea,proposition,proposal,plan,execution/);
    assert.match(meta, /x-status: approved/);
    assert.match(meta, /x-granted_execution:/);
    assert.equal(existsSync(repo.log), false, 'approvals never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approvals: structure refusal — a Claim-less proposition will not stamp', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\nno claim line\n');
    assert.equal(run(repo, ['focus', 'm1']).status, 0);
    assert.equal(run(repo, ['approve']).status, 0);
    const deal = run(repo, ['approve']);
    assert.equal(deal.status, 1);
    assert.match(deal.stdout, /missing declared structure: Claim/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('teaching: the gate names the next act — aim echo, approval echo, room view', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    const aim = run(repo, ['focus', 'm1']);
    assert.equal(aim.status, 0);
    assert.match(aim.stdout, /next: read 1-idea\.md → eospec approve/);

    const advanced = run(repo, ['approve']);
    assert.equal(advanced.status, 0);
    assert.match(advanced.stdout, /next: read 2-proposition\.md → eospec approve/);

    const room = run(repo, ['focus']);
    assert.equal(room.status, 0);
    assert.match(room.stdout, /aim: m1/);
    assert.match(room.stdout, /read 2-proposition\.md → eospec approve/);
    assert.equal(room.called, false, 'the room view never forwards');

    let done;
    for (let i = 0; i < 4; i += 1) done = run(repo, ['approve']);
    assert.equal(done!.status, 0);
    assert.match(done!.stdout, /all steps approved — status: approved/);

    const final = run(repo, ['focus']);
    assert.match(final.stdout, /all artifacts granted — no verdict declared/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('walk: focus aims, approve advances, close closes — archive is the last close', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    // bare aim resolves the room — the renderer's one-line contract
    const aimless = run(repo, ['focus']);
    assert.equal(aimless.status, 0);
    assert.match(aimless.stdout, /nothing aimed — eospec focus <change>/);

    // focus aims; the echo teaches the next approve
    const aim = run(repo, ['focus', 'm1']);
    assert.equal(aim.status, 0);
    assert.match(aim.stdout, /focused m1 · next: read 1-idea\.md → eospec approve/);
    assert.equal(existsSync(join(repo.dir, 'openspec', '.focus')), true);
    const room = run(repo, ['focus']);
    assert.equal(room.status, 0);
    assert.match(room.stdout, /aim: m1/);

    // unknown bare names still forward verbatim
    assert.equal(run(repo, ['whatever']).called, true, 'unknown single arg forwards');

    // approve ladders the rungs — same grantArtifact checks, aimed
    for (let i = 0; i < 5; i += 1) {
      const step = run(repo, ['approve']);
      assert.equal(step.status, 0, `approve #${i + 1}`);
    }
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /x-granted: idea,proposition,proposal,plan,execution/);
    assert.match(meta, /x-status: approved/);

    // the verdict wall: approve refuses — close closes, only after the tick
    const wall = run(repo, ['approve']);
    assert.equal(wall.status, 1);
    assert.match(wall.stdout, /tick 'the verdict' then: eospec close/);

    const close = run(repo, ['close']);
    assert.equal(close.status, 0);
    assert.match(close.stdout, /closed m1 · validated · archiving/);
    assert.equal(close.called, true, 'close execs the archive');
    assert.match(readFileSync(repo.log, 'utf8'), /archive m1/);
    assert.equal(existsSync(join(repo.dir, 'openspec', '.focus')), false, 'close releases the aim');

    // the room view is read-only; the close released the aim (the fake
    // openspec never archives, so the change itself stays listed)
    rmSync(repo.log, { force: true });
    const room2 = run(repo, ['focus']);
    assert.equal(room2.status, 0);
    assert.equal(room2.called, false);
    assert.match(room2.stdout, /nothing aimed/);
    assert.match(room2.stdout, /validated/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('walk: stale aim and aimless approve refuse loudly', () => {
  const repo = gatedRepo();
  try {
    const aimless = run(repo, ['approve']);
    assert.equal(aimless.status, 1);
    assert.match(aimless.stdout, /nothing aimed — eospec focus <change>/);
    writeFileSync(join(repo.dir, 'openspec', '.focus'), 'gone\n');
    const stale = run(repo, ['approve']);
    assert.equal(stale.status, 1);
    assert.match(stale.stdout, /the aim is stale — the change is gone/);
    const staleRoom = run(repo, ['focus']);
    assert.equal(staleRoom.status, 0);
    assert.match(staleRoom.stdout, /aim: gone/);
    const staleClose = run(repo, ['close']);
    assert.equal(staleClose.status, 1);
    assert.match(staleClose.stdout, /the aim is stale — the change is gone/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('help: bare invocation and help print eospec usage — never openspec banner', () => {
  const repo = makeRepo();
  try {
    for (const args of [[], ['help'], ['--help'], ['-h']]) {
      const r = run(repo, args);
      assert.equal(r.status, 0, `eospec ${args.join(' ')}`);
      assert.match(r.stdout, /eospec focus <change>/u, args.join(' '));
      assert.doesNotMatch(r.stdout, /AI-native/u, 'openspec banner must not answer for the gate');
      assert.equal(r.called, false, 'help never forwards');
    }
    // unknown verbs keep the documented passthrough
    const unknown = run(repo, ['some-openspec-verb', 'x']);
    assert.equal(unknown.called, true, 'unknown argv still execs openspec verbatim');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('dead verbs forward — the three words are the whole gate surface', () => {
  const repo = makeRepo();
  try {
    change(repo, 'x', 'x-status: proposed\n');
    assert.equal(run(repo, ['x']).status, 0);
    for (const dead of [['act'], ['go'], ['done'], ['list'], ['inspect'], ['grant', 'x', 'idea'], ['next'], ['confirm']]) {
      const r = run(repo, dead);
      assert.equal(r.called, true, `'${dead.join(' ')}' forwards verbatim — nothing gate-owned answers it`);
    }
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('archive: the gate-side flag never reaches openspec argv (catch #5)', () => {
  const repo = makeRepo();
  try {
    change(repo, 'u1', 'x-status: proposed\n');
    const r = run(repo, ['archive', 'u1', '-y', '--skip-specs', '--i-am-the-human']);
    assert.equal(r.status, 0, r.stdout);
    const calls = existsSync(repo.log) ? readFileSync(repo.log, 'utf8') : '';
    assert.doesNotMatch(calls, /--i-am-the-human/u, 'the gate-side flag is stripped before exec');
    assert.match(calls, /archive u1/u, 'the rest of the argv forwards verbatim');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('pause/resume forward — session acts are taught by the extension, not the CLI', () => {
  const repo = makeRepo();
  try {
    for (const args of [['pause', '30m'], ['resume']]) {
      const r = run(repo, args);
      assert.equal(r.called, true, `'${args.join(' ')}' forwards verbatim`);
    }
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approvals: the uniform advance — first ungranted stamps, refusals never forward', () => {
  const repo = makeRepo();
  try {
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'verbless'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'verbless', 'schema.yaml'),
      'name: verbless\nartifacts:\n  - id: idea\n    generates: 1-idea.md\n  - id: memo\n    generates: 2-memo.md\n    x-requires-approval: [idea]\n',
    );
    change(repo, 'v1', 'schema: verbless\nstatus: proposed\n');
    draft(repo, 'v1', '1-idea.md', 'pain');
    draft(repo, 'v1', '2-memo.md', 'memo');

    // aim, then approve finds the first rung in declaration order
    assert.equal(run(repo, ['focus', 'v1']).status, 0);
    const first = run(repo, ['approve']);
    assert.equal(first.status, 0);
    assert.match(first.stdout, /approved v1 · idea/);

    // declaration order continues: memo follows idea without naming it
    const second = run(repo, ['approve']);
    assert.equal(second.status, 0);
    assert.match(second.stdout, /approved v1 · memo/);

    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'v1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /x-granted: idea,memo/);

    // nothing left: the close owns what remains
    const over = run(repo, ['approve']);
    assert.equal(over.status, 1);
    assert.match(over.stdout, /all artifacts granted — next: tick 'the verdict' then: eospec close/);
    assert.equal(existsSync(repo.log), false, 'approvals never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approvals: an undrafted rung refuses — you approve what you read', () => {
  const repo = makeRepo();
  try {
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'verbless'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'verbless', 'schema.yaml'),
      'name: verbless\nartifacts:\n  - id: idea\n    generates: 1-idea.md\n  - id: memo\n    generates: 2-memo.md\n    x-requires-approval: [idea]\n',
    );
    change(repo, 'v1', 'schema: verbless\nstatus: proposed\n');
    assert.equal(run(repo, ['focus', 'v1']).status, 0);
    const refused = run(repo, ['approve']);
    assert.equal(refused.status, 1);
    assert.match(refused.stdout, /1-idea\.md not drafted yet — you approve what you read/);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approve: ungated rooms are told the truth — close owns them', () => {
  const repo = makeRepo();
  try {
    // ungated shape one: no schema at all
    change(repo, 'legacy', 'x-status: proposed\n');
    assert.equal(run(repo, ['focus', 'legacy']).status, 0);
    const bare = run(repo, ['approve']);
    assert.equal(bare.status, 1);
    assert.match(bare.stdout, /has no gates — eospec close closes it as it stands/);
    assert.equal(existsSync(repo.log), false);

    // ungated shape two: a declared schema with no gates
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'plain'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'plain', 'schema.yaml'),
      'name: plain\nartifacts:\n  - id: a\n    generates: 1-a.md\n',
    );
    change(repo, 'plain', 'schema: plain\nstatus: proposed\n');
    assert.equal(run(repo, ['focus', 'plain']).status, 0);
    const ungated = run(repo, ['approve']);
    assert.equal(ungated.status, 1);
    assert.match(ungated.stdout, /has no gates — eospec close closes it as it stands/);
    assert.equal(existsSync(repo.log), false);
    const closed = run(repo, ['close']);
    assert.equal(closed.status, 0);
    assert.match(closed.stdout, /closed plain · ungated — approved, validated · archiving/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approvals: x-requires-written — a deleted dependency file refuses the stamp', () => {
  const repo = makeRepo();
  try {
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'ev'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'ev', 'schema.yaml'),
      'name: ev\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n    x-requires-written: [a]\n',
    );
    change(repo, 'e1', 'schema: ev\nstatus: proposed\n');
    draft(repo, 'e1', '1-a.md', '# A\n');
    draft(repo, 'e1', '2-b.md', '# B\n');
    assert.equal(run(repo, ['focus', 'e1']).status, 0);
    assert.equal(run(repo, ['approve']).status, 0);
    // evidence vanished after its grant: the next stamp refuses (fail-safe)
    rmSync(join(repo.dir, 'openspec', 'changes', 'e1', '1-a.md'));
    const seal = run(repo, ['approve']);
    assert.equal(seal.status, 1);
    assert.match(seal.stdout, /2-b\.md awaits declared evidence: 1-a\.md not on disk/u);
    assert.equal(existsSync(repo.log), false, 'refusals never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('room view: ticked commits without a hash are visible debt', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    draft(repo, 'm1', '3-proposal.md', '## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(
      repo,
      'm1',
      '5-execution.md',
      '# Execution\n\n- [x] fix(core): thing\n      hash: \n- [x] feat(x): other\n      hash: abc123\n',
    );
    assert.equal(run(repo, ['focus', 'm1']).status, 0);
    for (let i = 0; i < 5; i += 1) {
      assert.equal(run(repo, ['approve']).status, 0);
    }
    const room = run(repo, ['focus']);
    assert.match(room.stdout, /1 unhashed commits/u); // empty hash slot = debt; abc123 = receipt
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('approvals: one press stamps exactly one step — intent can never over-run its scope', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    draft(repo, 'm1', '3-proposal.md', '## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');
    assert.equal(run(repo, ['focus', 'm1']).status, 0);
    assert.equal(run(repo, ['approve']).status, 0);
    assert.equal(run(repo, ['approve']).status, 0);

    // one press, one step: even with every artifact drafted, a single
    // approve can never stamp more than the next rung
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /x-granted: idea,proposition\n/);
    assert.doesNotMatch(meta, /x-status: approved/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('room view: approval marks and the next act, one line per change, no schema tag', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    assert.equal(run(repo, ['focus', 'm1']).status, 0);
    assert.equal(run(repo, ['approve']).status, 0);
    const room = run(repo, ['focus']);
    assert.match(room.stdout, /✓◻···/);
    assert.match(room.stdout, /read 2-proposition\.md → eospec approve/);
    assert.doesNotMatch(room.stdout, /\[gated\]/u, 'the schema tag is not cockpit noise');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

// ── cli-schema-tag-parity — the SHIPPED schema through the CLI ──────────
// No fixture ever parsed a shipped schema through the bin parser. These
// pin the live 2026-10-23 symptoms on the real thing.

function shippedRepo(): Repo {
  const repo = makeRepo();
  const dir = join(repo.dir, 'openspec', 'schemas', 'spec');
  mkdirSync(dir, { recursive: true });
  copyFileSync(
    join(import.meta.dirname, '..', 'openspec', 'schemas', 'spec', 'schema.yaml'),
    join(dir, 'schema.yaml'),
  );
  return repo;
}

function specChange(repo: Repo, slug: string): void {
  change(repo, slug, 'schema: spec\nx-status: proposed\nx-created_by: assistant\n');
  draft(repo, slug, '1-brainstorm.md', '# Brainstorm\n\n## Pain\n\nfixture\n\n## Questions\n\n- fixture\n');
}

test('parity live: a rung word forwards verbatim — nothing gate-owned answers it', () => {
  const repo = shippedRepo();
  try {
    specChange(repo, 'fx');
    const p = run(repo, ['open', 'fx']);
    assert.equal(p.status, 0, 'openspec (fake) answers — the gate never interpreted');
    assert.equal(p.called, true, 'a dead verb word forwards; nothing gate-owned answers it');
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'fx', '.openspec.yaml'), 'utf8');
    assert.doesNotMatch(meta, /granted:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('parity live: named stamps forward — nothing stamps without approve', () => {
  const repo = shippedRepo();
  try {
    specChange(repo, 'fx');
    const g = run(repo, ['grant', 'fx', 'brainstorm']);
    assert.equal(g.status, 0, 'openspec (fake) answers');
    assert.equal(g.called, true, 'the named stamp forwards — it is not gate-owned');
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'fx', '.openspec.yaml'), 'utf8');
    assert.doesNotMatch(meta, /granted:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('parity live: approve without an aim refuses loudly — and never stamps', () => {
  const repo = shippedRepo();
  try {
    specChange(repo, 'fx');
    const bare = run(repo, ['approve', 'fx']);
    assert.equal(bare.status, 1, 'approve is gate-owned: without an aim it refuses');
    assert.match(bare.stdout, /nothing aimed/);
    assert.equal(bare.called, false, 'approve never forwards');
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'fx', '.openspec.yaml'), 'utf8');
    assert.doesNotMatch(meta, /granted:/);
    assert.doesNotMatch(meta, /approved_at:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('room file: the flat-yaml snapshot renders and refreshes with every verb', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n- [x] half\n- [ ] rest\n');
    assert.equal(run(repo, ['focus', 'm1']).status, 0);
    const room = () => readFileSync(join(repo.dir, 'openspec', '.focus'), 'utf8');
    let text = room();
    assert.match(text, /# one active change per room — eospec writes, verbs refresh/);
    assert.match(text, /change: m1/);
    assert.match(text, /artifact-name: 1-idea\.md/);
    assert.match(text, /artifact-idx: 1\/5/);
    assert.match(text, /task: ""/);
    assert.match(text, /next-step: eospec approve/);

    // approve re-renders: the room shows the new step and its progress
    assert.equal(run(repo, ['approve']).status, 0);
    text = room();
    assert.match(text, /artifact-name: 2-proposition\.md/);
    assert.match(text, /artifact-idx: 2\/5/);
    assert.match(text, /task: 1\/2/);

    // the legacy one-line form still reads — and self-heals on the next touch
    writeFileSync(join(repo.dir, 'openspec', '.focus'), 'm1\n');
    assert.equal(run(repo, ['focus']).status, 0);
    assert.match(room(), /change: m1/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('room file: ungated rooms render the bare truth, close deletes the file', () => {
  const repo = makeRepo();
  try {
    change(repo, 'plain', 'x-status: proposed\n');
    assert.equal(run(repo, ['focus', 'plain']).status, 0);
    const text = readFileSync(join(repo.dir, 'openspec', '.focus'), 'utf8');
    assert.match(text, /change: plain/);
    assert.match(text, /artifact-name: ""/);
    assert.match(text, /next-step: eospec close/);
    assert.equal(run(repo, ['close']).status, 0);
    assert.equal(existsSync(join(repo.dir, 'openspec', '.focus')), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});
