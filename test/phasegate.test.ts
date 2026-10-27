import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { createGate, BLOCK_MESSAGE } from '../src/gate.ts';
import { OPENSPEC_FOCUS_ENTRY_TYPE } from '../src/focus.ts';

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
      return [{ name: 'write' }, { name: 'bash' }];
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

const GATED_SCHEMA = `name: gated\nversion: 1\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n    x-sections: [Done when]\n    x-lines: [Claim]\n`;
const UNGATED_SCHEMA = `name: ungated\nversion: 1\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n`;
const MULTI_SCHEMA = `name: multi\nversion: 1\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n  - id: c\n    generates: 3-c.md\n    x-requires-approval: [a, b]\n`;
const WRITTEN_SCHEMA = `name: written\nversion: 1\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-written: [a]\n`;
const WINDOW_SCHEMA = `name: window\nversion: 1\nartifacts:\n  - id: brief\n    generates: 1-brief.md\n  - id: dig\n    generates: 2-dig.md\n    x-grant-verb: dig\n    x-requires-approval: [brief]\n    x-unlocks: [research]\n`;

function fixture(schemaName: string, meta: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'phasegate-'));
  const openspec = join(root, 'openspec');
  mkdirSync(join(openspec, 'schemas', schemaName), { recursive: true });
  const yaml =
    schemaName === 'gated' ? GATED_SCHEMA : schemaName === 'multi' ? MULTI_SCHEMA : schemaName === 'written' ? WRITTEN_SCHEMA : schemaName === 'window' ? WINDOW_SCHEMA : UNGATED_SCHEMA;
  writeFileSync(join(openspec, 'schemas', schemaName, 'schema.yaml'), yaml, 'utf8');
  mkdirSync(join(openspec, 'changes', 'c1'), { recursive: true });
  const metaLines = [`schema: ${schemaName}`, ...Object.entries(meta).map(([k, v]) => `${k}: ${v}`)];
  writeFileSync(join(openspec, 'changes', 'c1', '.openspec.yaml'), `${metaLines.join('\n')}\n`, 'utf8');
  return { root, openspec, changeDir: join(openspec, 'changes', 'c1') };
}

