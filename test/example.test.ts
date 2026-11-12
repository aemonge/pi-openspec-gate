/**
 * The shipped example — a strong starting point, kept honest.
 *
 * The example carries the v9 `spec` schema: five steps (brainstorm →
 * investigate → plan → execute → post-delivery), strictness at the two
 * boundaries humans own — commit at plan (x-unlocks: [writes]), the
 * verdict at execute — and the research window opening at investigate
 * (x-unlocks: [research]). The fifth is conditional: x-optional and
 * x-requires-verdict — drafted only when the verdict's surfaced: line
 * names findings too big for slices.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { findSchemaFile, parseSchemaYaml, schemaIsGated } from '../src/schema.ts';
import { parseSchemaYaml as parseSchemaYamlBin } from '../bin/gate-lib.js';

const REPO_ROOT = join(import.meta.dirname, '..');
const EXAMPLE_ROOT = join(REPO_ROOT, 'example', 'openspec');

describe('the example schema (spec)', () => {
  test('parses on both sides, is gated, and declares the four grants + unlocks', () => {
    const file = findSchemaFile(EXAMPLE_ROOT, 'spec');
    assert.ok(file, 'example spec schema found');
    const yaml = readFileSync(file!, 'utf8');
    const src = parseSchemaYaml(yaml, file!);
    const bin = parseSchemaYamlBin(yaml, file!);

    assert.equal(schemaIsGated(src), true);
    assert.deepEqual(src.declares, ['start the spec', 'skip the spec']);
    assert.deepEqual(
      src.artifacts.map((a) => a.id),
      ['brainstorm', 'investigate', 'plan', 'execute', 'post-delivery'],
    );
    assert.equal(schemaIsGated(src), true);
    for (const artifact of src.artifacts) assert.ok(!('grantVerb' in artifact), 'the verbs died by silent ignore');

    // the capability boundaries, declared in data
    assert.deepEqual(src.artifacts[1]!.unlocks, ['research']);
    assert.deepEqual(src.artifacts[2]!.unlocks, ['writes']);
    assert.equal(src.artifacts[1]!.sections.length, 0, 'the journal is free');
    assert.deepEqual(
      src.artifacts[2]!.sections.map((s) => s.id),
      ['Estimate', 'Skills', 'Workflow', 'Slices', 'Verification', 'History'],
    );
    assert.equal(src.artifacts[3]!.verdictLine, 'Human validation');
    assert.equal(src.artifacts[3]!.completes, 'approved');

    // the conditional fifth: optional, verdict-first, chained to execute
    const fifth = src.artifacts[4]!;
    assert.equal(fifth.optional, true);
    assert.equal(fifth.requiresVerdict, true);
    assert.deepEqual(fifth.requiresApproval, ['execute']);
    assert.equal(src.artifacts[3]!.optional, false);
    assert.equal(src.artifacts[3]!.requiresVerdict, false);

    // bin ≡ src mirror on the example itself
    assert.deepEqual(
      bin.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
      src.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
    );
    assert.equal((bin.artifacts[4] as { optional?: boolean }).optional, true, 'bin parses x-optional too');
    assert.equal((bin.artifacts[4] as { requiresVerdict?: boolean }).requiresVerdict, true, 'bin parses x-requires-verdict too');
  });

  test('the schema parses under real yaml — openspec itself reads it', () => {
    // our line-parser tolerates things real YAML does not (live-caught:
    // unescaped quotes inside the double-quoted description broke
    // `openspec new change --schema spec` while our tests stayed green)
    const result = spawnSync('openspec', ['schemas'], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `openspec cannot parse the shipped schema:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /spec/, 'the shipped schema is listed');
  });

  test('the walkthrough passes end to end with every key marker', () => {
    const result = spawnSync('sh', [join(REPO_ROOT, 'example', 'try.sh')], { encoding: 'utf8' });
    assert.equal(result.status, 0, `walkthrough failed:\n${result.stdout}\n${result.stderr}`);
    for (const marker of [
      'not drafted yet',
      'missing declared structure: Workflow',
      'all steps approved — status: approved',
      '— eospec close',
      'not closed — tick',
      'closed hello-gate · validated · archiving',
      'approved hello-two · post-delivery · all steps approved — status: approved',
      'closed hello-two · validated · archiving',
      'passed: 21',
    ]) {
      assert.ok(result.stdout.includes(marker), `walkthrough missing marker: ${marker}`);
    }
  });
});
