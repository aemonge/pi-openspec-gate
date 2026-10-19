/**
 * pios-gate — the gate as a feature extension of openspec (plain JS:
 * node refuses type-stripping under node_modules, so installed bins must
 * not be TypeScript).
 *
 *   pios-gate approve <slug>    human terminal: status: approved
 *   pios-gate confirm <slug>    human terminal: validated (permits
 *                               Human-validation [x] flips) — renamed from
 *                               `validate` so `pios-gate validate …`
 *                               forwards to openspec's structure lint
 *   pios-gate pending           what needs the human, one command
 *   pios-gate <anything else>   exec openspec <argv> verbatim, exit code
 *                               intact — exec, never interpretation
 *
 * Reserved verbs never forward. Human terminal only: the gate's
 * approval-touch guard blocks tool-call invocations of the approval verbs.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { findOpenspecRoot, pendingReport, utcNowStamp, writeChangeMeta } from './gate-lib.js';

const [command, slug] = process.argv.slice(2);

if (command === 'pending') {
  const root = findOpenspecRoot(process.cwd());
  if (!root) {
    console.error('no openspec/changes/ found (walked up from cwd)');
    process.exit(2);
  }
  console.log(pendingReport(root));
  process.exit(0);
}

if (command === 'approve' || command === 'confirm') {
  const root = findOpenspecRoot(process.cwd());
  if (!root || !slug) {
    console.error('usage: pios-gate approve|confirm <change-slug>');
    process.exit(2);
  }
  if (!existsSync(join(root, 'changes', slug))) {
    console.error(`no such change: ${slug} (under ${root}/changes/)`);
    process.exit(2);
  }
  const at = utcNowStamp();
  if (command === 'approve') {
    writeChangeMeta(root, slug, { status: 'approved', approved_at: at });
    console.log(`approved ${slug} · at ${at}`);
  } else {
    writeChangeMeta(root, slug, { validated: at, validated_at: at });
    console.log(`confirmed ${slug} · at ${at}`);
  }
  process.exit(0);
}

// everything else: exec openspec verbatim — no arg rewriting, ever
const result = spawnSync('openspec', process.argv.slice(2), { stdio: 'inherit' });
if (result.error) {
  console.error(`pios-gate: cannot exec openspec (${result.error.message}) — is it on PATH?`);
  process.exit(127);
}
process.exit(result.status ?? 1);
