import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { createGate, BLOCK_MESSAGE } from '../src/gate.ts';

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

function fixture(schemaName: string, meta: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'phasegate-'));
  const openspec = join(root, 'openspec');
  mkdirSync(join(openspec, 'schemas', schemaName), { recursive: true });
  const yaml = schemaName === 'gated' ? GATED_SCHEMA : UNGATED_SCHEMA;
  writeFileSync(join(openspec, 'schemas', schemaName, 'schema.yaml'), yaml, 'utf8');
  mkdirSync(join(openspec, 'changes', 'c1'), { recursive: true });
  const metaLines = [`schema: ${schemaName}`, ...Object.entries(meta).map(([k, v]) => `${k}: ${v}`)];
  writeFileSync(join(openspec, 'changes', 'c1', '.openspec.yaml'), `${metaLines.join('\n')}\n`, 'utf8');
  return { root, openspec, changeDir: join(openspec, 'changes', 'c1') };
}

const CONFIG = {
  enabled: true,
  exempt: [{ prefix: '**/openspec/**', category: 'ladder-artifacts' }],
  approval: { enforce: true, humanGateSteps: false, archiveGuard: false, stampCreations: false, phaseGates: true },
};

const ctxOf = (root: string) => ({ cwd: root, sessionManager: { getEntries: () => [] } });

describe('rung gates: creating ladder artifacts', () => {
  test('rung 2 creation without a grant blocks with the exact grant remedy', async () => {
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

  test('granted rung drafts freely (exempt path, no block)', async () => {
    const { root, changeDir } = fixture('gated', { phases_approved: 'a' });
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'write', input: { path: join(changeDir, '2-b.md'), content: '# B\n\n## Done when\n\nClaim: x\n' } },
      ctxOf(root),
    );
    assert.equal(result, undefined);
  });

  test('ladder entry (rung 1) drafts free — never gated', async () => {
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
    const { root, changeDir } = fixture('gated', { phases_approved: 'a' });
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
    const { root, changeDir } = fixture('gated', { phases_approved: 'a' });
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

  test('bash creation is never path-exempt — the base law carries rung gating implicitly', async () => {
    const { root, changeDir } = fixture('gated');
    const fake = makeFakePi();
    createGate(fake.pi as never, CONFIG as never);
    const result = await fake.fire(
      'tool_call',
      { toolName: 'bash', input: { command: `cat > ${join(changeDir, '2-b.md')} <<'EOF'\ndraft\nEOF` } },
      ctxOf(root),
    );
    // bash targets are not enumerable (house law): the call falls to
    // focus/declare/block — rung files can't be drafted around the gate
    // via bash any more than any other mutation can
    assert.deepEqual(result, { block: true, reason: BLOCK_MESSAGE });
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
