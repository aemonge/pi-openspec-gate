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
    const ok = run(repo, ['status', '--json']);
    assert.equal(ok.status, 0);
    assert.equal(readFileSync(repo.log, 'utf8').trim(), 'status --json');

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

test('grants: the full five-step walk stamps in order and completes the schema', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'pain and direction');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: you will enjoy this\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    assert.equal(run(repo, ['grant', 'm1', 'proposition']).status, 1, 'in sequence: proposition before idea fails');
    assert.match(run(repo, ['grant', 'm1', 'proposition']).stdout, /in sequence/);

    const first = run(repo, ['next', 'm1']);
    assert.equal(first.status, 0);
    assert.match(first.stdout, /granted m1 · idea/);

    const replay = run(repo, ['grant', 'm1', 'idea']);
    assert.equal(replay.status, 1);
    assert.match(replay.stdout, /already granted/);

    let done;
    for (let i = 0; i < 4; i += 1) done = run(repo, ['next', 'm1']);
    assert.equal(done!.status, 0);
    assert.match(done!.stdout, /all artifacts granted — status: approved/);

    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,proposition,proposal,plan,execution/);
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
    assert.equal(run(repo, ['next', 'm1']).status, 0);
    const deal = run(repo, ['grant', 'm1', 'proposition']);
    assert.equal(deal.status, 1);
    assert.match(deal.stdout, /missing declared structure: Claim/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: human-typed aliases — row number and generated file stamp canonical ids', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n');
    const first = run(repo, ['next', 'm1']);
    assert.equal(first.status, 0);

    const replayed = run(repo, ['grant', 'm1', '1']);
    assert.equal(replayed.status, 1);
    assert.match(replayed.stdout, /'idea' already granted/, 'row alias hits the canonical already-granted branch');

    assert.equal(run(repo, ['grant', 'm1', '2']).status, 0);
    let meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,proposition/);
    assert.match(meta, /granted_proposition:/);

    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    assert.equal(run(repo, ['grant', 'm1', '3-proposal.md']).status, 0);
    meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,proposition,proposal/);
    assert.match(meta, /granted_proposal:/);

    const miss = run(repo, ['grant', 'm1', '9']);
    assert.equal(miss.status, 1);
    assert.match(miss.stdout, /no artifact '9' in schema gated/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('teaching: the gate names the next act — echo suffix and the act verb', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    const proposed = run(repo, ['next', 'm1']);
    assert.equal(proposed.status, 0);
    assert.match(proposed.stdout, /next: read 2-proposition\.md → pios-gate next m1/);

    const act = run(repo, ['act', 'm1']);
    assert.equal(act.status, 0);
    assert.match(act.stdout, /read 2-proposition\.md → pios-gate next m1/);
    assert.equal(act.called, false, 'act never forwards');

    let done;
    for (let i = 0; i < 4; i += 1) done = run(repo, ['next', 'm1']);
    assert.equal(done!.status, 0);
    assert.match(done!.stdout, /all artifacts granted — status: approved/);

    const final = run(repo, ['act', 'm1']);
    assert.match(final.stdout, /all artifacts granted — no verdict declared/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('teaching: act on a legacy change points at the legacy acts', () => {
  const repo = makeRepo();
  try {
    change(repo, 'x', 'status: proposed\n');
    assert.match(run(repo, ['act', 'x']).stdout, /needs approve/);
    change(repo, 'y', 'status: approved\napproved_at: 2026-10-19T10:00:00Z\n');
    assert.match(run(repo, ['act', 'y']).stdout, /needs confirm \(verdict open\)/);
    change(repo, 'z', 'status: approved\nvalidated: 2026-10-19T11:00:00Z\n');
    assert.match(run(repo, ['act', 'z']).stdout, /ready to archive\?/);
    assert.equal(run(repo, ['act', 'missing']).status, 2);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('walk: <slug> aims, go advances, list watches — archive only after confirm', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', '# Proposition\n\nClaim: x\n');
    draft(repo, 'm1', '3-proposal.md', '# Proposal\n\n## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');

    // bare act resolves the aim — the renderer's one-line contract
    const aimless = run(repo, ['act']);
    assert.equal(aimless.status, 0);
    assert.match(aimless.stdout, /no focus — pios-gate <slug>/);

    // bare slug aims; the echo teaches the next go
    const aim = run(repo, ['m1']);
    assert.equal(aim.status, 0);
    assert.match(aim.stdout, /focused m1 · next: read 1-idea\.md → pios-gate go/);
    assert.equal(existsSync(join(repo.dir, 'openspec', '.focus')), true);
    assert.match(run(repo, ['focus']).stdout, /focused m1/);
    const renderer = run(repo, ['act']);
    assert.equal(renderer.status, 0);
    assert.match(renderer.stdout, /read 1-idea\.md → pios-gate go/);

    // unknown bare names still forward verbatim
    assert.equal(run(repo, ['whatever']).called, true, 'unknown single arg forwards');

    // go ladders the rungs — same grantArtifact checks, focused
    for (let i = 0; i < 5; i += 1) {
      const step = run(repo, ['go']);
      assert.equal(step.status, 0, `go #${i + 1}`);
    }
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,proposition,proposal,plan,execution/);
    assert.match(meta, /status: approved/);

    // the verdict wall: go refuses until confirm
    const wall = run(repo, ['go']);
    assert.equal(wall.status, 1);
    assert.match(wall.stdout, /tick 'the verdict' then: pios-gate confirm m1/);

    assert.equal(run(repo, ['confirm', 'm1']).status, 0);
    const last = run(repo, ['go']);
    assert.equal(last.status, 0);
    assert.match(last.stdout, /validated m1 — archiving/);
    assert.equal(last.called, true, 'the last go execs the archive');
    assert.match(readFileSync(repo.log, 'utf8'), /archive m1/);

    // list is the cockpit, pending its twin
    rmSync(repo.log, { force: true });
    const list = run(repo, ['list']);
    assert.equal(list.status, 0);
    assert.equal(list.called, false);
    assert.match(list.stdout, /m1/);
    assert.equal(run(repo, ['pending']).status, 0);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('walk: stale focus and aimless go refuse loudly', () => {
  const repo = gatedRepo();
  try {
    const aimless = run(repo, ['go']);
    assert.equal(aimless.status, 1);
    assert.match(aimless.stdout, /no focus — pios-gate <slug>/);
    writeFileSync(join(repo.dir, 'openspec', '.focus'), 'gone\n');
    const stale = run(repo, ['go']);
    assert.equal(stale.status, 1);
    assert.match(stale.stdout, /focus is stale — pios-gate <slug>/);
    assert.match(run(repo, ['focus']).stdout, /focused gone/);
    const staleAct = run(repo, ['act']);
    assert.equal(staleAct.status, 0);
    assert.match(staleAct.stdout, /focus is stale — pios-gate <slug>/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('help: bare invocation and help print gate usage — never openspec banner', () => {
  const repo = makeRepo();
  try {
    for (const args of [[], ['help'], ['--help'], ['-h']]) {
      const r = run(repo, args);
      assert.equal(r.status, 0, `pios-gate ${args.join(' ')}`);
      assert.match(r.stdout, /pios-gate <slug>/u, args.join(' '));
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

test('archive: the gate-side flag never reaches openspec argv (catch #5)', () => {
  const repo = makeRepo();
  try {
    change(repo, 'u1', 'status: proposed\n');
    const r = run(repo, ['archive', 'u1', '-y', '--skip-specs', '--i-am-the-human']);
    assert.equal(r.status, 0, r.stdout);
    const calls = existsSync(repo.log) ? readFileSync(repo.log, 'utf8') : '';
    assert.doesNotMatch(calls, /--i-am-the-human/u, 'the gate-side flag is stripped before exec');
    assert.match(calls, /archive u1/u, 'the rest of the argv forwards verbatim');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('pause: a session act — the terminal verb teaches, never forwards', () => {
  const repo = makeRepo();
  try {
    for (const args of [['pause', '30m'], ['resume']]) {
      const r = run(repo, args);
      assert.equal(r.status, 0, args.join(' '));
      assert.match(r.stdout, /session act/u, args.join(' '));
      assert.equal(existsSync(repo.log), false, 'pause/resume never forward');
    }
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('next: the uniform act — first ungranted stamps, refusals never forward', () => {
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

    // before any grant: next finds the first rung in declaration order
    const first = run(repo, ['next', 'v1']);
    assert.equal(first.status, 0);
    assert.match(first.stdout, /granted v1 · idea/);

    // declaration order continues: memo follows idea without naming it
    const second = run(repo, ['next', 'v1']);
    assert.equal(second.status, 0);
    assert.match(second.stdout, /granted v1 · memo/);

    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'v1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,memo/);

    // nothing left: loud refusal, never a passthrough
    const done = run(repo, ['next', 'v1']);
    assert.equal(done.status, 1);
    assert.match(done.stdout, /nothing to grant — all artifacts granted/);
    assert.equal(existsSync(repo.log), false, 'grants never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('next: an undrafted rung refuses — you approve what you read', () => {
  const repo = makeRepo();
  try {
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'verbless'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'verbless', 'schema.yaml'),
      'name: verbless\nartifacts:\n  - id: idea\n    generates: 1-idea.md\n  - id: memo\n    generates: 2-memo.md\n    x-requires-approval: [idea]\n',
    );
    change(repo, 'v1', 'schema: verbless\nstatus: proposed\n');
    const refused = run(repo, ['next', 'v1']);
    assert.equal(refused.status, 1);
    assert.match(refused.stdout, /1-idea\.md not drafted yet — you approve what you read/);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('next: a legacy change refuses with the approve truth — schema-less and ungated alike', () => {
  const repo = makeRepo();
  try {
    // legacy shape one: no schema at all
    change(repo, 'legacy', 'status: proposed\n');
    const bare = run(repo, ['next', 'legacy']);
    assert.equal(bare.status, 1);
    assert.match(bare.stdout, /declares no schema — use: pios-gate approve legacy/);
    assert.equal(existsSync(repo.log), false);

    // legacy shape two: a declared schema with no gates
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'plain'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'plain', 'schema.yaml'),
      'name: plain\nartifacts:\n  - id: a\n    generates: 1-a.md\n',
    );
    change(repo, 'plain', 'schema: plain\nstatus: proposed\n');
    const ungated = run(repo, ['next', 'plain']);
    assert.equal(ungated.status, 1);
    assert.match(ungated.stdout, /declares no gates — use: pios-gate approve plain/);
    assert.equal(existsSync(repo.log), false);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: x-requires-written — a deleted dependency file refuses the stamp', () => {
  const repo = makeRepo();
  try {
    mkdirSync(join(repo.dir, 'openspec', 'schemas', 'ev'), { recursive: true });
    writeFileSync(
      join(repo.dir, 'openspec', 'schemas', 'ev', 'schema.yaml'),
      'name: ev\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-grant-verb: seal\n    x-requires-approval: [a]\n    x-requires-written: [a]\n',
    );
    change(repo, 'e1', 'schema: ev\nstatus: proposed\n');
    draft(repo, 'e1', '1-a.md', '# A\n');
    draft(repo, 'e1', '2-b.md', '# B\n');
    assert.equal(run(repo, ['approve', 'e1', 'a']).status, 0);
    // evidence vanished after its grant: the next stamp refuses (fail-safe)
    rmSync(join(repo.dir, 'openspec', 'changes', 'e1', '1-a.md'));
    const seal = run(repo, ['next', 'e1']);
    assert.equal(seal.status, 1);
    assert.match(seal.stdout, /2-b\.md awaits declared evidence: 1-a\.md not on disk/u);
    assert.equal(existsSync(repo.log), false, 'refusals never forward to openspec');
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('cockpit: ticked commits without a hash are visible debt', () => {
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
    for (let i = 0; i < 5; i += 1) {
      assert.equal(run(repo, ['next', 'm1']).status, 0);
    }
    const pending = run(repo, ['pending']);
    assert.match(pending.stdout, /1 unhashed commits/u); // empty hash slot = debt; abc123 = receipt
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: you approve what you read — undrafted artifacts refuse', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    const first = run(repo, ['next', 'm1']);
    assert.equal(first.status, 0);
    const deal = run(repo, ['grant', 'm1', 'proposition']);
    assert.equal(deal.status, 1);
    assert.match(deal.stdout, /2-proposition.md not drafted yet/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: approve <slug> <step> is per-step; bare approve refuses on gated schemas', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    draft(repo, 'm1', '3-proposal.md', '## Done when\n');
    draft(repo, 'm1', '4-plan.md', '# Plan\n');
    draft(repo, 'm1', '5-execution.md', '# Execution\n');
    assert.equal(run(repo, ['approve', 'm1', 'idea']).status, 0);
    assert.equal(run(repo, ['approve', 'm1', 'proposition']).status, 0);

    // Human ruling 2026-10-23: a single approve for all steps is
    // unacceptable — bare approve refuses and stamps NOTHING (the
    // fail-open regression: intent never approves more than its scope)
    const bare = run(repo, ['approve', 'm1']);
    assert.equal(bare.status, 1);
    assert.match(bare.stdout, /is gated — approve is per-step/);
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'm1', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted: idea,proposition\n/);
    assert.doesNotMatch(meta, /status: approved/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('cockpit: pending shows grant marks and the next grant; show is verbose', () => {
  const repo = gatedRepo();
  try {
    draft(repo, 'm1', '1-idea.md', 'why');
    draft(repo, 'm1', '2-proposition.md', 'Claim: x\n');
    run(repo, ['next', 'm1']);
    const pending = run(repo, ['pending']);
    assert.match(pending.stdout, /\[gated\] ✓◻···/);
    assert.match(pending.stdout, /read 2-proposition\.md → pios-gate next m1/);

    const show = run(repo, ['inspect', 'm1']);
    assert.match(show.stdout, /change: m1 · schema: gated/);
    assert.match(show.stdout, /structure ✓/);
    assert.match(show.stdout, /next human act: read 2-proposition\.md/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('grants: focus aims, ungated schema refuses grants politely', () => {
  const repo = makeRepo();
  try {
    change(repo, 'legacy', 'status: proposed\n');
    const focus = run(repo, ['focus']);
    assert.equal(focus.status, 0);
    assert.match(focus.stdout, /no focus — pios-gate <slug>/);
    const verb = run(repo, ['grant', 'legacy', 'a']);
    assert.equal(verb.status, 1); // grant refused, not a usage error
    assert.match(verb.stdout, /schema declares no gates/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

// ── cli-schema-tag-parity — the SHIPPED schemas through the CLI ────────
// F6 closed: no fixture ever parsed a shipped schema through the bin
// parser. These pin the live 2026-10-23 symptoms on the real thing.

function shippedRepo(): Repo {
  const repo = makeRepo();
  for (const name of ['spec']) {
    const dir = join(repo.dir, 'openspec', 'schemas', name);
    mkdirSync(dir, { recursive: true });
    copyFileSync(
      join(import.meta.dirname, '..', 'openspec', 'schemas', name, 'schema.yaml'),
      join(dir, 'schema.yaml'),
    );
  }
  return repo;
}

function specChange(repo: Repo, slug: string): void {
  change(repo, slug, 'schema: spec\nstatus: proposed\ncreated_by: assistant\n');
  draft(repo, slug, '1-brainstorm.md', '# Brainstorm\n\n## Pain\n\nfixture\n\n## Questions\n\n- fixture\n');
}

test('parity live: the declared verbs are gone — rung words forward verbatim', () => {
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

test('parity live: grant <slug> <step> on the shipped spec schema', () => {
  const repo = shippedRepo();
  try {
    specChange(repo, 'fx');
    const g = run(repo, ['grant', 'fx', 'brainstorm']);
    assert.equal(g.status, 0, g.stdout);
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'fx', '.openspec.yaml'), 'utf8');
    assert.match(meta, /granted_brainstorm:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('parity live: bare approve refuses on the shipped spec schema — fail-open pinned', () => {
  const repo = shippedRepo();
  try {
    specChange(repo, 'fx');
    const bare = run(repo, ['approve', 'fx']);
    assert.equal(bare.status, 1);
    assert.match(bare.stdout, /'spec' is gated — approve is per-step/);
    const meta = readFileSync(join(repo.dir, 'openspec', 'changes', 'fx', '.openspec.yaml'), 'utf8');
    assert.doesNotMatch(meta, /status: approved/); // the 2026-10-23 fail-open, pinned dead
    assert.doesNotMatch(meta, /approved_at:/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});
