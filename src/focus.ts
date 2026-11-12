/**
 * Focus read-path — where the gate learns the active change.
 *
 * Primary: the room file (.focus) — one aim per room, whatever surface
 * wrote it (readRoomFocus). The gate prefers it over any session fact.
 *
 * Fallback: this session's entry store — the status package's focus tool
 * persists `eospec.focus` facts (the pre-rebuild brand name must ship in
 * that package before its entries read again). The gate only reads that
 * entry type.
 *
 * Inheritance: a subagent child process carries PI_SUBAGENT_DELEGATION
 * {parentSessionId,...}; the parent's session file is located under the
 * session root and its latest focus fact is inherited as the child's
 * active change — only while no room file aims the room.
 *
 * Validation: a focus names an active change only if that change exists on
 * disk (openspec/changes/<id>/) — stale focus facts do not attribute.
 * Fallback: none needed beyond disk validation; the CLI (`eospec focus`)
 * is a human remedy, not a gate input.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { grantedSet, readChangeMeta } from './approval.ts';
import { resolveChangeSchema, schemaIsGated } from './schema.ts';

export const OPENSPEC_FOCUS_ENTRY_TYPE = 'eospec.focus';

export type ActiveFocus = {
  change: string;
  taskId?: string;
  inheritedFrom?: string;
};

type SessionManagerLike = {
  getEntries(): { type: string; customType?: string; data?: unknown }[];
};

function focusFromData(data: unknown): ActiveFocus | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const record = data as Record<string, unknown>;
  if (typeof record.change !== 'string' || record.change.length === 0) return undefined;
  const taskId = typeof record.taskId === 'string' ? record.taskId : undefined;
  return { change: record.change, taskId };
}

function entryToFocus(entry: { type: string; customType?: string; data?: unknown }): ActiveFocus | undefined {
  if (entry.type !== 'custom' || entry.customType !== OPENSPEC_FOCUS_ENTRY_TYPE) return undefined;
  const data = entry.data;
  if (typeof data !== 'object' || data === null) return undefined;
  const record = data as Record<string, unknown>;
  if (record.mode === 'none') return undefined; // explicit clear
  return focusFromData(data);
}

/** The room file — the CLI's aim (one flat-yaml snapshot per repo). The
 *  single focus store: one room has one aim, whatever surface wrote it.
 *  Reads both the keyed snapshot and the legacy one-line form. */
export function readRoomFocus(openspecRoot: string): ActiveFocus | undefined {
  const file = join(openspecRoot, '.focus');
  if (!existsSync(file)) return undefined;
  const text = readFileSync(file, 'utf8');
  const keyed = /^change:\s*(.+?)\s*$/mu.exec(text);
  if (keyed) return { change: keyed[1] };
  if (/^#/.test(text.trim())) return undefined; // keyed snapshot without a change: empty room
  const bare = text.trim().split('\n')[0]?.trim();
  return bare ? { change: bare } : undefined;
}

/** Latest focus fact in this session's entry store. */
export function readSessionFocus(sessionManager: SessionManagerLike | undefined): ActiveFocus | undefined {
  if (!sessionManager?.getEntries) return undefined;
  let latest: ActiveFocus | undefined;
  for (const entry of sessionManager.getEntries()) {
    const focus = entryToFocus(entry);
    if (focus) latest = focus;
    else if (entry.type === 'custom' && entry.customType === OPENSPEC_FOCUS_ENTRY_TYPE) latest = undefined; // cleared
  }
  return latest;
}

/** Read the last focus fact of a session file (jsonl), respecting explicit clears. */
export function readFocusFromSessionFile(file: string): ActiveFocus | undefined {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
  let latest: ActiveFocus | undefined;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof parsed !== 'object' || parsed === null) continue;
    const entry = parsed as { type?: string; customType?: string; data?: unknown };
    if (entry.type === 'custom' && entry.customType === OPENSPEC_FOCUS_ENTRY_TYPE) {
      const record =
        typeof entry.data === 'object' && entry.data !== null ? (entry.data as Record<string, unknown>) : {};
      if (record.mode === 'none') {
        latest = undefined;
      } else {
        latest = focusFromData(entry.data);
      }
    }
  }
  return latest;
}

/** Locate a session file by id under the sessions root (bounded glob).
 *  pi persists sessions as `<ISO-timestamp>_<sessionId>.jsonl`; exact
 *  `<sessionId>.jsonl` names stay supported for older/test layouts. */
