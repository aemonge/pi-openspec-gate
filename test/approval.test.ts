import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import {
  createGate,
  BLOCK_APPROVAL_TOUCH,
  BLOCK_HUMANGATE,
  BLOCK_ARCHIVE,
  BLOCK_UNAPPROVED,
  flipsVerdictLine,
} from '../src/gate.ts';
import { changeMetaPath, readChangeMeta, writeChangeMeta } from '../src/approval.ts';
import type { GateConfig } from '../src/config.ts';
import { OPENSPEC_FOCUS_ENTRY_TYPE } from '../src/focus.ts';

/** Exact copies from the Execution artifact — the gate must byte-match them. */
const EXPECTED = {
  touch: [
    '⛔ approval is human-terminal only',
    '   the assistant cannot approve or validate — ask the human',
  ].join('\n'),
  humangate: [
    '⛔ human-validation flip requires a human act',
    '   tick it yourself — your hand, your file — or reply literally: VALID',
    '   then: eospec close',
  ].join('\n'),
  archive: [
    '⛔ archive requires an approved change',
    '   the human closes it: eospec close   ← your terminal',
    '   or pass --i-am-the-human',
  ].join('\n'),
  unapproved: [
    '⛔ focused change is not approved — attribution is not approval',
    '   advance: eospec approve   ← your terminal',
    '   docs:    openspec/** stays exempt — drafting is never blocked',
  ].join('\n'),
};

const TEETH_ON = { enforce: true, humanGateSteps: true, archiveGuard: true, stampCreations: true };

type AnyHandler = (event: never, ctx: never) => unknown;

function makeFakePi() {
  const handlers = new Map<string, AnyHandler[]>();
  const entries: { type: string; customType?: string; data?: unknown }[] = [];
  const pi = {
    on(event: string, handler: AnyHandler) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    appendEntry(customType: string, data?: unknown) {
      entries.push({ type: 'custom', customType, data });
    },
    getAllTools() {
      return [{ name: 'edit' }, { name: 'write' }, { name: 'bash' }];
    },
  };
  const fire = async (event: string, e: unknown, ctx: unknown) => {
    let result: unknown;
    for (const handler of handlers.get(event) ?? []) {
      result = await handler(e as never, ctx as never);
    }
    return result;
  };
  return { pi, entries, fire };
}

