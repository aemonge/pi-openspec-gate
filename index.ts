/**
 * pi-openspec-gate — ladder gate for Pi.
 *
 * Accounting only, never permission: another layer owns permission; this gate
 * owns declaredness. Every mutating tool call must be one of:
 *   exempt    — path-scoped, always recorded as a fact
 *   attributed — the openspec focus names an active change; receipt appended
 *   declared  — the human said "do it"; one visible debt line, then it proceeds
 *   blocked   — visible block, exact copy, with all three remedies
 *
 * Gate events are facts (pi.appendEntry); this extension never renders.
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
