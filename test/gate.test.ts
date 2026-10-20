import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { createGate, BLOCK_MESSAGE, BLOCK_APPROVAL_TOUCH } from '../src/gate.ts';
import type { GateConfig } from '../src/config.ts';
import { OPENSPEC_FOCUS_ENTRY_TYPE } from '../src/focus.ts';

/** Exact copy from the Execution artifact — the gate must byte-match it. */
const EXPECTED_BLOCK_COPY = [
  '⛔ unaccounted mutation — no active change',
  '   focus:   set the focus fact via your cockpit/status tool',
  '   create:  openspec new change <slug> --schema mission',
  '   or say "action the job" / "execute the job" — recorded as declared work, proceeds',
].join('\n');

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
      return [
        { name: 'edit' },
        { name: 'write' },
        { name: 'bash' },
        { name: 'read', annotations: { readOnlyHint: true } },
      ];
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

describe('gate protocol: block → declare → attribute → exempt → inherit', () => {
  let repo: string;
  let sessionEntries: { type: string; customType?: string; data?: unknown }[];

  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'gate-repo-'));
    mkdirSync(join(repo, 'openspec', 'changes', 'c1'), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', 'c1', '4-tasks.md'), '# Tasks\n', 'utf8');
    sessionEntries = [];
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  function freshGate(config?: Partial<GateConfig>) {
    const fake = makeFakePi();
    createGate(fake.pi as never, {
      enabled: true,
      approval: config?.approval ?? {
        enforce: false,
        humanGateSteps: false,
        archiveGuard: false,
        stampCreations: false,
      },
      exempt: config?.exempt ?? [{ prefix: '**/openspec/**', category: 'ladder-artifacts' }],
    });
    const ctx = {
      cwd: repo,
      sessionManager: { getEntries: () => sessionEntries },
    };
    return { ...fake, ctx };
  }

  test('block: no focus, no declaration → exact copy + all three remedies + fact', async () => {
    const { fire, ctx, entries } = freshGate();
    const result = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_MESSAGE });
    assert.equal(BLOCK_MESSAGE, EXPECTED_BLOCK_COPY);
    const blocked = entries.find((e) => e.customType === 'pi-openspec-gate.blocked.v1');
    assert.ok(blocked, 'blocked fact recorded');
    assert.equal((blocked!.data as { tool: string }).tool, 'write');
  });

  test('declare: human "action the job" → one debt line, mutation proceeds', async () => {
    rmSync(join(repo, 'openspec', 'bare-work.md'), { force: true }); // fresh ledger per declare test
    const { fire, ctx, entries } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'action the job' } }, ctx);
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
    const bare = join(repo, 'openspec', 'bare-work.md');
    assert.ok(existsSync(bare), 'debt ledger exists');
    const lines = readFileSync(bare, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1, 'exactly one debt line');
    assert.match(lines[0], /^bare — action the job · at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u);
    assert.ok(entries.some((e) => e.customType === 'pi-openspec-gate.declared.v1'));
    // latch consumed: a second mutation blocks again
    const second = await fire('tool_call', { toolName: 'write', input: { path: 'src/b.ts' } }, ctx);
    assert.deepEqual(second, { block: true, reason: BLOCK_MESSAGE });
  });

  test('declare: legacy "do it" still latches one declared mutation', async () => {
    rmSync(join(repo, 'openspec', 'bare-work.md'), { force: true }); // fresh ledger per declare test
    const { fire, ctx, entries } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'do it' } }, ctx);
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
    const bare = join(repo, 'openspec', 'bare-work.md');
    assert.ok(existsSync(bare), 'debt ledger exists');
    const lines = readFileSync(bare, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1, 'exactly one debt line');
    assert.match(lines[0], /^bare — do it · at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u);
    assert.ok(entries.some((e) => e.customType === 'pi-openspec-gate.declared.v1'));
    // latch consumed: a second mutation blocks again
    const second = await fire('tool_call', { toolName: 'write', input: { path: 'src/b.ts' } }, ctx);
    assert.deepEqual(second, { block: true, reason: BLOCK_MESSAGE });
  });

  test('attribute: focus names an active change → receipt in 4-tasks.md', async () => {
    const { fire, ctx, entries } = freshGate();
    sessionEntries.push({
      type: 'custom',
      customType: OPENSPEC_FOCUS_ENTRY_TYPE,
      data: { mode: 'task', change: 'c1', taskId: 't1' },
    });
    const pass = await fire('tool_call', { toolName: 'edit', input: { path: 'src/a.ts' } }, ctx);
    assert.equal(pass, undefined);
    const fact = entries.find((e) => e.customType === 'pi-openspec-gate.attributed.v1');
    assert.ok(fact, 'attributed fact recorded');
    assert.equal((fact!.data as { change: string }).change, 'c1');
    await new Promise((r) => setTimeout(r, 30)); // serialized appends settle
    const receipt = readFileSync(join(repo, 'openspec', 'changes', 'c1', '4-tasks.md'), 'utf8');
    assert.match(receipt, /gate-attributed · tool: edit · paths: [^\n]*src\/a\.ts · at \d{4}-/u);
  });

  test('exempt: path-scoped write passes and leaves a fact with paths', async () => {
    const { fire, ctx, entries } = freshGate();
    const pass = await fire('tool_call', { toolName: 'write', input: { path: 'openspec/changes/c1/4-tasks.md' } }, ctx);
    assert.equal(pass, undefined);
    const exempt = entries.find((e) => e.customType === 'pi-openspec-gate.exempt.v1');
    assert.ok(exempt, 'exempt fact recorded');
    const data = exempt!.data as { category: string; paths: string[] };
    assert.equal(data.category, 'ladder-artifacts');
    assert.equal(data.paths.length, 1);
  });

  test('inherit: subagent child inherits parent focus via session file', async () => {
    // real pi layout: sessions root holds per-cwd dirs; the CHILD's own
    // getSessionDir() points at its own dir, the PARENT lives in a different
    // per-cwd dir under a `<ISO-timestamp>_<sessionId>.jsonl` name
    // (regressions: exact-name lookup never matched live files; single-root
    // lookup never escaped the child's own directory)
    const sessionsRoot = mkdtempSync(join(tmpdir(), 'gate-sessions-'));
    const parentDir = join(sessionsRoot, '--parent-repo--');
    const childDir = join(sessionsRoot, '--child-repo--');
    mkdirSync(parentDir, { recursive: true });
    mkdirSync(childDir, { recursive: true });
    writeFileSync(
      join(parentDir, '2026-10-17T08-00-00-000Z_parent-1.jsonl'),
      `${JSON.stringify({ type: 'custom', customType: OPENSPEC_FOCUS_ENTRY_TYPE, data: { mode: 'task', change: 'c1', taskId: 't9' } })}\n`,
      'utf8',
    );
    process.env.PI_SUBAGENT_DELEGATION = JSON.stringify({
      version: 1,
      childSessionId: 'child-1',
      parentSessionId: 'parent-1',
      agent: 'implementer',
    });
    try {
      const { fire, ctx, entries } = freshGate();
      await fire(
        'session_start',
        {},
        { cwd: repo, sessionManager: { getSessionDir: () => childDir } },
      );
      const inherited = entries.find((e) => e.customType === 'pi-openspec-gate.inherited.v1');
      assert.ok(inherited, 'inherited fact recorded');
      assert.equal((inherited!.data as { parentSessionId: string }).parentSessionId, 'parent-1');
      // child mutation under the parent's focus passes and attributes
      const pass = await fire('tool_call', { toolName: 'write', input: { path: 'src/child.ts' } }, ctx);
      assert.equal(pass, undefined);
      const attributed = entries.find((e) => e.customType === 'pi-openspec-gate.attributed.v1');
      assert.ok(attributed, 'child mutation attributed');
      assert.equal((attributed!.data as { change: string }).change, 'c1');
    } finally {
      delete process.env.PI_SUBAGENT_DELEGATION;
      rmSync(sessionsRoot, { recursive: true, force: true });
    }
  });

  test('openspec creation is never blocked', async () => {
    const { fire, ctx } = freshGate();
    const pass = await fire('tool_call', { toolName: 'bash', input: { command: 'openspec new change fresh --schema mission' } }, ctx);
    assert.equal(pass, undefined);
  });
});

test('touch-guard: grant verbs are human-terminal only (live-caught 2026-10-20)', async () => {
  const fake = makeFakePi();
  createGate(fake.pi as never, { enabled: true, exempt: [], approval: { enforce: false, humanGateSteps: false, archiveGuard: false, stampCreations: false } });
  const ctx = { cwd: '/tmp', sessionManager: { getEntries: () => [] } };
  for (const invocation of [
    'pios-gate propose demo',
    'pios-gate deal demo',
    'node bin/pios-gate.js plan demo',
    'pios-gate order demo',
    'pios-gate execute demo',
    'pios-gate approve demo',
  ]) {
    const result = await fake.fire('tool_call', { toolName: 'bash', input: { command: invocation } }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_APPROVAL_TOUCH }, invocation);
  }
  // structure lint still forwards untouched
  const lint = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'pios-gate validate demo' } }, ctx);
  assert.equal(lint, undefined);
});