describe('approval teeth: attribution is not approval', () => {
  let repo: string;
  let root: string; // openspec root inside the temp repo
  let sessionEntries: { type: string; customType?: string; data?: unknown }[];

  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'gate-approval-'));
    root = join(repo, 'openspec');
    mkdirSync(join(root, 'changes', 'c1'), { recursive: true });
    writeFileSync(join(root, 'changes', 'c1', '4-tasks.md'), '# Tasks\n', 'utf8');
    // the schema carries the declarations the guard reads: verdict line +
    // receipt target — the engine carries none of it
    mkdirSync(join(root, 'schemas', 'teeth'), { recursive: true });
    writeFileSync(
      join(root, 'schemas', 'teeth', 'schema.yaml'),
      'name: teeth\nartifacts:\n  - id: tasks\n    generates: 4-tasks.md\n    x-verdict-line: Human validation\n',
      'utf8',
    );
    writeChangeMeta(root, 'c1', { schema: 'teeth' });
    sessionEntries = [];
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  function freshGate(approval = TEETH_ON) {
    const fake = makeFakePi();
    const config: GateConfig = {
      enabled: true,
      approval,
      exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
    };
    createGate(fake.pi as never, config);
    const ctx = { cwd: repo, sessionManager: { getEntries: () => sessionEntries } };
    return { ...fake, ctx };
  }

  function focusOn(change: string) {
    sessionEntries.push({
      type: 'custom',
      customType: OPENSPEC_FOCUS_ENTRY_TYPE,
      data: { mode: 'task', change, taskId: '1' },
    });
  }

  test('block copies byte-match the Execution artifact', () => {
    assert.equal(BLOCK_APPROVAL_TOUCH, EXPECTED.touch);
    assert.equal(BLOCK_HUMANGATE, EXPECTED.humangate);
    assert.equal(BLOCK_ARCHIVE, EXPECTED.archive);
    assert.equal(BLOCK_UNAPPROVED, EXPECTED.unapproved);
  });

  test('approval-touch guard: tool calls cannot run the approver — even piped to a read-only verb', async () => {
    const { fire, ctx, entries } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'approved' });
    const result = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'pi-openspec-gate approve c1 | tail -1' } },
      ctx,
    );
    assert.deepEqual(result, { block: true, reason: BLOCK_APPROVAL_TOUCH });
    const tsForm = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'node bin/pi-openspec-gate.ts validate c1' } },
      ctx,
    );
    assert.deepEqual(tsForm, { block: true, reason: BLOCK_APPROVAL_TOUCH });
    const fact = entries.find((e) => e.customType === 'gate.unapproved');
    assert.equal((fact!.data as { kind: string }).kind, 'approval-touch');
  });

  test('approval-touch guard: approve|close blocked; validate forwards freely', async () => {
    const { fire, ctx } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'approved' });
    for (const command of [
      'eospec approve c1',
      'eospec close',
      './bin/eospec close',
      'node bin/pios-gate.js approve c1 | tail -1',
      'pi-openspec-gate approve c1',
    ]) {
      const blocked = await fire('tool_call', { toolName: 'bash', input: { command } }, ctx);
      assert.deepEqual(blocked, { block: true, reason: BLOCK_APPROVAL_TOUCH }, command);
    }
    // validate under the new name is openspec's structure lint — read-only passthrough
    const lint = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'eospec validate c1' } },
      ctx,
    );
    assert.equal(lint, undefined, 'eospec validate forwards to openspec lint — not a human act');
  });

  test('enforce: focused-but-unapproved change blocks source mutations', async () => {
    const { fire, ctx, entries } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'proposed' });
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_UNAPPROVED });
    const fact = entries.find((e) => e.customType === 'gate.unapproved');
    assert.equal((fact!.data as { kind: string }).kind, 'source-mutation');
  });

  test('enforce: docs stay exempt regardless of approval (drafting never blocked)', async () => {
    const { fire, ctx } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'proposed' });
    const pass = await fire(
      'tool_call',
      { toolName: 'write', input: { path: 'openspec/changes/c1/2-plan.md' } },
      ctx,
    );
    assert.equal(pass, undefined);
  });

  test('enforce: approved change attributes normally', async () => {
    const { fire, ctx, entries } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'approved' });
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
    assert.ok(entries.some((e) => e.customType === 'gate.attributed'));
    await new Promise((r) => setTimeout(r, 30));
    const receipt = readFileSync(join(repo, 'openspec', 'changes', 'c1', '.ledger'), 'utf8');
    assert.match(receipt, /gate-attributed · tool: write/u);
  });

  test('human-gate: [x] flip on a Human validation line blocks without a permit', async () => {
    const { fire, ctx, entries } = freshGate();
    const result = await fire(
      'tool_call',
      {
        toolName: 'edit',
        input: {
          path: 'openspec/changes/c1/4-tasks.md',
          oldText: '- [ ] Step 9 — Human validation — evidence review',
          newText: '- [x] Step 9 — Human validation — evidence review',
        },
      },
      ctx,
    );
    assert.deepEqual(result, { block: true, reason: BLOCK_HUMANGATE });
    const fact = entries.find((e) => e.customType === 'gate.human-gate');
    assert.equal((fact!.data as { permit: string }).permit, 'none');
  });

  test('human-gate: meta `validated` is a standing permit', async () => {
    const { fire, ctx, entries } = freshGate();
    writeChangeMeta(root, 'c1', { 'x-validated': '2026-10-17T12:00:00Z' });
    const pass = await fire(
      'tool_call',
      {
        toolName: 'edit',
        input: {
          path: 'openspec/changes/c1/4-tasks.md',
          oldText: '- [ ] Step 9 — Human validation — evidence review',
          newText: '- [x] Step 9 — Human validation — evidence review',
        },
      },
      ctx,
    );
    assert.equal(pass, undefined);
    const fact = entries.find((e) => e.customType === 'gate.human-gate');
    assert.equal((fact!.data as { permit: string }).permit, 'meta');
  });

  test('human-gate: literal VALID reply latches exactly one flip', async () => {
    rmSync(changeMetaPath(root, 'c1'), { force: true }); // isolate from prior tests
    writeChangeMeta(root, 'c1', { schema: 'teeth' }); // the verdict line is schema-declared
    const { fire, ctx, entries } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'VALID' } }, ctx);
    const flip = (mark: string) =>
      fire('tool_call', {
        toolName: 'edit',
        input: {
          path: 'openspec/changes/c1/4-tasks.md',
          oldText: `- ${mark} Step 9 — Human validation — evidence review`,
          newText: `- ${mark === '[ ]' ? '[x]' : '[x]'} Step 9 — Human validation — evidence review`,
        },
      } as never, ctx);
    const first = await flip('[ ]');
    assert.equal(first, undefined, 'permitted flip passes');
    const fact = entries.find((e) => e.customType === 'gate.human-gate');
    assert.equal((fact!.data as { permit: string }).permit, 'valid-latch');
    // latch consumed: a second flip (new unchecked line) blocks again
    writeFileSync(join(repo, 'openspec', 'changes', 'c1', '4-tasks.md'), '- [ ] Step 10 — Human validation\n', 'utf8');
    const second = await fire(
      'tool_call',
      {
        toolName: 'edit',
        input: {
          path: 'openspec/changes/c1/4-tasks.md',
          oldText: '- [ ] Step 10 — Human validation',
          newText: '- [x] Step 10 — Human validation',
        },
      },
      ctx,
    );
    assert.deepEqual(second, { block: true, reason: BLOCK_HUMANGATE });
  });

  test('human-gate: ordinary step flips are untouched', async () => {
    const { fire, ctx } = freshGate();
    const pass = await fire(
      'tool_call',
      {
        toolName: 'edit',
        input: {
          path: 'openspec/changes/c1/4-tasks.md',
          oldText: '- [ ] Step 3 — classifier module',
          newText: '- [x] Step 3 — classifier module',
        },
      },
      ctx,
    );
    assert.equal(pass, undefined);
    assert.ok(flipsVerdictLine('- [x] Step 9 — Human validation — review', 'Human validation'));
    assert.ok(!flipsVerdictLine('- [x] Step 3 — classifier module', 'Human validation'));
  });

  test('archive guard: unapproved change blocks, approved or --i-am-the-human pass', async () => {
    const { fire, ctx } = freshGate({ ...TEETH_ON });
    writeChangeMeta(root, 'c1', { 'x-status': 'proposed' });
    const blocked = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec archive c1 -y --skip-specs' } },
      ctx,
    );
    assert.deepEqual(blocked, { block: true, reason: BLOCK_ARCHIVE });
    const human = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec archive c1 -y --skip-specs --i-am-the-human' } },
      ctx,
    );
    assert.notEqual(human, { block: true, reason: BLOCK_ARCHIVE });
    writeChangeMeta(root, 'c1', { 'x-status': 'approved' });
    const approved = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec archive c1 -y --skip-specs' } },
      ctx,
    );
    assert.notEqual(approved, { block: true, reason: BLOCK_ARCHIVE });
  });

  test('creation stamping: stamp lands after the call runs, never pre-creates', async () => {
    const { fire, ctx, entries } = freshGate();
    const pass = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec new change fresh-one --schema ramona-plan' } },
      ctx,
    );
    assert.equal(pass, undefined);
    const metaFile = join(repo, 'openspec', 'changes', 'fresh-one', '.openspec.yaml');
    assert.equal(existsSync(metaFile), false, 'no pre-created meta — openspec\'s scaffolder runs freely');
    // openspec runs (the real command creates the dir); then the turn ends
    mkdirSync(join(repo, 'openspec', 'changes', 'fresh-one'), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', 'fresh-one', '1-brainstorm.md'), '> Spec: <!-- slug -->\n');
    await fire('message_end', { message: { role: 'assistant', content: 'created' } }, ctx);
    assert.ok(existsSync(metaFile), 'meta stamped after the call completed');
    const meta = readChangeMeta(root, 'fresh-one');
    assert.equal(meta.status, 'proposed');
    assert.equal(meta.raw['x-created_by'], 'assistant');
    assert.ok(entries.some((e) => e.customType === 'gate.creation-stamped'));
    assert.equal(
      readFileSync(join(repo, 'openspec', 'changes', 'fresh-one', '1-brainstorm.md'), 'utf8'),
      '> Spec: fresh-one\n',
      'the stamp fills <!-- slug --> in template copies',
    );
    const room = readFileSync(join(repo, 'openspec', '.focus'), 'utf8');
    assert.match(room, /change: fresh-one/, 'the room follows a birth: an unaimed room aims its first change');
  });

  test('creation stamping: wrapper form witnessed too; no dir → no stamp', async () => {
    const { fire, ctx, entries } = freshGate();
    const pass = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'pios-gate new change wrapped-one --schema ramona-plan' } },
      ctx,
    );
    assert.equal(pass, undefined, 'wrapper creation passes (normalized to openspec)');
    // command "failed" to create the dir — no message_end stamp either
    await fire('message_end', { message: { role: 'assistant', content: 'done' } }, ctx);
    assert.equal(existsSync(join(repo, 'openspec', 'changes', 'wrapped-one')), false);
    assert.equal(
      entries.some((e) => e.customType === 'gate.creation-stamped'),
      false,
      'nothing stamped for a creation that never landed',
    );
  });

  test('meta writer: set-only stamps never overwrite; human keys preserved', () => {
    writeChangeMeta(root, 'c1', { 'x-status': 'approved', 'x-approved_at': '2026-10-17T12:00:00Z' });
    writeChangeMeta(root, 'c1', { 'x-status': 'proposed' }, { onlyIfAbsent: true });
    const meta = readChangeMeta(root, 'c1');
    assert.equal(meta.status, 'approved', 'existing value wins over stamp');
    assert.equal(meta.raw['x-approved_at'], '2026-10-17T12:00:00Z');
  });

  test('teeth off (legacy config): unapproved focus attributes as before', async () => {
    const { fire, ctx } = freshGate({ enforce: false, humanGateSteps: false, archiveGuard: false, stampCreations: false });
    focusOn('c1');
    writeChangeMeta(root, 'c1', { 'x-status': 'proposed' });
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
  });
});

