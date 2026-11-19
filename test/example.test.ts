/**
 * The shipped example — a strong starting point, kept honest.
 *
 * The example carries the `micro` schema: one change, one plan.md, one
 * human approve before code. x-unlocks: [writes] opens coding at the
 * single grant; x-completes: approved stamps it; x-verdict-line:
 * Hands-on validation is the one human-only tick. The declared doors
 * ("start the spec" / "skip the spec") ride schema data.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { findSchemaFile, parseSchemaYaml, writesUnlocked } from '../src/schema.ts';
import { parsePlan } from '../src/plan.ts';
import { parseSchemaYaml as parseSchemaYamlBin, parsePlan as parsePlanBin } from '../bin/gate-lib.js';

const REPO_ROOT = join(import.meta.dirname, '..');
const EXAMPLE_ROOT = join(REPO_ROOT, 'example', 'openspec');

describe('the example schema (micro)', () => {
  test('parses on both sides and declares the micro law', () => {
    const file = findSchemaFile(EXAMPLE_ROOT, 'micro');
    assert.ok(file, 'example micro schema found');
    const yaml = readFileSync(file!, 'utf8');
    const src = parseSchemaYaml(yaml, file!);
    const bin = parseSchemaYamlBin(yaml, file!);

    assert.deepEqual(src.declares, ['start the spec', 'skip the spec']);
    assert.deepEqual(src.artifacts.map((a) => a.id), ['plan']);
    const plan = src.artifacts[0]!;
    assert.equal(plan.generates, 'plan.md');
    assert.deepEqual(plan.unlocks, ['writes']);
    assert.equal(plan.completes, 'approved');
    assert.equal(plan.verdictLine, 'Hands-on validation');
    assert.deepEqual(
      plan.sections.map((s) => s.id),
      ['Goal', 'Questions & Decisions', 'Tasks', 'Verification'],
    );
    assert.equal(plan.requiresApproval.length, 0, 'one artifact: the approve IS the gate');
    assert.ok(!('grantVerb' in plan), 'the verbs died by silent ignore');
    // one granted artifact unlocks writes and completes the schema
    assert.equal(writesUnlocked(src, new Set(['plan'])), true);

    // bin ≡ src mirror on the example itself
    assert.deepEqual(
      bin.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
      src.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
    );
    assert.equal(
      (bin.artifacts[0] as { verdictLine?: string }).verdictLine,
      'Hands-on validation',
      'bin parses the verdict line too',
    );
  });

  test('the template parses as a plan — sections present, tasks open, verdict excluded', () => {
    const text = readFileSync(join(EXAMPLE_ROOT, 'schemas', 'micro', 'templates', 'plan.md'), 'utf8');
    assert.deepEqual(
      [...text.matchAll(/^## (.+)$/gmu)].map((m) => m[1]),
      ['Goal', 'Questions & Decisions', 'Tasks', 'Verification'],
    );
    const model = parsePlan(text, 'Hands-on validation');
    assert.ok(model.open >= 1, 'the template ships open tasks');
    assert.equal(model.verdictTicked, false, 'the verdict ships unticked — the human ticks it');
    const binModel = parsePlanBin(text, 'Hands-on validation');
    assert.deepEqual(binModel, model, 'twins agree');
  });

  test('the schema parses under real yaml — openspec itself reads it', () => {
    // our line-parser tolerates things real YAML does not (live-caught:
    // unescaped quotes inside a double-quoted description broke
    // `openspec new change --schema …` while our tests stayed green)
    const result = spawnSync('openspec', ['schemas'], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `openspec cannot parse the shipped schema:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /micro/, 'the shipped schema is listed');
  });

  test('the walkthrough passes end to end with every key marker', () => {
    const result = spawnSync('sh', [join(REPO_ROOT, 'example', 'try.sh')], { encoding: 'utf8' });
    assert.equal(result.status, 0, `walkthrough failed:\n${result.stdout}\n${result.stderr}`);
    for (const marker of [
      'not drafted yet',
      'approved hello-gate · plan · coding open — 2 task(s)/2',
      '[0/2 tasks] · coding',
      'coding open — 0/2 tasks done',
      '2 task(s) open',
      "tick 'Hands-on validation'",
      'closed hello-gate · validated · archiving',
      'x-validated stamped',
      'human-approve first',
      "slice 'Slice: one' done",
      'approved hello-sliced · plan · coding open — 3 task(s)/3',
      "slice 'Slice: two' unlocked",
      'x-slice: 2 stamped',
      'closed hello-sliced · validated · archiving',
      'nothing pending',
      'passed: 18',
    ]) {
      assert.ok(result.stdout.includes(marker), `walkthrough missing marker: ${marker}`);
    }
  });
});
