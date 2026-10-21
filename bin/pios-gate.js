/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   pios-gate grant <slug> <artifact-id>
 *                               the canonical grant — an artifact id or
 *                               an artifact/section id-path; structure
 *                               and gated sections checked before stamping
 *   pios-gate <verb> <slug>    an x-grant-verb the change's schema
 *                               declares (vocabulary from data, not code)
 *   pios-gate approve <slug> [artifact-id]
 *                               canonical stamp; none given = big-bang (all
 *                               remaining rungs on a gated schema, legacy
 *                               status-only otherwise)
 *   pios-gate confirm <slug>    permits verdict-line [x] flips
 *   pios-gate pending           the cockpit — every mission, next acts
 *   pios-gate inspect <slug>    one mission, verbose (own verb: `show`
 *                               stays openspec's passthrough)
 *   pios-gate focus             teaching: focus is a session instrument
 *   pios-gate <anything else>   exec openspec <argv> verbatim, exit code
 *                               intact — exec, never interpretation
 *
 * Reserved words never forward. Human terminal only: the gate's
 * approval-touch guard blocks tool-call invocations of every grant
 * surface, reserved or declared.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  artifactForGrantVerb,
  findOpenspecRoot,
  grantRung,
  pendingReport,
  readChangeMeta,
  resolveChangeSchema,
  schemaIsGated,
  showReport,
  utcNowStamp,
  writeChangeMeta,
} from './gate-lib.js';

const [command, slug, rungArg] = process.argv.slice(2);

const rootOf = () => {
  const root = findOpenspecRoot(process.cwd());
  if (!root) {
    console.error('no openspec/changes/ found (walked up from cwd)');
    process.exit(2);
  }
  return root;
};

const changeOrDie = (root, s, usage) => {
  if (!s) {
    console.error(usage);
    process.exit(2);
  }
  if (!existsSync(join(root, 'changes', s))) {
    console.error(`no such change: ${s} (under ${root}/changes/)`);
    process.exit(2);
  }
};

const doGrant = (root, s, artifactId) => {
  const result = grantRung(root, s, artifactId);
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(
    result.completed
      ? `granted ${s} · ${result.granted} · ladder complete — status: approved · at ${result.at}`
      : `granted ${s} · ${result.granted} · at ${result.at}`,
  );
  process.exit(0);
};

if (command === 'pending') {
  console.log(pendingReport(rootOf()));
  process.exit(0);
}

if (command === 'inspect') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate inspect <change-slug>');
  console.log(showReport(root, slug));
  process.exit(0);
}

if (command === 'focus') {
  console.log('focus is a session instrument — set it with your cockpit/status tools (openspec_focus), not the terminal');
  process.exit(0);
}

// canonical grant: pios-gate grant <slug> <artifact-id | artifact/section>
if (command === 'grant') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate grant <change-slug> <artifact-id | artifact/section>');
  if (!rungArg) {
    console.error('usage: pios-gate grant <change-slug> <artifact-id | artifact/section>');
    process.exit(2);
  }
  doGrant(root, slug, rungArg);
}

if (command === 'approve') {
  const root = rootOf();
  changeOrDie(root, slug, `usage: pios-gate approve <change-slug> [artifact-id]`);
  if (rungArg) {
    doGrant(root, slug, rungArg);
  }
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  const at = utcNowStamp();
  if (resolution.ok && schemaIsGated(resolution.schema)) {
    // big-bang on a gated schema: every artifact, in sequence, same strict checks
    for (const artifact of resolution.schema.artifacts) {
      if (meta[`granted_${artifact.id}`]) continue;
      const result = grantRung(root, slug, artifact.id);
      if (!result.ok) {
        console.error(`big-bang stopped at '${artifact.id}': ${result.error}`);
        process.exit(1);
      }
    }
    console.log(`granted ${slug} · all rungs · ladder complete — status: approved · at ${at}`);
    process.exit(0);
  }
  writeChangeMeta(root, slug, { status: 'approved', approved_at: at });
  console.log(`approved ${slug} · at ${at}`);
  process.exit(0);
}

// schema-declared verb: pios-gate <x-grant-verb> <slug>
if (command && slug) {
  const root = findOpenspecRoot(process.cwd());
  if (root && existsSync(join(root, 'changes', slug))) {
    const meta = readChangeMeta(root, slug);
    const resolution = resolveChangeSchema(root, meta.schema);
    if (resolution.ok && schemaIsGated(resolution.schema)) {
      const artifact = artifactForGrantVerb(resolution.schema, command);
      if (artifact) doGrant(root, slug, artifact.id);
    }
  }
}

if (command === 'confirm') {
  const root = rootOf();
  changeOrDie(root, slug, 'usage: pios-gate confirm <change-slug>');
  const at = utcNowStamp();
  writeChangeMeta(root, slug, { validated: at, validated_at: at });
  console.log(`confirmed ${slug} · at ${at}`);
  process.exit(0);
}

// everything else: exec openspec verbatim — no arg rewriting, ever
const result = spawnSync('openspec', process.argv.slice(2), { stdio: 'inherit' });
if (result.error) {
  console.error(`pios-gate: cannot exec openspec (${result.error.message}) — is it on PATH?`);
  process.exit(127);
}
process.exit(result.status ?? 1);
