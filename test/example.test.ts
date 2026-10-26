/**
 * The shipped example — a strong starting point, kept honest.
 *
 * The example carries the v4 `spec` schema: four steps (brainstorm →
 * investigate → plan → execute), strictness at the two boundaries humans
 * own — commit at plan (x-unlocks: [writes]), the verdict at execute —
 * and the research window opening at investigate (x-unlocks: [research]).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { artifactForGrantVerb, findSchemaFile, parseSchemaYaml, schemaIsGated } from '../src/schema.ts';
import { parseSchemaYaml as parseSchemaYamlBin } from '../bin/gate-lib.js';

const REPO_ROOT = join(import.meta.dirname, '..');
const EXAMPLE_ROOT = join(REPO_ROOT, 'example', 'openspec');

describe('the example schema (spec v4)', () => {
  test('parses on both sides, is gated, and declares the four grants + unlocks', () => {
    const file = findSchemaFile(EXAMPLE_ROOT, 'spec');
    assert.ok(file, 'example spec schema found');
    const yaml = readFileSync(file!, 'utf8');
    const src = parseSchemaYaml(yaml, file!);
    const bin = parseSchemaYamlBin(yaml, file!);

    assert.equal(schemaIsGated(src), true);
    assert.deepEqual(src.declares, ['action the spec', 'execute the spec']);
    assert.deepEqual(
      src.artifacts.map((a) => a.id),
      ['brainstorm', 'investigate', 'plan', 'execute'],
    );
    assert.equal(artifactForGrantVerb(src, 'open')?.id, 'brainstorm');
    assert.equal(artifactForGrantVerb(src, 'dig')?.id, 'investigate');
    assert.equal(artifactForGrantVerb(src, 'commit')?.id, 'plan');
    assert.equal(artifactForGrantVerb(src, 'build')?.id, 'execute');

    // the capability boundaries, declared in data
    assert.deepEqual(src.artifacts[1]!.unlocks, ['research']);
    assert.deepEqual(src.artifacts[2]!.unlocks, ['writes']);
    assert.equal(src.artifacts[1]!.sections.length, 0, 'the journal is free');
    assert.deepEqual(
      src.artifacts[2]!.sections.map((s) => s.id),
      ['Estimate', 'Skills', 'Workflow', 'Slices', 'Verification', 'History'],
    );
    assert.equal(src.artifacts[3]!.verdictLine, 'Human validation');
    assert.equal(src.artifacts[3]!.receivesReceipts, true);
    assert.equal(src.artifacts[3]!.completes, 'approved');

    // bin ≡ src mirror on the example itself
    assert.deepEqual(
      bin.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
      src.artifacts.map((a) => [a.id, a.requiresApproval, a.grantVerb, a.unlocks, a.sections.map((s) => s.id)]),
    );
  });

  test('the walkthrough passes end to end with every key marker', () => {
    const result = spawnSync('sh', [join(REPO_ROOT, 'example', 'try.sh')], { encoding: 'utf8' });
    assert.equal(result.status, 0, `walkthrough failed:\n${result.stdout}\n${result.stderr}`);
    for (const marker of [
      'in sequence',
      'not drafted yet',
      'missing declared structure: Workflow',
      'grant: pios-gate build',
      'all artifacts granted — status: approved',
      'needs confirm (verdict open)',
      'ready to archive?',
      'passed: 11',
    ]) {
      assert.ok(result.stdout.includes(marker), `walkthrough missing marker: ${marker}`);
    }
  });
});
