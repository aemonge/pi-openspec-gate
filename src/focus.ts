/**
 * Focus read-path — where the gate learns the active change.
 *
 * Primary: this session's entry store — the openspec focus tool already
 * persists `galactica-status.openspec-focus.v1` facts (verified in the
 * installed status package). The gate only reads that entry type.
 *
 * Inheritance: a subagent child process carries PI_SUBAGENT_DELEGATION
 * {parentSessionId,...}; the parent's session file is located under the
 * session root and its latest focus fact is inherited as the child's active
 * change (federated inheritance — the child gate runs the same law).
 *
 * Validation: a focus names an active change only if that change exists on
 * disk (openspec/changes/<id>/) — stale focus facts do not attribute.
 * Fallback: none needed beyond disk validation; the CLI (`openspec list`) is
 * a human remedy, not a gate input.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const OPENSPEC_FOCUS_ENTRY_TYPE = 'galactica-status.openspec-focus.v1';

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
