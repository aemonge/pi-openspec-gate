/**
 * pi-openspec-gate — human-terminal approval surface.
 *
 *   pi-openspec-gate approve <slug>    set status: approved (+ approved_at)
 *   pi-openspec-gate validate <slug>   set validated (+ validated_at)
 *
 * Intended for the HUMAN's terminal only. The gate blocks any tool-call
 * invocation of this script (approval-touch guard) — approval must never be
 * reachable from assistant tooling. Running it here means a human typed it.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

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

const [command, slug] = process.argv.slice(2);
const root = findOpenspecRoot(process.cwd());

if (!root || (command !== 'approve' && command !== 'validate') || !slug) {
  console.error('usage: pi-openspec-gate approve|validate <change-slug>');
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
  console.log(`validated ${slug} · at ${at}`);
}