export function findSessionFile(sessionRoot: string, sessionId: string): string | undefined {
  try {
    const exact = `${sessionId}.jsonl`;
    for (const dir of readdirSync(sessionRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const name of readdirSync(join(sessionRoot, dir.name))) {
        if (name === exact || name.endsWith(`_${sessionId}.jsonl`)) {
          return join(sessionRoot, dir.name, name);
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export type DelegationEnv = {
  childSessionId?: string;
  parentSessionId?: string;
  agent?: string;
};

export function parseDelegationEnv(raw: string | undefined): DelegationEnv | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.parentSessionId !== 'string' || parsed.parentSessionId.length === 0) return undefined;
    return {
      parentSessionId: parsed.parentSessionId,
      childSessionId: typeof parsed.childSessionId === 'string' ? parsed.childSessionId : undefined,
      agent: typeof parsed.agent === 'string' ? parsed.agent : undefined,
    };
  } catch {
    return undefined;
  }
}

/** The change a focus names is active only if it exists on disk. */
export function focusIsActive(focus: ActiveFocus | undefined, openspecRoot: string | undefined): focus is ActiveFocus {
  if (!focus || focus.change.length === 0) return false;
  if (!openspecRoot) return false;
  return existsSync(join(openspecRoot, 'changes', focus.change));
}

/** True when at least one change directory exists under <root>/changes
 *  (archive excluded) — the focus remedy is only real when something can
 *  actually be focused; otherwise the block leads with create/declare. */
/** The room's most recently touched live change — the aim remedy names
 *  it, so a cold agent never has to guess what to aim at. */
export function firstActiveChange(root: string): string | undefined {
  try {
    const dir = join(root, 'changes');
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'archive')
      .map((d) => ({ name: d.name, m: statSync(join(dir, d.name)).mtimeMs }))
      .sort((a, b) => b.m - a.m)[0]?.name;
  } catch {
    return undefined;
  }
}

export function hasActiveChanges(root: string): boolean {
  try {
    return readdirSync(join(root, 'changes'), { withFileTypes: true }).some(
      (entry) => entry.isDirectory() && entry.name !== 'archive',
    );
  } catch {
    return false;
  }
}

/** Walk up from cwd to the nearest openspec root (dir holding changes/). */
export function findOpenspecRoot(cwd: string): string | undefined {
  let dir = cwd;
  for (let i = 0; i < 40; i += 1) {
    if (existsSync(join(dir, 'openspec', 'changes'))) return join(dir, 'openspec');
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

// ── the room writer — the snapshot re-renders on every gate-side touch ──
// the CLI verbs re-render (bin/gate-lib.js twins); the watcher refreshes
// on attributed mutations and exempt touches inside the aimed change, so
// a human reading the room mid-walk never sees a stale count.

function taskProgress(root: string, slug: string, file: string): string {
  const path = join(root, 'changes', slug, file);
  if (!existsSync(path)) return '';
  const text = readFileSync(path, 'utf8');
  const total = (text.match(/^\s*[-*]\s*\[[xX ]\]/gmu) ?? []).length;
  if (total === 0) return '';
  const done = (text.match(/^\s*[-*]\s*\[[xX]\]/gmu) ?? []).length;
  return `${done}/${total}`;
}

/** Render the room snapshot — the src twin of bin/gate-lib.js renderRoom:
 *  the room names the human verb only, the task line exists only when
 *  the artifact has checkboxes, and the all-granted name follows the
 *  walk while the counter follows the receipts. */
export function renderRoom(root: string, slug: string): Record<string, string> {
  const meta = readChangeMeta(root, slug);
  const resolution = resolveChangeSchema(root, meta.raw.schema);
  const fields: Record<string, string> = { change: slug };
  if (!resolution.ok || !schemaIsGated(resolution.schema)) {
    fields['artifact-name'] = '';
    fields['artifact-idx'] = '';
    fields.task = '';
    fields['next-step'] = 'eospec close';
    return fields;
  }
  const schema = resolution.schema;
  const approved = grantedSet(meta);
  const fileOnDisk = (g: string) => existsSync(join(root, 'changes', slug, g));
  const idx = schema.artifacts.findIndex((a) => !approved.has(a.id) && !(a.optional && !fileOnDisk(a.generates)));
  const finalStep = schema.artifacts[schema.artifacts.length - 1]!;
  const bearer = schema.artifacts.find((a) => a.completes) ?? finalStep;
  if (idx === -1) {
    fields['artifact-name'] = finalStep.generates;
    fields['artifact-idx'] = `${schema.artifacts.length}/${schema.artifacts.length}`;
    fields.task = taskProgress(root, slug, bearer.generates);
    fields['next-step'] = 'eospec close';
  } else {
    const step = schema.artifacts[idx]!;
    fields['artifact-name'] = step.generates;
    fields['artifact-idx'] = `${idx + 1}/${schema.artifacts.length}`;
    fields.task = taskProgress(root, slug, step.generates);
    fields['next-step'] = 'eospec approve';
  }
  return fields;
}

/** Write the room snapshot (the src twin of bin/gate-lib.js writeFocus). */
export function writeFocusSnapshot(openspecRoot: string, slug: string): void {
  const fields = renderRoom(openspecRoot, slug);
  const lines = [
    '# one active change per room — eospec writes, verbs refresh',
    `change: ${fields.change}`,
    `artifact-name: ${fields['artifact-name'] || '""'}`,
    `artifact-idx: ${fields['artifact-idx'] || '""'}`,
  ];
  if (fields.task) lines.push(`task: ${fields.task}`);
  lines.push(`next-step: ${fields['next-step']}`);
  writeFileSync(join(openspecRoot, '.focus'), `${lines.join('\n')}\n`, 'utf8');
}
