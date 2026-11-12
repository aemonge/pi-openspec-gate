import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  artifactForFilename,
  allArtifactsGranted,
  findSchemaFile,
  parseSchemaYaml,
  resolveChangeSchema,
  scanDeclares,
  schemaIsGated,
  sectionTitles,
} from '../src/schema.ts';
import {
  actHint as actHintBin,
  parseSchemaYaml as parseSchemaYamlBin,
  pendingAct as pendingActBin,
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

  test('x-grant is silently ignored — the verbs died, schemas in the wild never break', () => {
    const short = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant: ship-it\n';
    const schema = parseSchemaYaml(short, 'fixture');
    assert.equal(schema.artifacts.length, 1);
    const bin = parseSchemaYamlBin(short, 'fixture');
    assert.equal(bin.artifacts.length, 1);
    assert.ok(!('grantVerb' in schema.artifacts[0]!) && !('grantVerb' in bin.artifacts[0]!));
  });

  test('reserved words are moot — x-grant-verb parses clean and resolves nothing', () => {
    for (const verb of ['next', 'pause', 'resume', 'go']) {
      const yaml = `name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant-verb: ${verb}\n`;
      const schema = parseSchemaYaml(yaml, 'fixture');
      const bin = parseSchemaYamlBin(yaml, 'fixture');
      assert.ok(schema.artifacts.length === 1 && bin.artifacts.length === 1);
      assert.ok(!('grantVerb' in schema.artifacts[0]!) && !('grantVerb' in bin.artifacts[0]!));
    }
  });

  test('actHint: unaimed rooms name the aim, aimed rooms say approve (bin)', () => {
    const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n';
    parseSchemaYamlBin(yaml, 'fixture');
    assert.equal(actHintBin('/no/such/root', 'c1'), 'eospec focus c1');
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
  test('the repo spec schema resolves project-locally and is gated', () => {
    const openspecRoot = join(REPO_ROOT, 'openspec');
    const file = findSchemaFile(openspecRoot, 'spec');
    assert.ok(file, 'repo-local spec schema found');
    const resolution = resolveChangeSchema(openspecRoot, 'spec');
    assert.ok(resolution.ok);
    if (resolution.ok) {
      assert.equal(resolution.schema.artifacts.length, 5, 'the walk is five steps (the fifth conditional)');
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

  test('the walk killed the declared verbs — no artifact resolves one', () => {
    const schema = parseSchemaYaml(MISSION_YAML, 'fixture');
    for (const artifact of schema.artifacts) assert.ok(!('grantVerb' in artifact));
  });
});

// ── cli-schema-tag-parity — the shipped schemas through the bin parser ──
// Red first (2026-10-23, live-caught): un-indented block lists parsed empty
// ⇒ schemaIsGated false, verbs unreachable, x-sections lost. The mission
// test pins no-regression: its flow lists always parsed.

const SHIPPED = (name: string): string =>
  readFileSync(findSchemaFile(join(REPO_ROOT, 'openspec'), name)!, 'utf8');

describe('bin parser reads the shipped schemas', () => {
  test('spec: gated, verbs resolve nothing, block lists populate', () => {
    const schema = parseSchemaYamlBin(SHIPPED('spec'), 'spec');
    assert.equal(schemaIsGatedBin(schema), true, 'spec schema must be gated on the CLI side');
    for (const artifact of schema.artifacts) assert.ok(!('grantVerb' in artifact), 'the verbs died by silent ignore');
    const investigate = schema.artifacts.find((a: any) => a.id === 'investigate');
    assert.deepEqual(investigate?.requiresApproval, ['brainstorm']);
    assert.deepEqual(investigate?.unlocks, ['research']);
    const brainstorm = schema.artifacts.find((a: any) => a.id === 'brainstorm');
    assert.deepEqual(
      brainstorm?.sections.map((s: any) => s.id),
      ['Pain', 'Questions'],
    );
    const plan = schema.artifacts.find((a: any) => a.id === 'plan');
    assert.deepEqual(
      plan?.sections.map((s: any) => s.id),
      ['Estimate', 'Skills', 'Workflow', 'Slices', 'Verification', 'History'],
    );
    const execute = schema.artifacts.find((a: any) => a.id === 'execute');
    assert.equal(execute?.verdictLine, 'Human validation');
    assert.equal(execute?.completes, 'approved');
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
        unlocksSource: !!a.unlocksSource,
      })),
    });
    for (const name of ['spec']) {
      const srcSchema = parseSchemaYaml(SHIPPED(name), name);
      const binSchema = parseSchemaYamlBin(SHIPPED(name), name);
      assert.deepEqual(project(binSchema), project(srcSchema), `parity broken on ${name}`);
    }
  });
});

