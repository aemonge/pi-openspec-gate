/**
 * Path extraction from tool inputs — the enumerable targets of a call.
 *
 * Only tools whose targets are explicit path arguments can be path-exempted.
 * bash never qualifies: its targets are not reliably enumerable, so bash
 * mutations are never path-exempt (they go through focus/declare/block).
 */
import { isAbsolute, resolve, sep } from 'node:path';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Extract explicit path-like arguments from a tool input. */
export function extractPaths(toolName: string, input: unknown, cwd: string): string[] {
  if (!isRecord(input)) return [];
  const tool = toolName.toLowerCase();
  const raw: string[] = [];
  const push = (value: unknown): void => {
    const s = asString(value);
    if (s) raw.push(s);
  };
  push(input.path);
  push(input.file_path);
  push(input.filePath);
  push(input.filename);
  push(input.notebookPath);
  if (tool === 'write' || tool === 'edit' || tool === 'multi_edit' || tool === 'applypatch') {
    push(input.path ?? input.file_path);
    if (Array.isArray(input.edits)) {
      for (const edit of input.edits) if (isRecord(edit)) push(edit.path);
    }
    if (isRecord(input.diff) || isRecord(input.patch)) {
      push((input.diff as Record<string, unknown>)?.path ?? (input.patch as Record<string, unknown>)?.path);
    }
  }
  if (Array.isArray(input.paths)) {
    for (const p of input.paths) push(p);
  }
  if (Array.isArray(input.files)) {
    for (const f of input.files) if (isRecord(f)) push(f.path);
  }
  // Deduplicate, resolve against cwd, keep absolute form.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    const abs = isAbsolute(p) ? p : resolve(cwd, p);
    if (!seen.has(abs)) {
      seen.add(abs);
      out.push(abs);
    }
  }
  return out;
}

/** Split a path into normalized segments. */
export function segmentsOf(path: string): string[] {
  return path.split(sep).filter((s) => s.length > 0 && s !== '.');
}
