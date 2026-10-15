/**
 * Gate enablement and exemption paths are extension config, not policy.
 * config.json lives beside index.ts in the extension root.
 *
 * Root resolution: this module lives in <extension-root>/src/, the config
 * in <extension-root>/. jiti does not guarantee import.meta.dirname, so the
 * module directory is resolved from import.meta.url and the config is
 * looked up at the extension root first, then beside this module (single-
 * file layout). A missing config never disables accounting: the gate stays
 * enabled with no exemptions.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  /** Entry-store instrument names that pass ungated (the gate never gates its instruments). */
  accountingTools?: readonly string[];
  /** Extra tool names classified read-only at load (merged over the built-in
   *  set) — the escape hatch for new research tools without a package
   *  release. Absent key = no override. */
  readOnlyTools?: readonly string[];
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
  const accountingTools = Array.isArray(parsed.accountingTools)
    ? parsed.accountingTools.filter(
        (name): name is string => typeof name === 'string' && name.length > 0,
      )
    : [];
  const readOnlyTools = Array.isArray(parsed.readOnlyTools)
    ? parsed.readOnlyTools.filter(
        (name): name is string => typeof name === 'string' && name.length > 0,
      )
    : [];
  return {
    enabled: parsed.enabled !== false,
    exempt: Object.freeze(exempt),
    accountingTools: Object.freeze(accountingTools),
    ...(readOnlyTools.length > 0 ? { readOnlyTools: Object.freeze(readOnlyTools) } : {}),
  };
}

/** Parse a config JSON string directly (test surface; same rules as file load). */
export function parseConfigString(raw: string): GateConfig {
  return parseConfig(raw, '<string>');
}

/** Config candidates in resolution order: extension root, then module directory. */
function configCandidates(moduleDir: string): string[] {
  return [join(moduleDir, '..', 'config.json'), join(moduleDir, 'config.json')];
}

function moduleDir(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return import.meta.dirname ?? process.cwd();
  }
}

export function loadGateConfig(extensionRoot?: string): GateConfig {
  const candidates = extensionRoot
    ? [join(extensionRoot, 'config.json')]
    : configCandidates(moduleDir());
  for (const candidate of candidates) {
    try {
      return parseConfig(readFileSync(candidate, 'utf8'), candidate);
    } catch {
      // try the next candidate
    }
  }
  // No config file or unreadable: gate stays enabled with no exemptions.
  // Missing accounting inputs never disable accounting.
  return DEFAULT_CONFIG;
}
