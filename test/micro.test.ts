/**
 * The micro law — plan model, gate states, declared door, classifier.
 *
 * plan.md is the micro schema's one artifact: checkbox counts exclude
 * the declared verdict line (the human's act is never agent work),
 * `### ` headings are slices, and `slice-gates: true` opts into
 * per-slice pausing. The twins (src/plan.ts, bin/gate-lib.js) must
 * agree — contract-tested here.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { parsePlan, planComplete } from '../src/plan.ts';
import { parsePlan as parsePlanBin, parseSchemaYaml as parseSchemaYamlBin } from '../bin/gate-lib.js';
import { findSchemaFile, parseSchemaYaml } from '../src/schema.ts';
import { sliceBoundary, blockMicroDraft, blockMicroVerifying, blockMicroSlice } from '../src/gate.ts';
import { createGate } from '../src/gate.ts';
import { classifyMutation, isVerificationCommand } from '../src/classifier.ts';
import type { GateConfig } from '../src/config.ts';

const REPO_ROOT = join(import.meta.dirname, '..');

const SAMPLE = [
  '# p',
  '',
  '## Tasks',
  '',
  '- [ ] a',
  '- [x] b',
  'slice-gates: true',
  '',
  '### Slice: one',
  '- [x] c',
  '',
  '### Slice: two',
  '- [ ] d',
  '',
  '## Verification',
  '',
  '- [ ] checks pass',
  '- [x] Hands-on validation',
  '',
].join('\n');

describe('plan model: the one-artifact math', () => {
  test('checkbox counts exclude the verdict; slices carry their own', () => {
    const model = parsePlan(SAMPLE, 'Hands-on validation');
    assert.equal(model.open, 3, 'a · d · checks pass stay open');
    assert.equal(model.done, 2, 'b · c are done');
    assert.equal(model.verdictTicked, true, 'the verdict is tracked, never counted');
    assert.equal(model.sliceGates, true, 'the marker reads anywhere in the file');
    assert.deepEqual(model.slices.map((s) => [s.title, s.open, s.done]), [
      ['Slice: one', 0, 1],
      ['Slice: two', 1, 0],
    ]);
    assert.equal(planComplete(model), false);
  });

  test('completing every task flips the verifying line — the verdict still waits', () => {
    const done = parsePlan(SAMPLE.replaceAll('- [ ] ', '- [x] '), 'Hands-on validation');
    assert.equal(done.open, 0);
    assert.equal(planComplete(done), true);
    assert.equal(done.verdictTicked, true);
  });

  test('the doors split: declaresBare rides the schema, twins agree', () => {
    const file = findSchemaFile(join(REPO_ROOT, 'openspec'), 'micro');
    assert.ok(file, 'repo micro schema found');
    const yaml = readFileSync(file!, 'utf8');
    const src = parseSchemaYaml(yaml, file!);
    assert.deepEqual(src.declares, ['start the spec', 'skip the spec']);
    assert.deepEqual(src.declaresBare, ['skip the spec']);
    assert.deepEqual(parseSchemaYamlBin(yaml, file!).declaresBare, ['skip the spec'], 'twin carries declaresBare');
    assert.throws(
      () =>
        parseSchemaYaml(
          'name: s\nx-declares: [a]\nx-declares-bare: [b]\nartifacts:\n  - id: x\n    generates: x.md\n',
          'fixture',
        ),
      /not in x-declares/u,
      'a bare phrase outside the vocabulary fails loudly',
    );
  });

  test('the repo template parses — twins agree, the verdict ships unticked', () => {
    const text = readFileSync(join(REPO_ROOT, 'openspec', 'schemas', 'micro', 'templates', 'plan.md'), 'utf8');
    const src = parsePlan(text, 'Hands-on validation');
    const bin = parsePlanBin(text, 'Hands-on validation');
    assert.deepEqual(bin, src, 'twins agree');
    assert.equal(src.verdictTicked, false);
    assert.equal(src.sliceGates, false, 'the template mentions the marker in prose — it does not set it');
  });

  test('slice boundary: head tasks stay unlocked, done slices pause, all-done does not', () => {
    const model = parsePlan(SAMPLE, 'Hands-on validation');
    assert.equal(sliceBoundary(model, 0), undefined, 'head tasks (a · b) are open — coding continues');
    assert.deepEqual(sliceBoundary(model, 1), { done: 'Slice: one', next: 'Slice: two' });
    assert.equal(sliceBoundary(model, 2), undefined, 'mid-slice: coding continues');
    const allDone = parsePlan(SAMPLE.replaceAll('- [ ] ', '- [x] '), 'Hands-on validation');
    assert.equal(sliceBoundary(allDone, 2), undefined, 'everything ticked: verifying owns the lock now');
  });

  test('the block copy teaches the state remedies', () => {
    assert.match(blockMicroDraft('mx', 'plan.md'), /is drafting — source mutations locked/);
    assert.match(blockMicroDraft('mx', 'plan.md'), /open:    eospec approve/);
    assert.match(blockMicroVerifying('mx'), /verification commands only/);
    assert.match(blockMicroVerifying('mx'), /eospec close/);
    assert.match(blockMicroSlice('mx', 'one', 'two'), /coding paused at the slice boundary/);
    assert.match(blockMicroSlice('mx', 'one', 'two'), /eospec approve --all/);
  });
});

describe('classifier: conversation instruments and verification verbs', () => {
  const none = new Set<string>();
  test('asking the human a question mutates nothing', () => {
    const verdict = classifyMutation('ask_user_question', { questions: [] }, undefined, none);
    assert.equal(verdict.mutating, false, 'the gate never blocks a question to the human');
    assert.equal(verdict.basis, 'tool.known-read-only');
  });

  test('pi-lens diagnostics read-only under its real name', () => {
    const verdict = classifyMutation('lens_diagnostics', {}, undefined, none);
    assert.equal(verdict.mutating, false);
  });

  test('verification verbs anchor per segment — anything else stays fail-safe', () => {
    for (const good of [
      'npm test',
      'npm run check:openspec',
      'pnpm run lint',
      'node --test',
      'cargo test',
      'just check',
      'LC_ALL=C npm test',
      'npm test && pnpm run lint',
    ]) {
      assert.equal(isVerificationCommand(good), true, good);
    }
    for (const bad of ['', 'rm -rf x', 'npm test && git push', 'npm install', 'curl example.com']) {
      assert.equal(isVerificationCommand(bad), false, bad);
    }
  });
});

describe('gate: the four micro states', () => {
  let repo: string;
  let xdg: string;
  let prevData: string | undefined;
  let prevConfig: string | undefined;
  const entries: { type: string; customType?: string; data?: unknown }[] = [];

const MICRO_YAML = [
    'name: micro',
    'x-declares: [start the spec, skip the spec]',
    'x-declares-bare: [skip the spec]',
    'artifacts:',
    '  - id: plan',
    '    generates: plan.md',
    '    x-sections: [Goal, Tasks, Verification]',
    '    x-unlocks: [writes]',
    '    x-completes: approved',
    '    x-verdict-line: Hands-on validation',
    '',
  ].join('\n');

  function makeFakePi() {
    const handlers = new Map<string, (event: never, ctx: never) => unknown>();
    const appendEntry = (customType: string, data?: unknown) => {
      entries.push({ type: 'custom', customType, data });
    };
    const pi = {
      on(event: string, handler: (event: never, ctx: never) => unknown) {
        handlers.set(event, handler);
      },
      appendEntry,
      getAllTools() {
        return [{ name: 'edit' }, { name: 'write' }, { name: 'bash' }, { name: 'ask_user_question' }];
      },
    };
    const fire = async (event: string, e: unknown, ctx: unknown) =>
      handlers.get(event)?.(e as never, ctx as never);
    return { pi, fire };
  }

  function freshGate() {
    entries.length = 0;
    const fake = makeFakePi();
    const config: GateConfig = {
      enabled: true,
      exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
      approval: {
        enforce: true,
        humanGateSteps: true,
        archiveGuard: false,
        stampCreations: false,
        phaseGates: false,
      },
    };
    createGate(fake.pi as never, config);
    const ctx = { cwd: repo, sessionManager: { getEntries: () => [] } };
    return { fire: fake.fire, ctx };
  }

  const aim = (): void => {
    writeFileSync(join(repo, 'openspec', '.focus'), 'change: mx\n', 'utf8');
  };
  const planOf = (): string => join(repo, 'openspec', 'changes', 'mx', 'plan.md');
  const metaOf = (): string => join(repo, 'openspec', 'changes', 'mx', '.openspec.yaml');

  before(() => {
    // isolate the latch vocabulary from user-global schema homes — legacy
    // schemas elsewhere legitimately re-arm their own phrases, and this
    // suite's law must stay machine-independent
    xdg = mkdtempSync(join(tmpdir(), 'gate-micro-xdg-'));
    prevData = process.env.XDG_DATA_HOME;
    prevConfig = process.env.OPENSPEC_CONFIG_DIR;
    process.env.XDG_DATA_HOME = join(xdg, 'data');
    process.env.OPENSPEC_CONFIG_DIR = join(xdg, 'config');
    repo = mkdtempSync(join(tmpdir(), 'gate-micro-'));
    mkdirSync(join(repo, 'openspec', 'schemas', 'micro'), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'schemas', 'micro', 'schema.yaml'), MICRO_YAML, 'utf8');
    mkdirSync(join(repo, 'openspec', 'changes', 'mx'), { recursive: true });
    writeFileSync(metaOf(), 'schema: micro\n', 'utf8');
    writeFileSync(
      planOf(),
      ['# mx', '', '## Goal', '', 'tiny', '', '## Questions & Decisions', '', '## Tasks', '', '- [ ] first', '', '## Verification', '', '- [ ] checks pass', '- [ ] Hands-on validation', ''].join('\n'),
      'utf8',
    );
  });

  after(() => {
    if (prevData === undefined) delete process.env.XDG_DATA_HOME;
    else process.env.XDG_DATA_HOME = prevData;
    if (prevConfig === undefined) delete process.env.OPENSPEC_CONFIG_DIR;
    else process.env.OPENSPEC_CONFIG_DIR = prevConfig;
    rmSync(repo, { recursive: true, force: true });
    rmSync(xdg, { recursive: true, force: true });
  });

  test('draft: source mutations lock behind plan + approve', async () => {
    aim();
    const { fire, ctx } = freshGate();
    const blocked = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(blocked?.block, true);
    assert.match(blocked!.reason!, /is drafting — source mutations locked/);
    assert.match(blocked!.reason!, /eospec approve/);
  });

  test('declared door: the human phrase lands one mutation behind the draft wall', async () => {
    aim();
    rmSync(join(repo, 'openspec', 'bare-work.md'), { force: true });
    const { fire, ctx, } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'skip the spec' } }, ctx);
    const pass = await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx);
    assert.equal(pass, undefined, 'the latched phrase lands exactly one mutation');
    const bare = join(repo, 'openspec', 'bare-work.md');
    assert.ok(existsSync(bare), 'the debt line is written');
    assert.match(readFileSync(bare, 'utf8'), /^bare — skip the spec · at \d/u);
    // the latch is consumed: the next mutation blocks again
    const second = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/b.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
    };
    assert.equal(second?.block, true, 'one phrase, one mutation');
  });

  test('coding: approved → mutations attribute and receipt', async () => {
    aim();
    writeFileSync(metaOf(), 'schema: micro\nx-granted: plan\nx-granted_plan: 2026-11-19T00:00:00Z\nx-status: approved\nx-approved_at: 2026-11-19T00:00:00Z\n', 'utf8');
    const { fire, ctx, } = freshGate();
    const pass = await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx);
    assert.equal(pass, undefined);
    const fact = entries.find((e) => e.customType === 'gate.attributed');
    assert.ok(fact, 'attributed fact recorded');
    await new Promise((r) => setTimeout(r, 30));
    const receipt = readFileSync(join(repo, 'openspec', 'changes', 'mx', '.ledger'), 'utf8');
    assert.match(receipt, /gate-attributed · tool: edit · paths: [^\n]*src\/a\.ts/u);
  });

  test('verifying: all tasks ticked → source locks, verification passes, plan.md stays free', async () => {
    aim();
    writeFileSync(
      planOf(),
      ['# mx', '', '## Goal', '', 'tiny', '', '## Questions & Decisions', '', '## Tasks', '', '- [x] first', '', '## Verification', '', '- [x] checks pass', '- [ ] Hands-on validation', ''].join('\n'),
      'utf8',
    );
    const { fire, ctx } = freshGate();
    const locked = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(locked?.block, true, 'the source re-locks');
    assert.match(locked!.reason!, /is verifying — every task ticked — source locked/);
    const checks = await fire('tool_call', { toolName: 'bash', input: { command: 'npm test' } }, ctx);
    assert.equal(checks, undefined, 'verification commands pass, receipted');
    const free = await fire('tool_call', { toolName: 'write', input: { path: planOf(), content: '# mx\n' } }, ctx);
    assert.equal(free, undefined, 'plan.md stays editable — follow-up slices append there');
  });

  test('slice pause: the boundary names the next slice and --all answers', async () => {
    aim();
    writeFileSync(metaOf(), 'schema: micro\nx-granted: plan\nx-status: approved\nx-approved_at: 2026-11-19T00:00:00Z\nx-slice: 1\n', 'utf8');
    writeFileSync(
      planOf(),
      ['# mx', '', '## Goal', '', 'g', '', '## Questions & Decisions', '', '## Tasks', '', 'slice-gates: true', '', '### Slice: one', '', '- [x] a', '', '### Slice: two', '', '- [ ] b', '', '## Verification', '', '- [ ] checks pass', '- [ ] Hands-on validation', ''].join('\n'),
      'utf8',
    );
    const { fire, ctx } = freshGate();
    const paused = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(paused?.block, true, 'the boundary pauses coding');
    assert.match(paused!.reason!, /slice 'Slice: one' complete — coding paused at the slice boundary/);
    assert.match(paused!.reason!, /unlocks 'Slice: two'/);
    assert.match(paused!.reason!, /eospec approve --all/);
    // approving slice two re-opens coding
    writeFileSync(metaOf(), 'schema: micro\nx-granted: plan\nx-status: approved\nx-approved_at: 2026-11-19T00:00:00Z\nx-slice: 2\n', 'utf8');
    const pass = await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx);
    assert.equal(pass, undefined, 'the advance re-opens coding');
  });

  test('ceremony phrase arms nothing — the wall holds', async () => {
    aim();
    writeFileSync(metaOf(), 'schema: micro\n', 'utf8'); // draft state — no grants
    rmSync(join(repo, 'openspec', 'bare-work.md'), { force: true });
    const { fire, ctx } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'start the spec' } }, ctx);
    const blocked = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
    };
    assert.equal(blocked?.block, true, 'the ceremony phrase is instruction, not a latch');
    assert.ok(!entries.some((e) => e.customType === 'gate.declared'), 'no declared fact');
    assert.ok(!existsSync(join(repo, 'openspec', 'bare-work.md')), 'no debt line');
  });

  test('verifying memory: appended tasks stay locked until approve', async () => {
    aim();
    writeFileSync(metaOf(), 'schema: micro\nx-granted: plan\nx-status: approved\nx-approved_at: 2026-11-19T00:00:00Z\nx-verifying: 2026-11-19T00:00:00Z\n', 'utf8');
    // the follow-up: a new task appended while verifying (plan.md is free)
    writeFileSync(
      planOf(),
      ['# mx', '', '## Goal', '', 'tiny', '', '## Questions & Decisions', '', '## Tasks', '', '- [x] first', '- [ ] new follow-up', '', '## Verification', '', '- [x] checks pass', '- [ ] Hands-on validation', ''].join('\n'),
      'utf8',
    );
    const { fire, ctx } = freshGate();
    const locked = (await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(locked?.block, true, 'appended tasks do not auto-unlock — the memory holds');
    assert.match(locked!.reason!, /is verifying/);
    // the approve's law clears the memory (simulated — the bin owns it)
    writeFileSync(metaOf(), 'schema: micro\nx-granted: plan\nx-status: approved\nx-approved_at: 2026-11-19T00:00:00Z\n', 'utf8');
    const pass = await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts', oldText: 'x', newText: 'y' } }, ctx);
    assert.equal(pass, undefined, 'approve alone re-opens coding');
  });
});
