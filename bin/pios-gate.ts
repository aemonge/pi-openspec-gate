/**
 * pios-gate — the gate as a feature extension of openspec.
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
 * Reserved verbs never forward; a passthrough loop is a bug. Intended for
 * the HUMAN's terminal — the gate blocks any tool-call invocation of the
 * approval verbs (approval-touch guard). Running it here means a human
 * typed it.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import { writeChangeMeta, utcNowStamp } from '../src/approval.ts';

function findOpenspecRoot(start: string): string | undefined {
  let dir = start;
  for (let i = 0; i < 40; i += 1) {
    if (existsSync(join(dir, 'openspec', 'changes'))) return join(dir, 'openspec');
    const parent = join(dir, '..');
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

/** Human-terminal cockpit: which changes need a human act. */
function pending(root: string): number {
  const changesDir = join(root, 'changes');
  const rows: string[] = [];
  for (const dir of readdirSync(changesDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === 'archive') continue;
    const metaFile = join(changesDir, dir.name, '.openspec.yaml');
    let status = 'no-meta';
    let approvedAt: string | undefined;
    let validated = false;
    if (existsSync(metaFile)) {
      const meta = readFileSync(metaFile, 'utf8');
      status = /^status:\s*(\S+)/mu.exec(meta)?.[1] ?? status;
      approvedAt = /^approved_at:\s*(\S+)/mu.exec(meta)?.[1];
      validated = /^validated_at:\s*\S+/mu.test(meta);
    }
    const tasksFile = join(changesDir, dir.name, '4-tasks.md');
    let open = 0;
    let humanWait = false;
    if (existsSync(tasksFile)) {
      const tasks = readFileSync(tasksFile, 'utf8');
      open = (tasks.match(/^- \[ \]/gmu) ?? []).length;
      humanWait = /^- \[ \][^\n]*Human validation/mu.test(tasks);
    }
    const need =
      status !== 'approved'
        ? 'needs approve'
        : humanWait && !validated
          ? 'needs confirm (human-validation step open)'
          : open > 0
            ? `${open} open steps`
            : 'ready to archive?';
    rows.push(`${dir.name.padEnd(36)}${status.padEnd(10)}${need}${approvedAt ? ` · approved ${approvedAt}` : ''}`);
  }
  if (rows.length === 0) {
    console.log('nothing pending — no active changes');
  } else {
    console.log(rows.join('\n'));
  }
  return 0;
}

const [command, slug] = process.argv.slice(2);

if (command === 'pending') {
  const root = findOpenspecRoot(process.cwd());
  if (!root) {
    console.error('no openspec/changes/ found (walked up from cwd)');
    process.exit(2);
  }
  process.exit(pending(root));
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
