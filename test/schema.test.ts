import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  artifactForFilename,
  artifactForGrantVerb,
  allArtifactsGranted,
  findSchemaFile,
  parseSchemaYaml,
  resolveChangeSchema,
  schemaIsGated,
  sectionTitles,
} from '../src/schema.ts';
import {
  artifactForGrantVerb as artifactForGrantVerbBin,
  parseSchemaYaml as parseSchemaYamlBin,
  schemaIsGated as schemaIsGatedBin,
} from '../bin/gate-lib.js';

const REPO_ROOT = join(import.meta.dirname, '..');

const MISSION_YAML = `
name: mission
version: 1
x-declares: [action the mission, execute the mission]
artifacts:
  - id: idea
    generates: 1-idea.md
    description: why
    requires: []
    x-grant-verb: propose
  - id: proposition
    generates: 2-proposition.md
    requires: [idea]
    x-grant-verb: deal
    x-requires-approval: [idea]
    x-lines: [Claim]
  - id: proposal
    generates: 3-proposal.md
    requires: [proposition]
    x-grant-verb: plan
    x-requires-approval: [proposition]
    x-sections: [Done when, Scope, Out of Scope, Guardrails]
  - id: plan
    generates: 4-plan.md
    requires: [proposal]
    x-grant-verb: order
    x-requires-approval: [proposal]
    x-sections: [Skills, Workflow, Steps, Verification, History]
  - id: execution
    generates: 5-execution.md
    requires: [plan]
    x-grant-verb: execute
    x-requires-approval: [plan]
    instruction: |
      multi-line instruction with traps:
      - id: fake
        x-requires-approval: [nothing]
`;

