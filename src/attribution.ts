/**
 * Attribution appender — durable, visible receipts on disk.
 *
 *   declaration → one debt line in <openspec-root>/bare-work.md
 *                 (`bare — <words> · at <UTC>`), exactly one per "do it"
 *   attribution → one receipt line in the focused change's 4-tasks.md
 *                 (tool · paths · at)
 *
 * Writes are serialized through a single-flight queue; failures never break
 * the gate's verdict (the fact store still holds the event).
 */
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
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

/** One visible debt line for a declared (bare) mutation. Exactly one line per call. */
export function appendDebtLine(openspecRoot: string | undefined, words: string, at: string): Promise<void> {
  return serialized(() => {
    if (!openspecRoot) return; // no ladder root on disk: the fact store still records it
    appendLine(join(openspecRoot, 'bare-work.md'), `bare — ${words} · at ${at}`);
  });
}

/** One attribution receipt into the focused change's 4-tasks.md. */
export function appendAttributionReceipt(
  openspecRoot: string | undefined,
  change: string,
  receipt: { tool: string; paths: string[]; at: string },
): Promise<void> {
  return serialized(() => {
    if (!openspecRoot) return;
    appendLine(
      join(openspecRoot, 'changes', change, '4-tasks.md'),
      `  gate-attributed · tool: ${receipt.tool} · paths: ${receipt.paths.join(', ') || '—'} · at ${receipt.at}`,
    );
  });
}