test('scanDeclares: a project-local schema shadows a global one by name', () => {
  const lab = mkdtempSync(join(tmpdir(), 'scan-lab-'));
  const fakeGlobal = mkdtempSync(join(tmpdir(), 'scan-global-'));
  const prevData = process.env.XDG_DATA_HOME;
  process.env.XDG_DATA_HOME = join(fakeGlobal, 'data');
  try {
    mkdirSync(join(lab, 'openspec', 'schemas', 'dup'), { recursive: true });
    writeFileSync(
      join(lab, 'openspec', 'schemas', 'dup', 'schema.yaml'),
      'name: dup\nx-declares: [local phrase]\nartifacts:\n  - id: a\n    generates: 1-a.md\n',
      'utf8',
    );
    const globalDir = join(process.env.XDG_DATA_HOME!, 'openspec', 'schemas', 'dup');
    mkdirSync(globalDir, { recursive: true });
    writeFileSync(
      join(globalDir, 'schema.yaml'),
      'name: dup\nx-declares: [global phrase]\nartifacts:\n  - id: a\n    generates: 1-a.md\n',
      'utf8',
    );
    const phrases = scanDeclares(join(lab, 'openspec'));
    assert.ok(phrases.has('local phrase'), 'the live (local) phrases are remedies');
    assert.ok(!phrases.has('global phrase'), 'the shadowed (global) phrases are not');
  } finally {
    if (prevData === undefined) delete process.env.XDG_DATA_HOME;
    else process.env.XDG_DATA_HOME = prevData;
    rmSync(lab, { recursive: true, force: true });
    rmSync(fakeGlobal, { recursive: true, force: true });
  }
});

test('x-optional and x-requires-verdict parse as flags on both parsers', () => {
  const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n    x-optional: true\n    x-requires-verdict: true\n';
  for (const parse of [parseSchemaYaml, parseSchemaYamlBin]) {
    const schema = parse(yaml, 'inline');
    assert.equal(schema.artifacts[1]!.optional, true, 'x-optional parsed');
    assert.equal(schema.artifacts[1]!.requiresVerdict, true, 'x-requires-verdict parsed');
    assert.equal(schema.artifacts[0]!.optional, false, 'absent flag defaults false');
    assert.equal(schema.artifacts[0]!.requiresVerdict, false, 'absent flag defaults false');
  }
});

test('x-optional must be true or absent — fails loudly otherwise', () => {
  const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-optional: sometimes\n';
  for (const parse of [parseSchemaYaml, parseSchemaYamlBin]) {
    assert.throws(() => parse(yaml, 'inline'), /must be true \(or absent\)/u);
  }
});

test('x-requires-verdict must be true or absent — fails loudly otherwise', () => {
  const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-requires-verdict: false\n';
  for (const parse of [parseSchemaYaml, parseSchemaYamlBin]) {
    assert.throws(() => parse(yaml, 'inline'), /must be true \(or absent\)/u);
  }
});

test('allArtifactsGranted: optional artifact skips while absent, demands once on disk', () => {
  const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: post\n    generates: 5-post.md\n    x-requires-approval: [a]\n    x-optional: true\n';
  const schema = parseSchemaYaml(yaml, 'fixture');
  const grants = new Set(['a']);
  assert.equal(allArtifactsGranted(schema, grants, () => false), true, 'absent fifth: satisfied — findings never surfaced');
  assert.equal(allArtifactsGranted(schema, grants, () => true), false, 'fifth on disk: the walk demands it');
  assert.equal(allArtifactsGranted(schema, grants), false, 'no filesystem evidence: conservative default demands');
  assert.equal(allArtifactsGranted(schema, new Set(['a', 'post']), () => true), true, 'granted: satisfied regardless');
});

test('pendingAct: optional-absent fifth never owns the echo; on disk it does', () => {
  const lab = mkdtempSync(join(tmpdir(), 'pending-act-'));
  try {
    const changes = join(lab, 'changes', 's');
    mkdirSync(changes, { recursive: true });
    const yaml = 'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: post\n    generates: 5-post.md\n    x-requires-approval: [a]\n    x-optional: true\n';
    const schema = parseSchemaYamlBin(yaml, 'fixture');
    assert.equal(pendingActBin(lab, 's', schema, new Set(['a'])), undefined, 'absent: no pending act — the walk is complete');
    writeFileSync(join(changes, '5-post.md'), '# Post-delivery\n', 'utf8');
    assert.match(pendingActBin(lab, 's', schema, new Set(['a']))!, /read 5-post\.md/u, 'on disk: the echo demands it');
  } finally {
    rmSync(lab, { recursive: true, force: true });
  }
});