describe('schema reader: parsing', () => {
  test('mission flow parses with declaration order, declares, and x- tags intact', () => {
    const schema = parseSchemaYaml(MISSION_YAML, 'fixture');
    assert.equal(schema.name, 'mission');
    assert.deepEqual(schema.declares, ['action the mission', 'execute the mission']);
    assert.deepEqual(
      schema.artifacts.map((a) => a.id),
      ['idea', 'proposition', 'proposal', 'plan', 'execution'],
    );
    const proposition = artifactForFilename(schema, '2-proposition.md');
    assert.deepEqual(proposition?.requiresApproval, ['idea']);
    assert.deepEqual(proposition?.lines, ['Claim']);
    const proposal = artifactForFilename(schema, '3-proposal.md');
    assert.deepEqual(sectionTitles(proposal!), ['Done when', 'Scope', 'Out of Scope', 'Guardrails']);
    // block-scalar traps must not leak fake artifacts
    assert.equal(schema.artifacts.length, 5);
  });

  test('block-list style x- tags parse like flow lists', () => {
    const yaml = [
      'name: s',
      'artifacts:',
      '  - id: a',
      '    generates: 1-a.md',
      '  - id: b',
      '    generates: 2-b.md',
      '    x-requires-approval:',
      '      - a',
      '    x-sections:',
      '      - One',
      '      - Two',
    ].join('\n');
    const schema = parseSchemaYaml(yaml, 'fixture');
    const b = artifactForFilename(schema, '2-b.md');
    assert.deepEqual(b?.requiresApproval, ['a']);
    assert.deepEqual(sectionTitles(b!), ['One', 'Two']);
  });

  test('x-grant is an alias for x-grant-verb; declaring both fails loudly', () => {
    const short = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant: go\n';
    const schema = parseSchemaYaml(short, 'fixture');
    assert.equal(artifactForGrantVerb(schema, 'go')?.id, 'a');
    assert.equal(parseSchemaYamlBin(short, 'fixture').artifacts[0]!.grantVerb, 'go');
    const both = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant: go\n    x-grant-verb: go\n';
    assert.throws(() => parseSchemaYaml(both, 'fixture'), /declares x-grant and x-grant-verb both/u);
    assert.throws(() => parseSchemaYamlBin(both, 'fixture'), /choose one/u);
  });

  test('unknown x-requires-approval reference fails loudly', () => {
    const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-requires-approval: [ghost]\n';
    assert.throws(() => parseSchemaYaml(yaml, 'fixture'), /unknown artifact 'ghost'/u);
  });

  test('self- or forward-references fail loudly — declaration sequence is grant sequence', () => {
    const selfRef = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-requires-approval: [a]\n';
    assert.throws(() => parseSchemaYaml(selfRef, 'fixture'), /references 'a', declared at or after it/u);
    const forwardRef =
      'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-requires-approval: [b]\n  - id: b\n    generates: 2-b.md\n';
    assert.throws(() => parseSchemaYaml(forwardRef, 'fixture'), /dependencies must point to earlier artifacts/u);
    const forwardWritten =
      'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-requires-written: [b]\n  - id: b\n    generates: 2-b.md\n';
    assert.throws(() => parseSchemaYaml(forwardWritten, 'fixture'), /x-requires-written references 'b', declared at or after it/u);
    // the bin twin refuses the same graphs (mirror contract)
    assert.throws(() => parseSchemaYamlBin(selfRef, 'fixture'), /declared at or after it/u);
    assert.throws(() => parseSchemaYamlBin(forwardRef, 'fixture'), /dependencies must point to earlier artifacts/u);
    assert.throws(() => parseSchemaYamlBin(forwardWritten, 'fixture'), /x-requires-written references 'b'/u);
  });

  test('x-unlocks lists parse — capability classes, with the source alias', () => {
    const list = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks: [research, writes]\n';
    const schema = parseSchemaYaml(list, 'fixture');
    assert.deepEqual(artifactForFilename(schema, '1-a.md')?.unlocks, ['research', 'writes']);
    // the legacy boolean folds into [writes]
    const alias = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks-source: true\n';
    assert.deepEqual(parseSchemaYaml(alias, 'fixture').artifacts[0]!.unlocks, ['writes']);
    assert.deepEqual(parseSchemaYamlBin(alias, 'fixture').artifacts[0]!.unlocks, ['writes']);
    // unknown capability, and both forms at once — loud on both parsers
    assert.throws(
      () => parseSchemaYaml('name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks: [fly]\n', 'fixture'),
      /unknown capability 'fly'.*known: research, writes/u,
    );
    assert.throws(
      () => parseSchemaYamlBin('name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks: [fly]\n', 'fixture'),
      /unknown capability 'fly'/u,
    );
    const both = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks-source: true\n    x-unlocks: [writes]\n';
    assert.throws(() => parseSchemaYaml(both, 'fixture'), /choose one form/u);
    assert.throws(() => parseSchemaYamlBin(both, 'fixture'), /choose one form/u);
    // the mirrored order — list first, then the legacy flag — is equally loud
    const flipped = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-unlocks: [writes]\n    x-unlocks-source: true\n';
    assert.throws(() => parseSchemaYaml(flipped, 'fixture'), /x-unlocks and x-unlocks-source both/u);
    assert.throws(() => parseSchemaYamlBin(flipped, 'fixture'), /choose one form/u);
  });

  test('multi-dependency lists parse — artifact three requires [one, two]', () => {
    const yaml = [
      'name: deps',
      'artifacts:',
      '  - id: one',
      '    generates: 1-one.md',
      '  - id: two',
      '    generates: 2-two.md',
      '  - id: three',
      '    generates: 3-three.md',
      '    x-requires-approval: [one, two]',
    ].join('\n');
    const schema = parseSchemaYaml(yaml, 'fixture');
    assert.deepEqual(artifactForFilename(schema, '3-three.md')?.requiresApproval, ['one', 'two']);
  });

  test('x-requires-written lists parse — evidence deps, distinct from grants', () => {
    const yaml = [
      'name: ev',
      'artifacts:',
      '  - id: one',
      '    generates: 1-one.md',
      '  - id: two',
      '    generates: 2-two.md',
      '    x-requires-written: [one]',
    ].join('\n');
    const schema = parseSchemaYaml(yaml, 'fixture');
    assert.deepEqual(artifactForFilename(schema, '2-two.md')?.requiresWritten, ['one']);
    assert.equal(schemaIsGated(schema), true, 'written-only gates make the schema gated');
  });

  test('duplicate artifact ids fail loudly', () => {
    const yaml =
      'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: a\n    generates: 2-a.md\n';
    assert.throws(() => parseSchemaYaml(yaml, 'fixture'), /duplicate artifact id 'a'/u);
  });

  test('missing generates fails loudly', () => {
    const yaml = 'name: s\nartifacts:\n  - id: a\n';
    assert.throws(() => parseSchemaYaml(yaml, 'fixture'), /missing generates/u);
  });
});

