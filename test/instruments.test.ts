import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createGate, BLOCK_MESSAGE } from '../src/gate.ts';
import { loadGateConfig } from '../src/config.ts';

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

const ctx = { cwd: '/tmp', sessionManager: { getEntries: () => [] } };

describe('instrument carve-out: the gate never gates its instruments', () => {
  test('allowlisted instrument passes and records an instrument fact', async () => {
    const fake = makeFakePi();
    createGate(fake.pi as never, { enabled: true, exempt: [], accountingTools: ['work_focus'] });
    const result = await fake.fire('tool_call', { toolName: 'work_focus', input: {} }, ctx);
    assert.equal(result, undefined);
    const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.instrument.v1');
    assert.ok(fact, 'instrument fact recorded');
    assert.equal((fact!.data as { tool: string }).tool, 'work_focus');
  });

  test('unknown tool not on the list still blocks (fail-safe untouched)', async () => {
    const fake = makeFakePi();
    createGate(fake.pi as never, { enabled: true, exempt: [], accountingTools: ['work_focus'] });
    const result = await fake.fire('tool_call', { toolName: 'stage2', input: {} }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_MESSAGE });
  });

  test('config without accountingTools keeps legacy behavior', async () => {
    const fake = makeFakePi();
    createGate(fake.pi as never, { enabled: true, exempt: [] });
    const result = await fake.fire('tool_call', { toolName: 'work_focus', input: {} }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_MESSAGE });
  });

  test('repo config.json declares the observed instrument set', () => {
    const config = loadGateConfig();
    assert.deepEqual([...(config.accountingTools ?? [])], [
      'work_focus',
      'openspec_focus',
      'stage',
      'subject',
      // memory writes: never gated, always recorded (memory-instruments)
      'mem_save',
      'mem_update',
      'mem_delete',
      'mem_save_prompt',
      'mem_session_summary',
      'mem_session_end',
      'mem_capture_passive',
    ]);
  });

  test('every memory write verb passes ungated and records an instrument fact', async () => {
    const verbs = [
      'mem_save',
      'mem_update',
      'mem_delete',
      'mem_save_prompt',
      'mem_session_summary',
      'mem_session_end',
      'mem_capture_passive',
    ];
    const config = loadGateConfig();
    for (const verb of verbs) {
      const fake = makeFakePi();
      createGate(fake.pi as never, config);
      const result = await fake.fire('tool_call', { toolName: verb, input: { title: 't', content: 'c' } }, ctx);
      assert.equal(result, undefined, `${verb} passes ungated`);
      const fact = fake.entries.find((e) => e.customType === 'pi-openspec-gate.instrument.v1');
      assert.ok(fact, `${verb} recorded as instrument`);
      assert.equal((fact!.data as { tool: string }).tool, verb);
    }
  });

  test('mem_delete included: never gated, still recorded', async () => {
    const fake = makeFakePi();
    createGate(fake.pi as never, loadGateConfig());
    const result = await fake.fire('tool_call', { toolName: 'mem_delete', input: { id: 1 } }, ctx);
    assert.equal(result, undefined);
    assert.ok(fake.entries.some((e) => e.customType === 'pi-openspec-gate.instrument.v1'));
  });

  test('unknown memory tool still blocks — fail-safe untouched (no classifier change)', async () => {
    const fake = makeFakePi();
    createGate(fake.pi as never, loadGateConfig());
    const result = await fake.fire('tool_call', { toolName: 'mem_hypothetical', input: {} }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_MESSAGE });
  });
});
