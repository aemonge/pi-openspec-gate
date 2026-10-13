/**
 * Exemption matcher — path-scoped only, from the explicit config list.
 *
 * Two deterministic forms, nothing fuzzy:
 *   segment form  "star-star / <segment> / star-star" — a path containing
 *                  that exact segment on a segment boundary (the openspec
 *                  segment matches any path with an openspec directory)
 *   plain prefix   — absolute or cwd-relative path prefix; a path is covered
 *                    when it equals the prefix or lives under it
 * A call is exempt only when EVERY enumerable target path is covered by some
 * rule (a mixed call still contains unaccounted work). Every exempt decision
 * records the matched rules (category + prefix) as a fact.
 * Tools without enumerable target paths (e.g. bash) are never path-exempt.
 */
import { isAbsolute, resolve } from 'node:path';

import type { ExemptRule } from './config.ts';
import { segmentsOf } from './paths.ts';

export type ExemptVerdict = {
  exempt: boolean;
  category?: string;
  prefix?: string;
};

function segmentOf(rule: string): string | undefined {
  const match = /^\*\*\/([^/*]+)\/\*\*$/.exec(rule);
  return match ? match[1] : undefined;
}

function coveredBy(path: string, rules: readonly ExemptRule[], cwd: string): ExemptRule | undefined {
  for (const rule of rules) {
    const segment = segmentOf(rule.prefix);
    if (segment) {
      if (segmentsOf(path).includes(segment)) return rule;
    } else {
      const base = isAbsolute(rule.prefix) ? rule.prefix : resolve(cwd, rule.prefix);
      if (path === base || path.startsWith(base.endsWith('/') ? base : `${base}/`)) return rule;
    }
  }
  return undefined;
}

export function matchExemption(
  toolName: string,
  targetPaths: readonly string[],
  rules: readonly ExemptRule[],
  cwd: string,
): ExemptVerdict {
  const tool = toolName.toLowerCase();
  // No enumerable targets → never path-exempt. Bash included by construction.
  if (targetPaths.length === 0 || tool === 'bash' || tool === 'shell') {
    return { exempt: false };
  }
  const matched: ExemptRule[] = [];
  for (const path of targetPaths) {
    const rule = coveredBy(path, rules, cwd);
    if (!rule) return { exempt: false };
    matched.push(rule);
  }
  const first = matched[0];
  return {
    exempt: true,
    category: [...new Set(matched.map((r) => r.category))].join('+'),
    prefix: [...new Set(matched.map((r) => r.prefix))].join('+'),
  };
}