describe('schema reader: resolution and grant semantics', () => {
  test('the repo mission schema resolves project-locally and is gated', () => {
    const openspecRoot = join(REPO_ROOT, 'openspec');
    const file = findSchemaFile(openspecRoot, 'mission');
    assert.ok(file, 'repo-local mission schema found');
    const resolution = resolveChangeSchema(openspecRoot, 'mission');
    assert.ok(resolution.ok);
    if (resolution.ok) {
      assert.equal(resolution.schema.artifacts.length, 5);
      assert.ok(schemaIsGated(resolution.schema));
    }
  });

  test('no schema name → ok:false, guards stay inactive (fail-open for drafting)', () => {
    const resolution = resolveChangeSchema(join(REPO_ROOT, 'openspec'), undefined);
    assert.deepEqual(resolution, { ok: false, reason: 'no-schema' });
  });

  test('unknown schema name → ok:false with the name in the reason', () => {
    const resolution = resolveChangeSchema(join(REPO_ROOT, 'openspec'), 'no-such-schema');
    assert.ok(!resolution.ok && resolution.reason.includes('no-such-schema'));
  });

  test('schema completes only when every artifact bears a grant', () => {
    const schema = parseSchemaYaml(MISSION_YAML, 'fixture');
    const four = new Set(['idea', 'proposition', 'proposal', 'plan']);
    assert.equal(allArtifactsGranted(schema, four), false);
    four.add('execution');
    assert.equal(allArtifactsGranted(schema, four), true);
  });

  test('grant verbs resolve from declared x-grant-verb, not position', () => {
    const schema = parseSchemaYaml(MISSION_YAML, 'fixture');
    assert.equal(artifactForGrantVerb(schema, 'propose')?.id, 'idea');
    assert.equal(artifactForGrantVerb(schema, 'deal')?.id, 'proposition');
    assert.equal(artifactForGrantVerb(schema, 'plan')?.id, 'proposal');
    assert.equal(artifactForGrantVerb(schema, 'order')?.id, 'plan');
    assert.equal(artifactForGrantVerb(schema, 'execute')?.id, 'execution');
  });
});

// ── cli-schema-tag-parity — the shipped schemas through the bin parser ──
// Red first (2026-10-23, live-caught): un-indented block lists parsed empty
// ⇒ schemaIsGated false, verbs unreachable, x-sections lost. The mission
// test pins no-regression: its flow lists always parsed.

const SHIPPED = (name: string): string =>
  readFileSync(findSchemaFile(join(REPO_ROOT, 'openspec'), name)!, 'utf8');

describe('bin parser reads the shipped schemas', () => {
  test('spec: gated, every verb resolves, un-indented block lists populate', () => {
    const schema = parseSchemaYamlBin(SHIPPED('spec'), 'spec');
    assert.equal(schemaIsGatedBin(schema), true, 'spec schema must be gated on the CLI side');
    assert.equal(artifactForGrantVerbBin(schema, 'propose')?.id, 'idea');
    assert.equal(artifactForGrantVerbBin(schema, 'draft')?.id, 'requirements');
    assert.equal(artifactForGrantVerbBin(schema, 'research')?.id, 'research');
    assert.equal(artifactForGrantVerbBin(schema, 'refine')?.id, 'refined-requirements');
    assert.equal(artifactForGrantVerbBin(schema, 'plan')?.id, 'plan');
    assert.equal(artifactForGrantVerbBin(schema, 'execute')?.id, 'tasks');
    const requirements = schema.artifacts.find((a: any) => a.id === 'requirements');
    assert.deepEqual(requirements?.requiresApproval, ['idea']);
    assert.deepEqual(
      requirements?.sections.map((s: any) => s.id),
      ['Done when', 'Scope', 'Out of Scope', 'Guardrails'],
    );
    const idea = schema.artifacts.find((a: any) => a.id === 'idea');
    assert.deepEqual(
      idea?.sections.map((s: any) => s.id),
      ['Pain', 'Questions'],
    );
  });

  test('mission: flow lists still parse — verbs, verdict line, receipts', () => {
    const schema = parseSchemaYamlBin(SHIPPED('mission'), 'mission');
    assert.equal(schemaIsGatedBin(schema), true);
    assert.equal(artifactForGrantVerbBin(schema, 'deal')?.id, 'proposition');
    assert.equal(artifactForGrantVerbBin(schema, 'order')?.id, 'plan');
    const execution = schema.artifacts.find((a: any) => a.id === 'execution');
    assert.equal(execution?.verdictLine, 'Human validation');
    assert.equal(execution?.receivesReceipts, true);
  });
});

describe('parity: bin ≡ src on the shipped schemas', () => {
  test('projections equal over spec and mission — drift fails loudly', () => {
    const project = (schema: any) => ({
      name: schema.name,
      declares: schema.declares,
      artifacts: schema.artifacts.map((a: any) => ({
        id: a.id,
        generates: a.generates,
        requiresApproval: a.requiresApproval,
        requiresWritten: a.requiresWritten ?? [],
        unlocks: a.unlocks ?? [],
        grantVerb: a.grantVerb,
        sections: (a.sections ?? []).map((s: any) => s.id),
        lines: a.lines ?? [],
        verdictLine: a.verdictLine,
        completes: a.completes,
        receivesReceipts: !!a.receivesReceipts,
        unlocksSource: !!a.unlocksSource,
      })),
    });
    for (const name of ['spec', 'mission']) {
      const srcSchema = parseSchemaYaml(SHIPPED(name), name);
      const binSchema = parseSchemaYamlBin(SHIPPED(name), name);
      assert.deepEqual(project(binSchema), project(srcSchema), `parity broken on ${name}`);
    }
  });
});
