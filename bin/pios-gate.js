/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   pios-gate propose|deal|plan|order|execute <slug>
 *                               the five grants — each stamps the rung you
 *                               just read, unlocking the next draft
 *   pios-gate approve <slug> [rung]
 *                               canonical stamp; no rung = big-bang (all
 *                               remaining rungs on a gated schema, legacy
 *                               status-only otherwise)
 *   pios-gate confirm <slug>    permits Human-validation [x] flips
 *   pios-gate pending           the cockpit — every mission, next acts
 *   pios-gate inspect <slug>    one mission, verbose (own verb: `show`
 *                               stays openspec's passthrough)
 *   pios-gate focus             teaching: focus is a session instrument
 *   pios-gate <anything else>   exec openspec <argv> verbatim, exit code
 *                               intact — exec, never interpretation
 *
 * Reserved verbs never forward. Human terminal only: the gate's
 * approval-touch guard blocks tool-call invocations of the verbs that
 * grant or validate.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  GRANT_VERBS,
  findOpenspecRoot,
  grantRung,
  pendingReport,
  readChangeMeta,
  resolveChangeSchema,
  rungForGrantVerb,
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

if (command === 'pending') {
  console.log(pendingReport(rootOf()));
  process.exit(0);
}

if (command === 'inspect') {
  const root = rootOf();
  if (!slug || !existsSync(join(root, 'changes', slug))) {
    console.error(`usage: pios-gate inspect <change-slug>`);
    process.exit(2);
  }
  console.log(showReport(root, slug));
  process.exit(0);
}

if (command === 'focus') {
  console.log('focus is a session instrument — set it with your cockpit/status tools (openspec_focus), not the terminal');
  process.exit(0);
}

const isGrantVerb = GRANT_VERBS.includes(command ?? '');

if (isGrantVerb || command === 'approve') {
  const root = rootOf();
  if (!slug) {
    console.error(`usage: pios-gate ${command} <change-slug>${command === 'approve' ? ' [rung]' : ''}`);
    process.exit(2);
  }
  if (!existsSync(join(root, 'changes', slug))) {
    console.error(`no such change: ${slug} (under ${root}/changes/)`);
    process.exit(2);
  }

  // grant verbs: stamp the positional rung (propose→rung1 … execute→rung5)
  if (isGrantVerb) {
    const meta = readChangeMeta(root, slug);
    const resolution = resolveChangeSchema(root, meta.schema);
    if (!resolution.ok || !schemaIsGated(resolution.schema)) {
      console.error(`schema declares no gates (${resolution.ok ? resolution.schema.name : resolution.reason}) — use: pios-gate approve ${slug}`);
      process.exit(2);
    }
    const artifact = rungForGrantVerb(resolution.schema, command);
    if (!artifact) {
      console.error(`schema ${resolution.schema.name} has no rung for '${command}' — use: pios-gate approve ${slug} <rung-id>`);
      process.exit(2);
    }
    const result = grantRung(root, slug, artifact.id);
    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }
    console.log(
      result.completed
        ? `granted ${slug} · ${result.granted} · ladder complete — status: approved · at ${result.at}`
        : `granted ${slug} · ${result.granted} · at ${result.at}`,
    );
    process.exit(0);
  }

  // approve: canonical rung stamp or big-bang
  if (rungArg) {
    const result = grantRung(root, slug, rungArg);
    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }
    console.log(
      result.completed
        ? `granted ${slug} · ${result.granted} · ladder complete — status: approved · at ${result.at}`
        : `granted ${slug} · ${result.granted} · at ${result.at}`,
    );
    process.exit(0);
  }
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.schema);
  const at = utcNowStamp();
  if (resolution.ok && schemaIsGated(resolution.schema)) {
    // big-bang on a gated schema: every rung, in order, same strict checks
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

if (command === 'confirm') {
  const root = rootOf();
  if (!slug) {
    console.error('usage: pios-gate confirm <change-slug>');
    process.exit(2);
  }
  if (!existsSync(join(root, 'changes', slug))) {
    console.error(`no such change: ${slug} (under ${root}/changes/)`);
    process.exit(2);
  }
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
