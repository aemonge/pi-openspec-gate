/**
 * Attribution appender — durable, visible receipts on disk.
 *
 *   declaration → one debt line in <openspec-root>/bare-work.md
 *                 (`bare — <words> · at <UTC>`), exactly one per job command
 *   attribution → one receipt line in the change's sidecar ledger
 *                 (changes/<slug>/.ledger — artifacts stay prose)
 *
 * Writes are serialized through a single-flight queue; failures never break
 * the gate's verdict (the fact store still holds the event).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

let queue: Promise<void> = Promise.resolve();

function serialized(write: () => void): Promise<void> {
  const run = queue.then(write);
  queue = run.catch(() => undefined);
  return run;
}

function appendLine(file: string, line: string): void {
  mkdirSync(dirname(file), { recursive: true });
  const prefix = existsSync(file) ? '\n' : '';
  appendFileSync(file, `${prefix}${line}\n`, 'utf8');
}

/** The file's last non-empty line, or undefined. */
function lastNonEmptyLine(file: string): string | undefined {
  if (!existsSync(file)) return undefined;
  const lines = readFileSync(file, 'utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i]!.trim().length > 0) return lines[i];
  }
  return undefined;
}

/** One visible debt line for a declared (bare) mutation. Exactly one line per call. */
export function appendDebtLine(openspecRoot: string | undefined, words: string, at: string): Promise<void> {
  return serialized(() => {
    if (!openspecRoot) return; // no openspec root on disk: the fact store still records it
    const file = join(openspecRoot, 'bare-work.md');
    const line = `bare — ${words} · at ${at}`;
    if (lastNonEmptyLine(file) === line) return; // double-loaded gate: the same declaration lands once
    appendLine(file, line);
  });
}

/** One attribution receipt into the change's sidecar ledger. */
export function appendAttributionReceipt(
  openspecRoot: string | undefined,
  change: string,
  receipt: { tool: string; paths: string[]; at: string },
): Promise<void> {
  return serialized(() => {
    if (!openspecRoot) return; // no openspec root on disk: the fact store still records
    const file = join(openspecRoot, 'changes', change, '.ledger');
    const line = `  gate-attributed · tool: ${receipt.tool} · paths: ${receipt.paths.join(', ') || '—'} · at ${receipt.at}`;
    // the gate can be loaded twice (dev machine: the published copy AND
    // this repo as a project package) — the same call lands once
    const last = lastNonEmptyLine(file);
    if (last === line) return;
    // a tight block: one separating blank line before the block, never
    // between receipts
    const needsBlank = last !== undefined && !last.startsWith('  gate-attributed');
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${needsBlank ? '\n' : ''}${line}\n`, 'utf8');
  });
}
