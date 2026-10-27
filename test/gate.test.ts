import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { createGate, BLOCK_MESSAGE, BLOCK_APPROVAL_TOUCH, blockUnaccounted } from '../src/gate.ts';
import type { GateConfig } from '../src/config.ts';
import { OPENSPEC_FOCUS_ENTRY_TYPE } from '../src/focus.ts';

/** Byte-stable base copy — the builder's default state (a focusable
 *  change, no declared phrases anywhere). Fixture-state asserts use
 *  membership instead: global schema homes contribute x-declares phrases
 *  machine-dependently, and the pinned copy must not. */
const EXPECTED_BASE_COPY = [
  '⛔ unaccounted mutation — no active change',
  '   stop:    this refusal is final — do not retry, do not investigate; act on one remedy or relay them to the human',
  '   focus:   openspec_focus → action: set, change: <slug>   (a change that exists in openspec/changes/)',
  '   create:  openspec new change <slug> --schema <schema-name>',
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
    // schema-declared verdict line + receipt target (the engine carries none)
    mkdirSync(join(repo, 'openspec', 'schemas', 'teeth'), { recursive: true });
    writeFileSync(
      join(repo, 'openspec', 'schemas', 'teeth', 'schema.yaml'),
      'name: teeth\nx-declares: [action the job, execute the job]\nartifacts:\n  - id: tasks\n    generates: 4-tasks.md\n    x-verdict-line: Human validation\n    x-receives-receipts: true\n',
      'utf8',
    );
    writeFileSync(join(repo, 'openspec', 'changes', 'c1', '.openspec.yaml'), 'schema: teeth\n', 'utf8');
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
      exempt: config?.exempt ?? [{ prefix: '**/openspec/**', category: 'openspec-artifacts' }],
    });
    const ctx = {
      cwd: repo,
      sessionManager: { getEntries: () => sessionEntries },
    };
    return { ...fake, ctx };
  }

  test('block: no focus, no declaration → stop directive + every real remedy + fact', async () => {
    const { fire, ctx, entries } = freshGate();
    const result = (await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(result?.block, true);
    assert.equal(BLOCK_MESSAGE, EXPECTED_BASE_COPY);
    assert.ok(result.reason!.includes('stop:'), 'stop directive');
    assert.ok(result.reason!.includes('openspec_focus'), 'exact focus instrument');
    assert.ok(result.reason!.includes('create:'), 'create remedy');
    assert.ok(result.reason!.includes('declare:'), 'declare remedy — the fixture schema declares');
    assert.ok(result.reason!.includes('"action the job"'), 'declare names the exact phrases');
    assert.ok(!result.reason!.includes('"do it"'), 'the retired alias appears nowhere');
    const blocked = entries.find((e) => e.customType === 'pi-openspec-gate.blocked.v1');
    assert.ok(blocked, 'blocked fact recorded');
    assert.equal((blocked!.data as { tool: string }).tool, 'write');
  });

  test('declare: schema-declared phrase "action the job" → one debt line, mutation proceeds', async () => {
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
    const second = (await fire('tool_call', { toolName: 'write', input: { path: 'src/b.ts' } }, ctx)) as {
      reason?: string;
    };
    assert.ok(second?.reason?.includes('unaccounted mutation'), 'blocked again — one latch, one mutation');
  });

  test('declare: no built-in alias — "do it" latches nothing (vocabulary is schema data)', async () => {
    rmSync(join(repo, 'openspec', 'bare-work.md'), { force: true }); // fresh ledger
    const { fire, ctx, entries } = freshGate();
    await fire('message_end', { message: { role: 'user', content: 'do it' } }, ctx);
    const blocked = (await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx)) as {
      block?: boolean;
    };
    assert.equal(blocked?.block, true, 'still blocked — the alias is retired');
    assert.ok(!entries.some((e) => e.customType === 'pi-openspec-gate.declared.v1'), 'no declared fact');
    assert.ok(!existsSync(join(repo, 'openspec', 'bare-work.md')), 'no debt line');
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
    assert.equal(data.category, 'openspec-artifacts');
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

  test('block copy: stop directive, exact instruments, state-aware variants', () => {
    const base = blockUnaccounted();
    assert.equal(base, EXPECTED_BASE_COPY, 'base copy pinned');
    assert.ok(!base.includes('declare:'), 'no declare line without declared phrases');
    const withPhrases = blockUnaccounted({ declares: ['execute the spec', 'action the spec'] });
    assert.ok(
      withPhrases.includes(
        'declare: relay to the human — their reply says one of "action the spec" · "execute the spec" (an assistant\'s own message never declares); recorded as declared work, proceeds',
      ),
      'exact phrases, sorted, SPEAKER named — relay, never self-declare',
    );
    assert.ok(!withPhrases.includes('do it'), 'the retired alias appears nowhere');
    const bare = blockUnaccounted({ focusable: false });
    assert.ok(!bare.includes('focus:'), 'no focus remedy when nothing can be focused');
    assert.ok(bare.includes('create:'), 'create remedy remains');
    assert.ok(bare.includes('stop:'), 'stop directive remains');
    const child = blockUnaccounted({ subagent: true });
    assert.ok(child.includes('subagent:'), 'subagent relay line present');
    assert.ok(child.includes('inherited'), 'relay line names the inheritance rule');
  });

  test('block copy: schemas named, offender named, variant headlines', () => {
    const named = blockUnaccounted({ schemas: ['spec'] });
    assert.ok(named.includes('create:  openspec new change <slug> --schema spec'), 'single schema spelled out');
    assert.ok(!named.includes('<schema-name>'), 'no placeholder when schemas resolve');
    const multi = blockUnaccounted({ schemas: ['mission', 'spec'] });
    assert.ok(multi.includes('--schema mission|spec'), 'multiple schemas listed, sorted');
    const offender = blockUnaccounted({ offender: 'python3 --version' });
    assert.ok(
      offender.includes("why:     segment 'python3 --version' is not classified read-only — read-only commands still pass"),
      'why-line names the offending segment',
    );
    const variant = blockUnaccounted({
      headline: '⛔ research window closed — no active change',
      lead: 'research instruments are work',
      focusable: false,
    });
    assert.ok(variant.startsWith('⛔ research window closed — no active change'), 'variant headline');
    assert.ok(variant.includes('research instruments are work'), 'variant lead line');
    assert.ok(!variant.includes('focus:'), 'state-aware remedies carry over');
  });

  test('compound bash block names the offending segment (walk #2, catch #6)', async () => {
    sessionEntries.length = 0; // no focus — the block must fire
    const { fire, ctx } = freshGate();
    const result = (await fire(
      'tool_call',
      { toolName: 'bash', input: { command: 'pwd && ls -la && python3 --version && which python3' } },
      ctx,
    )) as { block?: boolean; reason?: string };
    assert.equal(result?.block, true);
    assert.match(
      result!.reason!,
      /why:     segment 'python3 --version' is not classified read-only — read-only commands still pass/u,
    );
  });

  test('self-declare: assistant phrase → latch refuses, next block corrects (walk #2, catches #3/#4)', async () => {
    sessionEntries.length = 0; // no focus — the latch must refuse, not attribute
    const { fire, ctx, entries } = freshGate();
    await fire('message_end', { message: { role: 'assistant', content: 'declaring it plainly: action the job' } }, ctx);
    const blocked = (await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx)) as {
      block?: boolean;
      reason?: string;
    };
    assert.equal(blocked?.block, true, 'assistant text never declares — the latch stays closed');
    assert.match(blocked!.reason!, /note:    a declare phrase appeared in an assistant message/u);
    assert.match(blocked!.reason!, /relay the phrases upward, never say them yourself/u);
    assert.match(blocked!.reason!, /declare: relay to the human/u, 'the declare remedy names the speaker');
    const noticed = entries.find((e) => e.customType === 'pi-openspec-gate.self-declare.v1');
    assert.ok(noticed, 'self-declare fact recorded');
    const again = (await fire('tool_call', { toolName: 'write', input: { path: 'src/b.ts' } }, ctx)) as {
      reason?: string;
    };
    assert.ok(!again!.reason!.includes('note:'), 'the correction rides exactly one block');
  });

  test('unaccounted block is state-aware: zero changes → create/declare only', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'gate-empty-'));
    try {
      mkdirSync(join(empty, 'openspec', 'changes'), { recursive: true }); // the root walker keys on it
      const fake = makeFakePi();
      createGate(fake.pi as never, {
        enabled: true,
        exempt: [],
        approval: { enforce: false, humanGateSteps: false, archiveGuard: false, stampCreations: false },
      });
      const result = (await fake.fire(
        'tool_call',
        { toolName: 'write', input: { path: 'src/a.ts' } },
        { cwd: empty, sessionManager: { getEntries: () => [] } },
      )) as { reason?: string };
      assert.ok(result?.reason, 'blocked');
      assert.ok(result.reason!.includes('stop:'), 'stop directive present');
      assert.ok(!result.reason!.includes('focus:'), 'focus remedy dropped — nothing to focus');
      assert.ok(result.reason!.includes('create:'), 'create remedy leads');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  test('unaccounted block tells subagents to relay upward', async () => {
    sessionEntries.length = 0; // no inherited/own focus — the block must fire
    const { fire, ctx } = freshGate();
    process.env.PI_SUBAGENT_DELEGATION = JSON.stringify({ parentSessionId: 'parent-x', childSessionId: 'child-x' });
    try {
      const result = (await fire('tool_call', { toolName: 'write', input: { path: 'src/a.ts' } }, ctx)) as {
        reason?: string;
      };
      assert.ok(result?.reason, 'blocked');
      assert.ok(result.reason!.includes('subagent:'), 'relay line present');
      assert.ok(result.reason!.includes('do not self-serve'), 'self-serve refused');
    } finally {
      delete process.env.PI_SUBAGENT_DELEGATION;
    }
  });
});