const CONFIG = {
  enabled: true,
  exempt: [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
  approval: { enforce: true, humanGateSteps: false, archiveGuard: false, stampCreations: false, phaseGates: true },
};

const ctxOf = (root: string) => ({ cwd: root, sessionManager: { getEntries: () => [] } });

const ctxFocusedOn = (root: string, change: string) => {
  const entries = [{ type: 'custom', customType: OPENSPEC_FOCUS_ENTRY_TYPE, data: { mode: 'task', change, taskId: '1' } }];
  return { cwd: root, sessionManager: { getEntries: () => entries } };
};

describe('research window: x-unlocks [research] opens at a grant', () => {
  test('web tools block before the dig grant, naming the exact remedy', async () => {
    const { root } = fixture('window');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const blocked = await fake.fire(
      'tool_call',
      { toolName: 'web_explore', input: { query: 'best practices' } },
      ctxFocusedOn(root, 'c1'),
    );
    const reason = (blocked as { reason: string }).reason;
    assert.match(reason, /research window closed — 'c1'/u);
    assert.match(reason, /grant:   pios-gate dig c1   ← your terminal/u);
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.phasegate.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'research-window');
  });

  test('a configured bash verb (graphify) blocks too; defaults cover the web set', async () => {
    const { root } = fixture('window');
    const fake = makeFakePi();
    createGate(fake.pi as never, { ...CONFIG, unlocks: { research: { commands: ['graphify'] } } } as never);
    const blocked = await fake.fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'graphify query "install flow"' } },
      ctxFocusedOn(root, 'c1'),
    );
    assert.match((blocked as { reason: string }).reason, /research window closed/u);
    // not a research verb: reads pass untouched outside the window machinery
    const pass = await fake.fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'ls' } },
      ctxFocusedOn(root, 'c1'),
    );
    assert.equal(pass, undefined);
  });

  test('after the dig grant the window opens; void research blocks with the remedy ladder (walk #2, catch #7)', async () => {
    const { root } = fixture('window', { granted: 'brief,dig' });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const open = await fake.fire(
      'tool_call',
      { toolName: 'web_explore', input: { query: 'x' } },
      ctxFocusedOn(root, 'c1'),
    );
    assert.equal(open, undefined, 'granted dig opens research');
    const idle = await fake.fire(
      'tool_call',
      { toolName: 'web_explore', input: { query: 'casual question' } },
      ctxOf(root),
    );
    const reason = (idle as { reason: string }).reason;
    assert.match(reason, /research window closed — no active change/u, 'void research blocks');
    assert.match(reason, /stop:/u, 'same stop directive as the mutation block');
    assert.match(reason, /openspec_focus/u, 'changes exist on disk → focus remedy');
    assert.match(reason, /create:/u, 'create remedy present');
    assert.ok(!reason.includes('clear the focus'), 'the escape-hatch line is retired');
    const fact = fake.entries.find((e) => (e.data as { kind?: string } | undefined)?.kind === 'research-void');
    assert.ok(fact, 'research-void fact recorded');
  });

  test('void research with zero changes: no focus line, create/declare lead, schema named', async () => {
    const { root } = fixture('window');
    rmSync(join(root, 'openspec', 'changes', 'c1'), { recursive: true, force: true });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const blocked = await fake.fire(
      'tool_call',
      { toolName: 'resolve-library-id', input: { query: 'dice notation' } },
      ctxOf(root),
    );
    const reason = (blocked as { reason: string }).reason;
    assert.match(reason, /research window closed — no active change/u);
    assert.ok(!reason.includes('focus:'), 'nothing focusable → focus line dropped');
    assert.match(reason, /create:/u);
    assert.ok(reason.includes('window'), 'the local schema is named, not a placeholder');
    assert.ok(!reason.includes('<schema-name>'), 'no placeholder when a schema resolves');
  });

  test('void research with no local openspec stays free — the gate is inert there', async () => {
    const root = mkdtempSync(join(tmpdir(), 'phasegate-bare-'));
    try {
      const fake = makeFakePi();
      createGate(fake.pi as never, CONFIG as never);
      const pass = await fake.fire(
        'tool_call',
        { toolName: 'web_explore', input: { query: 'x' } },
        ctxOf(root),
      );
      assert.equal(pass, undefined, 'no local openspec → research free');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('artifact gates: creating gated change artifacts', () => {
  test('artifact 2 creation without a grant blocks with the exact grant remedy', async () => {
    const { root, changeDir } = fixture('gated');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: 'draft' } },
      ctxOf(root),
    );
    assert.deepEqual(result, {
      block: true,
      reason: [
        '⛔ phase gate — a not granted yet',
        '   grant:   pios-gate approve c1 a   ← your terminal',
        '   docs:    the schema gates this artifact (x-requires-approval)',
      ].join('\n'),
    });
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.phasegate.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'missing-approval');
  });

  test('granted artifact drafts freely (exempt path, no block)', async () => {
    const { root, changeDir } = fixture('gated', { granted: 'a' });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: '# B\n\n## Done when\n\nClaim: x\n' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });

  test('schema entry (artifact 1) drafts free — never gated', async () => {
    const { root, changeDir } = fixture('gated');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '1-a.md'), content: 'why' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });

  test('missing declared sections at birth block, naming them', async () => {
    const { root, changeDir } = fixture('gated', { granted: 'a' });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: '# B\nno structure\n' } },
      ctxOf(root),
    );
    assert.deepEqual(result, {
      block: true,
      reason: [
        '⛔ phase gate — 2-b.md is missing declared structure',
        '   missing: Done when · Claim',
        '   add it — the grant will refuse to stamp until it exists',
      ].join('\n'),
    });
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.phasegate.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'missing-sections');
  });

  test('sections present but Claim line missing still blocks', async () => {
    const { root, changeDir } = fixture('gated', { granted: 'a' });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: '# B\n\n## Done when\n' } },
      ctxOf(root),
    );
    assert.ok((result as { reason: string }).reason.includes('Claim'));
  });

  test('existing files stay editable — receipts flow, grandfathered', async () => {
    const { root, changeDir } = fixture('gated');
    writeFileSync(join(changeDir, '2-b.md'), 'born earlier\n', 'utf8');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'edit', input: { path: join(changeDir, '2-b.md'), oldText: 'earlier', newText: 'later' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });

  test('bash creation is never path-exempt — the base law carries artifact gating implicitly', async () => {
    const { root, changeDir } = fixture('gated');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'bash', input: { command: `cat > ${join(changeDir, '2-b.md')} <<'EOF'\ndraft\nEOF` } },
      ctxOf(root),
    );
    // bash targets are not enumerable (house law): the call falls to
    // focus/declare/block — gated artifacts can't be drafted around the
    // gate via bash any more than any other mutation can
    const blocked = result as { block?: boolean; reason?: string };
    assert.equal(blocked?.block, true, 'blocked');
    assert.ok(blocked.reason!.includes('unaccounted mutation'), 'the unaccounted block — state-aware copy');
  });

  test('artifact requiring two precedents blocks until BOTH are granted, naming all missing', async () => {
    const { root, changeDir } = fixture('multi');
    const metaFile = join(changeDir, '.openspec.yaml');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const fire = () =>
      fake.fire('tool_call', { toolName: 'write', input: { path: join(changeDir, '3-c.md'), content: '# C\n' } }, ctxOf(root));

    // nothing granted → both named
    writeFileSync(metaFile, 'schema: multi\n', 'utf8');
    const none = await fire();
    assert.match((none as { reason: string }).reason, /phase gate — a, b not granted yet/u);

    // one granted → the other still named
    writeFileSync(metaFile, 'schema: multi\ngranted: a\n', 'utf8');
    const partial = await fire();
    assert.match((partial as { reason: string }).reason, /phase gate — b not granted yet/u);

    // both granted → drafts free
    writeFileSync(metaFile, 'schema: multi\ngranted: a, b\n', 'utf8');
    const both = await fire();
    assert.equal(both, undefined);
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.phasegate.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'missing-approval');
  });

  test('x-requires-written: creation blocks until declared evidence exists on disk', async () => {
    const { root, changeDir } = fixture('written');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const fire = () =>
      fake.fire('tool_call', { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: '# B\n' } }, ctxOf(root));

    // evidence absent → block naming the missing file
    const none = await fire();
    assert.match((none as { reason: string }).reason, /2-b\.md awaits declared evidence/u);
    assert.match((none as { reason: string }).reason, /missing: 1-a\.md/u);

    // evidence present → drafts free (no grant needed — evidence, not approval)
    writeFileSync(join(changeDir, '1-a.md'), '# A\n', 'utf8');
    const present = await fire();
    assert.equal(present, undefined);
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.phasegate.v1');
    assert.equal((fact!.data as { kind: string }).kind, 'missing-written');
  });

  test('ungated schema: no phase gates at all (legacy behavior)', async () => {
    const { root, changeDir } = fixture('ungated');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: 'anything' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });

  test('phaseGates off in config: guard inert even for gated schemas', async () => {
    const { root, changeDir } = fixture('gated');
    const fake = makeFakePi();
    createGate(fake.pi as never, { ...CONFIG, approval: { ...CONFIG.approval, phaseGates: false } } as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: 'draft' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });
});
