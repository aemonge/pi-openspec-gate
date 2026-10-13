/**
 * Gate enablement and exemption paths are extension config, not policy.
 * config.json lives beside index.ts in the extension root.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ExemptRule = {
  /** Path prefix. Either the segment form "star-star / <segment> / star-star"
   *  (segment-boundary match anywhere in the path) or a plain
   *  absolute/relative path prefix. */
  prefix: string;
  /** Recorded category on every exempt fact. */
  category: string;
};

export type GateConfig = {
  enabled: boolean;
  exempt: readonly ExemptRule[];
};

const DEFAULT_CONFIG: GateConfig = { enabled: true, exempt: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseConfig(raw: string, source: string): GateConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
  if (!isRecord(parsed)) return DEFAULT_CONFIG;
  const exempt: ExemptRule[] = [];
  if (Array.isArray(parsed.exempt)) {
    for (const entry of parsed.exempt) {
      if (
        isRecord(entry) &&
        typeof entry.prefix === 'string' &&
        entry.prefix.length > 0 &&
        typeof entry.category === 'string' &&
        entry.category.length > 0
      ) {
        exempt.push({ prefix: entry.prefix, category: entry.category });
      }
    }
  }
  return {
    enabled: parsed.enabled !== false,
    exempt: Object.freeze(exempt),
  };
}

export function loadGateConfig(extensionRoot?: string): GateConfig {
  const root = extensionRoot ?? import.meta.dirname ?? process.cwd();
  try {
    return parseConfig(readFileSync(join(root, 'config.json'), 'utf8'), join(root, 'config.json'));
  } catch {
    // No config file or unreadable: gate stays enabled with no exemptions.
    // Missing accounting inputs never disable accounting.
    return DEFAULT_CONFIG;
  }
}