test('touch-guard: the grant surface is human-terminal only — reserved words + schema-declared verbs', async () => {
  const fake = makeFakePi();
  createGate(fake.pi as never, { enabled: true, exempt: [], approval: { enforce: false, humanGateSteps: false, archiveGuard: false, stampCreations: false } });
  const ctx = { cwd: '/tmp', sessionManager: { getEntries: () => [] } };
  for (const invocation of [
    'pios-gate approve demo',
    'pios-gate confirm demo',
    'pios-gate grant demo some/one',
    'node bin/pios-gate.js approve demo',
    'pi-openspec-gate validate demo',
  ]) {
    const result = await fake.fire('tool_call', { toolName: 'bash', input: { command: invocation } }, ctx);
    assert.deepEqual(result, { block: true, reason: BLOCK_APPROVAL_TOUCH }, invocation);
  }
  // structure lint still forwards untouched
  const lint = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'pios-gate validate demo' } }, ctx);
  assert.equal(lint, undefined);

  // schema-declared verbs join the guard from data; undeclared words pass
  const verbRepo = mkdtempSync(join(tmpdir(), 'touch-verbs-'));
  try {
    mkdirSync(join(verbRepo, 'openspec', 'schemas', 'verbful'), { recursive: true });
    mkdirSync(join(verbRepo, 'openspec', 'changes'), { recursive: true }); // the root walker keys on it
    writeFileSync(
      join(verbRepo, 'openspec', 'schemas', 'verbful', 'schema.yaml'),
      'name: verbful\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant-verb: kickoff\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n',
      'utf8',
    );
    const verbCtx = { cwd: verbRepo, sessionManager: { getEntries: () => [] } };
    const blocked = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'pios-gate kickoff demo' } }, verbCtx);
    assert.deepEqual(blocked, { block: true, reason: BLOCK_APPROVAL_TOUCH }, 'declared verb blocked');
    const pass = await fake.fire('tool_call', { toolName: 'bash', input: { command: 'pios-gate someotherword demo' } }, verbCtx);
    // undeclared words are not approval-touch — the touch guard passes
    // them through; the base law may still block them as unaccounted
    const reason = (pass as { reason?: string } | undefined)?.reason;
    assert.notEqual(reason, BLOCK_APPROVAL_TOUCH, 'undeclared word is not approval-touch');
  } finally {
    rmSync(verbRepo, { recursive: true, force: true });
  }
});
