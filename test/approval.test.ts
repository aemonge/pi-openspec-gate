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
    '   confirm: pios-gate confirm <slug>   ← your terminal',
    '   or reply literally: VALID',
  ].join('\n'),
  archive: [
    '⛔ archive requires an approved change',
    '   approve: pi-openspec-gate approve <slug>   ← your terminal',
    '   or pass --i-am-the-human',
  ].join('\n'),
  unapproved: [
    '⛔ focused change is not approved — attribution is not approval',
    '   approve: pi-openspec-gate approve <slug>   ← your terminal',
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
      'name: teeth\nartifacts:\n  - id: tasks\n    generates: 4-tasks.md\n    x-verdict-line: Human validation\n    x-receives-receipts: true\n',
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
      exempt: [{ prefix: '**/openspec/**', category: 'ladder-artifacts' }],
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
    writeChangeMeta(root, 'c1', { status: 'approved' });
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
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.unapproved.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'approval-touch');
  });

  test('approval-touch guard: pios-gate approve|confirm blocked; validate forwards freely', async () => {
    const { fire, ctx } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { status: 'approved' });
    for (const command of [
      'pios-gate approve c1',
      'pios-gate confirm c1',
      './bin/pios-gate approve c1',
      'node bin/pios-gate.ts confirm c1 | tail -1',
    ]) {
      const blocked = await fire('tool_call', { toolName: 'bash', input: { command } }, ctx);
      assert.deepEqual(blocked, { block: true, reason: BLOCK_APPROVAL_TOUCH }, command);
    }
    // validate under the new name is openspec's structure lint — read-only passthrough
    const lint = await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'pios-gate validate c1' } },
      ctx,
    );
    assert.equal(lint, undefined, 'pios-gate validate forwards to openspec lint — not a human act');
  });

  test('enforce: focused-but-unapproved change blocks source mutations', async () => {
    const { fire, ctx, entries } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { status: 'proposed' });
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_UNAPPROVED });
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.unapproved.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'source-mutation');
  });

  test('enforce: docs stay exempt regardless of approval (drafting never blocked)', async () => {
    const { fire, ctx } = freshGate();
    focusOn('c1');
    writeChangeMeta(root, 'c1', { status: 'proposed' });
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
    writeChangeMeta(root, 'c1', { status: 'approved' });
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
    assert.ok(entries.some((e) => e.customType === 'pi-openspec-gate.attributed.v1'));
    await new Promise((r) => setTimeout(r, 30));
    const receipt = readFileSync(join(repo, 'openspec', 'changes', 'c1', '4-tasks.md'), 'utf8');
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
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.humangate.v1');
    assert.equal((fact!.data as { permit: string }).permit, 'none');
  });

  test('human-gate: meta `validated` is a standing permit', async () => {
    const { fire, ctx, entries } = freshGate();
    writeChangeMeta(root, 'c1', { validated: '2026-10-17T12:00:00Z' });
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
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.humangate.v1');
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
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.humangate.v1');
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
    writeChangeMeta(root, 'c1', { status: 'proposed' });
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
    writeChangeMeta(root, 'c1', { status: 'approved' });
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
    await fire('message_end', { message: { role: 'assistant', content: 'created' } }, ctx);
    assert.ok(existsSync(metaFile), 'meta stamped after the call completed');
    const meta = readChangeMeta(root, 'fresh-one');
    assert.equal(meta.status, 'proposed');
    assert.equal(meta.raw.created_by, 'assistant');
    assert.ok(entries.some((e) => e.customType === 'pi-openspec-gate.creation-stamped.v1'));
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
      entries.some((e) => e.customType === 'pi-openspec-gate.creation-stamped.v1'),
      false,
      'nothing stamped for a creation that never landed',
    );
  });

  test('meta writer: set-only stamps never overwrite; human keys preserved', () => {
    writeChangeMeta(root, 'c1', { status: 'approved', approved_at: '2026-10-17T12:00:00Z' });
    writeChangeMeta(root, 'c1', { status: 'proposed' }, { onlyIfAbsent: true });
    const meta = readChangeMeta(root, 'c1');
    assert.equal(meta.status, 'approved', 'existing value wins over stamp');
    assert.equal(meta.raw.approved_at, '2026-10-17T12:00:00Z');
  });

  test('teeth off (legacy config): unapproved focus attributes as before', async () => {
    const { fire, ctx } = freshGate({ enforce: false, humanGateSteps: false, archiveGuard: false, stampCreations: false });
    focusOn('c1');
    writeChangeMeta(root, 'c1', { status: 'proposed' });
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
  });
});
