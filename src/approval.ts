/**
 * Change approval meta — accounting of a human act, never permission.
 *
 * A change's `.openspec.yaml` carries flat `key: value` lines. The gate READS
 * `status` (proposed|approved|…) and `validated`; it WRITES only the creation
 * stamp (`status: proposed`, `created_by: assistant`) for creations it
 * witnessed as tool calls. The human terminal (bin/pi-openspec-gate) writes
 * `status: approved` / `validated`. Approval is unreachable from assistant
 * tooling because the gate blocks any tool-call invocation of the CLI
 * (approval-touch guard, runs before every other decision).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type ChangeMeta = {
  status?: string;
  validated?: string;
  raw: Record<string, string>;
};

export const APPROVED = 'approved';

/** Path of a change's meta file. */
export function changeMetaPath(openspecRoot: string, change: string): string {
  return join(openspecRoot, 'changes', change, '.openspec.yaml');
}

/** Parse flat `key: value` lines; missing file → empty meta. */
export function readChangeMeta(openspecRoot: string, change: string): ChangeMeta {
  const raw: Record<string, string> = {};
  const file = changeMetaPath(openspecRoot, change);
  if (!existsSync(file)) return { raw };
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/u.exec(line);
    if (match) raw[match[1]] = match[2].trim();
  }
  return { status: raw.status, validated: raw.validated, raw };
}

export function changeIsApproved(meta: ChangeMeta): boolean {
  return meta.status === APPROVED;
}

/**
 * Set keys in a change's meta, preserving every other line. Set-only mode
 * (`onlyIfAbsent`) never overwrites an existing value — used for creation
 * stamps. Creates the file (and parent dir) when needed.
 */
export function writeChangeMeta(
  openspecRoot: string,
  change: string,
  values: Record<string, string>,
  options: { onlyIfAbsent?: boolean } = {},
): void {
  const file = changeMetaPath(openspecRoot, change);
  let lines: string[] = [];
  if (existsSync(file)) lines = readFileSync(file, 'utf8').split('\n');
  const pending = new Map(Object.entries(values));
  const out: string[] = [];
  for (const line of lines) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/u.exec(line);
    const key = match?.[1];
    if (key && pending.has(key)) {
      if (options.onlyIfAbsent && (match![2].trim().length > 0)) {
        out.push(line); // existing value wins — never overwrite a stamp
      } else {
        out.push(`${key}: ${pending.get(key)}`);
      }
      pending.delete(key);
    } else {
      out.push(line);
    }
  }
  for (const [key, value] of pending) out.push(`${key}: ${value}`);
  // collapse trailing blanks, single trailing newline
  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${out.join('\n')}\n`, 'utf8');
}

/** UTC instant, second precision — the house format for stamps. */
export function utcNowStamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}