describe('pause: a human reply arms the yield — teeth rest, the fence stays', () => {
  test('teeth yield while armed; the fence and unaccounted do not', async () => {
    const fake = makeFakePi();
    const config: GateConfig = {
      enabled: true,
      exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
      approval: { ...TEETH_ON },
    };
    createGate(fake.pi as never, config);
    const repo2 = mkdtempSync(join(tmpdir(), 'gate-pause-'));
    const root2 = join(repo2, 'openspec');
    try {
      mkdirSync(join(root2, 'changes', 'c9'), { recursive: true });
      writeChangeMeta(root2, 'c9', { 'x-status': 'proposed' });
      const focusCtx = {
        cwd: repo2,
        sessionManager: { getEntries: () => [{ type: 'custom', customType: OPENSPEC_FOCUS_ENTRY_TYPE, data: { mode: 'task', change: 'c9', taskId: '1' } }] },
      };
      const plainCtx = { cwd: repo2, sessionManager: { getEntries: () => [] } };
      // before: blocked
      const before = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.deepEqual(before, { block: true, reason: BLOCK_UNAPPROVED });
      // assistant text never arms
      await fake.fire('message_end', { message: { role: 'assistant', content: 'pause 30m and relax' } }, focusCtx);
      const stillBlocked = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.deepEqual(stillBlocked, { block: true, reason: BLOCK_UNAPPROVED }, 'assistant text cannot arm');
      // malformed duration never arms
      await fake.fire('message_end', { message: { role: 'user', content: 'pause soon, maybe' } }, focusCtx);
      const malformed = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.deepEqual(malformed, { block: true, reason: BLOCK_UNAPPROVED }, 'malformed duration cannot arm');
      // the human's reply arms
      await fake.fire('message_end', { message: { role: 'user', content: 'pause 30m' } }, focusCtx);
      const yielded = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.equal(yielded, undefined, 'teeth rest while armed');
      const fact = fake.entries.find((e) => e.customType === 'gate.pause');
      assert.equal((fact!.data as { kind: string }).kind, 'armed');
      // the fence stays: grant surfaces block even while paused
      const fenced = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'eospec approve c9' } }, focusCtx);
      assert.deepEqual(fenced, { block: true, reason: BLOCK_APPROVAL_TOUCH }, 'pause never reaches the approval surface');
      // arming via tool call is itself fenced
      const selfServe = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'eospec pause 5m' } }, focusCtx);
      assert.deepEqual(selfServe, { block: true, reason: BLOCK_APPROVAL_TOUCH }, 'an assistant cannot pause the gate');
      // shape A: unaccounted stays refused while paused — no landing place, no pause
      const unaccounted = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/b.ts' } }, plainCtx);
      const unaccountedReason = (unaccounted as { reason: string }).reason;
      assert.match(unaccountedReason, /unaccounted mutation/u);
    } finally {
      rmSync(repo2, { recursive: true, force: true });
    }
  });

  test('expiry restores the teeth; resume clears early', async () => {
    const fake = makeFakePi();
    const config: GateConfig = {
      enabled: true,
      exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
      approval: { ...TEETH_ON, pauseCeiling: 60 },
    };
    createGate(fake.pi as never, config);
    const repo2 = mkdtempSync(join(tmpdir(), 'gate-pause-expiry-'));
    const root2 = join(repo2, 'openspec');
    try {
      mkdirSync(join(root2, 'changes', 'c9'), { recursive: true });
      writeChangeMeta(root2, 'c9', { 'x-status': 'proposed' });
      const focusCtx = {
        cwd: repo2,
        sessionManager: { getEntries: () => [{ type: 'custom', customType: OPENSPEC_FOCUS_ENTRY_TYPE, data: { mode: 'task', change: 'c9', taskId: '1' } }] },
      };
      // 99h clamps to the 60ms ceiling
      await fake.fire('message_end', { message: { role: 'user', content: 'pause 99h' } }, focusCtx);
      const yielded = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.equal(yielded, undefined, 'armed (clamped to ceiling)');
      await new Promise((resolve) => setTimeout(resolve, 90));
      const after = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.deepEqual(after, { block: true, reason: BLOCK_UNAPPROVED }, 'expiry restores the teeth');
      const expired = fake.entries.find((e) => e.customType === 'gate.pause' && (e.data as { kind: string }).kind === 'expired');
      assert.ok(expired, 'the expiry is a recorded fact');
      // resume clears early
      await fake.fire('message_end', { message: { role: 'user', content: 'pause 1h' } }, focusCtx);
      await fake.fire('message_end', { message: { role: 'user', content: 'resume' } }, focusCtx);
      const resumed = await fake.fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusCtx);
      assert.deepEqual(resumed, { block: true, reason: BLOCK_UNAPPROVED }, 'resume clears the permit');
    } finally {
      rmSync(repo2, { recursive: true, force: true });
    }
  });
});

