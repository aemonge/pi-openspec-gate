/**
 * gate-lib — plain-JS core for the terminal CLIs (no TypeScript: node
 * refuses type-stripping inside node_modules, so npm-installed bins must
 * be runnable as plain JS).
 *
 * Meta format contract: flat `key: value` lines — the same format
 * src/approval.ts reads/writes; the contract test in pios-wrapper.test.ts
 * proves the two implementations agree.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findOpenspecRoot(start) {
  let dir = start;
  for (let i = 0; i < 40; i += 1) {
    if (existsSync(join(dir, 'openspec', 'changes'))) return join(dir, 'openspec');
    const parent = join(dir, '..');
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

export function changeMetaPath(root, change) {
  return join(root, 'changes', change, '.openspec.yaml');
}

/** Parse flat key: value lines; missing file → {}. */
export function readChangeMeta(root, change) {
  const raw = {};
  const file = changeMetaPath(root, change);
  if (!existsSync(file)) return raw;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/u.exec(line);
    if (m) raw[m[1]] = m[2].trim();
  }
  return raw;
}

/** Set keys, preserving every other line; set-only never overwrites. */
export function writeChangeMeta(root, change, values, options = {}) {
  const file = changeMetaPath(root, change);
  let lines = [];
  if (existsSync(file)) lines = readFileSync(file, 'utf8').split('\n');
  const pending = new Map(Object.entries(values));
  const out = [];
  for (const line of lines) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):/u.exec(line);
    if (m && pending.has(m[1])) {
      if (!(options.onlyIfAbsent && rawHas(line))) out.push(`${m[1]}: ${pending.get(m[1])}`);
      else out.push(line);
      pending.delete(m[1]);
    } else {
      out.push(line);
    }
  }
  for (const [k, v] of pending) out.push(`${k}: ${v}`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out.join('\n').replace(/\n*$/u, '\n'), 'utf8');
}

function rawHas(line) {
  return /^([A-Za-z_][A-Za-z0-9_]*):\s*\S+/u.test(line);
}

export function utcNowStamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

/** Human-terminal cockpit: which changes need a human act. */
export function pendingReport(root) {
  const changesDir = join(root, 'changes');
  const rows = [];
  for (const dir of readdirSync(changesDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === 'archive') continue;
    const meta = readChangeMeta(root, dir.name);
    const status = meta.status ?? 'no-meta';
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
        : humanWait && !meta.validated
          ? 'needs confirm (human-validation step open)'
          : open > 0
            ? `${open} open steps`
            : 'ready to archive?';
    const approvedSuffix = meta.approved_at ? ` · approved ${meta.approved_at}` : '';
    rows.push(`${dir.name.padEnd(36)}${status.padEnd(10)}${need}${approvedSuffix}`);
  }
  return rows.length === 0 ? 'nothing pending — no active changes' : rows.join('\n');
}
