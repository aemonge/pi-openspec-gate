/**
 * The vocabulary suite — the claim's live proof. A custom three-step
 * schema with verbs unlike any the engine ever knew, section sub-grants,
 * an early source unlock, a declared verdict line, a declared receipt
 * target, and declared latch phrases. Ends with the grep-proof: the
 * engine's own code may never carry the flow vocabulary it enforces.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import {
  artifactForGrantVerb,
  allArtifactsGranted,
  parseSchemaYaml,
  parseSectionPath,
  receiptArtifactFor,
  schemaVerdictLine,
  sectionTitles,
  capabilityUnlocked,
  writesUnlocked,
} from '../src/schema.ts';

const REPO_ROOT = join(import.meta.dirname, '..');
const WRAPPER = join(REPO_ROOT, 'bin', 'pios-gate');

// ── parser: the full vocabulary in one schema ──────────────────────────

const RICH_SCHEMA = [
  'name: rich',
  'x-declares: [launch the rich thing, ship the rich thing]',
  'artifacts:',
  '  - id: dream',
  '    generates: 1-dream.md',
  '    x-grant-verb: dream-up',
  '  - id: build',
  '    generates: 2-build.md',
  '    x-grant-verb: build-it',
  '    x-requires-approval: [dream]',
  '    x-requires-written: [dream]',
  '    x-unlocks: [research, writes]',
  '    x-sections:',
  '      - id: alpha',
  '      - id: beta',
  '        x-requires-approval: [alpha]',
  '  - id: ship',
  '    generates: 3-ship.md',
  '    x-requires-approval: [build]',
  '    x-verdict-line: Owner acceptance',
  '    x-receives-receipts: true',
  '    x-completes: approved',
].join('\n');

describe('vocabulary: parsing and validation', () => {
  test('rich sections, verbs, verdict, receipts, completes, unlock, declares all parse', () => {
    const schema = parseSchemaYaml(RICH_SCHEMA, 'fixture');
    assert.deepEqual(schema.declares, ['launch the rich thing', 'ship the rich thing']);
    const build = schema.artifacts[1]!;
    assert.deepEqual(sectionTitles(build), ['alpha', 'beta']);
    assert.deepEqual(build.sections[1]!.requiresApproval, ['alpha']);
    assert.deepEqual(build.requiresWritten, ['dream']);
    assert.equal(artifactForGrantVerb(schema, 'dream-up')?.id, 'dream');
    assert.equal(artifactForGrantVerb(schema, 'build-it')?.id, 'build');
    assert.equal(schemaVerdictLine(schema), 'Owner acceptance');
    assert.equal(receiptArtifactFor(schema)?.id, 'ship');
    assert.equal(schema.artifacts[2]!.completes, 'approved');
    assert.deepEqual(schema.artifacts[1]!.unlocks, ['research', 'writes']); // build unlocks early
    assert.deepEqual(schema.artifacts[2]!.unlocks, []);
  });

  test('unlocks: the declared artifact opens writes and research before the schema completes', () => {
    const schema = parseSchemaYaml(RICH_SCHEMA, 'fixture');
    const afterBuild = new Set(['dream', 'build', 'build/alpha', 'build/beta']);
    assert.equal(allArtifactsGranted(schema, afterBuild), false);
    assert.equal(writesUnlocked(schema, afterBuild), true); // early writes unlock
    assert.equal(capabilityUnlocked(schema, afterBuild, 'research'), true); // research opened at the same grant
    assert.equal(writesUnlocked(schema, new Set(['dream'])), false);
    assert.equal(capabilityUnlocked(schema, new Set(['dream']), 'research'), false);
  });

  test('absent unlock declaration falls back to full completion (legacy)', () => {
    const schema = parseSchemaYaml(
      'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n  - id: b\n    generates: 2-b.md\n    x-requires-approval: [a]\n',
      'fixture',
    );
    assert.equal(writesUnlocked(schema, new Set(['a'])), false);
    assert.equal(writesUnlocked(schema, new Set(['a', 'b'])), true);
  });

  test('loud validation: unknown sibling, self-reference, duplicate verb, reserved verb, doubled tags, spaced gated id', () => {
    const cases: [string, RegExp][] = [
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-sections:\n      - id: one\n        x-requires-written: [ghost]\n',
        /unknown sibling section 'ghost'/u,
      ],
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-sections:\n      - id: one\n        x-requires-approval: [one]\n',
        /cannot require itself/u,
      ],
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant-verb: go\n  - id: b\n    generates: 2-b.md\n    x-grant-verb: go\n',
        /'go' declared by 'a' and 'b'/u,
      ],
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-grant-verb: pending\n',
        /reserved by the gate CLI/u,
      ],
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-completes: approved\n  - id: b\n    generates: 2-b.md\n    x-completes: approved\n',
        /at most one/u,
      ],
      [
        'name: s\nartifacts:\n  - id: a\n    generates: 1-a.md\n    x-sections:\n      - id: two words\n        x-requires-written: [x]\n',
        /single-word id/u,
      ],
    ];
    for (const [yaml, pattern] of cases) assert.throws(() => parseSchemaYaml(yaml, 'fixture'), pattern);
  });

  test('parseSectionPath splits artifact/section and rejects everything else', () => {
    assert.deepEqual(parseSectionPath('some/one'), { artifactId: 'some', sectionId: 'one' });
    assert.equal(parseSectionPath('plain'), undefined);
    assert.equal(parseSectionPath('a/b/c'), undefined);
  });

  test('declared headings match case-insensitively — headings are prose, not ids', async () => {
    const { sectionHeadingPresent } = await import('../src/gate.ts');
    assert.ok(sectionHeadingPresent('## Design\n\nprose', 'design'));
    assert.ok(sectionHeadingPresent('## BUILD', 'build'));
    assert.ok(!sectionHeadingPresent('<!-- ## Build -->', 'build'));
  });

  test('wrapper help reads the manual — read-only, unfocused and bare', async () => {
    const { classifyMutation } = await import('../src/classifier.ts');
    const none = new Set<string>();
    for (const command of ['pios-gate --help', 'pi-openspec-gate -h', 'pios-gate --help | head -40']) {
      const verdict = classifyMutation('bash', { command }, undefined, none);
      assert.equal(verdict.mutating, false, command);
    }
  });
});

// ── the CLI walk: verbs by name, sub-grants, early unlock ─────────────

function customRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'vocab-repo-'));
  mkdirSync(join(dir, 'openspec', 'schemas', 'custom'), { recursive: true });
  mkdirSync(join(dir, 'openspec', 'changes', 'm2'), { recursive: true });
  mkdirSync(join(dir, 'fakebin'), { recursive: true });
  writeFileSync(join(dir, 'openspec', 'schemas', 'custom', 'schema.yaml'), `${RICH_SCHEMA}\n`, 'utf8');
  writeFileSync(join(dir, 'openspec', 'changes', 'm2', '.openspec.yaml'), 'schema: custom\n', 'utf8');
  writeFileSync(join(dir, 'fakebin', 'openspec'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return dir;
}

function run(dir: string, args: string[]): { status: number; stdout: string } {
  const result = spawnSync(WRAPPER, args, { cwd: dir, encoding: 'utf8' });
  return { status: result.status ?? -1, stdout: result.stdout + result.stderr };
}

describe('vocabulary: the CLI walk on a custom schema', () => {
  test('grants by declared verb, sub-grants by id-path, unlock at the declared artifact', () => {
    const dir = customRepo();
    try {
      const changeDir = join(dir, 'openspec', 'changes', 'm2');
      writeFileSync(join(changeDir, '1-dream.md'), '# Dream\n', 'utf8');
      writeFileSync(join(changeDir, '2-build.md'), '# Build\n\n## alpha\n\n## beta\n', 'utf8');
      writeFileSync(join(changeDir, '3-ship.md'), '# Ship\n\n- [ ] Owner acceptance — reply VALID\n', 'utf8');

      // a declared verb grants artifact 1 — the engine never knew this word
      assert.match(run(dir, ['dream-up', 'm2']).stdout, /granted m2 · dream/);

      // the artifact grant refuses while its gated section waits
      const gated = run(dir, ['build-it', 'm2']);
      assert.equal(gated.status, 1);
      assert.match(gated.stdout, /gated sections awaiting grants: build\/beta/);

      // sub-grant sequence: beta before alpha refuses
      const early = run(dir, ['grant', 'm2', 'build/beta']);
      assert.equal(early.status, 1);
      assert.match(early.stdout, /in sequence — grant 'build\/alpha' first/);

      assert.match(run(dir, ['grant', 'm2', 'build/alpha']).stdout, /granted m2 · build\/alpha/);
      assert.match(run(dir, ['grant', 'm2', 'build/beta']).stdout, /granted m2 · build\/beta/);
      assert.match(run(dir, ['build-it', 'm2']).stdout, /granted m2 · build/);

      // early unlock: source may begin though grants are incomplete
      const meta = readFileSync(join(changeDir, '.openspec.yaml'), 'utf8');
      assert.match(meta, /granted: dream,build\/alpha,build\/beta,build/);
      assert.doesNotMatch(meta, /status: approved/); // ship still ungranted
      const approvedList = meta
        .split('\n')
        .find((l) => l.startsWith('granted:'))!
        .slice('granted:'.length)
        .trim()
        .split(',');
      const schema = parseSchemaYaml(RICH_SCHEMA, 'fixture');
      assert.equal(writesUnlocked(schema, new Set(approvedList)), true);

      // completion grants by bare id (no verb declared) → status approved
      assert.match(run(dir, ['grant', 'm2', 'ship']).stdout, /all artifacts granted — status: approved/);
      assert.match(readFileSync(join(changeDir, '.openspec.yaml'), 'utf8'), /status: approved/);

      // the cockpit names the declared verdict, never a hardcoded one
      assert.match(run(dir, ['pending']).stdout, /m2\s+approved\s+needs confirm \(verdict open\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── the claim, self-enforcing ──────────────────────────────────────────

describe('grep-proof: the engine carries no flow vocabulary', () => {
  test('src/, bin/, index.ts are clean of flow words and declaration phrases', () => {
    const engineFiles = [
      join(REPO_ROOT, 'index.ts'),
      ...readdirSync(join(REPO_ROOT, 'src'))
        .filter((f) => f.endsWith('.ts'))
        .map((f) => join(REPO_ROOT, 'src', f)),
      ...readdirSync(join(REPO_ROOT, 'bin'))
        .filter((f) => f.endsWith('.js'))
        .map((f) => join(REPO_ROOT, 'bin', f)),
    ];
    // the vocabulary the engine must never know again: the shipped
    // example's flow words (mission|ladder|rung), the first-generation
    // verbs, and the hardcoded verdict/filenames they owned.
    const forbidden =
      /\b(?:GRANT_VERBS|rungForGrantVerb|propose|deal)\b|4-tasks\.md|human\s+validation|rung\s+gate|\b(?:mission|ladders?|rungs?)\b/iu;
    const cliForbidden = /\b(?:order|rung)\b/iu;
    for (const file of engineFiles) {
      const content = readFileSync(file, 'utf8');
      assert.doesNotMatch(content, forbidden, `${file} carries flow vocabulary`);
      if (file.startsWith(join(REPO_ROOT, 'bin'))) {
        assert.doesNotMatch(content, cliForbidden, `${file} still knows the words 'order' or 'rung'`);
      }
    }
  });
});
