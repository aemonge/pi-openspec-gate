/**
 * pi-openspec-gate — human-terminal approval surface, permanent alias
 * (plain JS: installed bins must not be TypeScript — node refuses
 * type-stripping under node_modules).
 *
 *   pi-openspec-gate approve <slug>    set status: approved (+ approved_at)
 *   pi-openspec-gate validate <slug>   set validated (+ validated_at)
 *
 * The forward surface is pios-gate (confirm = validate, renamed); this
 * alias stays for every receipt and remedy line ever written.
 */
import process from 'node:process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { findOpenspecRoot, utcNowStamp, writeChangeMeta } from './gate-lib.js';

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