describe('state-aware blocks: gated changes never hear approve', () => {
  let repo: string;
  let root: string;

  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'gate-stateaware-'));
    root = join(repo, 'openspec');
    mkdirSync(join(root, 'changes', 'g1'), { recursive: true });
    mkdirSync(join(root, 'changes', 'l1'), { recursive: true }); // legacy: no schema
    mkdirSync(join(root, 'schemas', 'runway'), { recursive: true });
    writeFileSync(
      join(root, 'schemas', 'runway', 'schema.yaml'),
      'name: runway\nartifacts:\n  - id: brief\n    generates: 1-brief.md\n  - id: dig\n    generates: 2-dig.md\n    x-grant-verb: dig\n    x-requires-approval: [brief]\n',
      'utf8',
    );
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  function freshGate(approval = TEETH_ON) {
    const fake = makeFakePi();
    const config: GateConfig = {
      enabled: true,
      approval,
      exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
    };
    createGate(fake.pi as never, config);
    const ctx = { cwd: repo, sessionManager: { getEntries: () => [] } };
    return { ...fake, ctx };
  }

  function focusOn(change: string) {
    const entries = [{ type: 'custom', customType: OPENSPEC_FOCUS_ENTRY_TYPE, data: { mode: 'task', change, taskId: '1' } }];
    return { cwd: repo, sessionManager: { getEntries: () => entries } };
  }

  test('teeth: the first rung advances by the gate\'s own word', async () => {
    const { fire } = freshGate();
    writeChangeMeta(root, 'g1', { schema: 'runway', 'x-status': 'proposed' });
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusOn('g1'));
    const reason = (result as { reason: string }).reason;
    assert.match(reason, /⛔ focused change is not approved/u);
    assert.match(reason, /advance: eospec approve/u);
  });

  test('teeth: a declared artifact advances by its verb', async () => {
    const { fire } = freshGate();
    mkdirSync(join(root, 'changes', 'g2'), { recursive: true });
    writeChangeMeta(root, 'g2', { schema: 'runway', 'x-status': 'proposed', 'x-granted': 'brief' });
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusOn('g2'));
    const reason = (result as { reason: string }).reason;
    assert.match(reason, /advance: eospec approve/u);
  });

  test('teeth: the writes gate names its artifact — the state a cold agent misreads', async () => {
    const { fire } = freshGate();
    mkdirSync(join(root, 'schemas', 'gated-writes'), { recursive: true });
    writeFileSync(
      join(root, 'schemas', 'gated-writes', 'schema.yaml'),
      'name: gated-writes\nartifacts:\n  - id: brainstorm\n    generates: 1-brainstorm.md\n  - id: investigate\n    generates: 2-investigate.md\n    x-requires-approval: [brainstorm]\n  - id: plan\n    generates: 3-plan.md\n    x-requires-approval: [investigate]\n    x-unlocks: [writes]\n  - id: execute\n    generates: 4-execute.md\n    x-requires-approval: [plan]\n',
      'utf8',
    );
    mkdirSync(join(root, 'changes', 'g4'), { recursive: true });
    writeChangeMeta(root, 'g4', { schema: 'gated-writes', 'x-status': 'proposed', 'x-granted': 'brainstorm,investigate' });
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusOn('g4'));
    const reason = (result as { reason: string }).reason;
    assert.match(reason, /writes:\s+locked until 'plan' is approved/u, reason ?? 'no reason');
    assert.match(reason, /advance: eospec approve/u);
  });

  test('archive guard: gated change advances, legacy stays byte-identical', async () => {
    const { fire } = freshGate();
    mkdirSync(join(root, 'changes', 'g3'), { recursive: true });
    writeChangeMeta(root, 'g3', { schema: 'runway', 'x-status': 'proposed' });
    const gated = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec archive g3 -y' } },
      { cwd: repo, sessionManager: { getEntries: () => [] } },
    );
    const gatedReason = (gated as { reason: string }).reason;
    assert.match(gatedReason, /advance: eospec approve/u);
    // the legacy change (no schema) keeps the byte-matched copy
    writeChangeMeta(root, 'l1', { 'x-status': 'proposed' });
    const legacy = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'openspec archive l1 -y' } },
      { cwd: repo, sessionManager: { getEntries: () => [] } },
    );
    assert.deepEqual(legacy, { block: true, reason: BLOCK_ARCHIVE });
  });

  test('a dangling focus names itself — archived or removed changes are not silence', async () => {
    const { fire } = freshGate();
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, focusOn('gone'));
    const reason = (result as { reason: string }).reason;
    assert.match(reason, /dangling: focused change 'gone' was archived or removed/u);
    assert.match(reason, /re-aim focus at a live change/u);
  });

  test('bash is never path-exempt — the matcher law holds for openspec paths too', async () => {
    const { fire } = freshGate();
    writeChangeMeta(root, 'g1', { schema: 'runway', 'x-status': 'proposed' });
    // the docs exemption is edit/write drafting; a bash call's path
    // enumeration is never exemption-eligible (exemptions.ts: bash excluded
    // by construction) — so staging under openspec/ still hits the teeth
    const blocked = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'git add openspec/learnings/skills.md' } },
      focusOn('g1'),
    );
    assert.match((blocked as { reason: string }).reason, /advance: eospec approve/u);
    const blocked2 = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'git add src/a.ts' } },
      focusOn('g1'),
    );
    assert.match((blocked2 as { reason: string }).reason, /advance: eospec approve/u, 'non-openspec bash mutates and blocks the same way');
  });
});
