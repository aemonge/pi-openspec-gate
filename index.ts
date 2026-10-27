/**
 * pi-openspec-gate — declared-work gate for Pi.
 *
 * Accounting only, never permission: another layer owns permission; this gate
 * owns declaredness. Every mutating tool call must be one of:
 *   exempt     — path-scoped, always recorded as a fact
 *   attributed — the openspec focus names an active change; receipt appended
 *   declared   — the human's own message said a schema-declared phrase
 *                (x-declares) — assistant text never declares; one visible
 *                debt line, then it proceeds
 *   blocked    — visible block, exact copy, every remedy real in this state
 *
 * Gate events are facts (pi.appendEntry). This extension never renders and
 * never injects prompts: no context handler, no protocol block, no shipped
 * skills — block reasons carry their own remedies, and every flow word the
 * gate acts on comes from schema x- tags in data.
 * Handler failure blocks the call as a fail-safe.
 */
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import { loadGateConfig } from './src/config.ts';
import { createGate } from './src/gate.ts';

export default function openspecGate(pi: ExtensionAPI): void {
  const config = loadGateConfig();
  if (!config.enabled) return;
  createGate(pi, config);
}
